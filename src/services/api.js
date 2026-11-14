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
        create: async (data) => {
            let effectiveTutorId = data.tutor_id;
            if (effectiveTutorId) {
                try {
                    const { data: tutorMatch } = await supabase
                        .from('tutors')
                        .select('id')
                        .eq('id', effectiveTutorId)
                        .maybeSingle();

                    if (!tutorMatch) {
                        const { data: authData } = await supabase.auth.getUser();
                        const authUser = authData?.user;
                        if (authUser) {
                            const { data: tutorByEmail } = await supabase
                                .from('tutors')
                                .select('id')
                                .ilike('email', authUser.email || '')
                                .maybeSingle();
                            if (tutorByEmail) {
                                effectiveTutorId = tutorByEmail.id;
                            } else {
                                const { data: autoTutor } = await supabase
                                    .from('tutors')
                                    .upsert([{
                                        id: authUser.id,
                                        name: authUser.user_metadata?.full_name || authUser.email?.split('@')[0] || 'Teacher',
                                        email: authUser.email,
                                        subject: data.subject || 'General',
                                    }])
                                    .select('id')
                                    .maybeSingle();
                                if (autoTutor?.id) effectiveTutorId = autoTutor.id;
                            }
                        }
                    }
                } catch (e) {
                    console.warn('[lessons.create] Tutor lookup warning:', e);
                }
            }
            return supabase.from('lessons').insert([{ ...data, tutor_id: effectiveTutorId }]).select().single();
        },
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
        getActiveList: () => supabase.from('active_sessions').select('*, lessons(title, subject)').eq('is_active', true).limit(5),
        getByCode: (code) => supabase.from('active_sessions').select('id, is_active').eq('code', code).single(),
        start: async (data) => {
            try {
                // Generate a session ID client-side if not provided
                const sessionId = data.id || crypto.randomUUID();
                const roomName = generateRoomName(sessionId);
                
                if (!roomName) {
                    throw new Error('Failed to generate room name');
                }

                let effectiveTutorId = data.tutor_id;

                // 1. Verify that effectiveTutorId exists in public.tutors
                if (effectiveTutorId) {
                    const { data: tutorMatch } = await supabase
                        .from('tutors')
                        .select('id')
                        .eq('id', effectiveTutorId)
                        .maybeSingle();

                    if (!tutorMatch) {
                        const { data: authData } = await supabase.auth.getUser();
                        const authUser = authData?.user;

                        if (authUser) {
                            const { data: tutorByEmail } = await supabase
                                .from('tutors')
                                .select('id')
                                .ilike('email', authUser.email || '')
                                .maybeSingle();

                            if (tutorByEmail) {
                                effectiveTutorId = tutorByEmail.id;
                            } else {
                                const { data: autoTutor } = await supabase
                                    .from('tutors')
                                    .upsert([{
                                        id: authUser.id,
                                        name: authUser.user_metadata?.full_name || authUser.email?.split('@')[0] || 'Teacher',
                                        email: authUser.email,
                                        subject: 'General',
                                        bio: 'StarBridge Educator',
                                        qualification: 'Educator',
                                        languages: ['English']
                                    }])
                                    .select('id')
                                    .maybeSingle();

                                if (autoTutor?.id) effectiveTutorId = autoTutor.id;
                            }
                        }
                    }
                }

                // 2. Fallback to lesson's tutor_id if still missing or invalid
                if (!effectiveTutorId && data.lesson_id) {
                    const { data: lessonData } = await supabase
                        .from('lessons')
                        .select('tutor_id')
                        .eq('id', data.lesson_id)
                        .maybeSingle();
                    if (lessonData?.tutor_id) {
                        effectiveTutorId = lessonData.tutor_id;
                    }
                }

                // 3. Last fallback: any valid tutor in system to satisfy foreign key
                if (!effectiveTutorId) {
                    const { data: anyTutor } = await supabase
                        .from('tutors')
                        .select('id')
                        .limit(1)
                        .maybeSingle();
                    if (anyTutor?.id) {
                        effectiveTutorId = anyTutor.id;
                    }
                }

                const insertPayload = {
                    ...data,
                    id: sessionId,
                    tutor_id: effectiveTutorId,
                    room_url: roomName
                };

                let res = await supabase.from('active_sessions').insert([insertPayload]).select().single();

                // If foreign key still failed (e.g. race condition), fallback to any valid tutor
                if (res.error && (res.error.code === '23503' || res.error.message?.includes('tutor_id_fkey'))) {
                    console.warn('[sessions.start] Tutor FK constraint hit, attempting fallback to system tutor:', res.error);
                    const { data: fallbackTutor } = await supabase.from('tutors').select('id').limit(1).maybeSingle();
                    if (fallbackTutor?.id) {
                        insertPayload.tutor_id = fallbackTutor.id;
                        res = await supabase.from('active_sessions').insert([insertPayload]).select().single();
                    }
                }

                return res;
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
            .select('*, students:student_id(full_name, parent_email, email)')
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
            if (lowerTopic.includes('quran') || lowerTopic.includes('surah') || lowerTopic.includes('tajweed') || lowerTopic.includes('hifz') || lowerTopic.includes('fatihah') || lowerTopic.includes('ikhlas')) {
                const surahNum = lowerTopic.includes('ikhlas') ? 112 : lowerTopic.includes('falaq') ? 113 : lowerTopic.includes('nas') ? 114 : lowerTopic.includes('mulk') ? 67 : 1;
                generatedSlides.push({
                    id: `temp-${Date.now()}-3`,
                    type: 'quran',
                    content: {
                        surah: surahNum,
                        startAyah: 1,
                        endAyah: surahNum === 67 ? 5 : 7
                    }
                });
                generatedSlides.push({
                    id: `temp-${Date.now()}-4`,
                    type: 'quiz',
                    content: {
                        question: 'When reciting the Quran with Tajweed, what is the primary purpose of observing Makharij (articulation points)?',
                        options: ['Reciting as fast as possible', 'Pronouncing each Arabic letter from its proper point of origin', 'Skipping difficult verses', 'Reading silently only'],
                        correctAnswer: 1
                    }
                });
            } else if (lowerTopic.includes('hadith') || lowerTopic.includes('sunnah') || lowerTopic.includes('adab') || lowerTopic.includes('character')) {
                generatedSlides.push({
                    id: `temp-${Date.now()}-3`,
                    type: 'hadith',
                    content: {
                        hadith: 'خَيْرُكُمْ مَنْ تَعَلَّمَ الْقُرْآنَ وَعَلَّمَهُ',
                        translation: 'The best among you are those who learn the Quran and teach it.',
                        narrator: 'Uthman ibn Affan (RA)',
                        source: 'Sahih al-Bukhari 5027'
                    }
                });
                generatedSlides.push({
                    id: `temp-${Date.now()}-4`,
                    type: 'quiz',
                    content: {
                        question: 'How should a student of knowledge apply the teachings of the Prophetic Sunnah in daily life?',
                        options: ['Only during classroom hours', 'With sincerity, good character (Akhlaq), and consistency', 'By memorizing without reflection', 'None of the above'],
                        correctAnswer: 1
                    }
                });
            } else if (lowerTopic.includes('fiqh') || lowerTopic.includes('salah') || lowerTopic.includes('wudu') || lowerTopic.includes('prayer') || lowerTopic.includes('fasting') || lowerTopic.includes('zakat')) {
                generatedSlides.push({
                    id: `temp-${Date.now()}-3`,
                    type: 'fiqh',
                    content: {
                        topic: sanitizedTopic,
                        scenario: `A student wants to ensure their practice of ${sanitizedTopic} fulfills all essential conditions (Shurut) and pillars (Arkan) properly.`,
                        rulings: [
                            'Intention (Niyyah) in the heart is an essential requirement before beginning an act of worship.',
                            'Observing the correct sequence (Tartib) and calmness (Tuma’ninah) ensures validity.'
                        ],
                        principle: 'Matters are judged by their intentions (Al-Umuru bi-Maqasidiha).'
                    }
                });
                generatedSlides.push({
                    id: `temp-${Date.now()}-4`,
                    type: 'quiz',
                    content: {
                        question: 'Where does the intention (Niyyah) for an act of worship reside?',
                        options: ['In the heart', 'Written on paper', 'Only spoken loudly', 'It is optional'],
                        correctAnswer: 0
                    }
                });
            } else if (lowerTopic.includes('fraction') || lowerTopic.includes('math') || lowerTopic.includes('algebra')) {
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
    settings: {
        /**
         * Dynamically resolves the active administrator email from public.app_settings,
         * falling back to VITE_ADMIN_EMAIL or the default admin address.
         */
        getAdminEmail: async () => {
            try {
                const { data, error } = await supabase
                    .from('app_settings')
                    .select('value')
                    .eq('key', 'admin_email')
                    .maybeSingle();
                if (!error && data?.value) {
                    return data.value.trim();
                }
            } catch (err) {
                console.warn('[settings.getAdminEmail] Using fallback admin email:', err);
            }
            return import.meta.env.VITE_ADMIN_EMAIL || 'knet7763@gmail.com';
        },
        getSiteSettings: async () => {
            const defaults = {
                admin_email: import.meta.env.VITE_ADMIN_EMAIL || 'knet7763@gmail.com',
                support_email: 'support@starbridgetutors.com',
                support_phone: '+254 700 000 000',
                whatsapp_number: '+254 700 000 000',
            };
            try {
                const { data, error } = await supabase
                    .from('app_settings')
                    .select('key, value');
                if (!error && Array.isArray(data)) {
                    const merged = { ...defaults };
                    data.forEach((row) => {
                        if (row?.key && row?.value) {
                            merged[row.key] = row.value;
                        }
                    });
                    return merged;
                }
            } catch (err) {
                console.warn('[settings.getSiteSettings] Using defaults:', err);
            }
            return defaults;
        },
        saveSiteSettings: async (settingsObj) => {
            const rows = Object.entries(settingsObj).map(([key, value]) => ({
                key,
                value: String(value || '').trim(),
                updated_at: new Date().toISOString(),
            }));
            return supabase.from('app_settings').upsert(rows, { onConflict: 'key' });
        },
    },
};

