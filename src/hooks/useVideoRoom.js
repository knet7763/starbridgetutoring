import { useState, useCallback, useEffect, useRef } from 'react';
import DailyIframe from '@daily-co/daily-js';

/**
 * useVideoRoom
 * Manages a Daily.co call object for 1-on-1 sessions.
 * Uses a ref to hold the callObject so that joinRoom/leaveRoom callbacks
 * remain stable and don't cause infinite re-render loops.
 */
export function useVideoRoom() {
    // callObjectRef holds the live instance (stable, no re-renders on change)
    const callObjectRef = useRef(null);
    // callObject state is only used to expose it to <DailyProvider>
    const [callObject, setCallObject] = useState(null);
    const [isJoined, setIsJoined] = useState(false);
    const [isConnecting, setIsConnecting] = useState(false);
    const [error, setError] = useState(null);
    const [isScreenSharing, setIsScreenSharing] = useState(false);

    const joinRoom = useCallback(async (roomUrl, participantName) => {
        // Guard: don't join twice
        if (callObjectRef.current) return;

        setIsConnecting(true);
        setError(null);

        try {
            const newCallObject = DailyIframe.createCallObject({
                videoSource: true,
                audioSource: true,
                dailyConfig: {
                    experimentalGeckoNetworkLogging: true,
                },
            });

            // Store in ref immediately (stable reference)
            callObjectRef.current = newCallObject;
            // Also push to state so DailyProvider re-renders
            setCallObject(newCallObject);

            newCallObject.on('joining-meeting', () => setIsConnecting(true));
            newCallObject.on('joined-meeting', () => {
                setIsJoined(true);
                setIsConnecting(false);
            });
            newCallObject.on('left-meeting', () => {
                setIsJoined(false);
                setIsConnecting(false);
            });
            newCallObject.on('error', (e) => {
                console.error('Daily error:', e);
                setError(e.errorMsg || 'An error occurred in the video call.');
                setIsConnecting(false);
            });

            await newCallObject.join({ url: roomUrl, userName: participantName });
        } catch (err) {
            console.error('Failed to join room:', err);
            setError(err.message || 'Failed to join the video room.');
            setIsConnecting(false);
            callObjectRef.current = null;
        }
    }, []); // No dependencies — stable forever

    const leaveRoom = useCallback(async () => {
        const co = callObjectRef.current;
        if (!co) return;
        try {
            await co.leave();
            co.destroy();
        } catch (_) {
            // ignore errors on leave
        }
        callObjectRef.current = null;
        setCallObject(null);
        setIsJoined(false);
        setIsConnecting(false);
        setIsScreenSharing(false);
    }, []);

    const toggleVideo = useCallback(() => {
        const co = callObjectRef.current;
        if (!co) return;
        co.setLocalVideo(!co.localVideo());
    }, []);

    const toggleAudio = useCallback(() => {
        const co = callObjectRef.current;
        if (!co) return;
        co.setLocalAudio(!co.localAudio());
    }, []);

    const toggleScreenShare = useCallback(async () => {
        const co = callObjectRef.current;
        if (!co) return;
        try {
            if (isScreenSharing) {
                await co.stopScreenShare();
                setIsScreenSharing(false);
            } else {
                await co.startScreenShare();
                setIsScreenSharing(true);
            }
        } catch (err) {
            console.error('Failed to toggle screenshare:', err);
            setIsScreenSharing(false);
        }
    }, [isScreenSharing]);

    // Listen for browser-initiated screen-share stop (e.g. clicking "Stop sharing" banner)
    useEffect(() => {
        const co = callObjectRef.current;
        if (!co) return;

        const handleScreenShareStopped = () => setIsScreenSharing(false);
        co.on('local-screen-share-stopped', handleScreenShareStopped);

        return () => {
            co.off('local-screen-share-stopped', handleScreenShareStopped);
        };
    }, [callObject]); // Re-subscribe when callObject changes

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            const co = callObjectRef.current;
            if (co) {
                co.leave().catch(() => {}).finally(() => {
                    co.destroy();
                    callObjectRef.current = null;
                });
            }
        };
    }, []);

    return {
        callObject,
        isJoined,
        isConnecting,
        error,
        joinRoom,
        leaveRoom,
        toggleVideo,
        toggleAudio,
        toggleScreenShare,
        isScreenSharing,
    };
}
