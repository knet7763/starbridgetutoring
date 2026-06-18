-- =========================================================================
-- CANONICAL SCHEMA FOR STARBRIDGE TUTORING
-- Single source of truth for all tables, indexes, triggers, and RLS.
-- Run this in the Supabase SQL Editor on a fresh project.
-- Last updated: 2026-03-21
-- =========================================================================


-- =========================================================================
-- SECTION 1: TABLES
-- =========================================================================

-- 1. Tutors (Teacher accounts linked to auth.users)
CREATE TABLE IF NOT EXISTS tutors (
    id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
    full_name TEXT,
    email TEXT,
    bio TEXT,
    hourly_rate DECIMAL(10, 2),
    subjects TEXT[],
    created_at TIMESTAMP DEFAULT NOW()
);

-- 2. Student Profiles (Student accounts linked to auth.users)
CREATE TABLE IF NOT EXISTS student_profiles (
    id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
    full_name TEXT NOT NULL,
    grade_level TEXT,
    parent_email TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- 3. Classes (Teacher-managed class groups)
CREATE TABLE IF NOT EXISTS classes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    teacher_id UUID REFERENCES auth.users ON DELETE CASCADE,
    name TEXT NOT NULL,
    join_code TEXT UNIQUE NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
);

-- 4. Lessons (Content created by tutors)
CREATE TABLE IF NOT EXISTS lessons (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tutor_id UUID REFERENCES tutors(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    thumbnail_url TEXT,
    subject TEXT,
    grade_level TEXT,
    difficulty TEXT CHECK (difficulty IN ('Beginner', 'Intermediate', 'Advanced')),
    tags TEXT[] DEFAULT '{}',
    view_count INTEGER DEFAULT 0,
    is_published BOOLEAN DEFAULT false,
    file_url TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_lessons_tags ON lessons USING GIN(tags);
CREATE INDEX IF NOT EXISTS idx_lessons_view_count ON lessons(view_count DESC);

-- 5. Slides (Content blocks inside a lesson)
CREATE TABLE IF NOT EXISTS slides (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    lesson_id UUID REFERENCES lessons(id) ON DELETE CASCADE,
    order_index INTEGER NOT NULL,
    -- 'video' kept for backward compatibility with older lesson content.
    type TEXT DEFAULT 'blank' CHECK (type IN ('blank', 'image', 'quiz', 'poll', 'video', 'shout_it_out', 'youtube', 'quran', 'hadith', 'fiqh')),
    content JSONB DEFAULT '{}',       -- e.g. { question, options, url, caption }
    drawing_data JSONB DEFAULT '{}',  -- tldraw whiteboard snapshot
    created_at TIMESTAMP DEFAULT NOW()
);

-- 6. Active Sessions (Live classroom sessions)
CREATE TABLE IF NOT EXISTS active_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    lesson_id UUID REFERENCES lessons(id) ON DELETE CASCADE,
    tutor_id UUID REFERENCES tutors(id) ON DELETE CASCADE,
    current_slide_id UUID REFERENCES slides(id),
    code TEXT UNIQUE NOT NULL,  -- 6-character join code
    room_url TEXT,              -- Unique LiveKit room URL for this session
    is_active BOOLEAN DEFAULT true,
    started_at TIMESTAMP DEFAULT NOW(),
    ended_at TIMESTAMP
);

-- 7. Session Participants (Students who joined a live session)
CREATE TABLE IF NOT EXISTS session_participants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID REFERENCES active_sessions(id) ON DELETE CASCADE,
    student_id UUID REFERENCES student_profiles(id) ON DELETE SET NULL,  -- NULL = guest
    guest_name TEXT,
    joined_at TIMESTAMP DEFAULT NOW()
);

-- 8. Responses (Answers to quizzes, polls, shout-it-out)
CREATE TABLE IF NOT EXISTS responses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID REFERENCES active_sessions(id) ON DELETE CASCADE,
    slide_id UUID REFERENCES slides(id) ON DELETE CASCADE,
    student_id UUID REFERENCES student_profiles(id) ON DELETE SET NULL,
    answer TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
);

-- 9. Enrollments (Student <-> Tutor relationship)
CREATE TABLE IF NOT EXISTS enrollments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID REFERENCES student_profiles(id) ON DELETE CASCADE,
    tutor_id UUID REFERENCES tutors(id) ON DELETE CASCADE,
    enrolled_at TIMESTAMP DEFAULT NOW(),
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'paused', 'completed')),
    UNIQUE(student_id, tutor_id)
);

