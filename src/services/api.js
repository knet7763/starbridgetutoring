import { supabase } from '../lib/supabase';

/**
 * Centralized API Service for Supabase interactions.
 * This abstracts away direct `supabase.from()` calls in React components,
 * preparing the application for future TypeScript typings, robust error handling,
 * and simplified testing.
 */
export const api = {
    tutors: {
        getAll: () => supabase.from('tutors').select('*').order('created_at', { ascending: false }),
        getById: (id) => supabase.from('tutors').select('*').eq('id', id).single(),
        create: (data) => supabase.from('tutors').insert([data]),
        update: (id, data) => supabase.from('tutors').update(data).eq('id', id),
        delete: (id) => supabase.from('tutors').delete().eq('id', id),
    },
    lessons: {
        getAll: () => supabase.from('lessons').select('*').order('created_at', { ascending: false }),
        getById: (id) => supabase.from('lessons').select('*').eq('id', id).single(),
        create: (data) => supabase.from('lessons').insert([data]).select().single(),
        update: (id, data) => supabase.from('lessons').update(data).eq('id', id),
        delete: (id) => supabase.from('lessons').delete().eq('id', id),
    },
    classes: {
        getAll: () => supabase.from('classes').select('*').order('created_at', { ascending: false }),
        create: (data) => supabase.from('classes').insert([data]).select().single(),
        delete: (id) => supabase.from('classes').delete().eq('id', id),
    },
    slides: {
        getByLessonId: (lessonId) => supabase.from('slides').select('*').eq('lesson_id', lessonId).order('order_index', { ascending: true }),
        create: (data) => supabase.from('slides').insert([data]),
        upsert: (dataArray) => supabase.from('slides').upsert(dataArray),
        updateDrawing: (id, snapshot) => supabase.from('slides').update({ drawing_data: snapshot }).eq('id', id),
        delete: (id) => supabase.from('slides').delete().eq('id', id),
        cloneBatch: (slidesArray) => supabase.from('slides').insert(slidesArray),
    },
    sessions: {
        getActiveById: (id) => supabase.from('active_sessions').select('*, lessons(*)').eq('id', id).single(),
        getByCode: (code) => supabase.from('active_sessions').select('id, is_active').eq('code', code).single(),
        start: async (data) => {
            const { data: edgeData, error: edgeError } = await supabase.functions.invoke('create-daily-room');
            let room_url = null;
            if (!edgeError && edgeData) {
                room_url = edgeData.room_url;
            } else {
                console.error("Error creating Daily room via Edge Function:", edgeError || "Unknown error");
            }
            return supabase.from('active_sessions').insert([{ ...data, room_url }]).select().single();
        },
        end: (id) => supabase.from('active_sessions').update({ is_active: false, ended_at: new Date().toISOString() }).eq('id', id),
        updateCurrentSlide: (id, slideId) => supabase.from('active_sessions').update({ current_slide_id: slideId }).eq('id', id),
    },
    responses: {
        getBySlideId: (slideId) => supabase.from('responses').select('*').eq('slide_id', slideId),
        create: (data) => supabase.from('responses').insert([data]),
    },
    participants: {
        getBySessionId: (sessionId) => supabase.from('session_participants').select('*').eq('session_id', sessionId),
        join: (data) => supabase.from('session_participants').insert([data]),
    },
    enrollments: {
        getByStudentId: (studentId) => supabase
            .from('enrollments')
            .select('*, tutors:tutor_id(id, name, subject, image_url)')
            .eq('student_id', studentId)
            .eq('status', 'active'),
        getOne: (studentId, tutorId) => supabase
            .from('enrollments')
            .select('id')
            .eq('student_id', studentId)
            .eq('tutor_id', tutorId)
            .single(),
        create: (data) => supabase.from('enrollments').insert([data]),
    },
    lessonProgress: {
        getByStudentId: (studentId) => supabase
            .from('lesson_progress')
            .select('*, lessons:lesson_id(id, title, subject, difficulty)')
            .eq('student_id', studentId)
            .order('updated_at', { ascending: false })
            .limit(5),
    },
    bookings: {
        getUpcoming: (studentId, today) => supabase
            .from('bookings')
            .select('*, tutors:tutor_id(name, subject)')
            .eq('student_id', studentId)
            .gte('booking_date', today)
            .in('status', ['pending', 'confirmed'])
            .order('booking_date', { ascending: true })
            .limit(3),
        getTakenSlots: (tutorId, date) => supabase
            .from('bookings')
            .select('start_time')
            .eq('tutor_id', tutorId)
            .eq('booking_date', date)
            .neq('status', 'cancelled'),
        getByTutorId: (tutorId) => supabase
            .from('bookings')
            .select('*, students:student_id(name)')
            .eq('tutor_id', tutorId)
            .order('booking_date', { ascending: false }),
        create: (data) => supabase.from('bookings').insert([data]),
        update: (id, data) => supabase.from('bookings').update(data).eq('id', id),
        confirmWithRoom: async (id) => {
            const { data: edgeData, error: edgeError } = await supabase.functions.invoke('create-daily-room');
            let room_url = null;
            if (!edgeError && edgeData) {
                room_url = edgeData.room_url;
            } else {
                console.error("Error creating Daily room via Edge Function:", edgeError || "Unknown error");
                throw new Error("Failed to create video room");
            }
            return supabase.from('bookings').update({ status: 'confirmed', room_url }).eq('id', id);
        }
    },
    tutorAvailability: {
        getByTutorId: (tutorId) => supabase
            .from('tutor_availability')
            .select('*')
            .eq('tutor_id', tutorId)
            .eq('is_active', true),
    },
};

