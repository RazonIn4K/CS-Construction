# Uptime Kuma Monitoring Setup Guide

**Complete configuration guide for monitoring the CD Home Improvements infrastructure**

---

## Overview

Uptime Kuma provides real-time monitoring for all services in the Docker stack plus the Next.js frontend. This guide covers initial setup, monitor configuration, and alerting.

**Access URL:** `https://status.cdhomeimprovementsrockford.com`

---

## Initial Setup

### 1. Access Uptime Kuma

After deploying the Docker stack:

```bash
# Verify Uptime Kuma is running
docker-compose ps uptime-kuma

# Check logs
docker-compose logs -f uptime-kuma
```

Navigate to: `https://status.cdhomeimprovementsrockford.com`

### 2. Create Admin Account

On first access, you'll see the setup wizard:

1. **Username:** `admin` (or your preferred username)
2. **Password:** Use a strong password (save in password manager)
3. Click **"Create"**

⚠️ **Important:** This is the only admin account. Store credentials securely!

---

## Monitor Configuration

### Monitor Types

Uptime Kuma supports multiple monitor types:
- **HTTP(s):** Web endpoints
- **TCP Port:** Database and service ports
- **Ping:** Basic connectivity
- **Keyword:** Check for specific text in response

### Recommended Monitors

Create the following monitors to cover the entire stack:

---

## 1. Next.js Frontend (Production)

**Monitor Type:** HTTP(s)
**Name:** `Next.js - Production Website`
**URL:** `https://cdhomeimprovementsrockford.com`
**Method:** GET
**Interval:** 60 seconds
**Retry Interval:** 60 seconds
**Retries:** 3
**Expected Status Code:** 200
**Keyword:** `CD Home Improvements` (optional - validates content)

**Tags:** `production`, `frontend`, `critical`

---

## 2. Next.js API - Health Check

**Monitor Type:** HTTP(s)
**Name:** `Next.js API - Lead Submission`
**URL:** `https://cdhomeimprovementsrockford.com/api/leads`
**Method:** OPTIONS
**Interval:** 120 seconds
**Expected Status Code:** 200 or 405

**Tags:** `production`, `api`, `critical`

---

## 3. Invoice Ninja Portal

**Monitor Type:** HTTP(s)
**Name:** `Invoice Ninja - Client Portal`
**URL:** `https://portal.cdhomeimprovementsrockford.com`
**Method:** GET
**Interval:** 120 seconds
**Expected Status Code:** 200
**Keyword:** `Invoice Ninja` (validates load)

**Tags:** `infrastructure`, `invoice`, `critical`

---

## 4. n8n Automation Platform

**Monitor Type:** HTTP(s)
**Name:** `n8n - Workflow Automation`
**URL:** `https://automate.cdhomeimprovementsrockford.com`
**Method:** GET
**Interval:** 180 seconds
**Expected Status Code:** 200
**Basic Auth:**
- Username: `${N8N_BASIC_AUTH_USER}`
- Password: `${N8N_BASIC_AUTH_PASSWORD}`

**Tags:** `infrastructure`, `automation`, `high`

---

## 5. MariaDB Database

**Monitor Type:** TCP Port
**Name:** `MariaDB - Database`
**Hostname:** `mariadb` (internal Docker hostname)
**Port:** 3306
**Interval:** 300 seconds

**Tags:** `infrastructure`, `database`, `critical`

⚠️ **Note:** This checks TCP connectivity only. For query health checks, see Advanced Monitoring below.

---

## 6. Caddy Reverse Proxy

**Monitor Type:** HTTP(s)
**Name:** `Caddy - Reverse Proxy`
**URL:** `https://portal.cdhomeimprovementsrockford.com`
**Method:** HEAD
**Interval:** 180 seconds
**Expected Status Code:** 200

**Tags:** `infrastructure`, `proxy`, `critical`

---

## 7. Stripe Webhook (End-to-End Test)

