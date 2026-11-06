-- ============================================================================
-- STARBRIDGE TUTORING: FINAL LIVE DATABASE PATCH
-- Run this once in the Supabase SQL Editor:
-- https://supabase.com/dashboard/project/acrzypzzbbkdisietjlf/sql/new
-- ============================================================================

-- 1. Allow Quran, Hadith, and Fiqh slide types in public.slides
DO $$
DECLARE
    const_name text;
BEGIN
    FOR const_name IN
        SELECT constraint_name
        FROM information_schema.table_constraints
        WHERE table_schema = 'public' AND table_name = 'slides' AND constraint_type = 'CHECK'
    LOOP
        EXECUTE 'ALTER TABLE public.slides DROP CONSTRAINT IF EXISTS ' || quote_ident(const_name);
    END LOOP;

    ALTER TABLE public.slides
        ADD CONSTRAINT slides_type_check
        CHECK (type IN ('blank', 'image', 'quiz', 'poll', 'video', 'shout_it_out', 'youtube', 'quran', 'hadith', 'fiqh'));
END $$;

-- 2. Fix notify_booking_created() trigger (bookings table does not have NEW.subject; read from public.tutors)
CREATE OR REPLACE FUNCTION public.notify_booking_created()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_student_name  TEXT;
    v_student_email TEXT;
    v_tutor_name    TEXT;
    v_tutor_email   TEXT;
    v_tutor_subject TEXT;
    v_supabase_url  TEXT;
    v_service_key   TEXT;
BEGIN
    SELECT value INTO v_supabase_url FROM public.app_settings WHERE key = 'supabase_url';
    SELECT value INTO v_service_key FROM public.app_settings WHERE key = 'service_role_key';

    SELECT full_name, COALESCE(email, parent_email) INTO v_student_name, v_student_email
    FROM public.student_profiles WHERE id = NEW.student_id;

    IF v_student_email IS NULL THEN
        SELECT email INTO v_student_email FROM auth.users WHERE id = NEW.student_id;
    END IF;

    SELECT name, email, subject INTO v_tutor_name, v_tutor_email, v_tutor_subject
    FROM public.tutors WHERE id = NEW.tutor_id;

    IF v_tutor_email IS NULL THEN
        SELECT email INTO v_tutor_email FROM auth.users WHERE id = NEW.tutor_id;
    END IF;

    IF v_tutor_email IS NOT NULL AND v_supabase_url IS NOT NULL AND v_service_key IS NOT NULL THEN
        PERFORM net.http_post(
            url := v_supabase_url || '/functions/v1/send-email',
            headers := jsonb_build_object(
                'Content-Type', 'application/json',
                'Authorization', 'Bearer ' || v_service_key
            ),
            body := jsonb_build_object(
                'templateId', 'booking_created_teacher',
                'to', v_tutor_email,
                'data', jsonb_build_object(
                    'teacherName', COALESCE(v_tutor_name, 'Teacher'),
                    'studentName', COALESCE(v_student_name, 'Student'),
                    'date', TO_CHAR(NEW.booking_date, 'FMDay, FMMonth DD, YYYY'),
                    'startTime', NEW.start_time,
                    'endTime', NEW.end_time,
                    'subject', COALESCE(v_tutor_subject, 'Tutoring Session')
                )
            )
        );
    END IF;

    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_booking_created ON public.bookings;
CREATE TRIGGER on_booking_created
    AFTER INSERT ON public.bookings
    FOR EACH ROW
    EXECUTE FUNCTION public.notify_booking_created();

-- 3. Allow Admins and Teachers to view and update Trial Requests in the Dashboard
ALTER TABLE public.trial_requests ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can insert trial requests" ON public.trial_requests;
CREATE POLICY "Anyone can insert trial requests"
    ON public.trial_requests FOR INSERT
    WITH CHECK (true);

DROP POLICY IF EXISTS "Staff can view trial requests" ON public.trial_requests;
DROP POLICY IF EXISTS "Admins can view trial requests" ON public.trial_requests;
CREATE POLICY "Staff can view trial requests"
    ON public.trial_requests FOR SELECT
    USING (
        (auth.jwt() -> 'app_metadata' ->> 'role') IN ('admin', 'teacher')
        OR EXISTS (SELECT 1 FROM public.tutors WHERE tutors.id = auth.uid())
    );

DROP POLICY IF EXISTS "Staff can update trial requests" ON public.trial_requests;
CREATE POLICY "Staff can update trial requests"
    ON public.trial_requests FOR UPDATE
    USING (
        (auth.jwt() -> 'app_metadata' ->> 'role') IN ('admin', 'teacher')
        OR EXISTS (SELECT 1 FROM public.tutors WHERE tutors.id = auth.uid())
    );

-- 4. Allow public read of admin_email from app_settings + Dynamic Role Helpers
ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow public read of admin_email" ON public.app_settings;
CREATE POLICY "Allow public read of admin_email"
    ON public.app_settings FOR SELECT
    USING (key = 'admin_email');

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
    SELECT id, raw_app_meta_data->>'role'
    INTO v_user_id, v_old_role
    FROM auth.users
    WHERE LOWER(email) = LOWER(TRIM(p_email));

    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'User "%" not found in auth.users. Create the account in Supabase Auth first.', p_email;
    END IF;

    UPDATE auth.users
    SET raw_app_meta_data = COALESCE(raw_app_meta_data, '{}'::jsonb) || jsonb_build_object('role', p_role)
    WHERE id = v_user_id;

    IF p_role = 'admin' THEN
        INSERT INTO public.app_settings (key, value)
        VALUES ('admin_email', LOWER(TRIM(p_email)))
        ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;
    END IF;

    RETURN jsonb_build_object(
        'success', true,
        'email', p_email,
        'previous_role', COALESCE(v_old_role, 'none'),
        'new_role', p_role
    );
END;
$$;
