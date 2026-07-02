-- =========================================================================
-- STARBRIDGE TUTORING: BOOKINGS RLS POLICIES PATCH
-- Run this in your Supabase project's SQL Editor (https://supabase.com)
-- This script configures all required Row Level Security policies for the 
-- 'bookings' table to ensure students can book, and tutors can confirm.
-- =========================================================================

-- 1. Enable RLS on bookings
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;

-- 2. Clean up old select policies and apply updated select policies (excluding soft-deleted)
DROP POLICY IF EXISTS "Students can view their bookings" ON bookings;
DROP POLICY IF EXISTS "Students can view own active bookings" ON bookings;
CREATE POLICY "Students can view own active bookings" ON bookings
    FOR SELECT USING (auth.uid() = student_id AND deleted_at IS NULL);

DROP POLICY IF EXISTS "Tutors can view their bookings" ON bookings;
DROP POLICY IF EXISTS "Tutors can view own active bookings" ON bookings;
CREATE POLICY "Tutors can view own active bookings" ON bookings
    FOR SELECT USING (auth.uid() = tutor_id AND deleted_at IS NULL);

-- 3. Student booking creation policy
DROP POLICY IF EXISTS "Students can create bookings" ON bookings;
CREATE POLICY "Students can create bookings" ON bookings
    FOR INSERT WITH CHECK (auth.uid() = student_id);

-- 4. Update policies for students and tutors
DROP POLICY IF EXISTS "Students can update their bookings" ON bookings;
CREATE POLICY "Students can update their bookings" ON bookings
    FOR UPDATE USING (auth.uid() = student_id);

DROP POLICY IF EXISTS "Tutors can update their bookings" ON bookings;
CREATE POLICY "Tutors can update their bookings" ON bookings
    FOR UPDATE USING (auth.uid() = tutor_id);

-- 5. Admin bypass policy
DROP POLICY IF EXISTS "Admins can manage all bookings" ON bookings;
CREATE POLICY "Admins can manage all bookings" ON bookings
    FOR ALL USING (auth.jwt() -> 'app_metadata' ->> 'role' = 'admin');

-- 6. Reload cache
NOTIFY pgrst, 'reload schema';

-- Done! ✅
