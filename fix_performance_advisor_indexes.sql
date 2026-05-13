-- Create missing indexes for unindexed foreign keys
CREATE INDEX IF NOT EXISTS idx_classes_teacher_id ON public.classes(teacher_id);
CREATE INDEX IF NOT EXISTS idx_quizzes_slide_id ON public.quizzes(slide_id);
CREATE INDEX IF NOT EXISTS idx_responses_quiz_id ON public.responses(quiz_id);
CREATE INDEX IF NOT EXISTS idx_responses_slide_id ON public.responses(slide_id);
CREATE INDEX IF NOT EXISTS idx_responses_student_id ON public.responses(student_id);
CREATE INDEX IF NOT EXISTS idx_lessons_tutor_id ON public.lessons(tutor_id);
CREATE INDEX IF NOT EXISTS idx_active_sessions_current_slide_id ON public.active_sessions(current_slide_id);
CREATE INDEX IF NOT EXISTS idx_active_sessions_lesson_id ON public.active_sessions(lesson_id);
CREATE INDEX IF NOT EXISTS idx_active_sessions_tutor_id ON public.active_sessions(tutor_id);
CREATE INDEX IF NOT EXISTS idx_session_participants_session_id ON public.session_participants(session_id);
CREATE INDEX IF NOT EXISTS idx_session_participants_student_id ON public.session_participants(student_id);
CREATE INDEX IF NOT EXISTS idx_slides_lesson_id ON public.slides(lesson_id);

-- Drop unused indexes that are NOT associated with foreign keys
DROP INDEX IF EXISTS public.idx_bookings_date;
DROP INDEX IF EXISTS public.idx_lessons_tags;
DROP INDEX IF EXISTS public.idx_lessons_subject;
DROP INDEX IF EXISTS public.idx_lessons_view_count;

-- Note: The following unused indexes are intentionally KEPT because they support foreign keys.
-- Dropping them would trigger 'Unindexed Foreign Key' warnings and degrade cascade delete performance.
-- - public.idx_enrollments_tutor
-- - public.idx_lesson_progress_lesson
-- - public.idx_tutor_availability_tutor
-- - public.idx_bookings_tutor
