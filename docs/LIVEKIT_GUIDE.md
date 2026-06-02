# LiveKit Integration Guide

**Project:** StarBridgeTutoring  
**Video Platform:** LiveKit Cloud  
**Updated:** June 2, 2026

## Overview

This project now uses **LiveKit** for video conferencing instead of Daily.co. LiveKit provides:
- Scalable WebRTC infrastructure
- Secure token-based authentication
- Built-in recording and analytics
- Competitive pricing
- Open-source server option (if self-hosting later)

---

## Architecture

### Data Flow

```
Frontend (React)
    ↓
    ├─→ User joins session/booking
    ├─→ Request LiveKit token from Edge Function
    ↓
Supabase Edge Function (create-livekit-token)
    ↓
    ├─→ Validate request
    ├─→ Generate JWT token using API secret
    ↓
Frontend receives token + room name
    ↓
    ├─→ Connect to LiveKit Cloud
    ├─→ Join room with token
    ↓
LiveKit Cloud (WebRTC)
    ├─→ Establish peer connections
    ├─→ Route media streams
    ├─→ Record (if enabled)
    ↓
All participants connected in room
```

---

## Setup Steps

### Step 1: Create LiveKit Cloud Account

1. Go to [https://cloud.livekit.io](https://cloud.livekit.io)
2. Sign up for a free account
3. Create a new project
4. You'll receive:
   - **LiveKit URL:** `wss://your-project.livekit.cloud`
   - **API Key:** `your-api-key`
   - **API Secret:** `your-api-secret`

Save these values securely.

---

### Step 2: Configure Environment Variables

#### Local Development (`.env.local`)

```bash
VITE_LIVEKIT_URL=wss://your-project.livekit.cloud
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
VITE_APP_ENV=development
```

#### Production (Vercel + Supabase)

**Vercel Dashboard → Settings → Environment Variables**
```
VITE_LIVEKIT_URL=wss://your-project.livekit.cloud
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
VITE_APP_ENV=production
```

**Supabase Dashboard → Edge Functions → create-livekit-token → Secrets**
```
LIVEKIT_API_KEY=your-api-key
LIVEKIT_API_SECRET=your-api-secret
```

---

### Step 3: Deploy Supabase Edge Function

The edge function generates secure JWT tokens for participants.

```bash
# Install/update Supabase CLI
npm install -g supabase

# Link your project
supabase link

# Deploy the edge function
supabase functions deploy create-livekit-token
```

**Verify deployment:**
```bash
# In Supabase Dashboard → Edge Functions
# You should see: create-livekit-token (deployed)
```

---

### Step 4: Configure Function Secrets

**In Supabase Dashboard:**

1. Go to **Edge Functions** → **create-livekit-token**
2. Click **Secrets** tab
3. Add two secrets:

| Secret Name | Value |
|------------|-------|
| `LIVEKIT_API_KEY` | Your LiveKit API Key |
| `LIVEKIT_API_SECRET` | Your LiveKit API Secret |

---

### Step 5: Install Dependencies

The following packages are now included:

```bash
npm install

# Verify these are installed:
# - livekit-client: WebRTC client library
# - @livekit/react: React hooks and components
# - livekit-server-sdk: Server-side token generation
```

---

## How It Works

### User Flow

1. **Student joins class**
   ```
   Click "Join Class" → Select session code
   ```

2. **Frontend requests token**
   ```javascript
   // In ClassroomStudent.jsx or ClassroomHost.jsx
   const { token, url } = await generateLiveKitToken(
     sessionId,
     "Student Name",
     studentId
   );
   ```

3. **Edge Function generates token**
   - Validates request
   - Generates JWT signed with API secret
   - Returns token + room name

4. **Frontend connects to LiveKit**
   ```javascript
   await joinRoom(liveKitUrl, token, roomName, participantName);
   ```

5. **Participant joins room**
   - Establishes WebRTC connection
   - Media streams are exchanged
   - Room shows all participants

---

## API Reference

### Frontend: generateLiveKitToken()

```javascript
import { generateLiveKitToken } from './services/videoService';

const result = await generateLiveKitToken(
  sessionId,        // string: "550e8400-e29b..."
  participantName,  // string: "John Doe"
  participantId     // string: user ID or guest ID
);

// Returns:
// {
//   token: "eyJhbGc...",
//   url: "wss://project.livekit.cloud"
// }
```

### Edge Function: POST /functions/v1/create-livekit-token

**Request:**
```json
{
  "sessionId": "550e8400-e29b-41d4-a716-446655440000",
  "participantName": "John Doe",
  "participantId": "user-123"
}
```

**Response:**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "roomName": "550e8400"
}
```

**Error Response:**
```json
{
  "error": "Missing required parameters: sessionId, participantName, participantId"
}
```

---

## useVideoRoom Hook

The `useVideoRoom` hook manages LiveKit connections:

```javascript
import { useVideoRoom } from './hooks/useVideoRoom';

