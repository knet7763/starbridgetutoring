-- =========================================================================
-- SECURE RLS PATCH FOR RESPONSES TABLE (WITH SCHEMA FIX)
-- Run this in your Supabase project's SQL Editor.
-- This script adds any missing columns to your existing 'responses' table 
-- and applies the secure Row Level Security (RLS) policies.
-- =========================================================================

-- 1. Add missing columns if they don't exist in your database
ALTER TABLE responses 
    ADD COLUMN IF NOT EXISTS session_id UUID REFERENCES active_sessions(id) ON DELETE CASCADE;

ALTER TABLE responses 
    ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT NOW();

-- 2. Drop the overly permissive SELECT policy if it exists
DROP POLICY IF EXISTS "Anyone can view responses" ON responses;

-- 3. Create a secure SELECT policy that restricts read access to:
--    a) The student who created the response (using auth.uid() = student_id)
--    b) The teacher/tutor who is hosting the session
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

-- 4. Confirm RLS is enabled on the responses table
ALTER TABLE responses ENABLE ROW LEVEL SECURITY;

-- Done! ✅
