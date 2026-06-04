import { useState, useCallback, useEffect, useRef } from 'react';
import { connect, Room } from 'livekit-client';

/**
 * useVideoRoom
 * Manages a LiveKit room connection for 1-on-1 sessions and group classes
 * Handles connection lifecycle, local media controls, and screen sharing
 */
export function useVideoRoom() {
    const roomRef = useRef(null);
    const [room, setRoom] = useState(null);
    const [isJoined, setIsJoined] = useState(false);
    const [isConnecting, setIsConnecting] = useState(false);
    const [error, setError] = useState(null);
    const [isScreenSharing, setIsScreenSharing] = useState(false);
    const [participants, setParticipants] = useState([]);
    const [localTracks, setLocalTracks] = useState({ audio: true, video: true });

    const joinRoom = useCallback(async (liveKitUrl, token, roomName, participantName) => {
        // Guard: don't join twice
        if (roomRef.current) {
            console.warn('[useVideoRoom] Already connected to a room');
            return;
        }

        setIsConnecting(true);
        setError(null);

        try {
            if (!liveKitUrl || !token || !roomName) {
                throw new Error('Missing required parameters: liveKitUrl, token, roomName');
            }

            // Create and configure LiveKit room
            const newRoom = new Room({
                autoConnect: false,
                autoSubscribe: true,
                dynacast: true,
                publishDefaults: {
                    codec: 'vp9',
                    simulcast: true,
                    screenShareEncoding: {
                        maxBitrate: 500000,
                        maxFramerate: 15,
                    },
                },
            });

            roomRef.current = newRoom;
            setRoom(newRoom);

            const handleParticipantsUpdate = () => {
                if (roomRef.current) {
                    setParticipants(Array.from(roomRef.current.participants.values()));
                }
            };

            // Set up event listeners
            newRoom.on('connected', () => {
                console.log('[LiveKit] Connected to room');
                setIsJoined(true);
                setIsConnecting(false);
            });

            newRoom.on('disconnected', () => {
                console.log('[LiveKit] Disconnected from room');
                setIsJoined(false);
                setIsConnecting(false);
            });

            newRoom.on('participantConnected', (participant) => {
                console.log('[LiveKit] Participant connected:', participant.name);
                setParticipants((prev) => [...prev, participant]);
            });

            newRoom.on('participantDisconnected', (participant) => {
                console.log('[LiveKit] Participant disconnected:', participant.name);
                setParticipants((prev) => prev.filter((p) => p.sid !== participant.sid));
            });

            newRoom.on('trackSubscribed', handleParticipantsUpdate);
            newRoom.on('trackUnsubscribed', handleParticipantsUpdate);
            newRoom.on('trackPublished', handleParticipantsUpdate);
            newRoom.on('trackUnpublished', handleParticipantsUpdate);
            newRoom.on('localTrackPublished', handleParticipantsUpdate);
            newRoom.on('localTrackUnpublished', handleParticipantsUpdate);

            newRoom.on('error', (error) => {
                console.error('[LiveKit] Room error:', error);
                setError(error.message || 'An error occurred in the video call.');
                setIsConnecting(false);
            });

            // Connect to room with token and publish local audio/video
            await newRoom.connect(liveKitUrl, token, {
                name: participantName,
                audio: true,
                video: true,
            });
            
            // Get initial participants
            setParticipants(Array.from(newRoom.participants.values()));
        } catch (err) {
            console.error('[useVideoRoom] Failed to join room:', err);
            setError(err.message || 'Failed to join the video room.');
            setIsConnecting(false);
            roomRef.current = null;
            setRoom(null);
        }
    }, []);

    const leaveRoom = useCallback(async () => {
        const r = roomRef.current;
        if (!r) return;

        try {
            await r.disconnect();
        } catch (err) {
            console.error('[useVideoRoom] Error disconnecting:', err);
        }

        roomRef.current = null;
        setRoom(null);
        setIsJoined(false);
        setIsConnecting(false);
        setIsScreenSharing(false);
        setParticipants([]);
    }, []);

    const toggleVideo = useCallback(() => {
        const r = roomRef.current;
        if (!r) return;

        const currentState = localTracks.video;
        if (currentState) {
            if (typeof r.localParticipant?.setCameraEnabled === 'function') {
                r.localParticipant.setCameraEnabled(false);
            } else {
                r.localParticipant?.setVideoEnabled?.(false);
            }
        } else {
            if (typeof r.localParticipant?.setCameraEnabled === 'function') {
                r.localParticipant.setCameraEnabled(true);
            } else {
                r.localParticipant?.setVideoEnabled?.(true);
            }
        }
        setLocalTracks((prev) => ({ ...prev, video: !prev.video }));
    }, [localTracks.video]);

    const toggleAudio = useCallback(() => {
        const r = roomRef.current;
        if (!r) return;

        const currentState = localTracks.audio;
        if (currentState) {
            if (typeof r.localParticipant?.setMicrophoneEnabled === 'function') {
                r.localParticipant.setMicrophoneEnabled(false);
            } else {
                r.localParticipant?.setAudioEnabled?.(false);
            }
        } else {
            if (typeof r.localParticipant?.setMicrophoneEnabled === 'function') {
                r.localParticipant.setMicrophoneEnabled(true);
            } else {
                r.localParticipant?.setAudioEnabled?.(true);
            }
        }
        setLocalTracks((prev) => ({ ...prev, audio: !prev.audio }));
    }, [localTracks.audio]);

    const toggleScreenShare = useCallback(async () => {
        const r = roomRef.current;
        if (!r) return;

        try {
            if (isScreenSharing) {
                await r.localParticipant?.stopScreenShare();
                setIsScreenSharing(false);
            } else {
                await r.localParticipant?.setScreenShareEnabled(true);
                setIsScreenSharing(true);
            }
        } catch (err) {
            console.error('[useVideoRoom] Screen share error:', err);
            setError(err.message || 'Failed to toggle screen share.');
        }
    }, [isScreenSharing]);

    const getLocalParticipant = useCallback(() => {
        return roomRef.current?.localParticipant || null;
    }, []);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            if (roomRef.current) {
                roomRef.current.disconnect();
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
        localTracks,
        getLocalParticipant,
    };
}

