import React, { useState, useEffect, useRef, useCallback } from 'react';
import 'tldraw/tldraw.css';
import { Sparkles, X, Trash2, RefreshCw, AlertTriangle } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { api } from '../../services/api';

// Local error boundary so an internal tldraw/WebGL hiccup never crashes the entire classroom
class BoardErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, errorMsg: '' };
    }

    static getDerivedStateFromError(error) {
        return { hasError: true, errorMsg: error?.message || 'Whiteboard rendering error' };
    }

    componentDidCatch(error, info) {
        console.error('[BoardErrorBoundary] Caught whiteboard error:', error, info);
    }

    render() {
        if (this.state.hasError) {
            return (
                <div className="w-full h-full flex flex-col items-center justify-center bg-gray-50 p-6 text-center rounded-xl border border-gray-200">
                    <AlertTriangle className="h-10 w-10 text-amber-500 mb-3" />
                    <h3 className="text-base font-bold text-gray-900 mb-1">Whiteboard Needs a Quick Reload</h3>
                    <p className="text-xs text-gray-500 mb-4 max-w-sm">
                        {this.state.errorMsg}
                    </p>
                    <button
                        type="button"
                        onClick={() => {
                            this.setState({ hasError: false, errorMsg: '' });
                            if (this.props.onReset) this.props.onReset();
                        }}
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary hover:bg-yellow-500 text-gray-950 font-bold text-xs shadow"
                    >
                        <RefreshCw size={14} />
                        Reload Whiteboard
                    </button>
                </div>
            );
        }
        return this.props.children;
    }
}