function ClassroomComponent() {
  const {
    room,                    // Current LiveKit room
    isJoined,               // Connected to room
    isConnecting,           // Connecting...
    error,                  // Error message
    participants,           // Array of other participants
    localTracks,            // { audio: bool, video: bool }
    joinRoom,               // async (url, token, roomName, name)
    leaveRoom,              // async ()
    toggleVideo,            // () - enable/disable video
    toggleAudio,            // () - enable/disable audio
    toggleScreenShare,      // async () - toggle screen sharing
    isScreenSharing,        // bool
    getLocalParticipant,    // () - get your participant object
  } = useVideoRoom();

  return (
    // Use these in your component
  );
}
```

---

## Displaying Video

Use LiveKit React components to display video:

```jsx
import {
  LiveKitRoom,
  ParticipantTile,
  GridLayout,
  ControlBar,
} from '@livekit/react';

function ClassroomView({ token, roomName, serverUrl }) {
  return (
    <LiveKitRoom
      video={true}
      audio={true}
      token={token}
      serverUrl={serverUrl}
      data-lk-theme="light"
      style={{ height: '100vh' }}
    >
      <GridLayout tracks={useTracks([{ source: Track.Source.Camera, withPlaceholder: true }])}>
        <ParticipantTile />
      </GridLayout>
      <ControlBar />
    </LiveKitRoom>
  );
}
```

Or use the hook directly for custom UI:

```jsx
function ClassroomView({ token, roomName, serverUrl }) {
  const { room, participants, localTracks, toggleVideo, toggleAudio } = useVideoRoom();
  
  useEffect(() => {
    joinRoom(serverUrl, token, roomName, participantName);
  }, [token]);

  return (
    <div>
      {/* Render video tiles */}
      {participants.map(p => (
        <video key={p.sid} autoPlay muted={p.isLocal} />
      ))}
    </div>
  );
}
```

---

## Testing

### Local Development

1. **Start development server:**
   ```bash
   npm run dev
   ```

2. **Test token generation:**
   ```bash
   # Open browser console
   # Try joining a session
   # Check network tab for create-livekit-token request
   ```

3. **Check LiveKit dashboard:**
   - Go to [https://cloud.livekit.io](https://cloud.livekit.io)
   - Open your project
   - Look for active sessions in **Rooms** tab

### Production Testing

1. **Deploy to staging:**
   ```bash
   git push origin main
   # Vercel will auto-deploy
   ```

2. **Test end-to-end:**
   - Create a session/booking
   - Join from 2 different browsers
   - Verify video streams
   - Test screen sharing
   - Check LiveKit dashboard for metrics

---

## Troubleshooting

### Issue: "VITE_LIVEKIT_URL not configured"

**Solution:**
```bash
# Ensure .env.local has:
VITE_LIVEKIT_URL=wss://your-project.livekit.cloud

