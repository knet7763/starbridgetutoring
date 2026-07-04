-- =========================================================================
-- MASTER SCHEMA FOR STARBRIDGE TUTORING
-- Combines MVP Framework, Schema Updates, Phase 3 Student Portal,
-- Security Audit policies, Performance Indexes, Functions, and Seed Data.
-- Run this script in your Supabase project's SQL Editor (https://supabase.com).
-- =========================================================================

-- =====================================
-- PART 1: CORE TABLES
-- =====================================

-- 0. Tutors Table
CREATE TABLE IF NOT EXISTS tutors (
    id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
    name TEXT,
    subject TEXT,
    bio TEXT,
    qualification TEXT,
    image_url TEXT,
    languages TEXT[],
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- 1. Lessons Table (Created by Teachers/Tutors)
CREATE TABLE IF NOT EXISTS lessons (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tutor_id UUID REFERENCES tutors(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    thumbnail_url TEXT,
    is_published BOOLEAN DEFAULT false,
    tags TEXT[] DEFAULT '{}',
    view_count INTEGER DEFAULT 0,
    difficulty TEXT CHECK (difficulty IN ('Beginner', 'Intermediate', 'Advanced')),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- 2. Slides Table (Content for Lessons)
CREATE TABLE IF NOT EXISTS slides (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    lesson_id UUID REFERENCES lessons(id) ON DELETE CASCADE,
    order_index INTEGER NOT NULL,
    type TEXT DEFAULT 'blank' CHECK (type IN ('blank', 'image', 'quiz', 'poll', 'video', 'shout_it_out', 'youtube', 'quran', 'hadith', 'fiqh')),
    content JSONB DEFAULT '{}',
    drawing_data JSONB DEFAULT '{}',
    created_at TIMESTAMP DEFAULT NOW()
);

-- 3. Student Profiles (Extends Supabase auth.users)
CREATE TABLE IF NOT EXISTS student_profiles (
    id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
    full_name TEXT NOT NULL,
    grade_level TEXT,
    parent_email TEXT,
    stars INTEGER DEFAULT 0,
    total_stars INTEGER DEFAULT 0,
    deleted_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- 4. Active Sessions (Live Classes)
CREATE TABLE IF NOT EXISTS active_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    lesson_id UUID REFERENCES lessons(id) ON DELETE CASCADE,
    tutor_id UUID REFERENCES tutors(id) ON DELETE CASCADE,
    current_slide_id UUID REFERENCES slides(id),
    code TEXT UNIQUE NOT NULL,
    room_url TEXT,
    is_active BOOLEAN DEFAULT true,
    started_at TIMESTAMP DEFAULT NOW(),
    ended_at TIMESTAMP
);

-- 5. Session Participants (Students in a class)
CREATE TABLE IF NOT EXISTS session_participants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID REFERENCES active_sessions(id) ON DELETE CASCADE,
    student_id UUID REFERENCES student_profiles(id) ON DELETE SET NULL,
    guest_name TEXT,
    stars_earned INTEGER DEFAULT 0,
    joined_at TIMESTAMP DEFAULT NOW()
);

-- 6. Responses Table (For Shout It Out, Quizzes, Polls)
CREATE TABLE IF NOT EXISTS responses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID REFERENCES active_sessions(id) ON DELETE CASCADE,
    slide_id UUID REFERENCES slides(id) ON DELETE CASCADE,
    student_id UUID REFERENCES student_profiles(id) ON DELETE SET NULL,
    answer TEXT NOT NULL,
    is_correct BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT NOW()
);

-- 7. Enrollments (Student ↔ Tutor relationship)
CREATE TABLE IF NOT EXISTS enrollments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID REFERENCES student_profiles(id) ON DELETE CASCADE,
    tutor_id UUID REFERENCES tutors(id) ON DELETE CASCADE,
    enrolled_at TIMESTAMP DEFAULT NOW(),
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'paused', 'completed')),
    payment_status TEXT DEFAULT 'pending',
    payment_link TEXT,
    deleted_at TIMESTAMP WITH TIME ZONE,
    UNIQUE(student_id, tutor_id)
);