-- 10. Lesson Progress
CREATE TABLE IF NOT EXISTS lesson_progress (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID REFERENCES student_profiles(id) ON DELETE CASCADE,
    lesson_id UUID REFERENCES lessons(id) ON DELETE CASCADE,
    status TEXT DEFAULT 'not_started' CHECK (status IN ('not_started', 'in_progress', 'completed')),
    progress_percent INTEGER DEFAULT 0 CHECK (progress_percent >= 0 AND progress_percent <= 100),
    completed_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(student_id, lesson_id)
);

-- 11. Tutor Availability (Weekly schedule)
CREATE TABLE IF NOT EXISTS tutor_availability (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tutor_id UUID REFERENCES tutors(id) ON DELETE CASCADE,
    day_of_week INTEGER CHECK (day_of_week >= 0 AND day_of_week <= 6),  -- 0=Sun, 6=Sat
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW()
);

-- 12. Bookings
CREATE TABLE IF NOT EXISTS bookings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID REFERENCES student_profiles(id) ON DELETE CASCADE,
    tutor_id UUID REFERENCES tutors(id) ON DELETE CASCADE,
    booking_date DATE NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'completed', 'cancelled')),
    room_url TEXT,              -- LiveKit room name for confirmed sessions
    notes TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Performance indexes
CREATE INDEX IF NOT EXISTS idx_enrollments_student       ON enrollments(student_id);
CREATE INDEX IF NOT EXISTS idx_enrollments_tutor         ON enrollments(tutor_id);
CREATE INDEX IF NOT EXISTS idx_lesson_progress_student   ON lesson_progress(student_id);
CREATE INDEX IF NOT EXISTS idx_lesson_progress_lesson    ON lesson_progress(lesson_id);
CREATE INDEX IF NOT EXISTS idx_tutor_availability_tutor  ON tutor_availability(tutor_id);
CREATE INDEX IF NOT EXISTS idx_bookings_student          ON bookings(student_id);
CREATE INDEX IF NOT EXISTS idx_bookings_tutor            ON bookings(tutor_id);
CREATE INDEX IF NOT EXISTS idx_bookings_date             ON bookings(booking_date);


-- =========================================================================
-- SECTION 2: TRIGGERS
-- =========================================================================

-- Automatically creates a student_profile row when a new user signs up
-- via the student portal (identified by 'full_name' in their auth metadata).
-- Runs as SECURITY DEFINER to bypass RLS during the auth callback.
CREATE OR REPLACE FUNCTION public.handle_new_student()
RETURNS trigger AS $$
BEGIN
  IF new.raw_user_meta_data->>'full_name' IS NOT NULL THEN
      INSERT INTO public.student_profiles (id, full_name, grade_level, parent_email)
      VALUES (
        new.id,
        new.raw_user_meta_data->>'full_name',
        new.raw_user_meta_data->>'grade_level',
        new.raw_user_meta_data->>'parent_email'
      )
      ON CONFLICT (id) DO NOTHING;
  END IF;
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_student();


-- =========================================================================
-- SECTION 3: ROW LEVEL SECURITY (RLS)
-- =========================================================================

