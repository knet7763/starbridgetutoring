import { useState, useCallback, useEffect, useRef } from 'react';
import { Room } from 'livekit-client';

/**
 * useVideoRoom
 * Manages a LiveKit room connection for 1-on-1 sessions and group classes
 * Handles connection lifecycle, local media controls, and screen sharing
 */
export function useVideoRoom() {
    const roomRef = useRef(null);
    const timeoutRef = useRef(null);
    const connectingRef = useRef(false);
    const lastJoinArgsRef = useRef(null);
    const localTracksRef = useRef({ audio: true, video: true });
    const screenShareRef = useRef(false);

    const [room, setRoom] = useState(null);
    const [isJoined, setIsJoined] = useState(false);
    const [isConnecting, setIsConnecting] = useState(false);
    const [error, setError] = useState(null);
    const [isScreenSharing, setIsScreenSharing] = useState(false);
    const [participants, setParticipants] = useState([]);
    const [trackVersion, setTrackVersion] = useState(0);
    const [localTracks, setLocalTracks] = useState({ audio: true, video: true });
    const [isFallback, setIsFallback] = useState(false);

    const getRemoteParticipantsList = (r) => {
        if (!r) return [];
        const pMap = r.remoteParticipants || r.participants;
        return pMap ? Array.from(pMap.values()) : [];
    };

    const joinRoom = useCallback(async (liveKitUrl, token, roomName, participantName) => {
        // Guard: don't join twice if already connected or actively connecting
        if (roomRef.current || connectingRef.current) {
            return;
        }

        lastJoinArgsRef.current = { liveKitUrl, token, roomName, participantName };
        connectingRef.current = true;
        setIsConnecting(true);
        setError(null);
        setIsFallback(false);

        // Start signaling connection timeout (10 seconds)
        if (timeoutRef.current) clearTimeout(timeoutRef.current);
        timeoutRef.current = setTimeout(() => {
            if (!roomRef.current || roomRef.current.state !== 'connected') {
                console.warn('[LiveKit] Signaling connection timeout. Activating Jitsi fallback.');
                const pendingRoom = roomRef.current;
                roomRef.current = null;
                connectingRef.current = false;
                if (pendingRoom) {
                    try { pendingRoom.disconnect(); } catch { /* ignore */ }
                }
                setRoom(null);
                setIsJoined(false);
                setIsFallback(true);
                setIsConnecting(false);
                setError('LiveKit connection timed out. Switched to backup video server.');
            }
        }, 10000);

        try {
            if (!liveKitUrl || !token || !roomName) {
                throw new Error('Missing required parameters: liveKitUrl, token, roomName');
            }

            // Create and configure LiveKit room with VP8 + adaptiveStream for fast, stable WebRTC
            const newRoom = new Room({
                autoConnect: false,
                autoSubscribe: true,
                adaptiveStream: true,
                dynacast: true,
                publishDefaults: {
                    codec: 'vp8',
                    simulcast: true,
                    screenShareEncoding: {
                        maxBitrate: 500000,
                        maxFramerate: 15,
                    },
                },
            });

            roomRef.current = newRoom;
            setRoom(newRoom);

            const syncRoomState = () => {
                if (roomRef.current) {
                    setParticipants(getRemoteParticipantsList(roomRef.current));
                    setTrackVersion((v) => v + 1);
                }
            };

            // Set up event listeners
            newRoom.on('connected', () => {
                console.log('[LiveKit] Connected to room');
                if (timeoutRef.current) {
                    clearTimeout(timeoutRef.current);
                    timeoutRef.current = null;
                }
                connectingRef.current = false;
                setIsJoined(true);
                setIsConnecting(false);
                syncRoomState();
            });

            newRoom.on('reconnecting', () => {
                console.log('[LiveKit] Network hiccup, attempting automatic reconnection...');
                setIsConnecting(true);
            });

            newRoom.on('reconnected', () => {
                console.log('[LiveKit] Successfully reconnected to room');
                setIsConnecting(false);
                setIsJoined(true);
                syncRoomState();
            });

            newRoom.on('disconnected', () => {
                console.log('[LiveKit] Disconnected from room');
                connectingRef.current = false;
                setIsJoined(false);
                setIsConnecting(false);
            });

            newRoom.on('participantConnected', (participant) => {
                console.log('[LiveKit] Participant connected:', participant.name || participant.identity);
                syncRoomState();
            });

            newRoom.on('participantDisconnected', (participant) => {
                console.log('[LiveKit] Participant disconnected:', participant.name || participant.identity);
                syncRoomState();
            });

            newRoom.on('trackSubscribed', syncRoomState);
            newRoom.on('trackUnsubscribed', syncRoomState);
            newRoom.on('trackPublished', syncRoomState);
            newRoom.on('trackUnpublished', syncRoomState);
            newRoom.on('localTrackPublished', syncRoomState);
            newRoom.on('localTrackUnpublished', syncRoomState);
            newRoom.on('trackMuted', syncRoomState);
            newRoom.on('trackUnmuted', syncRoomState);

            newRoom.on('error', (roomErr) => {
                console.error('[LiveKit] Room error:', roomErr);
                // Only fall back to Jitsi if we are not already connected
                if (newRoom.state !== 'connected') {
                    setError(roomErr.message || 'An error occurred in the video call.');
                    setIsConnecting(false);
                    setIsFallback(true);
                }
            });

            // Connect to room with token
            await newRoom.connect(liveKitUrl, token, {
                autoSubscribe: true,
            });

            // If timeout fired while connecting, abort cleanly
            if (roomRef.current !== newRoom) {
                try { await newRoom.disconnect(); } catch { /* ignore */ }
                return;
            }

            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
                timeoutRef.current = null;
            }
            connectingRef.current = false;
            setIsJoined(true);
            setIsConnecting(false);
            syncRoomState();

            // Enable microphone & camera asynchronously and independently so slow hardware or
            // permission prompts never block the room from loading or receiving remote streams
            (async () => {
                let audioOk = false;
                let videoOk = false;

                try {
                    if (typeof newRoom.localParticipant?.setMicrophoneEnabled === 'function') {
                        await newRoom.localParticipant.setMicrophoneEnabled(true);
                        audioOk = true;
                    }
                } catch (micErr) {
                    console.warn('[useVideoRoom] Microphone enable note:', micErr?.message || micErr);
                }

                try {
                    if (typeof newRoom.localParticipant?.setCameraEnabled === 'function') {
                        await newRoom.localParticipant.setCameraEnabled(true);
                        videoOk = true;
                    }
                } catch (camErr) {
                    console.warn('[useVideoRoom] Camera enable note:', camErr?.message || camErr);
                }

                if (roomRef.current === newRoom) {
                    const nextTracks = {
                        audio: audioOk || !!newRoom.localParticipant?.isMicrophoneEnabled,
                        video: videoOk || !!newRoom.localParticipant?.isCameraEnabled,
                    };
                    localTracksRef.current = nextTracks;
                    setLocalTracks(nextTracks);
                    syncRoomState();
                }
            })();
        } catch (err) {
            console.error('[useVideoRoom] Failed to join room:', err);
            connectingRef.current = false;
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
                timeoutRef.current = null;
            }
            if (roomRef.current) {
                try { roomRef.current.disconnect(); } catch { /* ignore */ }
                roomRef.current = null;
            }
            setRoom(null);
            setIsJoined(false);
            setIsConnecting(false);
            setError(err.message || 'Failed to join the video room.');
            setIsFallback(true);
        }
    }, []);

    const leaveRoom = useCallback(async () => {
        const r = roomRef.current;
        connectingRef.current = false;
        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
            timeoutRef.current = null;
        }
        roomRef.current = null;

        if (r) {
            try {
                await r.disconnect();
            } catch (err) {
                console.error('[useVideoRoom] Error disconnecting:', err);
            }
        }

        setRoom(null);
        setIsJoined(false);
        setIsConnecting(false);
        setIsScreenSharing(false);
        screenShareRef.current = false;
        setParticipants([]);
    }, []);

    const toggleVideo = useCallback(async () => {
        const r = roomRef.current;
        if (!r) return;

        const nextState = !localTracksRef.current.video;
        try {
            if (typeof r.localParticipant?.setCameraEnabled === 'function') {
                await r.localParticipant.setCameraEnabled(nextState);
            } else {
                await r.localParticipant?.setVideoEnabled?.(nextState);
            }
            localTracksRef.current = { ...localTracksRef.current, video: nextState };
            setLocalTracks((prev) => ({ ...prev, video: nextState }));
            setTrackVersion((v) => v + 1);
        } catch (err) {
            console.error('[useVideoRoom] toggleVideo error:', err);
        }
    }, []);

    const toggleAudio = useCallback(async () => {
        const r = roomRef.current;
        if (!r) return;

        const nextState = !localTracksRef.current.audio;
        try {
            if (typeof r.localParticipant?.setMicrophoneEnabled === 'function') {
                await r.localParticipant.setMicrophoneEnabled(nextState);
            } else {
                await r.localParticipant?.setAudioEnabled?.(nextState);
            }
            localTracksRef.current = { ...localTracksRef.current, audio: nextState };
            setLocalTracks((prev) => ({ ...prev, audio: nextState }));
            setTrackVersion((v) => v + 1);
        } catch (err) {
            console.error('[useVideoRoom] toggleAudio error:', err);
        }
    }, []);

    const toggleScreenShare = useCallback(async () => {
        const r = roomRef.current;
        if (!r) return;

        try {
            if (screenShareRef.current) {
                await r.localParticipant?.stopScreenShare?.();
                screenShareRef.current = false;
                setIsScreenSharing(false);
            } else {
                await r.localParticipant?.setScreenShareEnabled(true);
                screenShareRef.current = true;
                setIsScreenSharing(true);
            }
            setTrackVersion((v) => v + 1);
        } catch (err) {
            console.error('[useVideoRoom] Screen share error:', err);
            setError(err.message || 'Failed to toggle screen share.');
        }
    }, []);

    const getLocalParticipant = useCallback(() => {
        return roomRef.current?.localParticipant || null;
    }, []);

    const switchToFallback = useCallback(() => {
        leaveRoom();
        setIsFallback(true);
        setIsConnecting(false);
    }, [leaveRoom]);

    const retryLiveKit = useCallback(async () => {
        await leaveRoom();
        setIsFallback(false);
        setError(null);
        if (lastJoinArgsRef.current) {
            const { liveKitUrl, token, roomName, participantName } = lastJoinArgsRef.current;
            await joinRoom(liveKitUrl, token, roomName, participantName);
        }
    }, [leaveRoom, joinRoom]);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            connectingRef.current = false;
            if (timeoutRef.current) clearTimeout(timeoutRef.current);
            if (roomRef.current) {
                try { roomRef.current.disconnect(); } catch { /* ignore */ }
                roomRef.current = null;
            }
        };
    }, []);

    return {
        room,
        isJoined,
        isConnecting,
        error,
        joinRoom,
        leaveRoom,
        toggleVideo,
        toggleAudio,
        toggleScreenShare,
        isScreenSharing,
        participants,
        trackVersion,
        localTracks,
        getLocalParticipant,
        isFallback,
        switchToFallback,
        retryLiveKit,
    };
}

