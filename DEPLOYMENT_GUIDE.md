# Deployment Guide

**Project:** StarBridgeTutoring  
**Stack:** React + Vite (Frontend), Supabase (Backend), Vercel (Hosting)

## Prerequisites

+ LiveKit Cloud account with API credentials
+ Domain name (optional but recommended)

---

## Phase 1: Local Setup

### 1. Clone & Install Dependencies

```bash
git clone <repository-url>
cd Starbridgetutor
npm install
```

### 2. Configure Environment Variables

Create `.env.local` for local development:

```bash
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
VITE_APP_ENV=development
```

Test locally:
```bash
npm run dev
```

---

## Phase 2: Supabase Configuration

### 1. Verify Database Schema

Connect to your Supabase project and run the schema migration:

```sql
-- Paste contents of database/starbridgetutoring_schema.sql
-- Into Supabase SQL Editor → New Query
```

### 2. Set Up Row Level Security (RLS)

Verify RLS is enabled on all tables:

```bash
Supabase Dashboard → Authentication → Row Level Security
```

Enable RLS for these tables:
- `tutors`
- `student_profiles`
- `classes`
- `lessons`
- `slides`
- `active_sessions`
- `bookings`
- `enrollments`

### 3. Deploy Edge Functions

Navigate to `supabase/functions/create-livekit-token/`:

```bash
# Ensure Supabase CLI is installed
npm install -g supabase

# Link to your project
supabase link

# Deploy edge function
supabase functions deploy create-livekit-token
```

### 4. Configure LiveKit Credentials

In Supabase Dashboard:
```
Edge Functions → create-livekit-token → Secrets
```

Add:
```
LIVEKIT_API_KEY=your-livekit-api-key
LIVEKIT_API_SECRET=your-livekit-api-secret
```

### 5. Configure Frontend LiveKit URL

Update your `.env.local` or Vercel environment variables:
```bash
VITE_LIVEKIT_URL=wss://your-project.livekit.cloud
```

### 6. Test Edge Function

```bash
curl -X POST https://your-project-id.supabase.co/functions/v1/create-livekit-token \
  -H "Content-Type: application/json" \
  -d '{
    "sessionId":"session-123",
    "participantName":"Test User",
    "participantId":"user-456"
  }'
```

You should receive a JSON response containing a `token` and `roomName`.

---

## Phase 3: Vercel Deployment

### 1. Push to GitHub

```bash
git add .
git commit -m "chore: production deployment"
git push origin main
```

### 2. Create Vercel Project

