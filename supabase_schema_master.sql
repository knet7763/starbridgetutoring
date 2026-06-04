-- =========================================================================
-- MASTER SCHEMA FOR STARBRIDGE TUTORING
-- Combines MVP Framework, Schema Updates, and Phase 3 Student Portal
-- Run this script in the Supabase SQL Editor
-- =========================================================================

-- =====================================
-- PART 1: MVP CORE (Users, Lessons, Slides, Real-time)
-- =====================================

-- 0. Tutors Table (Required for Lessons if not already present)
CREATE TABLE IF NOT EXISTS tutors (
    id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
    full_name TEXT,
    email TEXT,
    bio TEXT,
    hourly_rate DECIMAL(10, 2),
    subjects TEXT[],
    created_at TIMESTAMP DEFAULT NOW()
);

-- 1. Lessons Table (Created by Teachers/Tutors)
CREATE TABLE IF NOT EXISTS lessons (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tutor_id UUID REFERENCES tutors(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    thumbnail_url TEXT,
    is_published BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Ensure columns exist if table already existed without them
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'lessons' AND column_name = 'tutor_id') THEN
        ALTER TABLE lessons ADD COLUMN tutor_id UUID REFERENCES tutors(id) ON DELETE CASCADE;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'lessons' AND column_name = 'is_published') THEN
        ALTER TABLE lessons ADD COLUMN is_published BOOLEAN DEFAULT false;
    END IF;
END $$;

-- 2. Slides Table (Content for Lessons)
CREATE TABLE IF NOT EXISTS slides (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    lesson_id UUID REFERENCES lessons(id) ON DELETE CASCADE,
    order_index INTEGER NOT NULL,
    type TEXT DEFAULT 'blank' CHECK (type IN ('blank', 'image', 'quiz', 'poll', 'video', 'shout_it_out', 'youtube', 'quran', 'hadith', 'fiqh')),
    content JSONB DEFAULT '{}', -- Stores generic content (text, image url, quiz data)
    drawing_data JSONB DEFAULT '{}', -- Stores initial whiteboard state
    created_at TIMESTAMP DEFAULT NOW()
);

-- Safely update the slide type constraint if the table already existed with missing types
DO $$ 
DECLARE
    const_name text;
BEGIN
    -- Find the existing check constraint for the 'type' column
    SELECT constraint_name INTO const_name
    FROM information_schema.table_constraints
    WHERE table_schema = current_schema() AND table_name = 'slides' AND constraint_type = 'CHECK';

    IF const_name IS NOT NULL THEN
        EXECUTE 'ALTER TABLE slides DROP CONSTRAINT ' || const_name;
    END IF;
    
    -- Add the updated constraint
    ALTER TABLE slides ADD CONSTRAINT slides_type_check CHECK (type IN ('blank', 'image', 'quiz', 'poll', 'video', 'shout_it_out', 'youtube', 'quran', 'hadith', 'fiqh'));
END $$;

-- 3. Phase 3 Student profiles (extends Supabase auth.users) -- Required before participants
CREATE TABLE IF NOT EXISTS student_profiles (
    id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
    full_name TEXT NOT NULL,
    grade_level TEXT,
    parent_email TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- 4. Active Sessions (Live Classes)
CREATE TABLE IF NOT EXISTS active_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    lesson_id UUID REFERENCES lessons(id) ON DELETE CASCADE,
    tutor_id UUID REFERENCES tutors(id) ON DELETE CASCADE,
    current_slide_id UUID REFERENCES slides(id),
    code TEXT UNIQUE NOT NULL, -- 6-character join code
    room_url TEXT, -- LiveKit room name for this session
    is_active BOOLEAN DEFAULT true,
    started_at TIMESTAMP DEFAULT NOW(),
    ended_at TIMESTAMP
);

-- 5. Session Participants (Students in a class)
CREATE TABLE IF NOT EXISTS session_participants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID REFERENCES active_sessions(id) ON DELETE CASCADE,
    student_id UUID REFERENCES student_profiles(id) ON DELETE SET NULL, -- Optional if guest join allowed
    guest_name TEXT, -- Used if student_id is null
    joined_at TIMESTAMP DEFAULT NOW()
);

