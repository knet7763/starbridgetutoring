-- =========================================================================
-- STARBRIDGE TUTORING: SECURITY & RLS AUDIT PATCH
-- Run this in your Supabase project's SQL Editor (https://supabase.com)
-- This script replaces overly permissive RLS policies with strict,
-- GDPR/COPPA-compliant policies while preserving application flows.
-- =========================================================================

-- 1. SECURE TUTORS TABLE
-- Students and visitors need to browse tutors, but only tutors manage their profile.
DROP POLICY IF EXISTS "Anyone can view tutors" ON tutors;
CREATE POLICY "Anyone can view tutors" ON tutors 
    FOR SELECT 
    USING (true);

-- 2. SECURE STUDENT PROFILES TABLE
-- Student profiles contain sensitive data and must not be public.
-- Restrict read access to:
-- a) The student themselves
-- b) Authorized tutors (who have a booking or enrollment relationship)
-- c) Platform administrators
DROP POLICY IF EXISTS "Anyone can view student profiles" ON student_profiles;

CREATE POLICY "Students can view own profile" 
    ON student_profiles 
    FOR SELECT 
    USING (auth.uid() = id);

CREATE POLICY "Tutors can view student profiles of their bookings" 
    ON student_profiles 
    FOR SELECT 
    USING (
        EXISTS (
            SELECT 1 FROM bookings 
            WHERE bookings.student_id = student_profiles.id 
              AND bookings.tutor_id = auth.uid()
        ) OR EXISTS (
            SELECT 1 FROM enrollments 
            WHERE enrollments.student_id = student_profiles.id 
              AND enrollments.tutor_id = auth.uid()
        )
    );

CREATE POLICY "Admins can view all student profiles" 
    ON student_profiles 
    FOR SELECT 
    USING (auth.jwt() -> 'app_metadata' ->> 'role' = 'admin');

-- 3. SECURE ENROLLMENTS TABLE
-- Tutors need to see who is enrolled in their classes.
DROP POLICY IF EXISTS "Tutors can view their enrollments" ON enrollments;
CREATE POLICY "Tutors can view their enrollments" 
    ON enrollments 
    FOR SELECT 
    USING (auth.uid() = tutor_id);

-- 4. SECURE ACTIVE SESSIONS TABLE
-- Limit session details retrieval. Guest/anonymous code lookup only allows selecting ACTIVE classrooms.
DROP POLICY IF EXISTS "Anyone can view active sessions by code" ON active_sessions;
DROP POLICY IF EXISTS "Tutors can view their own sessions" ON active_sessions;

CREATE POLICY "Anyone can view active sessions by code" 
    ON active_sessions 
    FOR SELECT 
    USING (is_active = true);

CREATE POLICY "Tutors can view their own sessions" 
    ON active_sessions 
    FOR SELECT 
    USING (auth.uid() = tutor_id);

CREATE POLICY "Admins can view all active sessions" 
    ON active_sessions 
    FOR SELECT 
    USING (auth.jwt() -> 'app_metadata' ->> 'role' = 'admin');

-- 5. SECURE SESSION PARTICIPANTS TABLE
-- Classroom roster must not be public. Restrict read access to:
-- a) The host tutor of the session
-- b) An admin
-- c) Students active in that same session
DROP POLICY IF EXISTS "View participants in same session" ON session_participants;

CREATE POLICY "View participants in same session" 
    ON session_participants 
    FOR SELECT 
    USING (
        EXISTS (
            SELECT 1 FROM active_sessions 
            WHERE active_sessions.id = session_participants.session_id 
              AND (active_sessions.tutor_id = auth.uid() OR auth.jwt() -> 'app_metadata' ->> 'role' = 'admin')
        ) OR EXISTS (
            SELECT 1 FROM session_participants AS sp 
            WHERE sp.session_id = session_participants.session_id 
              AND sp.student_id = auth.uid()
        )
    );
