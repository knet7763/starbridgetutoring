# Starbridgetutor Website

This is a React + Vite application for the Starbridgetutor website.

## Quick Links

- **[Deployment Guide](./DEPLOYMENT_GUIDE.md)** - Full deployment instructions to production
- **[Production Checklist](./PRODUCTION_CHECKLIST.md)** - Pre-deployment verification
- **[Architecture](./docs/architecture.md)** - System design and data flow
- **[API Documentation](./docs/API.md)** - Supabase schema and edge functions

## Prerequisites

You need **Node.js** installed on your computer to run this project.
Download it here: [https://nodejs.org/](https://nodejs.org/)

## How to Run

1.  **Open a terminal** in this folder.
2.  **Install dependencies** by running:
    ```bash
    npm install
    ```
3.  Copy `.env.example` to `.env` and fill in your Supabase values.
4.  **Start the development server** by running:
    ```bash
    npm run dev
    ```
5.  Open the link shown in the terminal (usually `http://localhost:5173`) in your browser.

## Environment Variables

Create a `.env` file at the project root with the following values:

```bash
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

> `LIVEKIT_API_KEY` and `LIVEKIT_API_SECRET` are Supabase Edge Function secrets and should NOT be stored in the client `.env` file.

## Supabase Edge Function Setup

This project uses a Supabase Edge Function at `supabase/functions/create-livekit-token/index.ts` to generate LiveKit access tokens.

1. Deploy your Supabase Edge Functions.
2. Add secrets named `LIVEKIT_API_KEY` and `LIVEKIT_API_SECRET` to the Supabase Edge Function settings.
3. Make sure the Edge Function is reachable from the frontend by the function name `create-livekit-token`.

## What to Know

- `src/components`: Reusable UI components like `Navbar`, `Footer`, and route guards.
- `src/pages`: Application pages such as `Home`, `Login`, `TeacherDashboard`, `ClassroomHost`, and `ClassroomStudent`.
- `src/App.jsx`: Main router configuration and route protection.
- `src/contexts/AuthContext.jsx`: Auth state, session loading, and role handling.
- `src/services/api.js`: Supabase queries and room creation logic.

## Project Structure

- `src/components`: Reusable components including `Navbar`, `Footer`, route guards, and `ErrorBoundary` for error handling.
- `src/pages`: Individual page components (Home, Subjects, Tutors, Dashboard, Classroom, etc.).
- `src/App.jsx`: Main entry point with routing setup, wrapped in `ErrorBoundary`.
- `src/contexts`: Auth and application context providers (`AuthContext.jsx`).
- `src/lib`: Supabase client initialization (`supabase.js`).
- `src/services`: Centralized API logic with error handling (`api.js`) and video conferencing (`videoService.js`).
- `src/hooks`: Custom React hooks (`useVideoRoom.js`, `useRealtimeClassroom.js`).
- `src/services/videoService.js`: Abstraction layer for LiveKit token generation and provider configuration.
- `supabase/functions`: Edge functions used for server-side operations (room creation, etc.).
