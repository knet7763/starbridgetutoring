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

  const testId = uuidv4().substring(0, 8);
  const tutorEmail = `tutor_${testId}@gmail.com`;
  const studentEmail = `student_${testId}@gmail.com`;
  const password = 'Password123!';

  try {
    // 1. Sign up Tutor
    console.log("🧑‍🏫 1. Signing up Test Tutor...");
    const { data: tutorAuth, error: tutorErr } = await supabase.auth.signUp({
      email: tutorEmail,
      password: password,
    });
    if (tutorErr) throw tutorErr;
    const tutorId = tutorAuth.user.id;

    // Insert Tutor Profile
    const { error: tutorProfileErr } = await supabase.from('tutors').insert([
      { id: tutorId, full_name: 'Test Tutor', email: tutorEmail, hourly_rate: 20, subjects: ['Math'] }
    ]);
    if (tutorProfileErr) throw tutorProfileErr;
    console.log(`   ✅ Tutor created (ID: ${tutorId})`);

    // 2. Sign up Student
    console.log("\n👨‍🎓 2. Signing up Test Student...");
    const { data: studentAuth, error: studentErr } = await supabase.auth.signUp({
      email: studentEmail,
      password: password,
    });
    if (studentErr) throw studentErr;
    const studentId = studentAuth.user.id;

    // Insert Student Profile
    const { error: studentProfileErr } = await supabase.from('student_profiles').insert([
      { id: studentId, full_name: 'Test Student', grade_level: '10th' }
    ]);
    if (studentProfileErr) throw studentProfileErr;
    console.log(`   ✅ Student created (ID: ${studentId})`);

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

    // 4. Tutor Confirms Booking (Invokes Edge Function)
    console.log("\n✅ 4. Confirming Booking (Generating LiveKit Token)...");
    
    // We must manually sign in as the tutor to pass RLS policies for confirming their own booking!
    const { error: signInErr } = await supabase.auth.signInWithPassword({
        email: tutorEmail,
        password: password,
    });
    if (signInErr) throw signInErr;

    const { data: edgeData, error: edgeError } = await supabase.functions.invoke('create-livekit-token', {
        body: {
            resourceType: 'booking',
            sessionId: booking.id,
            participantName: 'Test Tutor',
            participantId: tutorId,
        },
    });
    if (edgeError || !edgeData?.token || !edgeData?.roomName) {
      console.error("   ❌ Edge function failed!", edgeError);
      throw edgeError || new Error("No token or roomName returned");
    }
    
    const token = edgeData.token;
    const roomUrl = edgeData.roomName;
    console.log(`   ✅ Edge function returned token for room: ${roomUrl}`);

    const { error: confirmErr } = await supabase.from('bookings').update({ 
      status: 'confirmed', 
      room_url: roomUrl 
    }).eq('id', booking.id);
    
    if (confirmErr) throw confirmErr;
    console.log("   ✅ Booking confirmed and saved to database.");

    // 5. Verify the updated booking
    console.log("\n🔍 5. Verifying Database State...");
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
