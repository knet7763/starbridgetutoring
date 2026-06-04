-- =========================================================================
-- SPRINT 0 — RLS PATCH
-- Run this in your Supabase project's SQL Editor
-- =========================================================================

-- 1. Allow students to read slides from any active session
--    (Required for ClassroomStudent to fetch lesson slides)
DROP POLICY IF EXISTS "Students can read slides in active sessions" ON slides;
CREATE POLICY "Students can read slides in active sessions" ON slides
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM active_sessions s
            WHERE s.lesson_id = slides.lesson_id
              AND s.is_active = true
        )
    );

-- 2. Ensure slides RLS is enabled (safe if already on)
ALTER TABLE slides ENABLE ROW LEVEL SECURITY;

-- 3. Fix slides type CHECK constraint to include all current lesson slide types
--    This prevents insert failures for those slide types on a fresh schema
DO $$
DECLARE
    const_name text;
BEGIN
    SELECT constraint_name INTO const_name
    FROM information_schema.table_constraints
    WHERE table_schema = current_schema()
      AND table_name = 'slides'
      AND constraint_type = 'CHECK';

    IF const_name IS NOT NULL THEN
        EXECUTE 'ALTER TABLE slides DROP CONSTRAINT ' || const_name;
    END IF;

    ALTER TABLE slides ADD CONSTRAINT slides_type_check
        CHECK (type IN ('blank', 'image', 'quiz', 'poll', 'video', 'shout_it_out', 'youtube', 'quran', 'hadith', 'fiqh'));
END $$;

ALTER TABLE active_sessions ADD COLUMN IF NOT EXISTS room_url TEXT;

-- 4. classes table — create if it doesn't exist yet
--    (TeacherDashboard now writes to 'classes' for class management)
CREATE TABLE IF NOT EXISTS classes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    teacher_id UUID REFERENCES auth.users ON DELETE CASCADE,
    name TEXT NOT NULL,
    join_code TEXT UNIQUE NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
);

ALTER TABLE classes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Teachers manage their own classes" ON classes;
CREATE POLICY "Teachers manage their own classes" ON classes
    USING (auth.uid() = teacher_id)
    WITH CHECK (auth.uid() = teacher_id);

DROP POLICY IF EXISTS "Anyone can view classes" ON classes;
CREATE POLICY "Anyone can view classes" ON classes
    FOR SELECT USING (true);

-- 5. Allow anyone to view active sessions (needed for join-by-code lookup)
--    Re-assert: this should already exist but add IF NOT EXISTS guard
DROP POLICY IF EXISTS "Anyone can view active sessions by code" ON active_sessions;
CREATE POLICY "Anyone can view active sessions by code" ON active_sessions
    FOR SELECT USING (true);

-- 6. Allow tutors to update their own sessions (for is_active = false on end)
DROP POLICY IF EXISTS "Tutors can end their sessions" ON active_sessions;
CREATE POLICY "Tutors can end their sessions" ON active_sessions
    FOR UPDATE USING (auth.uid() = tutor_id);

-- Done! ✅
