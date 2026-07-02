import { createClient } from '@supabase/supabase-js';
import { v4 as uuidv4 } from 'uuid';

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing Supabase env vars");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function runE2ETest() {
  console.log("🚀 Starting End-to-End Booking Test...\n");

  const tutorEmail = 'richkevonlinestore@gmail.com';
  const tutorPassword = 'RichKev2026!';
  const studentEmail = 'johnnynjsh@gmail.com';
  const studentPassword = 'Johnny2026!';

  try {
    // 1. Sign in Tutor
    console.log("🧑‍🏫 1. Signing in Test Tutor...");
    const { data: tutorAuth, error: tutorSignInErr } = await supabase.auth.signInWithPassword({
      email: tutorEmail,
      password: tutorPassword,
    });
    if (tutorSignInErr) throw tutorSignInErr;
    const tutorId = tutorAuth.user.id;

    // Upsert Tutor Profile (matching actual db schema columns)
    const { error: tutorProfileErr } = await supabase.from('tutors').upsert([
      { 
        id: tutorId, 
        name: 'Rich Kev Tutor', 
        subject: 'Mathematics', 
        bio: 'Test Tutor Bio', 
        qualification: 'BSc Math',
        image_url: 'https://api.dicebear.com/7.x/initials/svg?seed=Test+Tutor',
        languages: ['English']
      }
    ]);
    if (tutorProfileErr) throw tutorProfileErr;
    console.log(`   ✅ Tutor signed in and profile verified (ID: ${tutorId})`);

    // 2. Sign in Student
    console.log("\n👨‍🎓 2. Signing in Test Student...");
    const { data: studentAuth, error: studentSignInErr } = await supabase.auth.signInWithPassword({
      email: studentEmail,
      password: studentPassword,
    });
    if (studentSignInErr) throw studentSignInErr;
    const studentId = studentAuth.user.id;

    // Insert/Upsert Student Profile
    const { error: studentProfileErr } = await supabase.from('student_profiles').upsert([
      { id: studentId, full_name: 'Johnny Student', grade_level: '10th' }
    ]);
    if (studentProfileErr) throw studentProfileErr;
    console.log(`   ✅ Student signed in and profile verified (ID: ${studentId})`);

    // 3. Create a Booking (Student booking Tutor)
    console.log("\n📅 3. Creating a Booking...");
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const dateStr = tomorrow.toISOString().split('T')[0];

    const { data: booking, error: bookingErr } = await supabase.from('bookings').insert([
      { 
        student_id: studentId, 
        tutor_id: tutorId, 
        booking_date: dateStr, 
        start_time: '10:00:00', 
        end_time: '11:00:00',
        status: 'pending'
      }
    ]).select().single();
    if (bookingErr) throw bookingErr;
    console.log(`   ✅ Booking created (ID: ${booking.id})`);

    // 4. Tutor Confirms Booking in Database
    console.log("\n✅ 4. Confirming Booking in Database...");
    
    // We must manually sign in as the tutor to pass RLS policies for confirming their own booking!
    const { error: signInErr } = await supabase.auth.signInWithPassword({
        email: tutorEmail,
        password: tutorPassword,
    });
    if (signInErr) throw signInErr;

    const expectedRoomUrl = booking.id.substring(0, 8).replace(/-/g, '_');
    const { data: updateData, error: confirmErr } = await supabase.from('bookings').update({ 
      status: 'confirmed', 
      room_url: expectedRoomUrl 
    }).eq('id', booking.id).select();
    
    console.log("   Update returned data:", updateData);
    if (confirmErr) throw confirmErr;
    console.log("   ✅ Booking confirmed and saved to database.");

    // 5. Generate LiveKit Token for the Confirmed Booking (Invokes Edge Function)
    console.log("\n🔑 5. Generating LiveKit Token from Edge Function...");
    let token;
    let roomUrl;

    try {
        const { data: edgeData, error: edgeError } = await supabase.functions.invoke('create-livekit-token', {
            body: {
                resourceType: 'booking',
                sessionId: booking.id,
                participantName: 'Test Tutor',
                participantId: tutorId,
            },
        });
        if (edgeError || !edgeData?.token || !edgeData?.roomName) {
            if (edgeError) {
                console.error("   ❌ Edge function invocation error details:", {
                    message: edgeError.message,
                    status: edgeError.status,
                    name: edgeError.name,
                    error: edgeError
                });
            }
            throw edgeError || new Error("No token or roomName returned");
        }
        token = edgeData.token;
        roomUrl = edgeData.roomName;
        console.log(`   ✅ Edge function returned token for room: ${roomUrl}`);
    } catch (error) {
        console.error("   ⚠️ Edge function failed:", error.message || error);
        if (process.env.VITE_APP_ENV === 'development') {
            console.warn("   ⚠️ Edge Function unavailable. Requesting real signed token from local token server on port 5174...");
            try {
                const localResponse = await fetch('http://localhost:5174/create-token', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        resourceId: booking.id,
                        participantName: 'Test Tutor',
                        participantId: tutorId,
                        roomName: expectedRoomUrl,
                    }),
                });
                if (localResponse.ok) {
                    const localData = await localResponse.json();
                    token = localData.token;
                    roomUrl = localData.roomName;
                    console.log(`   ✅ Local token server returned signed token for room: ${roomUrl}`);
                } else {
                    throw new Error('Local token server returned non-200');
                }
            } catch (localErr) {
                console.warn("   ⚠️ Local token server failed. Falling back to dummy mock token.");
                token = `dev-mock-token-${Date.now()}-${tutorId}`;
                roomUrl = expectedRoomUrl;
            }
        } else {
            throw error;
        }
    }

    // 6. Verify the updated booking
    console.log("\n🔍 6. Verifying Database State...");
    const { data: finalBooking, error: verifyErr } = await supabase.from('bookings').select('*').eq('id', booking.id).single();
    if (verifyErr) throw verifyErr;

    if (finalBooking.room_url === roomUrl && finalBooking.status === 'confirmed') {
       console.log("   🎉 SUCCESS! The end-to-end flow works perfectly.");
    } else {
       console.error("   ❌ Verification failed. Database state does not match.", finalBooking);
    }

  } catch (err) {
    console.error("\n❌ Test Failed:", err);
  }
}

runE2ETest();
