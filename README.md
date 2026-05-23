# Starbridgetutor Website

This is a React + Vite application for the Starbridgetutor website.

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

> `DAILY_API_KEY` is a Supabase Edge Function secret and should NOT be stored in the client `.env` file.

## Supabase Edge Function Setup

This project uses a Supabase Edge Function at `supabase/functions/create-daily-room/index.ts` to create Daily.co meeting rooms.

1. Deploy your Supabase Edge Functions.
2. Add a secret named `DAILY_API_KEY` to the Supabase Edge Function settings.
3. Make sure the Edge Function is reachable from the frontend by the function name `create-daily-room`.

## What to Know

- `src/components`: Reusable UI components like `Navbar`, `Footer`, and route guards.
- `src/pages`: Application pages such as `Home`, `Login`, `TeacherDashboard`, `ClassroomHost`, and `ClassroomStudent`.
- `src/App.jsx`: Main router configuration and route protection.
- `src/contexts/AuthContext.jsx`: Auth state, session loading, and role handling.
- `src/services/api.js`: Supabase queries and room creation logic.

## Project Structure

- `src/components`: Reusable components like Navbar and Footer.
- `src/pages`: Individual page components (Home, Subjects, Tutors, etc.).
- `src/App.jsx`: Main entry point with routing setup.
- `src/contexts`: Auth and application context providers.
- `src/lib`: Supabase client initialization.
- `supabase/functions`: Edge functions used for server-side operations.
