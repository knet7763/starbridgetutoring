-- ============================================================================
-- STARBRIDGE TUTORING: ADMIN CLASSES & BOOKINGS RLS PATCH
-- Grants Admins full management access to public.classes and public.bookings
-- ============================================================================

-- 1. Allow Admins to manage all classes (add, reassign tutor, delete)
DROP POLICY IF EXISTS "Admins manage all classes" ON public.classes;
CREATE POLICY "Admins manage all classes"
    ON public.classes FOR ALL
    USING ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin')
    WITH CHECK ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

-- 2. Allow Admins to manage all bookings across all tutors
DROP POLICY IF EXISTS "Admins manage all bookings" ON public.bookings;
CREATE POLICY "Admins manage all bookings"
    ON public.bookings FOR ALL
    USING ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin')
    WITH CHECK ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');
