-- Trial Requests Table
CREATE TABLE IF NOT EXISTS trial_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    parent_name TEXT NOT NULL,
    student_name TEXT NOT NULL,
    email TEXT NOT NULL,
    phone TEXT NOT NULL,
    grade_level TEXT,
    subject TEXT,
    status TEXT DEFAULT 'pending', -- pending, contacted, scheduled, completed
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add payment_status to enrollments
ALTER TABLE enrollments ADD COLUMN IF NOT EXISTS payment_status TEXT DEFAULT 'pending'; -- pending, paid, overdue
ALTER TABLE enrollments ADD COLUMN IF NOT EXISTS payment_link TEXT; -- URL to Stripe Checkout or similar

-- Enable RLS
ALTER TABLE trial_requests ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Admins can view trial requests" ON trial_requests FOR SELECT USING (auth.jwt()->>'role' = 'admin');
CREATE POLICY "Anyone can insert trial requests" ON trial_requests FOR INSERT WITH CHECK (true);
