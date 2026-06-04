import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.95.3";
import { AccessToken } from "https://cdn.jsdelivr.net/npm/livekit-server-sdk@0.5.0/dist/room_service.js";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const jsonResponse = (body: Record<string, unknown>, status = 200) => {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      ...corsHeaders,
      "Content-Type": "application/json",
    },
  });
};

const getTrustedRole = (user: any) => {
  const role = user?.app_metadata?.role;
  return role === "admin" || role === "teacher" ? role : null;
};

const generateRoomName = (id: string) => {
  return id.substring(0, 8).replace(/-/g, "_");
};

const isValidRoomName = (roomName: string) => /^[a-zA-Z0-9_-]+$/.test(roomName);

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return jsonResponse({ error: "Method not allowed" }, 405);
  }

  try {
    const {
      resourceId,
      sessionId,
      resourceType = "active_session",
      roomName: requestedRoomName,
      joinCode,
      participantName,
      participantId,
    } = await req.json();

    const targetId = resourceId || sessionId;

    if (!targetId || !participantName || !participantId) {
      return jsonResponse(
        { error: "Missing required parameters: resourceId, participantName, participantId" },
        400
      );
    }

    const apiKey = Deno.env.get("LIVEKIT_API_KEY");
    const apiSecret = Deno.env.get("LIVEKIT_API_SECRET");
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY");
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!apiKey || !apiSecret) {
      console.error("LiveKit credentials not configured");
      return jsonResponse({ error: "Server misconfiguration: LiveKit credentials missing" }, 500);
    }

    if (!supabaseUrl || !supabaseAnonKey) {
      console.error("Supabase credentials not configured");
      return jsonResponse({ error: "Server misconfiguration: Supabase credentials missing" }, 500);
    }

    const authHeader = req.headers.get("Authorization") || "";
    const userClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: {
        headers: authHeader ? { Authorization: authHeader } : {},
      },
      auth: {
        persistSession: false,
      },
    });
    const adminClient = createClient(supabaseUrl, supabaseServiceKey || supabaseAnonKey, {
      auth: {
        persistSession: false,
      },
    });

    let authUser = null;
    if (authHeader) {
      const { data, error } = await userClient.auth.getUser();
      if (!error) {
        authUser = data.user;
      }
    }

    let roomName = requestedRoomName || generateRoomName(targetId);

    if (resourceType === "booking") {
      if (!authUser) {
        return jsonResponse({ error: "Authentication required for booked meetings" }, 401);
      }

      const { data: booking, error } = await adminClient
        .from("bookings")
        .select("id, student_id, tutor_id, status, room_url")
        .eq("id", targetId)
        .maybeSingle();

      if (error || !booking) {
        return jsonResponse({ error: "Meeting not found" }, 404);
      }

      const role = getTrustedRole(authUser);
      const canJoin =
        booking.status === "confirmed" &&
        (authUser.id === booking.student_id || authUser.id === booking.tutor_id || role === "admin");

      if (!canJoin) {
        return jsonResponse({ error: "You are not allowed to join this meeting" }, 403);
      }

      roomName = booking.room_url || roomName;
    } else {
      const { data: activeSession, error } = await adminClient
        .from("active_sessions")
        .select("id, tutor_id, code, is_active, room_url")
        .eq("id", targetId)
        .maybeSingle();

      if (error || !activeSession) {
        return jsonResponse({ error: "Classroom session not found" }, 404);
      }

      if (!activeSession.is_active) {
        return jsonResponse({ error: "This classroom session has ended" }, 403);
      }

      const role = getTrustedRole(authUser);
      const hasMatchingJoinCode =
        joinCode && String(joinCode).trim().toUpperCase() === activeSession.code;
      const canJoin =
        authUser?.id === activeSession.tutor_id ||
        role === "admin" ||
        hasMatchingJoinCode;

      if (!canJoin) {
        return jsonResponse({ error: "A valid class code is required to join this room" }, 403);
      }

      roomName = activeSession.room_url || roomName;
    }

    if (!roomName || !isValidRoomName(roomName)) {
      return jsonResponse({ error: "Invalid LiveKit room name" }, 400);
    }

    const tokenIdentity = authUser?.id || participantId;
    const at = new AccessToken(apiKey, apiSecret);
    at.addGrant({
      room: roomName,
      roomJoin: true,
      canPublish: true,
      canPublishData: true,
      canSubscribe: true,
      identity: tokenIdentity,
      name: participantName,
      metadata: JSON.stringify({
        resourceId: targetId,
        resourceType,
        joinedAt: new Date().toISOString(),
      }),
    });

    const token = at.toJwt();

    return jsonResponse({
      token,
      roomName,
    });
  } catch (error) {
    console.error("Error generating LiveKit token:", error);
    return jsonResponse({ error: error.message || "Failed to generate token" }, 500);
  }
});
