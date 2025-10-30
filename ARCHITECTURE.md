# CD Home Improvements Platform - Complete Architecture Documentation

**Version:** 1.0
**Last Updated:** 2025-10-29
**Status:** 75% Complete - Production Ready Core

---

## Table of Contents

1. [Executive Overview](#executive-overview)
2. [System Architecture](#system-architecture)
3. [Data Flow Architecture](#data-flow-architecture)
4. [Component Architecture](#component-architecture)
5. [API Architecture](#api-architecture)
6. [Database Architecture](#database-architecture)
7. [Authentication Architecture](#authentication-architecture)
8. [Notification Architecture](#notification-architecture)
9. [Business Logic & Workflows](#business-logic--workflows)
10. [User Journeys](#user-journeys)
11. [Problem-Solution Mapping](#problem-solution-mapping)
12. [Technical Stack](#technical-stack)
13. [Deployment Architecture](#deployment-architecture)
14. [Integration Points](#integration-points)
15. [Security Architecture](#security-architecture)

---

## Executive Overview

### What Is This Platform?

CD Home Improvements Platform is a **comprehensive business management system** designed specifically for construction and home improvement contractors. It replaces expensive SaaS subscriptions ($120+/month) with a custom-built, feature-rich solution that costs $71-191/month to operate.

### Core Purpose

**Replace multiple disconnected tools with one unified platform that:**
- Captures leads from your website
- Manages client relationships
- Tracks construction projects
- Handles invoicing and payments
- Automates customer communication
- Provides real-time business intelligence

### Key Problems Solved

1. **Lead Loss** - Automated capture and instant follow-up
2. **Manual Processes** - Automated notifications and workflows
3. **Data Scattered** - Centralized client and project data
4. **Poor Visibility** - Real-time dashboards and metrics
5. **High Costs** - Custom solution vs. expensive SaaS
6. **Unprofessional Communication** - Branded emails and SMS

---

## System Architecture

### High-Level Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                        Internet / Users                          │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│                     Vercel Edge Network                          │
│                  (CDN + Serverless Functions)                    │
│                                                                   │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐         │
│  │   Marketing  │  │  Dashboard   │  │  API Routes  │         │
│  │   Homepage   │  │   (Auth'd)   │  │  (REST API)  │         │
│  │  (Public)    │  │              │  │              │         │
│  └──────────────┘  └──────────────┘  └──────────────┘         │
└────────────────────────────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Authentication Layer                          │
│                  (Supabase Auth + Middleware)                    │
│                                                                   │
│  • Session Management (Cookie-based)                            │
│  • Route Protection (Middleware)                                │
│  • User Verification (Every Request)                            │
└────────────────────────────────────────────────────────────────┘
                         │
          ┌──────────────┴──────────────┐
          ▼                             ▼
┌──────────────────┐          ┌──────────────────┐
│   Supabase       │          │  External APIs   │
│   (Database)     │          │                  │
│                  │          │  • Stripe        │
│  • PostgreSQL    │          │  • Invoice Ninja │
│  • Row Level     │          │  • Resend        │
│    Security      │          │  • Twilio        │
│  • Real-time     │          │  • n8n           │
│  • Storage       │          │  • Sentry        │
└──────────────────┘          └──────────────────┘
          │
          ▼
┌──────────────────────────────────────┐
│      VPS (Self-Hosted Stack)         │
│                                      │
│  ┌────────────┐  ┌────────────┐    │
│  │  Invoice   │  │    n8n     │    │
│  │   Ninja    │  │ (Workflows)│    │
│  └────────────┘  └────────────┘    │
│                                      │
│  ┌────────────┐  ┌────────────┐    │
│  │  Uptime    │  │   Caddy    │    │
│  │   Kuma     │  │  (Proxy)   │    │
│  └────────────┘  └────────────┘    │
│                                      │
│  ┌────────────┐                     │
│  │  MariaDB   │                     │
│  │ (Invoice   │                     │
│  │  Ninja DB) │                     │
│  └────────────┘                     │
└──────────────────────────────────────┘
```

### Architecture Layers

#### 1. **Presentation Layer** (Frontend)
- **Technology:** React 19 with Next.js 16 App Router
- **Rendering:** Server-Side Rendering (SSR) + Client Components
- **Styling:** Tailwind CSS 4.1
- **State Management:** React Hooks + Server State
- **Location:** Vercel Edge Network

**Components:**
- Marketing Homepage (Public)
- Dashboard (Authenticated)
- Login Page (Public)
- Lead Form (Public)
- Management Pages (Authenticated)

#### 2. **Application Layer** (Backend Logic)
- **Technology:** Next.js API Routes (Serverless)
- **Runtime:** Node.js 20+ on Vercel
- **Type Safety:** TypeScript 5.9
- **Validation:** Zod schemas

**Responsibilities:**
- API endpoint handling
- Business logic execution
- Data validation
- External API integration
- Error handling

#### 3. **Authentication Layer**
- **Technology:** Supabase Auth + Next.js Middleware
- **Session:** Cookie-based (httpOnly, secure)
- **Strategy:** Email/Password
- **Protection:** Middleware on all `/dashboard/*` routes

**Flow:**
```
Request → Middleware → Check Session → Allow/Deny → Route Handler
```

#### 4. **Data Layer**
- **Primary Database:** Supabase (PostgreSQL)
- **Secondary Database:** MariaDB (Invoice Ninja)
- **Caching:** Vercel Edge Cache
- **Storage:** Supabase Storage (future)

#### 5. **Integration Layer**
- **Payments:** Stripe (webhooks)
- **Invoicing:** Invoice Ninja (API + webhooks)
- **Email:** Resend (transactional)
- **SMS:** Twilio (notifications)
- **Workflows:** n8n (automation)
- **Monitoring:** Sentry (errors), Uptime Kuma (uptime)

---

## Data Flow Architecture

### 1. Lead Submission Flow

```
┌─────────────┐
│   Client    │
│  (Website)  │
└──────┬──────┘
       │ 1. Submits lead form
       ▼
┌─────────────────┐
│  Lead Form      │
│  Component      │
│  (React)        │
└──────┬──────────┘
       │ 2. POST /api/leads
       ▼
┌─────────────────────────────────────────────────────────┐
│            POST /api/leads Handler                      │
│                                                         │
│  Step 1: Validate with Zod ✓                          │
│  Step 2: Upsert Client (match on email) ✓             │
│  Step 3: Create Property ✓                            │
│  Step 4: Create Lead ✓                                │
│  Step 5: Trigger n8n workflow (async) ✓               │
│  Step 6: Send confirmation email to client (async) ✓   │
│  Step 7: Send notification email to admin (async) ✓    │
│  Step 8: Send SMS to client if opted in (async) ✓     │
│  Step 9: Return success response ✓                    │
└─────────────────────────────────────────────────────────┘
       │
       ├─────────────────────────────────────┐
       │                                     │
       ▼                                     ▼
┌─────────────┐                    ┌─────────────┐
│  Supabase   │                    │   Client    │
│  Database   │                    │  Receives   │
│             │                    │  • Email    │
│  • clients  │                    │  • SMS      │
│  • property │                    └─────────────┘
│  • leads    │
└─────────────┘
       │
       ▼
┌─────────────────────────────────────────┐
│  Background Jobs (Non-blocking)         │
│                                         │
│  1. n8n Workflow                        │
│     - Additional processing             │
│     - Data enrichment                   │
│     - Third-party integrations          │
│                                         │
│  2. Email Notifications (Resend)        │
│     - Client: Beautiful HTML email      │
│     - Admin: Lead details + link        │
│                                         │
│  3. SMS Notifications (Twilio)          │
│     - Client: Text confirmation         │
└─────────────────────────────────────────┘
```

### 2. Authentication Flow

```
┌──────────────┐
│    User      │
│  Visits /    │
└──────┬───────┘
       │
       ▼
┌────────────────────┐      No Session      ┌──────────────┐
│    Middleware      │─────────────────────→│ /login Page  │
│  Check Session     │                       │  (Public)    │
└────────────────────┘                       └──────────────┘
       │                                              │
       │ Has Session                                  │ Submit credentials
       ▼                                              ▼
┌────────────────────┐                       ┌──────────────────────┐
│   /dashboard/*     │                       │  POST login action   │
│   (Protected)      │                       │                      │
└────────────────────┘                       │  1. Validate creds   │
                                             │  2. Create session   │
                                             │  3. Set cookie       │
                                             │  4. Redirect /dash   │
                                             └──────────────────────┘

Session Storage:
┌─────────────────────────────────────────────┐
│  Cookie (httpOnly, secure, sameSite)        │
│  • sb-access-token                          │
│  • sb-refresh-token                         │
│  • Expires: 7 days (configurable)           │
└─────────────────────────────────────────────┘
```

### 3. Dashboard Data Flow

```
User → Dashboard Page (Server Component)
            ↓
      Check Authentication
            ↓
    Render Initial HTML
            ↓
    Client Components Mount
            ↓
    ┌────────────────────────────────────┐
    │  Parallel Data Fetching            │
    │                                    │
    │  1. GET /api/dashboard/stats       │
    │  2. GET /api/dashboard/projects    │
    │  3. GET /api/dashboard/invoices    │
    └────────────────────────────────────┘
            ↓
    ┌────────────────────────────────────┐
    │  Each API Route:                   │
    │  1. Verify authentication          │
    │  2. Query Supabase                 │
    │  3. Aggregate/calculate data       │
    │  4. Return JSON                    │
    └────────────────────────────────────┘
            ↓
    Components Update with Real Data
            ↓
    User Sees Live Dashboard
```

### 4. Payment Flow (Stripe Webhook)

```
Customer → Stripe Checkout → Payment Success
                                    ↓
                          Stripe sends webhook
                                    ↓
┌──────────────────────────────────────────────────────┐
│  POST /api/webhooks/stripe                           │
│                                                      │
│  1. Verify webhook signature ✓                      │
│  2. Check idempotency (prevent duplicates) ✓        │
│  3. Extract payment details ✓                       │
│  4. Record payment in database ✓                    │
│  5. Update invoice status ✓                         │
│  6. Calculate new balance ✓                         │
│  7. Send confirmation email (async) ✓               │
│  8. Send confirmation SMS (async) ✓                 │
│  9. Return 200 OK to Stripe ✓                       │
└──────────────────────────────────────────────────────┘
            ↓
    ┌────────────────────┐
    │  Database Updated  │
    │  • payments table  │
    │  • invoices table  │
    └────────────────────┘
            ↓
    ┌────────────────────┐
    │  Client Notified   │
    │  • Email receipt   │
    │  • SMS confirm     │
    └────────────────────┘
```

### 5. Invoice Sync Flow (Invoice Ninja Webhook)

```
Invoice Ninja → Create/Update Invoice
                        ↓
            Send webhook to our API
                        ↓
┌──────────────────────────────────────────────────────┐
│  POST /api/webhooks/invoiceninja                     │
│                                                      │
│  1. Verify HMAC signature ✓                         │
│  2. Check idempotency ✓                             │
│  3. Map Invoice Ninja status → our status ✓         │
│  4. Find/create client by email ✓                   │
│  5. Create/update invoice in Supabase ✓             │
│  6. Create invoice items ✓                          │
│  7. Link to job if applicable ✓                     │
│  8. Send invoice email to client (async) ✓          │
│  9. Return 200 OK ✓                                 │
└──────────────────────────────────────────────────────┘
            ↓
    ┌────────────────────┐
    │  Supabase Updated  │
    │  • invoices table  │
    │  • invoice_items   │
    └────────────────────┘
            ↓
    Dashboard shows updated invoice
```

---

## Component Architecture

### Frontend Component Hierarchy

```
app/
├── layout.tsx (Root Layout)
│   └── Metadata, Fonts, Global Styles
│
├── page.tsx (Marketing Homepage - PUBLIC)
│   ├── Hero Section
│   ├── Services Showcase
│   ├── Trust Indicators
│   ├── Testimonials
│   └── LeadForm Component
│       └── Zod Validation
│       └── API Call to /api/leads
│
├── login/
│   └── page.tsx (Login Page - PUBLIC)
│       └── Login Form
│       └── calls: app/actions/auth.ts
│
└── dashboard/ (All AUTHENTICATED)
    ├── layout.tsx (Dashboard Shell)
    │   ├── Sidebar Navigation
    │   ├── Mobile Header
    │   ├── Logout Button
    │   └── Protected by middleware
    │
    ├── page.tsx (Dashboard Home)
    │   ├── WelcomeHeader
    │   ├── QuickActions
    │   ├── StatsCards → GET /api/dashboard/stats
    │   ├── CurrentProjectsList → GET /api/dashboard/projects
    │   └── OutstandingInvoicesList → GET /api/dashboard/invoices
    │
    ├── leads/
    │   └── page.tsx
    │       ├── Search & Filter
    │       ├── Stats Cards
    │       ├── Leads Table → GET /api/leads/list
    │       └── Lead Detail Modal → GET /api/leads/[id]
    │           └── Status Update → PATCH /api/leads/[id]
    │
    ├── clients/
    │   └── page.tsx
    │       ├── Search Bar
    │       ├── Stats Cards
    │       ├── Clients Table → GET /api/clients
    │       ├── Add Client Modal → POST /api/clients
    │       └── Edit Client Modal → PATCH /api/clients/[id]
    │
    ├── projects/
    │   └── page.tsx
    │       ├── Status Filter
    │       ├── Stats by Status
    │       ├── Projects Table → GET /api/jobs
    │       └── Project Detail Modal → GET /api/jobs/[id]
    │           └── Status Update → PATCH /api/jobs/[id]
    │
    └── invoices/
        └── page.tsx
            ├── Status Filter
            ├── Financial Stats
            └── Invoices Table → GET /api/invoices

components/
└── dashboard/
    ├── WelcomeHeader.tsx
    ├── QuickActions.tsx
    ├── StatsCards.tsx (with loading states)
    └── CurrentProjectsList.tsx (with loading states)
```

### Component Communication Patterns

```
┌──────────────────────────────────────────────────────┐
│  Server Components (Default in Next.js 16)           │
│  • Initial HTML rendering                            │
│  • Direct database queries                           │
│  • No JavaScript to client                           │
│  Examples: layout.tsx                                │
└──────────────────────────────────────────────────────┘
                     ↓ Renders
┌──────────────────────────────────────────────────────┐
│  Client Components ('use client')                    │
│  • Interactive UI                                    │
│  • State management (useState, useEffect)            │
│  • API calls via fetch                               │
│  • Event handlers                                    │
│  Examples: All dashboard pages, forms                │
└──────────────────────────────────────────────────────┘
                     ↓ Calls
┌──────────────────────────────────────────────────────┐
│  API Routes (app/api/*)                              │
│  • REST endpoints                                    │
│  • Authentication verification                       │
│  • Database operations                               │
│  • External API integration                          │
└──────────────────────────────────────────────────────┘
                     ↓ Queries
┌──────────────────────────────────────────────────────┐
│  Supabase Database                                   │
│  • PostgreSQL                                        │
│  • Row Level Security                                │
│  • Real-time subscriptions (not yet used)            │
└──────────────────────────────────────────────────────┘
```

### State Management Strategy

```
1. Server State (Database → API → Components)
   - Fetched on component mount
   - Cached by React Query (future)
   - Refetched after mutations

2. Client State (React useState)
   - Form inputs
   - Modal visibility
   - Loading states
   - Error messages

3. URL State (Search params)
   - Filters (status, search terms)
   - Pagination
   - Sort order

4. Session State (Cookies)
   - Authentication tokens
   - User identity
   - Managed by Supabase Auth
```

---

## API Architecture

### API Endpoint Organization

```
app/api/
├── leads/
│   ├── route.ts                    POST   - Submit lead form (PUBLIC)
│   ├── list/
│   │   └── route.ts               GET    - List leads with filters
│   └── [id]/
│       └── route.ts               GET    - Get lead details
│                                  PATCH  - Update lead
│                                  DELETE - Delete lead
├── clients/
│   ├── route.ts                    GET    - List clients
│                                  POST   - Create client
│   └── [id]/
│       └── route.ts               GET    - Get client with jobs/invoices
│                                  PATCH  - Update client
│                                  DELETE - Delete client
├── jobs/
│   ├── route.ts                    GET    - List jobs
│                                  POST   - Create job
│   └── [id]/
│       └── route.ts               GET    - Get job details
│                                  PATCH  - Update job
│                                  DELETE - Delete job
├── invoices/
│   ├── route.ts                    GET    - List invoices
│   └── [id]/
│       └── route.ts               GET    - Get invoice details
├── dashboard/
│   ├── stats/
│   │   └── route.ts               GET    - Dashboard statistics
│   ├── projects/
│   │   └── route.ts               GET    - Active projects
│   └── invoices/
│       └── route.ts               GET    - Outstanding invoices
└── webhooks/
    ├── stripe/
    │   └── route.ts               POST   - Stripe webhook (PUBLIC)
    └── invoiceninja/
        └── route.ts               POST   - Invoice Ninja webhook (PUBLIC)
```

### API Request/Response Pattern

**Standard Request Flow:**
```typescript
1. Request arrives at API route
2. Extract authentication token from cookies
3. Verify user is authenticated (except public routes)
4. Validate request body with Zod (for POST/PATCH)
5. Perform business logic
6. Query/mutate database
7. Return JSON response with proper status code
8. Log errors without exposing internals
```

**Standard Response Format:**
```typescript
// Success Response
{
  "success": true,
  "data": { ... },
  "message": "Operation completed successfully"
}

// Error Response
{
  "success": false,
  "error": "Error type",
  "message": "User-friendly error message",
  "details": { ... } // Only in development
}
```

### Authentication Verification Pattern

```typescript
export async function GET(request: NextRequest) {
  // Every protected endpoint starts with this
  const supabase = createClient();

  const { data: { user }, error } = await supabase.auth.getUser();

  if (error || !user) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    );
  }

  // Continue with business logic...
}
```

### Validation Pattern (Zod)

```typescript
import { z } from 'zod';

// Define schema
const ClientSchema = z.object({
  first_name: z.string().min(1, 'First name required'),
  last_name: z.string().min(1, 'Last name required'),
  email: z.string().email('Valid email required'),
  phone: z.string().min(10, 'Valid phone required'),
});

// Validate in API route
export async function POST(request: NextRequest) {
  const body = await request.json();

  const result = ClientSchema.safeParse(body);

  if (!result.success) {
    return NextResponse.json(
      {
        error: 'Validation failed',
        details: result.error.errors
      },
      { status: 400 }
    );
  }

  // Use validated data
  const validatedData = result.data;
}
```

---

## Database Architecture

### Complete Schema Overview

```sql
-- CORE ENTITIES
clients (17 columns)
  ├── id (PK, UUID)
  ├── first_name, last_name
  ├── email (UNIQUE)
  ├── phone
  ├── company_name
  ├── preferred_contact_method
  ├── notes
  ├── created_at, updated_at
  └── Relationships:
      ├── → properties (1:many)
      ├── → leads (1:many)
      ├── → jobs (1:many)
      └── → invoices (1:many)

properties (10 columns)
  ├── id (PK, UUID)
  ├── client_id (FK → clients)
  ├── street_address
  ├── city, state, zip_code
  ├── property_type
  ├── notes
  └── created_at, updated_at

leads (15 columns)
  ├── id (PK, UUID)
  ├── client_id (FK → clients)
  ├── property_id (FK → properties)
  ├── status (enum: new, contacted, qualified, converted, lost)
  ├── service_type
  ├── project_details
  ├── estimated_budget
  ├── preferred_start_date
  ├── lead_source
  ├── notes
  ├── follow_up_date
  └── created_at, updated_at

jobs (18 columns)
  ├── id (PK, UUID)
  ├── job_number (UNIQUE, auto-generated)
  ├── client_id (FK → clients)
  ├── property_id (FK → properties)
  ├── title
  ├── description
  ├── status (enum: lead, estimate, scheduled, in_progress, completed, cancelled)
  ├── start_date
  ├── estimated_completion_date
  ├── actual_completion_date
  ├── total_amount
  ├── notes
  └── created_at, updated_at
  └── Relationships:
      ├── → job_phases (1:many)
      ├── → estimates (1:many)
      ├── → invoices (1:many)
      └── → photos (1:many)

-- ESTIMATION & CONTRACTS
estimates (12 columns)
  ├── id (PK, UUID)
  ├── estimate_number (UNIQUE)
  ├── job_id (FK → jobs)
  ├── client_id (FK → clients)
  ├── status (enum: draft, sent, viewed, accepted, rejected)
  ├── valid_until
  ├── subtotal, tax_amount, total_amount
  ├── notes
  └── created_at, updated_at
  └── → estimate_items (1:many)

estimate_items (8 columns)
  ├── id (PK, UUID)
  ├── estimate_id (FK → estimates)
  ├── description
  ├── quantity, unit_price
  ├── total (calculated)
  └── created_at

-- INVOICING & PAYMENTS
invoices (15 columns)
  ├── id (PK, UUID)
  ├── invoice_number (UNIQUE)
  ├── job_id (FK → jobs)
  ├── client_id (FK → clients)
  ├── status (enum: draft, sent, viewed, partial, paid, overdue, cancelled)
  ├── invoice_date
  ├── due_date
  ├── subtotal, tax_amount, total_amount
  ├── invoice_ninja_id (external reference)
  ├── notes
  └── created_at, updated_at
  └── Relationships:
      ├── → invoice_items (1:many)
      └── → payments (1:many)

invoice_items (8 columns)
  ├── id (PK, UUID)
  ├── invoice_id (FK → invoices)
  ├── description
  ├── quantity, unit_price
  ├── total (calculated)
  └── created_at

payments (13 columns)
  ├── id (PK, UUID)
  ├── invoice_id (FK → invoices)
  ├── amount
  ├── payment_date
  ├── payment_method (enum: cash, check, credit_card, ach, other)
  ├── transaction_id (Stripe payment intent ID)
  ├── stripe_payment_intent_id
  ├── notes
  └── created_at, updated_at

-- COMMUNICATION
communications (11 columns)
  ├── id (PK, UUID)
  ├── client_id (FK → clients)
  ├── job_id (FK → jobs, optional)
  ├── type (enum: email, sms, phone, in_person)
  ├── direction (enum: inbound, outbound)
  ├── subject
  ├── message
  ├── status (enum: sent, delivered, failed)
  └── created_at

-- PROJECT MANAGEMENT
job_phases (10 columns)
  ├── id (PK, UUID)
  ├── job_id (FK → jobs)
  ├── phase_name
  ├── status (enum: pending, in_progress, completed, cancelled)
  ├── start_date
  ├── completion_date
  ├── notes
  └── created_at, updated_at

photos (10 columns)
  ├── id (PK, UUID)
  ├── job_id (FK → jobs)
  ├── file_path (Supabase Storage URL)
  ├── caption
  ├── photo_type (enum: before, during, after)
  ├── taken_at
  └── created_at, updated_at

tasks (12 columns)
  ├── id (PK, UUID)
  ├── job_id (FK → jobs, optional)
  ├── client_id (FK → clients, optional)
  ├── title
  ├── description
  ├── status (enum: pending, in_progress, completed, cancelled)
  ├── priority (enum: low, medium, high, urgent)
  ├── due_date
  ├── assigned_to
  └── created_at, updated_at

-- CHANGE ORDERS
change_orders (11 columns)
  ├── id (PK, UUID)
  ├── job_id (FK → jobs)
  ├── description
  ├── amount
  ├── status (enum: pending, approved, rejected)
  ├── requested_date
  ├── approved_date
  └── created_at, updated_at

-- SYSTEM TABLES
webhook_event_dlq (8 columns)
  ├── id (PK, UUID)
  ├── event_source (stripe, invoiceninja)
  ├── event_type
  ├── event_data (JSONB)
  ├── error_message
  ├── retry_count
  └── created_at

audit_log (10 columns)
  ├── id (PK, UUID)
  ├── table_name
  ├── record_id
  ├── action (enum: insert, update, delete)
  ├── old_values (JSONB)
  ├── new_values (JSONB)
  ├── user_id
  └── created_at
```

### Database Views

```sql
-- v_invoice_summary
-- Calculates invoice totals with payments
CREATE VIEW v_invoice_summary AS
SELECT
  i.id as invoice_id,
  i.invoice_number,
  i.client_id,
  i.job_id,
  i.status,
  i.invoice_date,
  i.due_date,
  i.subtotal,
  i.tax_amount,
  i.total_amount,
  COALESCE(SUM(p.amount), 0) as amount_paid,
  i.total_amount - COALESCE(SUM(p.amount), 0) as balance_due
FROM invoices i
LEFT JOIN payments p ON p.invoice_id = i.id
GROUP BY i.id;

-- v_client_ar (Accounts Receivable)
-- Total outstanding balance per client
CREATE VIEW v_client_ar AS
SELECT
  c.id as client_id,
  c.first_name,
  c.last_name,
  c.email,
  COUNT(i.id) as invoice_count,
  SUM(i.total_amount) as total_invoiced,
  SUM(COALESCE(p.amount_paid, 0)) as total_paid,
  SUM(i.total_amount - COALESCE(p.amount_paid, 0)) as balance_due
FROM clients c
LEFT JOIN invoices i ON i.client_id = c.id
LEFT JOIN (
  SELECT invoice_id, SUM(amount) as amount_paid
  FROM payments
  GROUP BY invoice_id
) p ON p.invoice_id = i.id
GROUP BY c.id;
```

### Row Level Security (RLS) Policies

```sql
-- All tables have RLS enabled
-- Service role (API) bypasses RLS
-- Anonymous users can only:
--   - INSERT into leads table (form submission)

-- Example policy for clients table:
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role has full access"
  ON clients
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Similar policies for all tables
```

### Database Indexing Strategy

```sql
-- Primary Keys (automatic indexes)
-- Foreign Keys (automatic indexes in Supabase)

-- Additional indexes for performance:
CREATE INDEX idx_clients_email ON clients(email);
CREATE INDEX idx_leads_status ON leads(status);
CREATE INDEX idx_leads_created_at ON leads(created_at DESC);
CREATE INDEX idx_jobs_status ON jobs(status);
CREATE INDEX idx_jobs_client_id ON jobs(client_id);
CREATE INDEX idx_invoices_status ON invoices(status);
CREATE INDEX idx_invoices_due_date ON invoices(due_date);
CREATE INDEX idx_payments_invoice_id ON payments(invoice_id);
```

---

## Authentication Architecture

### Authentication Flow Diagram

```
┌─────────────────────────────────────────────────────────────┐
│  1. User Visits Site                                        │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│  2. Middleware Intercepts Request                           │
│     (middleware.ts)                                         │
│                                                             │
│     • Reads cookies (sb-access-token, sb-refresh-token)    │
│     • Creates Supabase client with cookies                 │
│     • Calls supabase.auth.getUser()                        │
└────────────────────┬────────────────────────────────────────┘
                     │
         ┌───────────┴───────────┐
         │                       │
         ▼                       ▼
┌─────────────────┐    ┌─────────────────────┐
│  No User Found  │    │   User Found        │
│  (Not Auth'd)   │    │   (Authenticated)   │
└────────┬────────┘    └──────────┬──────────┘
         │                        │
         ▼                        ▼
┌─────────────────┐    ┌──────────────────────┐
│  Redirect to    │    │  Allow to Continue   │
│  /login         │    │  to /dashboard/*     │
└─────────────────┘    └──────────────────────┘
```

### Session Management

**Cookie Structure:**
```javascript
// Cookies set by Supabase Auth
{
  "sb-access-token": "eyJhbGc...", // JWT access token
  "sb-refresh-token": "v1.abc...", // Refresh token
  // Cookie settings:
  httpOnly: true,      // Prevents JavaScript access
  secure: true,        // HTTPS only
  sameSite: 'lax',     // CSRF protection
  maxAge: 604800,      // 7 days
  path: '/'
}
```

**Session Lifecycle:**
```
1. Login → Supabase creates session → Cookies set
2. Request → Middleware reads cookies → Validates session
3. 7 days later → Session expires → Redirect to login
4. Logout → Cookies cleared → Session destroyed
```

### Authentication Files

**1. lib/supabase-server.ts**
```typescript
// Server-side Supabase client
// Used in: API routes, Server Components, Middleware
export function createClient() {
  const cookieStore = cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { get: (name) => cookieStore.get(name)?.value } }
  );
}
```

**2. lib/supabase-browser.ts**
```typescript
// Client-side Supabase client
// Used in: Client Components
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
```

**3. app/actions/auth.ts**
```typescript
// Server actions for auth operations
export async function login(formData: FormData)
export async function signup(formData: FormData)
export async function logout()
```

**4. middleware.ts**
```typescript
// Route protection
export async function middleware(request: NextRequest) {
  // Check session
  // Redirect if needed
  // Return response with updated cookies
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|api).*)']
};
```

### User Roles & Permissions

**Current Implementation:**
- All authenticated users are "admin"
- Full access to all dashboard features
- No role-based access control (yet)

**Future Enhancement:**
```typescript
// Planned user roles
enum UserRole {
  ADMIN = 'admin',          // Full access
  CONTRACTOR = 'contractor', // Manage jobs & clients
  CLIENT = 'client',        // View own data only
  VIEWER = 'viewer'         // Read-only access
}
```

---

## Notification Architecture

### Notification System Overview

```
┌─────────────────────────────────────────────────────────────┐
│  Notification Trigger Events                                │
│  • Lead Submitted                                           │
│  • Invoice Created                                          │
│  • Payment Received                                         │
│  • Job Status Updated                                       │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│  Notification Router (Non-blocking)                         │
│  lib/email.ts + lib/sms.ts                                  │
│                                                             │
│  • Check configuration (Resend API, Twilio API)            │
│  • Check user opt-in preferences (for SMS)                 │
│  • Format message based on template                        │
│  • Send asynchronously (don't block API response)          │
└────────────────────┬────────────────────────────────────────┘
                     │
         ┌───────────┴───────────┐
         │                       │
         ▼                       ▼
┌─────────────────┐    ┌─────────────────────┐
│  Email Service  │    │   SMS Service       │
│  (Resend)       │    │   (Twilio)          │
│                 │    │                     │
│  • HTML emails  │    │  • 160 char max     │
│  • 4 templates  │    │  • Opt-in required  │
│  • Branding     │    │  • 4 templates      │
└────────┬────────┘    └──────────┬──────────┘
         │                        │
         ▼                        ▼
┌─────────────────┐    ┌─────────────────────┐
│  Client Inbox   │    │  Client Phone       │
└─────────────────┘    └─────────────────────┘
```

### Email Templates (lib/email.ts)

**1. Lead Confirmation Email**
- **Recipient:** Client who submitted lead
- **Trigger:** Immediately after lead submission
- **Purpose:** Confirm receipt, set expectations
- **Content:**
  - Professional HTML template
  - Company branding (logo, colors)
  - Summary of submitted information
  - What happens next
  - Contact information
  - Estimated response time (within 24 hours)

**2. New Lead Notification Email**
- **Recipient:** Admin/contractor
- **Trigger:** Immediately after lead submission
- **Purpose:** Alert team to new lead requiring action
- **Content:**
  - Lead details (name, contact, service type, urgency)
  - Property address
  - Preferred contact method
  - Action button to view in dashboard
  - SMS opt-in status

**3. Invoice Sent Email**
- **Recipient:** Client
- **Trigger:** When Invoice Ninja creates invoice via webhook
- **Purpose:** Notify client of new invoice
- **Content:**
  - Invoice number and amount
  - Due date
  - Payment link
  - Line item summary
  - Payment instructions

**4. Payment Received Email**
- **Recipient:** Client
- **Trigger:** When payment processed via Stripe webhook
- **Purpose:** Confirm payment receipt
- **Content:**
  - Receipt/confirmation number
  - Amount paid
  - Payment method
  - Remaining balance (if partial payment)
  - Thank you message

### SMS Templates (lib/sms.ts)

**Key Principle:** Respect opt-in, keep under 160 characters, graceful fallback

**1. Lead Confirmation SMS**
```
CD Home Improvements: Thanks for reaching out! We received your request for [service_type]. We'll contact you within 24hrs at [preferred_contact]. Reply STOP to unsubscribe.
```

**2. Appointment Reminder SMS**
```
Reminder: Your appointment with CD Home Improvements is tomorrow at [time]. Reply YES to confirm or call [phone] to reschedule. Reply STOP to unsubscribe.
```

**3. Invoice Ready SMS**
```
Your invoice #[invoice_number] for $[amount] is ready. View & pay: [short_link]. Due [due_date]. Questions? Call [phone]. Reply STOP to unsubscribe.
```

**4. Payment Confirmed SMS**
```
Payment received! $[amount] paid on invoice #[invoice_number]. Remaining balance: $[balance]. Thank you! Reply STOP to unsubscribe.
```

### Notification Configuration

**Environment Variables Required:**

```bash
# Email Service (Resend)
RESEND_API_KEY=re_xxxxx
NOTIFICATION_FROM_EMAIL=notifications@cdhomeimprovements.com
NOTIFICATION_ADMIN_EMAIL=admin@cdhomeimprovements.com

# SMS Service (Twilio)
TWILIO_ACCOUNT_SID=ACxxxxx
TWILIO_AUTH_TOKEN=xxxxx
TWILIO_PHONE_NUMBER=+15551234567
NOTIFICATION_ADMIN_PHONE=+15559876543
```

**Cost Estimates:**
- **Resend:** $20/month for 50,000 emails (first 3,000 free)
- **Twilio SMS:** $0.0079/message in US (~$8 per 1,000 messages)

### Non-Blocking Implementation Pattern

```typescript
// Example from app/api/leads/route.ts
// Step 1-4: Create lead in database (blocking)
const { data: lead, error } = await supabase.from('leads').insert(validatedData).select().single();

// Step 5: Return success to user immediately
const response = NextResponse.json({ success: true, lead }, { status: 201 });

// Step 6: Send notifications asynchronously (non-blocking)
sendLeadConfirmationEmail({
  clientEmail: lead.email,
  clientName: `${lead.first_name} ${lead.last_name}`,
  serviceType: lead.service_type,
  // ... other data
}).catch(error => {
  // Log error but don't fail the API request
  console.error('Failed to send email (non-blocking):', error);
});

if (lead.sms_opt_in && lead.phone) {
  sendLeadConfirmationSMS({ /* ... */ }).catch(error => {
    console.error('Failed to send SMS (non-blocking):', error);
  });
}

return response; // User already got success response
```

**Why Non-Blocking?**
- User gets instant feedback (better UX)
- API doesn't fail if email/SMS service is down
- Notifications happen in background
- Transient failures don't affect core business logic

---

## Business Logic & Workflows

### Core Business Workflows

#### 1. Lead-to-Client-to-Job-to-Invoice Workflow

```
┌─────────────────────────────────────────────────────────────┐
│  STAGE 1: Lead Capture                                      │
│  Status: new → contacted → qualified → converted/lost       │
│                                                             │
│  Actions:                                                   │
│  • Public form submission                                   │
│  • Auto-notification to client & admin                      │
│  • Admin reviews in dashboard                               │
│  • Admin marks as "contacted" after first touch             │
│  • Admin qualifies (budget, timeline, fit)                  │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│  STAGE 2: Client Creation                                   │
│  Trigger: Lead status = "qualified"                         │
│                                                             │
│  Actions:                                                   │
│  • Admin creates client record from lead data               │
│  • Email uniqueness enforced                                │
│  • Client profile stores complete contact info              │
│  • Lead remains in system for tracking                      │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│  STAGE 3: Job Creation                                      │
│  Status: pending → in_progress → completed → cancelled      │
│                                                             │
│  Actions:                                                   │
│  • Admin creates job linked to client                       │
│  • Auto-generates job number (JOB-2025-0001)               │
│  • Define scope, timeline, budget estimate                  │
│  • Track labor & materials                                  │
│  • Update status as work progresses                         │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│  STAGE 4: Invoicing & Payment                               │
│  Status: draft → sent → paid → overdue → cancelled          │
│                                                             │
│  Actions:                                                   │
│  • Invoice created in Invoice Ninja (external)              │
│  • Webhook creates record in local database                 │
│  • Email sent to client with payment link                   │
│  • Client pays via Stripe                                   │
│  • Webhook updates payment status                           │
│  • Auto-send receipt email                                  │
└─────────────────────────────────────────────────────────────┘
```

#### 2. Status Transition Rules

**Leads:**
```
new → contacted (admin action required)
contacted → qualified (admin evaluation)
qualified → converted (when client record created)
any → lost (if prospect declines)

Rules:
• Cannot delete if status = "converted" (referential integrity)
• Cannot go back to earlier status
• Must provide notes when marking as "lost"
```

**Jobs:**
```
pending → in_progress (when work starts)
in_progress → completed (when work finished)
any → cancelled (customer/contractor cancellation)

Rules:
• Cannot delete if invoices exist (financial integrity)
• Cannot change client once job started
• Must have valid start_date before marking in_progress
• Completed jobs auto-trigger invoice creation (future)
```

**Invoices:**
```
draft → sent (when emailed to client)
sent → paid (when payment processed)
sent → overdue (when due_date passed and unpaid)
any → cancelled (if job cancelled)

Rules:
• Paid invoices cannot be edited
• Cannot delete paid invoices (audit trail)
• Partial payments tracked in payments table
• Overdue status auto-calculated in views
```

#### 3. Data Validation Rules

**Email Uniqueness:**
- Clients: Email must be unique (enforced at DB level)
- Leads: Email can duplicate (same person can submit multiple times)
- Users: Email must be unique (authentication requirement)

**Phone Validation:**
- Format: 10 digits minimum
- SMS opt-in: Only valid if phone provided
- International: Not currently supported (US only)

**Financial Rules:**
- Invoice total must match sum of line items
- Payment amount cannot exceed invoice total
- Discounts cannot make total negative
- Tax calculation: Auto-applied based on state

**Job Numbers:**
- Format: JOB-YYYY-NNNN
- Auto-generated, sequential within year
- Cannot be manually edited
- Unique across all years

---

## User Journeys

### Journey 1: Homeowner Submits Lead

**Actors:** Homeowner (public user), System, Admin

**Steps:**
1. **Homeowner visits public website**
   - Navigates to landing page or /lead-form
   - Sees professional service offerings

2. **Homeowner fills lead form**
   - Enters: name, email, phone, address
   - Selects: service type, urgency level
   - Describes: project details (free text)
   - Opts in: SMS notifications (checkbox)
   - Uploads: photos (optional, future feature)

3. **Homeowner submits form**
   - Client-side validation checks all required fields
   - Form posts to `/api/leads`

4. **System processes lead**
   - Server-side validation (Zod schema)
   - Lead saved to database
   - Auto-assigns status = "new"
   - Success response sent to browser

5. **System sends notifications (async)**
   - Email to homeowner: "Thanks, we got your request!"
   - Email to admin: "New lead requires attention"
   - SMS to homeowner (if opted in): Brief confirmation

6. **Homeowner sees confirmation**
   - Success message displayed
   - Email arrives within seconds
   - SMS arrives within seconds (if opted in)
   - Set expectations: "We'll contact you within 24 hours"

**Touchpoints:**
- Public website
- Email inbox
- Phone (SMS)

**Pain Points Solved:**
- No more phone tag ("call us for a quote")
- Instant confirmation (peace of mind)
- All info captured upfront (no repeated questions)
- Transparent timeline expectations

---

### Journey 2: Admin Manages Lead to Client Conversion

**Actors:** Admin (contractor)

**Steps:**
1. **Admin receives notification**
   - Email alert: "New lead from John Smith"
   - Checks email, clicks link to dashboard

2. **Admin logs in**
   - Visits /login
   - Enters email + password
   - Middleware validates session
   - Redirected to /dashboard

3. **Admin reviews dashboard**
   - Sees stats: 5 new leads, 12 active jobs, $45K pending invoices
   - Clicks "🆕 Leads" in sidebar

4. **Admin views lead list**
   - Sees all leads with filters
   - Filters by status = "new"
   - Sees John Smith's lead at top (newest first)

5. **Admin opens lead details**
   - Clicks lead row
   - Modal shows full info:
     - Contact details
     - Service type: "Kitchen Remodel"
     - Urgency: "Within 1 month"
     - Description: Full project details
     - Submitted: "2 minutes ago"

6. **Admin contacts homeowner**
   - Calls phone number from lead
   - Discusses project scope, budget, timeline
   - Determines if qualified fit

7. **Admin updates lead status**
   - Marks status = "contacted"
   - Adds internal notes: "Budget: $30K, start date: March"
   - Saves changes

8. **Admin qualifies lead**
   - After follow-up conversation
   - Marks status = "qualified"

9. **Admin creates client record**
   - Clicks "👥 Clients" in sidebar
   - Clicks "Add New Client"
   - Form pre-populated from lead data (future enhancement)
   - Manually enters: first name, last name, email, phone, address
   - Saves client

10. **Admin marks lead as converted**
    - Returns to Leads page
    - Updates John Smith's lead status = "converted"
    - Lead workflow complete

**Touchpoints:**
- Email notification
- Dashboard home
- Leads management page
- Client management page

**Pain Points Solved:**
- No more lost leads in email inbox
- Centralized lead tracking
- Clear status progression
- Smooth handoff from lead to client

---

### Journey 3: Admin Creates Job and Tracks Progress

**Actors:** Admin (contractor), Client (homeowner)

**Steps:**
1. **Admin creates job**
   - Navigates to Projects page
   - Clicks "Add New Project"
   - Fills form:
     - Selects client from dropdown (John Smith)
     - Job title: "Kitchen Remodel - 123 Main St"
     - Description: Detailed scope of work
     - Start date: March 1, 2025
     - Estimated completion: April 15, 2025
   - Saves job
   - System auto-generates: JOB-2025-0042

2. **Admin manages job details**
   - Adds labor records (future enhancement)
   - Adds material costs (future enhancement)
   - Updates status: "pending" → "in_progress"

3. **Client receives update (future)**
   - Email: "Your kitchen remodel has started!"
   - Link to client portal to track progress

4. **Admin tracks progress**
   - Updates job status as work progresses
   - Adds notes: "Cabinets installed, waiting on countertops"
   - Uploads progress photos (future enhancement)

5. **Admin completes job**
   - Updates status: "in_progress" → "completed"
   - Actual completion date: April 10, 2025

6. **System triggers invoice (future automation)**
   - Auto-creates invoice in Invoice Ninja
   - Based on labor + materials + markup
   - Sends to client automatically

**Touchpoints:**
- Projects management page
- Job detail view
- Email notifications (future)
- Client portal (future)

**Pain Points Solved:**
- No more spreadsheet tracking
- Centralized project management
- Clear status visibility
- Automated invoicing trigger

---

### Journey 4: Client Receives and Pays Invoice

**Actors:** Client (homeowner), System, Payment Processor (Stripe), Invoicing System (Invoice Ninja)

**Steps:**
1. **Invoice created in Invoice Ninja**
   - Admin manually creates invoice (or future: auto-triggered)
   - Invoice details:
     - Client: John Smith
     - Job: Kitchen Remodel (JOB-2025-0042)
     - Line items: Labor, materials, disposal
     - Total: $28,500
     - Due date: April 30, 2025

2. **System receives webhook**
   - Invoice Ninja sends webhook to `/api/webhooks/invoice-ninja`
   - System validates webhook signature
   - Creates local invoice record
   - Status: "sent"

3. **System sends notification**
   - Email to John Smith:
     - "Your invoice #INV-0042 is ready"
     - Total amount and due date
     - Payment link (hosted by Invoice Ninja + Stripe)
   - SMS (if opted in): Brief notification with short link

4. **Client views invoice**
   - Clicks link in email
   - Sees detailed invoice with line items
   - Multiple payment options:
     - Pay in full: $28,500
     - Partial payment: Enter custom amount
     - Credit card or ACH

5. **Client makes payment**
   - Enters credit card details (Stripe checkout)
   - Pays $28,500
   - Stripe processes payment

6. **Payment confirmed**
   - Stripe sends webhook to `/api/webhooks/stripe`
   - System validates webhook signature
   - Updates invoice status: "sent" → "paid"
   - Creates payment record in database

7. **Client receives confirmation**
   - Email: "Payment received! Receipt attached."
   - Details: Amount, date, payment method
   - Receipt PDF (from Invoice Ninja)

8. **Admin sees updated dashboard**
   - Invoice status shows "Paid"
   - Payment appears in recent activity
   - Cash flow metrics updated

**Touchpoints:**
- Email
- SMS (optional)
- Payment portal (hosted by Invoice Ninja/Stripe)
- Receipt email

**Pain Points Solved:**
- No more paper invoices or checks
- Instant payment processing
- Automatic receipt generation
- Real-time payment tracking
- Professional payment experience

---

## Problem-Solution Mapping

### Problems This Platform Solves

#### Problem 1: Lead Management Chaos
**Pain Points:**
- Leads come from multiple sources (website, email, phone, referrals)
- Easy to lose track in email inbox or sticky notes
- No systematic follow-up process
- Can't track conversion rate or lead source effectiveness
- No centralized view of pipeline

**Solution:**
- ✅ Single lead capture form with auto-notifications
- ✅ Centralized dashboard with all leads in one view
- ✅ Clear status progression (new → contacted → qualified → converted)
- ✅ Search and filter capabilities
- ✅ Lead-to-client conversion tracking
- ✅ Email/SMS confirmations prevent ghosting

**Business Impact:**
- Faster lead response time (minutes vs. hours/days)
- Higher conversion rate (no leads slip through cracks)
- Better customer first impression (instant confirmation)
- Trackable metrics for marketing ROI

---

#### Problem 2: Client Information Scattered
**Pain Points:**
- Client info in multiple places (phone contacts, email, notebook, head)
- Hard to find client history when they call
- Duplicate entries with conflicting info
- Can't see all jobs for a client at once
- No easy way to contact client

**Solution:**
- ✅ Single client record with all contact info
- ✅ Email uniqueness prevents duplicates
- ✅ Linked to all jobs and invoices
- ✅ Quick search by name, email, or phone
- ✅ Click-to-call and click-to-email (future)
- ✅ Complete client history in one view

**Business Impact:**
- Professional client interactions (know their history)
- Reduced errors from outdated contact info
- Faster quote turnaround (don't have to hunt for info)
- Better client relationships (remember past projects)

---

#### Problem 3: Project Tracking in Spreadsheets (or Worse)
**Pain Points:**
- Excel/Google Sheets becomes unwieldy with many jobs
- No real-time updates if multiple people working
- Hard to track job status at a glance
- Can't link jobs to invoices easily
- No labor/material cost tracking
- Difficult to analyze profitability

**Solution:**
- ✅ Dedicated project management interface
- ✅ Auto-generated job numbers (professional tracking)
- ✅ Clear status workflow (pending → in progress → completed)
- ✅ Linked to client and invoices
- ✅ Filter by status, client, or date range
- ✅ Search across all projects
- ✅ Foundation for labor/material tracking (next phase)

**Business Impact:**
- Know exactly what jobs are active
- Never double-book or miss a deadline
- Professional job numbering for client communication
- Scalable (can handle 100+ concurrent jobs)
- Data-driven insights on job profitability (future)

---

#### Problem 4: Invoicing Takes Too Long
**Pain Points:**
- Creating invoices manually takes 15-30 minutes each
- Easy to forget line items or apply wrong tax rate
- Clients lose paper invoices
- Have to manually track payment status
- Chasing payments is awkward and time-consuming
- Hard to see cash flow at a glance

**Solution:**
- ✅ Integration with Invoice Ninja (professional invoicing software)
- ✅ Invoices created and sent in minutes
- ✅ Automatic webhook sync keeps local DB updated
- ✅ Clients get email + SMS with payment link
- ✅ Online payment via Stripe (credit card or ACH)
- ✅ Automatic receipt generation
- ✅ Dashboard shows all pending payments
- ✅ Financial metrics at a glance ($45K pending, $12K overdue)

**Business Impact:**
- Admin time saved: ~20 hours/month (assuming 40 invoices/month)
- Faster payment (online payment easier than check)
- Reduced late payments (automated reminders)
- Better cash flow visibility
- Professional appearance to clients

---

#### Problem 5: Communication Gaps
**Pain Points:**
- Clients wonder: "Did they get my request?"
- Admin wonders: "Did the client receive the invoice?"
- No systematic way to keep clients updated
- Phone tag wastes time
- Clients feel left in the dark about project status

**Solution:**
- ✅ Auto-email confirmation when lead submitted
- ✅ Optional SMS confirmation (for clients who prefer text)
- ✅ Email notification when invoice sent
- ✅ Email receipt when payment received
- ✅ Admin gets email for new leads (never miss one)
- ✅ SMS for time-sensitive updates (appointment reminders, etc.)
- ✅ All notifications are non-blocking (system stays fast)

**Business Impact:**
- Reduced support calls ("Did you get my request?")
- Clients feel informed and valued
- Professional communication builds trust
- SMS opt-in rate ~70% (highly effective channel)
- Admin never misses a new lead

---

#### Problem 6: No Remote Access
**Pain Points:**
- Desktop software only works on office computer
- Can't check status while on job site
- Can't respond to leads while away from desk
- Clients can't see their project status

**Solution:**
- ✅ Web-based platform (works on any device)
- ✅ Mobile-responsive design
- ✅ Check dashboard from phone on job site
- ✅ Client portal (future) allows clients to self-serve
- ✅ Cloud database (always up-to-date)

**Business Impact:**
- Work from anywhere (truck, home, job site)
- Faster response time to leads (even when mobile)
- Better work-life balance (check status without going to office)
- Competitive advantage (clients expect modern tools)

---

## Technical Stack

### Frontend Technologies

**Core Framework:**
- **Next.js 16** (App Router)
  - Why: Server Components by default, excellent performance, built-in API routes
  - Use case: Entire application structure
  - File-based routing in `/app` directory

**Styling:**
- **Tailwind CSS 4.1**
  - Why: Rapid UI development, consistent design system, small bundle size
  - Use case: All component styling
  - Custom config in `tailwind.config.ts`

**Language:**
- **TypeScript 5.9**
  - Why: Type safety prevents bugs, better IDE support, self-documenting code
  - Use case: All JavaScript code
  - Strict mode enabled

**State Management:**
- **React Hooks** (built-in)
  - `useState`, `useEffect`, `useTransition` for client state
  - Server state managed via Server Components (no client state needed)

**Form Handling:**
- **Server Actions** (Next.js native)
  - Progressive enhancement (works without JS)
  - Built-in revalidation
  - Used for: Login, logout, form submissions

**UI Components:**
- **Custom components** built with Tailwind
  - No external UI library (keeps bundle small)
  - Modals, tables, forms all custom-built

---

### Backend Technologies

**Runtime:**
- **Node.js 22** (LTS)
  - Why: Required for Next.js, excellent ecosystem
  - Use case: Server-side rendering, API routes

**API Framework:**
- **Next.js API Routes** (App Router)
  - Location: `/app/api/**/route.ts`
  - Built-in: Request/Response handling, middleware
  - Pattern: RESTful endpoints with proper HTTP methods

**Validation:**
- **Zod 3.x**
  - Why: TypeScript-first, excellent error messages, type inference
  - Use case: All API input validation
  - Example: Client creation, lead submission

**Authentication:**
- **Supabase Auth**
  - Why: Built-in with database, handles sessions, secure by default
  - Features: Email/password, magic links (future), social auth (future)
  - Session: Cookie-based, 7-day expiry

---

### Database

**Primary Database:**
- **PostgreSQL 15** (via Supabase)
  - Why: Robust, ACID compliant, excellent JSON support, mature ecosystem
  - Features: Row Level Security, triggers, views, full-text search

**ORM/Query Builder:**
- **Supabase Client** (JavaScript SDK)
  - Simple query syntax
  - TypeScript support with generated types
  - Real-time subscriptions (not currently used)

**Database Schema:**
- 17 tables (see Database Architecture section)
- Foreign keys with proper constraints
- Indexes on frequently queried columns
- Row Level Security policies on all tables

---

### External Services

**Email:**
- **Resend**
  - Why: Developer-friendly, reliable, great deliverability
  - Pricing: Free for 3K emails/month, then $20/month for 50K
  - Use case: All transactional emails (confirmations, invoices, receipts)

**SMS:**
- **Twilio**
  - Why: Industry standard, reliable, global reach
  - Pricing: $0.0079 per SMS in US
  - Use case: Opt-in notifications (confirmations, reminders)

**Payments:**
- **Stripe**
  - Why: Best-in-class payment processing, excellent developer experience
  - Features: Credit cards, ACH, instant payouts, strong fraud protection
  - Integration: Webhook-based (async payment updates)

**Invoicing:**
- **Invoice Ninja**
  - Why: Open-source, feature-rich, self-hostable
  - Features: Invoice templates, recurring invoices, client portal, reports
  - Integration: Webhook-based (sync invoices to local DB)

**Workflow Automation:**
- **n8n**
  - Why: Open-source, visual workflow builder, self-hostable
  - Use case: Complex workflows (future), multi-step automations
  - Integration: Webhook triggers from platform

---

### DevOps & Infrastructure

**Containerization:**
- **Docker 24+** with Docker Compose
  - Why: Consistent dev/prod environments, easy deployment
  - Services containerized:
    - Next.js app
    - Supabase (PostgreSQL + API + Auth)
    - Invoice Ninja
    - n8n

**Version Control:**
- **Git** with GitHub
  - Branch strategy: Feature branches, main branch protected
  - CI/CD: GitHub Actions (future)

**Environment Management:**
- **dotenv** for environment variables
  - `.env.local` for development
  - `.env.production` for production
  - `.env.example` templates provided

**Package Manager:**
- **npm** (comes with Node.js)
  - Lock file: `package-lock.json` for reproducible builds

---

### Development Tools

**Code Quality:**
- **ESLint** (Next.js config)
  - Linting rules for TypeScript and React
- **TypeScript** compiler
  - Strict type checking enabled

**Development Server:**
- **Next.js Dev Server** (`npm run dev`)
  - Hot module replacement
  - Fast refresh for React components

---

### Future Technologies (Planned)

**Testing:**
- **Jest** - Unit tests
- **React Testing Library** - Component tests
- **Playwright** - E2E tests

**Monitoring:**
- **Sentry** - Error tracking
- **Vercel Analytics** - Performance monitoring

**File Storage:**
- **Supabase Storage** or **AWS S3**
  - Use case: Project photos, invoice attachments

---

## Deployment Architecture

### Deployment Options

#### Option 1: Self-Hosted (Docker Compose) - CURRENT SETUP

**Infrastructure:**
```
┌─────────────────────────────────────────────────────────────┐
│  Single Server (VPS or On-Premise)                         │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  Docker Host                                        │   │
│  │                                                     │   │
│  │  ┌──────────────┐  ┌──────────────┐              │   │
│  │  │  Next.js     │  │  Supabase    │              │   │
│  │  │  Container   │  │  Stack       │              │   │
│  │  │  Port 3000   │  │  Port 8000   │              │   │
│  │  └──────┬───────┘  └──────┬───────┘              │   │
│  │         │                  │                       │   │
│  │  ┌──────────────┐  ┌──────────────┐              │   │
│  │  │  Invoice     │  │  n8n         │              │   │
│  │  │  Ninja       │  │  Workflows   │              │   │
│  │  │  Port 8080   │  │  Port 5678   │              │   │
│  │  └──────────────┘  └──────────────┘              │   │
│  │                                                     │   │
│  │  ┌──────────────────────────────────────────────┐ │   │
│  │  │  PostgreSQL (in Supabase container)         │ │   │
│  │  │  Port 5432                                   │ │   │
│  │  └──────────────────────────────────────────────┘ │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  Reverse Proxy (Nginx or Caddy)                    │   │
│  │  • SSL termination (Let's Encrypt)                 │   │
│  │  • Routes: /, /api, /supabase, /invoices           │   │
│  │  Port 80 → 443                                     │   │
│  └─────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
                             │
                             ▼
                    ┌─────────────────┐
                    │   Internet      │
                    └─────────────────┘
```

**Setup Steps:**
1. **Provision server:**
   - Minimum specs: 4 CPU, 8GB RAM, 50GB SSD
   - OS: Ubuntu 22.04 LTS
   - Install Docker and Docker Compose

2. **Clone repository:**
   ```bash
   git clone https://github.com/RazonIn4K/CS-Construction.git
   cd CS-Construction
   ```

3. **Configure environment:**
   ```bash
   cp .env.example .env.local
   # Edit .env.local with production values
   ```

4. **Start services:**
   ```bash
   docker-compose up -d
   ```

5. **Configure reverse proxy:**
   - Point domain to server IP
   - Set up SSL with Let's Encrypt
   - Configure nginx/caddy to route traffic

6. **Initialize database:**
   ```bash
   # Run migrations (if any)
   docker-compose exec supabase psql -U postgres -f /migrations/init.sql
   ```

**Pros:**
- Full control over infrastructure
- One-time server cost (no per-request fees)
- Data stays on your server
- Good for contractors with existing infrastructure

**Cons:**
- Requires server management skills
- Manual updates and backups
- Single point of failure (need redundancy for production)
- You handle security patches

---

#### Option 2: Vercel + Supabase Cloud (Recommended for Scale)

**Infrastructure:**
```
┌─────────────────────────────────────────────────────────────┐
│  Vercel Platform                                            │
│  • Auto-scaling Next.js hosting                             │
│  • Global CDN                                               │
│  • Automatic HTTPS                                          │
│  • CI/CD from GitHub                                        │
└────────────────────┬────────────────────────────────────────┘
                     │
         ┌───────────┴───────────┐
         │                       │
         ▼                       ▼
┌─────────────────┐    ┌─────────────────────┐
│  Supabase Cloud │    │  External Services  │
│  • Managed DB   │    │  • Resend (email)   │
│  • Auth         │    │  • Twilio (SMS)     │
│  • Storage      │    │  • Stripe (payment) │
│  • Backups      │    │  • Invoice Ninja    │
└─────────────────┘    └─────────────────────┘
```

**Setup Steps:**
1. **Create Supabase project:**
   - Go to supabase.com
   - Create new project
   - Copy API URL and anon key

2. **Deploy to Vercel:**
   - Connect GitHub repo
   - Set environment variables
   - Deploy with one click

3. **Configure external services:**
   - Set up Resend, Twilio, Stripe accounts
   - Add API keys to Vercel environment

**Pros:**
- Zero DevOps (Vercel handles everything)
- Auto-scales with traffic
- Global CDN (fast everywhere)
- Automatic SSL and preview deployments
- GitHub integration (deploy on push)

**Cons:**
- Monthly costs scale with usage
- Less control over infrastructure
- Vendor lock-in

**Pricing Estimate:**
- Vercel: $20/month (Pro plan)
- Supabase: $25/month (Pro plan with 8GB database)
- External services: ~$50/month
- **Total: ~$95/month** (for established business with traffic)

---

### Environment Variables Reference

**Required for all deployments:**
```bash
# Next.js
NODE_ENV=production
NEXT_PUBLIC_APP_URL=https://yourdomain.com

# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGc... # Server-side only, never expose

# Notifications
RESEND_API_KEY=re_xxxxx
NOTIFICATION_FROM_EMAIL=notifications@yourdomain.com
NOTIFICATION_ADMIN_EMAIL=admin@yourdomain.com

TWILIO_ACCOUNT_SID=ACxxxxx
TWILIO_AUTH_TOKEN=xxxxx
TWILIO_PHONE_NUMBER=+15551234567
NOTIFICATION_ADMIN_PHONE=+15559876543

# External Services
STRIPE_SECRET_KEY=sk_live_xxxxx
STRIPE_WEBHOOK_SECRET=whsec_xxxxx

INVOICE_NINJA_API_URL=https://invoices.yourdomain.com
INVOICE_NINJA_API_TOKEN=xxxxx
INVOICE_NINJA_WEBHOOK_SECRET=xxxxx

N8N_WEBHOOK_URL=https://n8n.yourdomain.com/webhook/xxxxx
```

---

### Backup Strategy

**Database Backups:**
- **Frequency:** Daily at 2 AM
- **Retention:** 30 days
- **Method:** `pg_dump` to S3 or local storage
- **Restoration:** Documented procedure in `/docs/restore.md`

**Application Backups:**
- **Code:** Git repository (GitHub as source of truth)
- **Environment:** `.env` files stored securely (1Password, Vault)
- **Uploads:** Synced to S3 or backup storage

**Disaster Recovery:**
- **RTO (Recovery Time Objective):** 4 hours
- **RPO (Recovery Point Objective):** 24 hours (daily backups)
- **Procedure:** Documented in `/docs/disaster-recovery.md`

---

## Integration Points

### Supabase Integration

**Purpose:** Database + Authentication

**Connection Method:**
- Server-side: `lib/supabase-server.ts` (SSR-enabled client)
- Client-side: `lib/supabase-browser.ts` (browser client)

**API Usage:**
```typescript
// Query example
const { data, error } = await supabase
  .from('clients')
  .select('*')
  .eq('id', clientId)
  .single();

// Auth example
const { data: { user } } = await supabase.auth.getUser();
```

**Webhook Endpoints:**
- None (using direct client connections)

---

### Resend Integration (Email)

**Purpose:** Transactional email delivery

**Connection Method:**
- HTTP API via `lib/email.ts`
- API Key authentication

**API Usage:**
```typescript
import { Resend } from 'resend';
const resend = new Resend(process.env.RESEND_API_KEY);

const { data, error } = await resend.emails.send({
  from: 'notifications@yourdomain.com',
  to: ['client@example.com'],
  subject: 'Invoice Ready',
  html: '<html>...</html>',
});
```

**Rate Limits:**
- Free tier: 100 emails/day
- Pro tier: 50,000 emails/month

**Error Handling:**
- Non-blocking (logged but doesn't fail API request)
- Retry logic not implemented (emails are fire-and-forget)

---

### Twilio Integration (SMS)

**Purpose:** SMS notifications for time-sensitive updates

**Connection Method:**
- HTTP API via `lib/sms.ts`
- Account SID + Auth Token authentication

**API Usage:**
```typescript
import twilio from 'twilio';
const client = twilio(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN);

const message = await client.messages.create({
  body: 'Your invoice is ready!',
  from: '+15551234567',
  to: '+15559876543',
});
```

**Rate Limits:**
- No hard limit (pay per message)
- Recommended: 1 message per second

**Compliance:**
- TCPA compliance: Requires opt-in
- Automatic "Reply STOP to unsubscribe" footer
- Opt-out tracking (future enhancement)

---

### Stripe Integration (Payments)

**Purpose:** Process credit card and ACH payments

**Connection Method:**
- Webhook-based (Stripe → Platform)
- Webhook endpoint: `/app/api/webhooks/stripe/route.ts`

**Webhook Events:**
```typescript
// Event types handled:
- payment_intent.succeeded → Update invoice status to "paid"
- payment_intent.failed → Log failure, notify admin
- charge.refunded → Create refund record
```

**Security:**
- Webhook signature verification (required)
- Secret stored in environment variables

**Testing:**
- Use Stripe CLI for local webhook testing:
  ```bash
  stripe listen --forward-to localhost:3000/api/webhooks/stripe
  ```

---

### Invoice Ninja Integration

**Purpose:** Professional invoicing system

**Connection Method:**
- Dual integration:
  1. API calls (Platform → Invoice Ninja) for creating invoices
  2. Webhooks (Invoice Ninja → Platform) for status updates

**API Usage:**
```typescript
// Create invoice (future implementation)
const response = await fetch(`${INVOICE_NINJA_API_URL}/api/v1/invoices`, {
  method: 'POST',
  headers: {
    'X-Api-Token': INVOICE_NINJA_API_TOKEN,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({ /* invoice data */ }),
});
```

**Webhook Events:**
```typescript
// Handled in /app/api/webhooks/invoice-ninja/route.ts
- invoice.created → Sync to local database
- invoice.sent → Update status, trigger notification
- invoice.paid → Update status, send receipt
```

**Security:**
- Webhook secret verification
- API token stored securely

---

### n8n Integration (Workflow Automation)

**Purpose:** Complex multi-step automations

**Connection Method:**
- Webhook triggers (Platform → n8n)
- Endpoint: Configured per workflow

**Example Workflows (Future):**
1. **Lead Nurture Campaign:**
   - Trigger: New lead created
   - Steps: Wait 24hrs → Send follow-up email → Wait 3 days → Send SMS

2. **Payment Reminder:**
   - Trigger: Invoice overdue
   - Steps: Send email → Wait 7 days → Send SMS → Wait 7 days → Notify admin

3. **Review Request:**
   - Trigger: Job completed + payment received
   - Steps: Wait 3 days → Send review request email → Track response

**API Usage:**
```typescript
// Trigger n8n workflow
await fetch(process.env.N8N_WEBHOOK_URL, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ event: 'lead.created', data: lead }),
});
```

---

## Security Architecture

### Authentication & Authorization

**Session Security:**
- **Storage:** httpOnly cookies (not accessible via JavaScript)
- **Encryption:** Cookies are encrypted by Supabase
- **Expiry:** 7 days, auto-refresh on activity
- **Transmission:** HTTPS only (secure flag set)
- **CSRF Protection:** SameSite=Lax cookie attribute

**Password Requirements:**
- Minimum 8 characters (enforced by Supabase)
- Future: Complexity requirements (uppercase, lowercase, number, symbol)

**Authorization:**
- All `/dashboard/*` routes protected by middleware
- Unauthenticated users redirected to `/login`
- API routes validate session on every request
- Future: Role-based access control (RBAC)

---

### API Security

**Input Validation:**
- All API endpoints use Zod schemas
- Type coercion and sanitization
- Detailed error messages in development, generic in production

**Rate Limiting:**
- Not currently implemented
- Recommended: 100 requests/minute per IP for public endpoints
- Recommended: 1,000 requests/minute for authenticated endpoints

**CORS:**
- Restricted to same-origin by default
- Future: Whitelist specific domains for client portal

**SQL Injection Prevention:**
- Supabase client uses parameterized queries (safe by default)
- No raw SQL in application code

---

### Database Security

**Row Level Security (RLS):**
- Enabled on all tables
- Policies enforce: Authenticated users only
- Future: User-specific policies (users can only see their own data)

**Encryption:**
- At rest: Supabase encrypts database storage
- In transit: All connections use SSL/TLS

**Backup Security:**
- Backups encrypted at rest
- Access restricted to admin users only
- Stored in separate location from primary database

**Connection Security:**
- Database credentials never exposed to client
- Service role key used server-side only (never in browser)
- Connection pooling limits concurrent connections

---

### Third-Party Service Security

**API Key Management:**
- All API keys stored in environment variables
- Never committed to Git
- Different keys for development and production
- Rotated every 90 days (recommended)

**Webhook Security:**
- All webhooks verify signatures
- Reject unsigned or invalid requests
- Stripe: `stripe.webhooks.constructEvent()`
- Invoice Ninja: Custom signature verification

**OAuth Scopes:**
- Request minimum necessary permissions
- Future: Social auth (Google, Facebook) with minimal scopes

---

### Frontend Security

**XSS Prevention:**
- React auto-escapes JSX content
- No `dangerouslySetInnerHTML` usage
- Content Security Policy headers (future)

**HTTPS Enforcement:**
- All production traffic over HTTPS
- HSTS headers to prevent downgrade attacks

**Dependency Security:**
- Regular `npm audit` runs
- Automated Dependabot updates (future)
- Only vetted, popular packages used

---

### Compliance & Privacy

**Data Privacy:**
- GDPR considerations (future):
  - Right to access (export user data)
  - Right to deletion (hard delete with cascades)
  - Data retention policies
  - Privacy policy and terms of service

**PCI Compliance:**
- Payment data never stored in platform
- Stripe handles all PCI-sensitive data
- Platform only stores Stripe payment IDs (tokens)

**TCPA Compliance (SMS):**
- Explicit opt-in required for SMS
- Automatic "Reply STOP" footer
- Opt-out tracking and respect

---

### Logging & Monitoring

**Application Logging:**
- Console logs in development
- Future: Structured logging with Winston or Pino
- Future: Log aggregation (Datadog, Logstash)

**Error Tracking:**
- Future: Sentry integration
  - Automatic error capturing
  - Source map support
  - User context attached to errors

**Audit Trail:**
- Future: Track critical actions:
  - User login/logout
  - Client record changes
  - Invoice modifications
  - Payment processing
- Store in `audit_logs` table with immutable records

**Security Monitoring:**
- Future: Failed login attempt tracking
- Future: Unusual activity alerts
- Future: IP-based blocking for brute force attempts

---

### Incident Response

**Security Incident Procedure:**
1. **Detect:** Monitoring alerts or user report
2. **Assess:** Determine scope and severity
3. **Contain:** Disable affected services/accounts
4. **Eradicate:** Patch vulnerability, rotate keys
5. **Recover:** Restore services, verify security
6. **Post-Mortem:** Document incident, improve defenses

**Contacts:**
- Security lead: [Contact info]
- Hosting provider support: [Contact info]
- Legal counsel: [Contact info]

---

## Conclusion & Next Steps

### What We've Built

This platform provides a **complete contractor management system** that transforms chaotic business operations into a streamlined, professional workflow. From lead capture to invoice payment, every step is automated, tracked, and optimized.

**Key Achievements:**
✅ Lead management with instant notifications
✅ Client database with duplicate prevention
✅ Project tracking with auto-generated job numbers
✅ Invoice integration with online payments
✅ Email + SMS notification system
✅ Secure authentication and route protection
✅ Professional, responsive UI
✅ Scalable architecture ready for growth

---

### Immediate Next Steps (MVP Completion)

**Phase 1: Testing & Stabilization (2-3 weeks)**
1. Write unit tests for critical functions (validation, calculations)
2. Write integration tests for API endpoints
3. Manual testing of all user workflows
4. Fix bugs discovered during testing
5. Performance optimization (if needed)

**Phase 2: Production Deployment (1 week)**
1. Set up production environment (Vercel or VPS)
2. Configure production database with backups
3. Set up external services (Resend, Twilio, Stripe)
4. Domain setup and SSL configuration
5. Monitoring and error tracking setup
6. Deploy and smoke test

**Phase 3: Initial User Onboarding (1 week)**
1. Create admin user account
2. Import existing client data (if any)
3. Create sample invoices for testing
4. Train admin on platform usage
5. Document common workflows
6. Go live with real leads

---

### Future Enhancements (Post-MVP)

**Short Term (3-6 months):**
- **Client Portal:** Allow clients to view projects, invoices, make payments
- **Photo Uploads:** Before/after photos for projects
- **Labor & Material Tracking:** Detailed cost tracking per job
- **Automated Invoice Creation:** Trigger from completed jobs
- **Mobile App:** Native iOS/Android for field work
- **Advanced Reporting:** Profitability by job type, client lifetime value
- **Calendar Integration:** Schedule site visits and track availability

**Long Term (6-12 months):**
- **Subcontractor Management:** Track and pay subcontractors
- **Equipment Tracking:** Tool/equipment inventory and maintenance
- **Multi-User Support:** Separate accounts for office staff vs. field crews
- **Role-Based Access Control:** Granular permissions
- **Document Management:** Store contracts, permits, warranties
- **Quoting System:** Estimating tool with templates
- **CRM Features:** Email campaigns, lead scoring, pipeline analytics
- **Integration Marketplace:** Zapier, QuickBooks, etc.

---

### Maintenance & Operations

**Regular Tasks:**
- **Daily:** Monitor error logs, check failed notifications
- **Weekly:** Review new leads, invoice status, payment follow-ups
- **Monthly:** Database backups verification, dependency updates, security patches
- **Quarterly:** API key rotation, access review, performance analysis
- **Annually:** Security audit, disaster recovery drill, architecture review

**Support Resources:**
- **Documentation:** This ARCHITECTURE.md file + inline code comments
- **Code Repository:** https://github.com/RazonIn4K/CS-Construction
- **Issue Tracking:** GitHub Issues
- **Knowledge Base:** (Future) Wiki with common questions

---

### Success Metrics

**Track these KPIs to measure platform impact:**

**Lead Management:**
- Lead response time (target: < 1 hour during business hours)
- Lead-to-client conversion rate (target: > 30%)
- Lost lead reasons (track why leads don't convert)

**Financial:**
- Average days to payment (target: < 30 days)
- Invoice payment rate (target: > 95%)
- Outstanding receivables (monitor trend)

**Operational:**
- Active jobs count (capacity planning)
- Average job duration (efficiency metric)
- Admin time saved vs. manual process (target: 20+ hours/month)

**Client Satisfaction:**
- Email open rate (target: > 40%)
- SMS opt-in rate (target: > 70%)
- Response time to inquiries (target: < 4 hours)

---

### Final Notes

This architecture document is a **living document** and should be updated as the platform evolves. As new features are added, integrations change, or architectural decisions are made, update the relevant sections to keep this documentation accurate and useful.

**Document Version:** 1.0
**Last Updated:** January 2025
**Maintained By:** Development Team
**Review Frequency:** Quarterly or after major changes

---

**For questions, issues, or contributions, please:**
- Open an issue on GitHub
- Contact the development team
- Refer to inline code documentation

**Thank you for building with CD Home Improvements Platform!** 🏗️
