import React, { useState, useEffect, useRef, useCallback } from 'react';
import 'tldraw/tldraw.css';
import { Sparkles, X } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { api } from '../../services/api';

const Board = ({
    readOnly = false,
    sessionId = null,   // If set, activates realtime sync
    initialSnapshot = null,
    backgroundImage = null, // New prop for background image
    onChange = null,
    className = "w-full h-full"
}) => {
    const editorRef = useRef(null);
    const isBroadcasting = useRef(false);
    const timeoutRef = useRef(null);

    // AI Analyzer state
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [analysisResult, setAnalysisResult] = useState('');
    const [showAIModal, setShowAIModal] = useState(false);
    const [TldrawComponent, setTldrawComponent] = useState(null);
    const [tldrawUtils, setTldrawUtils] = useState({ getSnapshot: null, loadSnapshot: null });

    useEffect(() => {
        let mounted = true;

        const loadTldraw = async () => {
            const tldraw = await import('tldraw');
            if (!mounted) return;
            setTldrawComponent(() => tldraw.Tldraw);
            setTldrawUtils({
                getSnapshot: tldraw.getSnapshot,
                loadSnapshot: tldraw.loadSnapshot,
            });
        };

        loadTldraw();

        return () => {
            mounted = false;
        };
    }, []);

    // Broadcast the current board state to all connected students
    const broadcast = useCallback(() => {
        if (!sessionId || !editorRef.current || readOnly || !tldrawUtils.getSnapshot) return;

        // Throttle: mark as broadcasting and only send if not currently throttled
        if (isBroadcasting.current) return;
        isBroadcasting.current = true;
        setTimeout(() => { isBroadcasting.current = false; }, 120); // ~8fps max

        const snapshot = tldrawUtils.getSnapshot(editorRef.current.store);
        supabase.channel(`whiteboard:${sessionId}`).send({
            type: 'broadcast',
            event: 'draw',
            payload: snapshot,
        });
    }, [sessionId, readOnly, tldrawUtils]);

    // Optimize persistence: synchronize current board snapshot on unmount (slide change or end session)
    useEffect(() => {
        return () => {
            clearTimeout(timeoutRef.current);
            if (!readOnly && editorRef.current && onChange && tldrawUtils.getSnapshot) {
                try {
                    const finalSnapshot = tldrawUtils.getSnapshot(editorRef.current.store);
                    onChange(finalSnapshot);
                } catch (e) {
                    console.warn("Synchronous unmount save failed:", e);
                }
            }
        };
    }, [readOnly, onChange, tldrawUtils]);

    useEffect(() => {
        if (!sessionId) return;

        if (readOnly) {
            // Student: Subscribe to teacher's drawing broadcasts
            const channel = supabase
                .channel(`whiteboard:${sessionId}`)
                .on('broadcast', { event: 'draw' }, ({ payload }) => {
                    if (editorRef.current && tldrawUtils.loadSnapshot) {
                        try {
                            tldrawUtils.loadSnapshot(editorRef.current.store, payload);
                        } catch (e) {
                            console.error('Failed to load broadcasted snapshot:', e);
                        }
                    }
                })
                .subscribe();

            return () => supabase.removeChannel(channel);
        } else {
            // Teacher: Subscribe the channel so it's open for broadcasting
            const channel = supabase
                .channel(`whiteboard:${sessionId}`)
                .subscribe();

            return () => supabase.removeChannel(channel);
        }
    }, [sessionId, readOnly, tldrawUtils]);

    const handleMount = useCallback((editor) => {
        editorRef.current = editor;

        // Load initial drawing data if provided
        if (initialSnapshot && Object.keys(initialSnapshot).length > 0 && tldrawUtils.loadSnapshot) {
            try {
                tldrawUtils.loadSnapshot(editor.store, initialSnapshot);
            } catch (e) {
                console.error('Failed to load initial snapshot:', e);
            }
        }

        // Add background image if provided and not already there
        if (backgroundImage && !readOnly) {
            const shapes = editor.getCurrentPageShapes();
            const hasBackground = shapes.some(s => s.type === 'image' && s.props.src === backgroundImage);
            
            if (!hasBackground) {
                editor.createShapes([
                    {
                        type: 'image',
                        x: 0,
                        y: 0,
                        props: {
                            src: backgroundImage,
                            w: 800,
                            h: 600,
                        },
                        isLocked: true,
                    },
                ]);
            }
        }

        // Listen to editor changes (Throttled real-time broadcast + Optimized 8-second database auto-save)
        if (!readOnly) {
            editor.store.listen(() => {
                if (sessionId) broadcast();
                if (onChange && tldrawUtils.getSnapshot) {
                    clearTimeout(timeoutRef.current);
                    timeoutRef.current = setTimeout(() => {
                        onChange(tldrawUtils.getSnapshot(editor.store));
                    }, 8000); // 8-second optimized background write cycle
                }
            }, { scope: 'document', source: 'user' });
        }
    }, [readOnly, sessionId, broadcast, initialSnapshot, backgroundImage, onChange]);

    // AI Analysis handler
    const handleAIAnalyze = async () => {
        if (!editorRef.current) return;
        setIsAnalyzing(true);
        setShowAIModal(true);
        try {
            const shapes = editorRef.current.getCurrentPageShapes();
            
            // Map shapes into text annotations or geometries
            const annotatedElements = shapes.map(s => {
                if (s.type === 'text') return `Text: "${s.props.text || ''}"`;
                if (s.type === 'geo') return `Shape: [${s.props.geo || 'geometry'}] text: "${s.props.text || ''}"`;
                if (s.type === 'draw') return `Handdrawn sketch stroke`;
                if (s.type === 'image') return `Background Slide template`;
                return `${s.type} shape`;
            });
            
            const shapeDataSummary = annotatedElements.length > 0 
                ? annotatedElements.slice(0, 10).join(', ') + (annotatedElements.length > 10 ? '... (truncated)' : '')
                : 'No active annotations made on this slide yet.';

            const { data } = await api.ai.analyzeBoard(backgroundImage ? 'Lesson Slide Template' : 'Blank Classroom Canvas', shapeDataSummary);
            setAnalysisResult(data.analysis);
        } catch (e) {
            console.error("AI analysis call failed:", e);
            setAnalysisResult("### ❌ AI Integration Offline\n\nThe AI analysis module was unable to process the board contents. Please check Deno edge service deployments.");
        } finally {
            setIsAnalyzing(false);
        }
    };

    return (
        <div className={className} style={{ position: 'relative' }}>
            {!TldrawComponent ? (
                <div className="flex items-center justify-center h-full text-gray-500 bg-white/80 rounded-2xl">
                    <div className="text-center">
                        <div className="animate-spin rounded-full h-14 w-14 border-b-4 border-yellow-400 mb-4" />
                        <p className="text-sm font-semibold">Loading whiteboard editor...</p>
                    </div>
                </div>
            ) : (
                <TldrawComponent
                    onMount={handleMount}
                    inferDarkMode
                    hideUi={readOnly}
                />
            )}

            {/* Glowing floating AI Analyzer trigger */}
            {!readOnly && editorRef.current && (
                <div style={{ position: 'absolute', right: '16px', top: '16px', zIndex: 1000 }} className="flex gap-2">
                    <button
                        onClick={handleAIAnalyze}
                        disabled={isAnalyzing}
                        className="flex items-center gap-2 bg-gradient-to-r from-yellow-400 to-amber-500 hover:from-yellow-500 hover:to-amber-600 text-gray-900 font-bold px-4 py-2.5 rounded-xl shadow-lg border border-yellow-300 hover:scale-105 active:scale-95 transition-all disabled:opacity-50"
                        style={{ borderBottom: '3px solid #B45309' }}
                    >
                        <Sparkles size={16} className={isAnalyzing ? "animate-spin" : "animate-pulse"} />
                        {isAnalyzing ? "Analyzing Canvas..." : "AI Analyze Board"}
                    </button>
                </div>
            )}

            {/* Gorgeous Glassmorphic AI Feedback Panel */}
            {showAIModal && (
                <div 
                    style={{ position: 'absolute', right: '16px', top: '75px', bottom: '16px', width: '380px', zIndex: 1000 }} 
                    className="bg-gray-900/95 backdrop-blur-xl border border-gray-800 text-white rounded-2xl shadow-2xl p-6 flex flex-col overflow-hidden animate-in slide-in-from-right duration-200"
                >
                    <div className="flex justify-between items-center border-b border-gray-800 pb-4 mb-4">
                        <div className="flex items-center gap-2">
                            <div className="w-2.5 h-2.5 bg-yellow-400 rounded-full animate-ping"></div>
                            <h3 className="font-black text-yellow-400 text-sm uppercase tracking-wider">AI tutor insights</h3>
                        </div>
                        <button 
                            onClick={() => setShowAIModal(false)}
                            className="p-1.5 hover:bg-gray-800 rounded-full text-gray-400 hover:text-white transition-colors"
                        >
                            <X size={18} />
                        </button>
                    </div>
                    
                    <div className="flex-1 overflow-y-auto space-y-4 pr-1 text-sm leading-relaxed text-gray-300 scrollbar-thin scrollbar-thumb-gray-800 text-left">
                        {isAnalyzing ? (
                            <div className="h-full flex flex-col items-center justify-center py-20 text-center space-y-4">
                                <div className="w-12 h-12 border-4 border-yellow-400 border-t-transparent rounded-full animate-spin"></div>
                                <p className="text-xs text-gray-400 font-bold uppercase tracking-widest animate-pulse">
                                    Parsing board coordinates...
                                </p>
                            </div>
                        ) : (
                            <div className="prose prose-invert max-w-none">
                                {analysisResult.split('\n').map((line, idx) => {
                                    if (line.startsWith('###')) {
                                        return <h4 key={idx} className="text-yellow-400 font-black text-sm uppercase tracking-wider mt-4 mb-2">{line.replace('###', '').trim()}</h4>;
                                    }
                                    if (line.startsWith('####')) {
                                        return <h5 key={idx} className="text-white font-black text-xs uppercase tracking-widest mt-3 mb-1">{line.replace('####', '').trim()}</h5>;
                                    }
                                    if (line.startsWith('*')) {
                                        return <p key={idx} className="pl-3 border-l-2 border-yellow-400/40 py-0.5 text-gray-300 italic my-1">{line.replace('*', '').trim()}</p>;
                                    }
                                    return <p key={idx} className="my-1.5">{line}</p>;
                                })}
                            </div>
                        )}
                    </div>
                    
                    <div className="border-t border-gray-800 pt-4 mt-4 flex justify-between items-center">
                        <span className="text-[10px] text-gray-500 font-black uppercase tracking-widest">Powered by StarBridge AI</span>
                        <button
                            onClick={() => setShowAIModal(false)}
                            className="bg-yellow-400 hover:bg-yellow-500 text-gray-900 font-black text-xs uppercase px-4 py-2 rounded-xl transition-all shadow-md active:scale-95"
                        >
                            Got It
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Board;
