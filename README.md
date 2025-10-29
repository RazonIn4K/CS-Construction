# CD Home Improvements - Complete System Documentation

**Production-ready home improvement business management system with automated lead-to-payment workflow**

[![Next.js](https://img.shields.io/badge/Next.js-16-black)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue)](https://www.typescriptlang.org/)
[![Supabase](https://img.shields.io/badge/Supabase-Postgres-green)](https://supabase.com/)
[![Docker](https://img.shields.io/badge/Docker-Compose-blue)](https://www.docker.com/)

---

## 📋 Table of Contents

- [Overview](#overview)
- [Architecture](#architecture)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Prerequisites](#prerequisites)
- [Quick Start](#quick-start)
- [Deployment](#deployment)
- [Configuration](#configuration)
- [Development](#development)
- [Testing](#testing)
- [Monitoring](#monitoring)
- [Troubleshooting](#troubleshooting)
- [Contributing](#contributing)
- [License](#license)

---

## 🎯 Overview

This is a complete business management system for CD Home Improvements, a home renovation contractor in Rockford, IL. The system automates the entire customer journey from lead submission to payment processing.

### Business Flow

```
Lead Submission → Client Creation → Quote Generation →
Invoice Creation → Payment Processing → Notification
```

### Key Components

1. **Next.js Frontend** - Marketing website with lead capture
2. **Supabase** - PostgreSQL database with real-time subscriptions
3. **Invoice Ninja** - Quote and invoice management
4. **n8n** - Workflow automation
5. **Stripe** - Payment processing
6. **Caddy** - Reverse proxy with automatic HTTPS
7. **Uptime Kuma** - Service monitoring

---

## 🏗️ Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        FRONTEND                              │
│  ┌────────────────────────────────────────────────────────┐ │
│  │  Next.js 16 (Vercel)                                   │ │
│  │  - Marketing Site                                       │ │
│  │  - Lead Form                                            │ │
│  │  - API Routes                                           │ │
│  └────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│                        SERVICES                              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │   Supabase   │  │    Stripe    │  │    Sentry    │      │
│  │  (Database)  │  │  (Payments)  │  │   (Errors)   │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│                   DOCKER STACK (VPS)                         │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  Caddy (Reverse Proxy + HTTPS)                       │   │
│  └──────────────────────────────────────────────────────┘   │
│           ↓                   ↓                   ↓          │
│  ┌───────────────┐   ┌──────────────┐   ┌──────────────┐   │
│  │ Invoice Ninja │   │     n8n      │   │ Uptime Kuma  │   │
│  │  (Invoicing)  │   │ (Automation) │   │ (Monitoring) │   │
│  └───────────────┘   └──────────────┘   └──────────────┘   │
│           ↓                                                  │
│  ┌───────────────────────────────────────────────────────┐  │
│  │  MariaDB (Database for Invoice Ninja)                 │  │
│  └───────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

### Network Architecture

- **Public Internet** → Caddy (ports 80/443)
- **Frontend Network** - Next.js, Invoice Ninja, n8n, Uptime Kuma
- **Backend Network** - MariaDB (isolated, not internet-accessible)

---

## ✨ Features

### For Customers
- ✅ Professional marketing website
- ✅ Easy-to-use quote request form
- ✅ Automated email notifications
- ✅ Client portal for viewing quotes/invoices
- ✅ Secure online payment processing
- ✅ Mobile-responsive design

### For Business
- ✅ Automated lead capture
- ✅ Client management
- ✅ Quote generation
- ✅ Invoice tracking
- ✅ Payment processing
- ✅ Email automation
- ✅ Real-time monitoring
- ✅ Automated backups

### Technical Features
- ✅ Type-safe development with TypeScript
- ✅ Server-side rendering (SSR)
- ✅ API route validation with Zod
- ✅ Webhook signature verification
- ✅ Idempotent payment processing
- ✅ Dead Letter Queue (DLQ) for failed events
- ✅ Error tracking with Sentry
- ✅ CI/CD with GitHub Actions
- ✅ Automated SSL certificates
- ✅ Health checks and monitoring

---

## 🛠️ Tech Stack

### Frontend
- **Framework:** Next.js 16 (App Router)
- **Language:** TypeScript 5.0
- **Styling:** TailwindCSS
- **Validation:** Zod
- **Hosting:** Vercel

### Backend Services
- **Database:** Supabase (PostgreSQL)
- **Payments:** Stripe
- **Error Tracking:** Sentry
- **Email:** Postmark / SendGrid

### Docker Stack (Self-Hosted)
- **Reverse Proxy:** Caddy
- **Invoicing:** Invoice Ninja v5
- **Database:** MariaDB 10.11
- **Automation:** n8n
- **Monitoring:** Uptime Kuma

---

## 📦 Prerequisites

### For Next.js Development
- Node.js 20+ and npm
- Git
- Vercel account (free tier works)
- Supabase account (free tier works)
- Stripe account
- Email service account (Postmark or SendGrid)

### For Docker Stack Deployment
- VPS with Ubuntu 22.04/24.04 LTS
- Minimum: 2 vCPU, 4GB RAM, 80GB SSD
- Domain name with DNS access
- SSH access to VPS

---

## 🚀 Quick Start

### 1. Clone Repository

```bash
git clone <repository-url> cd-construction
cd cd-construction
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Configure Environment

```bash
cp .env.example .env
# Edit .env with your credentials
```

### 4. Setup Supabase

```bash
# Install Supabase CLI
npm install -g supabase

# Link to your project
supabase link --project-ref YOUR_PROJECT_ID

# Apply migrations
supabase db push

# Generate TypeScript types
supabase gen types typescript --linked > types/database.types.ts
```

### 5. Run Development Server

```bash
npm run dev
```

Visit `http://localhost:3000`

---

## 📚 Deployment

### Option 1: Deploy Everything (Recommended)

Follow the complete deployment guide:

**[📖 Complete Deployment Guide](./docker/DEPLOY-CHECKLIST.md)**

### Option 2: Deploy Components Separately

#### A. Deploy Next.js to Vercel

```bash
# Install Vercel CLI
npm install -g vercel

# Deploy
vercel

# Set environment variables in Vercel dashboard
vercel env add NEXT_PUBLIC_SUPABASE_URL
vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY
# ... add all variables from .env.example
```

#### B. Deploy Docker Stack to VPS

```bash
# SSH into VPS
ssh user@your-vps-ip

# Clone repository
cd /opt
git clone <repository-url> cdhi-stack
cd cdhi-stack/docker

# Configure environment
cp .env.docker.example .env
nano .env  # Edit with your credentials

# Start services
docker-compose up -d

# Verify all services running
docker-compose ps
```

**[📖 Docker Deployment Guide](./docker/README-DOCKER.md)**

---

## ⚙️ Configuration

### Environment Variables

#### Next.js (.env)

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...

# Stripe
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_...
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...

# n8n
N8N_WEBHOOK_BASE_URL=https://automate.cdhomeimprovementsrockford.com

# Email
EMAIL_FROM=noreply@cdhomeimprovementsrockford.com
EMAIL_API_KEY=...

# Sentry
NEXT_PUBLIC_SENTRY_DSN=https://...@sentry.io/...
SENTRY_DSN=https://...@sentry.io/...

# Admin
ADMIN_API_KEY=... # For DLQ replay endpoint
```

#### Docker Stack (.env in docker/)

See [.env.docker.example](./docker/.env.docker.example) for complete list.

---

## 🔧 Development

### Project Structure

```
cd-construction/
├── app/                    # Next.js App Router pages
│   ├── api/                # API routes
│   │   ├── leads/          # Lead submission
│   │   ├── webhooks/       # Webhook handlers
│   │   └── admin/          # Admin endpoints
│   ├── layout.tsx          # Root layout
│   └── page.tsx            # Homepage
├── components/             # React components
│   └── LeadForm.tsx        # Lead submission form
├── lib/                    # Utility libraries
│   ├── supabase.ts         # Database client
│   ├── stripe.ts           # Payment utilities
│   ├── logger.ts           # Logging
│   └── n8n.ts              # Workflow triggers
├── types/                  # TypeScript types
│   ├── database.types.ts   # Generated from Supabase
│   └── schemas.ts          # Zod validation schemas
├── supabase/               # Database migrations
│   └── migrations/
├── docker/                 # Docker infrastructure
│   ├── docker-compose.yml
│   ├── Caddyfile
│   ├── backup.sh
│   └── README-DOCKER.md
├── .github/workflows/      # CI/CD pipelines
└── README.md               # This file
```

### Available Scripts

```bash
# Development
npm run dev              # Start dev server

# Building
npm run build            # Production build
npm start                # Start production server

# Code Quality
npm run lint             # Run ESLint
npm run type-check       # TypeScript type checking

# Database
supabase db push         # Apply migrations
supabase gen types       # Generate types
```

---

## 🧪 Testing

### Manual Testing

**[📖 Testing Guide](./docs/TESTING.md)** (Create this based on end-to-end flow)

### End-to-End Flow

1. **Submit Lead** - Fill form on homepage
2. **Verify in Supabase** - Check `leads` table
3. **Check n8n** - Verify workflow executed
4. **Check Invoice Ninja** - Verify client and quote created
5. **Check Email** - Verify client received email
6. **Submit Payment** - Test Stripe payment
7. **Verify Webhook** - Check `payments` table updated

### API Testing

```bash
# Test lead submission
curl -X POST https://cdhomeimprovementsrockford.com/api/leads \
  -H "Content-Type: application/json" \
  -d '{
    "first_name": "John",
    "last_name": "Doe",
    "email": "john@example.com",
    "street_address": "123 Main St",
    "city": "Rockford",
    "state": "IL",
    "zip_code": "61101",
    "service_type": "Kitchen Remodel"
  }'
```

---

## 📊 Monitoring

### Uptime Kuma

Access: `https://status.cdhomeimprovementsrockford.com`

**[📖 Monitoring Setup Guide](./docker/UPTIME-KUMA-SETUP.md)**

### Sentry

Access: https://sentry.io

- Real-time error tracking
- Performance monitoring
- Session replay

### Logs

```bash
# Next.js (Vercel)
vercel logs

# Docker services
docker-compose logs -f [service-name]

# Specific service logs
docker-compose logs -f invoiceninja
docker-compose logs -f n8n
docker-compose logs -f caddy
```

---

## 🔍 Troubleshooting

### Common Issues

#### Lead Form Submission Fails

**Symptoms:** Form shows error, lead not in database

**Check:**
1. Network tab in browser console
2. Supabase connection: `supabase status`
3. API route logs in Vercel

**Solution:**
```bash
# Verify environment variables
vercel env ls

# Check Supabase service role key is set
```

#### Webhook Not Receiving Events

**Symptoms:** Payments not updating, no DLQ entries

**Check:**
1. Stripe webhook logs in dashboard
2. Webhook endpoint returns 200
3. Signature verification

**Solution:**
```bash
# Test webhook endpoint
curl -X POST https://your-site.com/api/webhooks/stripe \
  -H "Content-Type: application/json" \
  -d '{"test":true}'

# Should return 400/401 (invalid signature)
```

#### Docker Service Won't Start

**Symptoms:** `docker-compose ps` shows service as "Exited"

**Check:**
```bash
# View logs
docker-compose logs [service-name]

# Check health
docker inspect [container-name] --format='{{.State.Health.Status}}'
```

**Solution:**
```bash
# Restart service
docker-compose restart [service-name]

# Or rebuild
docker-compose up -d --build [service-name]
```

---

## 📖 Additional Documentation

- **[Docker Deployment Guide](./docker/README-DOCKER.md)** - Complete Docker stack setup
- **[Deployment Checklist](./docker/DEPLOY-CHECKLIST.md)** - Step-by-step deployment
- **[n8n Workflow Setup](./docker/n8n-workflows/README.md)** - Automation configuration
- **[Uptime Kuma Setup](./docker/UPTIME-KUMA-SETUP.md)** - Monitoring configuration
- **[Architecture Document](./CS-Construction-System-Architecture.md)** - Detailed system design

---

## 🤝 Contributing

This is a private project for CD Home Improvements. Internal contributions welcome.

### Development Workflow

1. Create feature branch: `git checkout -b feature/your-feature`
2. Make changes and commit: `git commit -m "Add feature"`
3. Push branch: `git push origin feature/your-feature`
4. Create Pull Request
5. Wait for CI checks to pass
6. Request review
7. Merge after approval

---

## 📄 License

Proprietary - All Rights Reserved

Copyright © 2025 CD Home Improvements Rockford

---

## 📞 Support

### Internal Support

- **Technical Issues:** Check troubleshooting section above
- **Docker Stack:** See [docker/README-DOCKER.md](./docker/README-DOCKER.md)
- **Monitoring:** Access Uptime Kuma dashboard

### External Support

- **Vercel:** https://vercel.com/support
- **Supabase:** https://supabase.com/support
- **Stripe:** https://support.stripe.com
- **Invoice Ninja:** https://forum.invoiceninja.com
- **n8n:** https://community.n8n.io

---

## 🎉 Acknowledgments

Built with:
- Next.js by Vercel
- Supabase
- Invoice Ninja
- n8n
- Caddy
- Uptime Kuma
- And many more open-source projects

---

**Last Updated:** 2025-01-28
**Version:** 1.0.0
**Status:** Production Ready ✅
