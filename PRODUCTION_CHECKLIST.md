# Production Deployment Checklist

**Project:** StarBridgeTutoring  
**Last Updated:** June 2, 2026  
**Status:** Pre-deployment

## 🔒 Security Checklist

- [ ] **Environment Variables**
  - [ ] All `.env.example` variables are set in production
  - [ ] `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` are correct
  - [ ] LiveKit credentials are stored ONLY in Supabase Edge Function secrets
  - [ ] No secrets are committed to Git (verify `.gitignore`)

- [ ] **Supabase Configuration**
  - [ ] Row Level Security (RLS) is enabled on all tables
  - [ ] RLS policies are tested for student/teacher/admin roles
  - [ ] API key has appropriate scoping (anon key should be read-only where possible)
  - [ ] Edge Function secrets are configured and tested

- [ ] **Authentication**
  - [ ] Email verification is enabled for new signups
  - [ ] Password reset flow is tested end-to-end
  - [ ] OAuth (if applicable) is properly configured
  - [ ] Session timeout is set appropriately
  - [ ] CORS policies allow only your domain

- [ ] **API & Data**
  - [ ] All API calls use HTTPS only
  - [ ] Rate limiting is configured (if using Supabase functions)
  - [ ] Input validation happens server-side on Edge Functions
  - [ ] Sensitive data (passwords, API keys) is never logged
  - [ ] Database backups are automated and tested

## 📊 Performance & Monitoring

- [ ] **Frontend Performance**
  - [ ] Bundle size is under 2MB (gzipped)
  - [ ] Code splitting is working (verify with DevTools)
  - [ ] Images and assets are optimized (WebP format where possible)
  - [ ] Lighthouse score is >80 on mobile

- [ ] **Error Tracking**
  - [ ] Sentry (or equivalent) is configured for error logging
  - [ ] Error boundaries are rendering correctly
  - [ ] Error reporting includes user context when safe
  - [ ] Alerts are configured for critical errors

- [ ] **Analytics**
  - [ ] User tracking is GDPR-compliant
  - [ ] Session tracking is configured (if needed)
  - [ ] Conversion funnels are set up in analytics
  - [ ] Key metrics are monitored (lesson completion rate, etc.)

## 🎮 Features & Testing

  - [ ] Room creation Edge Function is deployed and tested
  - [ ] Demo room fallback is disabled in production
  - [ ] Video quality settings are optimized for low-bandwidth
  - [ ] Screen sharing works on major browsers
  - [ ] Audio/video permissions are properly requested
 - [ ] **Video Conferencing (LiveKit)**
   - [ ] LiveKit Cloud account is configured with API credentials
   - [ ] LIVEKIT_API_KEY and LIVEKIT_API_SECRET are in Edge Function secrets
   - [ ] create-livekit-token edge function is deployed and tested
   - [ ] VITE_LIVEKIT_URL environment variable is set
   - [ ] Token generation works end-to-end
   - [ ] Screen sharing works on major browsers
   - [ ] Audio/video permissions are properly requested
   - [ ] LiveKit dashboard is monitored for active sessions

- [ ] **Core Features**
  - [ ] Lesson creation and publishing flow is complete
  - [ ] Student enrollment works end-to-end
  - [ ] Classroom host/student sync is real-time
  - [ ] Quiz/poll responses are saved correctly
  - [ ] Whiteboard drawings persist across sessions

- [ ] **Payment Integration (if applicable)**
  - [ ] Payment gateway is configured (Stripe/PayPal)
  - [ ] Webhook endpoints are verified
  - [ ] Test transactions are successful
  - [ ] Invoice generation is automated
  - [ ] Refund process is documented

- [ ] **Email Communications**
  - [ ] Welcome emails are sent on signup
  - [ ] Class reminder emails are scheduled
  - [ ] Booking confirmation emails work
  - [ ] Email templates are branded correctly
  - [ ] Unsubscribe links are present and functional

## 🚀 Deployment

- [ ] **Frontend (Vercel)**
  - [ ] Build process completes without errors
  - [ ] Preview deployments work correctly
  - [ ] Environment variables are set in Vercel
  - [ ] Custom domain is configured and SSL is active
  - [ ] Redirects and rewrites are configured (see `vercel.json`)

- [ ] **Database (Supabase)**
  - [ ] All migrations have been applied
  - [ ] Database schema is up-to-date (verify against `database/starbridgetutoring_schema.sql`)
  - [ ] Indexes are created for performance
  - [ ] Vacuum/maintenance is scheduled
  - [ ] Database is replicated for disaster recovery

- [ ] **Edge Functions (Supabase)**
  - [ ] `create-livekit-token` function is deployed
  - [ ] Function secrets (LIVEKIT_API_KEY, LIVEKIT_API_SECRET) are configured
  - [ ] Function logs are monitored
  - [ ] Function timeout is set appropriately (>10 seconds)

## 📱 Cross-Browser & Device Testing

- [ ] **Desktop Browsers**
  - [ ] Chrome (latest)
  - [ ] Firefox (latest)
  - [ ] Safari (latest)
  - [ ] Edge (latest)

- [ ] **Mobile Devices**
  - [ ] iOS Safari (iPad & iPhone)
  - [ ] Android Chrome
  - [ ] Responsive design works on all breakpoints

- [ ] **Key Flows Tested**
  - [ ] Student signup → login → join class
  - [ ] Teacher login → create lesson → start class
  - [ ] Admin login → dashboard functions
  - [ ] Booking flow → payment → meeting room
  - [ ] Real-time data sync between host/student

## 📝 Documentation & Knowledge Transfer

- [ ] **README Updated**
  - [ ] Setup instructions are current
  - [ ] Environment variables section is complete
  - [ ] Troubleshooting guide is included
  - [ ] Contact/support information is listed

- [ ] **API Documentation**
  - [ ] Supabase schema is documented
  - [ ] Edge Function inputs/outputs are documented
  - [ ] Error codes are documented
  - [ ] Rate limits are documented

- [ ] **Runbooks Created**
  - [ ] How to scale during peak usage
  - [ ] How to handle database issues
  - [ ] How to debug video connection problems
  - [ ] How to roll back a deployment

## 🔄 Post-Deployment

- [ ] **Monitoring**
  - [ ] Error rates are within acceptable range (<0.1%)
  - [ ] API response times are <500ms median
  - [ ] Database query performance is acceptable
  - [ ] Video quality metrics are good (connection success rate >99%)

- [ ] **User Communication**
  - [ ] Status page is set up and monitored
  - [ ] Incident response procedure is documented
  - [ ] Support team is trained on new features
  - [ ] Release notes are published

- [ ] **Cleanup**
  - [ ] Demo/test accounts are removed from production
  - [ ] Temporary test data is cleaned up
  - [ ] Debug mode is disabled in frontend
  - [ ] Unused dependencies are removed

## 🎯 Sign-Off

| Role | Name | Date | Notes |
|------|------|------|-------|
| Frontend Lead | _____ | _____ | __________ |
| Backend/DB | _____ | _____ | __________ |
| QA/Testing | _____ | _____ | __________ |
| Project Manager | _____ | _____ | __________ |

## Notes & Issues

```
[Space for deployment notes, issues, and rollback procedures]
```

---

**Questions?** Contact the development team or review the documentation in `/docs`.
