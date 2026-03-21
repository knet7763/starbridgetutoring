-- StarBridgeTutor MVP Schema
-- Lessons, Slides, and Real-time Sessions

-- 0. Tutors Table (Required for Lessons if not already present)
CREATE TABLE IF NOT EXISTS tutors (
    id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
    full_name TEXT,
    email TEXT,
    bio TEXT,
    hourly_rate DECIMAL(10, 2),
    subjects TEXT[],
    created_at TIMESTAMP DEFAULT NOW()
);

-- 1. Lessons Table (Created by Teachers/Tutors)
CREATE TABLE IF NOT EXISTS lessons (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tutor_id UUID REFERENCES tutors(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    thumbnail_url TEXT,
    is_published BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Ensure columns exist if table already existed without them
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'lessons' AND column_name = 'tutor_id') THEN
        ALTER TABLE lessons ADD COLUMN tutor_id UUID REFERENCES tutors(id) ON DELETE CASCADE;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'lessons' AND column_name = 'is_published') THEN
        ALTER TABLE lessons ADD COLUMN is_published BOOLEAN DEFAULT false;
    END IF;
END $$;

-- 2. Slides Table (Content for Lessons)
CREATE TABLE IF NOT EXISTS slides (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    lesson_id UUID REFERENCES lessons(id) ON DELETE CASCADE,
    order_index INTEGER NOT NULL,
    type TEXT DEFAULT 'blank' CHECK (type IN ('blank', 'image', 'quiz', 'video')),
    content JSONB DEFAULT '{}', -- Stores generic content (text, image url, quiz data)
    drawing_data JSONB DEFAULT '{}', -- Stores initial whiteboard state
    created_at TIMESTAMP DEFAULT NOW()
);

-- 3. Active Sessions (Live Classes)
CREATE TABLE IF NOT EXISTS active_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    lesson_id UUID REFERENCES lessons(id) ON DELETE CASCADE,
    tutor_id UUID REFERENCES tutors(id) ON DELETE CASCADE,
    current_slide_id UUID REFERENCES slides(id),
    code TEXT UNIQUE NOT NULL, -- 6-character join code
    is_active BOOLEAN DEFAULT true,
    started_at TIMESTAMP DEFAULT NOW(),
    ended_at TIMESTAMP
);

-- 4. Session Participants (Students in a class)
CREATE TABLE IF NOT EXISTS session_participants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID REFERENCES active_sessions(id) ON DELETE CASCADE,
    student_id UUID REFERENCES student_profiles(id) ON DELETE SET NULL, -- Optional if guest join allowed
    guest_name TEXT, -- Used if student_id is null
    joined_at TIMESTAMP DEFAULT NOW()
);

-- RLS Policies

-- Lessons: Tutors see their own, Students see none (until in session)
ALTER TABLE lessons ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Tutors manage their own lessons" ON lessons
    USING (auth.uid() = tutor_id)
    WITH CHECK (auth.uid() = tutor_id);

-- Slides: Same as lessons
ALTER TABLE slides ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Tutors manage their slides" ON slides
    USING (EXISTS (SELECT 1 FROM lessons WHERE lessons.id = slides.lesson_id AND lessons.tutor_id = auth.uid()))
    WITH CHECK (EXISTS (SELECT 1 FROM lessons WHERE lessons.id = slides.lesson_id AND lessons.tutor_id = auth.uid()));

-- Active Sessions: Public read (for joining), Tutor write
ALTER TABLE active_sessions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view active sessions by code" ON active_sessions
    FOR SELECT USING (true); -- Needed for students to find session by code

CREATE POLICY "Tutors manage their sessions" ON active_sessions
    USING (auth.uid() = tutor_id)
    WITH CHECK (auth.uid() = tutor_id);

-- Participants: Public insert (joining), Self view
ALTER TABLE session_participants ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can join a session" ON session_participants
    FOR INSERT WITH CHECK (true);

CREATE POLICY "View participants in same session" ON session_participants
    FOR SELECT USING (true);
