# Cost Optimization and Monitoring Guide

## Table of Contents
1. [Cost Overview](#cost-overview)
2. [Service-by-Service Cost Breakdown](#service-by-service-cost-breakdown)
3. [Cost Optimization Strategies](#cost-optimization-strategies)
4. [Budget Monitoring and Alerts](#budget-monitoring-and-alerts)
5. [Resource Usage Tracking](#resource-usage-tracking)
6. [Cost-Effective Scaling](#cost-effective-scaling)
7. [Cost Reduction Opportunities](#cost-reduction-opportunities)
8. [ROI Calculations](#roi-calculations)
9. [Cost Monitoring Scripts](#cost-monitoring-scripts)

---

## Cost Overview

### Monthly Cost Estimates

#### Minimum Viable Setup (MVP)
**Target: $100-200/month**

| Service | Tier | Monthly Cost | Notes |
|---------|------|--------------|-------|
| **Vercel** | Hobby | $0 | Free tier (bandwidth limited) |
| **Supabase** | Free | $0 | Up to 500MB database, 1GB file storage |
| **Stripe** | Pay-as-you-go | $0 base + 2.9% + $0.30 per transaction | No monthly fee |
| **VPS** | Basic | $5-12 | 1GB RAM, 25GB SSD (Hetzner/DigitalOcean) |
| **Domain** | - | $12-20/year | ~$1-2/month |
| **SSL Certificate** | Let's Encrypt | $0 | Free with Caddy |
| **Invoice Ninja** | Self-hosted | $0 | Included in VPS cost |
| **n8n** | Self-hosted | $0 | Included in VPS cost |
| **Uptime Kuma** | Self-hosted | $0 | Included in VPS cost |
| **Email** | Postmark Free | $0 | 100 emails/month free |
| **Total MVP** | - | **$5-15/month** | Plus transaction fees |

#### Production Setup (Small Business)
**Target: $200-400/month**

| Service | Tier | Monthly Cost | Notes |
|---------|------|--------------|-------|
| **Vercel** | Pro | $20 | Unlimited bandwidth, better performance |
| **Supabase** | Pro | $25 | 8GB database, 100GB file storage |
| **Stripe** | Pay-as-you-go | 2.9% + $0.30 | ~$300 in transactions = $9 |
| **VPS** | Production | $20-40 | 4GB RAM, 80GB SSD |
| **Domain** | - | $1-2 | Annual cost amortized |
| **SSL Certificate** | Let's Encrypt | $0 | Free with Caddy |
| **Email** | Postmark | $10 | 10,000 emails/month |
| **SMS** | Twilio | $5-20 | Pay-as-you-go |
| **Error Tracking** | Sentry | $26 | Developer plan |
| **Backups** | AWS S3 | $5-10 | 100GB Standard-IA storage |
| **Total Production** | - | **$121-163/month** | Plus ~$9 transaction fees |

#### Growth Setup (Established Business)
**Target: $500-1000/month**

| Service | Tier | Monthly Cost | Notes |
|---------|------|--------------|-------|
| **Vercel** | Pro | $20 | Or Enterprise for better SLA |
| **Supabase** | Team | $599 | 64GB database, 1TB file storage, 24/7 support |
| **Stripe** | Pay-as-you-go | 2.9% + $0.30 | ~$3000 in transactions = $90 |
| **VPS** | High Performance | $80-120 | 8GB RAM, 160GB SSD, dedicated CPU |
| **Domain** | - | $1-2 | Annual cost amortized |
| **Email** | Postmark | $50 | 100,000 emails/month |
| **SMS** | Twilio | $50-100 | Higher volume |
| **Error Tracking** | Sentry | $80 | Team plan |
| **Backups** | AWS S3 | $20-30 | 500GB Standard-IA storage |
| **CDN** | CloudFlare Pro | $20 | Optional for better performance |
| **Monitoring** | Datadog | $15 | Infrastructure monitoring |
| **Total Growth** | - | **$925-1112/month** | Plus ~$90 transaction fees |

---

## Service-by-Service Cost Breakdown

### 1. Vercel (Next.js Hosting)

#### Pricing Tiers
| Tier | Price | Features | Best For |
|------|-------|----------|----------|
| **Hobby** | $0/month | 100GB bandwidth, unlimited requests | Development, personal projects |
| **Pro** | $20/month | Unlimited bandwidth, priority support | Small business, production |
| **Enterprise** | Custom | SLA, dedicated support, advanced security | Large organizations |

#### Cost Optimization Strategies

**Use Hobby Tier Initially**
```bash
# Hobby tier is sufficient for:
# - < 10,000 page views/month
# - < 100GB bandwidth/month
# - No team collaboration needed

# Monitor usage in Vercel dashboard:
# https://vercel.com/dashboard/usage
```

**Optimize Bandwidth Usage**
```typescript
// next.config.ts - Reduce bandwidth with compression
const nextConfig: NextConfig = {
  compress: true, // Enable gzip compression
  images: {
    formats: ['image/avif', 'image/webp'], // Modern formats = smaller files
    minimumCacheTTL: 60 * 60 * 24 * 365, // Cache images for 1 year
  },
};

// Reduce JavaScript bundle size
const nextConfig: NextConfig = {
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production', // Remove console.logs
  },
  swcMinify: true, // Enable minification
};
```

**Use External CDN for Static Assets**
```typescript
// For high-traffic sites, offload static assets to external CDN
// This reduces Vercel bandwidth usage

// Option 1: Cloudinary for images (generous free tier)
const imageLoader = ({ src, width, quality }) => {
  return `https://res.cloudinary.com/YOUR_CLOUD_NAME/image/upload/w_${width},q_${quality || 75}/${src}`;
};

// Option 2: CloudFlare CDN (free tier available)
// Proxy your domain through CloudFlare to cache static assets
```

**Self-Host if Usage Exceeds $50/month**
```bash
# If Vercel costs exceed $50/month, consider self-hosting Next.js
# This requires more DevOps effort but can save significant costs

# Self-hosted Next.js on VPS:
# - $20-40/month VPS can handle significant traffic
# - Full control over caching and optimization
# - More complex deployment and monitoring

# Cost comparison:
# Vercel Pro: $20/month + bandwidth overages
# Self-hosted: $20-40/month VPS (all-inclusive)
```

#### Cost Monitoring
```bash
# Check Vercel usage
vercel whoami
vercel teams ls
vercel env ls

# Monitor bandwidth usage
# Dashboard: https://vercel.com/dashboard/usage

# Set up usage alerts
# Vercel Pro/Enterprise only - configure in dashboard
```

**Estimated Monthly Cost:**
- MVP: $0 (Hobby tier)
- Production: $20 (Pro tier)
- Growth: $20-500 (Pro or Enterprise)

---

### 2. Supabase (Database + Auth + Storage)

#### Pricing Tiers
| Tier | Price | Database | Storage | Bandwidth | Best For |
|------|-------|----------|---------|-----------|----------|
| **Free** | $0/month | 500MB | 1GB | 2GB/month | Development, MVP |
| **Pro** | $25/month | 8GB | 100GB | 250GB/month | Production |
| **Team** | $599/month | 64GB | 1TB | Unlimited | High-traffic production |
| **Enterprise** | Custom | Custom | Custom | Unlimited | Large organizations |

#### Cost Optimization Strategies

**Start with Free Tier**
```sql
-- Free tier is sufficient for:
-- - < 500MB database (estimate ~10,000 leads + clients)
-- - < 1GB file storage (if storing documents)
-- - < 2GB bandwidth/month

-- Monitor database size
SELECT
    pg_size_pretty(pg_database_size('postgres')) as db_size,
    pg_size_pretty(pg_database_size('postgres')::numeric / (500 * 1024 * 1024)) as percent_of_free_tier;

-- Monitor table sizes
SELECT
    schemaname,
    tablename,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;
```

**Database Size Optimization**
```sql
-- 1. Clean up old data regularly
-- Delete leads older than 2 years (if business allows)
DELETE FROM leads
WHERE created_at < NOW() - INTERVAL '2 years'
  AND status IN ('rejected', 'lost');

-- 2. Compress old data
-- Move old invoices to archive table (smaller indexes)
CREATE TABLE invoices_archive AS
SELECT * FROM invoices
WHERE created_at < NOW() - INTERVAL '1 year';

DELETE FROM invoices
WHERE invoice_id IN (SELECT invoice_id FROM invoices_archive);

-- 3. Optimize text columns
-- Use VARCHAR with limits instead of TEXT
ALTER TABLE leads
ALTER COLUMN notes TYPE VARCHAR(1000);

-- 4. Remove unused columns
-- Audit tables for columns that are never used
ALTER TABLE leads DROP COLUMN IF EXISTS legacy_column;

-- 5. Use JSONB efficiently
-- Don't store large JSON objects; split into separate tables
-- Bad:
-- metadata JSONB (could be 10KB+)
-- Good:
-- Store only essential metadata (< 1KB)
```

**Storage Optimization**
```typescript
// 1. Store files outside Supabase if possible
// Use Cloudinary, AWS S3, or other dedicated storage

// 2. Compress images before upload
import sharp from 'sharp';

async function uploadImage(file: File) {
  const buffer = await file.arrayBuffer();
  const compressed = await sharp(buffer)
    .resize(1920, 1080, { fit: 'inside' }) // Max dimensions
    .webp({ quality: 80 }) // Convert to WebP
    .toBuffer();

  // Compressed image is typically 70-90% smaller
  const { data, error } = await supabase.storage
    .from('images')
    .upload(`${Date.now()}.webp`, compressed);
}

// 3. Set up automatic file cleanup
// Delete files older than 90 days that aren't referenced
async function cleanupOrphanedFiles() {
  const { data: files } = await supabase.storage
    .from('temp')
    .list();

  const ninetyDaysAgo = Date.now() - (90 * 24 * 60 * 60 * 1000);

  for (const file of files) {
    if (new Date(file.created_at).getTime() < ninetyDaysAgo) {
      await supabase.storage.from('temp').remove([file.name]);
    }
  }
}
```

**Bandwidth Optimization**
```typescript
// 1. Use pagination to reduce data transfer
const { data, error } = await supabase
  .from('leads')
  .select('*')
  .range(0, 49) // Only fetch 50 records at a time
  .order('created_at', { ascending: false });

// 2. Select only needed columns
const { data, error } = await supabase
  .from('leads')
  .select('lead_id, status, created_at') // Don't fetch all columns
  .eq('status', 'new');

// 3. Use RPC for complex queries (reduces round trips)
-- Create RPC function in Supabase
CREATE OR REPLACE FUNCTION get_lead_summary()
RETURNS TABLE (
  total_leads BIGINT,
  new_leads BIGINT,
  in_progress_leads BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    COUNT(*)::BIGINT as total_leads,
    COUNT(*) FILTER (WHERE status = 'new')::BIGINT as new_leads,
    COUNT(*) FILTER (WHERE status = 'in_progress')::BIGINT as in_progress_leads
  FROM leads;
END;
$$ LANGUAGE plpgsql;

// Use in TypeScript
const { data } = await supabase.rpc('get_lead_summary');
// Returns summary in one query instead of multiple
```

**Connection Pooling**
```bash
# Use connection pooler to reduce connection overhead
# Edit .env:
DATABASE_URL=postgresql://postgres:PASSWORD@db.PROJECT.supabase.co:6543/postgres?pgbouncer=true
# Port 6543 = pooler, Port 5432 = direct connection

# Benefits:
# - Reduces connection overhead
# - Allows more concurrent connections
# - Improves performance
```

**Database Vacuum**
```sql
-- Run VACUUM regularly to reclaim space
-- This runs automatically, but manual VACUUM can help

-- Check table bloat
SELECT
    schemaname,
    tablename,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS total_size,
    pg_size_pretty(pg_relation_size(schemaname||'.'||tablename)) AS table_size,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename) - pg_relation_size(schemaname||'.'||tablename)) AS index_size
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;

-- Manual VACUUM (if needed)
VACUUM FULL leads;
VACUUM FULL invoices;
```

#### Cost Monitoring
```bash
# Monitor Supabase usage
# Dashboard: https://supabase.com/dashboard/project/YOUR_PROJECT/settings/billing

# Check database size
psql $DATABASE_URL -c "SELECT pg_size_pretty(pg_database_size('postgres'));"

# Check bandwidth usage (Supabase dashboard only)
```

**Estimated Monthly Cost:**
- MVP: $0 (Free tier)
- Production: $25 (Pro tier)
- Growth: $25-599 (Pro or Team tier)

---

### 3. Stripe (Payment Processing)

#### Pricing Model
**Transaction Fees:**
- 2.9% + $0.30 per successful charge
- No monthly fee
- No setup fee
- No cancellation fee

**Example Calculations:**
```bash
# $1,000 invoice:
# Fee = ($1,000 × 0.029) + $0.30 = $29.30
# Net = $1,000 - $29.30 = $970.70

# $5,000 invoice:
# Fee = ($5,000 × 0.029) + $0.30 = $145.30
# Net = $5,000 - $145.30 = $4,854.70

# $10,000 invoice:
# Fee = ($10,000 × 0.029) + $0.30 = $290.30
# Net = $10,000 - $290.30 = $9,709.70
```

#### Cost Optimization Strategies

**Negotiate Volume Pricing**
```bash
# Once processing $10,000+/month, contact Stripe for custom pricing
# Typical discounts:
# - $10k-50k/month: 2.7% + $0.30
# - $50k-100k/month: 2.5% + $0.30
# - $100k+/month: 2.2-2.4% + $0.30

# Contact: https://support.stripe.com/
# Savings example:
# $50,000/month at 2.9%: $1,450 fees
# $50,000/month at 2.5%: $1,250 fees
# Savings: $200/month = $2,400/year
```

**Pass Fees to Customers (If Appropriate)**
```typescript
// Option 1: Add service fee to invoice
const baseAmount = 10000; // $100.00
const stripeFee = Math.round(baseAmount * 0.029) + 30; // $320 = $3.20
const totalAmount = baseAmount + stripeFee; // $10320 = $103.20

// Option 2: Calculate amount to charge to receive exact amount
function calculateStripeAmount(desiredAmount: number): number {
  // Formula: (desiredAmount + 30) / (1 - 0.029)
  return Math.round((desiredAmount + 30) / 0.971);
}

// To receive exactly $100.00:
const chargeAmount = calculateStripeAmount(10000); // $10330 = $103.30
// After Stripe fee: $10330 - ($10330 × 0.029 + 30) = $10000
```

**Minimize Failed Transactions**
```typescript
// Failed transactions still count toward volume (no fee, but affects pricing tier)

// 1. Use Stripe Radar for fraud detection (included free)
const paymentIntent = await stripe.paymentIntents.create({
  amount: 10000,
  currency: 'usd',
  metadata: {
    lead_id: 'lead_123',
  },
  // Radar automatically screens transactions
});

// 2. Request card authentication for large amounts
const paymentIntent = await stripe.paymentIntents.create({
  amount: 100000, // $1,000
  currency: 'usd',
  payment_method: paymentMethodId,
  confirmation_method: 'manual',
  capture_method: 'manual', // Authorize first, capture later
});

// 3. Validate payment method before charging
const paymentMethod = await stripe.paymentMethods.retrieve(paymentMethodId);
if (paymentMethod.card.checks.cvc_check !== 'pass') {
  throw new Error('Invalid CVC');
}
```

**Use ACH for Large Invoices**
```typescript
// ACH Direct Debit: 0.8% capped at $5
// Much cheaper for large invoices

// Example: $10,000 invoice
// Credit Card: $290.30 fee (2.9% + $0.30)
// ACH: $5.00 fee (0.8% capped at $5)
// Savings: $285.30 per transaction

// Enable ACH in Stripe Dashboard:
// https://dashboard.stripe.com/settings/payment_methods

const paymentIntent = await stripe.paymentIntents.create({
  amount: 1000000, // $10,000
  currency: 'usd',
  payment_method_types: ['card', 'us_bank_account'], // Offer both
});

// Note: ACH takes 5-7 business days to clear
```

**Optimize Refunds**
```typescript
// Full refunds: Stripe returns the fee
// Partial refunds: Fee is not returned

// Bad practice:
await stripe.refunds.create({
  payment_intent: 'pi_123',
  amount: 5000, // Partial refund: Fee NOT returned
});

// Good practice (if possible):
// Issue full refund, then create new payment intent for correct amount
await stripe.refunds.create({
  payment_intent: 'pi_123', // Full refund: Fee IS returned
});

const newPaymentIntent = await stripe.paymentIntents.create({
  amount: 5000, // Correct amount
  currency: 'usd',
  customer: customerId,
  payment_method: paymentMethodId,
  off_session: true,
  confirm: true,
});
```

#### Cost Monitoring
```typescript
// Track Stripe fees in your dashboard
async function getStripeFees(startDate: Date, endDate: Date) {
  const charges = await stripe.charges.list({
    created: {
      gte: Math.floor(startDate.getTime() / 1000),
      lte: Math.floor(endDate.getTime() / 1000),
    },
    limit: 100,
  });

  const totalFees = charges.data.reduce((sum, charge) => {
    return sum + (charge.amount - charge.amount_refunded - charge.amount - charge.application_fee_amount);
  }, 0);

  return totalFees / 100; // Convert cents to dollars
}

// Usage
const fees = await getStripeFees(
  new Date('2024-01-01'),
  new Date('2024-01-31')
);
console.log(`Stripe fees for January: $${fees.toFixed(2)}`);
```

**Estimated Monthly Cost:**
- Based on transaction volume:
  - $10,000 processed: ~$300 fees
  - $50,000 processed: ~$1,450 fees
  - $100,000 processed: ~$2,900 fees

---

### 4. VPS (Virtual Private Server)

#### Pricing Comparison

**Budget VPS Providers:**
| Provider | RAM | Storage | Bandwidth | Price | Notes |
|----------|-----|---------|-----------|-------|-------|
| **Hetzner** | 2GB | 40GB SSD | 20TB | €4.51 (~$5) | Best value, EU/US locations |
| **DigitalOcean** | 1GB | 25GB SSD | 1TB | $6 | Easy to use, great docs |
| **Vultr** | 1GB | 25GB SSD | 1TB | $6 | Similar to DigitalOcean |
| **Linode** | 1GB | 25GB SSD | 1TB | $5 | Akamai-owned, reliable |
| **OVH** | 2GB | 40GB SSD | Unlimited | €6 (~$6.50) | Good value, EU-focused |

**Production VPS (Recommended):**
| Provider | RAM | Storage | Bandwidth | Price | Notes |
|----------|-----|---------|-----------|-------|-------|
| **Hetzner** | 4GB | 80GB SSD | 20TB | €9.51 (~$10) | Best value |
| **DigitalOcean** | 4GB | 80GB SSD | 4TB | $24 | More expensive but easier |
| **Vultr** | 4GB | 80GB SSD | 3TB | $18 | Mid-range |

#### Cost Optimization Strategies

**Right-Size Your VPS**
```bash
# Monitor actual resource usage
# If usage is consistently < 50%, downgrade

# Check memory usage
free -h
# Output:
#               total        used        free      shared  buff/cache   available
# Mem:           3.9G        1.2G        2.1G         50M        600M        2.5G

# If "used" < 50% of "total", you can downgrade

# Check disk usage
df -h
# Output:
# Filesystem      Size  Used Avail Use% Mounted on
# /dev/sda1        80G   25G   55G  31% /

# If "Use%" < 50%, you can downgrade storage

# Check CPU usage (over 24 hours)
sar -u 1 86400 | tail -1
# If average CPU < 30%, you can downgrade CPU
```

**Use Hetzner for Best Value**
```bash
# Hetzner Cloud offers best price/performance
# Example: 4GB RAM, 80GB SSD, 20TB bandwidth = €9.51/month

# vs DigitalOcean: 4GB RAM, 80GB SSD, 4TB bandwidth = $24/month
# Savings: ~$14/month = $168/year

# Sign up: https://www.hetzner.com/cloud
# US location: Ashburn, VA (low latency to East Coast)
# EU location: Germany (GDPR compliant)
```

**Optimize Docker Resources**
```yaml
# docker-compose.yml - Set resource limits
services:
  mariadb:
    mem_limit: 512m # Limit to 512MB (default: unlimited)
    cpus: 0.5 # Limit to 50% of one CPU core

  invoiceninja:
    mem_limit: 256m
    cpus: 0.3

  n8n:
    mem_limit: 256m
    cpus: 0.3

  caddy:
    mem_limit: 128m
    cpus: 0.2

  uptime-kuma:
    mem_limit: 128m
    cpus: 0.2

# Benefits:
# - Prevents any service from hogging resources
# - Allows running on smaller VPS
# - Improves stability
```

**Use Local Storage Instead of Block Storage**
```bash
# Block storage costs extra ($0.10/GB/month)
# Local SSD is included in VPS price

# Bad: Using block storage for backups
# DigitalOcean Block Storage: 100GB = $10/month

# Good: Using S3 for backups
# AWS S3 Standard-IA: 100GB = $1.25/month
# Savings: $8.75/month = $105/year
```

**Snapshot Strategy**
```bash
# VPS snapshots cost extra ($0.05/GB/month)
# Only take snapshots before major changes

# Bad: Weekly automatic snapshots
# 4 snapshots × 40GB × $0.05 = $8/month

# Good: Manual snapshots only when needed
# Automated backups to S3 instead

# Take snapshot before major upgrade
doctl compute snapshot create VPS_ID --snapshot-name "before-upgrade-2024-01"

# Delete after confirming upgrade success
doctl compute snapshot delete SNAPSHOT_ID
```

**Bandwidth Optimization**
```bash
# Most providers include generous bandwidth (1-20TB/month)
# Optimize to stay within limits

# Monitor bandwidth usage
vnstat -m
# Output:
#      month        rx      |     tx      |    total
# ------------------------+-------------+-------------
#   2024-01     50.00 GiB |   30.00 GiB |   80.00 GiB

# If approaching limit:
# 1. Enable compression in Caddy (already enabled)
# 2. Use external CDN for static assets
# 3. Implement bandwidth throttling

# Caddy bandwidth throttling (if needed)
caddy_config="
*.cdhomeimprovementsrockford.com {
    rate_limit {
        zone home {
            key {remote_host}
            rate 10r/s # 10 requests per second per IP
        }
    }
}
"
```

#### Cost Monitoring
```bash
# Create cost monitoring script
cat > /opt/cdhi-stack/scripts/cost-monitor.sh << 'EOF'
#!/bin/bash

echo "📊 VPS Cost Analysis"
echo "===================="

# Check resource usage
echo ""
echo "💾 Memory Usage:"
free -h | grep Mem | awk '{print "Used: "$3" / "$2" ("$3/$2*100"%)"}'

echo ""
echo "💿 Disk Usage:"
df -h / | tail -1 | awk '{print "Used: "$3" / "$2" ("$5")"}'

echo ""
echo "📡 Bandwidth Usage (This Month):"
vnstat --oneline | awk -F\; '{print "RX: "$4" | TX: "$5" | Total: "$6}'

echo ""
echo "🐳 Docker Container Resources:"
docker stats --no-stream --format "table {{.Name}}\t{{.CPUPerc}}\t{{.MemUsage}}"

echo ""
echo "💰 Estimated Monthly Cost:"
echo "Current VPS: $20/month (4GB RAM, 80GB SSD)"
echo ""

# Calculate if downsizing is possible
MEM_USED=$(free | grep Mem | awk '{print $3/$2 * 100}')
if (( $(echo "$MEM_USED < 40" | bc -l) )); then
    echo "💡 Optimization: Memory usage < 40%. Consider downgrading to 2GB VPS."
    echo "   Potential savings: ~$10/month = $120/year"
fi

DISK_USED=$(df / | tail -1 | awk '{print $5}' | sed 's/%//')
if [ $DISK_USED -lt 40 ]; then
    echo "💡 Optimization: Disk usage < 40%. Consider downgrading storage."
    echo "   Potential savings: ~$5/month = $60/year"
fi

EOF

chmod +x /opt/cdhi-stack/scripts/cost-monitor.sh

# Run monthly
echo "0 0 1 * * /opt/cdhi-stack/scripts/cost-monitor.sh | mail -s 'VPS Cost Report' admin@cdhomeimprovementsrockford.com" >> /etc/crontab
```

**Estimated Monthly Cost:**
- MVP: $5-12 (Hetzner 2GB or DigitalOcean 1GB)
- Production: $10-24 (Hetzner 4GB or DigitalOcean 4GB)
- Growth: $40-80 (8GB RAM, 160GB SSD)

---

### 5. Email Service

#### Pricing Comparison

**Email Service Providers:**
| Provider | Free Tier | Paid Plans | Best For |
|----------|-----------|------------|----------|
| **Postmark** | 100 emails/month | $10/month (10,000 emails) | Transactional emails, deliverability |
| **SendGrid** | 100 emails/day | $15/month (50,000 emails) | High volume, marketing emails |
| **Mailgun** | 1,000 emails/month | $35/month (50,000 emails) | Developers, API-first |
| **Amazon SES** | 62,000 emails/month (if using EC2) | $0.10/1,000 emails | High volume, low cost |
| **Mailtrap** | Unlimited (dev only) | $10/month (1,000 real emails) | Development testing |

#### Cost Optimization Strategies

**Start with Free Tier**
```typescript
// Postmark free tier: 100 emails/month
// Sufficient for:
// - Lead confirmation emails (2-5/day)
// - Invoice emails (1-3/day)
// - System alerts (1-2/day)
// - Total: ~150 emails/month

// If exceeding free tier, upgrade to $10/month (10,000 emails)
```

**Batch Notification Emails**
```typescript
// Bad: Send email for every lead immediately
async function handleNewLead(lead: Lead) {
  await sendEmail({
    to: 'admin@cdhi.com',
    subject: 'New Lead',
    body: `New lead from ${lead.client.email}`,
  });
  // 50 leads/day = 1,500 emails/month
}

// Good: Send daily digest
async function sendDailyLeadDigest() {
  const leads = await getLeadsFromToday();
  if (leads.length === 0) return;

  await sendEmail({
    to: 'admin@cdhi.com',
    subject: `Daily Lead Digest (${leads.length} new leads)`,
    body: generateDigestHTML(leads),
  });
  // 1 email/day = 30 emails/month (95% reduction!)
}

// Schedule daily at 6 PM
cron.schedule('0 18 * * *', sendDailyLeadDigest);
```

**Use SMS for Critical Alerts Only**
```typescript
// Email is free (after base cost), SMS is not
// Use email for most notifications, SMS for critical alerts only

// Email: New lead submitted ✉️
// SMS: High-value lead ($10k+ project) 📱
// Email: Invoice sent ✉️
// SMS: Payment received 📱
// Email: Weekly performance report ✉️
// SMS: System down 📱

async function notifyNewLead(lead: Lead) {
  // Always send email
  await sendEmail({
    to: 'admin@cdhi.com',
    subject: 'New Lead',
    body: generateLeadEmailHTML(lead),
  });

  // Only send SMS if high-value
  if (lead.estimated_value >= 10000) {
    await sendSMS({
      to: process.env.SMS_ADMIN_NUMBER,
      body: `🔥 High-value lead: ${lead.client.first_name} ${lead.client.last_name} - $${lead.estimated_value}`,
    });
  }
}
```

**Optimize Email Templates**
```typescript
// Smaller emails = lower bandwidth costs (matters for AWS SES)

// Bad: Large HTML email with inline images
const emailHTML = `
  <html>
    <body>
      <img src="data:image/png;base64,iVBORw0KGgoAAAANS...50KB..." />
      <!-- 50KB+ email -->
    </body>
  </html>
`;

// Good: Simple HTML with hosted images
const emailHTML = `
  <html>
    <body>
      <img src="https://cdhomeimprovementsrockford.com/logo.png" width="200" />
      <!-- 2KB email -->
    </body>
  </html>
`;

// Additional optimization:
// - Use plain text when possible (1KB vs 10KB HTML)
// - Remove unnecessary styling
// - Avoid embedded images
```

**Self-Host for High Volume**
```bash
# If sending > 100,000 emails/month, consider self-hosting
# Postmark: $300/month for 100,000 emails
# Self-hosted (Postal): $20/month VPS + $0

# Setup Postal (self-hosted email server)
# https://docs.postalserver.io/

# Considerations:
# - Requires DevOps expertise
# - Need to maintain IP reputation
# - Must handle deliverability issues
# - Recommended only if sending > 200,000 emails/month
```

#### Cost Monitoring
```typescript
// Track email usage
let emailCountThisMonth = 0;

async function sendEmail(params: EmailParams) {
  // Send email via Postmark
  await postmark.sendEmail(params);

  // Increment counter
  emailCountThisMonth++;

  // Log to database for reporting
  await supabase.from('email_log').insert({
    recipient: params.to,
    subject: params.subject,
    sent_at: new Date(),
  });

  // Alert if approaching limit
  if (emailCountThisMonth >= 90) {
    await sendAlert({
      to: 'tech@cdhi.com',
      subject: 'Email Usage Alert',
      body: `Sent ${emailCountThisMonth} emails this month (limit: 100)`,
    });
  }
}

// Monthly report
cron.schedule('0 0 1 * *', async () => {
  const count = await supabase
    .from('email_log')
    .select('count')
    .gte('sent_at', startOfMonth())
    .single();

  console.log(`Emails sent last month: ${count}`);
  emailCountThisMonth = 0; // Reset counter
});
```

**Estimated Monthly Cost:**
- MVP: $0 (free tier)
- Production: $10 (10,000 emails/month)
- Growth: $10-50 (10,000-100,000 emails/month)

---

### 6. SMS Service (Twilio)

#### Pricing
- **SMS (US)**: $0.0079 per message sent/received
- **Phone number**: $1.15/month

**Example Calculations:**
```bash
# 100 SMS/month:
# (100 × $0.0079) + $1.15 = $1.94/month

# 500 SMS/month:
# (500 × $0.0079) + $1.15 = $5.10/month

# 1,000 SMS/month:
# (1,000 × $0.0079) + $1.15 = $9.05/month
```

#### Cost Optimization Strategies

**Disable SMS by Default**
```bash
# .env
ENABLE_SMS_NOTIFICATIONS=false

# Only enable for critical alerts
```

**Use SMS Sparingly**
```typescript
// Only send SMS for:
// 1. High-value leads ($10k+)
// 2. Payments received
// 3. System emergencies

// Configure SMS triggers
const SMS_TRIGGERS = {
  highValueLead: 10000, // $10k+
  paymentReceived: true,
  systemDown: true,
};

async function handleNewLead(lead: Lead) {
  if (lead.estimated_value >= SMS_TRIGGERS.highValueLead) {
    await sendSMS({
      to: process.env.SMS_ADMIN_NUMBER,
      body: `High-value lead: $${lead.estimated_value}`,
    });
  }
  // Always send email (free after base cost)
  await sendEmail({ /* ... */ });
}
```

**Shorten SMS Messages**
```typescript
// SMS is charged per segment (160 characters)
// Keep messages under 160 characters to avoid double charges

// Bad: 175 characters = 2 SMS = $0.0158
const message = `New lead from John Doe (john@example.com) for Kitchen Remodeling. Estimated value: $15,000. Contact ASAP for quote. Lead ID: lead_abc123. View: https://cdhomeimprovementsrockford.com/admin/leads/lead_abc123`;

// Good: 159 characters = 1 SMS = $0.0079
const message = `🔥 High-value lead: John Doe - Kitchen Remodel - $15k - https://cdhi.com/l/abc123`;

// Savings: 50% per message
```

**Use Email-to-SMS for Non-Critical**
```typescript
// For non-critical notifications, use email instead
// Most carriers support email-to-SMS:
// Verizon: 1234567890@vtext.com
// AT&T: 1234567890@txt.att.net
// T-Mobile: 1234567890@tmomail.net

// Free (uses email quota), but less reliable
async function sendEmailSMS(phone: string, carrier: string, message: string) {
  const emailAddress = `${phone}@${carrier}`;
  await sendEmail({
    to: emailAddress,
    subject: '', // Email-to-SMS ignores subject
    body: message,
  });
}
```

**Verify Phone Numbers**
```typescript
// Don't send SMS to invalid numbers (wastes money)

import parsePhoneNumber from 'libphonenumber-js';

async function sendSMS(to: string, body: string) {
  // Validate phone number
  const phoneNumber = parsePhoneNumber(to, 'US');
  if (!phoneNumber || !phoneNumber.isValid()) {
    console.error(`Invalid phone number: ${to}`);
    return;
  }

  // Send SMS
  await twilio.messages.create({
    to: phoneNumber.number,
    from: process.env.TWILIO_PHONE_NUMBER,
    body,
  });
}
```

#### Cost Monitoring
```typescript
// Track SMS usage
let smsCountThisMonth = 0;
let smsCostThisMonth = 0;

async function sendSMS(params: SMSParams) {
  // Send SMS
  await twilio.messages.create(params);

  // Track usage
  smsCountThisMonth++;
  smsCostThisMonth += 0.0079;

  // Log to database
  await supabase.from('sms_log').insert({
    recipient: params.to,
    message: params.body,
    cost: 0.0079,
    sent_at: new Date(),
  });

  // Alert if cost exceeds budget
  if (smsCostThisMonth >= 10) {
    await sendAlert({
      to: 'tech@cdhi.com',
      subject: 'SMS Cost Alert',
      body: `SMS costs: $${smsCostThisMonth.toFixed(2)} this month`,
    });
  }
}

// Monthly report
cron.schedule('0 0 1 * *', async () => {
  console.log(`SMS sent last month: ${smsCountThisMonth}`);
  console.log(`SMS cost last month: $${smsCostThisMonth.toFixed(2)}`);
  smsCountThisMonth = 0;
  smsCostThisMonth = 0;
});
```

**Estimated Monthly Cost:**
- MVP: $0-2 (disabled or minimal usage)
- Production: $5-20 (selective critical alerts)
- Growth: $20-50 (moderate usage)

---

### 7. Error Tracking (Sentry)

#### Pricing Tiers
| Tier | Price | Events | Best For |
|------|-------|--------|----------|
| **Developer** | $0 | 5,000 errors/month | Development, side projects |
| **Team** | $26/month | 50,000 errors/month | Small teams, production |
| **Business** | $80/month | 150,000 errors/month | Growing businesses |

#### Cost Optimization Strategies

**Use Free Tier for Development**
```bash
# .env.development
NEXT_PUBLIC_SENTRY_DSN= # Empty = disabled

# .env.production
NEXT_PUBLIC_SENTRY_DSN=https://YOUR_KEY@sentry.io/YOUR_PROJECT
```

**Sample Error Events**
```typescript
// Don't send every error to Sentry
// Sentry charges per event, so filter noise

// sentry.client.config.ts
Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,

  // Sample rate: 10% of errors
  tracesSampleRate: 0.1,

  // Sample rate for session replays
  replaysSessionSampleRate: 0.1,
  replaysOnErrorSampleRate: 1.0, // Always capture on error

  // Ignore common errors
  ignoreErrors: [
    // Browser extensions
    'ResizeObserver loop limit exceeded',
    'Non-Error promise rejection captured',
    // Network errors (too common)
    'Network request failed',
    'Failed to fetch',
  ],

  // Ignore specific URLs
  denyUrls: [
    // Chrome extensions
    /extensions\//i,
    /^chrome:\/\//i,
    // Browser internal
    /^moz-extension:\/\//i,
  ],
});
```

**Deduplicate Errors**
```typescript
// Group similar errors together
Sentry.init({
  beforeSend(event, hint) {
    // Deduplicate by error message
    if (event.exception?.values?.[0]?.value) {
      const errorMessage = event.exception.values[0].value;

      // Group "Invalid email" errors together
      if (errorMessage.includes('Invalid email')) {
        event.fingerprint = ['invalid-email'];
      }

      // Group database connection errors
      if (errorMessage.includes('Connection timeout')) {
        event.fingerprint = ['db-connection-timeout'];
      }
    }

    return event;
  },
});

// Benefits:
// - Reduces event count (Sentry charges per unique event)
// - Easier to track issue frequency
// - Better signal-to-noise ratio
```

**Filter Sensitive Data**
```typescript
// Remove sensitive data before sending to Sentry
Sentry.init({
  beforeSend(event) {
    // Remove sensitive query parameters
    if (event.request?.url) {
      event.request.url = event.request.url.replace(/api_key=[^&]+/, 'api_key=REDACTED');
    }

    // Remove sensitive request data
    if (event.request?.data) {
      delete event.request.data.password;
      delete event.request.data.credit_card;
    }

    return event;
  },
});
```

**Set Up Alerts Efficiently**
```typescript
// Don't alert on every error (noise)
// Configure alerts in Sentry dashboard for:

// 1. Critical errors only
// Alert when: error.level = "fatal" OR error.level = "critical"

// 2. High frequency errors
// Alert when: error count > 100 in 1 hour

// 3. New errors
// Alert when: error is "new" (first time seen)

// This reduces alert fatigue and focuses on important issues
```

**Self-Host for High Volume**
```bash
# If error volume exceeds $80/month, consider self-hosting
# Sentry is open-source: https://github.com/getsentry/self-hosted

# Requirements:
# - 4GB RAM minimum
# - 20GB storage
# - Docker/Docker Compose

# Setup:
git clone https://github.com/getsentry/self-hosted.git
cd self-hosted
./install.sh

# Cost:
# $20-40/month VPS (can run alongside other services)
# vs $80+/month for Sentry Cloud
# Savings: $40-60/month = $480-720/year

# Tradeoffs:
# - Requires DevOps maintenance
# - No managed upgrades
# - Must handle data retention/cleanup
```

#### Cost Monitoring
```bash
# Monitor Sentry usage
# Dashboard: https://sentry.io/settings/YOUR_ORG/projects/cd-construction/stats/

# Check error quota usage
# If approaching 50,000 events/month:
# 1. Review error patterns
# 2. Increase filtering
# 3. Fix recurring errors
# 4. Consider upgrading tier (if needed)
```

**Estimated Monthly Cost:**
- MVP: $0 (free tier or disabled)
- Production: $26 (Team tier)
- Growth: $26-80 (Team or Business tier)

---

### 8. Backups (AWS S3)

#### Pricing Model
**AWS S3 Standard-IA (Infrequent Access):**
- Storage: $0.0125/GB/month
- PUT requests: $0.01 per 1,000
- GET requests: $0.001 per 1,000
- Data transfer out: $0.09/GB (first 10TB)

**Example Calculations:**
```bash
# 50GB backups:
# Storage: 50GB × $0.0125 = $0.625/month
# Uploads: 30 uploads/month × $0.00001 = $0.0003/month
# Downloads: 1 restore/year × $0.001 = negligible
# Total: ~$0.63/month

# 100GB backups:
# Storage: 100GB × $0.0125 = $1.25/month
# Total: ~$1.25/month

# 500GB backups:
# Storage: 500GB × $0.0125 = $6.25/month
# Total: ~$6.25/month
```

#### Cost Optimization Strategies

**Use S3 Standard-IA (Not Standard)**
```bash
# S3 Standard: $0.023/GB/month
# S3 Standard-IA: $0.0125/GB/month (46% cheaper)
# S3 Glacier: $0.004/GB/month (83% cheaper, but slow retrieval)

# Recommendation:
# - Daily/weekly backups: Standard-IA (fast retrieval)
# - Monthly/yearly backups: Glacier (cheaper, slower retrieval)

# Upload with storage class
aws s3 cp backup.tar.gz s3://cdhi-backups/ \
  --storage-class STANDARD_IA
```

**Implement Lifecycle Policies**
```bash
# Automatically transition old backups to cheaper storage

# Create lifecycle policy
cat > lifecycle-policy.json << 'EOF'
{
  "Rules": [
    {
      "Id": "TransitionOldBackups",
      "Status": "Enabled",
      "Transitions": [
        {
          "Days": 30,
          "StorageClass": "GLACIER"
        }
      ],
      "Expiration": {
        "Days": 90
      }
    }
  ]
}
EOF

# Apply to bucket
aws s3api put-bucket-lifecycle-configuration \
  --bucket cdhi-backups \
  --lifecycle-configuration file://lifecycle-policy.json

# Benefits:
# - Backups < 30 days old: S3 Standard-IA ($0.0125/GB)
# - Backups 30-90 days old: Glacier ($0.004/GB)
# - Backups > 90 days old: Deleted (save 100%)
```

**Compress Backups**
```bash
# Compress backups before upload (70-90% size reduction)

# Without compression: 500MB
tar -czf database_2024-01-01.tar.gz /backup/database_2024-01-01.sql

# With compression: 50-150MB (70-90% smaller)
gzip -9 database_2024-01-01.sql # Maximum compression

# Upload compressed
aws s3 cp database_2024-01-01.sql.gz s3://cdhi-backups/ \
  --storage-class STANDARD_IA

# Savings:
# 500MB/month × $0.0125 = $6.25/month
# 100MB/month × $0.0125 = $1.25/month
# Savings: $5/month = $60/year
```

**Incremental Backups**
```bash
# Only backup changed data (not full backup every time)

# Full backup: 10GB (weekly)
# Incremental backup: 100MB (daily)

# Without incremental:
# 7 full backups/week × 10GB = 70GB storage
# Cost: 70GB × $0.0125 = $0.875/month

# With incremental:
# 1 full backup/week × 10GB = 10GB
# 6 incremental backups × 100MB = 0.6GB
# Total: 10.6GB storage
# Cost: 10.6GB × $0.0125 = $0.13/month
# Savings: $0.74/month = $8.88/year

# Implement incremental backups (MariaDB)
mysqldump --single-transaction \
  --flush-logs \
  --master-data=2 \
  --incremental \
  --all-databases > incremental_backup.sql
```

**Deduplicate Backups**
```bash
# Use restic or duplicacy for deduplication

# Install restic
wget https://github.com/restic/restic/releases/download/v0.16.0/restic_0.16.0_linux_amd64.bz2
bunzip2 restic_0.16.0_linux_amd64.bz2
mv restic_0.16.0_linux_amd64 /usr/local/bin/restic
chmod +x /usr/local/bin/restic

# Initialize repository
restic -r s3:s3.amazonaws.com/cdhi-backups init

# Backup with deduplication
restic -r s3:s3.amazonaws.com/cdhi-backups backup /backup

# Benefits:
# - Only stores unique data chunks
# - Typical deduplication ratio: 3:1 to 10:1
# - Automatically compresses
```

**Delete Old Backups Automatically**
```bash
# Keep only:
# - Daily backups: 7 days
# - Weekly backups: 4 weeks
# - Monthly backups: 12 months

# Cleanup script
cat > /opt/cdhi-stack/scripts/cleanup-old-backups.sh << 'EOF'
#!/bin/bash

# Delete daily backups older than 7 days
aws s3 ls s3://cdhi-backups/daily/ | while read -r line; do
    createDate=$(echo $line | awk '{print $1" "$2}')
    createDate=$(date -d "$createDate" +%s)
    olderThan=$(date --date="7 days ago" +%s)
    if [[ $createDate -lt $olderThan ]]; then
        fileName=$(echo $line | awk '{print $4}')
        aws s3 rm s3://cdhi-backups/daily/$fileName
    fi
done

# Delete weekly backups older than 4 weeks
aws s3 ls s3://cdhi-backups/weekly/ | while read -r line; do
    createDate=$(echo $line | awk '{print $1" "$2}')
    createDate=$(date -d "$createDate" +%s)
    olderThan=$(date --date="4 weeks ago" +%s)
    if [[ $createDate -lt $olderThan ]]; then
        fileName=$(echo $line | awk '{print $4}')
        aws s3 rm s3://cdhi-backups/weekly/$fileName
    fi
done

# Delete monthly backups older than 12 months
aws s3 ls s3://cdhi-backups/monthly/ | while read -r line; do
    createDate=$(echo $line | awk '{print $1" "$2}')
    createDate=$(date -d "$createDate" +%s)
    olderThan=$(date --date="12 months ago" +%s)
    if [[ $createDate -lt $olderThan ]]; then
        fileName=$(echo $line | awk '{print $4}')
        aws s3 rm s3://cdhi-backups/monthly/$fileName
    fi
done

echo "Backup cleanup completed"
EOF

chmod +x /opt/cdhi-stack/scripts/cleanup-old-backups.sh

# Run weekly
echo "0 0 * * 0 /opt/cdhi-stack/scripts/cleanup-old-backups.sh" >> /etc/crontab
```

#### Cost Monitoring
```bash
# Monitor S3 costs
aws s3api list-objects-v2 --bucket cdhi-backups \
  --query 'sum(Contents[].Size)' \
  --output text | awk '{print $1/1024/1024/1024" GB"}'

# Check storage class distribution
aws s3api list-objects-v2 --bucket cdhi-backups \
  --query 'Contents[].[StorageClass, Size]' \
  --output table

# Calculate monthly cost
TOTAL_SIZE_GB=$(aws s3api list-objects-v2 --bucket cdhi-backups \
  --query 'sum(Contents[].Size)' --output text | awk '{print $1/1024/1024/1024}')

COST=$(echo "$TOTAL_SIZE_GB * 0.0125" | bc)
echo "Estimated monthly cost: \$$COST"
```

**Estimated Monthly Cost:**
- MVP: $0-1 (minimal backups)
- Production: $1-5 (100GB backups)
- Growth: $5-20 (500GB+ backups)

---

## Cost Optimization Strategies

### 1. Monitor Usage Continuously

#### Create Unified Cost Dashboard

```bash
#!/bin/bash
# /opt/cdhi-stack/scripts/cost-dashboard.sh

echo "💰 CD Home Improvements - Cost Dashboard"
echo "========================================"
echo ""

# Vercel
echo "📦 Vercel (Next.js Hosting)"
echo "  Tier: Hobby (Free)"
echo "  Bandwidth: Check https://vercel.com/dashboard/usage"
echo "  Monthly Cost: $0 (or $20 for Pro)"
echo ""

# Supabase
echo "🗄️  Supabase (Database + Auth)"
DB_SIZE=$(psql $DATABASE_URL -t -c "SELECT pg_size_pretty(pg_database_size('postgres'));")
echo "  Database Size: $DB_SIZE"
echo "  Tier: Free (or $25 for Pro)"
echo "  Monthly Cost: $0 (or $25)"
echo ""

# Stripe
echo "💳 Stripe (Payments)"
# Get transactions from last month
TRANSACTIONS=$(psql $DATABASE_URL -t -c "SELECT COUNT(*) FROM payments WHERE created_at > NOW() - INTERVAL '30 days';")
AVG_AMOUNT=$(psql $DATABASE_URL -t -c "SELECT AVG(amount) FROM payments WHERE created_at > NOW() - INTERVAL '30 days';")
ESTIMATED_FEES=$(echo "$TRANSACTIONS * $AVG_AMOUNT * 0.029" | bc)
echo "  Transactions (30 days): $TRANSACTIONS"
echo "  Estimated Fees: \$$ESTIMATED_FEES"
echo ""

# VPS
echo "🖥️  VPS (Docker Stack)"
MEM_USAGE=$(free | grep Mem | awk '{print $3/$2 * 100}')
DISK_USAGE=$(df / | tail -1 | awk '{print $5}' | sed 's/%//')
echo "  Memory Usage: ${MEM_USAGE}%"
echo "  Disk Usage: ${DISK_USAGE}%"
echo "  Provider: Hetzner"
echo "  Monthly Cost: $20"
echo ""

# Email
echo "📧 Email (Postmark)"
EMAIL_COUNT=$(psql $DATABASE_URL -t -c "SELECT COUNT(*) FROM email_log WHERE sent_at > NOW() - INTERVAL '30 days';")
echo "  Emails Sent (30 days): $EMAIL_COUNT"
echo "  Tier: Free (or $10 for 10,000 emails)"
echo "  Monthly Cost: $0 (or $10)"
echo ""

# SMS
echo "📱 SMS (Twilio)"
SMS_COUNT=$(psql $DATABASE_URL -t -c "SELECT COUNT(*) FROM sms_log WHERE sent_at > NOW() - INTERVAL '30 days';")
SMS_COST=$(echo "$SMS_COUNT * 0.0079 + 1.15" | bc)
echo "  SMS Sent (30 days): $SMS_COUNT"
echo "  Estimated Cost: \$$SMS_COST"
echo ""

# Error Tracking
echo "🐛 Error Tracking (Sentry)"
echo "  Tier: Developer (Free) or Team ($26)"
echo "  Monthly Cost: $0 (or $26)"
echo ""

# Backups
echo "💾 Backups (AWS S3)"
S3_SIZE=$(aws s3api list-objects-v2 --bucket cdhi-backups \
  --query 'sum(Contents[].Size)' --output text | awk '{print $1/1024/1024/1024}')
S3_COST=$(echo "$S3_SIZE * 0.0125" | bc)
echo "  Backup Size: ${S3_SIZE}GB"
echo "  Estimated Cost: \$$S3_COST"
echo ""

# Total
echo "========================================"
echo "💰 TOTAL ESTIMATED MONTHLY COST"
echo "========================================"
echo "  Minimum (MVP): $5-15/month"
echo "  Current Production: $121-163/month"
echo "  High Growth: $925-1112/month"
echo ""

# Recommendations
echo "💡 Cost Optimization Recommendations:"
echo ""

# Check if can downgrade VPS
if (( $(echo "$MEM_USAGE < 40" | bc -l) )); then
    echo "  ⚠️  VPS memory usage < 40% - Consider downgrading"
    echo "     Potential savings: ~$10/month"
fi

# Check database size
if (( $(echo "$S3_SIZE < 50" | bc -l) )); then
    echo "  ✅ Backup size optimal (< 50GB)"
else
    echo "  ⚠️  Backup size > 50GB - Review retention policy"
    echo "     Potential savings: ~$5-10/month"
fi

# Check email usage
if [ $EMAIL_COUNT -lt 50 ]; then
    echo "  ✅ Email usage low - Free tier sufficient"
fi

echo ""
echo "📊 Full details at: /opt/cdhi-stack/logs/cost-report.txt"
```

Make executable and schedule monthly:
```bash
chmod +x /opt/cdhi-stack/scripts/cost-dashboard.sh

# Run on the 1st of every month
echo "0 9 1 * * /opt/cdhi-stack/scripts/cost-dashboard.sh | tee /opt/cdhi-stack/logs/cost-report-$(date +\%Y-\%m).txt" >> /etc/crontab
```

---

### 2. Set Budget Alerts

#### AWS Budgets
```bash
# Set up budget for AWS services (S3, etc.)
aws budgets create-budget \
  --account-id YOUR_ACCOUNT_ID \
  --budget '{
    "BudgetName": "CDHI-Monthly-Budget",
    "BudgetLimit": {
      "Amount": "20",
      "Unit": "USD"
    },
    "TimeUnit": "MONTHLY",
    "BudgetType": "COST"
  }' \
  --notifications-with-subscribers '[
    {
      "Notification": {
        "NotificationType": "ACTUAL",
        "ComparisonOperator": "GREATER_THAN",
        "Threshold": 80,
        "ThresholdType": "PERCENTAGE"
      },
      "Subscribers": [
        {
          "SubscriptionType": "EMAIL",
          "Address": "admin@cdhomeimprovementsrockford.com"
        }
      ]
    }
  ]'
```

#### Vercel Budget Alerts
```bash
# Set up in Vercel dashboard:
# https://vercel.com/dashboard/usage

# Enable alerts when:
# - Bandwidth exceeds 80% of limit
# - Build minutes exceed 80% of limit
```

#### Custom Budget Tracking
```typescript
// Track costs in database
await supabase.from('monthly_costs').insert({
  month: '2024-01',
  vercel_cost: 20,
  supabase_cost: 25,
  stripe_fees: 145,
  vps_cost: 20,
  email_cost: 10,
  sms_cost: 8,
  sentry_cost: 26,
  s3_cost: 5,
  total_cost: 259,
});

// Alert if exceeds budget
const MONTHLY_BUDGET = 300;
if (totalCost > MONTHLY_BUDGET) {
  await sendAlert({
    to: 'admin@cdhi.com',
    subject: '⚠️ Monthly Budget Exceeded',
    body: `Monthly costs: $${totalCost} (budget: $${MONTHLY_BUDGET})`,
  });
}
```

---

### 3. Annual Payment Discounts

Many services offer 15-20% discounts for annual payment:

| Service | Monthly | Annual | Savings |
|---------|---------|--------|---------|
| **Vercel Pro** | $20/month ($240/year) | $20 × 10 months ($200/year) | $40/year (17%) |
| **Supabase Pro** | $25/month ($300/year) | $25 × 10 months ($250/year) | $50/year (17%) |
| **Sentry Team** | $26/month ($312/year) | $26 × 10 months ($260/year) | $52/year (17%) |

**Total Annual Savings: $142/year**

---

### 4. Use Free Alternatives When Possible

| Paid Service | Free Alternative | Limitations |
|--------------|------------------|-------------|
| **Vercel Pro** ($20) | Self-host Next.js on VPS | Requires DevOps |
| **Postmark** ($10) | Mailtrap (dev) / Self-hosted Postal | Deliverability challenges |
| **Sentry Team** ($26) | Self-hosted Sentry | Requires maintenance |
| **AWS S3** ($5-20) | VPS local storage + rsync | No offsite redundancy |

**Total Potential Savings: $61/month = $732/year**

---

## ROI Calculations

### Cost vs Revenue

```bash
# Typical construction business metrics
AVERAGE_PROJECT_VALUE=$15,000
LEAD_TO_CLIENT_CONVERSION_RATE=20% # 1 in 5 leads becomes client
PROJECT_PROFIT_MARGIN=30% # 30% profit margin

# Monthly calculations
LEADS_PER_MONTH=50
CLIENTS_PER_MONTH=$((LEADS_PER_MONTH * 20 / 100)) # 10 clients
REVENUE_PER_MONTH=$((CLIENTS_PER_MONTH * AVERAGE_PROJECT_VALUE)) # $150,000
PROFIT_PER_MONTH=$((REVENUE_PER_MONTH * 30 / 100)) # $45,000

# System costs
SYSTEM_COST_PER_MONTH=200 # Full production setup

# ROI
ROI_PERCENTAGE=$(((PROFIT_PER_MONTH - SYSTEM_COST_PER_MONTH) * 100 / SYSTEM_COST_PER_MONTH))

echo "Monthly Revenue: $${REVENUE_PER_MONTH}"
echo "Monthly Profit: $${PROFIT_PER_MONTH}"
echo "System Cost: $${SYSTEM_COST_PER_MONTH}"
echo "ROI: ${ROI_PERCENTAGE}%"

# Output:
# Monthly Revenue: $150,000
# Monthly Profit: $45,000
# System Cost: $200
# ROI: 22,400%
```

### Break-Even Analysis

```bash
# How many projects needed to break even?

# MVP Setup: $15/month
PROJECTS_NEEDED_MVP=$(echo "scale=2; 15 / (15000 * 0.30)" | bc) # 0.003 projects
# Break even with 1 project

# Production Setup: $200/month
PROJECTS_NEEDED_PROD=$(echo "scale=2; 200 / (15000 * 0.30)" | bc) # 0.04 projects
# Break even with 1 project

# Conclusion: System pays for itself with just ONE project per month
```

---

## Cost Monitoring Scripts

### Comprehensive Cost Tracking

```typescript
// lib/cost-tracking.ts
import { supabase } from '@/lib/supabase';
import { Stripe } from 'stripe';
import AWS from 'aws-sdk';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
const s3 = new AWS.S3();

interface MonthlyCosts {
  month: string;
  vercel_cost: number;
  supabase_cost: number;
  stripe_fees: number;
  vps_cost: number;
  email_cost: number;
  sms_cost: number;
  sentry_cost: number;
  s3_cost: number;
  total_cost: number;
}

export async function calculateMonthlyCosts(month: string): Promise<MonthlyCosts> {
  // 1. Stripe fees
  const startDate = new Date(month + '-01');
  const endDate = new Date(startDate);
  endDate.setMonth(endDate.getMonth() + 1);

  const charges = await stripe.charges.list({
    created: {
      gte: Math.floor(startDate.getTime() / 1000),
      lt: Math.floor(endDate.getTime() / 1000),
    },
    limit: 100,
  });

  const stripeFees = charges.data.reduce((sum, charge) => {
    // Calculate fee: 2.9% + $0.30
    const fee = (charge.amount * 0.029) + 30;
    return sum + fee;
  }, 0) / 100; // Convert cents to dollars

  // 2. Email costs
  const { data: emailLogs } = await supabase
    .from('email_log')
    .select('count')
    .gte('sent_at', startDate.toISOString())
    .lt('sent_at', endDate.toISOString());

  const emailCount = emailLogs?.length || 0;
  const emailCost = emailCount > 100 ? 10 : 0; // $10 if exceeds free tier

  // 3. SMS costs
  const { data: smsLogs } = await supabase
    .from('sms_log')
    .select('count')
    .gte('sent_at', startDate.toISOString())
    .lt('sent_at', endDate.toISOString());

  const smsCount = smsLogs?.length || 0;
  const smsCost = (smsCount * 0.0079) + 1.15; // $0.0079 per SMS + $1.15 number fee

  // 4. S3 costs
  const bucketSize = await getS3BucketSize('cdhi-backups');
  const s3Cost = (bucketSize / 1024 / 1024 / 1024) * 0.0125; // $0.0125/GB for Standard-IA

  // 5. Fixed costs
  const vercelCost = 20; // Assuming Pro tier
  const supabaseCost = 25; // Assuming Pro tier
  const vpsCost = 20; // Assuming Hetzner 4GB
  const sentryCost = 26; // Assuming Team tier

  const totalCost = vercelCost + supabaseCost + stripeFees + vpsCost + emailCost + smsCost + sentryCost + s3Cost;

  return {
    month,
    vercel_cost: vercelCost,
    supabase_cost: supabaseCost,
    stripe_fees: stripeFees,
    vps_cost: vpsCost,
    email_cost: emailCost,
    sms_cost: smsCost,
    sentry_cost: sentryCost,
    s3_cost: s3Cost,
    total_cost: totalCost,
  };
}

async function getS3BucketSize(bucket: string): Promise<number> {
  const objects = await s3.listObjectsV2({ Bucket: bucket }).promise();
  return objects.Contents?.reduce((sum, obj) => sum + (obj.Size || 0), 0) || 0;
}

// Save to database
export async function saveMonthlyCosts(costs: MonthlyCosts) {
  const { error } = await supabase
    .from('monthly_costs')
    .insert(costs);

  if (error) {
    console.error('Failed to save monthly costs:', error);
  }
}

// Generate report
export async function generateCostReport(startMonth: string, endMonth: string) {
  const { data: costs } = await supabase
    .from('monthly_costs')
    .select('*')
    .gte('month', startMonth)
    .lte('month', endMonth)
    .order('month');

  if (!costs) return null;

  const totalCost = costs.reduce((sum, cost) => sum + cost.total_cost, 0);
  const avgCost = totalCost / costs.length;

  return {
    costs,
    totalCost,
    avgCost,
    breakdown: {
      vercel: costs.reduce((sum, c) => sum + c.vercel_cost, 0),
      supabase: costs.reduce((sum, c) => sum + c.supabase_cost, 0),
      stripe: costs.reduce((sum, c) => sum + c.stripe_fees, 0),
      vps: costs.reduce((sum, c) => sum + c.vps_cost, 0),
      email: costs.reduce((sum, c) => sum + c.email_cost, 0),
      sms: costs.reduce((sum, c) => sum + c.sms_cost, 0),
      sentry: costs.reduce((sum, c) => sum + c.sentry_cost, 0),
      s3: costs.reduce((sum, c) => sum + c.s3_cost, 0),
    },
  };
}
```

### Automated Monthly Cost Report

```typescript
// scripts/monthly-cost-report.ts
import { calculateMonthlyCosts, saveMonthlyCosts, generateCostReport } from '@/lib/cost-tracking';
import { sendEmail } from '@/lib/email';

async function runMonthlyCostReport() {
  // Calculate costs for last month
  const lastMonth = new Date();
  lastMonth.setMonth(lastMonth.getMonth() - 1);
  const monthString = lastMonth.toISOString().slice(0, 7); // YYYY-MM

  console.log(`Calculating costs for ${monthString}...`);

  const costs = await calculateMonthlyCosts(monthString);
  await saveMonthlyCosts(costs);

  // Generate report for last 12 months
  const startMonth = new Date();
  startMonth.setMonth(startMonth.getMonth() - 12);
  const startMonthString = startMonth.toISOString().slice(0, 7);

  const report = await generateCostReport(startMonthString, monthString);

  if (!report) {
    console.error('Failed to generate report');
    return;
  }

  // Send email report
  const emailHTML = `
    <h1>Monthly Cost Report - ${monthString}</h1>

    <h2>This Month</h2>
    <table border="1" cellpadding="10">
      <tr>
        <th>Service</th>
        <th>Cost</th>
      </tr>
      <tr><td>Vercel</td><td>$${costs.vercel_cost.toFixed(2)}</td></tr>
      <tr><td>Supabase</td><td>$${costs.supabase_cost.toFixed(2)}</td></tr>
      <tr><td>Stripe Fees</td><td>$${costs.stripe_fees.toFixed(2)}</td></tr>
      <tr><td>VPS</td><td>$${costs.vps_cost.toFixed(2)}</td></tr>
      <tr><td>Email</td><td>$${costs.email_cost.toFixed(2)}</td></tr>
      <tr><td>SMS</td><td>$${costs.sms_cost.toFixed(2)}</td></tr>
      <tr><td>Sentry</td><td>$${costs.sentry_cost.toFixed(2)}</td></tr>
      <tr><td>S3</td><td>$${costs.s3_cost.toFixed(2)}</td></tr>
      <tr><th>Total</th><th>$${costs.total_cost.toFixed(2)}</th></tr>
    </table>

    <h2>12-Month Summary</h2>
    <p>Total Cost: $${report.totalCost.toFixed(2)}</p>
    <p>Average Monthly Cost: $${report.avgCost.toFixed(2)}</p>

    <h3>Breakdown by Service</h3>
    <ul>
      <li>Vercel: $${report.breakdown.vercel.toFixed(2)}</li>
      <li>Supabase: $${report.breakdown.supabase.toFixed(2)}</li>
      <li>Stripe: $${report.breakdown.stripe.toFixed(2)}</li>
      <li>VPS: $${report.breakdown.vps.toFixed(2)}</li>
      <li>Email: $${report.breakdown.email.toFixed(2)}</li>
      <li>SMS: $${report.breakdown.sms.toFixed(2)}</li>
      <li>Sentry: $${report.breakdown.sentry.toFixed(2)}</li>
      <li>S3: $${report.breakdown.s3.toFixed(2)}</li>
    </ul>
  `;

  await sendEmail({
    to: 'admin@cdhomeimprovementsrockford.com',
    subject: `Monthly Cost Report - ${monthString}`,
    html: emailHTML,
  });

  console.log('Cost report sent successfully');
}

runMonthlyCostReport().catch(console.error);
```

Schedule with cron:
```bash
# Run on 1st of every month at 9 AM
0 9 1 * * cd /var/www/cd-construction && npx tsx scripts/monthly-cost-report.ts
```

---

## Summary

### Cost Optimization Checklist

**Immediate Actions (0-30 days):**
- [ ] Start with free tiers for all services
- [ ] Use Hetzner for VPS (best value)
- [ ] Enable compression and caching
- [ ] Set up cost monitoring dashboard
- [ ] Configure budget alerts

**Short-term (1-3 months):**
- [ ] Implement database size optimization
- [ ] Set up automated backup cleanup
- [ ] Negotiate Stripe volume pricing (if processing $10k+/month)
- [ ] Review and optimize email/SMS usage
- [ ] Consider annual payment discounts

**Long-term (3-12 months):**
- [ ] Evaluate self-hosting options for high-cost services
- [ ] Implement incremental backups
- [ ] Optimize storage with S3 lifecycle policies
- [ ] Review and right-size VPS
- [ ] Audit and eliminate unused resources

### Target Monthly Costs

| Phase | Target | Services |
|-------|--------|----------|
| **MVP** | $5-15 | Free tiers + minimal VPS |
| **Production** | $120-165 | Pro tiers + production VPS |
| **Growth** | $200-400 | Optimized for scale |
| **High-Growth** | $500-1000 | Enterprise features |

### Key Takeaways

1. **Start Small**: Use free tiers initially, upgrade only when necessary
2. **Monitor Continuously**: Set up dashboards and alerts to track costs
3. **Optimize Aggressively**: Compression, caching, and cleanup save significant costs
4. **Right-Size Resources**: Don't over-provision; scale based on actual usage
5. **Consider Self-Hosting**: For high-volume services, self-hosting can save 50-80%
6. **Leverage Discounts**: Annual payments, volume pricing, and startup credits
7. **ROI Matters Most**: Even at $1,000/month, system pays for itself with 1-2 projects

---

**Remember**: The system generates far more value than it costs. Focus on reliability and performance first, optimize costs second. A $200/month system that generates $150,000/month in revenue is an excellent investment.