-- 8. Lesson Progress Tracking
CREATE TABLE IF NOT EXISTS lesson_progress (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID REFERENCES student_profiles(id) ON DELETE CASCADE,
    lesson_id UUID REFERENCES lessons(id) ON DELETE CASCADE,
    status TEXT DEFAULT 'not_started' CHECK (status IN ('not_started', 'in_progress', 'completed')),
    progress_percent INTEGER DEFAULT 0 CHECK (progress_percent >= 0 AND progress_percent <= 100),
    completed_at TIMESTAMP,
    feedback_notes TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(student_id, lesson_id)
);

-- 9. Tutor Availability (Weekly Schedule)
CREATE TABLE IF NOT EXISTS tutor_availability (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tutor_id UUID REFERENCES tutors(id) ON DELETE CASCADE,
    day_of_week INTEGER CHECK (day_of_week >= 0 AND day_of_week <= 6), -- 0=Sunday, 6=Saturday
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW()
);

-- 10. Bookings
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
    deleted_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- 11. Badges
CREATE TABLE IF NOT EXISTS badges (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    description TEXT,
    icon_url TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

-- 12. Student Badges
CREATE TABLE IF NOT EXISTS student_badges (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID REFERENCES student_profiles(id) ON DELETE CASCADE,
    badge_id UUID REFERENCES badges(id) ON DELETE CASCADE,
    awarded_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(student_id, badge_id)
);

-- 13. Trial Requests
CREATE TABLE IF NOT EXISTS trial_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    parent_name TEXT NOT NULL,
    student_name TEXT NOT NULL,
    email TEXT NOT NULL,
    phone TEXT NOT NULL,
    grade_level TEXT,
    subject TEXT,
    status TEXT DEFAULT 'pending', -- pending, contacted, scheduled, completed
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================
-- SCHEMA SAFETY ALTERATIONS (Upgrades)
-- =====================================

DO $$ 
BEGIN 
    -- lessons
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'lessons' AND column_name = 'tutor_id') THEN
        ALTER TABLE lessons ADD COLUMN tutor_id UUID REFERENCES tutors(id) ON DELETE CASCADE;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'lessons' AND column_name = 'is_published') THEN
        ALTER TABLE lessons ADD COLUMN is_published BOOLEAN DEFAULT false;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'lessons' AND column_name = 'tags') THEN
        ALTER TABLE lessons ADD COLUMN tags TEXT[] DEFAULT '{}';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'lessons' AND column_name = 'view_count') THEN
        ALTER TABLE lessons ADD COLUMN view_count INTEGER DEFAULT 0;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'lessons' AND column_name = 'difficulty') THEN
        ALTER TABLE lessons ADD COLUMN difficulty TEXT CHECK (difficulty IN ('Beginner', 'Intermediate', 'Advanced'));
    END IF;
    
    -- student_profiles
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'student_profiles' AND column_name = 'stars') THEN
        ALTER TABLE student_profiles ADD COLUMN stars INTEGER DEFAULT 0;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'student_profiles' AND column_name = 'total_stars') THEN
        ALTER TABLE student_profiles ADD COLUMN total_stars INTEGER DEFAULT 0;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'student_profiles' AND column_name = 'deleted_at') THEN
        ALTER TABLE student_profiles ADD COLUMN deleted_at TIMESTAMP WITH TIME ZONE;
    END IF;

    -- active_sessions
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'active_sessions' AND column_name = 'room_url') THEN
        ALTER TABLE active_sessions ADD COLUMN room_url TEXT;
    END IF;

    -- session_participants
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'session_participants' AND column_name = 'stars_earned') THEN
        ALTER TABLE session_participants ADD COLUMN stars_earned INTEGER DEFAULT 0;
    END IF;

    -- responses
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'responses' AND column_name = 'is_correct') THEN
        ALTER TABLE responses ADD COLUMN is_correct BOOLEAN DEFAULT false;
    END IF;

    -- enrollments
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'enrollments' AND column_name = 'payment_status') THEN
        ALTER TABLE enrollments ADD COLUMN payment_status TEXT DEFAULT 'pending';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'enrollments' AND column_name = 'payment_link') THEN
        ALTER TABLE enrollments ADD COLUMN payment_link TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'enrollments' AND column_name = 'deleted_at') THEN
        ALTER TABLE enrollments ADD COLUMN deleted_at TIMESTAMP WITH TIME ZONE;
    END IF;

    -- bookings
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'bookings' AND column_name = 'room_url') THEN
        ALTER TABLE bookings ADD COLUMN room_url TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'bookings' AND column_name = 'deleted_at') THEN
        ALTER TABLE bookings ADD COLUMN deleted_at TIMESTAMP WITH TIME ZONE;
    END IF;