Option A: **Automatic (Recommended)**
- Go to [vercel.com](https://vercel.com)
- Import your GitHub repository
- Vercel will auto-detect Vite configuration

Option B: **Manual**
```bash
npm install -g vercel
vercel
```

### 3. Set Environment Variables in Vercel

Vercel Dashboard → Settings → Environment Variables

```
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
VITE_APP_ENV=production
VITE_LIVEKIT_URL=wss://your-project.livekit.cloud
```

### 4. Configure Build Settings

Ensure Vercel detects:
```
Framework: Vite
Build Command: npm run build
Output Directory: dist
```

### 5. Deploy

Push to `main` branch or manually trigger deployment:

```bash
vercel --prod
```

Monitor build at: https://vercel.com/dashboard

---

## Phase 4: Post-Deployment Verification

### 1. Test Frontend

- [ ] Visit deployed URL
- [ ] Public pages load (Home, About, Pricing)
- [ ] Login flow works
- [ ] CSS/images load correctly (no 404s)

### 2. Test Authentication

- [ ] Student signup works
- [ ] Teacher login works
- [ ] Admin login works
- [ ] Password reset email is sent

### 3. Test Video Conferencing

- [ ] Create a session
- [ ] LiveKit token is generated successfully
- [ ] Join classroom as host
- [ ] Join classroom as student
- [ ] Video/audio works
- [ ] Screen sharing works
- [ ] Check LiveKit dashboard for active sessions

### 4. Test Database Operations

- [ ] Create a lesson
- [ ] Create a booking
- [ ] Submit a quiz response
- [ ] Check data appears in Supabase dashboard

### 5. Monitor Errors

- [ ] Check Supabase logs for Edge Function errors
- [ ] Check Vercel logs for frontend errors
- [ ] Set up error tracking (Sentry, etc.)

---

## Phase 5: Custom Domain Setup (Optional)

### 1. Add Domain to Vercel

Vercel Dashboard → Settings → Domains

```
Domain: yourdomain.com
```

### 2. Update DNS Records

Your DNS provider (GoDaddy, Namecheap, etc.):

```
CNAME: yourdomain.com → cname.vercel-dns.com
```

### 3. Enable Auto SSL

Vercel automatically provisions SSL certificate (takes ~5 min)

### 4. Redirect WWW

```
www.yourdomain.com → yourdomain.com
```

---

## Phase 6: Performance Optimization

### 1. Check Bundle Size

```bash
npm run build
# Review dist/ folder size (should be <2MB gzipped)
```

### 2. Optimize Images

Use Next.js Image component or CDN optimization:
```
https://supabase.com/docs/guides/storage
```

### 3. Enable Caching

Vercel handles HTTP caching automatically, but verify:
```bash
# Test with curl -I
curl -I https://yourdomain.com
# Look for: Cache-Control: public, max-age=...
```

### 4. Monitor Lighthouse Score

```bash
# Build and audit
npm run build
npm run preview

# Use Chrome DevTools → Lighthouse
# Target: >80 score on mobile
```

---

## Phase 7: Monitoring & Maintenance

### 1. Set Up Error Tracking

**Option A: Sentry**
```bash
npm install @sentry/react
```

Update `.env`:
```
VITE_SENTRY_DSN=https://your-sentry-dsn@sentry.io/project
```

**Option B: Supabase Logs**
- Monitor: Supabase Dashboard → Edge Functions → Logs

### 2. Set Up Uptime Monitoring

Use services like:
- Pingdom
- UptimeRobot
- Datadog

Alert when:
- Site returns non-200 status
- Response time exceeds 2 seconds
- LiveKit token generation fails

### 3. Schedule Regular Backups

**Database:**
```bash
# Supabase auto-backs up, but verify:
Supabase Dashboard → Settings → Database
# Look for daily snapshots
```

### 4. Monitor Analytics

Set up goals for:
- User signup completion rate
- Lesson view duration
- Video call duration
- Booking completion rate

---

## Troubleshooting

### Issue: "VITE_SUPABASE_URL not defined"

**Solution:**
```bash
# Verify env vars are in Vercel
vercel env ls

# Re-run build
vercel --prod
```

### Issue: "LiveKit token generation fails"

**Solution:**
1. Check Edge Function logs
2. Verify LIVEKIT_API_KEY and LIVEKIT_API_SECRET are set correctly
3. Test Edge Function manually:
```bash
supabase functions serve create-livekit-token
```

### Issue: "Video calls won't connect"

**Solution:**
1. Check browser console for WebRTC errors
2. Verify firewall isn't blocking WebRTC ports
3. Test on different network (mobile hotspot)
4. Check LiveKit dashboard for room status

### Issue: "RLS preventing data access"

**Solution:**
1. Check Supabase RLS policies
2. Verify user roles are set correctly:
```sql
SELECT id, email, app_metadata FROM auth.users;
-- Look for role in app_metadata
```

### Issue: "Build fails on Vercel"

**Solution:**
```bash
# Test build locally
npm run build

# Check for TypeScript errors
npm run lint

# Push only if build succeeds locally
```

---

## Rollback Procedure

If something goes wrong:

### 1. Rollback Frontend (Vercel)

```bash
Vercel Dashboard → Deployments → Select Previous → Promote to Production
```

### 2. Rollback Database (Supabase)

```bash
Supabase Dashboard → Settings → Point-in-time Recovery
# Restore from previous snapshot
```

### 3. Rollback Edge Function

```bash
supabase functions deploy create-livekit-token --branch main
# Redeploy previous version
```

---

## Post-Launch Checklist

- [ ] Monitor error rates for 24 hours
- [ ] Monitor LiveKit token generation and session metrics
- [ ] Check Supabase database size
- [ ] Verify email delivery is working
- [ ] Confirm payment processing (if applicable)
- [ ] Send launch announcement to users
- [ ] Update status page to "All Systems Operational"

---

## Support & Documentation

- **Supabase Docs:** https://supabase.com/docs
- **Vercel Docs:** https://vercel.com/docs
- **LiveKit Docs:** https://docs.livekit.io
- **React Vite:** https://vitejs.dev/guide/
- **Tailwind CSS:** https://tailwindcss.com/docs

**Questions?** Reach out to the development team or check the troubleshooting section above.

---

**Last Deployed:** [Date]  
**Deployed By:** [Name]  
**Status:** ✅ Production
