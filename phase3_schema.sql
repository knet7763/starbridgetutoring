-- Phase 3 Database Schema
-- Student portal, booking system, and progress tracking

-- 1. Student profiles (extends Supabase auth.users)
CREATE TABLE IF NOT EXISTS student_profiles (
    id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
    full_name TEXT NOT NULL,
    grade_level TEXT,
    parent_email TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- 2. Enrollments (student ↔ tutor relationship)
CREATE TABLE IF NOT EXISTS enrollments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID REFERENCES student_profiles(id) ON DELETE CASCADE,
    tutor_id UUID REFERENCES tutors(id) ON DELETE CASCADE,
    enrolled_at TIMESTAMP DEFAULT NOW(),
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'paused', 'completed')),
    UNIQUE(student_id, tutor_id)
);

-- 3. Lesson progress tracking
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

-- 4. Tutor availability (weekly schedule)
CREATE TABLE IF NOT EXISTS tutor_availability (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tutor_id UUID REFERENCES tutors(id) ON DELETE CASCADE,
    day_of_week INTEGER CHECK (day_of_week >= 0 AND day_of_week <= 6), -- 0=Sunday, 6=Saturday
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW()
);

-- 5. Bookings
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

ALTER TABLE bookings ADD COLUMN IF NOT EXISTS room_url TEXT;

-- Indexes for better performance
CREATE INDEX IF NOT EXISTS idx_enrollments_student ON enrollments(student_id);
CREATE INDEX IF NOT EXISTS idx_enrollments_tutor ON enrollments(tutor_id);
CREATE INDEX IF NOT EXISTS idx_lesson_progress_student ON lesson_progress(student_id);
CREATE INDEX IF NOT EXISTS idx_lesson_progress_lesson ON lesson_progress(lesson_id);
CREATE INDEX IF NOT EXISTS idx_tutor_availability_tutor ON tutor_availability(tutor_id);
CREATE INDEX IF NOT EXISTS idx_bookings_student ON bookings(student_id);
CREATE INDEX IF NOT EXISTS idx_bookings_tutor ON bookings(tutor_id);
CREATE INDEX IF NOT EXISTS idx_bookings_date ON bookings(booking_date);

-- Row Level Security (RLS) Policies

-- Student profiles: Users can read all profiles, but only update their own
ALTER TABLE student_profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view student profiles" ON student_profiles;
CREATE POLICY "Anyone can view student profiles" ON student_profiles
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can insert their own profile" ON student_profiles;
CREATE POLICY "Users can insert their own profile" ON student_profiles
    FOR INSERT WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update their own profile" ON student_profiles;
CREATE POLICY "Users can update their own profile" ON student_profiles
    FOR UPDATE USING (auth.uid() = id);

-- Enrollments: Students can view their own, admins can manage all
ALTER TABLE enrollments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Students can view their enrollments" ON enrollments;
CREATE POLICY "Students can view their enrollments" ON enrollments
    FOR SELECT USING (auth.uid() = student_id);

DROP POLICY IF EXISTS "Admins can manage all enrollments" ON enrollments;
CREATE POLICY "Admins can manage all enrollments" ON enrollments
    FOR ALL USING (auth.jwt() -> 'app_metadata' ->> 'role' = 'admin');

-- Lesson progress: Students can view and update their own
ALTER TABLE lesson_progress ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Students can view their progress" ON lesson_progress;
CREATE POLICY "Students can view their progress" ON lesson_progress
    FOR SELECT USING (auth.uid() = student_id);

DROP POLICY IF EXISTS "Students can update their progress" ON lesson_progress;
CREATE POLICY "Students can update their progress" ON lesson_progress
    FOR ALL USING (auth.uid() = student_id);

-- Tutor availability: Public read, admin write
ALTER TABLE tutor_availability ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view tutor availability" ON tutor_availability;
CREATE POLICY "Anyone can view tutor availability" ON tutor_availability
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "Admins can manage availability" ON tutor_availability;
CREATE POLICY "Admins can manage availability" ON tutor_availability
    FOR ALL USING (auth.jwt() -> 'app_metadata' ->> 'role' = 'admin');

-- Bookings: Students can view/create their own, tutors can view theirs
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Students can view their bookings" ON bookings;
CREATE POLICY "Students can view their bookings" ON bookings
    FOR SELECT USING (auth.uid() = student_id);

DROP POLICY IF EXISTS "Students can create bookings" ON bookings;
CREATE POLICY "Students can create bookings" ON bookings
    FOR INSERT WITH CHECK (auth.uid() = student_id);

DROP POLICY IF EXISTS "Students can update their bookings" ON bookings;
CREATE POLICY "Students can update their bookings" ON bookings
    FOR UPDATE USING (auth.uid() = student_id);

DROP POLICY IF EXISTS "Tutors can view their bookings" ON bookings;
CREATE POLICY "Tutors can view their bookings" ON bookings
    FOR SELECT USING (auth.uid() = tutor_id);

DROP POLICY IF EXISTS "Tutors can update their bookings" ON bookings;
CREATE POLICY "Tutors can update their bookings" ON bookings
    FOR UPDATE USING (auth.uid() = tutor_id);

DROP POLICY IF EXISTS "Students can update their bookings" ON bookings;
CREATE POLICY "Students can update their bookings" ON bookings
    FOR UPDATE USING (auth.uid() = student_id);

DROP POLICY IF EXISTS "Admins can manage all bookings" ON bookings;
CREATE POLICY "Admins can manage all bookings" ON bookings
    FOR ALL USING (auth.jwt() -> 'app_metadata' ->> 'role' = 'admin');
