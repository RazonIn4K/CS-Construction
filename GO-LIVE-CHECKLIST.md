# CD Home Improvements - Production Go-Live Checklist

**Complete deployment verification and launch procedures**

---

## 📋 Table of Contents

- [Overview](#overview)
- [Pre-Deployment Verification](#pre-deployment-verification)
- [Go/No-Go Decision Criteria](#gono-go-decision-criteria)
- [Deployment Timeline](#deployment-timeline)
- [Phase 1: Infrastructure Setup](#phase-1-infrastructure-setup)
- [Phase 2: Service Deployment](#phase-2-service-deployment)
- [Phase 3: Application Deployment](#phase-3-application-deployment)
- [Phase 4: Integration Verification](#phase-4-integration-verification)
- [Phase 5: Go-Live](#phase-5-go-live)
- [Post-Launch Monitoring](#post-launch-monitoring)
- [Rollback Procedures](#rollback-procedures)
- [Support & Escalation](#support--escalation)

---

## 🎯 Overview

This checklist guides you through the complete production deployment of the CD Home Improvements business management system. Follow each step sequentially to ensure a successful go-live.

**Estimated Total Time:** 4-6 hours (excluding DNS propagation)

**Team Required:**
- Technical Lead (manages deployment)
- Business Owner (approves go-live decision)
- QA/Tester (verifies functionality)

**Deployment Strategy:** Blue-Green Deployment
- Deploy all services to production environment
- Verify functionality before switching DNS
- Minimal downtime (DNS propagation only)

---

## ✅ Pre-Deployment Verification

### Checklist Items

Complete ALL items before proceeding with deployment:

#### Accounts & Credentials

- [ ] **Vercel Account**
  - [ ] Billing configured (Pro plan recommended for production)
  - [ ] Team members invited
  - [ ] GitHub repository connected

- [ ] **Supabase Account**
  - [ ] Project created and linked
  - [ ] Database password saved securely
  - [ ] Row Level Security (RLS) reviewed
  - [ ] Backup schedule configured

- [ ] **Stripe Account**
  - [ ] Live mode activated (requires business verification)
  - [ ] Business details completed
  - [ ] Bank account connected for payouts
  - [ ] Tax settings configured
  - [ ] Webhook endpoint configured (URL: https://cdhomeimprovementsrockford.com/api/webhooks/stripe)

- [ ] **Email Service (Postmark/SendGrid)**
  - [ ] Domain verified
  - [ ] SPF/DKIM records configured
  - [ ] Sender signatures approved
  - [ ] Email templates created

- [ ] **Sentry Account**
  - [ ] Project created
  - [ ] DSN keys generated
  - [ ] Alert rules configured
  - [ ] Team notifications enabled

- [ ] **VPS Provider**
  - [ ] Server provisioned (minimum: 2 vCPU, 4GB RAM, 80GB SSD)
  - [ ] Ubuntu 22.04/24.04 LTS installed
  - [ ] SSH access configured
  - [ ] Firewall configured (ports 80, 443, 22)

- [ ] **Domain & DNS**
  - [ ] Domain purchased (cdhomeimprovementsrockford.com)
  - [ ] DNS management access available
  - [ ] Nameservers configured

#### Code & Configuration

- [ ] **Repository**
  - [ ] All code committed and pushed to main branch
  - [ ] No uncommitted changes locally
  - [ ] GitHub Actions workflows enabled
  - [ ] Branch protection rules configured

- [ ] **Environment Variables**
  - [ ] All variables documented in .env.example
  - [ ] Production values prepared (DO NOT commit to repo)
  - [ ] Secrets stored securely (password manager)

- [ ] **Database**
  - [ ] All migrations tested locally
  - [ ] Migration order verified
  - [ ] Rollback scripts prepared

- [ ] **Testing**
  - [ ] Unit tests passing (`npm run test`)
  - [ ] Type checking passing (`npm run type-check`)
  - [ ] Linting passing (`npm run lint`)
  - [ ] Manual testing completed (see TESTING.md)

#### Documentation

- [ ] README.md reviewed and up-to-date
- [ ] TESTING.md reviewed
- [ ] docker/README-DOCKER.md reviewed
- [ ] docker/DEPLOY-CHECKLIST.md reviewed
- [ ] All team members trained on system

---

## 🚦 Go/No-Go Decision Criteria

**Review this section 24 hours before planned go-live.**

### GO Criteria (All must be TRUE)

- ✅ All pre-deployment verification items completed
- ✅ All critical tests passing (see TESTING.md)
- ✅ No open critical or high-severity bugs
- ✅ Stripe live mode activated and verified
- ✅ VPS server provisioned and accessible
- ✅ DNS records prepared (not yet activated)
- ✅ Rollback plan documented and understood
- ✅ Team available for 4-6 hour deployment window
- ✅ Business owner approval obtained

### NO-GO Criteria (Any of these = STOP)

- ❌ Critical bugs identified in testing
- ❌ Stripe live mode not activated
- ❌ VPS not provisioned or inaccessible
- ❌ Key team members unavailable
- ❌ DNS provider access lost
- ❌ Email service not configured
- ❌ Supabase database not accessible
- ❌ GitHub Actions failing

### Decision Log

**Go-Live Date:** _____________
**Decision:** [ ] GO  [ ] NO-GO
**Decided By:** _____________
**Date/Time:** _____________
**Notes:** _____________

---

## ⏱️ Deployment Timeline

**Total Duration:** 4-6 hours

```
Phase 1: Infrastructure Setup     [60-90 min]
├── DNS record preparation
├── VPS configuration
└── SSL certificate prep

Phase 2: Service Deployment       [90-120 min]
├── Docker stack deployment
├── Database initialization
└── Service verification

Phase 3: Application Deployment   [30-60 min]
├── Next.js to Vercel
├── Supabase migrations
└── Environment variables

Phase 4: Integration Verification [60-90 min]
├── End-to-end testing
├── Webhook testing
└── Payment testing

Phase 5: Go-Live                  [30-60 min]
├── DNS activation
├── Final smoke tests
└── Monitoring verification

Post-Launch: Monitoring           [24-48 hours]
├── Error tracking
├── Performance monitoring
└── User feedback collection
```

---

## 🏗️ Phase 1: Infrastructure Setup

**Duration:** 60-90 minutes
**Prerequisites:** VPS access, domain registrar access

### Step 1.1: Prepare DNS Records

**DO NOT activate yet - just prepare the records**

Access your DNS provider (Namecheap, GoDaddy, Cloudflare, etc.) and prepare these records:

```
# A Records (Point to VPS IP)
Type: A
Host: @
Value: YOUR_VPS_IP
TTL: 300 (5 minutes)

Type: A
Host: portal
Value: YOUR_VPS_IP
TTL: 300

Type: A
Host: automate
Value: YOUR_VPS_IP
TTL: 300

Type: A
Host: status
Value: YOUR_VPS_IP
TTL: 300

# Vercel Next.js (CNAME)
Type: CNAME
Host: www
Value: cname.vercel-dns.com
TTL: 300
```

**Verification:**
- [ ] All records prepared but NOT saved/activated
- [ ] VPS IP address confirmed and reachable
- [ ] TTL set to 300 seconds (5 minutes) for quick propagation

### Step 1.2: Configure VPS

SSH into your VPS:

```bash
# SSH into VPS
ssh root@YOUR_VPS_IP

# Update system
sudo apt update && sudo apt upgrade -y

# Install required packages
sudo apt install -y \
    ca-certificates \
    curl \
    gnupg \
    lsb-release \
    ufw \
    fail2ban

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Install Docker Compose V2
sudo apt install -y docker-compose-plugin

# Verify installations
docker --version
docker compose version

# Configure firewall
sudo ufw allow 22/tcp   # SSH
sudo ufw allow 80/tcp   # HTTP
sudo ufw allow 443/tcp  # HTTPS
sudo ufw --force enable

# Configure fail2ban (SSH brute-force protection)
sudo systemctl enable fail2ban
sudo systemctl start fail2ban

# Create application directory
sudo mkdir -p /opt/cdhi-stack
sudo chown $USER:$USER /opt/cdhi-stack
```

**Verification:**
- [ ] Docker version 20.10+
- [ ] Docker Compose V2 installed
- [ ] Firewall active with correct ports open
- [ ] fail2ban running
- [ ] /opt/cdhi-stack directory created

### Step 1.3: Configure Server Security

```bash
# Create swap file (if RAM < 8GB)
sudo fallocate -l 4G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile
echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab

# Set up automatic security updates
sudo apt install -y unattended-upgrades
sudo dpkg-reconfigure -plow unattended-upgrades

# Configure log rotation
sudo tee /etc/logrotate.d/docker-containers << 'EOF'
/var/lib/docker/containers/*/*.log {
    rotate 7
    daily
    compress
    size 10M
    missingok
    delaycompress
    copytruncate
}
EOF

# Create backup directory
sudo mkdir -p /backup/cdhi
sudo chown $USER:$USER /backup/cdhi
```

**Verification:**
- [ ] Swap file active (`free -h` shows swap)
- [ ] Automatic updates enabled
- [ ] Log rotation configured
- [ ] Backup directory created

---

## 🐳 Phase 2: Service Deployment

**Duration:** 90-120 minutes
**Prerequisites:** Phase 1 completed, GitHub access

### Step 2.1: Clone Repository

```bash
cd /opt/cdhi-stack

# Clone repository
git clone https://github.com/YOUR_USERNAME/cd-construction.git .

# Verify files
ls -la

# Expected files:
# - docker/
# - app/
# - components/
# - lib/
# - README.md
```

**Verification:**
- [ ] Repository cloned successfully
- [ ] All files present
- [ ] docker/ directory exists

### Step 2.2: Configure Environment

```bash
cd /opt/cdhi-stack/docker

# Copy environment template
cp .env.docker.example .env

# Edit environment file
nano .env
```

**Required Variables (30+ total):**

```bash
# Domain Configuration
DOMAIN=cdhomeimprovementsrockford.com

# MariaDB
DB_ROOT_PASSWORD=CHANGE_ME_SECURE_PASSWORD_1
DB_DATABASE=invoiceninja
DB_USERNAME=invoiceninja
DB_PASSWORD=CHANGE_ME_SECURE_PASSWORD_2

# Invoice Ninja
INVOICENINJA_URL=https://portal.cdhomeimprovementsrockford.com
APP_KEY=base64:GENERATE_WITH_php_artisan_key:generate
DB_HOST=mariadb
IN_USER_EMAIL=admin@cdhomeimprovementsrockford.com
IN_PASSWORD=CHANGE_ME_SECURE_PASSWORD_3
IN_API_TOKEN=GENERATE_RANDOM_32_CHAR_STRING

# n8n
N8N_HOST=automate.cdhomeimprovementsrockford.com
N8N_ENCRYPTION_KEY=GENERATE_RANDOM_32_CHAR_STRING
N8N_BASIC_AUTH_USER=admin
N8N_BASIC_AUTH_PASSWORD=CHANGE_ME_SECURE_PASSWORD_4

# Email (for n8n)
N8N_EMAIL_MODE=smtp
N8N_SMTP_HOST=smtp.postmarkapp.com
N8N_SMTP_PORT=587
N8N_SMTP_USER=YOUR_POSTMARK_TOKEN
N8N_SMTP_PASS=YOUR_POSTMARK_TOKEN
N8N_SMTP_SENDER=noreply@cdhomeimprovementsrockford.com

# Uptime Kuma (no config needed, set up via UI)
```

**Generate Secure Values:**

```bash
# Generate random passwords
openssl rand -base64 32

# Generate Invoice Ninja APP_KEY
docker run --rm invoiceninja/invoiceninja:5 php artisan key:generate --show

# Generate API token
openssl rand -hex 16
```

**Verification:**
- [ ] All CHANGE_ME values replaced
- [ ] All passwords are unique and strong (32+ characters)
- [ ] Email credentials correct (test with `telnet smtp.postmarkapp.com 587`)
- [ ] Domain names correct
- [ ] .env file permissions: `chmod 600 .env`

### Step 2.3: Start Docker Stack

```bash
cd /opt/cdhi-stack/docker

# Pull all images (takes 5-10 minutes)
docker compose pull

# Start services (detached mode)
docker compose up -d

# Watch logs
docker compose logs -f
```

**Expected Output:**
```
[+] Running 7/7
 ✔ Container cdhi-mariadb               Started
 ✔ Container cdhi-invoiceninja          Started
 ✔ Container cdhi-invoiceninja-queue    Started
 ✔ Container cdhi-invoiceninja-scheduler Started
 ✔ Container cdhi-n8n                   Started
 ✔ Container cdhi-uptime-kuma           Started
 ✔ Container cdhi-caddy                 Started
```

**Wait for Services to Initialize (5-10 minutes)**

Monitor logs for readiness:

```bash
# Check all services running
docker compose ps

# Expected: All services show "running (healthy)"

# Check Caddy logs for SSL certificates
docker compose logs caddy | grep -i "certificate"

# Expected: "certificate obtained successfully"
```

**Verification:**
- [ ] All 7 containers running
- [ ] MariaDB healthy: `docker compose exec mariadb mysqladmin ping -p`
- [ ] Invoice Ninja responding: `curl -I http://localhost:80`
- [ ] n8n responding: `curl -I http://localhost:5678`
- [ ] Uptime Kuma responding: `curl -I http://localhost:3001`
- [ ] Caddy healthy (check logs for errors)

### Step 2.4: Initialize Invoice Ninja

```bash
# Wait for Invoice Ninja to initialize database (2-3 minutes)
docker compose logs -f invoiceninja

# Look for: "Application is now ready"

# Access Invoice Ninja (via curl since DNS not active yet)
curl -I http://localhost:80

# Expected: HTTP/1.1 200 OK
```

**Initial Setup via Browser (if DNS active):**

If you've activated DNS early or using /etc/hosts hack:

1. Navigate to: `https://portal.cdhomeimprovementsrockford.com`
2. Complete setup wizard:
   - Email: admin@cdhomeimprovementsrockford.com
   - Password: (from .env IN_PASSWORD)
   - Company name: CD Home Improvements
   - Country: United States
3. Configure settings:
   - Currency: USD
   - Date format: MM/DD/YYYY
   - Timezone: America/Chicago
4. Generate API token:
   - Settings → Account Management → API Tokens
   - Create token
   - Save to .env as IN_API_TOKEN

**Verification:**
- [ ] Invoice Ninja accessible via HTTPS
- [ ] Setup wizard completed
- [ ] API token generated
- [ ] Test client created successfully

### Step 2.5: Configure n8n

**Access n8n:**

Navigate to: `https://automate.cdhomeimprovementsrockford.com`

**Initial Setup:**
1. Create owner account:
   - Email: admin@cdhomeimprovementsrockford.com
   - Password: (secure password, save in password manager)

2. Import workflow:
   - Click **"+"** → **"Import from File"**
   - Select: `/opt/cdhi-stack/docker/n8n-workflows/lead-intake.json`

3. Configure workflow credentials:
   - **Invoice Ninja API:**
     - URL: https://portal.cdhomeimprovementsrockford.com
     - API Token: (from Invoice Ninja)

   - **Email (SMTP):**
     - Host: smtp.postmarkapp.com
     - Port: 587
     - Username: (Postmark token)
     - Password: (Postmark token)
     - From: noreply@cdhomeimprovementsrockford.com

4. Activate workflow:
   - Toggle workflow to **"Active"**
   - Note webhook URL: `https://automate.cdhomeimprovementsrockford.com/webhook/lead-intake`

**Verification:**
- [ ] n8n accessible via HTTPS
- [ ] Workflow imported successfully
- [ ] All credentials configured
- [ ] Workflow activated (green toggle)
- [ ] Webhook URL copied for Next.js configuration

### Step 2.6: Configure Uptime Kuma

**Access Uptime Kuma:**

Navigate to: `https://status.cdhomeimprovementsrockford.com`

**Initial Setup:**
1. Create admin account (first-time only)
2. Follow setup guide: [docker/UPTIME-KUMA-SETUP.md](./docker/UPTIME-KUMA-SETUP.md)
3. Create monitors (defer to Phase 4 after Next.js deployed)

**Verification:**
- [ ] Uptime Kuma accessible via HTTPS
- [ ] Admin account created
- [ ] Dashboard accessible

---

## 🚀 Phase 3: Application Deployment

**Duration:** 30-60 minutes
**Prerequisites:** Phase 2 completed, Vercel account configured

### Step 3.1: Deploy Supabase Database

**On your local machine:**

```bash
# Navigate to project
cd /path/to/cd-construction

# Link to Supabase project
supabase link --project-ref YOUR_PROJECT_ID

# Push migrations to production
supabase db push --db-url YOUR_PRODUCTION_DATABASE_URL

# Generate TypeScript types
supabase gen types typescript --linked > types/database.types.ts

# Commit updated types
git add types/database.types.ts
git commit -m "chore: update database types for production"
git push origin main
```

**Verify Database:**

```bash
# Connect to Supabase via psql
psql "postgresql://postgres:YOUR_PASSWORD@db.YOUR_PROJECT_ID.supabase.co:5432/postgres"

# List tables
\dt

# Expected: 14 tables (clients, leads, properties, invoices, etc.)

# Check data
SELECT COUNT(*) FROM leads;
SELECT COUNT(*) FROM clients;

# Exit
\q
```

**Verification:**
- [ ] All 14 tables created
- [ ] All views created (v_invoice_summary, v_client_ar)
- [ ] All enums created
- [ ] TypeScript types generated and committed

### Step 3.2: Configure Vercel Environment Variables

**Via Vercel Dashboard:**

1. Navigate to: https://vercel.com/YOUR_TEAM/cd-construction
2. Go to: **Settings** → **Environment Variables**
3. Add the following variables:

**Supabase:**
```
NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT_ID.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ... (from Supabase dashboard)
SUPABASE_SERVICE_ROLE_KEY=eyJ... (from Supabase dashboard)
```

**Stripe:**
```
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_... (from Stripe dashboard)
STRIPE_SECRET_KEY=sk_live_... (from Stripe dashboard)
STRIPE_WEBHOOK_SECRET=whsec_... (will configure after deployment)
```

**n8n:**
```
N8N_WEBHOOK_BASE_URL=https://automate.cdhomeimprovementsrockford.com
N8N_WEBHOOK_LEAD_INTAKE=/webhook/lead-intake
```

**Email:**
```
EMAIL_FROM=noreply@cdhomeimprovementsrockford.com
EMAIL_API_KEY=... (Postmark/SendGrid API key)
EMAIL_PROVIDER=postmark
```

**Sentry:**
```
NEXT_PUBLIC_SENTRY_DSN=https://...@sentry.io/...
SENTRY_DSN=https://...@sentry.io/...
SENTRY_AUTH_TOKEN=... (for source maps)
SENTRY_ORG=cd-home-improvements
SENTRY_PROJECT=nextjs
```

**Admin:**
```
ADMIN_API_KEY=... (generate secure random string)
```

**Verification:**
- [ ] All 15+ environment variables configured
- [ ] No typos in variable names
- [ ] All keys valid (test with Stripe CLI, Supabase, etc.)

### Step 3.3: Deploy to Vercel

**Option A: Via GitHub (Recommended)**

```bash
# On local machine
cd /path/to/cd-construction

# Ensure all changes committed
git status

# Push to main branch
git push origin main

# GitHub Actions will automatically deploy to Vercel
```

**Monitor Deployment:**
1. Go to: https://github.com/YOUR_USERNAME/cd-construction/actions
2. Watch "Deploy to Vercel" workflow
3. Expected: ✅ All checks passing (5-10 minutes)

**Option B: Via Vercel CLI**

```bash
# Install Vercel CLI
npm install -g vercel

# Login
vercel login

# Link project
vercel link

# Deploy to production
vercel --prod

# Expected output:
# ✅ Production: https://cd-construction-YOUR_PROJECT_ID.vercel.app
```

**Verification:**
- [ ] Deployment successful
- [ ] Build completed without errors
- [ ] Preview URL accessible: https://cd-construction-YOUR_PROJECT_ID.vercel.app
- [ ] Homepage loads correctly
- [ ] No console errors in browser

### Step 3.4: Configure Stripe Webhooks

**Now that Next.js is deployed, configure Stripe webhook:**

1. Go to: https://dashboard.stripe.com/webhooks
2. Click **"Add endpoint"**
3. **Endpoint URL:** `https://cdhomeimprovementsrockford.com/api/webhooks/stripe`
4. **Events to send:**
   - `payment_intent.succeeded`
   - `payment_intent.payment_failed`
   - `charge.refunded`
5. Click **"Add endpoint"**
6. Copy **Signing secret** (starts with `whsec_`)

7. **Add to Vercel:**
   - Go to: Vercel Dashboard → Settings → Environment Variables
   - Add: `STRIPE_WEBHOOK_SECRET=whsec_...`
   - Redeploy: `vercel --prod` (or push to GitHub)

**Test Webhook:**

```bash
# Install Stripe CLI
brew install stripe/stripe-brew/stripe

# Login
stripe login

# Forward events to local (for testing)
stripe listen --forward-to https://cdhomeimprovementsrockford.com/api/webhooks/stripe

# Trigger test event
stripe trigger payment_intent.succeeded
```

**Verification:**
- [ ] Webhook endpoint created in Stripe
- [ ] Signing secret added to Vercel
- [ ] Test event received successfully (check Stripe dashboard logs)
- [ ] No errors in Sentry

---

## 🔗 Phase 4: Integration Verification

**Duration:** 60-90 minutes
**Prerequisites:** Phases 1-3 completed

### Step 4.1: End-to-End Lead Submission Test

**Test the complete lead-to-quote workflow:**

1. **Submit Lead via Website**
   - Navigate to: https://cdhomeimprovementsrockford.com
   - Fill form with test data:
     ```
     First Name: Jane
     Last Name: Smith
     Email: jane.smith+test@gmail.com
     Phone: (815) 555-5678
     Address: 456 Oak Avenue
     City: Rockford
     State: IL
     Zip: 61102
     Service: Bathroom Remodel
     ```
   - Submit form
   - **Expected:** Success message displayed

2. **Verify in Supabase**
   - Go to: Supabase Dashboard → Table Editor
   - Check `clients` table for new entry
   - Check `properties` table for new property
   - Check `leads` table for new lead with status "NEW"
   - **Expected:** All 3 entries created

3. **Verify n8n Workflow Executed**
   - Go to: https://automate.cdhomeimprovementsrockford.com
   - Click **"Executions"**
   - **Expected:** New execution with success status
   - Review execution:
     - Step 1: Webhook received ✅
     - Step 2: Client created in Invoice Ninja ✅
     - Step 3: Quote created ✅
     - Step 4: Email sent ✅

4. **Verify in Invoice Ninja**
   - Go to: https://portal.cdhomeimprovementsrockford.com
   - Navigate to: **Clients**
   - **Expected:** Jane Smith listed
   - Navigate to: **Quotes**
   - **Expected:** New quote for Jane Smith (Draft status)

5. **Verify Email Sent**
   - Check email inbox: jane.smith+test@gmail.com
   - **Expected:** Email from noreply@cdhomeimprovementsrockford.com
   - Subject: "Your Quote from CD Home Improvements"
   - Contains quote link

**Verification:**
- [ ] Lead submitted successfully
- [ ] Client created in Supabase
- [ ] Property created in Supabase
- [ ] Lead created in Supabase
- [ ] n8n workflow executed successfully
- [ ] Client created in Invoice Ninja
- [ ] Quote created in Invoice Ninja
- [ ] Email sent and received

### Step 4.2: Payment Processing Test

**Test Stripe payment integration:**

1. **Approve Quote in Invoice Ninja**
   - Login to Invoice Ninja as admin
   - Navigate to quote
   - Click **"Mark Sent"**
   - Copy client portal link

2. **Access Client Portal**
   - Open client portal link in incognito browser
   - Click **"Approve"** on quote
   - **Expected:** Quote converted to invoice

3. **Process Payment**
   - Click **"Pay Now"**
   - Enter test card: `4242 4242 4242 4242`
   - Expiry: Any future date
   - CVC: Any 3 digits
   - Click **"Pay"**
   - **Expected:** Payment successful message

4. **Verify Webhook Received**
   - Check Stripe Dashboard → Webhooks
   - **Expected:** `payment_intent.succeeded` event delivered with 200 response
   - Check Sentry: No errors

5. **Verify Payment in Supabase**
   - Go to: Supabase Dashboard → Table Editor → `payments`
   - **Expected:** New payment entry
   - `amount`: Correct amount
   - `status`: "COMPLETED"
   - `payment_method`: "STRIPE"
   - `external_id`: Stripe payment intent ID

6. **Verify Invoice Updated**
   - Refresh Invoice Ninja
   - **Expected:** Invoice status changed to "Paid"
   - Payment recorded

**Verification:**
- [ ] Quote approved successfully
- [ ] Invoice created
- [ ] Payment processed via Stripe
- [ ] Webhook received and processed
- [ ] Payment recorded in Supabase
- [ ] Invoice marked as paid in Invoice Ninja
- [ ] Receipt email sent to client

### Step 4.3: DLQ and Error Handling Test

**Test Dead Letter Queue (DLQ) functionality:**

1. **Simulate Webhook Failure**
   ```bash
   # Temporarily break database connection
   # (Don't actually do this in production - use staging/test environment)
   ```

2. **Trigger Webhook**
   - Use Stripe CLI: `stripe trigger payment_intent.succeeded`

3. **Verify DLQ Entry**
   - Check Supabase → `webhook_event_dlq` table
   - **Expected:** Failed event logged with error details

4. **Replay Event**
   ```bash
   # Use admin replay endpoint
   curl -X POST https://cdhomeimprovementsrockford.com/api/admin/replay \
     -H "Content-Type: application/json" \
     -H "Authorization: Bearer YOUR_ADMIN_API_KEY" \
     -d '{"event_id": "EVENT_ID_FROM_DLQ"}'
   ```

5. **Verify Replay Success**
   - Check DLQ entry: `replayed_at` field populated
   - Check payment created in database

**Verification:**
- [ ] Failed webhook logged to DLQ
- [ ] Error details captured
- [ ] Replay endpoint functional
- [ ] Replayed event processed successfully

### Step 4.4: Monitoring Setup

**Configure Uptime Kuma monitors (see UPTIME-KUMA-SETUP.md):**

1. **Create 7 Monitors:**
   - [ ] Next.js Frontend (60s interval)
   - [ ] Next.js API - Lead Submission (120s)
   - [ ] Invoice Ninja Portal (120s)
   - [ ] n8n Automation (180s)
   - [ ] MariaDB Database (300s)
   - [ ] Caddy Reverse Proxy (180s)
   - [ ] Stripe Webhook Endpoint (300s)

2. **Configure Email Notifications:**
   - SMTP settings
   - Alert email: admin@cdhomeimprovementsrockford.com

3. **Test Notifications:**
   - Temporarily pause a monitor
   - Wait for alert email
   - Verify email received
   - Resume monitor

**Verification:**
- [ ] All 7 monitors created and active
- [ ] All monitors showing "UP" status
- [ ] Email notifications configured
- [ ] Test alert received successfully

### Step 4.5: Performance Testing

**Test system performance under load:**

1. **Lighthouse Test (Homepage)**
   - Open Chrome DevTools
   - Navigate to: https://cdhomeimprovementsrockford.com
   - Run Lighthouse audit (Desktop mode)
   - **Expected:**
     - Performance: 90+
     - Accessibility: 95+
     - Best Practices: 95+
     - SEO: 90+

2. **API Response Time**
   ```bash
   # Test lead submission endpoint
   time curl -X POST https://cdhomeimprovementsrockford.com/api/leads \
     -H "Content-Type: application/json" \
     -d '{"first_name":"Test","last_name":"User","email":"test@example.com","street_address":"123 Test St","city":"Rockford","state":"IL","zip_code":"61101","service_type":"Other"}'

   # Expected: < 500ms response time
   ```

3. **Database Query Performance**
   ```sql
   -- In Supabase SQL Editor
   EXPLAIN ANALYZE SELECT * FROM leads WHERE status = 'NEW';
   EXPLAIN ANALYZE SELECT * FROM v_invoice_summary;

   -- Expected: Query time < 100ms
   ```

**Verification:**
- [ ] Homepage Lighthouse score > 90
- [ ] API response time < 500ms
- [ ] Database queries < 100ms
- [ ] No performance warnings in Sentry

---

## 🎉 Phase 5: Go-Live

**Duration:** 30-60 minutes
**Prerequisites:** Phases 1-4 completed, all tests passing

### Step 5.1: Final Pre-Launch Checks

**Complete this checklist 30 minutes before DNS switch:**

- [ ] All Phase 4 tests passing
- [ ] Uptime Kuma showing all services UP
- [ ] Sentry showing no errors in last 1 hour
- [ ] Stripe live mode active and tested
- [ ] Email delivery tested and working
- [ ] Team on standby (at least 2 people)
- [ ] Rollback plan reviewed and understood
- [ ] Backup of current DNS settings saved
- [ ] Business owner approval confirmed

### Step 5.2: DNS Activation

**CRITICAL: This is the point of no return. DNS changes take 5-60 minutes to propagate.**

1. **Activate DNS Records**
   - Login to DNS provider
   - Activate all prepared A records:
     ```
     @ → YOUR_VPS_IP
     portal → YOUR_VPS_IP
     automate → YOUR_VPS_IP
     status → YOUR_VPS_IP
     ```
   - Activate Vercel CNAME:
     ```
     www → cname.vercel-dns.com
     ```
   - Save changes

2. **Wait for Propagation (5-10 minutes)**
   ```bash
   # Monitor DNS propagation
   watch -n 10 'dig +short cdhomeimprovementsrockford.com'

   # Expected: YOUR_VPS_IP appears
   ```

3. **Verify All Domains**
   ```bash
   # Test all subdomains
   curl -I https://cdhomeimprovementsrockford.com
   curl -I https://www.cdhomeimprovementsrockford.com
   curl -I https://portal.cdhomeimprovementsrockford.com
   curl -I https://automate.cdhomeimprovementsrockford.com
   curl -I https://status.cdhomeimprovementsrockford.com

   # Expected: All return 200 OK with valid SSL
   ```

**Verification:**
- [ ] DNS resolves to correct IP
- [ ] All subdomains accessible via HTTPS
- [ ] SSL certificates valid (green lock)
- [ ] No certificate warnings

### Step 5.3: Smoke Tests

**Quick verification that everything still works post-DNS:**

1. **Homepage Test**
   - Visit: https://cdhomeimprovementsrockford.com
   - **Expected:** Page loads, no errors

2. **Lead Form Test**
   - Fill and submit lead form
   - **Expected:** Success message

3. **Verify in Supabase**
   - Check lead created

4. **Verify n8n Executed**
   - Check execution log

5. **Verify Invoice Ninja**
   - Check client and quote created

**Verification:**
- [ ] Homepage loads correctly
- [ ] Lead form submission works
- [ ] End-to-end workflow functional
- [ ] No errors in Sentry
- [ ] Uptime Kuma showing all UP

### Step 5.4: Update Vercel Domain

**Point Vercel to production domain:**

1. Go to: Vercel Dashboard → Settings → Domains
2. Add domain: `cdhomeimprovementsrockford.com`
3. Vercel will verify DNS automatically
4. **Expected:** Domain verified and added

**Verification:**
- [ ] Domain added to Vercel
- [ ] Domain verified (green checkmark)
- [ ] www redirect working
- [ ] SSL certificate issued by Vercel

### Step 5.5: Final Verification

**Complete final checks:**

```bash
# Test all critical endpoints
curl https://cdhomeimprovementsrockford.com/
curl https://cdhomeimprovementsrockford.com/api/leads
curl https://portal.cdhomeimprovementsrockford.com/
curl https://automate.cdhomeimprovementsrockford.com/
curl https://status.cdhomeimprovementsrockford.com/
```

**Check Logs:**
```bash
# Check for errors
docker compose logs --tail=100 | grep -i error
vercel logs --follow

# Check Sentry dashboard
# Expected: No new errors
```

**Verification:**
- [ ] All endpoints returning 200 OK
- [ ] No errors in logs
- [ ] Sentry clean (no new errors)
- [ ] Uptime Kuma all green
- [ ] Stripe webhook receiving events
- [ ] Email sending successfully

---

## 📊 Post-Launch Monitoring

**First 24-48 hours are critical for catching issues early.**

### Hour 0-1: Intensive Monitoring

**Monitor every 15 minutes:**

- [ ] Check Uptime Kuma dashboard
- [ ] Check Sentry for new errors
- [ ] Monitor VPS resources: `htop`, `df -h`
- [ ] Check Docker containers: `docker compose ps`
- [ ] Check Caddy logs: `docker compose logs caddy --tail=50`

**Red Flags (require immediate action):**
- ❌ Any service showing DOWN in Uptime Kuma
- ❌ CPU usage > 80% sustained
- ❌ Memory usage > 90%
- ❌ Disk usage > 85%
- ❌ Multiple errors in Sentry (> 10 per minute)
- ❌ SSL certificate errors

### Hours 2-24: Regular Monitoring

**Monitor every 2-4 hours:**

- [ ] Uptime Kuma dashboard check
- [ ] Sentry error count
- [ ] VPS resource usage
- [ ] Lead submission test
- [ ] Webhook delivery test

**Metrics to Track:**

| Metric | Target | Alert Threshold |
|--------|--------|-----------------|
| Uptime | 99.9% | < 99% |
| API Response Time | < 500ms | > 1000ms |
| Error Rate | < 0.1% | > 1% |
| CPU Usage | < 60% | > 80% |
| Memory Usage | < 75% | > 90% |
| Disk Usage | < 70% | > 85% |

### Week 1: Daily Monitoring

**Daily checklist:**

- [ ] Review Uptime Kuma weekly report
- [ ] Review Sentry issues
- [ ] Check VPS backups completed
- [ ] Monitor Stripe payments
- [ ] Review lead submission volume
- [ ] Check email delivery rate

**Weekly Task:**
- [ ] Run full end-to-end test (Phase 4.1)
- [ ] Review performance metrics
- [ ] Check for security updates: `ssh root@VPS "sudo apt update && sudo apt list --upgradable"`
- [ ] Review Caddy logs for suspicious activity

---

## 🔄 Rollback Procedures

**If critical issues arise, follow these rollback procedures.**

### Scenario 1: DNS Rollback

**When:** Site completely down, VPS unresponsive

**Time Required:** 5-10 minutes

**Steps:**
1. Login to DNS provider
2. Delete all new A records (@ portal, automate, status)
3. Delete Vercel CNAME (www)
4. Save changes
5. Wait for propagation (5-10 minutes)

**Result:** Domain offline until issues resolved

### Scenario 2: Vercel Rollback

**When:** Next.js deployment broken, critical frontend bugs

**Time Required:** 2-5 minutes

**Steps:**
```bash
# List recent deployments
vercel ls

# Rollback to previous deployment
vercel rollback YOUR_PREVIOUS_DEPLOYMENT_URL

# Or via dashboard:
# Vercel Dashboard → Deployments → Previous deployment → "Promote to Production"
```

**Result:** Previous working version restored

### Scenario 3: Docker Stack Rollback

**When:** Service issues, container crashes, configuration errors

**Time Required:** 10-20 minutes

**Steps:**
```bash
ssh root@YOUR_VPS_IP

cd /opt/cdhi-stack/docker

# Stop all services
docker compose down

# Restore from backup (if needed)
cd /backup/cdhi
tar -xzf docker-volumes_LATEST.tar.gz -C /var/lib/docker/volumes/

# Revert to previous configuration
git log --oneline  # Find previous commit
git checkout PREVIOUS_COMMIT_HASH

# Restart services
docker compose up -d

# Monitor logs
docker compose logs -f
```

**Result:** Previous working Docker configuration restored

### Scenario 4: Database Rollback

**When:** Critical database corruption, migration failure

**Time Required:** 15-30 minutes

**Steps:**
```bash
# Connect to Supabase
psql "postgresql://postgres:PASSWORD@db.PROJECT_ID.supabase.co:5432/postgres"

# Drop all tables (CAUTION!)
DROP SCHEMA public CASCADE;
CREATE SCHEMA public;

# Restore from backup
# (Supabase automatic backup restore via dashboard)

# Or rerun migrations
supabase db reset --linked
```

**Result:** Database restored to previous state

### Emergency Contact Protocol

**If rollback fails or issues persist:**

1. **Immediate Actions:**
   - Update status page: "System maintenance in progress"
   - Notify business owner
   - Assemble team

2. **External Support:**
   - Vercel Support: https://vercel.com/support (if Next.js issues)
   - Supabase Support: https://supabase.com/support (if database issues)
   - Stripe Support: https://support.stripe.com (if payment issues)

3. **Escalation Path:**
   - Level 1: Technical Lead (immediate response)
   - Level 2: Business Owner (critical decisions)
   - Level 3: External consultants (if needed)

---

## 🆘 Support & Escalation

### Internal Team

**Technical Lead**
- Name: _____________
- Email: _____________
- Phone: _____________
- Availability: 24/7 first week, then business hours

**Business Owner**
- Name: _____________
- Email: _____________
- Phone: _____________
- Availability: Business hours + on-call for critical issues

### External Support

**Vercel**
- Dashboard: https://vercel.com/dashboard
- Support: https://vercel.com/support
- Status Page: https://www.vercel-status.com/

**Supabase**
- Dashboard: https://supabase.com/dashboard
- Support: https://supabase.com/support
- Status Page: https://status.supabase.com/

**Stripe**
- Dashboard: https://dashboard.stripe.com/
- Support: https://support.stripe.com/
- Status Page: https://status.stripe.com/

**VPS Provider**
- Dashboard: (varies by provider)
- Support: (varies by provider)

### Issue Severity Levels

**P0 - Critical (Immediate Response Required)**
- Site completely down
- Payment processing broken
- Data loss or corruption
- Security breach

**Response Time:** < 15 minutes
**Resolution Time:** < 2 hours

**P1 - High (Urgent)**
- Partial service outage
- Major feature broken (lead form, webhooks)
- Performance degradation (> 50% slower)

**Response Time:** < 1 hour
**Resolution Time:** < 8 hours

**P2 - Medium (Important)**
- Minor feature broken
- Non-critical bugs
- UI/UX issues

**Response Time:** < 4 hours
**Resolution Time:** < 48 hours

**P3 - Low (Nice to Have)**
- Cosmetic issues
- Feature requests
- Documentation updates

**Response Time:** < 24 hours
**Resolution Time:** As scheduled

---

## 📝 Post-Launch Report Template

**Complete this report 48 hours after go-live:**

### Go-Live Summary

**Date:** _____________
**Time:** _____________
**Duration:** _____________ (planned vs actual)
**Team Members:** _____________

### Deployment Status

- [ ] All phases completed successfully
- [ ] All tests passing
- [ ] All services operational
- [ ] Monitoring active

### Issues Encountered

| Issue | Severity | Resolution | Time Lost |
|-------|----------|------------|-----------|
| Example: DNS propagation slow | P2 | Waited 20 min | 15 min |
|       |          |            |           |

### Metrics (First 48 Hours)

| Metric | Target | Actual | Status |
|--------|--------|--------|--------|
| Uptime | 99.9% | ___% | ✅/❌ |
| Avg Response Time | < 500ms | ___ms | ✅/❌ |
| Error Rate | < 0.1% | ___% | ✅/❌ |
| Leads Submitted | N/A | ___ | N/A |
| Payments Processed | N/A | ___ | N/A |

### Rollback Events

- [ ] No rollbacks required
- [ ] Rollbacks performed:
  - [ ] DNS rollback
  - [ ] Vercel rollback
  - [ ] Docker rollback
  - [ ] Database rollback

### Lessons Learned

**What Went Well:**
- _____________
- _____________

**What Could Be Improved:**
- _____________
- _____________

**Action Items:**
- [ ] _____________
- [ ] _____________

### Sign-Off

**Technical Lead:** _____________ Date: _____________
**Business Owner:** _____________ Date: _____________

---

## ✅ Final Checklist

**Complete before marking go-live as successful:**

### Technical Verification

- [ ] All services running (Uptime Kuma all green)
- [ ] All tests passing (Phase 4 complete)
- [ ] No critical errors in Sentry
- [ ] SSL certificates valid on all domains
- [ ] DNS propagated globally (check https://dnschecker.org)
- [ ] Backups configured and tested
- [ ] Monitoring alerts functional
- [ ] Performance metrics within targets

### Business Verification

- [ ] Lead form submissions working
- [ ] Quote generation automated
- [ ] Payment processing functional
- [ ] Email notifications sending
- [ ] Client portal accessible
- [ ] Admin access working (Invoice Ninja, n8n, Uptime Kuma)

### Documentation

- [ ] All passwords documented in password manager
- [ ] All API keys and secrets stored securely
- [ ] Team trained on system usage
- [ ] Support contacts documented
- [ ] Rollback procedures reviewed and understood

### Communication

- [ ] Business owner notified of successful go-live
- [ ] Team notified of completion
- [ ] On-call schedule confirmed for first week
- [ ] Status page updated (if using public status page)

---

## 🎯 Success Criteria

**The deployment is considered successful when ALL of the following are true:**

1. ✅ **Uptime:** All 7 services showing UP in Uptime Kuma for 24 hours
2. ✅ **Functionality:** End-to-end lead-to-payment workflow tested successfully
3. ✅ **Performance:** API response times < 500ms average
4. ✅ **Reliability:** Error rate < 0.1% in first 24 hours
5. ✅ **Security:** No security alerts, all SSL certificates valid
6. ✅ **Monitoring:** All alerts functional, no false positives
7. ✅ **Business:** At least 1 real lead processed successfully
8. ✅ **Stability:** No rollbacks required in first 48 hours

---

**Last Updated:** 2025-01-28
**Version:** 1.0
**Status:** Production Ready ✅

---

## 🚀 You're Ready to Go Live!

This checklist has guided you through deploying a production-ready system. Follow each phase carefully, verify all steps, and don't hesitate to rollback if issues arise.

**Good luck with your launch!** 🎉
