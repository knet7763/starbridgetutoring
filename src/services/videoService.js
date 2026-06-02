/**
 * Video Service - Centralized management for video conferencing
 * Handles room creation, token generation, and provider abstraction
 * 
 * Current Provider: LiveKit (Cloud)
 * Token Generation: Supabase Edge Function (server-side for security)
 */

const LIVEKIT_URL = import.meta.env.VITE_LIVEKIT_URL;

/**
 * Validates LiveKit URL format
 * @param {string} url - The LiveKit URL to validate
 * @returns {boolean}
 */
function isValidLiveKitUrl(url) {
    try {
        // LiveKit URLs should start with wss:// or ws://
        return url && (url.startsWith('wss://') || url.startsWith('ws://'));
    } catch {
        return false;
    }
}

/**
 * Generates a LiveKit access token for a participant
 * Uses Supabase Edge Function to ensure API key security
 * 
 * @param {string} sessionId - The active_sessions record ID or meeting room name
 * @param {string} participantName - Name of the participant joining
 * @param {string} participantId - Unique participant ID (user ID or guest ID)
 * @returns {Promise<{token: string, url: string}>} LiveKit token and URL
 */
export async function generateLiveKitToken(sessionId, participantName, participantId) {
    try {
        if (!LIVEKIT_URL) {
            throw new Error('VITE_LIVEKIT_URL not configured');
        }

        if (!isValidLiveKitUrl(LIVEKIT_URL)) {
            throw new Error(`Invalid LiveKit URL: ${LIVEKIT_URL}`);
        }

        // Call Supabase Edge Function to generate token securely
        const response = await fetch(
            `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/create-livekit-token`,
            {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('sb-access-token') || ''}`,
                },
                body: JSON.stringify({
                    sessionId,
                    participantName,
                    participantId,
                }),
            }
        );

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'Failed to generate LiveKit token');
        }

        const { token } = await response.json();
        if (!token) {
            throw new Error('Invalid token returned from server');
        }

        return {
            token,
            url: LIVEKIT_URL,
        };
    } catch (error) {
        console.error('[VideoService] Failed to generate LiveKit token:', error);
        throw new Error(`Token generation failed: ${error.message}`);
    }
}

/**
 * Gets the LiveKit server URL
 * @returns {string}
 */
export function getLiveKitUrl() {
    if (!LIVEKIT_URL) {
        throw new Error('LiveKit URL not configured. Set VITE_LIVEKIT_URL in .env');
    }
    return LIVEKIT_URL;
}

/**
 * Validates if a room name is valid for LiveKit
 * Room names should be alphanumeric with hyphens/underscores
 * @param {string} roomName - The room name to validate
 * @returns {boolean}
 */
export function isValidRoomName(roomName) {
    // LiveKit allows alphanumeric, hyphens, underscores
    return /^[a-zA-Z0-9_-]+$/.test(roomName);
}

/**
 * Generates a valid room name from a session ID
 * @param {string} sessionId - The session ID
 * @returns {string}
 */
export function generateRoomName(sessionId) {
    // Take first 8 chars of UUID, replace hyphens with underscores
    return sessionId.substring(0, 8).replace(/-/g, '_');
}

export default {
    generateLiveKitToken,
    getLiveKitUrl,
    isValidRoomName,
    generateRoomName,
    isValidLiveKitUrl,
};
