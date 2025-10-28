# CD Home Improvements - Troubleshooting Guide

**Common issues, diagnostic steps, and solutions**

---

## 📋 Table of Contents

- [Quick Reference](#quick-reference)
- [Next.js / Vercel Issues](#nextjs--vercel-issues)
- [Docker Stack Issues](#docker-stack-issues)
- [Database Issues](#database-issues)
- [Network & SSL Issues](#network--ssl-issues)
- [Payment & Webhook Issues](#payment--webhook-issues)
- [Performance Issues](#performance-issues)
- [Diagnostic Commands](#diagnostic-commands)

---

## 🚀 Quick Reference

### System Health Check

```bash
# Quick health check script
cat > /tmp/health-check.sh << 'EOF'
#!/bin/bash
echo "🏥 CD Home Improvements - System Health Check"
echo "=============================================="

# 1. Check Next.js (Vercel)
echo -n "Next.js Frontend: "
curl -s -o /dev/null -w "%{http_code}" https://cdhomeimprovementsrockford.com | grep -q "200" && echo "✅ OK" || echo "❌ DOWN"

# 2. Check Invoice Ninja
echo -n "Invoice Ninja: "
curl -s -o /dev/null -w "%{http_code}" https://portal.cdhomeimprovementsrockford.com | grep -q "200" && echo "✅ OK" || echo "❌ DOWN"

# 3. Check n8n
echo -n "n8n Automation: "
curl -s -o /dev/null -w "%{http_code}" https://automate.cdhomeimprovementsrockford.com | grep -q "200" && echo "✅ OK" || echo "❌ DOWN"

# 4. Check Uptime Kuma
echo -n "Uptime Kuma: "
curl -s -o /dev/null -w "%{http_code}" https://status.cdhomeimprovementsrockford.com | grep -q "200" && echo "✅ OK" || echo "❌ DOWN"

# 5. Check Docker containers
if command -v docker &> /dev/null; then
    echo ""
    echo "Docker Containers:"
    docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
fi

# 6. Check disk space
echo ""
echo "Disk Usage:"
df -h | grep -E "Filesystem|/$"

# 7. Check memory
echo ""
echo "Memory Usage:"
free -h | grep -E "Mem|Swap"

echo ""
echo "✅ Health check complete"
EOF

chmod +x /tmp/health-check.sh
/tmp/health-check.sh
```

### Common Quick Fixes

| Issue | Quick Fix | Command |
|-------|-----------|---------|
| Service down | Restart service | `docker-compose restart [service]` |
| SSL cert expired | Reload Caddy | `docker-compose restart caddy` |
| Slow website | Clear cache | `vercel --prod --force` |
| Database locked | Restart DB | `docker-compose restart mariadb` |
| Out of memory | Restart all | `docker-compose restart` |

---

## 🌐 Next.js / Vercel Issues

### Issue 1: Deployment Fails

**Symptoms:**
- GitHub Actions workflow fails
- Vercel build errors
- "Build failed" email from Vercel

**Diagnostic Steps:**

```bash
# 1. Check GitHub Actions logs
open https://github.com/YOUR_USERNAME/cd-construction/actions

# 2. Check Vercel deployment logs
vercel logs

# 3. Try local build
npm run build

# 4. Check for TypeScript errors
npm run type-check

# 5. Check for ESLint errors
npm run lint
```

**Common Causes & Solutions:**

**A. TypeScript Errors**

Error: `Type error: Property 'xyz' does not exist`

Solution:
```bash
# Regenerate database types
supabase gen types typescript --linked > types/database.types.ts

# Commit and push
git add types/database.types.ts
git commit -m "fix: update database types"
git push
```

**B. Missing Environment Variables**

Error: `Error: Missing environment variable NEXT_PUBLIC_SUPABASE_URL`

Solution:
```bash
# Check Vercel environment variables
vercel env ls

# Add missing variable
vercel env add NEXT_PUBLIC_SUPABASE_URL production
# Enter value when prompted

# Redeploy
vercel --prod
```

**C. Build Timeout**

Error: `Error: Command "npm run build" exited with 124`

Solution:
```bash
# Increase build timeout in vercel.json
cat > vercel.json << 'EOF'
{
  "buildCommand": "npm run build",
  "installCommand": "npm install",
  "framework": "nextjs",
  "maxDuration": 300
}
EOF

git add vercel.json
git commit -m "chore: increase build timeout"
git push
```

---

### Issue 2: 500 Internal Server Error

**Symptoms:**
- Website shows "500 Internal Server Error"
- Sentry shows errors
- API routes failing

**Diagnostic Steps:**

```bash
# 1. Check Vercel logs
vercel logs --follow

# 2. Check Sentry for recent errors
open https://sentry.io

# 3. Test API endpoints
curl -X POST https://cdhomeimprovementsrockford.com/api/leads \
  -H "Content-Type: application/json" \
  -d '{"test": true}'
```

**Common Causes & Solutions:**

**A. Supabase Connection Error**

Error in logs: `fetch failed` or `ECONNREFUSED`

Solution:
```bash
# Verify Supabase URL and keys
curl https://YOUR_PROJECT_ID.supabase.co

# Expected: Should return HTML page

# Check Supabase dashboard
open https://supabase.com/dashboard/project/YOUR_PROJECT_ID

# If Supabase is paused (free tier), click "Resume"

# Verify environment variables in Vercel
vercel env pull .env.local
cat .env.local | grep SUPABASE
```

**B. Stripe Configuration Error**

Error: `Stripe: No API key provided`

Solution:
```bash
# Verify Stripe keys in Vercel
vercel env ls | grep STRIPE

# Should show:
# NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
# STRIPE_SECRET_KEY
# STRIPE_WEBHOOK_SECRET

# Add if missing
vercel env add STRIPE_SECRET_KEY production
```

**C. Database Query Error**

Error: `column "xyz" does not exist`

Solution:
```bash
# Check if migrations are applied
supabase db push

# Or apply specific migration
psql "postgresql://..." < supabase/migrations/LATEST.sql

# Regenerate types
supabase gen types typescript --linked > types/database.types.ts
```

---

### Issue 3: Form Submission Not Working

**Symptoms:**
- Lead form shows error
- "Something went wrong" message
- No lead in database

**Diagnostic Steps:**

```bash
# 1. Test API endpoint directly
curl -X POST https://cdhomeimprovementsrockford.com/api/leads \
  -H "Content-Type: application/json" \
  -d '{
    "first_name": "Test",
    "last_name": "User",
    "email": "test@example.com",
    "street_address": "123 Test St",
    "city": "Rockford",
    "state": "IL",
    "zip_code": "61101",
    "service_type": "Other"
  }'

# 2. Check browser console
# Open DevTools → Console
# Look for error messages

# 3. Check network tab
# Open DevTools → Network
# Submit form and check request/response
```

**Common Causes & Solutions:**

**A. CORS Error**

Error in browser: `Access to fetch has been blocked by CORS policy`

Solution:
```typescript
// app/api/leads/route.ts
export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}
```

**B. Validation Error**

Error: `Invalid input: zip_code must be 5 digits`

Solution:
```typescript
// Check Zod schema in types/schemas.ts
zip_code: z.string().regex(/^\d{5}$/),  // Must be exactly 5 digits

// Update form to validate before submission
const validateZipCode = (value: string) => {
  return /^\d{5}$/.test(value);
};
```

**C. n8n Webhook Not Triggered**

Symptoms: Lead created in database but no email sent

Solution:
```bash
# Check n8n workflow status
open https://automate.cdhomeimprovementsrockford.com

# Click "Executions" → Should show recent executions
# If no executions, check webhook URL in code

# Verify webhook URL
grep -r "N8N_WEBHOOK" .env

# Should match:
# N8N_WEBHOOK_BASE_URL=https://automate.cdhomeimprovementsrockford.com

# Test webhook manually
curl -X POST https://automate.cdhomeimprovementsrockford.com/webhook/lead-intake \
  -H "Content-Type: application/json" \
  -d '{"client": {...}, "property": {...}, "lead": {...}}'
```

---

## 🐳 Docker Stack Issues

### Issue 4: Container Won't Start

**Symptoms:**
- `docker-compose ps` shows container as "Exited"
- Service unreachable
- Logs show errors

**Diagnostic Steps:**

```bash
ssh root@YOUR_VPS_IP
cd /opt/cdhi-stack/docker

# 1. Check container status
docker-compose ps

# 2. Check logs for the failed container
docker-compose logs [service-name]

# 3. Check Docker system resources
docker system df

# 4. Check system resources
df -h
free -h
```

**Common Causes & Solutions:**

**A. MariaDB Container Exited**

Error in logs: `[ERROR] InnoDB: Cannot allocate memory`

Solution:
```bash
# Check available memory
free -h

# If low memory, create swap file
sudo fallocate -l 4G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile

# Make permanent
echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab

# Restart container
docker-compose up -d mariadb

# Verify
docker-compose logs -f mariadb
```

**B. Invoice Ninja Can't Connect to Database**

Error: `SQLSTATE[HY000] [2002] Connection refused`

Solution:
```bash
# Check MariaDB is running
docker-compose ps mariadb

# Check MariaDB health
docker-compose exec mariadb mysqladmin ping -p"$DB_ROOT_PASSWORD"

# Expected: "mysqld is alive"

# Check network connectivity
docker-compose exec invoiceninja ping mariadb -c 3

# If connection fails, check docker-compose.yml
# Ensure invoiceninja depends_on mariadb with health check

# Restart in correct order
docker-compose stop invoiceninja invoiceninja-queue invoiceninja-scheduler
docker-compose up -d mariadb
sleep 30  # Wait for MariaDB to be healthy
docker-compose up -d invoiceninja invoiceninja-queue invoiceninja-scheduler
```

**C. Port Already in Use**

Error: `bind: address already in use`

Solution:
```bash
# Find process using port 80/443
sudo netstat -tulpn | grep :80
sudo netstat -tulpn | grep :443

# Kill process (if not Docker)
sudo kill -9 PID

# Or stop conflicting service
sudo systemctl stop apache2  # or nginx

# Restart Caddy
docker-compose up -d caddy
```

---

### Issue 5: SSL Certificate Errors

**Symptoms:**
- Browser shows "Your connection is not private"
- Certificate expired or invalid
- NET::ERR_CERT_AUTHORITY_INVALID

**Diagnostic Steps:**

```bash
# 1. Check certificate expiration
openssl s_client -connect cdhomeimprovementsrockford.com:443 -servername cdhomeimprovementsrockford.com < /dev/null | \
  openssl x509 -noout -dates

# 2. Check Caddy logs
docker-compose logs caddy | grep -i certificate

# 3. Test certificate from outside
curl -I https://cdhomeimprovementsrockford.com
```

**Common Causes & Solutions:**

**A. Certificate Not Yet Issued**

Logs show: `Waiting for certificate...`

Solution:
```bash
# Check if DNS is correct
dig cdhomeimprovementsrockford.com +short

# Expected: YOUR_VPS_IP

# Check if ports 80/443 are open
sudo ufw status | grep -E "80|443"

# Wait 5-10 minutes for Let's Encrypt to issue certificate

# Force certificate renewal
docker-compose restart caddy

# Check logs
docker-compose logs -f caddy
```

**B. Rate Limit Exceeded**

Error: `too many certificates already issued`

Solution:
```bash
# Let's Encrypt rate limits:
# - 50 certificates per registered domain per week
# - 5 duplicate certificates per week

# Wait 7 days, or:
# Use Let's Encrypt staging for testing
# Edit Caddyfile:
{
    email admin@cdhomeimprovementsrockford.com
    acme_ca https://acme-staging-v02.api.letsencrypt.org/directory
}

# Restart Caddy
docker-compose up -d caddy

# NOTE: Staging certificates won't be trusted by browsers
# Switch back to production after testing
```

**C. DNS Not Propagated**

Solution:
```bash
# Check DNS propagation globally
dig @8.8.8.8 cdhomeimprovementsrockford.com +short
dig @1.1.1.1 cdhomeimprovementsrockford.com +short

# Use online tool
open https://dnschecker.org/#A/cdhomeimprovementsrockford.com

# Wait 5-60 minutes for full propagation
```

---

## 💾 Database Issues

### Issue 6: Supabase Connection Timeout

**Symptoms:**
- API requests timeout
- `fetch failed` errors
- Slow query execution

**Diagnostic Steps:**

```bash
# 1. Test connection
psql "postgresql://postgres:PASSWORD@db.PROJECT_ID.supabase.co:5432/postgres" -c "SELECT 1"

# 2. Check Supabase dashboard
open https://supabase.com/dashboard/project/YOUR_PROJECT_ID/settings/database

# 3. Check connection pooler
# Settings → Database → Connection Pooling

# 4. Test from Vercel
curl https://YOUR_APP.vercel.app/api/test-db
```

**Solutions:**

**A. Use Connection Pooler**

Update connection string in Vercel:

```bash
# Instead of:
# postgresql://postgres:PASSWORD@db.PROJECT_ID.supabase.co:5432/postgres

# Use pooler:
# postgresql://postgres:PASSWORD@db.PROJECT_ID.supabase.co:6543/postgres?pgbouncer=true

# Update in Vercel
vercel env rm SUPABASE_CONNECTION_STRING production
vercel env add SUPABASE_CONNECTION_STRING production
# Paste pooler URL

# Redeploy
vercel --prod
```

**B. Increase Connection Limit**

In Supabase:
1. Dashboard → Settings → Database
2. Connection pooler settings
3. Increase "Pool size" (default: 15, max: 200)
4. Increase "Pool timeout" (default: 30s)

**C. Optimize Queries**

```sql
-- Create indexes for common queries
CREATE INDEX idx_leads_email ON leads(email);
CREATE INDEX idx_invoices_client_id ON invoices(client_id);
CREATE INDEX idx_payments_invoice_id ON payments(invoice_id);

-- Check slow queries
SELECT query, calls, total_exec_time, mean_exec_time
FROM pg_stat_statements
ORDER BY mean_exec_time DESC
LIMIT 10;
```

---

### Issue 7: MariaDB Slow or Unresponsive

**Symptoms:**
- Invoice Ninja pages load slowly
- Database queries timeout
- High CPU usage

**Diagnostic Steps:**

```bash
ssh root@YOUR_VPS_IP
cd /opt/cdhi-stack/docker

# 1. Check MariaDB logs
docker-compose logs mariadb | tail -100

# 2. Check process list
docker-compose exec mariadb mysql -u root -p"$DB_ROOT_PASSWORD" \
  -e "SHOW FULL PROCESSLIST;"

# 3. Check table sizes
docker-compose exec mariadb mysql -u root -p"$DB_ROOT_PASSWORD" \
  -e "SELECT table_name, ROUND(((data_length + index_length) / 1024 / 1024), 2) AS 'Size (MB)' FROM information_schema.TABLES WHERE table_schema = 'invoiceninja' ORDER BY (data_length + index_length) DESC;"

# 4. Check for locks
docker-compose exec mariadb mysql -u root -p"$DB_ROOT_PASSWORD" \
  -e "SHOW ENGINE INNODB STATUS\G" | grep -A 20 "TRANSACTIONS"
```

**Solutions:**

**A. Optimize Tables**

```bash
docker-compose exec mariadb mysql -u root -p"$DB_ROOT_PASSWORD" invoiceninja

-- Analyze tables
ANALYZE TABLE clients, invoices, quotes, products;

-- Optimize tables
OPTIMIZE TABLE clients, invoices, quotes, products;

-- Rebuild indexes
ALTER TABLE invoices ENGINE=InnoDB;
```

**B. Increase Memory Allocation**

Edit docker-compose.yml:

```yaml
mariadb:
  deploy:
    resources:
      limits:
        cpus: '2.0'  # Increase from 1.0
        memory: 1G   # Increase from 512M
```

Restart:
```bash
docker-compose up -d --force-recreate mariadb
```

**C. Enable Query Cache**

```bash
# Edit mariadb config
nano /opt/cdhi-stack/docker/mariadb-config/performance.cnf

# Add:
[mysqld]
query_cache_type = 1
query_cache_size = 64M
query_cache_limit = 2M

# Restart MariaDB
docker-compose restart mariadb
```

---

## 🌐 Network & SSL Issues

### Issue 8: Domain Not Resolving

**Symptoms:**
- `dig domain.com` returns NXDOMAIN
- Website unreachable
- DNS propagation taking too long

**Diagnostic Steps:**

```bash
# 1. Check local DNS
dig cdhomeimprovementsrockford.com

# 2. Check with Google DNS
dig @8.8.8.8 cdhomeimprovementsrockford.com

# 3. Check with Cloudflare DNS
dig @1.1.1.1 cdhomeimprovementsrockford.com

# 4. Check authoritative nameservers
dig cdhomeimprovementsrockford.com NS

# 5. Use online tool
open https://dnschecker.org/
```

**Solutions:**

**A. Update DNS Records**

Login to DNS provider and verify:

```
Type: A
Host: @
Value: YOUR_VPS_IP
TTL: 300

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

Type: CNAME
Host: www
Value: cname.vercel-dns.com
TTL: 300
```

**B. Clear DNS Cache**

```bash
# On macOS
sudo dscacheutil -flushcache
sudo killall -HUP mDNSResponder

# On Linux
sudo systemd-resolve --flush-caches

# On Windows
ipconfig /flushdns

# Wait 5-10 minutes and retest
```

**C. Check Nameservers**

```bash
# Verify nameservers are correct
whois cdhomeimprovementsrockford.com | grep "Name Server"

# Should match your DNS provider's nameservers
```

---

### Issue 9: Slow Page Load Times

**Symptoms:**
- Website takes > 3 seconds to load
- Lighthouse performance score < 50
- Users reporting slow experience

**Diagnostic Steps:**

```bash
# 1. Run Lighthouse audit
# Open Chrome DevTools → Lighthouse → Run audit

# 2. Check Time to First Byte (TTFB)
curl -w "@curl-format.txt" -o /dev/null -s https://cdhomeimprovementsrockford.com

# Create curl-format.txt:
cat > curl-format.txt << 'EOF'
time_namelookup: %{time_namelookup}\n
time_connect: %{time_connect}\n
time_appconnect: %{time_appconnect}\n
time_pretransfer: %{time_pretransfer}\n
time_redirect: %{time_redirect}\n
time_starttransfer: %{time_starttransfer}\n
time_total: %{time_total}\n
EOF

# 3. Check Vercel analytics
open https://vercel.com/YOUR_TEAM/cd-construction/analytics

# 4. Check VPS resources
ssh root@YOUR_VPS_IP
htop
```

**Solutions:**

**A. Enable Caching**

In Caddyfile:

```caddyfile
cdhomeimprovementsrockford.com {
    # Cache static assets
    @static {
        path *.js *.css *.png *.jpg *.jpeg *.gif *.ico *.woff *.woff2
    }

    header @static Cache-Control "public, max-age=31536000, immutable"

    # Compress responses
    encode gzip

    reverse_proxy nextjs:3000
}
```

**B. Optimize Images**

```typescript
// Use Next.js Image component
import Image from 'next/image';

<Image
  src="/logo.png"
  alt="CD Home Improvements"
  width={200}
  height={100}
  priority  // For above-fold images
  loading="lazy"  // For below-fold images
/>
```

**C. Enable ISR (Incremental Static Regeneration)**

```typescript
// app/page.tsx
export const revalidate = 3600; // Revalidate every hour

export default function HomePage() {
  // ...
}
```

---

## 💳 Payment & Webhook Issues

### Issue 10: Stripe Webhook Not Receiving Events

**Symptoms:**
- Payment successful in Stripe but not in database
- `webhook_event_dlq` table has entries
- Stripe dashboard shows failed webhooks

**Diagnostic Steps:**

```bash
# 1. Check Stripe webhook endpoint
open https://dashboard.stripe.com/webhooks

# Should show:
# URL: https://cdhomeimprovementsrockford.com/api/webhooks/stripe
# Status: Enabled
# Events: payment_intent.succeeded, payment_intent.payment_failed, charge.refunded

# 2. Check recent webhook attempts
# Stripe Dashboard → Webhooks → [Your endpoint] → Attempts

# 3. Test webhook endpoint
curl -X POST https://cdhomeimprovementsrockford.com/api/webhooks/stripe \
  -H "Content-Type: application/json" \
  -d '{"test": true}'

# Expected: 400 or 401 (invalid signature)

# 4. Check Sentry for errors
open https://sentry.io
```

**Solutions:**

**A. Webhook Secret Mismatch**

Error: `Webhook signature verification failed`

Solution:
```bash
# Get correct webhook secret from Stripe
# Dashboard → Webhooks → [Endpoint] → Signing secret

# Update in Vercel
vercel env rm STRIPE_WEBHOOK_SECRET production
vercel env add STRIPE_WEBHOOK_SECRET production
# Paste: whsec_...

# Redeploy
vercel --prod

# Test with Stripe CLI
stripe listen --forward-to https://cdhomeimprovementsrockford.com/api/webhooks/stripe
stripe trigger payment_intent.succeeded
```

**B. Webhook Endpoint Unreachable**

Stripe logs show: `URL not reachable`

Solution:
```bash
# Verify endpoint is accessible
curl -I https://cdhomeimprovementsrockford.com/api/webhooks/stripe

# Expected: HTTP/1.1 405 Method Not Allowed (POST only)

# If 404, verify route exists
ls -la app/api/webhooks/stripe/route.ts

# If 500, check Vercel logs
vercel logs --follow
```

**C. Replay Failed Webhooks**

```bash
# Check DLQ for failed events
curl https://cdhomeimprovementsrockford.com/api/admin/replay \
  -H "Authorization: Bearer YOUR_ADMIN_API_KEY"

# Replay specific event
curl -X POST https://cdhomeimprovementsrockford.com/api/admin/replay \
  -H "Authorization: Bearer YOUR_ADMIN_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"event_id": "EVENT_ID_FROM_DLQ"}'

# Or replay from Stripe dashboard
# Dashboard → Webhooks → [Endpoint] → Failed attempts → Resend
```

---

### Issue 11: Payment Processing Errors

**Symptoms:**
- Customer reports payment failed
- "Card declined" errors
- Payment not appearing in Stripe

**Diagnostic Steps:**

```bash
# 1. Check Stripe dashboard
open https://dashboard.stripe.com/payments

# 2. Search for payment
# Use customer email or payment amount

# 3. Check payment logs
# Dashboard → Logs → Filter by "payment_intent"

# 4. Check Sentry for errors
open https://sentry.io/issues/
```

**Common Causes & Solutions:**

**A. Card Declined**

Customer message: "Your card was declined"

Solution:
```
Common reasons:
1. Insufficient funds
2. Card expired
3. Incorrect CVC
4. Card blocked by bank
5. International card restrictions

Action:
1. Ask customer to contact their bank
2. Try different card
3. Use alternative payment method
```

**B. 3D Secure Authentication Failed**

Error: `Authentication required but not completed`

Solution:
```typescript
// Ensure proper 3D Secure handling in payment flow
// components/PaymentForm.tsx

const { error } = await stripe.confirmCardPayment(clientSecret, {
  payment_method: {
    card: cardElement,
    billing_details: {
      name: customerName,
      email: customerEmail,
    },
  },
});

if (error) {
  // Handle error
  if (error.type === 'card_error') {
    setError('Payment failed: ' + error.message);
  }
}
```

**C. Test Mode vs Live Mode**

Error: `No such payment_intent`

Solution:
```bash
# Verify you're using live mode keys in production

# Check environment variables
vercel env ls | grep STRIPE

# Should show:
# NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_...
# STRIPE_SECRET_KEY=sk_live_...

# NOT:
# pk_test_... or sk_test_...

# Update if needed
vercel env rm STRIPE_SECRET_KEY production
vercel env add STRIPE_SECRET_KEY production
# Enter: sk_live_...

vercel --prod
```

---

## 📈 Performance Issues

### Issue 12: High Memory Usage

**Symptoms:**
- `free -h` shows low available memory
- OOM (Out of Memory) killer activated
- Containers randomly restarting

**Diagnostic Steps:**

```bash
ssh root@YOUR_VPS_IP

# 1. Check memory usage
free -h

# 2. Check per-container memory
docker stats --no-stream

# 3. Check OOM killer logs
dmesg | grep -i "out of memory"

# 4. Check swap usage
swapon --show
```

**Solutions:**

**A. Create/Increase Swap**

```bash
# Create 4GB swap file
sudo fallocate -l 4G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile

# Make permanent
echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab

# Adjust swappiness (how aggressively to use swap)
sudo sysctl vm.swappiness=10
echo 'vm.swappiness=10' | sudo tee -a /etc/sysctl.conf

# Verify
free -h
```

**B. Reduce Container Memory**

Edit docker-compose.yml:

```yaml
services:
  invoiceninja:
    deploy:
      resources:
        limits:
          memory: 256M  # Reduce from 512M
        reservations:
          memory: 128M
```

**C. Clean Up Docker Resources**

```bash
# Remove unused containers, images, volumes
docker system prune -a --volumes

# Remove old logs
sudo truncate -s 0 /var/lib/docker/containers/*/*-json.log

# Restart Docker
sudo systemctl restart docker
```

---

### Issue 13: High Disk Usage

**Symptoms:**
- `df -h` shows > 85% disk usage
- "No space left on device" errors
- Docker failing to start

**Diagnostic Steps:**

```bash
ssh root@YOUR_VPS_IP

# 1. Check disk usage
df -h

# 2. Find large directories
du -h / | sort -rh | head -20

# 3. Check Docker disk usage
docker system df

# 4. Find large log files
find /var/log -type f -size +100M -exec ls -lh {} \;
```

**Solutions:**

**A. Clean Up Docker**

```bash
# Remove unused Docker resources
docker system prune -a --volumes

# Remove old images
docker images | grep "months ago" | awk '{print $3}' | xargs docker rmi

# Clean up logs
find /var/lib/docker/containers/ -name "*.log" -delete
```

**B. Clean Up System Logs**

```bash
# Clean journal logs (older than 7 days)
sudo journalctl --vacuum-time=7d

# Clean apt cache
sudo apt clean
sudo apt autoclean

# Remove old backups (older than 30 days)
find /backup/cdhi/ -mtime +30 -delete
```

**C. Configure Log Rotation**

```bash
# Configure Docker log rotation (already in docker-compose.yml)
# If not configured:

sudo nano /etc/docker/daemon.json

# Add:
{
  "log-driver": "json-file",
  "log-opts": {
    "max-size": "10m",
    "max-file": "3"
  }
}

sudo systemctl restart docker
```

---

## 🔧 Diagnostic Commands

### Essential Commands Cheat Sheet

```bash
# ============================================
# SYSTEM STATUS
# ============================================

# Disk usage
df -h

# Memory usage
free -h

# CPU usage
top
htop  # Better interface

# Process list
ps aux | grep docker

# ============================================
# DOCKER COMMANDS
# ============================================

# List running containers
docker ps

# List all containers (including stopped)
docker ps -a

# Container logs
docker logs [container-name]
docker logs -f [container-name]  # Follow
docker logs --tail=100 [container-name]  # Last 100 lines

# Container stats
docker stats --no-stream

# Execute command in container
docker exec -it [container-name] bash

# Container inspect
docker inspect [container-name]

# Docker Compose
docker-compose ps
docker-compose logs -f
docker-compose restart [service]
docker-compose up -d --force-recreate [service]

# ============================================
# NETWORK DIAGNOSTICS
# ============================================

# Test DNS
dig cdhomeimprovementsrockford.com
nslookup cdhomeimprovementsrockford.com

# Test connectivity
ping cdhomeimprovementsrockford.com
curl -I https://cdhomeimprovementsrockford.com

# Check open ports
sudo netstat -tulpn | grep LISTEN
sudo lsof -i :80
sudo lsof -i :443

# Traceroute
traceroute cdhomeimprovementsrockford.com

# ============================================
# DATABASE DIAGNOSTICS
# ============================================

# MariaDB
docker-compose exec mariadb mysql -u root -p"$DB_ROOT_PASSWORD"

# Show databases
SHOW DATABASES;

# Show tables
USE invoiceninja;
SHOW TABLES;

# Show processlist
SHOW FULL PROCESSLIST;

# Database size
SELECT table_schema AS "Database",
  ROUND(SUM(data_length + index_length) / 1024 / 1024, 2) AS "Size (MB)"
FROM information_schema.TABLES
GROUP BY table_schema;

# PostgreSQL (Supabase)
psql "postgresql://postgres:PASSWORD@db.PROJECT_ID.supabase.co:5432/postgres"

# List tables
\dt

# Describe table
\d clients

# Show connections
SELECT * FROM pg_stat_activity;

# ============================================
# SSL CERTIFICATE DIAGNOSTICS
# ============================================

# Check certificate expiration
openssl s_client -connect cdhomeimprovementsrockford.com:443 -servername cdhomeimprovementsrockford.com < /dev/null | \
  openssl x509 -noout -dates

# Check certificate chain
openssl s_client -connect cdhomeimprovementsrockford.com:443 -showcerts

# Test SSL configuration
curl -I https://cdhomeimprovementsrockford.com

# ============================================
# LOG ANALYSIS
# ============================================

# System logs
sudo journalctl -xe

# Docker logs
sudo journalctl -u docker

# Caddy logs
docker-compose logs caddy | grep -i error

# Search for errors
grep -r "ERROR" /var/log/

# Failed SSH attempts
sudo grep "Failed password" /var/log/auth.log

# ============================================
# VERCEL DIAGNOSTICS
# ============================================

# List deployments
vercel ls

# View logs
vercel logs

# Follow logs
vercel logs --follow

# Check environment variables
vercel env ls

# Pull environment variables
vercel env pull .env.local

# ============================================
# STRIPE DIAGNOSTICS
# ============================================

# Install Stripe CLI
brew install stripe/stripe-brew/stripe

# Login
stripe login

# Listen to webhooks
stripe listen --forward-to https://cdhomeimprovementsrockford.com/api/webhooks/stripe

# Trigger test event
stripe trigger payment_intent.succeeded

# View events
stripe events list

# ============================================
# SECURITY DIAGNOSTICS
# ============================================

# Fail2Ban status
sudo fail2ban-client status

# Check banned IPs
sudo fail2ban-client status sshd

# UFW status
sudo ufw status verbose

# Active connections
sudo netstat -an | grep ESTABLISHED

# Check for suspicious processes
ps aux | grep -E "(nc|ncat|netcat|/dev/tcp)"

# ============================================
# BACKUP VERIFICATION
# ============================================

# List recent backups
ls -lh /backup/cdhi/ | head -20

# Check backup integrity
gunzip -t /backup/cdhi/mariadb_LATEST.sql.gz

# Check backup size
du -sh /backup/cdhi/

# ============================================
# QUICK FIXES
# ============================================

# Restart all services
docker-compose restart

# Rebuild and restart single service
docker-compose up -d --force-recreate [service]

# Clear Docker cache
docker system prune -a

# Restart Docker daemon
sudo systemctl restart docker

# Flush DNS cache (local machine)
sudo dscacheutil -flushcache  # macOS
sudo systemd-resolve --flush-caches  # Linux

# Reload Caddy
docker-compose exec caddy caddy reload --config /etc/caddy/Caddyfile
```

---

## 📞 Getting Help

### When to Escalate

**Escalate immediately if:**
- ❌ Multiple services down (> 2)
- ❌ Data loss suspected
- ❌ Security breach suspected
- ❌ Payment processing broken
- ❌ Unable to resolve within 2 hours

### Support Contacts

**Internal:**
- Technical Lead: _____________
- On-call Engineer: _____________

**External:**
- Vercel Support: https://vercel.com/support
- Supabase Support: https://supabase.com/support
- Stripe Support: https://support.stripe.com/
- VPS Provider: _____________

### Helpful Resources

- **Documentation:** `/README.md`, `/TESTING.md`, `/GO-LIVE-CHECKLIST.md`
- **Docker Logs:** `docker-compose logs -f [service]`
- **Sentry:** https://sentry.io
- **Uptime Kuma:** https://status.cdhomeimprovementsrockford.com
- **Vercel Logs:** https://vercel.com/dashboard → Deployments → Logs

---

**Last Updated:** 2025-01-28
**Version:** 1.0
**Maintained by:** CD Home Improvements DevOps Team