END $$;

DO $$ 
DECLARE
    const_name text;
BEGIN
    SELECT constraint_name INTO const_name
    FROM information_schema.table_constraints
    WHERE table_schema = current_schema() AND table_name = 'slides' AND constraint_type = 'CHECK';

    IF const_name IS NOT NULL THEN
        EXECUTE 'ALTER TABLE slides DROP CONSTRAINT ' || const_name;
    END IF;
    
    ALTER TABLE slides ADD CONSTRAINT slides_type_check CHECK (type IN ('blank', 'image', 'quiz', 'poll', 'video', 'shout_it_out', 'youtube', 'quran', 'hadith', 'fiqh'));
END $$;

-- =====================================
-- PART 2: FUNCTIONS & TRIGGERS
-- =====================================

-- Trigger Function: Auto-populate student profiles on user registration
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
      );
  END IF;
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Bind User Registration Trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_student();

-- Helper Function: Soft delete database records
CREATE OR REPLACE FUNCTION public.soft_delete_record(table_name TEXT, record_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
    query_str TEXT;
BEGIN
    query_str := format('UPDATE public.%I SET deleted_at = NOW() WHERE id = %L', table_name, record_id);
    EXECUTE query_str;
    RETURN TRUE;
EXCEPTION WHEN OTHERS THEN
    RETURN FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION public.soft_delete_record IS 'Safely marks a record as soft-deleted without physically removing it from the database.';

-- =====================================
-- PART 3: PERFORMANCE INDEXES
-- =====================================

-- Lessons table
CREATE INDEX IF NOT EXISTS idx_lessons_tutor_id ON public.lessons(tutor_id);
CREATE INDEX IF NOT EXISTS idx_lessons_tags ON public.lessons USING GIN(tags);
CREATE INDEX IF NOT EXISTS idx_lessons_subject ON public.lessons(subject);
CREATE INDEX IF NOT EXISTS idx_lessons_view_count ON public.lessons(view_count DESC);

-- Slides table
CREATE INDEX IF NOT EXISTS idx_slides_lesson_id ON public.slides(lesson_id);

-- Active Sessions table
CREATE INDEX IF NOT EXISTS idx_active_sessions_lesson_id ON public.active_sessions(lesson_id);
CREATE INDEX IF NOT EXISTS idx_active_sessions_tutor_id ON public.active_sessions(tutor_id);
CREATE INDEX IF NOT EXISTS idx_active_sessions_current_slide_id ON public.active_sessions(current_slide_id);

-- Session Participants table
CREATE INDEX IF NOT EXISTS idx_session_participants_session_id ON public.session_participants(session_id);
CREATE INDEX IF NOT EXISTS idx_session_participants_student_id ON public.session_participants(student_id);

-- Responses table
CREATE INDEX IF NOT EXISTS idx_responses_session_id ON public.responses(session_id);
CREATE INDEX IF NOT EXISTS idx_responses_slide_id ON public.responses(slide_id);
CREATE INDEX IF NOT EXISTS idx_responses_student_id ON public.responses(student_id);

-- Enrollments table
CREATE INDEX IF NOT EXISTS idx_enrollments_student ON public.enrollments(student_id);
CREATE INDEX IF NOT EXISTS idx_enrollments_tutor ON public.enrollments(tutor_id);

-- Lesson Progress table
CREATE INDEX IF NOT EXISTS idx_lesson_progress_student ON public.lesson_progress(student_id);
CREATE INDEX IF NOT EXISTS idx_lesson_progress_lesson ON public.lesson_progress(lesson_id);

-- Tutor Availability table
CREATE INDEX IF NOT EXISTS idx_tutor_availability_tutor ON public.tutor_availability(tutor_id);

-- Bookings table
CREATE INDEX IF NOT EXISTS idx_bookings_student ON public.bookings(student_id);
CREATE INDEX IF NOT EXISTS idx_bookings_tutor ON public.bookings(tutor_id);
CREATE INDEX IF NOT EXISTS idx_bookings_date ON public.bookings(booking_date);

-- Badges and Student Badges tables
CREATE INDEX IF NOT EXISTS idx_student_badges_student ON public.student_badges(student_id);
CREATE INDEX IF NOT EXISTS idx_student_badges_badge ON public.student_badges(badge_id);

-- =====================================
-- PART 4: ROW LEVEL SECURITY POLICIES
-- =====================================

-- 0. Drop existing policies to prevent clash/duplication
DO $$ 
BEGIN
    -- tutors
    BEGIN DROP POLICY IF EXISTS "Anyone can view tutors" ON public.tutors; EXCEPTION WHEN OTHERS THEN END;
    
    -- student_profiles
    BEGIN DROP POLICY IF EXISTS "Anyone can view student profiles" ON public.student_profiles; EXCEPTION WHEN OTHERS THEN END;
    BEGIN DROP POLICY IF EXISTS "Students can view own profile" ON public.student_profiles; EXCEPTION WHEN OTHERS THEN END;
    BEGIN DROP POLICY IF EXISTS "Tutors can view student profiles of their bookings" ON public.student_profiles; EXCEPTION WHEN OTHERS THEN END;
    BEGIN DROP POLICY IF EXISTS "Admins can view all student profiles" ON public.student_profiles; EXCEPTION WHEN OTHERS THEN END;
    BEGIN DROP POLICY IF EXISTS "Users can insert their own profile" ON public.student_profiles; EXCEPTION WHEN OTHERS THEN END;
    BEGIN DROP POLICY IF EXISTS "Users can update their own profile" ON public.student_profiles; EXCEPTION WHEN OTHERS THEN END;
    
    -- lessons
    BEGIN DROP POLICY IF EXISTS "Tutors manage their own lessons" ON public.lessons; EXCEPTION WHEN OTHERS THEN END;
    
    -- slides
    BEGIN DROP POLICY IF EXISTS "Tutors manage their slides" ON public.slides; EXCEPTION WHEN OTHERS THEN END;
    
    -- active_sessions
    BEGIN DROP POLICY IF EXISTS "Anyone can view active sessions by code" ON public.active_sessions; EXCEPTION WHEN OTHERS THEN END;
    BEGIN DROP POLICY IF EXISTS "Tutors manage their sessions" ON public.active_sessions; EXCEPTION WHEN OTHERS THEN END;
    BEGIN DROP POLICY IF EXISTS "Tutors can view their own sessions" ON public.active_sessions; EXCEPTION WHEN OTHERS THEN END;
    BEGIN DROP POLICY IF EXISTS "Admins can view all active sessions" ON public.active_sessions; EXCEPTION WHEN OTHERS THEN END;
    
    -- session_participants
    BEGIN DROP POLICY IF EXISTS "Anyone can join a session" ON public.session_participants; EXCEPTION WHEN OTHERS THEN END;
    BEGIN DROP POLICY IF EXISTS "View participants in same session" ON public.session_participants; EXCEPTION WHEN OTHERS THEN END;
    
    -- responses
    BEGIN DROP POLICY IF EXISTS "Anyone can insert responses" ON public.responses; EXCEPTION WHEN OTHERS THEN END;
    BEGIN DROP POLICY IF EXISTS "Anyone can view responses" ON public.responses; EXCEPTION WHEN OTHERS THEN END;
    
    -- enrollments
    BEGIN DROP POLICY IF EXISTS "Students can view own active enrollments" ON public.enrollments; EXCEPTION WHEN OTHERS THEN END;
    BEGIN DROP POLICY IF EXISTS "Tutors can view own active enrollments" ON public.enrollments; EXCEPTION WHEN OTHERS THEN END;
    BEGIN DROP POLICY IF EXISTS "Students can view their enrollments" ON public.enrollments; EXCEPTION WHEN OTHERS THEN END;
    BEGIN DROP POLICY IF EXISTS "Tutors can view their enrollments" ON public.enrollments; EXCEPTION WHEN OTHERS THEN END;
    BEGIN DROP POLICY IF EXISTS "Admins can manage all enrollments" ON public.enrollments; EXCEPTION WHEN OTHERS THEN END;
    
    -- lesson_progress
    BEGIN DROP POLICY IF EXISTS "Students can view their progress" ON public.lesson_progress; EXCEPTION WHEN OTHERS THEN END;
    BEGIN DROP POLICY IF EXISTS "Students can update their progress" ON public.lesson_progress; EXCEPTION WHEN OTHERS THEN END;
    
    -- tutor_availability
    BEGIN DROP POLICY IF EXISTS "Anyone can view tutor availability" ON public.tutor_availability; EXCEPTION WHEN OTHERS THEN END;
    BEGIN DROP POLICY IF EXISTS "Admins can manage availability" ON public.tutor_availability; EXCEPTION WHEN OTHERS THEN END;
    
    -- bookings
    BEGIN DROP POLICY IF EXISTS "Students can view their bookings" ON public.bookings; EXCEPTION WHEN OTHERS THEN END;
    BEGIN DROP POLICY IF EXISTS "Students can view own active bookings" ON public.bookings; EXCEPTION WHEN OTHERS THEN END;
    BEGIN DROP POLICY IF EXISTS "Tutors can view own active bookings" ON public.bookings; EXCEPTION WHEN OTHERS THEN END;
    BEGIN DROP POLICY IF EXISTS "Tutors can view their bookings" ON public.bookings; EXCEPTION WHEN OTHERS THEN END;
    BEGIN DROP POLICY IF EXISTS "Students can create bookings" ON public.bookings; EXCEPTION WHEN OTHERS THEN END;
    BEGIN DROP POLICY IF EXISTS "Students can update their bookings" ON public.bookings; EXCEPTION WHEN OTHERS THEN END;
    BEGIN DROP POLICY IF EXISTS "Tutors can update their bookings" ON public.bookings; EXCEPTION WHEN OTHERS THEN END;
    BEGIN DROP POLICY IF EXISTS "Admins can manage all bookings" ON public.bookings; EXCEPTION WHEN OTHERS THEN END;
    
    -- badges & student_badges
    BEGIN DROP POLICY IF EXISTS "Anyone can view badges" ON public.badges; EXCEPTION WHEN OTHERS THEN END;
    BEGIN DROP POLICY IF EXISTS "Admins can manage badges" ON public.badges; EXCEPTION WHEN OTHERS THEN END;
    BEGIN DROP POLICY IF EXISTS "Anyone can view student badges" ON public.student_badges; EXCEPTION WHEN OTHERS THEN END;
    BEGIN DROP POLICY IF EXISTS "Tutors and admins can manage student badges" ON public.student_badges; EXCEPTION WHEN OTHERS THEN END;
    BEGIN DROP POLICY IF EXISTS "Admins can manage student badges" ON public.student_badges; EXCEPTION WHEN OTHERS THEN END;

    -- trial_requests
    BEGIN DROP POLICY IF EXISTS "Admins can view trial requests" ON public.trial_requests; EXCEPTION WHEN OTHERS THEN END;
    BEGIN DROP POLICY IF EXISTS "Anyone can insert trial requests" ON public.trial_requests; EXCEPTION WHEN OTHERS THEN END;
END $$;

-- Enable Row Level Security (RLS)
ALTER TABLE public.tutors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lessons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.slides ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.active_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.session_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lesson_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tutor_availability ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trial_requests ENABLE ROW LEVEL SECURITY;

-- 1. Tutors policies
CREATE POLICY "Anyone can view tutors" ON public.tutors FOR SELECT USING (true);

-- 2. Student profiles policies
CREATE POLICY "Students can view own profile" ON public.student_profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Tutors can view student profiles of their bookings" ON public.student_profiles FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM public.bookings 
        WHERE bookings.student_id = student_profiles.id 
          AND bookings.tutor_id = auth.uid()
    ) OR EXISTS (
        SELECT 1 FROM public.enrollments 
        WHERE enrollments.student_id = student_profiles.id 
          AND enrollments.tutor_id = auth.uid()
    )
);
CREATE POLICY "Admins can view all student profiles" ON public.student_profiles FOR SELECT USING (auth.jwt() -> 'app_metadata' ->> 'role' = 'admin');
CREATE POLICY "Users can insert their own profile" ON public.student_profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "Users can update their own profile" ON public.student_profiles FOR UPDATE USING (auth.uid() = id);

