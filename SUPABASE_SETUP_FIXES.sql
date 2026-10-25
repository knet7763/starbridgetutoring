-- =========================================================================================
-- STARBRIDGE TUTORING: DATABASE SCHEMA & TRIGGER SETUP
-- 
-- How to run:
-- 1. Open your Supabase Dashboard: https://supabase.com/dashboard/project/acrzypzzbbkdisietjlf/sql
-- 2. Click "New Query", paste this entire script, and click "Run" (green button)
-- =========================================================================================

-- ─────────────────────────────────────────────────────────────────────────────
-- STEP 1: Ensure Email Columns Exist on Student Profiles & Tutors
-- ─────────────────────────────────────────────────────────────────────────────
ALTER TABLE IF EXISTS public.student_profiles 
    ADD COLUMN IF NOT EXISTS email TEXT;

ALTER TABLE IF EXISTS public.student_profiles 
    ADD COLUMN IF NOT EXISTS parent_email TEXT;

ALTER TABLE IF EXISTS public.tutors 
    ADD COLUMN IF NOT EXISTS email TEXT;

-- ─────────────────────────────────────────────────────────────────────────────
-- STEP 2: Auto-create Student Profiles Trigger on New Signups
-- (Runs with SECURITY DEFINER privileges to prevent RLS insert failures)
-- ─────────────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.handle_new_student()
RETURNS trigger AS $$
BEGIN
  -- Insert profile for student signups or any auth user with metadata
  IF new.raw_user_meta_data->>'full_name' IS NOT NULL THEN
      INSERT INTO public.student_profiles (id, full_name, grade_level, parent_email, email)
      VALUES (
        new.id,
        new.raw_user_meta_data->>'full_name',
        COALESCE(new.raw_user_meta_data->>'grade_level', 'Grade 5'),
        COALESCE(new.raw_user_meta_data->>'parent_email', new.email),
        new.email
      )
      ON CONFLICT (id) DO UPDATE SET
        full_name = EXCLUDED.full_name,
        grade_level = COALESCE(EXCLUDED.grade_level, student_profiles.grade_level),
        parent_email = COALESCE(EXCLUDED.parent_email, student_profiles.parent_email),
        email = COALESCE(EXCLUDED.email, student_profiles.email);
  END IF;
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_student();

-- ─────────────────────────────────────────────────────────────────────────────
-- STEP 3: Ensure RLS Policies Allow Proper Access
-- ─────────────────────────────────────────────────────────────────────────────
ALTER TABLE public.student_profiles ENABLE ROW LEVEL SECURITY;

-- Students can read their own profile
DROP POLICY IF EXISTS "Students can view own profile" ON public.student_profiles;
CREATE POLICY "Students can view own profile" 
    ON public.student_profiles FOR SELECT 
    USING (auth.uid() = id);

-- Students can insert/upsert their own profile
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.student_profiles;
CREATE POLICY "Users can insert their own profile" 
    ON public.student_profiles FOR INSERT 
    WITH CHECK (auth.uid() = id);

-- Students can update their own profile
DROP POLICY IF EXISTS "Users can update their own profile" ON public.student_profiles;
CREATE POLICY "Users can update their own profile" 
    ON public.student_profiles FOR UPDATE 
    USING (auth.uid() = id);

-- Tutors can view student profiles of their bookings/enrollments
DROP POLICY IF EXISTS "Tutors can view student profiles of their bookings" ON public.student_profiles;
CREATE POLICY "Tutors can view student profiles of their bookings" 
    ON public.student_profiles FOR SELECT 
    USING (
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

-- Admins can view all student profiles
DROP POLICY IF EXISTS "Admins can view all student profiles" ON public.student_profiles;
CREATE POLICY "Admins can view all student profiles" 
    ON public.student_profiles FOR SELECT 
    USING (auth.jwt() -> 'app_metadata' ->> 'role' = 'admin');
