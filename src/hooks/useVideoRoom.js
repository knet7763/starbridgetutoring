import { useState, useCallback, useEffect } from 'react';
import DailyIframe from '@daily-co/daily-js';
import { supabase } from '../lib/supabase';

// In a real production app, Room creation MUST happen on a secure backend.
// Exposing the Daily API key to the client is a severe security risk.
// For the MVP, we will assume a room URL is created and stored in Supabase,
// or we will use a hardcoded room if a backend isn't available yet.

export function useVideoRoom(sessionId) {
    const [callObject, setCallObject] = useState(null);
    const [isJoined, setIsJoined] = useState(false);
    const [error, setError] = useState(null);
    const [isScreenSharing, setIsScreenSharing] = useState(false);

    const joinRoom = useCallback(async (roomUrl, participantName) => {
        try {
            if (callObject) {
                await callObject.leave();
                callObject.destroy();
            }

            const newCallObject = DailyIframe.createCallObject({
                videoSource: true,
                audioSource: true,
                dailyConfig: {
                    experimentalGeckoNetworkLogging: true,
                },
            });

            setCallObject(newCallObject);

            newCallObject.on('joined-meeting', () => setIsJoined(true));
            newCallObject.on('left-meeting', () => setIsJoined(false));
            newCallObject.on('error', (e) => {
                console.error("Daily error:", e);
                setError(e.errorMsg);
            });

            await newCallObject.join({ url: roomUrl, userName: participantName });
        } catch (err) {
            console.error("Failed to join room", err);
            setError(err.message);
        }
    }, [callObject]);

    const leaveRoom = useCallback(async () => {
        if (!callObject) return;
        await callObject.leave();
        callObject.destroy();
        setCallObject(null);
        setIsJoined(false);
    }, [callObject]);

    const toggleVideo = useCallback(() => {
        if (!callObject) return;
        const localVideo = callObject.localVideo();
        callObject.setLocalVideo(!localVideo);
    }, [callObject]);

    const toggleAudio = useCallback(() => {
        if (!callObject) return;
        const localAudio = callObject.localAudio();
        callObject.setLocalAudio(!localAudio);
    }, [callObject]);

    const toggleScreenShare = useCallback(async () => {
        if (!callObject) return;

        try {
            if (isScreenSharing) {
                await callObject.stopScreenShare();
                setIsScreenSharing(false);
            } else {
                await callObject.startScreenShare();
                setIsScreenSharing(true);
            }
        } catch (err) {
            console.error("Failed to toggle screenshare:", err);
            // Revert state if the user cancels the picker
            setIsScreenSharing(false);
        }
    }, [callObject, isScreenSharing]);

    // Listen for screen share stops from the browser UI (e.g. clicking "Stop sharing" on the browser banner)
    useEffect(() => {
        if (!callObject) return;

        const handleScreenShareStopped = () => {
            setIsScreenSharing(false);
        };

        callObject.on('local-screen-share-stopped', handleScreenShareStopped);

        return () => {
            callObject.off('local-screen-share-stopped', handleScreenShareStopped);
        };
    }, [callObject]);

    return {
        callObject,
        isJoined,
        error,
        joinRoom,
        leaveRoom,
        toggleVideo,
        toggleAudio,
        toggleScreenShare,
        isScreenSharing
    };
}
