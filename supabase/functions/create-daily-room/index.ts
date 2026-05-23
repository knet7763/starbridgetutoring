import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // 1. Require Authorization header
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Missing Authorization header' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // 2. Parse optional bookingId from request body
    let bookingId: string | null = null
    try {
      const body = await req.json()
      bookingId = body?.bookingId ?? null
    } catch (_) {
      // body is optional — no-op
    }

    // 3. Instantiate Supabase client with caller's JWT
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL') ?? ''
    const SUPABASE_ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY') ?? ''

    const supabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: authHeader } }
    })

    // 4. Validate caller JWT
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser()
    if (authError || !user) {
      console.error('JWT validation failed:', authError)
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // 5. Verify caller is a tutor or admin
    const { data: tutor } = await supabaseClient
      .from('tutors')
      .select('id')
      .eq('id', user.id)
      .maybeSingle()

    const isAdmin =
      user.app_metadata?.role === 'admin' ||
      user.user_metadata?.role === 'admin'

    const isTeacher =
      user.app_metadata?.role === 'teacher' ||
      user.user_metadata?.role === 'teacher'

    if (!tutor && !isAdmin && !isTeacher) {
      console.error(`User ${user.id} is not a tutor, teacher, or admin — access denied.`)
      return new Response(
        JSON.stringify({ error: 'Forbidden: only tutors, teachers, or admins can create meeting rooms.' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // 6. Require DAILY_API_KEY secret
    const DAILY_API_KEY = Deno.env.get('DAILY_API_KEY')
    if (!DAILY_API_KEY) {
      console.error('DAILY_API_KEY secret is not configured in Supabase Edge Function secrets.')
      return new Response(JSON.stringify({ error: 'Server configuration error: missing DAILY_API_KEY' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // 7. Build a deterministic room name for traceability (bookingId prefix)
    const roomName = bookingId
      ? `sb-${bookingId.substring(0, 8)}-${Date.now()}`
      : `sb-${Date.now()}`

    // 8. Create Daily.co room
    const response = await fetch('https://api.daily.co/v1/rooms', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${DAILY_API_KEY}`,
      },
      body: JSON.stringify({
        name: roomName,
        properties: {
          exp: Math.floor(Date.now() / 1000) + 86400, // 24-hour expiry
          max_participants: 2,                          // 1-on-1 only
          enable_chat: true,
          enable_screenshare: true,
          start_video_off: false,
          start_audio_off: false,
          enable_prejoin_ui: true,
        },
      }),
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('Daily.co API error:', errorText)
      return new Response(
        JSON.stringify({ error: 'Failed to create video room', details: errorText }),
        { status: response.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const data = await response.json()
    console.log(`Room created: ${data.name} for booking: ${bookingId ?? 'N/A'}`)

    return new Response(
      JSON.stringify({ room_url: data.url, room_name: data.name }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Edge function error:', error)
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})
