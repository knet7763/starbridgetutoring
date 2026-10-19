-- ============================================================
-- StarBridge DB Patches – October 2026
-- Apply in Supabase SQL Editor (Settings → SQL Editor)
-- ============================================================

-- ──────────────────────────────────────────────────────────
-- 1. Atomic star increment RPC (replaces read-then-write race)
-- ──────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.increment_student_stars(
    p_student_id UUID,
    p_count INT DEFAULT 1
)
RETURNS INT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_new_stars INT;
BEGIN
    UPDATE public.student_profiles
    SET stars = COALESCE(stars, 0) + p_count
    WHERE id = p_student_id
    RETURNING stars INTO v_new_stars;
    
    RETURN COALESCE(v_new_stars, 0);
END;
$$;

-- Grant execute to authenticated users (students call this for self-award)
REVOKE ALL ON FUNCTION public.increment_student_stars FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.increment_student_stars TO authenticated;

-- ──────────────────────────────────────────────────────────
-- 2. Helper: call the send-email Edge Function from triggers
--    Uses pg_net extension (pre-installed on Supabase)
-- ──────────────────────────────────────────────────────────
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
    v_supabase_url  TEXT;
    v_service_key   TEXT;
BEGIN
    SELECT value INTO v_supabase_url FROM public.app_settings WHERE key = 'supabase_url';
    IF v_supabase_url IS NULL THEN
        v_supabase_url := current_setting('app.settings.supabase_url', true);
    END IF;

    SELECT value INTO v_service_key FROM public.app_settings WHERE key = 'service_role_key';
    IF v_service_key IS NULL THEN
        v_service_key := current_setting('app.settings.service_role_key', true);
    END IF;

    -- Fetch student details
    SELECT full_name, email INTO v_student_name, v_student_email
    FROM public.student_profiles WHERE id = NEW.student_id;

    -- Fetch tutor details
    SELECT name INTO v_tutor_name FROM public.tutors WHERE id = NEW.tutor_id;
    SELECT email INTO v_tutor_email FROM auth.users WHERE id = NEW.tutor_id;

    -- Notify teacher (booking_created_teacher)
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
                    'subject', NEW.subject
                )
            )
        );
    END IF;

    RETURN NEW;
END;
$$;

-- Drop & recreate trigger cleanly
DROP TRIGGER IF EXISTS on_booking_created ON public.bookings;
CREATE TRIGGER on_booking_created
    AFTER INSERT ON public.bookings
    FOR EACH ROW
    EXECUTE FUNCTION public.notify_booking_created();

-- ──────────────────────────────────────────────────────────
-- 3. Trigger: booking confirmed → email student
-- ──────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.notify_booking_confirmed()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_student_name  TEXT;
    v_student_email TEXT;
    v_tutor_name    TEXT;
    v_supabase_url  TEXT;
    v_service_key   TEXT;
BEGIN
    -- Only fire when status changes TO 'confirmed'
    IF NEW.status = 'confirmed' AND (OLD.status IS DISTINCT FROM 'confirmed') THEN
        SELECT value INTO v_supabase_url FROM public.app_settings WHERE key = 'supabase_url';
        IF v_supabase_url IS NULL THEN
            v_supabase_url := current_setting('app.settings.supabase_url', true);
        END IF;

        SELECT value INTO v_service_key FROM public.app_settings WHERE key = 'service_role_key';
        IF v_service_key IS NULL THEN
            v_service_key := current_setting('app.settings.service_role_key', true);
        END IF;

        SELECT full_name, email INTO v_student_name, v_student_email
        FROM public.student_profiles WHERE id = NEW.student_id;

        SELECT name INTO v_tutor_name FROM public.tutors WHERE id = NEW.tutor_id;

        IF v_student_email IS NOT NULL AND v_supabase_url IS NOT NULL AND v_service_key IS NOT NULL THEN
            PERFORM net.http_post(
                url := v_supabase_url || '/functions/v1/send-email',
                headers := jsonb_build_object(
                    'Content-Type', 'application/json',
                    'Authorization', 'Bearer ' || v_service_key
                ),
                body := jsonb_build_object(
                    'templateId', 'booking_confirmed_student',
                    'to', v_student_email,
                    'data', jsonb_build_object(
                        'studentName', COALESCE(v_student_name, 'Student'),
                        'teacherName', COALESCE(v_tutor_name, 'Your Tutor'),
                        'date', TO_CHAR(NEW.booking_date, 'FMDay, FMMonth DD, YYYY'),
                        'startTime', NEW.start_time,
                        'endTime', NEW.end_time
                    )
                )
            );
        END IF;
    END IF;

    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_booking_confirmed ON public.bookings;
CREATE TRIGGER on_booking_confirmed
    AFTER UPDATE ON public.bookings
    FOR EACH ROW
    EXECUTE FUNCTION public.notify_booking_confirmed();

-- ──────────────────────────────────────────────────────────
-- 4. Trigger: trial request → email admin
-- ──────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.notify_trial_request()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_admin_email   TEXT;
    v_supabase_url  TEXT;
    v_service_key   TEXT;
BEGIN
    SELECT value INTO v_admin_email FROM public.app_settings WHERE key = 'admin_email';
    IF v_admin_email IS NULL THEN
        v_admin_email := current_setting('app.settings.admin_email', true);
    END IF;

    SELECT value INTO v_supabase_url FROM public.app_settings WHERE key = 'supabase_url';
    IF v_supabase_url IS NULL THEN
        v_supabase_url := current_setting('app.settings.supabase_url', true);
    END IF;

    SELECT value INTO v_service_key FROM public.app_settings WHERE key = 'service_role_key';
    IF v_service_key IS NULL THEN
        v_service_key := current_setting('app.settings.service_role_key', true);
    END IF;

    IF v_admin_email IS NOT NULL AND v_supabase_url IS NOT NULL AND v_service_key IS NOT NULL THEN
        PERFORM net.http_post(
            url := v_supabase_url || '/functions/v1/send-email',
            headers := jsonb_build_object(
                'Content-Type', 'application/json',
                'Authorization', 'Bearer ' || v_service_key
            ),
            body := jsonb_build_object(
                'templateId', 'trial_request_admin',
                'to', v_admin_email,
                'data', jsonb_build_object(
                    'parentName', COALESCE(NEW.parent_name, NEW.name, 'Unknown'),
                    'studentName', COALESCE(NEW.student_name, 'Not provided'),
                    'email', COALESCE(NEW.email, 'Not provided'),
                    'phone', COALESCE(NEW.phone, 'Not provided'),
                    'subject', COALESCE(NEW.subject, 'Not specified'),
                    'message', COALESCE(NEW.message, '')
                )
            )
        );
    END IF;

    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_trial_request ON public.trial_requests;
CREATE TRIGGER on_trial_request
    AFTER INSERT ON public.trial_requests
    FOR EACH ROW
    EXECUTE FUNCTION public.notify_trial_request();