-- 6. Responses Table (For Shout It Out, Quizzes, Polls)
CREATE TABLE IF NOT EXISTS responses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID REFERENCES active_sessions(id) ON DELETE CASCADE,
    slide_id UUID REFERENCES slides(id) ON DELETE CASCADE,
    student_id UUID REFERENCES student_profiles(id) ON DELETE SET NULL,
    answer TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Indexes for MVP Core Foreign Keys to improve performance
CREATE INDEX IF NOT EXISTS idx_lessons_tutor_id ON lessons(tutor_id);
CREATE INDEX IF NOT EXISTS idx_slides_lesson_id ON slides(lesson_id);
CREATE INDEX IF NOT EXISTS idx_active_sessions_lesson_id ON active_sessions(lesson_id);
CREATE INDEX IF NOT EXISTS idx_active_sessions_tutor_id ON active_sessions(tutor_id);
CREATE INDEX IF NOT EXISTS idx_active_sessions_current_slide_id ON active_sessions(current_slide_id);
CREATE INDEX IF NOT EXISTS idx_session_participants_session_id ON session_participants(session_id);
CREATE INDEX IF NOT EXISTS idx_session_participants_student_id ON session_participants(student_id);
CREATE INDEX IF NOT EXISTS idx_responses_session_id ON responses(session_id);
CREATE INDEX IF NOT EXISTS idx_responses_slide_id ON responses(slide_id);
CREATE INDEX IF NOT EXISTS idx_responses_student_id ON responses(student_id);

-- MVP RLS Policies

-- Safely Drop Existing Policies to prevent errors on re-runs
DO $$ 
BEGIN
    -- Lessons
    BEGIN DROP POLICY IF EXISTS "Tutors manage their own lessons" ON lessons; EXCEPTION WHEN OTHERS THEN END;
    
    -- Slides
    BEGIN DROP POLICY IF EXISTS "Tutors manage their slides" ON slides; EXCEPTION WHEN OTHERS THEN END;
    
    -- Active Sessions
    BEGIN DROP POLICY IF EXISTS "Anyone can view active sessions by code" ON active_sessions; EXCEPTION WHEN OTHERS THEN END;
    BEGIN DROP POLICY IF EXISTS "Tutors manage their sessions" ON active_sessions; EXCEPTION WHEN OTHERS THEN END;
    
    -- Participants
    BEGIN DROP POLICY IF EXISTS "Anyone can join a session" ON session_participants; EXCEPTION WHEN OTHERS THEN END;
    BEGIN DROP POLICY IF EXISTS "View participants in same session" ON session_participants; EXCEPTION WHEN OTHERS THEN END;
    
    -- Responses
    BEGIN DROP POLICY IF EXISTS "Anyone can insert responses" ON responses; EXCEPTION WHEN OTHERS THEN END;
    BEGIN DROP POLICY IF EXISTS "Anyone can view responses" ON responses; EXCEPTION WHEN OTHERS THEN END;
END $$;

-- Lessons: Tutors see their own, Students see none (until in session)
ALTER TABLE lessons ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Tutors manage their own lessons" ON lessons
    USING (auth.uid() = tutor_id)
    WITH CHECK (auth.uid() = tutor_id);

-- Slides: Same as lessons
ALTER TABLE slides ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Tutors manage their slides" ON slides
    USING (EXISTS (SELECT 1 FROM lessons WHERE lessons.id = slides.lesson_id AND lessons.tutor_id = auth.uid()))
    WITH CHECK (EXISTS (SELECT 1 FROM lessons WHERE lessons.id = slides.lesson_id AND lessons.tutor_id = auth.uid()));

-- Active Sessions: Public read (for joining), Tutor write
ALTER TABLE active_sessions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view active sessions by code" ON active_sessions
    FOR SELECT USING (true); -- Needed for students to find session by code

CREATE POLICY "Tutors manage their sessions" ON active_sessions
    USING (auth.uid() = tutor_id)
    WITH CHECK (auth.uid() = tutor_id);

