-- Add tags column to lessons table
ALTER TABLE lessons 
ADD COLUMN IF NOT EXISTS tags TEXT[] DEFAULT '{}';

-- Add view_count column to lessons table
ALTER TABLE lessons 
ADD COLUMN IF NOT EXISTS view_count INTEGER DEFAULT 0;

-- Add difficulty column to lessons table
ALTER TABLE lessons 
ADD COLUMN IF NOT EXISTS difficulty TEXT CHECK (difficulty IN ('Beginner', 'Intermediate', 'Advanced'));

-- Create index on tags for faster filtering
CREATE INDEX IF NOT EXISTS idx_lessons_tags ON lessons USING GIN(tags);

-- Create index on subject for faster filtering
CREATE INDEX IF NOT EXISTS idx_lessons_subject ON lessons(subject);

-- Create index on view_count for analytics queries
CREATE INDEX IF NOT EXISTS idx_lessons_view_count ON lessons(view_count DESC);
