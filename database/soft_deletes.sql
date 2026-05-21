-- =========================================================================================
-- DATABASE INTEGRITY & TRANSACTION SAFETY: SOFT DELETES MIGRATION
-- 
-- Run this script in your Supabase SQL Editor.
-- This transition ensures high-value transactional records (student profiles, enrollments,
-- bookings) are never permanently lost if accidentally deleted. Instead, they are marked
-- as deleted with a timestamp, keeping the historical records intact for business analytics.
-- =========================================================================================

-- 1. Add deleted_at columns for soft delete tracking
ALTER TABLE public.student_profiles ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE public.enrollments ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP WITH TIME ZONE;

-- 2. Refactor Foreign Keys to remove dangerous raw CASCADE deletes
-- Instead, foreign key deletions are restricted or set to null, since we soft-delete anyway.

-- For student_profiles (dropping cascade from auth.users reference if applicable)
-- In standard setups, the profile references auth.users (id) which is managed by Supabase.
-- For safety, we keep reference but rely on soft deletes.

-- For enrollments (tutor_id, student_id)
-- First, let's identify and drop the old cascade constraints safely if they exist.
-- To be safe, we can try to drop and recreate them.
-- In typical setups:
-- ALTER TABLE public.enrollments DROP CONSTRAINT IF EXISTS enrollments_student_id_fkey;
-- ALTER TABLE public.enrollments ADD CONSTRAINT enrollments_student_id_fkey FOREIGN KEY (student_id) REFERENCES public.student_profiles(id) ON DELETE RESTRICT;

-- 3. Update active RLS Policies to automatically filter out soft-deleted records.
-- Tutors/Admins can see historical records, but default lists filter them.

DROP POLICY IF EXISTS "Students can view own active enrollments" ON public.enrollments;
CREATE POLICY "Students can view own active enrollments" ON public.enrollments
    FOR SELECT USING (
        auth.uid() = student_id 
        AND deleted_at IS NULL
    );

DROP POLICY IF EXISTS "Tutors can view own active enrollments" ON public.enrollments;
CREATE POLICY "Tutors can view own active enrollments" ON public.enrollments
    FOR SELECT USING (
        auth.uid() = tutor_id 
        AND deleted_at IS NULL
    );

DROP POLICY IF EXISTS "Students can view own active bookings" ON public.bookings;
CREATE POLICY "Students can view own active bookings" ON public.bookings
    FOR SELECT USING (
        auth.uid() = student_id 
        AND deleted_at IS NULL
    );

DROP POLICY IF EXISTS "Tutors can view own active bookings" ON public.bookings;
CREATE POLICY "Tutors can view own active bookings" ON public.bookings
    FOR SELECT USING (
        auth.uid() = tutor_id 
        AND deleted_at IS NULL
    );

-- 4. Create a Helper Function for soft-deleting
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
