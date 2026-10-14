-- =========================================================================
-- STARBRIDGE TUTORING: BOOKING CONCURRENCY & INTEGRITY PATCH
-- Prevents race conditions and double bookings for the same tutor slot
-- =========================================================================

-- 1. Ensure no two active/confirmed/pending bookings can overlap for the same tutor slot
CREATE UNIQUE INDEX IF NOT EXISTS idx_unique_active_booking 
ON bookings (tutor_id, booking_date, start_time) 
WHERE status != 'cancelled';

-- 2. Performance indexes for booking lookups
CREATE INDEX IF NOT EXISTS idx_bookings_student_date 
ON bookings (student_id, booking_date);

CREATE INDEX IF NOT EXISTS idx_bookings_tutor_date_status 
ON bookings (tutor_id, booking_date, status);