**Monitor Type:** HTTP(s)
**Name:** `Stripe Webhook Endpoint`
**URL:** `https://cdhomeimprovementsrockford.com/api/webhooks/stripe`
**Method:** POST
**Interval:** 300 seconds
**Expected Status Code:** 400 or 401 (no valid signature)
**Body:**
```json
{
  "test": true
}
```

**Tags:** `api`, `payment`, `high`

⚠️ **Expected:** Returns 400/401 (invalid signature). This verifies the endpoint is reachable.

---

## Notification Channels

### Email Notifications

**Recommended for:** Critical alerts

1. **Settings** → **Notifications**
2. Click **"Setup Notification"**
3. **Notification Type:** SMTP (Email)
4. **Configuration:**
   - **SMTP Host:** `smtp.postmarkapp.com` (or your email provider)
   - **SMTP Port:** 587
   - **Security:** TLS
   - **Username:** Your SMTP username
   - **Password:** Your SMTP password
   - **From Email:** `alerts@cdhomeimprovementsrockford.com`
   - **To Email:** `admin@cdhomeimprovementsrockford.com`
5. **Test** and **Save**

**Trigger Configuration:**
- **Send notification when:** Down
- **Resend every X hours:** 2
- **Recover:** Yes (send notification when back up)

---

### Slack Notifications (Optional)

**Recommended for:** Team communication

1. Create a Slack webhook: https://api.slack.com/messaging/webhooks
2. **Settings** → **Notifications**
3. **Notification Type:** Slack
4. **Webhook URL:** `https://hooks.slack.com/services/YOUR/WEBHOOK/URL`
5. **Channel:** `#alerts` or `#infrastructure`
6. **Test** and **Save**

---

### SMS Notifications via Twilio (Optional)

**Recommended for:** Critical after-hours alerts

1. **Settings** → **Notifications**
2. **Notification Type:** Twilio
3. **Configuration:**
   - **Account SID:** From Twilio dashboard
   - **Auth Token:** From Twilio dashboard
   - **From Phone Number:** Your Twilio number
   - **To Phone Number:** Your phone number
4. **Test** and **Save**

⚠️ **Note:** SMS incurs costs per message.

---

## Alert Rules

### Critical Services

**Apply to:**
- Next.js Frontend
- Invoice Ninja
- MariaDB

**Configuration:**
- **Down for:** 3 retries (3 minutes)
- **Notifications:** Email + Slack + SMS
- **Auto-resume:** Yes

### High Priority

**Apply to:**
- n8n
- API endpoints

**Configuration:**
- **Down for:** 5 retries (5-10 minutes)
- **Notifications:** Email + Slack
- **Auto-resume:** Yes

### Standard Priority

**Apply to:**
- Health checks
- Secondary endpoints

**Configuration:**
- **Down for:** 10 retries (10-20 minutes)
- **Notifications:** Email only
- **Auto-resume:** Yes

---

## Status Page (Optional)

Create a public status page for clients:

1. **Status Pages** → **New Status Page**
2. **Title:** `CD Home Improvements Status`
3. **Slug:** `cdhi-status` (URL: `/status/cdhi-status`)
4. **Select Monitors:**
   - ✅ Next.js - Production Website
   - ✅ Invoice Ninja - Client Portal
5. **Show Tags:** Yes
6. **Public:** Yes
7. **Save**

**Access:** `https://status.cdhomeimprovementsrockford.com/status/cdhi-status`

---

## Advanced Monitoring

### MariaDB Query Health Check

Since Uptime Kuma doesn't support SQL queries directly, use a custom script:

```bash
# Create health check script
cat > /opt/cdhi-stack/healthcheck-mariadb.sh << 'EOF'
#!/bin/bash
RESULT=$(docker-compose exec -T mariadb mysql -u root -p"$DB_ROOT_PASSWORD" -e "SELECT 1" 2>&1)
if echo "$RESULT" | grep -q "1"; then
  exit 0
else
  exit 1
fi
EOF

chmod +x /opt/cdhi-stack/healthcheck-mariadb.sh
```