# Restart dev server
npm run dev
```

### Issue: "Failed to generate LiveKit token"

**Check:**
1. Edge Function secrets are set correctly
2. Edge Function is deployed: `supabase functions list`
3. Check Edge Function logs: Supabase Dashboard → Edge Functions → Logs

```bash
# Redeploy if needed:
supabase functions deploy create-livekit-token
```

### Issue: "WebSocket connection failed"

**Check:**
1. LiveKit URL is correct (should be `wss://`, not `https://`)
2. Project is active in LiveKit dashboard
3. Network/firewall isn't blocking WebRTC ports
4. Token is valid and not expired

### Issue: "Audio/Video not working"

**Check:**
1. Browser permissions: Allow camera/microphone
2. Device is being used by another app
3. Check browser console for errors
4. Test in different browser

### Issue: "Participants not visible"

**Check:**
1. Both participants joined the same room
2. Room name matches (no typos)
3. Firewall allows WebRTC (UDP ports)
4. Check connection quality in LiveKit dashboard

---

## Performance Tips

### 1. Optimize Bandwidth

```javascript
// In useVideoRoom hook
const room = new Room({
  publishDefaults: {
    codec: 'vp9',  // Better compression
    simulcast: true,  // Adaptive quality
    screenShareEncoding: {
      maxBitrate: 500000,  // 500 kbps for screen
      maxFramerate: 15,
    },
  },
});
```

### 2. Limit Participants Per Room

For better performance, keep rooms <10 participants. Larger classes should use:
- Presenter + audience role separation
- Sub-room breakout sessions
- Broadcast mode for lectures

### 3. Monitor LiveKit Dashboard

- **Rooms tab:** See active sessions
- **Participants tab:** Monitor connection quality
- **Analytics:** Track usage and bandwidth

---

## Scaling Considerations

### Free Tier

- Limited concurrent participants
- Sufficient for small group tutoring (2-5 people)
- Good for testing

### Paid Plans

- Unlimited rooms
- Premium features (recording, transcoding)
- Analytics and API access
- Recommended for production

---

## Security Best Practices

1. **Never expose API Secret client-side**
   ✅ Tokens generated in Edge Function
   ❌ Don't generate tokens in frontend

2. **Validate token recipients**
   - Ensure user is authorized for session
   - Check student enrolled in class
   - Verify booking ownership

3. **Use HTTPS/WSS only**
   - All communications encrypted
   - Vercel handles HTTPS
   - LiveKit uses WSS by default

4. **Limit token lifetime**
   - Tokens expire after session ends
   - Generate fresh token if reconnecting
   - Implement token refresh logic if needed

---

## Migration from Daily.co

If migrating from Daily.co, the following changed:

| Aspect | Daily.co | LiveKit |
|--------|----------|---------|
| Room URL | `https://daily.co/room-name` | `wss://project.livekit.cloud` + token |
| Auth | Room URL | JWT token |
| Token Generation | API call per room | JWT per participant |
| Screen Share | Built-in UI | Custom implementation |
| Recording | Daily API | LiveKit API |

**Files Updated:**
- `package.json` - Dependencies
- `src/services/videoService.js` - Token generation
- `src/hooks/useVideoRoom.js` - LiveKit client
- `src/services/api.js` - Room/token logic
- `.env.example` - Environment variables

---

## Resources

- **LiveKit Docs:** https://docs.livekit.io
- **LiveKit Cloud:** https://cloud.livekit.io
- **LiveKit React:** https://docs.livekit.io/guides/react
- **WebRTC Basics:** https://webrtc.org

---

## Support

For issues or questions:

1. Check LiveKit dashboard for errors
2. Review browser console logs
3. Check Supabase Edge Function logs
4. Contact LiveKit support: support@livekit.io

---

**Last Updated:** June 2, 2026  
**Status:** ✅ Production Ready
