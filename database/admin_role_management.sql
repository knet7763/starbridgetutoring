-- ============================================================================
-- STARBRIDGE TUTORING: DYNAMIC ADMIN & ROLE MANAGEMENT
-- 
-- Run this script in the Supabase SQL Editor:
-- https://supabase.com/dashboard/project/acrzypzzbbkdisietjlf/sql/new
-- ============================================================================

-- 1. Helper function to assign or change ANY user's role from SQL
-- Example usage:
--   SELECT public.set_user_role('someone@example.com', 'admin');
--   SELECT public.set_user_role('teacher@example.com', 'teacher');
--   SELECT public.set_user_role('student@example.com', 'student');
CREATE OR REPLACE FUNCTION public.set_user_role(
    p_email TEXT,
    p_role TEXT DEFAULT 'admin'
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_user_id UUID;
    v_old_role TEXT;
BEGIN
    -- Look up user by email
    SELECT id, raw_app_meta_data->>'role'
    INTO v_user_id, v_old_role
    FROM auth.users
    WHERE LOWER(email) = LOWER(TRIM(p_email));

    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'User "%" not found in auth.users. Create the account in Supabase Auth first.', p_email;
    END IF;

    -- Update role in app_metadata
    UPDATE auth.users
    SET raw_app_meta_data = COALESCE(raw_app_meta_data, '{}'::jsonb) || jsonb_build_object('role', p_role)
    WHERE id = v_user_id;

    -- If assigning an admin, automatically update app_settings so trial/booking alerts go to this admin
    IF p_role = 'admin' THEN
        INSERT INTO public.app_settings (key, value)
        VALUES ('admin_email', LOWER(TRIM(p_email)))
        ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;
    END IF;

    RETURN jsonb_build_object(
        'success', true,
        'email', p_email,
        'previous_role', COALESCE(v_old_role, 'none'),
        'new_role', p_role,
        'message', 'User role updated successfully'
    );
END;
$$;

-- 2. Allow public to read the active admin_email so frontend dynamically uses the active admin
ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow public read of admin_email" ON public.app_settings;
CREATE POLICY "Allow public read of admin_email" 
    ON public.app_settings 
    FOR SELECT 
    USING (key = 'admin_email');

-- 3. Auto-sync trigger: changing admin_email in app_settings automatically grants role='admin'
CREATE OR REPLACE FUNCTION public.sync_admin_email_role()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    IF NEW.key = 'admin_email' AND NEW.value IS NOT NULL THEN
        UPDATE auth.users
        SET raw_app_meta_data = COALESCE(raw_app_meta_data, '{}'::jsonb) || '{"role": "admin"}'::jsonb
        WHERE LOWER(email) = LOWER(TRIM(NEW.value));
    END IF;
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_app_settings_admin_email ON public.app_settings;
CREATE TRIGGER on_app_settings_admin_email
    AFTER INSERT OR UPDATE ON public.app_settings
    FOR EACH ROW
    EXECUTE FUNCTION public.sync_admin_email_role();

-- 4. Auto-sync trigger: adding/updating a tutor email automatically grants role='teacher' (unless already admin)
CREATE OR REPLACE FUNCTION public.sync_tutor_email_role()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    IF NEW.email IS NOT NULL THEN
        UPDATE auth.users
        SET raw_app_meta_data = COALESCE(raw_app_meta_data, '{}'::jsonb) || '{"role": "teacher"}'::jsonb
        WHERE LOWER(email) = LOWER(TRIM(NEW.email))
          AND COALESCE(raw_app_meta_data->>'role', '') <> 'admin';
    END IF;
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_tutor_email_sync ON public.tutors;
CREATE TRIGGER on_tutor_email_sync
    AFTER INSERT OR UPDATE OF email ON public.tutors
    FOR EACH ROW
    EXECUTE FUNCTION public.sync_tutor_email_role();

-- 5. Auto-assign role when creating a user in Supabase Dashboard (Authentication -> Users -> Add user)
--    - If user signed up via /student/signup (has full_name), create student_profiles row.
--    - If user email matches public.tutors, assign role='teacher'.
--    - Otherwise (created directly in Supabase Auth Dashboard by Email & Password), assign role='admin'!
CREATE OR REPLACE FUNCTION public.handle_new_student()
RETURNS trigger AS $$
BEGIN
  IF new.raw_user_meta_data->>'full_name' IS NOT NULL THEN
      INSERT INTO public.student_profiles (id, full_name, grade_level, parent_email, email)
      VALUES (
        new.id,
        new.raw_user_meta_data->>'full_name',
        COALESCE(new.raw_user_meta_data->>'grade_level', 'Grade 5'),
        COALESCE(new.raw_user_meta_data->>'parent_email', new.email),
        new.email
      )
      ON CONFLICT (id) DO NOTHING;
  ELSIF EXISTS (SELECT 1 FROM public.tutors WHERE LOWER(email) = LOWER(new.email)) THEN
      UPDATE auth.users
      SET raw_app_meta_data = COALESCE(raw_app_meta_data, '{}'::jsonb) || '{"role": "teacher"}'::jsonb
      WHERE id = new.id;
  ELSE
      UPDATE auth.users
      SET raw_app_meta_data = COALESCE(raw_app_meta_data, '{}'::jsonb) || '{"role": "admin"}'::jsonb
      WHERE id = new.id;

      INSERT INTO public.app_settings (key, value)
      VALUES ('admin_email', LOWER(TRIM(new.email)))
      ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;
  END IF;
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_student();

-- 6. RPC so the frontend can auto-stamp role='admin' or 'teacher' for accounts created in Supabase Auth Dashboard
CREATE OR REPLACE FUNCTION public.claim_dashboard_staff_role(p_role TEXT DEFAULT 'admin')
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_uid UUID := auth.uid();
    v_email TEXT;
    v_full_name TEXT;
BEGIN
    IF v_uid IS NULL THEN
        RAISE EXCEPTION 'Not authenticated';
    END IF;

    IF p_role NOT IN ('admin', 'teacher') THEN
        RAISE EXCEPTION 'Invalid staff role';
    END IF;

    -- Prevent students from claiming staff roles
    SELECT email, raw_user_meta_data->>'full_name'
    INTO v_email, v_full_name
    FROM auth.users
    WHERE id = v_uid;

    IF v_full_name IS NOT NULL OR EXISTS (SELECT 1 FROM public.student_profiles WHERE id = v_uid) THEN
        RETURN jsonb_build_object('success', false, 'reason', 'Student accounts cannot claim staff roles');
    END IF;

    UPDATE auth.users
    SET raw_app_meta_data = COALESCE(raw_app_meta_data, '{}'::jsonb) || jsonb_build_object('role', p_role)
    WHERE id = v_uid;

    IF p_role = 'admin' AND v_email IS NOT NULL THEN
        INSERT INTO public.app_settings (key, value)
        VALUES ('admin_email', LOWER(TRIM(v_email)))
        ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;
    END IF;

    RETURN jsonb_build_object('success', true, 'role', p_role);
END;
$$;

GRANT EXECUTE ON FUNCTION public.claim_dashboard_staff_role(TEXT) TO authenticated;

-- 7. View to inspect all admins and teachers in one click:
-- SELECT * FROM public.staff_users;
CREATE OR REPLACE VIEW public.staff_users AS
SELECT 
    id,
    email,
    raw_app_meta_data->>'role' AS role,
    created_at,
    last_sign_in_at
FROM auth.users
WHERE raw_app_meta_data->>'role' IN ('admin', 'teacher');



