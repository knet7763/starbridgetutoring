# Deployment Instructions

Deploying **StarBridgeTutoring** involves two main steps: configuring the backend on Supabase and hosting the frontend on Vercel.

## 1. Supabase (Backend/Database)

1. **Create Project:**
   - Go to [Supabase](https://supabase.com) and create a new project.
   - Set a strong database password and select the region closest to your users (e.g., EU or Africa if available).

2. **Execute Schema:**
   - Navigate to the **SQL Editor** in the Supabase Dashboard.
   - Copy the contents of `database/starbridgetutoring_schema.sql` and run it. This provisions all tables, RLS policies, indexes, and the student auto-signup trigger in a single idempotent script.

3. **Storage Setup:**
   - Go to **Storage**, create a new **public** bucket named `lesson-materials`.
   - Grant **authenticated** users INSERT access, and grant **public** SELECT access.

4. **Environment Variables:**
   - Go to **Project Settings > API** and copy your `Project URL` and `anon public` key.

## 2. Vercel (Frontend)

1. **GitHub Integration:**
   - Push your Vite React codebase to a GitHub repository.
   - Go to [Vercel](https://vercel.com) and click **Add New > Project**.
   - Import the GitHub repository for StarBridgeTutoring.

2. **Configure Build:**
   - Vercel should automatically detect **Vite** as the framework.
   - Build Command: `npm run build`
   - Output Directory: `dist`

3. **Set Environment Variables:**
   - Add the following environment variables in the Vercel dashboard:
     - `VITE_SUPABASE_URL`: (Your Supabase Project URL)
     - `VITE_SUPABASE_ANON_KEY`: (Your Supabase Anon Key)

4. **Deploy:**
   - Click **Deploy**. Vercel will build and host your site on a secure HTTPS URL.
   - Set up custom domains if necessary.

---

*Note: For local development, create a `.env.local` file with the exact same variables before running `npm run dev`.*
