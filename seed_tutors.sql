-- Seed tutor profiles for teacher accounts
-- These match the actual 'tutors' table columns in production

INSERT INTO public.tutors (id, name, subject, bio, qualification, image_url, languages)
VALUES
  (
    '089a63f0-547c-4440-ae01-2f3f51cfc2ed',
    'Sadiya Farah',
    'Mathematics',
    'Experienced mathematics tutor with a passion for making numbers accessible to every learner.',
    'BSc Mathematics, University of Nairobi',
    'https://api.dicebear.com/7.x/initials/svg?seed=Sadiya+Farah&backgroundColor=f59e0b',
    ARRAY['English', 'Somali']
  ),
  (
    'e1b9eefe-c6c6-41ad-b208-6e5e17ed9ff6',
    'Cloud TechLab',
    'Computer Science',
    'Full-stack developer and educator helping students learn programming fundamentals and beyond.',
    'BSc Computer Science',
    'https://api.dicebear.com/7.x/initials/svg?seed=Cloud+Tech&backgroundColor=3b82f6',
    ARRAY['English']
  ),
  (
    'e1b7791a-aa41-4221-9a6a-f87ae4c3fb21',
    'Rich Kev',
    'English & Literacy',
    'Dedicated literacy tutor helping students improve their reading, writing, and communication skills.',
    'BA English Literature',
    'https://api.dicebear.com/7.x/initials/svg?seed=Rich+Kev&backgroundColor=10b981',
    ARRAY['English']
  )
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  subject = EXCLUDED.subject,
  bio = EXCLUDED.bio,
  qualification = EXCLUDED.qualification,
  image_url = EXCLUDED.image_url,
  languages = EXCLUDED.languages;
