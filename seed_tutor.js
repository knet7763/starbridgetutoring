import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: resolve(__dirname, '.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function seed() {
    const email = 'tutor@test.com';
    const password = 'password123';

    console.log('Signing up tutor...');
    const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
    });

    if (authError) {
        console.error('Error signing up:', authError.message);
        return;
    }

    const userId = authData.user?.id;
    if (!userId) {
        console.error('No user ID returned. User might already exist or email confirmation is required.');
        return;
    }
    
    console.log('Created user ID:', userId);

    console.log('Inserting into tutors table...');
    const { error: tutorError } = await supabase.from('tutors').upsert({
        id: userId,
        full_name: 'Dr. Sarah Jenkins',
        email: email,
        bio: 'I am a highly experienced test tutor specializing in Mathematics and Science.',
        hourly_rate: 50.00,
        subjects: ['Mathematics', 'Science']
    });

    if (tutorError) {
        console.error('Error inserting tutor:', tutorError.message);
        // Sometimes RLS prevents inserts from the client unless you're authenticated as that user
        // We are authenticated implicitly because we just signed up
    } else {
        console.log('Tutor inserted successfully.');
    }
    
    console.log('Inserting availability...');
    const { error: availError } = await supabase.from('tutor_availability').insert([
        { tutor_id: userId, day_of_week: 1, start_time: '09:00:00', end_time: '17:00:00' },
        { tutor_id: userId, day_of_week: 2, start_time: '09:00:00', end_time: '17:00:00' },
        { tutor_id: userId, day_of_week: 3, start_time: '09:00:00', end_time: '17:00:00' },
        { tutor_id: userId, day_of_week: 4, start_time: '09:00:00', end_time: '17:00:00' },
        { tutor_id: userId, day_of_week: 5, start_time: '09:00:00', end_time: '17:00:00' },
    ]);
    
    if (availError) {
        console.error('Error inserting availability:', availError.message);
    } else {
        console.log('Availability inserted successfully.');
    }

    console.log('Seeding complete!');
    console.log(`\nTest Tutor Credentials:\nEmail: ${email}\nPassword: ${password}`);
}

seed();
