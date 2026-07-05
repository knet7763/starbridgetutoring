# Database Schema & API Documentation: StarBridgeTutoring

This document details the database architecture, schema catalog, performance indexes, triggers, Row Level Security (RLS) configurations, and backend Edge Functions for **StarBridgeTutoring**.

---

## 📊 Database Schema Catalog

All tables are located in the `public` schema. High-performance indexes, foreign key constraints, and soft deletion models are configured out-of-the-box.

### 1. `tutors`
Tutor profiles extending user credentials.
*   **`id`** (`UUID`, Primary Key): References `auth.users(id)` (On Delete Cascade).
*   **`name`** (`TEXT`): Full name of the tutor.
*   **`subject`** (`TEXT`): Primary tutoring specialty (e.g., Mathematics, Islamic Studies).
*   **`bio`** (`TEXT`): Short professional autobiography.
*   **`qualification`** (`TEXT`): Academic certifications or credentials.
*   **`image_url`** (`TEXT`): Avatar image URL.
*   **`languages`** (`TEXT[]`): Array of spoken languages.
*   **`created_at`** (`TIMESTAMP`): Record creation time.
*   **`updated_at`** (`TIMESTAMP`): Record modification time.

### 2. `lessons`
Lesson configurations containing course outlines and metadata.
*   **`id`** (`UUID`, Primary Key): Generated using `gen_random_uuid()`.
*   **`tutor_id`** (`UUID`): References `tutors(id)` (On Delete Cascade).
*   **`title`** (`TEXT`): Lesson title.
*   **`description`** (`TEXT`): Overview of course topics.
*   **`thumbnail_url`** (`TEXT`): Lesson thumbnail image.
*   **`is_published`** (`BOOLEAN`): Release state (defaults to `false`).
*   **`tags`** (`TEXT[]`): Category filters.
*   **`view_count`** (`INTEGER`): Counter of student lesson views.
*   **`difficulty`** (`TEXT`): Skill level restriction (`Beginner`, `Intermediate`, `Advanced`).
*   **`created_at`** (`TIMESTAMP`): Record creation time.
*   **`updated_at`** (`TIMESTAMP`): Record modification time.

### 3. `slides`
Specific course modules and interactive stage components.
*   **`id`** (`UUID`, Primary Key): Generated using `gen_random_uuid()`.
*   **`lesson_id`** (`UUID`): References `lessons(id)` (On Delete Cascade).
*   **`order_index`** (`INTEGER`): Order of display.
*   **`type`** (`TEXT`): Display mode (`blank`, `image`, `quiz`, `poll`, `video`, `shout_it_out`, `youtube`, `quran`, `hadith`, `fiqh`).
*   **`content`** (`JSONB`): Configuration properties (e.g., questions, options, Ayah coordinates).
*   **`drawing_data`** (`JSONB`): Persistent whiteboard annotations from `tldraw`.
*   **`created_at`** (`TIMESTAMP`): Record creation time.

### 4. `student_profiles`
Extended profile information for logged-in students.
*   **`id`** (`UUID`, Primary Key): References `auth.users(id)` (On Delete Cascade).
*   **`full_name`** (`TEXT`): Student's full name.
*   **`grade_level`** (`TEXT`): School level.
*   **`parent_email`** (`TEXT`): Secondary guardian contact.
*   **`stars`** (`INTEGER`): Active/Current gamification star balance.
*   **`total_stars`** (`INTEGER`): Life-time stars awarded.
*   **`deleted_at`** (`TIMESTAMP WITH TIME ZONE`): Soft deletion mark.
*   **`created_at`** (`TIMESTAMP`): Record creation time.
*   **`updated_at`** (`TIMESTAMP`): Record modification time.

### 5. `active_sessions`
Live real-time active classroom coordinates.
*   **`id`** (`UUID`, Primary Key): Generated using `gen_random_uuid()`.
*   **`lesson_id`** (`UUID`): References `lessons(id)` (On Delete Cascade).
*   **`tutor_id`** (`UUID`): References `tutors(id)` (On Delete Cascade).
*   **`current_slide_id`** (`UUID`): References `slides(id)`.
*   **`code`** (`TEXT`, Unique): Alpha-numeric join passcode for student quick access.
*   **`room_url`** (`TEXT`): Generated Jitsi or LiveKit meeting room string.
*   **`is_active`** (`BOOLEAN`): Set to `false` when a class ends.
*   **`started_at`** (`TIMESTAMP`): Start timestamp.
*   **`ended_at`** (`TIMESTAMP`): Terminated timestamp.