-- 3. Lessons policies
CREATE POLICY "Tutors manage their own lessons" ON public.lessons FOR ALL USING (auth.uid() = tutor_id) WITH CHECK (auth.uid() = tutor_id);

-- 4. Slides policies
CREATE POLICY "Tutors manage their slides" ON public.slides FOR ALL USING (
    EXISTS (SELECT 1 FROM public.lessons WHERE lessons.id = slides.lesson_id AND lessons.tutor_id = auth.uid())
) WITH CHECK (
    EXISTS (SELECT 1 FROM public.lessons WHERE lessons.id = slides.lesson_id AND lessons.tutor_id = auth.uid())
);

-- 5. Active Sessions policies
CREATE POLICY "Anyone can view active sessions by code" ON public.active_sessions FOR SELECT USING (is_active = true);
CREATE POLICY "Tutors can view their own sessions" ON public.active_sessions FOR SELECT USING (auth.uid() = tutor_id);
CREATE POLICY "Admins can view all active sessions" ON public.active_sessions FOR SELECT USING (auth.jwt() -> 'app_metadata' ->> 'role' = 'admin');
CREATE POLICY "Tutors manage their sessions" ON public.active_sessions FOR ALL USING (auth.uid() = tutor_id) WITH CHECK (auth.uid() = tutor_id);

