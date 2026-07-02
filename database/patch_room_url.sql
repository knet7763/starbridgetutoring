-- =========================================================================
-- STARBRIDGE TUTORING: 1ON1 VIDEO & CLASSROOM ROOM_URL SCHEMA PATCH
-- Run this in your Supabase project's SQL Editor (https://supabase.com)
-- This script adds the missing 'room_url' columns to both 'bookings' and
-- 'active_sessions' tables and refreshes the PostgREST cache.
-- =========================================================================

-- 1. Add room_url to bookings table if it doesn't exist
ALTER TABLE bookings 
    ADD COLUMN IF NOT EXISTS room_url TEXT;

-- 2. Add room_url to active_sessions table if it doesn't exist
ALTER TABLE active_sessions 
    ADD COLUMN IF NOT EXISTS room_url TEXT;

-- 3. Notify PostgREST to reload the schema cache so columns are immediately visible
NOTIFY pgrst, 'reload schema';

-- Done! ✅
