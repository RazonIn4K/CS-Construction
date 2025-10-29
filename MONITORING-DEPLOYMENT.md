# Monitoring & Deployment Guide

Complete guide for deploying, monitoring, and maintaining the CD-Construction contractor dashboard in production.

---

## 📋 Table of Contents

1. [Pre-Deployment Checklist](#pre-deployment-checklist)
2. [Deployment Process](#deployment-process)
3. [Post-Deployment Verification](#post-deployment-verification)
4. [Monitoring Setup](#monitoring-setup)
5. [Alerting Configuration](#alerting-configuration)
6. [Performance Monitoring](#performance-monitoring)
7. [Maintenance & Operations](#maintenance--operations)

---

## 🔍 Pre-Deployment Checklist

### Code Quality
- [x] All TypeScript errors resolved (0 errors)
- [x] ESLint passing
- [x] Tests passing (unit tests)
- [x] Security audit complete
- [x] Dependencies up to date
- [ ] Performance benchmarks reviewed

### Database
- [x] Migrations applied to production
- [x] Seed data loaded (if applicable)
- [x] RLS policies tested
- [x] Backup strategy confirmed
- [ ] Connection pooling configured

### Environment Variables
- [ ] All required env vars set in Vercel
- [ ] Secrets rotated if needed
- [ ] API keys validated
- [ ] Third-party services configured

### Required Environment Variables:

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://[project-ref].supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...

# Email (Resend)
RESEND_API_KEY=re_...
FROM_EMAIL=noreply@yourdomain.com
CONTRACTOR_EMAIL=contractor@yourdomain.com

# SMS (Twilio)
TWILIO_ACCOUNT_SID=AC...
TWILIO_AUTH_TOKEN=...
TWILIO_PHONE_NUMBER=+1234567890

# Sentry (Error Tracking)
NEXT_PUBLIC_SENTRY_DSN=https://...@sentry.io/...
SENTRY_AUTH_TOKEN=sntrys_...
SENTRY_ORG=your-org
SENTRY_PROJECT=cd-construction

# Optional
NEXT_PUBLIC_SENTRY_ENABLED=true
NEXT_PUBLIC_VERCEL_ENV=production
```

### Testing
- [ ] API endpoints tested locally
- [ ] Authentication flow tested
- [ ] CRUD operations verified
- [ ] Notification system tested
- [ ] Browser compatibility checked

---

## 🚀 Deployment Process

### Option 1: Vercel (Recommended)

#### Initial Setup

1. **Connect GitHub Repository**
   ```bash
   # Install Vercel CLI
   npm install -g vercel

   # Login
   vercel login

   # Link project
   vercel link
   ```

2. **Configure Environment Variables**
   ```bash
   # Set via CLI
   vercel env add NEXT_PUBLIC_SUPABASE_URL
   vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY
   # ... repeat for all env vars

   # Or use Vercel Dashboard:
   # https://vercel.com/[your-team]/[project]/settings/environment-variables
   ```

3. **Deploy**
   ```bash
   # Deploy to production
   git push origin main

   # Or manual deploy
   vercel --prod
   ```

#### Auto-Deployment

Vercel automatically deploys when you push to `main`:

```yaml
# Automatic on push to main
git push origin main

# Creates:
# - Production URL: cd-construction.vercel.app
# - Preview URLs for PRs: pr-#.cd-construction.vercel.app
```

### Option 2: Self-Hosted (Docker)

```dockerfile
# Dockerfile (if needed)
FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .
RUN npm run build

ENV NODE_ENV=production
ENV PORT=3000

EXPOSE 3000

CMD ["npm", "start"]
```

Deploy:
```bash
docker build -t cd-construction .
docker run -p 3000:3000 \
  --env-file .env.production \
  cd-construction
```

---

## ✅ Post-Deployment Verification

### 1. Smoke Tests

Run the automated test script:

```bash
# Get your access token:
# 1. Login at https://your-app.vercel.app/login
# 2. DevTools -> Application -> Cookies -> sb-access-token

# Run tests
./scripts/test-api-endpoints.sh \
  https://your-app.vercel.app \
  eyJhbGc...your-token...

# Expected output:
# Total Tests: 15+
# Passed: 15+
# Failed: 0
```

### 2. Manual Verification

#### Authentication
```bash
# Test login
curl -X POST https://your-app.vercel.app/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@example.com",
    "password": "password"
  }'
```

#### Dashboard
```bash
# Visit in browser
open https://your-app.vercel.app/dashboard

# Check:
# - Stats load correctly
# - Projects display
# - No console errors
```

#### Database Connectivity
```bash
# Test a simple query
curl https://your-app.vercel.app/api/dashboard/stats \
  -H "Authorization: Bearer YOUR_TOKEN"

# Should return:
# {
#   "activeJobs": 0,
#   "pendingLeads": 0,
#   "unpaidInvoices": 0,
#   "totalRevenue": 0
# }
```

### 3. Performance Checks

```bash
# Lighthouse CI (requires Chrome)
npm install -g @lhci/cli

lhci autorun --collect.url=https://your-app.vercel.app

# Target scores:
# Performance: > 90
# Accessibility: > 95
# Best Practices: > 90
# SEO: > 90
```

### 4. Security Verification

```bash
# Check security headers
curl -I https://your-app.vercel.app

# Should include:
# X-Frame-Options: DENY
# X-Content-Type-Options: nosniff
# Strict-Transport-Security: max-age=31536000

# SSL/TLS check
openssl s_client -connect your-app.vercel.app:443 -servername your-app.vercel.app

# Should show:
# - TLS 1.2 or higher
# - Valid certificate
# - No weak ciphers
```

---

## 📊 Monitoring Setup

### 1. Sentry Error Tracking

#### Setup

1. **Create Sentry Project**
   - Go to https://sentry.io
   - Create new project (Next.js)
   - Copy DSN

2. **Configure Environment**
   ```bash
   NEXT_PUBLIC_SENTRY_DSN=https://...@sentry.io/...
   SENTRY_AUTH_TOKEN=sntrys_...
   SENTRY_ORG=your-org
   SENTRY_PROJECT=cd-construction
   ```

3. **Verify Installation**
   - Configuration files already in place:
     - `sentry.client.config.ts`
     - `sentry.server.config.ts`
     - `sentry.edge.config.ts`
   - Visit dashboard after deployment
   - Trigger test error to verify

4. **Test Error Capture**
   ```javascript
   // In browser console on deployed site
   throw new Error('Test Sentry error');

   // Should appear in Sentry dashboard within seconds
   ```

#### Key Metrics to Monitor

- **Error Rate**
  - Target: < 0.1% of requests
  - Alert: > 1% error rate over 5 minutes

- **Response Time**
  - Target: < 500ms p95
  - Alert: > 1s p95 over 5 minutes

- **User Impact**
  - Track affected users
  - Session replay for errors

### 2. Uptime Monitoring

#### UptimeRobot (Free)

1. **Create Account**: https://uptimerobot.com
2. **Add Monitor**:
   - Type: HTTP(S)
   - URL: https://your-app.vercel.app
   - Interval: 5 minutes
   - Alert Contacts: your-email@example.com

3. **Add API Endpoints**:
   ```
   https://your-app.vercel.app/api/dashboard/stats
   https://your-app.vercel.app/login
   ```

#### Better Uptime (Paid, Advanced)

```bash
# Features:
# - Status pages
# - Incident management
# - On-call scheduling
# - Multi-region checks
```

### 3. Performance Monitoring

#### Vercel Analytics

1. **Enable in Vercel Dashboard**
   - Project Settings -> Analytics
   - Enable Web Analytics

2. **Install Package**
   ```bash
   npm install @vercel/analytics
   ```

3. **Add to App**
   ```typescript
   // app/layout.tsx
   import { Analytics } from '@vercel/analytics/react';

   export default function RootLayout({ children }) {
     return (
       <html>
         <body>
           {children}
           <Analytics />
         </body>
       </html>
     );
   }
   ```

#### Web Vitals Tracking

Already configured in Sentry (`sentry.client.config.ts`):
- **LCP** (Largest Contentful Paint): < 2.5s
- **FID** (First Input Delay): < 100ms
- **CLS** (Cumulative Layout Shift): < 0.1
- **FCP** (First Contentful Paint): < 1.8s
- **TTFB** (Time to First Byte): < 600ms

### 4. Database Monitoring

#### Supabase Dashboard

1. **Monitor Query Performance**
   - Dashboard -> Database -> Query Performance
   - Check slow queries (> 100ms)
   - Review indexes

2. **Connection Pooling**
   - Monitor active connections
   - Target: < 80% of max connections
   - Alert: > 90% utilization

3. **Storage Usage**
   - Track database size growth
   - Set up automatic backups
   - Monitor WAL file size

#### Custom Monitoring

```typescript
// lib/database-monitor.ts
import { createClient } from '@/lib/supabase-server';

export async function checkDatabaseHealth() {
  const supabase = createClient();

  try {
    // Simple health check
    const { data, error } = await supabase
      .from('clients')
      .select('id')
      .limit(1);

    if (error) throw error;

    return {
      status: 'healthy',
      latency: Date.now() - startTime,
    };
  } catch (error) {
    return {
      status: 'unhealthy',
      error: error.message,
    };
  }
}
```

### 5. Log Aggregation

#### Vercel Logs

```bash
# View realtime logs
vercel logs --follow

# Filter by function
vercel logs --filter=/api/clients

# Download logs
vercel logs --output=logs.txt
```

#### Custom Logging

```typescript
// lib/logger.ts
import * as Sentry from '@sentry/nextjs';

export function logInfo(message: string, context?: any) {
  console.log(message, context);
  Sentry.addBreadcrumb({
    message,
    level: 'info',
    data: context,
  });
}

export function logError(message: string, error: Error, context?: any) {
  console.error(message, error, context);
  Sentry.captureException(error, {
    tags: context,
  });
}
```

---

## 🚨 Alerting Configuration

### Critical Alerts (PagerDuty / On-Call)

1. **Site Down**
   - Monitor: UptimeRobot
   - Threshold: 3 consecutive failures
   - Notify: Immediately

2. **Database Connection Failures**
   - Monitor: Sentry
   - Threshold: > 10 errors in 5 minutes
   - Notify: Immediately

3. **Authentication Failures**
   - Monitor: Sentry
   - Threshold: > 50% failure rate
   - Notify: Immediately

### High Priority Alerts (Slack / Email)

1. **High Error Rate**
   - Monitor: Sentry
   - Threshold: > 1% of requests
   - Notify: Within 15 minutes

2. **Slow Response Times**
   - Monitor: Vercel Analytics
   - Threshold: p95 > 2s for 10 minutes
   - Notify: Within 30 minutes

3. **High Memory Usage**
   - Monitor: Vercel Functions
   - Threshold: > 80% of limit
   - Notify: Within 1 hour

### Sentry Alert Rules

```javascript
// .sentryclirc
[alerts]
rules = [
  {
    name: "High Error Rate",
    conditions: [
      { "error_count": { "comparison": ">", "value": 100 } }
    ],
    actions: [
      { type: "email", targetType: "Team", targetIdentifier: "engineering" }
    ]
  },
  {
    name: "Critical Auth Errors",
    conditions: [
      { "tag:error.type": { "comparison": "equals", "value": "AuthError" } }
    ],
    actions: [
      { type: "slack", workspace: "your-workspace", channel: "#alerts" },
      { type: "pagerduty", service: "cd-construction" }
    ]
  }
]
```

---

## 🎯 Performance Monitoring

### API Response Times

**Target Benchmarks:**
- Dashboard stats: < 200ms
- List endpoints: < 300ms
- Detail endpoints: < 200ms
- Create/Update: < 400ms

**Monitoring:**
```typescript
// middleware.ts - Add timing
export async function middleware(request: NextRequest) {
  const start = Date.now();
  const response = await createResponse(request);
  const duration = Date.now() - start;

  response.headers.set('X-Response-Time', `${duration}ms`);

  // Log slow requests
  if (duration > 1000) {
    console.warn(`Slow request: ${request.url} took ${duration}ms`);
  }

  return response;
}
```

### Database Query Optimization

1. **Add Indexes**
   ```sql
   -- Common queries
   CREATE INDEX idx_leads_status ON leads(status);
   CREATE INDEX idx_jobs_client_id ON jobs(client_id);
   CREATE INDEX idx_invoices_status ON invoices(status);
   CREATE INDEX idx_created_at ON leads(created_at DESC);
   ```

2. **Monitor Slow Queries**
   ```sql
   -- In Supabase SQL Editor
   SELECT
     query,
     calls,
     total_time,
     mean_time,
     max_time
   FROM pg_stat_statements
   WHERE mean_time > 100  -- 100ms
   ORDER BY mean_time DESC
   LIMIT 20;
   ```

3. **Connection Pooling**
   ```typescript
   // Use Supabase connection pooler
   const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
   const poolerUrl = supabaseUrl.replace(
     '.supabase.co',
     '.pooler.supabase.co'
   );
   ```

---

## 🔧 Maintenance & Operations

### Daily Tasks

- [ ] Check Sentry for new errors
- [ ] Review uptime monitoring dashboard
- [ ] Check Vercel build status
- [ ] Monitor database connection count

### Weekly Tasks

- [ ] Review performance metrics
- [ ] Check slow query log
- [ ] Review Sentry issues and triage
- [ ] Update dependencies (if needed)
- [ ] Backup database manually (verify auto-backups)

### Monthly Tasks

- [ ] Security audit
- [ ] Performance optimization review
- [ ] Cost analysis (Vercel, Supabase, third-party)
- [ ] User feedback review
- [ ] Roadmap planning

### Database Maintenance

```bash
# Backup
supabase db dump --db-url YOUR_DATABASE_URL > backup_$(date +%Y%m%d).sql

# Restore
psql YOUR_DATABASE_URL < backup_20251029.sql

# Vacuum (reclaim space)
VACUUM ANALYZE;

# Update statistics
ANALYZE;
```

### Log Rotation

```bash
# Download and archive logs weekly
vercel logs --since 7d --output logs/$(date +%Y%m%d).log

# Compress
gzip logs/$(date +%Y%m%d).log

# Upload to S3 (optional)
aws s3 cp logs/$(date +%Y%m%d).log.gz s3://your-logs-bucket/
```

---

## 📱 Incident Response

### Severity Levels

**P0 - Critical (Response: Immediate)**
- Site completely down
- Data loss or corruption
- Security breach
- Authentication completely broken

**P1 - High (Response: < 1 hour)**
- Major feature broken
- Significant performance degradation
- Database connection issues
- Payment processing failures

**P2 - Medium (Response: < 4 hours)**
- Non-critical feature broken
- Minor performance issues
- Non-blocking bugs

**P3 - Low (Response: Next sprint)**
- UI inconsistencies
- Nice-to-have improvements
- Documentation updates

### Incident Checklist

1. **Acknowledge**
   - Post in #incidents Slack channel
   - Update status page (if applicable)

2. **Investigate**
   - Check Sentry for errors
   - Review Vercel logs
   - Check database status
   - Review recent deployments

3. **Mitigate**
   - Rollback deployment if needed
   - Scale resources if needed
   - Disable problematic feature

4. **Communicate**
   - Update stakeholders
   - Post status updates every 30 min
   - ETA for resolution

5. **Resolve**
   - Implement fix
   - Deploy and verify
   - Monitor for recurrence

6. **Post-Mortem**
   - Document incident
   - Root cause analysis
   - Prevention measures
   - Update runbooks

---

## 📞 Support Contacts

### Critical Issues
- **On-Call Engineer:** [Your Contact]
- **Database:** Supabase Support (https://supabase.com/support)
- **Hosting:** Vercel Support (https://vercel.com/support)

### Third-Party Services
- **Email:** Resend Support (support@resend.com)
- **SMS:** Twilio Support (https://www.twilio.com/help)
- **Monitoring:** Sentry Support (https://sentry.io/support)

---

## 🔗 Quick Links

- **Production Dashboard:** https://your-app.vercel.app/dashboard
- **Vercel Dashboard:** https://vercel.com/your-team/cd-construction
- **Supabase Dashboard:** https://supabase.com/dashboard/project/[ref]
- **Sentry Dashboard:** https://sentry.io/organizations/[org]/projects/cd-construction
- **Status Page:** [Setup status page URL]
- **Documentation:** [Internal wiki URL]