-- 6. Session Participants policies
CREATE POLICY "Anyone can join a session" ON public.session_participants FOR INSERT WITH CHECK (true);
CREATE POLICY "View participants in same session" ON public.session_participants FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM public.active_sessions 
        WHERE active_sessions.id = session_participants.session_id 
          AND (active_sessions.tutor_id = auth.uid() OR auth.jwt() -> 'app_metadata' ->> 'role' = 'admin')
    ) OR EXISTS (
        SELECT 1 FROM public.session_participants AS sp 
        WHERE sp.session_id = session_participants.session_id 
          AND sp.student_id = auth.uid()
    )
);

-- 7. Responses policies
CREATE POLICY "Anyone can insert responses" ON public.responses FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can view responses" ON public.responses FOR SELECT USING (
    auth.uid() = student_id
    OR auth.uid() = (
        SELECT tutor_id 
        FROM public.active_sessions 
        WHERE active_sessions.id = responses.session_id
    )
);

-- 8. Enrollments policies
CREATE POLICY "Students can view own active enrollments" ON public.enrollments FOR SELECT USING (
    auth.uid() = student_id 
    AND deleted_at IS NULL
);
CREATE POLICY "Tutors can view own active enrollments" ON public.enrollments FOR SELECT USING (
    auth.uid() = tutor_id 
    AND deleted_at IS NULL
);
CREATE POLICY "Admins can manage all enrollments" ON public.enrollments FOR ALL USING (auth.jwt() -> 'app_metadata' ->> 'role' = 'admin');

