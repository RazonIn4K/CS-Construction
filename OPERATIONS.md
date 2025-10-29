# CD Home Improvements - Operations Runbook

**Day-to-day operational procedures and common tasks**

---

## 📋 Table of Contents

- [Daily Operations](#daily-operations)
- [Weekly Tasks](#weekly-tasks)
- [Monthly Tasks](#monthly-tasks)
- [Common Procedures](#common-procedures)
- [Emergency Procedures](#emergency-procedures)
- [Maintenance Windows](#maintenance-windows)

---

## 📅 Daily Operations

### Morning Health Check (5 minutes)

**Run every morning at 9:00 AM:**

```bash
#!/bin/bash
# Save as: /opt/cdhi-stack/daily-check.sh

echo "🌅 CD Home Improvements - Daily Health Check"
echo "=============================================="
echo "Date: $(date)"
echo ""

# 1. Check all services
echo "Services Status:"
curl -s https://cdhomeimprovementsrockford.com > /dev/null && echo "✅ Website: UP" || echo "❌ Website: DOWN"
curl -s https://portal.cdhomeimprovementsrockford.com > /dev/null && echo "✅ Invoice Ninja: UP" || echo "❌ Invoice Ninja: DOWN"
curl -s https://automate.cdhomeimprovementsrockford.com > /dev/null && echo "✅ n8n: UP" || echo "❌ n8n: DOWN"
curl -s https://status.cdhomeimprovementsrockford.com > /dev/null && echo "✅ Uptime Kuma: UP" || echo "❌ Uptime Kuma: DOWN"

# 2. Check Docker containers
echo ""
echo "Docker Containers:"
docker-compose ps --format "table {{.Names}}\t{{.Status}}" | grep -v "Up" && echo "⚠️  Some containers down" || echo "✅ All containers running"

# 3. Check disk space
echo ""
echo "Disk Usage:"
DISK_USAGE=$(df -h / | awk 'NR==2 {print $5}' | sed 's/%//')
if [ $DISK_USAGE -gt 85 ]; then
    echo "❌ Disk usage: ${DISK_USAGE}% (WARNING: > 85%)"
else
    echo "✅ Disk usage: ${DISK_USAGE}%"
fi

# 4. Check memory
echo ""
echo "Memory Usage:"
FREE_MEM=$(free -m | awk 'NR==2 {print $4}')
if [ $FREE_MEM -lt 500 ]; then
    echo "⚠️  Free memory: ${FREE_MEM}MB (Low)"
else
    echo "✅ Free memory: ${FREE_MEM}MB"
fi

# 5. Check recent errors in Sentry
echo ""
echo "Sentry Errors (last 24h): Check dashboard manually"
echo "URL: https://sentry.io"

# 6. Check backup status
echo ""
echo "Last Backup:"
ls -lh /backup/cdhi/*.sql.gz | tail -1

# 7. Check SSL certificates
echo ""
echo "SSL Certificate Expiration:"
echo | openssl s_client -connect cdhomeimprovementsrockford.com:443 -servername cdhomeimprovementsrockford.com 2>/dev/null | \
    openssl x509 -noout -dates | grep "notAfter"

echo ""
echo "=============================================="
echo "✅ Daily health check complete"
```

**Automate with cron:**

```bash
# Add to crontab
crontab -e

# Run at 9:00 AM daily
0 9 * * * /opt/cdhi-stack/daily-check.sh | mail -s "CDHI Daily Health Check" admin@cdhomeimprovementsrockford.com
```

**Checklist:**
- [ ] All services UP
- [ ] No critical errors in Sentry
- [ ] Disk usage < 85%
- [ ] Memory usage healthy
- [ ] Backup completed overnight
- [ ] SSL certificates valid (> 30 days)

---

### Review New Leads (10 minutes)

**Check for new lead submissions:**

```bash
# Connect to Supabase
psql "postgresql://postgres:PASSWORD@db.PROJECT_ID.supabase.co:5432/postgres"

-- Check leads from last 24 hours
SELECT
    l.lead_id,
    c.first_name,
    c.last_name,
    c.email,
    l.service_type,
    l.status,
    l.created_at
FROM leads l
JOIN clients c ON l.client_id = c.client_id
WHERE l.created_at > NOW() - INTERVAL '24 hours'
ORDER BY l.created_at DESC;

-- Expected: List of recent leads

-- Check for uncontacted leads
SELECT COUNT(*) as uncontacted_leads
FROM leads
WHERE status = 'NEW'
AND created_at < NOW() - INTERVAL '2 hours';

-- Expected: Should be 0 (n8n should have sent emails)
```

**Or via Supabase Dashboard:**
1. Go to: https://supabase.com/dashboard/project/YOUR_PROJECT_ID/editor
2. Table Editor → `leads`
3. Filter: `created_at` > "last 24 hours"
4. Sort: `created_at` DESC

**Action Items:**
- [ ] Verify all leads have corresponding quotes in Invoice Ninja
- [ ] Check n8n execution log for any failures
- [ ] Follow up on leads marked "NEW" for > 2 hours

---

### Monitor Payment Processing (5 minutes)

**Check for new payments:**

```bash
# Via Stripe Dashboard
open https://dashboard.stripe.com/payments

# Filter: Last 24 hours
# Check for: Succeeded, Failed, Requires action

# Via Supabase
psql "postgresql://postgres:PASSWORD@db.PROJECT_ID.supabase.co:5432/postgres"

-- Check payments from last 24 hours
SELECT
    p.payment_id,
    p.amount,
    p.status,
    p.payment_method,
    p.created_at,
    i.invoice_number
FROM payments p
LEFT JOIN invoices i ON p.invoice_id = i.invoice_id
WHERE p.created_at > NOW() - INTERVAL '24 hours'
ORDER BY p.created_at DESC;
```

**Check for failed webhooks:**

```bash
# Check Dead Letter Queue
curl https://cdhomeimprovementsrockford.com/api/admin/replay \
    -H "Authorization: Bearer YOUR_ADMIN_API_KEY" | jq

# If any failed webhooks exist, replay them:
curl -X POST https://cdhomeimprovementsrockford.com/api/admin/replay \
    -H "Authorization: Bearer YOUR_ADMIN_API_KEY" \
    -H "Content-Type: application/json" \
    -d '{"event_id": "EVENT_ID"}'
```

**Checklist:**
- [ ] All payments processed successfully
- [ ] No failed webhooks in DLQ
- [ ] Invoices marked as "Paid" in Invoice Ninja
- [ ] No "Requires action" payments in Stripe

---

## 📆 Weekly Tasks

### Sunday: Full System Backup (30 minutes)

**Automated backup already configured, verify it ran:**

```bash
ssh root@YOUR_VPS_IP

# Check backup log
tail -100 /var/log/cdhi-backup.log

# Expected: "Backup completed successfully"

# Verify backup files exist
ls -lh /backup/cdhi/ | grep "$(date +%Y%m%d)"

# Check backup sizes
du -h /backup/cdhi/*.sql.gz | tail -5
du -h /backup/cdhi/*.tar.gz | tail -5

# Test restore on non-production database
gunzip -t /backup/cdhi/mariadb_LATEST.sql.gz && echo "✅ Backup valid" || echo "❌ Backup corrupted"

# Sync to S3 (if configured)
aws s3 sync /backup/cdhi/ s3://cdhi-backups/ --dryrun

# If dryrun looks good, run actual sync
aws s3 sync /backup/cdhi/ s3://cdhi-backups/
```

**Checklist:**
- [ ] Automated backup completed
- [ ] Backup files exist and not corrupted
- [ ] Backup sizes reasonable (MariaDB > 10MB)
- [ ] Offsite sync to S3 successful
- [ ] Old backups cleaned up (retention policy applied)

---

### Monday: Review Monitoring Alerts (15 minutes)

**Review Uptime Kuma incidents from past week:**

```bash
# Access Uptime Kuma
open https://status.cdhomeimprovementsrockford.com

# Review:
# 1. Incidents tab
# 2. Uptime percentage for each service
# 3. Response time trends

# Expected:
# - 99%+ uptime for all services
# - < 500ms average response time
# - No unacknowledged incidents
```

**Review Sentry errors:**

```bash
# Access Sentry
open https://sentry.io

# Check:
# 1. Error count trend (last 7 days)
# 2. New error types
# 3. Frequency of recurring errors
# 4. User-affected errors

# Investigate:
# - Errors affecting > 10 users
# - Errors occurring > 100 times
# - New error patterns
```

**Checklist:**
- [ ] All services maintained 99%+ uptime
- [ ] No critical/high-severity errors unresolved
- [ ] Trends look normal (no spikes)
- [ ] False positive alerts addressed

---

### Wednesday: Security Review (20 minutes)

**Review security logs:**

```bash
ssh root@YOUR_VPS_IP

# Check failed SSH attempts
sudo grep "Failed password" /var/log/auth.log | tail -50

# Check Fail2Ban banned IPs
sudo fail2ban-client status sshd

# Check unusual sudo commands
sudo grep sudo /var/log/auth.log | grep -v "cdhicheck"

# Check Docker logs for suspicious activity
docker-compose logs | grep -iE "(error|warning|unauthorized|denied)" | tail -100

# Check file modifications in /opt/cdhi-stack/
find /opt/cdhi-stack/ -mtime -7 -type f

# Expected: Only expected config changes
```

**Review access logs:**

```bash
# Check Caddy access logs for unusual patterns
docker-compose logs caddy | grep -E "(404|401|403)" | tail -50

# Check for suspicious IPs
docker-compose logs caddy | awk '{print $1}' | sort | uniq -c | sort -rn | head -20

# Check for potential SQL injection attempts
docker-compose logs | grep -iE "(union|select|insert|drop|exec)" | tail -50
```

**Checklist:**
- [ ] No unauthorized SSH access attempts succeeded
- [ ] Fail2Ban working correctly
- [ ] No suspicious file modifications
- [ ] No unusual access patterns
- [ ] All software up to date

---

### Friday: Performance Review (15 minutes)

**Check application performance:**

```bash
# Run Lighthouse audit
# Open Chrome → DevTools → Lighthouse → Run audit

# Expected scores:
# Performance: > 90
# Accessibility: > 95
# Best Practices: > 95
# SEO: > 90
```

**Check API response times:**

```bash
# Test lead submission endpoint
time curl -X POST https://cdhomeimprovementsrockford.com/api/leads \
    -H "Content-Type: application/json" \
    -d @test-lead.json

# Expected: < 500ms

# Check Vercel analytics
open https://vercel.com/YOUR_TEAM/cd-construction/analytics

# Review:
# - Average response time
# - 95th percentile response time
# - Error rate
```

**Check database performance:**

```bash
# Connect to Supabase
psql "postgresql://postgres:PASSWORD@db.PROJECT_ID.supabase.co:5432/postgres"

-- Check slow queries
SELECT
    query,
    calls,
    mean_exec_time,
    max_exec_time
FROM pg_stat_statements
ORDER BY mean_exec_time DESC
LIMIT 10;

-- Check table sizes
SELECT
    schemaname,
    tablename,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;
```

**Checklist:**
- [ ] Website performance scores > 90
- [ ] API response times < 500ms
- [ ] No slow database queries (> 1s)
- [ ] Database sizes within expectations

---

## 📅 Monthly Tasks

### First Sunday: System Updates (1-2 hours)

**Update all software components:**

```bash
ssh root@YOUR_VPS_IP

# 1. Update system packages
sudo apt update
sudo apt list --upgradable

# Review upgradable packages, especially security updates
sudo apt upgrade -y

# 2. Update Docker images
cd /opt/cdhi-stack/docker

# Pull latest images
docker-compose pull

# Check for breaking changes in release notes
# - Invoice Ninja: https://github.com/invoiceninja/invoiceninja/releases
# - n8n: https://github.com/n8n-io/n8n/releases
# - Caddy: https://github.com/caddyserver/caddy/releases

# 3. Recreate containers with new images
docker-compose up -d --force-recreate

# 4. Monitor for issues
docker-compose logs -f --tail=100

# 5. Run health checks
/opt/cdhi-stack/daily-check.sh

# 6. If issues, rollback
docker-compose down
git checkout HEAD~1 docker-compose.yml
docker-compose up -d
```

**Update Next.js dependencies:**

```bash
# On local machine
cd /path/to/cd-construction

# Check for outdated packages
npm outdated

# Update non-major versions
npm update

# Check for security vulnerabilities
npm audit

# Fix vulnerabilities
npm audit fix

# Test locally
npm run build
npm run lint
npm run type-check

# If all tests pass, commit and deploy
git add package.json package-lock.json
git commit -m "chore: update dependencies"
git push origin main

# Monitor deployment
vercel logs --follow
```

**Checklist:**
- [ ] System packages updated
- [ ] Docker images updated
- [ ] Next.js dependencies updated
- [ ] No new vulnerabilities introduced
- [ ] All services running after updates
- [ ] Health checks passing

---

### Mid-Month: Credential Rotation (30 minutes)

**Rotate passwords every 90 days:**

```bash
# Generate new secure passwords
NEW_DB_PASSWORD=$(openssl rand -base64 32)
NEW_N8N_PASSWORD=$(openssl rand -base64 32)
NEW_ADMIN_API_KEY=$(openssl rand -hex 32)

# Update .env file
ssh root@YOUR_VPS_IP
cd /opt/cdhi-stack/docker

# Backup current .env
cp .env .env.backup.$(date +%Y%m%d)

# Update passwords in .env
nano .env

# Update:
# DB_PASSWORD=NEW_PASSWORD
# N8N_BASIC_AUTH_PASSWORD=NEW_PASSWORD

# Recreate affected services
docker-compose up -d --force-recreate mariadb invoiceninja n8n

# Verify services started
docker-compose logs -f
```

**Update Vercel environment variables:**

```bash
# Update ADMIN_API_KEY
vercel env rm ADMIN_API_KEY production
vercel env add ADMIN_API_KEY production
# Enter: NEW_ADMIN_API_KEY

# Redeploy
vercel --prod
```

**Update password manager:**
- [ ] Update VPS admin password
- [ ] Update database passwords
- [ ] Update API keys
- [ ] Update n8n password
- [ ] Document rotation date

---

### Month-End: Review & Reporting (1 hour)

**Generate monthly report:**

```bash
# System uptime
uptime

# Service uptime (from Uptime Kuma)
# Export CSV: Status → Select monitor → Export

# Lead statistics
psql "postgresql://..." << 'EOF'
SELECT
    DATE_TRUNC('month', created_at) as month,
    COUNT(*) as total_leads,
    COUNT(CASE WHEN status = 'CONVERTED' THEN 1 END) as converted,
    ROUND(COUNT(CASE WHEN status = 'CONVERTED' THEN 1 END)::numeric / COUNT(*)::numeric * 100, 2) as conversion_rate
FROM leads
WHERE created_at >= DATE_TRUNC('month', NOW() - INTERVAL '1 month')
GROUP BY DATE_TRUNC('month', created_at);
EOF

# Revenue statistics (from Stripe)
open https://dashboard.stripe.com/reports

# Error statistics (from Sentry)
open https://sentry.io/organizations/cd-home-improvements/issues/

# Generate report
cat > /tmp/monthly-report.txt << 'EOF'
# CD Home Improvements - Monthly Report
# Date: $(date +%B\ %Y)

## System Performance
- Uptime: XX.X%
- Average Response Time: XXXms
- Total Errors: XX

## Business Metrics
- New Leads: XX
- Conversion Rate: XX%
- Revenue: $X,XXX
- Average Invoice: $XXX

## Technical Highlights
- [Key update 1]
- [Key update 2]

## Issues & Resolutions
- [Issue 1] - Resolved
- [Issue 2] - In progress

## Action Items for Next Month
- [ ] Task 1
- [ ] Task 2
EOF
```

**Checklist:**
- [ ] Monthly report generated
- [ ] Shared with business owner
- [ ] Key metrics documented
- [ ] Issues documented and addressed
- [ ] Action items for next month identified

---

## 🔧 Common Procedures

### Procedure 1: Add New Admin User

**When:** New team member needs access

**Steps:**

```bash
ssh root@YOUR_VPS_IP

# 1. Create user
sudo adduser newadmin

# 2. Add to sudo group
sudo usermod -aG sudo newadmin

# 3. Add to docker group
sudo usermod -aG docker newadmin

# 4. Set up SSH key authentication
sudo mkdir -p /home/newadmin/.ssh
sudo nano /home/newadmin/.ssh/authorized_keys
# Paste their public SSH key

# 5. Set correct permissions
sudo chmod 700 /home/newadmin/.ssh
sudo chmod 600 /home/newadmin/.ssh/authorized_keys
sudo chown -R newadmin:newadmin /home/newadmin/.ssh

# 6. Test login
# (from new user's machine)
ssh newadmin@YOUR_VPS_IP

# 7. Grant access to Vercel
# Invite via: https://vercel.com/teams/YOUR_TEAM/settings/members

# 8. Grant access to Supabase
# Invite via: https://supabase.com/dashboard/org/YOUR_ORG/team

# 9. Grant access to n8n
# Login as admin → Settings → Users → Invite user

# 10. Document in password manager
# Store credentials and access levels
```

**Checklist:**
- [ ] User created with sudo access
- [ ] SSH key authentication working
- [ ] Docker access granted
- [ ] Vercel access granted
- [ ] Supabase access granted
- [ ] n8n access granted
- [ ] Documented in password manager

---

### Procedure 2: Remove User Access

**When:** Team member leaves or no longer needs access

**Steps:**

```bash
ssh root@YOUR_VPS_IP

# 1. Disable user account
sudo usermod -L olduser  # Lock account

# 2. Remove from sudo group
sudo deluser olduser sudo

# 3. Remove from docker group
sudo deluser olduser docker

# 4. Remove SSH keys
sudo rm -rf /home/olduser/.ssh

# 5. Optionally delete user entirely
# sudo userdel -r olduser  # -r removes home directory

# 6. Remove from Vercel
# https://vercel.com/teams/YOUR_TEAM/settings/members → Remove

# 7. Remove from Supabase
# https://supabase.com/dashboard/org/YOUR_ORG/team → Remove

# 8. Remove from n8n
# Settings → Users → Delete user

# 9. Rotate shared credentials
# If user had access to shared passwords, rotate them
```

**Checklist:**
- [ ] User account disabled
- [ ] All group memberships removed
- [ ] Vercel access removed
- [ ] Supabase access removed
- [ ] n8n access removed
- [ ] Shared credentials rotated if necessary

---

### Procedure 3: Scale Up Resources

**When:** System under heavy load or anticipating traffic spike

**Steps:**

```bash
# Option A: Upgrade VPS (requires downtime)
# 1. Contact VPS provider to upgrade plan
# 2. Follow their upgrade procedure
# 3. Verify new resources after upgrade

# Option B: Add swap space (no downtime)
ssh root@YOUR_VPS_IP

# Create 8GB swap
sudo fallocate -l 8G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile
echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab

# Option C: Increase Docker resource limits
cd /opt/cdhi-stack/docker

# Edit docker-compose.yml
nano docker-compose.yml

# Increase memory limits:
services:
  mariadb:
    deploy:
      resources:
        limits:
          cpus: '2.0'  # From 1.0
          memory: 1G   # From 512M

  invoiceninja:
    deploy:
      resources:
        limits:
          memory: 512M  # From 256M

# Apply changes
docker-compose up -d --force-recreate

# Monitor
docker stats --no-stream
```

**Checklist:**
- [ ] Resource increase planned and approved
- [ ] Backup created before changes
- [ ] Changes applied
- [ ] Services restarted successfully
- [ ] Performance improved
- [ ] Monitoring confirms stability

---

### Procedure 4: Migrate to New VPS

**When:** Moving to different provider or upgrading infrastructure

**Prerequisites:**
- New VPS provisioned
- Backup completed on old VPS
- DNS access available

**Steps:**

```bash
# 1. Provision new VPS
# - Same or better specs than old VPS
# - Ubuntu 22.04 LTS
# - SSH access configured

# 2. Backup old VPS
ssh root@OLD_VPS_IP
cd /opt/cdhi-stack/docker
./backup.sh full

# 3. Copy backups to new VPS
rsync -avz /backup/cdhi/ root@NEW_VPS_IP:/backup/cdhi/

# 4. Set up new VPS (see GO-LIVE-CHECKLIST.md Phase 1)
ssh root@NEW_VPS_IP

# Install Docker, configure firewall, etc.

# 5. Restore services on new VPS (see DISASTER-RECOVERY.md)
cd /opt/cdhi-stack
# Clone repo, restore configs, restore databases

# 6. Test new VPS
# Add entry to /etc/hosts on local machine:
# NEW_VPS_IP cdhomeimprovementsrockford.com

# Test all services work

# 7. Update DNS to point to new VPS
# Change A records to NEW_VPS_IP
# Wait for propagation (5-60 minutes)

# 8. Monitor new VPS
# Watch logs, check for errors

# 9. Keep old VPS running for 7 days as backup
# After 7 days with no issues, decommission old VPS
```

**Checklist:**
- [ ] New VPS provisioned and configured
- [ ] Full backup of old VPS completed
- [ ] Services restored on new VPS
- [ ] Testing completed successfully
- [ ] DNS updated to new VPS
- [ ] Monitoring confirms stability
- [ ] Old VPS kept as backup for 7 days

---

## 🚨 Emergency Procedures

### Emergency 1: Site Down (Immediate Response)

**Time Limit:** 15 minutes

**Steps:**

```bash
# 1. Verify site is actually down
curl -I https://cdhomeimprovementsrockford.com

# 2. Check Vercel status
open https://www.vercel-status.com/

# 3. Check VPS
ssh root@YOUR_VPS_IP
docker-compose ps

# 4. Check Caddy
docker-compose logs caddy --tail=50

# 5. Quick restart
docker-compose restart caddy

# 6. If still down, check DNS
dig cdhomeimprovementsrockford.com

# 7. Update status page
# Manual update if Uptime Kuma is also down

# 8. Notify team
# Email/SMS: "Site down, investigating"

# 9. If not resolved in 15 minutes, escalate
# Call technical lead or on-call engineer
```

---

### Emergency 2: Database Corruption

**Time Limit:** 30 minutes

**Steps:**

```bash
# 1. Stop all services immediately
ssh root@YOUR_VPS_IP
cd /opt/cdhi-stack/docker
docker-compose stop

# 2. Assess damage
docker-compose start mariadb
docker-compose logs mariadb

# 3. Attempt repair
docker-compose exec mariadb mysqlcheck \
    -u root -p"$DB_ROOT_PASSWORD" \
    --repair --all-databases

# 4. If repair fails, restore from backup
gunzip -c /backup/cdhi/mariadb_LATEST.sql.gz | \
    docker-compose exec -T mariadb mysql -u root -p"$DB_ROOT_PASSWORD"

# 5. Verify restoration
docker-compose exec mariadb mysql -u root -p"$DB_ROOT_PASSWORD" \
    -e "SELECT COUNT(*) FROM invoiceninja.clients;"

# 6. Restart all services
docker-compose up -d

# 7. Test functionality
curl -I https://portal.cdhomeimprovementsrockford.com

# 8. Document incident
# Add to /var/log/security-incidents.log
```

---

### Emergency 3: Security Breach Suspected

**Time Limit:** Immediate action required

**Steps:**

```bash
# 1. IMMEDIATELY disconnect from network
ssh root@YOUR_VPS_IP
sudo ufw deny out
sudo ufw deny in

# 2. Preserve evidence
tar -czf /tmp/forensics-$(date +%Y%m%d_%H%M%S).tar.gz \
    /opt/cdhi-stack/ \
    /var/log/ \
    /home/

# 3. Notify authorities
# - Local law enforcement
# - FBI IC3: https://www.ic3.gov
# - Insurance provider

# 4. Change ALL credentials
# - VPS passwords
# - Database passwords
# - API keys
# - SSH keys

# 5. Restore from known-good backup
# Use backup from BEFORE breach occurred

# 6. Document everything
# Detailed timeline of events

# 7. Conduct post-incident review
# Identify how breach occurred
# Implement preventive measures
```

---

## 🛠️ Maintenance Windows

### Planned Maintenance Template

**Schedule:** 2nd Sunday of each month, 2:00 AM - 4:00 AM UTC

**Communication Template:**

```
Subject: Scheduled Maintenance - [Date]

Dear Valued Customers,

We will be performing scheduled maintenance on [Date] from 2:00 AM to 4:00 AM UTC.

During this time:
- Website may be briefly unavailable
- Some features may be temporarily disabled
- No data will be lost

We apologize for any inconvenience.

Questions? Contact us at support@cdhomeimprovementsrockford.com

CD Home Improvements Team
```

**Maintenance Checklist:**

- [ ] Maintenance window scheduled (2 weeks notice)
- [ ] Customers notified (1 week before)
- [ ] Backup completed before maintenance
- [ ] Uptime Kuma monitors paused
- [ ] Maintenance performed
- [ ] Services verified after maintenance
- [ ] Uptime Kuma monitors resumed
- [ ] Customers notified of completion

---

**Last Updated:** 2025-01-28
**Version:** 1.0
**Maintained by:** CD Home Improvements Operations Team