-- Drop all existing policies safely to allow idempotent re-runs
DO $$
BEGIN
    BEGIN DROP POLICY IF EXISTS "Tutors manage their own profile" ON tutors; EXCEPTION WHEN OTHERS THEN END;
    BEGIN DROP POLICY IF EXISTS "Teachers manage their own classes" ON classes; EXCEPTION WHEN OTHERS THEN END;
    BEGIN DROP POLICY IF EXISTS "Anyone can view classes" ON classes; EXCEPTION WHEN OTHERS THEN END;
    BEGIN DROP POLICY IF EXISTS "Tutors manage their own lessons" ON lessons; EXCEPTION WHEN OTHERS THEN END;
    BEGIN DROP POLICY IF EXISTS "Anyone can view published lessons" ON lessons; EXCEPTION WHEN OTHERS THEN END;
    BEGIN DROP POLICY IF EXISTS "Tutors manage their slides" ON slides; EXCEPTION WHEN OTHERS THEN END;
    BEGIN DROP POLICY IF EXISTS "Students can read slides in active sessions" ON slides; EXCEPTION WHEN OTHERS THEN END;
    BEGIN DROP POLICY IF EXISTS "Anyone can view active sessions by code" ON active_sessions; EXCEPTION WHEN OTHERS THEN END;
    BEGIN DROP POLICY IF EXISTS "Tutors manage their sessions" ON active_sessions; EXCEPTION WHEN OTHERS THEN END;
    BEGIN DROP POLICY IF EXISTS "Tutors can end their sessions" ON active_sessions; EXCEPTION WHEN OTHERS THEN END;
    BEGIN DROP POLICY IF EXISTS "Anyone can join a session" ON session_participants; EXCEPTION WHEN OTHERS THEN END;
    BEGIN DROP POLICY IF EXISTS "View participants in same session" ON session_participants; EXCEPTION WHEN OTHERS THEN END;
    BEGIN DROP POLICY IF EXISTS "Anyone can insert responses" ON responses; EXCEPTION WHEN OTHERS THEN END;
    BEGIN DROP POLICY IF EXISTS "Anyone can view responses" ON responses; EXCEPTION WHEN OTHERS THEN END;
    BEGIN DROP POLICY IF EXISTS "Anyone can view student profiles" ON student_profiles; EXCEPTION WHEN OTHERS THEN END;
    BEGIN DROP POLICY IF EXISTS "Users can insert their own profile" ON student_profiles; EXCEPTION WHEN OTHERS THEN END;
    BEGIN DROP POLICY IF EXISTS "Users can update their own profile" ON student_profiles; EXCEPTION WHEN OTHERS THEN END;
    BEGIN DROP POLICY IF EXISTS "Students can view their enrollments" ON enrollments; EXCEPTION WHEN OTHERS THEN END;
    BEGIN DROP POLICY IF EXISTS "Students can create enrollments" ON enrollments; EXCEPTION WHEN OTHERS THEN END;
    BEGIN DROP POLICY IF EXISTS "Admins can manage all enrollments" ON enrollments; EXCEPTION WHEN OTHERS THEN END;
    BEGIN DROP POLICY IF EXISTS "Students can view their progress" ON lesson_progress; EXCEPTION WHEN OTHERS THEN END;
    BEGIN DROP POLICY IF EXISTS "Students can update their progress" ON lesson_progress; EXCEPTION WHEN OTHERS THEN END;
    BEGIN DROP POLICY IF EXISTS "Anyone can view tutor availability" ON tutor_availability; EXCEPTION WHEN OTHERS THEN END;
    BEGIN DROP POLICY IF EXISTS "Admins can manage availability" ON tutor_availability; EXCEPTION WHEN OTHERS THEN END;
    BEGIN DROP POLICY IF EXISTS "Students can view their bookings" ON bookings; EXCEPTION WHEN OTHERS THEN END;
    BEGIN DROP POLICY IF EXISTS "Students can create bookings" ON bookings; EXCEPTION WHEN OTHERS THEN END;
    BEGIN DROP POLICY IF EXISTS "Students can update their bookings" ON bookings; EXCEPTION WHEN OTHERS THEN END;
    BEGIN DROP POLICY IF EXISTS "Tutors can view their bookings" ON bookings; EXCEPTION WHEN OTHERS THEN END;
    BEGIN DROP POLICY IF EXISTS "Tutors can update their bookings" ON bookings; EXCEPTION WHEN OTHERS THEN END;
    BEGIN DROP POLICY IF EXISTS "Admins can manage all bookings" ON bookings; EXCEPTION WHEN OTHERS THEN END;
END $$;

-- Enable RLS on all tables
ALTER TABLE tutors               ENABLE ROW LEVEL SECURITY;
ALTER TABLE student_profiles     ENABLE ROW LEVEL SECURITY;
ALTER TABLE classes              ENABLE ROW LEVEL SECURITY;
ALTER TABLE lessons              ENABLE ROW LEVEL SECURITY;
ALTER TABLE slides               ENABLE ROW LEVEL SECURITY;
ALTER TABLE active_sessions      ENABLE ROW LEVEL SECURITY;
ALTER TABLE session_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE responses            ENABLE ROW LEVEL SECURITY;
ALTER TABLE enrollments          ENABLE ROW LEVEL SECURITY;
ALTER TABLE lesson_progress      ENABLE ROW LEVEL SECURITY;
ALTER TABLE tutor_availability   ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings             ENABLE ROW LEVEL SECURITY;

-- Tutors
CREATE POLICY "Tutors manage their own profile" ON tutors
    USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

-- Classes
CREATE POLICY "Teachers manage their own classes" ON classes
    USING (auth.uid() = teacher_id) WITH CHECK (auth.uid() = teacher_id);