-- 9. Lesson progress policies
CREATE POLICY "Students can view their progress" ON public.lesson_progress FOR SELECT USING (auth.uid() = student_id);
CREATE POLICY "Students can update their progress" ON public.lesson_progress FOR ALL USING (auth.uid() = student_id);

-- 10. Tutor availability policies
CREATE POLICY "Anyone can view tutor availability" ON public.tutor_availability FOR SELECT USING (true);
CREATE POLICY "Admins can manage availability" ON public.tutor_availability FOR ALL USING (auth.jwt() -> 'app_metadata' ->> 'role' = 'admin');

-- 11. Bookings policies
CREATE POLICY "Students can view own active bookings" ON public.bookings FOR SELECT USING (auth.uid() = student_id AND deleted_at IS NULL);
CREATE POLICY "Tutors can view own active bookings" ON public.bookings FOR SELECT USING (auth.uid() = tutor_id AND deleted_at IS NULL);
CREATE POLICY "Students can create bookings" ON public.bookings FOR INSERT WITH CHECK (auth.uid() = student_id);
CREATE POLICY "Students can update their bookings" ON public.bookings FOR UPDATE USING (auth.uid() = student_id);
CREATE POLICY "Tutors can update their bookings" ON public.bookings FOR UPDATE USING (auth.uid() = tutor_id);
CREATE POLICY "Admins can manage all bookings" ON public.bookings FOR ALL USING (auth.jwt() -> 'app_metadata' ->> 'role' = 'admin');

