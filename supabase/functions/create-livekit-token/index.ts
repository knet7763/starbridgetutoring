import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { AccessToken } from "https://cdn.jsdelivr.net/npm/livekit-server-sdk@0.5.0/dist/room_service.js";

serve(async (req) => {
  if (req.method !== "POST") {
    return new Response(
      JSON.stringify({ error: "Method not allowed" }),
      {
        status: 405,
        headers: { "Content-Type": "application/json" },
      }
    );
  }

  try {
    const { sessionId, participantName, participantId } = await req.json();

    // Validate required parameters
    if (!sessionId || !participantName || !participantId) {
      return new Response(
        JSON.stringify({
          error: "Missing required parameters: sessionId, participantName, participantId",
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Get LiveKit API credentials from environment
    const apiKey = Deno.env.get("LIVEKIT_API_KEY");
    const apiSecret = Deno.env.get("LIVEKIT_API_SECRET");

    if (!apiKey || !apiSecret) {
      console.error("LiveKit credentials not configured");
      return new Response(
        JSON.stringify({
          error: "Server misconfiguration: LiveKit credentials missing",
        }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Generate room name from session ID
    const roomName = sessionId.substring(0, 8).replace(/-/g, "_");

    // Create LiveKit access token
    const at = new AccessToken(apiKey, apiSecret);
    at.addGrant({
      room: roomName,
      roomJoin: true,
      canPublish: true,
      canPublishData: true,
      canSubscribe: true,
      identity: participantId,
      name: participantName,
      metadata: JSON.stringify({
        sessionId,
        joinedAt: new Date().toISOString(),
      }),
    });

    const token = at.toJwt();

    return new Response(
      JSON.stringify({
        token,
        roomName,
      }),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
        },
      }
    );
  } catch (error) {
    console.error("Error generating LiveKit token:", error);
    return new Response(
      JSON.stringify({
        error: error.message || "Failed to generate token",
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
});