CREATE POLICY "Anyone can view classes" ON classes FOR SELECT USING (true);

-- Lessons
CREATE POLICY "Tutors manage their own lessons" ON lessons
    USING (auth.uid() = tutor_id) WITH CHECK (auth.uid() = tutor_id);
CREATE POLICY "Anyone can view published lessons" ON lessons
    FOR SELECT USING (is_published = true);

-- Slides
CREATE POLICY "Tutors manage their slides" ON slides
    USING (EXISTS (SELECT 1 FROM lessons WHERE lessons.id = slides.lesson_id AND lessons.tutor_id = auth.uid()))
    WITH CHECK (EXISTS (SELECT 1 FROM lessons WHERE lessons.id = slides.lesson_id AND lessons.tutor_id = auth.uid()));
CREATE POLICY "Students can read slides in active sessions" ON slides
    FOR SELECT USING (
        EXISTS (SELECT 1 FROM active_sessions s WHERE s.lesson_id = slides.lesson_id AND s.is_active = true)
    );

-- Active Sessions
CREATE POLICY "Anyone can view active sessions by code" ON active_sessions FOR SELECT USING (true);
CREATE POLICY "Tutors manage their sessions" ON active_sessions
    FOR INSERT WITH CHECK (auth.uid() = tutor_id);
CREATE POLICY "Tutors can end their sessions" ON active_sessions
    FOR UPDATE USING (auth.uid() = tutor_id);

-- Session Participants
CREATE POLICY "Anyone can join a session" ON session_participants FOR INSERT WITH CHECK (true);
CREATE POLICY "View participants in same session" ON session_participants FOR SELECT USING (true);

-- Responses
CREATE POLICY "Anyone can insert responses" ON responses FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can view responses" ON responses
    FOR SELECT
    USING (
        auth.uid() = student_id
        OR auth.uid() = (
            SELECT tutor_id 
            FROM active_sessions 
            WHERE active_sessions.id = responses.session_id
        )
    );

-- Student Profiles (inserts handled by trigger, but policy kept for direct inserts)
CREATE POLICY "Anyone can view student profiles" ON student_profiles FOR SELECT USING (true);
CREATE POLICY "Users can insert their own profile" ON student_profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "Users can update their own profile" ON student_profiles FOR UPDATE USING (auth.uid() = id);

-- Enrollments
CREATE POLICY "Students can view their enrollments" ON enrollments FOR SELECT USING (auth.uid() = student_id);
CREATE POLICY "Students can create enrollments" ON enrollments FOR INSERT WITH CHECK (auth.uid() = student_id);
CREATE POLICY "Admins can manage all enrollments" ON enrollments FOR ALL USING (auth.jwt() -> 'app_metadata' ->> 'role' = 'admin');

-- Lesson Progress
CREATE POLICY "Students can view their progress" ON lesson_progress FOR SELECT USING (auth.uid() = student_id);
CREATE POLICY "Students can update their progress" ON lesson_progress FOR ALL USING (auth.uid() = student_id);

-- Tutor Availability
CREATE POLICY "Anyone can view tutor availability" ON tutor_availability FOR SELECT USING (true);
CREATE POLICY "Admins can manage availability" ON tutor_availability FOR ALL USING (auth.jwt() -> 'app_metadata' ->> 'role' = 'admin');

-- Bookings
CREATE POLICY "Students can view their bookings" ON bookings FOR SELECT USING (auth.uid() = student_id);
CREATE POLICY "Students can create bookings" ON bookings FOR INSERT WITH CHECK (auth.uid() = student_id);
CREATE POLICY "Students can update their bookings" ON bookings FOR UPDATE USING (auth.uid() = student_id);
CREATE POLICY "Tutors can view their bookings" ON bookings FOR SELECT USING (auth.uid() = tutor_id);
CREATE POLICY "Tutors can update their bookings" ON bookings FOR UPDATE USING (auth.uid() = tutor_id);
CREATE POLICY "Admins can manage all bookings" ON bookings FOR ALL USING (auth.jwt() -> 'app_metadata' ->> 'role' = 'admin');


-- =========================================================================
-- SECTION 4: STORAGE (Manual steps in Supabase Dashboard)
-- =========================================================================
-- 1. Go to Storage → Create a new PUBLIC bucket named: lesson-materials
-- 2. Set bucket policies:
--      INSERT: Authenticated users only (teachers uploading lesson files)
--      SELECT: Public (anyone can view/download lesson materials)
-- =========================================================================

-- DONE ✅