-- Participants: Public insert (joining), Self view
ALTER TABLE session_participants ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can join a session" ON session_participants
    FOR INSERT WITH CHECK (true);

CREATE POLICY "View participants in same session" ON session_participants
    FOR SELECT USING (true);

-- Responses: Public insert, Public view
ALTER TABLE responses ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can insert responses" ON responses
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Anyone can view responses" ON responses
    FOR SELECT USING (true);

-- =====================================
-- PART 2: DATABASE UPDATES (Tags, Analytics)
-- =====================================

-- Add tags column to lessons table
ALTER TABLE lessons ADD COLUMN IF NOT EXISTS tags TEXT[] DEFAULT '{}';

-- Add view_count column to lessons table
ALTER TABLE lessons ADD COLUMN IF NOT EXISTS view_count INTEGER DEFAULT 0;

-- Add difficulty column to lessons table
ALTER TABLE lessons ADD COLUMN IF NOT EXISTS difficulty TEXT CHECK (difficulty IN ('Beginner', 'Intermediate', 'Advanced'));

-- Create index on tags for faster filtering
CREATE INDEX IF NOT EXISTS idx_lessons_tags ON lessons USING GIN(tags);

-- Create index on view_count for analytics queries
CREATE INDEX IF NOT EXISTS idx_lessons_view_count ON lessons(view_count DESC);


-- =====================================
-- PART 3: PHASE 3 ADVANCED PLATFORM
-- =====================================

-- Enrollments (student ↔ tutor relationship)
CREATE TABLE IF NOT EXISTS enrollments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID REFERENCES student_profiles(id) ON DELETE CASCADE,
    tutor_id UUID REFERENCES tutors(id) ON DELETE CASCADE,
    enrolled_at TIMESTAMP DEFAULT NOW(),
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'paused', 'completed')),
    UNIQUE(student_id, tutor_id)
);

-- Lesson progress tracking
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

-- Tutor availability (weekly schedule)
CREATE TABLE IF NOT EXISTS tutor_availability (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tutor_id UUID REFERENCES tutors(id) ON DELETE CASCADE,
    day_of_week INTEGER CHECK (day_of_week >= 0 AND day_of_week <= 6), -- 0=Sunday, 6=Saturday
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Bookings
CREATE TABLE IF NOT EXISTS bookings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID REFERENCES student_profiles(id) ON DELETE CASCADE,
    tutor_id UUID REFERENCES tutors(id) ON DELETE CASCADE,
    booking_date DATE NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'completed', 'cancelled')),
    room_url TEXT,
    notes TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Indexes for better performance
CREATE INDEX IF NOT EXISTS idx_enrollments_student ON enrollments(student_id);
CREATE INDEX IF NOT EXISTS idx_enrollments_tutor ON enrollments(tutor_id);
CREATE INDEX IF NOT EXISTS idx_lesson_progress_student ON lesson_progress(student_id);
CREATE INDEX IF NOT EXISTS idx_lesson_progress_lesson ON lesson_progress(lesson_id);
CREATE INDEX IF NOT EXISTS idx_tutor_availability_tutor ON tutor_availability(tutor_id);
CREATE INDEX IF NOT EXISTS idx_bookings_student ON bookings(student_id);
CREATE INDEX IF NOT EXISTS idx_bookings_tutor ON bookings(tutor_id);
CREATE INDEX IF NOT EXISTS idx_bookings_date ON bookings(booking_date);

-- Phase 3 Row Level Security (RLS) Policies

