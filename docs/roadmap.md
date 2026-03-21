# Roadmap: StarBridgeTutoring

This roadmap outlines the evolution of StarBridgeTutoring into a fully-fledged interactive EdTech platform.

---

## MVP (Minimum Viable Product)
**Focus:** Core Real-time Classroom and Essential Scaffolding

- [x] Basic React/Vite scaffolding.
- [x] Integrate Tailwind CSS with YELLOW primary theme.
- [ ] Implement Supabase Authentication (Teacher login & Student Join-by-Code).
- [ ] Set up PostgreSQL Tables via Supabase (`users`, `classes`, `lessons`).
- [ ] Teacher Dashboard: Create simple lessons and upload static slides (Images/PDFs via Supabase Storage).
- [ ] Real-time Synchronization: Connect Teacher screen to Student screens using Supabase Realtime (WebSocket).

---

## Phase 2
**Focus:** Interactivity and The "Lumio Killer" Features

- [ ] Interactive Quizzes: Teachers can broadcast multiple-choice questions.
- [ ] Shout-It-Out Board: A collaborative real-time board where students post sticky notes.
- [ ] Polls & Pulse Checks.
- [ ] Enhanced Mobile Optimization: ensuring touch-friendly interfaces for the student classroom.
- [ ] Basic Analytics: Track student attendance and participation rates per lesson.

---

## Phase 3
**Focus:** Specialized Modules and Ecosystem Growth

- [ ] **Islamic Classes Module:** Dedicated components for Quran reading, Fiqh, and Hadith studies.
- [ ] Gamification & Badging system for students.
- [ ] Advanced Teacher Insights: Downloadable CSV reports on student performance.
- [ ] Whiteboarding: Allow teachers to draw on slides in real time (using tldraw).
- [ ] Offline Support / PWA functionalities for students in extreme low-bandwidth areas (Service Workers).
