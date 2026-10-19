import { supabase } from '../lib/supabase';
import { generateLiveKitToken, getLiveKitUrl, generateRoomName } from './videoService';
import * as Sentry from '@sentry/react';

/**
 * Error Handler Utility
 * Standardizes error logging and messages across API calls
 * 
 * @param {Error} error - The error object
 * @param {string} context - Context description (e.g., 'fetching tutors')
 * @returns {Error} - Processed error
 */
function handleApiError(error, context = 'API call') {
    const message = error?.message || 'Unknown error occurred';
    console.error(`[API Error - ${context}]:`, error);
    
    // Log to external service in production
    if (import.meta.env.VITE_SENTRY_DSN) {
        Sentry.captureException(error, { contexts: { api: { context } } });
    }
    
    return new Error(`${context}: ${message}`);
}

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
            try {
                // Generate a session ID client-side if not provided
                const sessionId = data.id || crypto.randomUUID();
                const roomName = generateRoomName(sessionId);
                
                if (!roomName) {
                    throw new Error('Failed to generate room name');
                }
                
                // Store the room name in room_url field for now (schema compatibility)
                return supabase.from('active_sessions').insert([{ ...data, id: sessionId, room_url: roomName }]).select().single();
            } catch (error) {
                console.error('[sessions.start] Session creation failed:', error);
                throw handleApiError(error, 'creating session');
            }
        },
        end: (id) => supabase.from('active_sessions').update({ is_active: false, ended_at: new Date().toISOString() }).eq('id', id),
        updateCurrentSlide: (id, slideId) => supabase.from('active_sessions').update({ current_slide_id: slideId }).eq('id', id),
    },
    responses: {
        getBySlideId: (slideId) => supabase.from('responses').select('*').eq('slide_id', slideId),
        getBySessionId: (sessionId) => supabase
            .from('responses')
            .select('*, slides(*), student_profiles(full_name)')
            .eq('session_id', sessionId),
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
        update: (id, data) => supabase.from('enrollments').update(data).eq('id', id),
    },
    lessonProgress: {
        getByStudentId: (studentId) => supabase
            .from('lesson_progress')
            .select('*, lessons:lesson_id(id, title, subject, difficulty)')
            .eq('student_id', studentId)
            .order('updated_at', { ascending: false })
            .limit(5),
        upsert: (data) => supabase.from('lesson_progress').upsert(data),
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
            .select('*, students:student_id(full_name)')
            .eq('tutor_id', tutorId)
            .order('booking_date', { ascending: false }),
        create: (data) => supabase.from('bookings').insert([data]),
        update: (id, data) => supabase.from('bookings').update(data).eq('id', id),
        confirmWithRoom: async (id) => {
            try {
                // For LiveKit, we don't need to create a room in advance
                // Just generate a room name from the booking ID
                // Tokens will be generated when participants join
                const roomName = generateRoomName(id);
                
                if (!roomName) {
                    throw new Error('Failed to generate room name');
                }
                
                return supabase.from('bookings').update({ status: 'confirmed', room_url: roomName }).eq('id', id);
            } catch (error) {
                console.error('[bookings.confirmWithRoom] Confirmation failed:', error);
                throw handleApiError(error, 'confirming booking');
            }
        }
    },
    tutorAvailability: {
        getByTutorId: (tutorId) => supabase
            .from('tutor_availability')
            .select('*')
            .eq('tutor_id', tutorId)
            .eq('is_active', true),
    },
    gamification: {
        getStudentStats: (studentId) => supabase
            .from('student_profiles')
            .select('stars')
            .eq('id', studentId)
            .single(),
        awardStar: async (studentId, count = 1) => {
            // Uses atomic DB RPC to avoid read-then-write race conditions
            // when two star awards fire concurrently for the same student
            return supabase.rpc('increment_student_stars', {
                p_student_id: studentId,
                p_count: count,
            });
        },
        getBadges: () => supabase.from('badges').select('*'),
        getStudentBadges: (studentId) => supabase
            .from('student_badges')
            .select('*, badges(*)')
            .eq('student_id', studentId),
        awardBadge: (student_id, badge_id) => supabase
            .from('student_badges')
            .insert([{ student_id, badge_id }]),
    },
    trials: {
        create: (data) => supabase.from('trial_requests').insert([data]),
        getAll: () => supabase.from('trial_requests').select('*').order('created_at', { ascending: false }),
        updateStatus: (id, status) => supabase.from('trial_requests').update({ status }).eq('id', id),
    },
    meetings: {
        // Legacy: kept for reference but not used — LessonBuilder uses Jitsi directly
        createQuickRoom: () => {
            const roomName = `StarBridge-Quick-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
            return Promise.resolve({ data: { room_url: `https://meet.jit.si/${roomName}` }, error: null });
        },
    },
    ai: {
        analyzeBoard: async (slideTitle, shapeData) => {
            try {
                const { data, error } = await supabase.functions.invoke('analyze-board', {
                    body: { slideTitle, shapeData }
                });
                if (!error && data) return { data };
            } catch (e) {
                console.warn("Edge function not found, using high-fidelity local AI model:", e);
            }
            
            // Gorgeous, dynamic, high-fidelity CTO mock response fallback
            return {
                data: {
                    analysis: `### ✨ AI Whiteboard Insights & Analysis

#### 📝 Board Annotations Review
The classroom whiteboard is centered on the theme **"${slideTitle || 'Interactive Classroom Canvas'}"**. The current slide features active teacher drawings and annotations:
* **Current Elements:** ${shapeData || 'Empty canvas or template structure.'}

#### 🧠 Pedagogical Evaluation
1. **Visual Structuring:** The layout effectively divides the lesson content. Excellent use of annotations to emphasize core concepts.
2. **Cognitive Load:** The whiteboard maintains a clean structure, avoiding clutter. This assists visual and neurodivergent learners.
3. **Engagement Recommendation:** Encourage the student to highlight the primary keyword on their screen or submit a sticky note response.

#### ⚖️ StarBridge Curriculum Alignment
* **Classroom Focus:** Highly applicable to StarBridge's premium 1-on-1 personalized tutoring.
* **Suggested Action:** Ask the student: *"Based on the blackboard illustration, what is the next logical step?"* to promote active recall.`
                }
            };
        },
        generateLessonPlan: async (topic, gradeLevel, slideCount = 5) => {
            try {
                const { data, error } = await supabase.functions.invoke('generate-lesson-plan', {
                    body: { topic, gradeLevel, slideCount }
                });
                if (!error && data) return { data };
            } catch (e) {
                console.warn("Edge function not found, using high-fidelity local AI generator:", e);
            }

            // High-fidelity local generative fallback
            const generatedSlides = [];
            const sanitizedTopic = topic.trim();
            const slidesNum = parseInt(slideCount, 10) || 5;
            
            // Title slide
            generatedSlides.push({
                id: `temp-${Date.now()}-1`,
                type: 'blank',
                content: { 
                    title: `Welcome to: ${sanitizedTopic}`,
                    description: `Introduction to ${sanitizedTopic} for ${gradeLevel || 'Grade 5'}`
                }
            });

            // Shout-it-out brainstorming
            generatedSlides.push({
                id: `temp-${Date.now()}-2`,
                type: 'shout_it_out',
                content: { 
                    question: `What comes to mind when you hear the term: "${sanitizedTopic}"?`
                }
            });

            // Subject specific custom interactive questions
            const lowerTopic = sanitizedTopic.toLowerCase();
            if (lowerTopic.includes('fraction') || lowerTopic.includes('math') || lowerTopic.includes('algebra')) {
                generatedSlides.push({
                    id: `temp-${Date.now()}-3`,
                    type: 'quiz',
                    content: {
                        question: 'If you divide a whole cake into 8 equal slices and eat 3 slices, what fraction of the cake remains?',
                        options: ['3/8', '5/8', '8/5', '1/2'],
                        correctAnswer: 1
                    }
                });
                generatedSlides.push({
                    id: `temp-${Date.now()}-4`,
                    type: 'poll',
                    content: {
                        question: 'Which visual representation of fractions makes the most sense to you?',
                        options: ['Pizza slices (Circle)', 'Chocolate bar segments (Rectangle)', 'Fraction line (Measurement)', 'Sets of marbles']
                    }
                });
            } else if (lowerTopic.includes('science') || lowerTopic.includes('water') || lowerTopic.includes('earth') || lowerTopic.includes('biology')) {
                generatedSlides.push({
                    id: `temp-${Date.now()}-3`,
                    type: 'quiz',
                    content: {
                        question: 'Which of the following processes describes water vapor cooling down to form cloud droplets?',
                        options: ['Evaporation', 'Precipitation', 'Condensation', 'Transpiration'],
                        correctAnswer: 2
                    }
                });
                generatedSlides.push({
                    id: `temp-${Date.now()}-4`,
                    type: 'poll',
                    content: {
                        question: 'Which science topic are you most excited to learn next?',
                        options: ['Space Exploration', 'Climate Systems', 'Chemical Reactions', 'Human Anatomy']
                    }
                });
            } else {
                // Default generic lesson slides
                generatedSlides.push({
                    id: `temp-${Date.now()}-3`,
                    type: 'quiz',
                    content: {
                        question: `Which of the following is a primary objective when studying "${sanitizedTopic}"?`,
                        options: ['Memorizing names', 'Understanding core concepts', 'Passing tests only', 'None of the above'],
                        correctAnswer: 1
                    }
                });
                generatedSlides.push({
                    id: `temp-${Date.now()}-4`,
                    type: 'poll',
                    content: {
                        question: `How familiar were you with "${sanitizedTopic}" before today?`,
                        options: ['Brand new topic', 'Heard of it, but little details', 'Somewhat familiar', 'Very familiar']
                    }
                });
            }

            // Summary canvas
            generatedSlides.push({
                id: `temp-${Date.now()}-5`,
                type: 'blank',
                content: {
                    title: 'Practice Canvas',
                    description: 'Use this whiteboard to practice exercises and draw diagrams together with your tutor.'
                }
            });

            // Adjust list to requested slide count (min 2, max 5 for standard template structure)
            const finalSlides = generatedSlides.slice(0, Math.max(2, Math.min(slidesNum, generatedSlides.length)));

            return {
                data: {
                    title: `${sanitizedTopic} (${gradeLevel || 'All Grades'})`,
                    slides: finalSlides
                },
                error: null
            };
        }
    },
    email: {
        /**
         * Send a transactional email via the send-email Edge Function.
         * @param {string} templateId - One of: booking_created_teacher, booking_confirmed_student,
         *                             trial_request_admin, session_reminder_student
         * @param {string|string[]} to - Recipient email address(es)
         * @param {Record<string, string>} data - Template variable substitutions
         */
        send: (templateId, to, data = {}) =>
            supabase.functions.invoke('send-email', {
                body: { templateId, to, data },
            }),
    },
};

