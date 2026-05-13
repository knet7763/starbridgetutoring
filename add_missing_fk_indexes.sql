-- =========================================================================
-- SCRIPT TO ADD MISSING INDEXES FOR FOREIGN KEYS
-- Run this script in your Supabase SQL Editor to improve performance 
-- and resolve any "Unindexed foreign keys" warnings.
-- =========================================================================

-- 1. Indexes for lessons table
CREATE INDEX IF NOT EXISTS idx_lessons_tutor_id ON lessons(tutor_id);

-- 2. Indexes for slides table
CREATE INDEX IF NOT EXISTS idx_slides_lesson_id ON slides(lesson_id);

-- 3. Indexes for active_sessions table
CREATE INDEX IF NOT EXISTS idx_active_sessions_lesson_id ON active_sessions(lesson_id);
CREATE INDEX IF NOT EXISTS idx_active_sessions_tutor_id ON active_sessions(tutor_id);
CREATE INDEX IF NOT EXISTS idx_active_sessions_current_slide_id ON active_sessions(current_slide_id);

-- 4. Indexes for session_participants table
CREATE INDEX IF NOT EXISTS idx_session_participants_session_id ON session_participants(session_id);
CREATE INDEX IF NOT EXISTS idx_session_participants_student_id ON session_participants(student_id);

-- 5. Indexes for responses table
CREATE INDEX IF NOT EXISTS idx_responses_session_id ON responses(session_id);
CREATE INDEX IF NOT EXISTS idx_responses_slide_id ON responses(slide_id);
CREATE INDEX IF NOT EXISTS idx_responses_student_id ON responses(student_id);

-- Note: The Phase 3 tables (enrollments, lesson_progress, tutor_availability, bookings)
-- already have their foreign key indexes defined in the schema.