**Add to cron (every 5 minutes):**
```bash
crontab -e
# Add:
*/5 * * * * /opt/cdhi-stack/healthcheck-mariadb.sh || echo "MariaDB health check failed" | mail -s "ALERT: MariaDB Issue" admin@cdhomeimprovementsrockford.com
```

---

## Maintenance Mode

**Disable alerts during planned maintenance:**

1. **Select monitor(s)** to pause
2. Click **"Pause"**
3. Perform maintenance
4. Click **"Resume"** when done

**Bulk pause all monitors:**
```bash
# There's no CLI for Uptime Kuma, use UI:
# Settings → Maintenance → Create Maintenance Window
```

---

## Troubleshooting

### Monitor Always Shows Down

**Possible causes:**
1. **DNS not propagated:** Wait 10-15 minutes after DNS changes
2. **Firewall blocking:** Verify ports 80, 443 open
3. **Service not started:** Check `docker-compose ps`
4. **SSL certificate issue:** Check Caddy logs

**Debug:**
```bash
# Test from VPS
curl -I https://portal.cdhomeimprovementsrockford.com

# Check Caddy logs
docker-compose logs caddy | grep ERROR

# Verify all services running
docker-compose ps
```

### Notifications Not Sending

**Email issues:**
1. Verify SMTP credentials
2. Check spam folder
3. Test with "Send Test Notification"

**Slack issues:**
1. Verify webhook URL is correct
2. Check Slack workspace permissions

---

## Backup & Export

### Export Monitor Configuration

**Manual export:**
1. **Settings** → **Backup**
2. **Export**
3. Save JSON file

**Restore:**
1. **Settings** → **Backup**
2. **Import**
3. Select JSON file

**Automated backup:**
```bash
# Uptime Kuma data is stored in Docker volume
# Backup is handled by backup.sh script
./backup.sh
```

---

## Monitor Checklist

Use this checklist when setting up Uptime Kuma:

- [ ] Admin account created
- [ ] Monitor 1: Next.js Frontend (60s interval)
- [ ] Monitor 2: Next.js API (120s interval)
- [ ] Monitor 3: Invoice Ninja (120s interval)
- [ ] Monitor 4: n8n (180s interval)
- [ ] Monitor 5: MariaDB TCP (300s interval)
- [ ] Monitor 6: Caddy (180s interval)
- [ ] Monitor 7: Stripe webhook (300s interval)
- [ ] Email notifications configured
- [ ] Slack notifications configured (optional)
- [ ] Alert rules set for critical services
- [ ] Status page created (optional)
- [ ] All monitors showing green
- [ ] Test notification sent successfully

---

## Best Practices

1. **Tag all monitors** - Use tags for filtering and bulk actions
2. **Set realistic intervals** - Don't over-monitor (wastes resources)
3. **Use retry logic** - Avoid false positives from network blips
4. **Test notifications** - Verify alerts work before going live
5. **Document custom monitors** - Keep notes on complex configurations
6. **Review weekly** - Check for patterns in downtime
7. **Update during changes** - Modify monitors when infrastructure changes

---

## Monitoring Dashboard

**Recommended view for daily checks:**

```
Status Page Layout:
┌─────────────────────────────────────┐
│  CD Home Improvements Status        │
├─────────────────────────────────────┤
│  ✅ Website (Next.js)         99.9% │
│  ✅ Invoice Portal           99.8% │
│  ✅ Automation (n8n)         99.7% │
│  ✅ Database (MariaDB)       99.9% │
│  ✅ API Endpoints            99.6% │
└─────────────────────────────────────┘
```

**Access daily at:** `https://status.cdhomeimprovementsrockford.com`

---

## Support Resources

- **Uptime Kuma Documentation:** https://github.com/louislam/uptime-kuma/wiki
- **Community Forum:** https://github.com/louislam/uptime-kuma/discussions
- **Docker Logs:** `docker-compose logs uptime-kuma`

---

**Last Updated:** 2025-01-28
**Version:** 1.0
**Maintained by:** CD Home Improvements DevOps Team
