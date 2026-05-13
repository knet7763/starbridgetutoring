import React, { useEffect, useRef, useCallback } from 'react';
import { Tldraw, createTLStore, getSnapshot, loadSnapshot, defaultShapeUtils } from 'tldraw';
import 'tldraw/tldraw.css';
import { supabase } from '../../lib/supabase';

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

    // Broadcast the current board state to all connected students
    const broadcast = useCallback(() => {
        if (!sessionId || !editorRef.current || readOnly) return;

        // Throttle: mark as broadcasting and only send if not currently throttled
        if (isBroadcasting.current) return;
        isBroadcasting.current = true;
        setTimeout(() => { isBroadcasting.current = false; }, 120); // ~8fps max

        const snapshot = getSnapshot(editorRef.current.store);
        supabase.channel(`whiteboard:${sessionId}`).send({
            type: 'broadcast',
            event: 'draw',
            payload: snapshot,
        });
    }, [sessionId, readOnly]);

    useEffect(() => {
        if (!sessionId) return;

        if (readOnly) {
            // Student: Subscribe to teacher's drawing broadcasts
            const channel = supabase
                .channel(`whiteboard:${sessionId}`)
                .on('broadcast', { event: 'draw' }, ({ payload }) => {
                    if (editorRef.current) {
                        try {
                            loadSnapshot(editorRef.current.store, payload);
                        } catch (e) { }
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
    }, [sessionId, readOnly]);

    const timeoutRef = useRef(null);

    const handleMount = useCallback((editor) => {
        editorRef.current = editor;

        // Load initial drawing data if provided
        if (initialSnapshot && Object.keys(initialSnapshot).length > 0) {
            try {
                loadSnapshot(editor.store, initialSnapshot);
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

        // Listen to editor changes
        if (!readOnly) {
            editor.store.listen(() => {
                if (sessionId) broadcast();
                if (onChange) {
                    clearTimeout(timeoutRef.current);
                    timeoutRef.current = setTimeout(() => {
                        onChange(getSnapshot(editor.store));
                    }, 500);
                }
            }, { scope: 'document', source: 'user' });
        }
    }, [readOnly, sessionId, broadcast, initialSnapshot, backgroundImage, onChange]);

    return (
        <div className={className} style={{ position: 'relative' }}>
            <Tldraw
                onMount={handleMount}
                inferDarkMode
                hideUi={readOnly}
            />
        </div>
    );
};

export default Board;
