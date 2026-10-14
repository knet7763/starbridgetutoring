import { useEffect, useState, useRef, useCallback } from 'react';
import { supabase } from '../lib/supabase';

/**
 * useRealtimeClassroom - A React hook to synchronize lesson state between teacher and students
 * @param {string} classId - The unique ID of the live lesson/class being broadcast
 * @param {function} onSlideChange - Callback triggered when the teacher changes the slide
 * @param {function} onInteraction - Callback triggered for new quizzes, polls, or shout updates
 */
export function useRealtimeClassroom(classId, onSlideChange, onInteraction) {
    const [isConnected, setIsConnected] = useState(false);
    const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
    const channelRef = useRef(null);

    useEffect(() => {
        if (!classId) return;

        // Subscribe to changes in the lessons table to sync current_slide_index
        const channel = supabase
            .channel(`public:lessons:${classId}`)
            .on(
                'postgres_changes',
                {
                    event: 'UPDATE',
                    schema: 'public',
                    table: 'lessons',
                    filter: `id=eq.${classId}`
                },
                (payload) => {
                    if (payload.new.current_slide_index !== undefined) {
                        setCurrentSlideIndex(payload.new.current_slide_index);
                        if (onSlideChange) onSlideChange(payload.new.current_slide_index);
                    }
                }
            )
            // Example of a custom broadcast event (e.g., throwing confetti, fast interactions not in DB)
            .on(
                'broadcast',
                { event: 'interaction' },
                (payload) => {
                    if (onInteraction) onInteraction(payload.payload);
                }
            )
            .subscribe((status) => {
                if (status === 'SUBSCRIBED') {
                    setIsConnected(true);
                }
                if (status === 'CLOSED' || status === 'CHANNEL_ERROR') {
                    setIsConnected(false);
                }
            });

        channelRef.current = channel;

        return () => {
            channelRef.current = null;
            supabase.removeChannel(channel);
        };
    }, [classId, onSlideChange, onInteraction]);

    // Function for teachers to update the slide index in the DB
    const updateSlide = useCallback(async (newIndex) => {
        if (!classId) return;
        const { error } = await supabase
            .from('lessons')
            .update({ current_slide_index: newIndex })
            .eq('id', classId);

        if (error) console.error("Error updating slide:", error);
    }, [classId]);

    // Function for teachers to send transient broadcast interactions to all students
    const sendInteraction = useCallback(async (payload) => {
        if (!channelRef.current) return;
        try {
            await channelRef.current.send({
                type: 'broadcast',
                event: 'interaction',
                payload: payload
            });
        } catch (err) {
            console.error("Error broadcasting interaction:", err);
        }
    }, []);

    return {
        isConnected,
        currentSlideIndex,
        updateSlide,
        sendInteraction
    };
}
