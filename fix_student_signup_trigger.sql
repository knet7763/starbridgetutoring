-- =========================================================================================
-- FIX FOR STUDENT PROFILE RLS ERROR
-- 
-- Run this script in the Supabase SQL Editor. 
-- It creates a Database Trigger to automatically insert newly signed up students into the 
-- student_profiles table. This runs with elevated privileges (SECURITY DEFINER) 
-- and avoids any Row Level Security (RLS) violations that happen when email 
-- confirmations are enabled or the auth session isn't fully established yet.
-- =========================================================================================

-- 1. Create the function that will handle the trigger
CREATE OR REPLACE FUNCTION public.handle_new_student()
RETURNS trigger AS $$
BEGIN
  -- We only want to create a student profile if they signed up through the student portal
  -- which we identify by checking if 'full_name' exists in their metadata
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

-- 2. Drop the trigger if it already exists to prevent duplication errors
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- 3. Bind the trigger to the auth.users table
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_student();