### 6. `session_participants`
Dynamic roster tracking participants in an active classroom.
*   **`id`** (`UUID`, Primary Key): Generated using `gen_random_uuid()`.
*   **`session_id`** (`UUID`): References `active_sessions(id)` (On Delete Cascade).
*   **`student_id`** (`UUID`): References `student_profiles(id)` (On Delete Set Null).
*   **`guest_name`** (`TEXT`): Display label used by anonymous/unauthenticated users.
*   **`stars_earned`** (`INTEGER`): Stars awarded during the active session.
*   **`joined_at`** (`TIMESTAMP`): Timestamp of enrollment.

### 7. `responses`
Responses collected from slide interactive prompts (Quizzes, Polls, Shout-It-Out boards).
*   **`id`** (`UUID`, Primary Key): Generated using `gen_random_uuid()`.
*   **`session_id`** (`UUID`): References `active_sessions(id)` (On Delete Cascade).
*   **`slide_id`** (`UUID`): References `slides(id)` (On Delete Cascade).
*   **`student_id`** (`UUID`): References `student_profiles(id)` (On Delete Set Null).
*   **`answer`** (`TEXT`): Response value or option index.
*   **`is_correct`** (`BOOLEAN`): Validation flag for quiz-based slides.
*   **`created_at`** (`TIMESTAMP`): Submission time.

### 8. `enrollments`
Binds a student to a tutor for ongoing subscription packages.
*   **`student_id`** (`UUID`): References `student_profiles(id)`.
*   **`tutor_id`** (`UUID`): References `tutors(id)`.
*   **`enrolled_at`** (`TIMESTAMP`): Start timestamp.
*   **`status`** (`TEXT`): Booking state (`active`, `paused`, `completed`).
*   **`payment_status`** (`TEXT`): Billing state (`pending`, `paid`, `overdue`).
*   **`payment_link`** (`TEXT`): URL to Stripe checkout.
*   **`deleted_at`** (`TIMESTAMP WITH TIME ZONE`): Soft deletion mark.

### 9. `lesson_progress`
Tracks a student's completion and metrics across specific lesson files.
*   **`id`** (`UUID`, Primary Key): Generated using `gen_random_uuid()`.
*   **`student_id`** (`UUID`): References `student_profiles(id)` (On Delete Cascade).
*   **`lesson_id`** (`UUID`): References `lessons(id)` (On Delete Cascade).
*   **`status`** (`TEXT`): Completion state (`not_started`, `in_progress`, `completed`).
*   **`progress_percent`** (`INTEGER`): Progress completion metric (0 to 100).
*   **`completed_at`** (`TIMESTAMP`): Timestamp of completion.
*   **`feedback_notes`** (`TEXT`): Review remarks left by tutors.
*   **`created_at`** (`TIMESTAMP`): Record creation time.
*   **`updated_at`** (`TIMESTAMP`): Record modification time.

### 10. `tutor_availability`
Tracks availability slots for recurring scheduling calendars.
*   **`id`** (`UUID`, Primary Key): Generated using `gen_random_uuid()`.
*   **`tutor_id`** (`UUID`): References `tutors(id)` (On Delete Cascade).
*   **`day_of_week`** (`INTEGER`): Day range (0=Sunday to 6=Saturday).
*   **`start_time`** (`TIME`): Session beginning bounds.
*   **`end_time`** (`TIME`): Session termination bounds.
*   **`is_active`** (`BOOLEAN`): Availability state.

### 11. `bookings`
Personalized 1-on-1 tutoring sessions.
*   **`id`** (`UUID`, Primary Key): Generated using `gen_random_uuid()`.
*   **`student_id`** (`UUID`): References `student_profiles(id)` (On Delete Cascade).
*   **`tutor_id`** (`UUID`): References `tutors(id)` (On Delete Cascade).
*   **`booking_date`** (`DATE`): Scheduled date.
*   **`start_time`** (`TIME`): Session beginning.
*   **`end_time`** (`TIME`): Session termination.
*   **`status`** (`TEXT`): Booking state (`pending`, `confirmed`, `completed`, `cancelled`).
*   **`room_url`** (`TEXT`): Allocated LiveKit/Jitsi room identifier.
*   **`notes`** (`TEXT`): Personal session requirements.
*   **`deleted_at`** (`TIMESTAMP WITH TIME ZONE`): Soft deletion mark.