const Board = ({
    readOnly = false,
    sessionId = null,       // If set, activates real-time 2-way incremental sync
    initialSnapshot = null,
    backgroundImage = null,
    onChange = null,
    className = 'w-full h-full',
}) => {
    const editorRef = useRef(null);
    const channelRef = useRef(null);
    const clientIdRef = useRef(
        typeof crypto !== 'undefined' && crypto.randomUUID
            ? crypto.randomUUID()
            : `client-${Math.random().toString(36).slice(2)}`
    );

    // Refs to keep callbacks stable and avoid tearing down tldraw on prop changes
    const readOnlyRef = useRef(readOnly);
    const onChangeRef = useRef(onChange);
    const saveTimeoutRef = useRef(null);
    const broadcastTimeoutRef = useRef(null);
    const pendingPutRef = useRef(new Map());
    const pendingRemoveRef = useRef(new Set());
    const unlistenRef = useRef(null);
    const initialSnapshotRef = useRef(initialSnapshot);
    const backgroundImageRef = useRef(backgroundImage);

    const [isEditorReady, setIsEditorReady] = useState(false);
    const [boardInstanceKey, setBoardInstanceKey] = useState(0);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [analysisResult, setAnalysisResult] = useState('');
    const [showAIModal, setShowAIModal] = useState(false);
    const [TldrawComponent, setTldrawComponent] = useState(null);
    const tldrawUtilsRef = useRef({ getSnapshot: null, loadSnapshot: null, AssetRecordType: null });

    useEffect(() => {
        readOnlyRef.current = readOnly;
        // Dynamically toggle tldraw's read-only state without unmounting or losing strokes
        if (editorRef.current) {
            try {
                editorRef.current.updateInstanceState({ isReadonly: readOnly });
            } catch (e) {
                console.warn('[Board] Could not update readonly state:', e);
            }
        }
    }, [readOnly]);

    useEffect(() => {
        onChangeRef.current = onChange;
    }, [onChange]);

    // Lazy-load tldraw once
    useEffect(() => {
        let mounted = true;
        const loadTldraw = async () => {
            try {
                const tldraw = await import('tldraw');
                if (!mounted) return;
                tldrawUtilsRef.current = {
                    getSnapshot: tldraw.getSnapshot,
                    loadSnapshot: tldraw.loadSnapshot,
                    AssetRecordType: tldraw.AssetRecordType,
                };
                setTldrawComponent(() => tldraw.Tldraw);
            } catch (err) {
                console.error('[Board] Failed to load tldraw:', err);
            }
        };
        loadTldraw();
        return () => {
            mounted = false;
        };
    }, []);

    // Flush batched incremental changes (added/updated/removed) over Supabase Realtime Broadcast
    const flushPendingBroadcast = useCallback(() => {
        broadcastTimeoutRef.current = null;
        if (!channelRef.current || readOnlyRef.current) {
            pendingPutRef.current.clear();
            pendingRemoveRef.current.clear();
            return;
        }

        const putRecords = Array.from(pendingPutRef.current.values());
        const removeIds = Array.from(pendingRemoveRef.current.values());
        pendingPutRef.current.clear();
        pendingRemoveRef.current.clear();

        if (putRecords.length === 0 && removeIds.length === 0) return;

        channelRef.current.send({
            type: 'broadcast',
            event: 'board_diff',
            payload: {
                senderId: clientIdRef.current,
                put: putRecords,
                remove: removeIds,
            },
        }).catch((err) => console.warn('[Board] Diff broadcast warning:', err));
    }, []);

    // Broadcast a full snapshot (used for late-joining students or Clear Board)
    const broadcastFullSnapshot = useCallback(() => {
        const editor = editorRef.current;
        const { getSnapshot } = tldrawUtilsRef.current;
        if (!channelRef.current || !editor || !getSnapshot) return;
        try {
            const snapshot = getSnapshot(editor.store);
            channelRef.current.send({
                type: 'broadcast',
                event: 'board_full',
                payload: {
                    senderId: clientIdRef.current,
                    document: snapshot.document,
                },
            }).catch((err) => console.warn('[Board] Full sync broadcast warning:', err));
        } catch (err) {
            console.warn('[Board] Failed to create full snapshot:', err);
        }
    }, []);

    // Save final snapshot cleanly on unmount
    useEffect(() => {
        return () => {
            if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
            if (broadcastTimeoutRef.current) clearTimeout(broadcastTimeoutRef.current);
            if (unlistenRef.current) {
                try { unlistenRef.current(); } catch { /* ignore */ }
                unlistenRef.current = null;
            }
            const { getSnapshot } = tldrawUtilsRef.current;
            if (!readOnlyRef.current && editorRef.current && onChangeRef.current && getSnapshot) {
                try {
                    const finalSnapshot = getSnapshot(editorRef.current.store);
                    onChangeRef.current(finalSnapshot);
                } catch (e) {
                    console.warn('[Board] Unmount save skipped:', e);
                }
            }
        };
    }, []);

    // True 2-way Realtime channel: EVERY participant both listens and broadcasts (when not readOnly)
    useEffect(() => {
        if (!sessionId) return;

        const channel = supabase
            .channel(`whiteboard:${sessionId}`, {
                config: { broadcast: { self: false } },
            })
            .on('broadcast', { event: 'board_diff' }, ({ payload }) => {
                if (!payload || payload.senderId === clientIdRef.current) return;
                const editor = editorRef.current;
                if (!editor) return;
                try {
                    editor.store.mergeRemoteChanges(() => {
                        if (Array.isArray(payload.put) && payload.put.length > 0) {
                            editor.store.put(payload.put);
                        }
                        if (Array.isArray(payload.remove) && payload.remove.length > 0) {
                            editor.store.remove(payload.remove);
                        }
                    });
                } catch (e) {
                    console.warn('[Board] Failed to merge remote diff:', e);
                }
            })
            .on('broadcast', { event: 'board_full' }, ({ payload }) => {
                if (!payload || payload.senderId === clientIdRef.current) return;
                const editor = editorRef.current;
                const { loadSnapshot } = tldrawUtilsRef.current;
                if (!editor || !payload.document || !loadSnapshot) return;
                try {
                    // Preserve camera so student's viewport does not jump
                    const prevCamera = editor.getCamera();
                    editor.store.mergeRemoteChanges(() => {
                        loadSnapshot(editor.store, { document: payload.document });
                    });
                    if (prevCamera) {
                        editor.setCamera(prevCamera);
                    }
                } catch (e) {
                    console.warn('[Board] Failed to apply full sync:', e);
                }
            })
            .on('broadcast', { event: 'board_request_sync' }, ({ payload }) => {
                if (!payload || payload.senderId === clientIdRef.current) return;
                // Only editable host responds to late-join sync requests
                if (!readOnlyRef.current && editorRef.current) {
                    broadcastFullSnapshot();
                }
            })
            .subscribe((status) => {
                if (status === 'SUBSCRIBED' && readOnlyRef.current) {
                    // Student joined late — request current board state from host
                    channel.send({
                        type: 'broadcast',
                        event: 'board_request_sync',
                        payload: { senderId: clientIdRef.current },
                    }).catch(() => {});
                }
            });

        channelRef.current = channel;

        return () => {
            channelRef.current = null;
            supabase.removeChannel(channel);
        };
    }, [sessionId, broadcastFullSnapshot]);

    const handleMount = useCallback((editor) => {
        editorRef.current = editor;
        setIsEditorReady(true);

        // Apply initial readonly state immediately
        try {
            editor.updateInstanceState({ isReadonly: readOnlyRef.current });
        } catch (e) {
            console.warn('[Board] Initial readonly setup warning:', e);
        }

        // Load initial drawing snapshot safely (supports both full snapshot and { document } format)
        const snap = initialSnapshotRef.current;
        const { loadSnapshot, getSnapshot, AssetRecordType } = tldrawUtilsRef.current;
        if (snap && typeof snap === 'object' && Object.keys(snap).length > 0 && loadSnapshot) {
            try {
                if (snap.document || snap.store) {
                    loadSnapshot(editor.store, snap);
                }
            } catch (e) {
                console.warn('[Board] Skipped incompatible initial snapshot:', e);
            }
        }

        // Properly register background image as a tldraw v4 asset before creating the shape
        const bgUrl = backgroundImageRef.current;
        if (bgUrl && !readOnlyRef.current && AssetRecordType) {
            try {
                const existingAssets = editor.getAssets();
                const alreadyLoaded = existingAssets.some((a) => a.type === 'image' && a.props?.src === bgUrl);
                if (!alreadyLoaded) {
                    const assetId = AssetRecordType.createId();
                    editor.createAssets([
                        {
                            id: assetId,
                            type: 'image',
                            typeName: 'asset',
                            props: {
                                name: 'slide-background',
                                src: bgUrl,
                                w: 800,
                                h: 600,
                                mimeType: 'image/png',
                                isAnimated: false,
                            },
                            meta: {},
                        },
                    ]);
                    editor.createShapes([
                        {
                            type: 'image',
                            x: 0,
                            y: 0,
                            isLocked: true,
                            props: {
                                assetId,
                                w: 800,
                                h: 600,
                            },
                        },
                    ]);
                    editor.zoomToFit({ animation: { duration: 0 } });
                }
            } catch (e) {
                console.warn('[Board] Could not attach background image asset:', e);
            }
        }

        // Clean up any previous listener before attaching a fresh one
        if (unlistenRef.current) {
            try { unlistenRef.current(); } catch { /* ignore */ }
        }

        // Listen to user-originated document changes only (remote changes are ignored automatically)
        unlistenRef.current = editor.store.listen(
            (entry) => {
                if (readOnlyRef.current) return;

                if (sessionId && entry?.changes) {
                    const { added, updated, removed } = entry.changes;
                    if (added) {
                        Object.values(added).forEach((rec) => {
                            pendingRemoveRef.current.delete(rec.id);
                            pendingPutRef.current.set(rec.id, rec);
                        });
                    }
                    if (updated) {
                        Object.values(updated).forEach(([, toRec]) => {
                            pendingRemoveRef.current.delete(toRec.id);
                            pendingPutRef.current.set(toRec.id, toRec);
                        });
                    }
                    if (removed) {
                        Object.values(removed).forEach((rec) => {
                            pendingPutRef.current.delete(rec.id);
                            pendingRemoveRef.current.add(rec.id);
                        });
                    }

                    if (!broadcastTimeoutRef.current) {
                        broadcastTimeoutRef.current = setTimeout(flushPendingBroadcast, 60);
                    }
                }

                // Debounced persistence save to DB
                if (onChangeRef.current && getSnapshot) {
                    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
                    saveTimeoutRef.current = setTimeout(() => {
                        try {
                            onChangeRef.current(getSnapshot(editor.store));
                        } catch (e) {
                            console.warn('[Board] Background auto-save warning:', e);
                        }
                    }, 3000);
                }
            },
            { scope: 'document', source: 'user' }
        );
    }, [sessionId, flushPendingBroadcast]);

    const handleClearBoard = () => {
        const editor = editorRef.current;
        if (!editor || readOnly) return;
        const deletableIds = editor
            .getCurrentPageShapes()
            .filter((s) => !s.isLocked)
            .map((s) => s.id);
        if (deletableIds.length === 0) return;
        editor.deleteShapes(deletableIds);
        if (sessionId) {
            setTimeout(() => broadcastFullSnapshot(), 80);
        }
    };

    const handleAIAnalyze = async () => {
        if (!editorRef.current) return;
        setIsAnalyzing(true);
        setShowAIModal(true);
        try {
            const shapes = editorRef.current.getCurrentPageShapes();
            const annotatedElements = shapes.map((s) => {
                if (s.type === 'text') return `Text: "${s.props?.text || ''}"`;
                if (s.type === 'geo') return `Shape: [${s.props?.geo || 'geometry'}] text: "${s.props?.text || ''}"`;
                if (s.type === 'draw') return `Handdrawn sketch stroke`;
                if (s.type === 'image') return `Background Slide template`;
                return `${s.type} shape`;
            });

            const shapeDataSummary =
                annotatedElements.length > 0
                    ? annotatedElements.slice(0, 10).join(', ') + (annotatedElements.length > 10 ? '... (truncated)' : '')
                    : 'No active annotations made on this slide yet.';

            const { data } = await api.ai.analyzeBoard(
                backgroundImage ? 'Lesson Slide Template' : 'Blank Classroom Canvas',
                shapeDataSummary
            );
            setAnalysisResult(data.analysis);
        } catch (e) {
            console.error('[Board] AI analysis call failed:', e);
            setAnalysisResult(
                '### ❌ AI Integration Offline\n\nThe AI analysis module was unable to process the board contents right now.'
            );
        } finally {
            setIsAnalyzing(false);
        }
    };

    return (
        <div
            className={`${className} overflow-hidden`}
            style={{ position: 'relative', minHeight: '320px', touchAction: 'none' }}
        >
            <BoardErrorBoundary onReset={() => setBoardInstanceKey((k) => k + 1)}>
                {!TldrawComponent ? (
                    <div className="flex items-center justify-center h-full text-gray-500 bg-white/80 rounded-2xl">
                        <div className="text-center">
                            <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-yellow-400 mx-auto mb-3" />
                            <p className="text-sm font-semibold">Loading whiteboard...</p>
                        </div>
                    </div>
                ) : (
                    <TldrawComponent
                        key={boardInstanceKey}
                        onMount={handleMount}
                        hideUi={readOnly}
                        {...(import.meta.env.VITE_TLDRAW_LICENSE_KEY
                            ? { licenseKey: import.meta.env.VITE_TLDRAW_LICENSE_KEY }
                            : {})}
                    />
                )}
            </BoardErrorBoundary>

            {/* Floating Host Controls (Clear Board + AI Analyze) */}
            {!readOnly && isEditorReady && (
                <div style={{ position: 'absolute', right: '16px', top: '14px', zIndex: 400 }} className="flex gap-2">
                    <button
                        type="button"
                        onClick={handleClearBoard}
                        title="Clear all drawings on this board"
                        className="flex items-center gap-1.5 bg-white/95 hover:bg-red-50 text-gray-700 hover:text-red-600 font-bold px-3 py-2 rounded-xl shadow border border-gray-200 text-xs transition-all"
                    >
                        <Trash2 size={14} />
                        Clear
                    </button>
                    <button
                        type="button"
                        onClick={handleAIAnalyze}
                        disabled={isAnalyzing}
                        className="flex items-center gap-1.5 bg-gradient-to-r from-yellow-400 to-amber-500 hover:from-yellow-500 hover:to-amber-600 text-gray-900 font-bold px-3.5 py-2 rounded-xl shadow-md border border-yellow-300 text-xs transition-all disabled:opacity-50"
                        style={{ borderBottom: '2px solid #B45309' }}
                    >
                        <Sparkles size={14} className={isAnalyzing ? 'animate-spin' : ''} />
                        {isAnalyzing ? 'Analyzing...' : 'AI Analyze'}
                    </button>
                </div>
            )}

            {/* AI Feedback Panel */}
            {showAIModal && (
                <div
                    style={{ position: 'absolute', right: '16px', top: '64px', bottom: '16px', width: '360px', maxWidth: 'calc(100% - 32px)', zIndex: 450 }}
                    className="bg-gray-900/95 backdrop-blur-xl border border-gray-800 text-white rounded-2xl shadow-2xl p-6 flex flex-col overflow-hidden"
                >
                    <div className="flex justify-between items-center border-b border-gray-800 pb-4 mb-4">
                        <div className="flex items-center gap-2">
                            <div className="w-2.5 h-2.5 bg-yellow-400 rounded-full animate-ping"></div>
                            <h3 className="font-black text-yellow-400 text-sm uppercase tracking-wider">AI Tutor Insights</h3>
                        </div>
                        <button
                            type="button"
                            onClick={() => setShowAIModal(false)}
                            className="p-1.5 hover:bg-gray-800 rounded-full text-gray-400 hover:text-white transition-colors"
                        >
                            <X size={18} />
                        </button>
                    </div>

                    <div className="flex-1 overflow-y-auto space-y-4 pr-1 text-sm leading-relaxed text-gray-300 text-left">
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
                            type="button"
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