-- Safely Drop Existing Phase 3 Policies
DO $$ 
BEGIN
    -- Student profiles
    BEGIN DROP POLICY IF EXISTS "Anyone can view student profiles" ON student_profiles; EXCEPTION WHEN OTHERS THEN END;
    BEGIN DROP POLICY IF EXISTS "Users can insert their own profile" ON student_profiles; EXCEPTION WHEN OTHERS THEN END;
    BEGIN DROP POLICY IF EXISTS "Users can update their own profile" ON student_profiles; EXCEPTION WHEN OTHERS THEN END;
    
    -- Enrollments
    BEGIN DROP POLICY IF EXISTS "Students can view their enrollments" ON enrollments; EXCEPTION WHEN OTHERS THEN END;
    BEGIN DROP POLICY IF EXISTS "Admins can manage all enrollments" ON enrollments; EXCEPTION WHEN OTHERS THEN END;
    
    -- Lesson progress
    BEGIN DROP POLICY IF EXISTS "Students can view their progress" ON lesson_progress; EXCEPTION WHEN OTHERS THEN END;
    BEGIN DROP POLICY IF EXISTS "Students can update their progress" ON lesson_progress; EXCEPTION WHEN OTHERS THEN END;
    
    -- Tutor availability
    BEGIN DROP POLICY IF EXISTS "Anyone can view tutor availability" ON tutor_availability; EXCEPTION WHEN OTHERS THEN END;
    BEGIN DROP POLICY IF EXISTS "Admins can manage availability" ON tutor_availability; EXCEPTION WHEN OTHERS THEN END;
    
    -- Bookings
    BEGIN DROP POLICY IF EXISTS "Students can view their bookings" ON bookings; EXCEPTION WHEN OTHERS THEN END;
    BEGIN DROP POLICY IF EXISTS "Students can create bookings" ON bookings; EXCEPTION WHEN OTHERS THEN END;
    BEGIN DROP POLICY IF EXISTS "Students can update their bookings" ON bookings; EXCEPTION WHEN OTHERS THEN END;
    BEGIN DROP POLICY IF EXISTS "Tutors can view their bookings" ON bookings; EXCEPTION WHEN OTHERS THEN END;
    BEGIN DROP POLICY IF EXISTS "Tutors can update their bookings" ON bookings; EXCEPTION WHEN OTHERS THEN END;
    BEGIN DROP POLICY IF EXISTS "Admins can manage all bookings" ON bookings; EXCEPTION WHEN OTHERS THEN END;
END $$;


-- Student profiles: Users can read all profiles, but only update their own
ALTER TABLE student_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view student profiles" ON student_profiles
    FOR SELECT USING (true);

CREATE POLICY "Users can insert their own profile" ON student_profiles
    FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update their own profile" ON student_profiles
    FOR UPDATE USING (auth.uid() = id);

-- Enrollments: Students can view their own, admins can manage all
ALTER TABLE enrollments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Students can view their enrollments" ON enrollments
    FOR SELECT USING (auth.uid() = student_id);

CREATE POLICY "Admins can manage all enrollments" ON enrollments
    FOR ALL USING (auth.jwt() -> 'app_metadata' ->> 'role' = 'admin');

-- Lesson progress: Students can view and update their own
ALTER TABLE lesson_progress ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Students can view their progress" ON lesson_progress
    FOR SELECT USING (auth.uid() = student_id);

CREATE POLICY "Students can update their progress" ON lesson_progress
    FOR ALL USING (auth.uid() = student_id);

-- Tutor availability: Public read, admin write
ALTER TABLE tutor_availability ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view tutor availability" ON tutor_availability
    FOR SELECT USING (true);

CREATE POLICY "Admins can manage availability" ON tutor_availability
    FOR ALL USING (auth.jwt() -> 'app_metadata' ->> 'role' = 'admin');

-- Bookings: Students can view/create their own, tutors can view theirs
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Students can view their bookings" ON bookings
    FOR SELECT USING (auth.uid() = student_id);

CREATE POLICY "Students can create bookings" ON bookings
    FOR INSERT WITH CHECK (auth.uid() = student_id);

CREATE POLICY "Students can update their bookings" ON bookings
    FOR UPDATE USING (auth.uid() = student_id);

CREATE POLICY "Tutors can view their bookings" ON bookings
    FOR SELECT USING (auth.uid() = tutor_id);

CREATE POLICY "Tutors can update their bookings" ON bookings
    FOR UPDATE USING (auth.uid() = tutor_id);

CREATE POLICY "Admins can manage all bookings" ON bookings
    FOR ALL USING (auth.jwt() -> 'app_metadata' ->> 'role' = 'admin');
