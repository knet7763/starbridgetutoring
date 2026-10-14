-- Add stars to student profiles
ALTER TABLE student_profiles ADD COLUMN IF NOT EXISTS stars INTEGER DEFAULT 0;

-- Create badges table
CREATE TABLE IF NOT EXISTS badges (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    description TEXT,
    icon_url TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Create student_badges join table
CREATE TABLE IF NOT EXISTS student_badges (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID REFERENCES student_profiles(id) ON DELETE CASCADE,
    badge_id UUID REFERENCES badges(id) ON DELETE CASCADE,
    awarded_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(student_id, badge_id)
);

-- Enable RLS
ALTER TABLE badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE student_badges ENABLE ROW LEVEL SECURITY;

-- RLS Policies
DROP POLICY IF EXISTS "Anyone can view badges" ON badges;
CREATE POLICY "Anyone can view badges" ON badges FOR SELECT USING (true);

DROP POLICY IF EXISTS "Anyone can view student badges" ON student_badges;
CREATE POLICY "Anyone can view student badges" ON student_badges FOR SELECT USING (true);

DROP POLICY IF EXISTS "Admins can manage badges" ON badges;
CREATE POLICY "Admins can manage badges" ON badges FOR ALL USING (
    COALESCE(auth.jwt() -> 'app_metadata' ->> 'role', auth.jwt() ->> 'role') = 'admin'
);

DROP POLICY IF EXISTS "Admins and teachers can manage student badges" ON student_badges;
DROP POLICY IF EXISTS "Admins can manage student badges" ON student_badges;
CREATE POLICY "Admins and teachers can manage student badges" ON student_badges FOR ALL USING (
    COALESCE(auth.jwt() -> 'app_metadata' ->> 'role', auth.jwt() ->> 'role') IN ('admin', 'teacher')
);

-- Seed initial badges
INSERT INTO badges (name, description, icon_url) VALUES
('Fastest Finger', 'First to answer a quiz correctly', 'https://img.icons8.com/color/96/flash-light.png'),
('Star Scholar', 'Awarded for participating in 5 lessons', 'https://img.icons8.com/color/96/graduation-cap.png'),
('Helpful Hand', 'Awarded for helpful contributions to the board', 'https://img.icons8.com/color/96/handshake.png'),
('Perfect Attendance', 'Awarded for attending all lessons in a class', 'https://img.icons8.com/color/96/calendar.png')
ON CONFLICT DO NOTHING;