### 12. `badges`
Gamification rewards catalogue.
*   **`id`** (`UUID`, Primary Key): Generated using `gen_random_uuid()`.
*   **`name`** (`TEXT`): Badge label (e.g., "Quran Champion", "Speed Solver").
*   **`description`** (`TEXT`): Requirement criteria overview.
*   **`icon_url`** (`TEXT`): Visual graphic resource link.

### 13. `student_badges`
Collection of badges earned by students.
*   **`student_id`** (`UUID`): References `student_profiles(id)`.
*   **`badge_id`** (`UUID`): References `badges(id)`.
*   **`awarded_at`** (`TIMESTAMP`): Time of award.

### 14. `trial_requests`
Landing page conversions for trial bookings.
*   **`id`** (`UUID`, Primary Key): Generated using `gen_random_uuid()`.
*   **`parent_name`** (`TEXT`): Requester's name.
*   **`student_name`** (`TEXT`): Learner's name.
*   **`email`** (`TEXT`): Contact email.
*   **`phone`** (`TEXT`): Contact phone number.
*   **`grade_level`** (`TEXT`): Student grade level.
*   **`subject`** (`TEXT`): Target course interest.
*   **`status`** (`TEXT`): CRM phase (`pending`, `contacted`, `scheduled`, `completed`).

---

## 🔒 Row Level Security (RLS) Policy Guide

To guarantee database privacy, RLS policies dictate access based on the user's role (`auth.jwt()->>'role'` is parsed as `admin`, `teacher`, or `student`).

| Table | SELECT | INSERT | UPDATE | DELETE |
| :--- | :--- | :--- | :--- | :--- |
| **`tutors`** | Authenticated & Guests | Self Only | Self Only | Admins Only |
| **`lessons`** | Authenticated & Guests | Tutors & Admins | Owner Tutor | Owner Tutor |
| **`slides`** | Authenticated & Guests | Tutors & Admins | Owner Tutor | Owner Tutor |
| **`student_profiles`** | Owner, Tutors, Admins | Registered User | Owner Only | Admins Only |
| **`active_sessions`** | Checked by Class Code | Tutors & Admins | Session Tutor | Admins Only |
| **`session_participants`**| Authenticated Users | Authenticated & Guests | Tutors & Admins | Admins Only |
| **`responses`** | Authenticated Users | Authenticated & Guests | Admins Only | Admins Only |
| **`bookings`** | Assigned Student/Tutor | Assigned Student/Tutor | Owner/Tutor/Admin | Admins Only |
| **`lesson_progress`** | Assigned Student & Tutor| Tutors & Admins | Tutors & Admins | Admins Only |
| **`trial_requests`** | Admins Only | Anyone | Admins Only | Admins Only |

---

## ⚙️ Triggers and Database Functions

### 1. `public.handle_new_student()`
*   **Purpose**: Triggered immediately upon new user registration in Supabase Auth. Parses metadata flags (`full_name`, `grade_level`, `parent_email`) and provisions a matching profile record in `public.student_profiles`.
*   **Scope**: `AFTER INSERT ON auth.users`

### 2. `public.soft_delete_record(table_name, record_id)`
*   **Purpose**: Flags records (in `student_profiles`, `bookings`, or `enrollments`) with a timestamp in `deleted_at`, ensuring references are kept safe in analytics without physical hard deletion.
*   **Return**: `BOOLEAN`

---

## 🌐 Supabase Edge Functions API

### 1. Token Authority: `create-livekit-token`
Validates authentications and generates signed JSON Web Tokens (JWT) to grant secure entrance into video sessions.

#### HTTP Request Structure
*   **Method**: `POST`
*   **Endpoint**: `/functions/v1/create-livekit-token`
*   **Headers**: `Authorization: Bearer <user_token>`
*   **Payload**:
```json
{
  "resourceId": "booking-id-or-session-id",
  "resourceType": "booking" | "active_session",
  "participantName": "Johnny Student",
  "participantId": "student-uuid",
  "joinCode": "ABCD" // Required only for student/guest active_session joining
}
```

#### HTTP Response Structure
*   **Success (200 OK)**:
```json
{
  "token": "eyJhbGciOi...",
  "roomName": "room_uuid_prefix"
}
```
*   **Failure (401 / 403 / 404 / 500)**: Returns standard JSON error envelopes detailing authentication mismatch, closed session status, or missing parameters.
