# Supabase Setup Guide

## Prerequisites
- [x] Supabase CLI installed (`which supabase` confirms)
- [ ] Supabase account (create at https://supabase.com)

## Step 1: Create Supabase Project

1. **Go to Supabase Dashboard**
   - Visit: https://supabase.com/dashboard
   - Sign in or create account

2. **Create New Project**
   - Click "New Project"
   - **Project name**: `cd-construction`
   - **Database password**: Generate strong password (save securely!)
   - **Region**: Choose closest to your location (US East recommended)
   - Click "Create new project" (takes ~2 minutes)

3. **Get Project Credentials**
   - Go to Project Settings → API
   - Copy these values:
     ```
     Project URL: https://[your-project-ref].supabase.co
     anon public key: eyJh...
     service_role key: eyJh...
     ```

## Step 2: Link Local Project to Supabase

```bash
# Navigate to project directory
cd /Users/davidortiz/Potentical-Fma/CD-Construction

# Link to your Supabase project
supabase link --project-ref [your-project-ref]
# When prompted, enter your database password

# Verify connection
supabase db remote ls
```

## Step 3: Apply Database Migrations

```bash
# Push all migrations to Supabase
supabase db push

# This will apply:
# - 20251028000000_initial_schema.sql (16 tables)
# - 20251028000001_webhook_dlq.sql (DLQ table)
```

## Step 4: Verify Tables Created

```bash
# List all tables
supabase db remote ls

# Expected output:
# - clients
# - properties
# - leads
# - jobs
# - job_phases
# - estimates
# - estimate_items
# - change_orders
# - invoices
# - invoice_items
# - payments
# - communications
# - photos
# - tasks
# - webhook_event_dlq (NEW)
# - v_invoice_summary (view)
# - v_client_ar (view)
```

## Step 5: Update Environment Variables

After project is created, update your `.env.local`:

```bash
# Supabase Configuration (Development)
NEXT_PUBLIC_SUPABASE_URL=https://[your-project-ref].supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=[your-anon-key]
SUPABASE_SERVICE_ROLE_KEY=[your-service-role-key]
DATABASE_URL=postgresql://postgres.[your-project-ref]:[your-db-password]@aws-0-us-east-1.pooler.supabase.com:6543/postgres
```

## Alternative: Local Development with Docker

If you want to develop locally without internet:

```bash
# Start local Supabase (PostgreSQL + Studio)
supabase start

# This creates:
# - Local PostgreSQL: postgresql://postgres:postgres@localhost:54322/postgres
# - Studio UI: http://localhost:54323
# - API: http://localhost:54321

# Apply migrations locally
supabase db reset

# Stop when done
supabase stop
```

## Troubleshooting

### Error: "Project ref not found"
- Double-check project ref in Supabase dashboard
- Ensure project is fully created (green status)

### Error: "Permission denied"
- Verify database password is correct
- Check service role key has proper permissions

### Error: "Migration already applied"
- This is safe to ignore
- Supabase tracks applied migrations automatically

### Error: "Function update_updated_at_column does not exist"
- This should be in initial migration
- If missing, check `20251028000000_initial_schema.sql`

## Next Steps

After Supabase is set up:
1. ✅ Apply RLS policies (security)
2. ✅ Add seed data (testing)
3. ✅ Test lead form submission
4. ✅ Configure Stripe webhooks
5. ✅ Deploy to production

## Useful Commands

```bash
# View migration history
supabase migration list

# Create new migration
supabase migration new [migration_name]

# Reset local database
supabase db reset

# Generate TypeScript types
supabase gen types typescript --local > types/database.types.ts
```

## Production Deployment

For production Supabase:
1. Create separate production project
2. Apply same migrations
3. Configure production URL in Vercel
4. Enable connection pooling (recommended)
5. Set up database backups (automatic on Pro plan)