-- 12. Badges policies
CREATE POLICY "Anyone can view badges" ON public.badges FOR SELECT USING (true);
CREATE POLICY "Admins can manage badges" ON public.badges FOR ALL USING (auth.jwt() -> 'app_metadata' ->> 'role' = 'admin');

-- 13. Student Badges policies
CREATE POLICY "Anyone can view student badges" ON public.student_badges FOR SELECT USING (true);
CREATE POLICY "Tutors and admins can manage student badges" ON public.student_badges FOR ALL USING (
    auth.jwt() -> 'app_metadata' ->> 'role' = 'admin' 
    OR EXISTS (SELECT 1 FROM public.tutors WHERE tutors.id = auth.uid())
);

-- 14. Trial Requests policies
CREATE POLICY "Admins can view trial requests" ON public.trial_requests FOR SELECT USING (auth.jwt() -> 'app_metadata' ->> 'role' = 'admin');
CREATE POLICY "Anyone can insert trial requests" ON public.trial_requests FOR INSERT WITH CHECK (true);

-- =====================================
-- PART 5: SEED DATA
-- =====================================

INSERT INTO public.badges (name, description, icon_url) VALUES
('Fastest Finger', 'First to answer a quiz correctly', 'https://img.icons8.com/color/96/flash-light.png'),
('Star Scholar', 'Awarded for participating in 5 lessons', 'https://img.icons8.com/color/96/graduation-cap.png'),
('Helpful Hand', 'Awarded for helpful contributions to the board', 'https://img.icons8.com/color/96/handshake.png'),
('Perfect Attendance', 'Awarded for attending all lessons in a class', 'https://img.icons8.com/color/96/calendar.png')
ON CONFLICT DO NOTHING;
