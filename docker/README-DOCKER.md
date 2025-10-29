# CS-Construction Docker Stack Deployment Guide

**Complete infrastructure for CS-Construction MVP on a single VPS**

## Table of Contents
- [Overview](#overview)
- [Prerequisites](#prerequisites)
- [Initial Setup](#initial-setup)
- [Deployment Steps](#deployment-steps)
- [Post-Deployment Configuration](#post-deployment-configuration)
- [Service Management](#service-management)
- [Backup & Recovery](#backup--recovery)
- [Troubleshooting](#troubleshooting)
- [Security Checklist](#security-checklist)
- [Monitoring](#monitoring)

---

## Overview

### Services Included

| Service | Purpose | URL |
|---------|---------|-----|
| **Caddy** | Reverse proxy + automatic HTTPS | N/A (frontend) |
| **Invoice Ninja** | Client portal, quotes, invoices | portal.cdhomeimprovementsrockford.com |
| **MariaDB** | Database (Invoice Ninja) | Internal only |
| **n8n** | Workflow automation | automate.cdhomeimprovementsrockford.com |
| **Uptime Kuma** | Service monitoring | status.cdhomeimprovementsrockford.com |

### Architecture

```
Internet
   │
   ├─→ HTTP :80  ─┐
   └─→ HTTPS :443 ─┴→ Caddy (Reverse Proxy + TLS)
                        │
          ┌─────────────┼─────────────┐
          │             │             │
     Invoice Ninja     n8n    Uptime Kuma
          │
       MariaDB
     (Backend Network)
```

### Resource Requirements

**Minimum VPS Specs:**
- 2 vCPU
- 4GB RAM
- 80GB SSD
- Ubuntu 22.04 LTS or 24.04 LTS

**Recommended VPS Providers:**
- DigitalOcean ($12-24/mo)
- Hetzner ($6-12/mo)
- Linode ($12-24/mo)
- Vultr ($12-24/mo)

---

## Prerequisites

### 1. Domain & DNS Configuration

**Required DNS Records (A or CNAME):**

```
portal.cdhomeimprovementsrockford.com     → YOUR_VPS_IP
automate.cdhomeimprovementsrockford.com   → YOUR_VPS_IP
status.cdhomeimprovementsrockford.com     → YOUR_VPS_IP
```

**Verification:**
```bash
dig +short portal.cdhomeimprovementsrockford.com
# Should return your VPS IP
```

### 2. VPS Setup

**Install Docker & Docker Compose:**

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Add current user to docker group
sudo usermod -aG docker $USER
newgrp docker

# Install Docker Compose V2
sudo apt install docker-compose-plugin

# Verify installation
docker --version
docker compose version
```

**Configure Firewall:**

```bash
# Install UFW if not present
sudo apt install ufw

# Default policies
sudo ufw default deny incoming
sudo ufw default allow outgoing

# Allow SSH (IMPORTANT: Do this first!)
sudo ufw allow 22/tcp

# Allow HTTP and HTTPS
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp

# Enable firewall
sudo ufw enable

# Verify status
sudo ufw status
```

### 3. Required Credentials

Before deployment, gather:

- **Stripe API Keys** (live mode)
  - Dashboard: https://dashboard.stripe.com/apikeys
  - `pk_live_...` and `sk_live_...`

- **Email Service** (Postmark or SendGrid)
  - Server token for Postmark
  - OR API key for SendGrid

- **Supabase** (already have)
  - Project URL and anon key

---

## Initial Setup

### 1. Create Deployment Directory

```bash
# Create directory structure
sudo mkdir -p /opt/cdhi-stack
sudo chown $USER:$USER /opt/cdhi-stack
cd /opt/cdhi-stack
```

### 2. Upload Docker Stack Files

**Option A: Git Clone (Recommended)**

```bash
cd /opt
git clone <your-repo-url> cdhi-stack
cd cdhi-stack/docker
```

**Option B: Manual Upload**

```bash
# From your local machine
scp -r docker/* user@your-vps-ip:/opt/cdhi-stack/
```

### 3. Generate Secrets & Create .env File

```bash
cd /opt/cdhi-stack

# Copy template
cp .env.docker.example .env

# Generate secure secrets
echo "DB_ROOT_PASSWORD=$(openssl rand -base64 32)" >> .env
echo "DB_PASSWORD=$(openssl rand -base64 32)" >> .env
echo "N8N_ENCRYPTION_KEY=$(openssl rand -hex 32)" >> .env
echo "N8N_BASIC_AUTH_PASSWORD=$(openssl rand -base64 16)" >> .env

# Secure the file
chmod 600 .env

# Edit the .env file and fill in remaining values
nano .env
```

**Required Manual Edits in .env:**
- `INVOICENINJA_APP_KEY` (generate later with php artisan)
- `STRIPE_PUBLISHABLE_KEY`
- `STRIPE_SECRET_KEY`
- `MAIL_HOST`, `MAIL_USERNAME`, `MAIL_PASSWORD`
- All domain URLs (if different from defaults)

---

## Deployment Steps

### Step 1: Start Database First

```bash
cd /opt/cdhi-stack

# Start only MariaDB
docker compose up -d mariadb

# Wait for database initialization (30-60 seconds)
sleep 60

# Verify database is healthy
docker compose ps mariadb
docker compose logs mariadb

# Should see: "mariadbd: ready for connections"
```

### Step 2: Generate Invoice Ninja APP_KEY

```bash
# Temporarily start Invoice Ninja
docker compose up -d invoiceninja

# Generate APP_KEY
docker compose exec invoiceninja php artisan key:generate --show

# Copy the output (format: base64:XXXXXXXX...)
# Add to .env file:
nano .env
# Set: INVOICENINJA_APP_KEY=base64:XXXXXXXX...

# Restart Invoice Ninja with new key
docker compose restart invoiceninja
```

### Step 3: Initialize Invoice Ninja Database

```bash
# Run migrations
docker compose exec invoiceninja php artisan migrate:fresh --seed --force

# Create admin account
docker compose exec invoiceninja php artisan ninja:create-account \
  --email admin@cdhomeimprovementsrockford.com \
  --password YourSecurePassword123!

# Note: Save these credentials in your password manager!
```

### Step 4: Start All Services

```bash
# Start everything
docker compose up -d

# Verify all services are running
docker compose ps

# Should see 7 containers all "Up" and "healthy"
```

### Step 5: Verify HTTPS Certificates

```bash
# Watch Caddy logs for certificate issuance
docker compose logs -f caddy

# Look for: "certificate obtained successfully"

# Test HTTPS endpoints
curl -I https://portal.cdhomeimprovementsrockford.com
curl -I https://automate.cdhomeimprovementsrockford.com
curl -I https://status.cdhomeimprovementsrockford.com

# All should return: HTTP/2 200
```

---

## Post-Deployment Configuration

### 1. Configure Invoice Ninja

**Access Admin Panel:**
```
URL: https://portal.cdhomeimprovementsrockford.com
Login: admin@cdhomeimprovementsrockford.com
Password: (created in Step 3)
```

**Setup Stripe Payment Gateway:**
1. Settings → Payment Gateways
2. Click "Stripe"
3. Enter:
   - Publishable Key: `pk_live_...`
   - Secret Key: `sk_live_...`
4. Enable "Online Payments"
5. Save

**Generate API Token for n8n:**
```bash
docker compose exec invoiceninja php artisan ninja:create-token \
  --user admin@cdhomeimprovementsrockford.com \
  --name "n8n-automation"

# Copy the token output
```

### 2. Configure n8n

**Access n8n:**
```
URL: https://automate.cdhomeimprovementsrockford.com
Username: admin (or from N8N_BASIC_AUTH_USER in .env)
Password: (from N8N_BASIC_AUTH_PASSWORD in .env)
```

**Add Invoice Ninja Credentials:**
1. Settings → Credentials → Add Credential
2. Search "Invoice Ninja"
3. Enter:
   - URL: `https://portal.cdhomeimprovementsrockford.com`
   - API Token: (generated above)
4. Test connection
5. Save

**Add Supabase Credentials:**
1. Add Credential → Supabase
2. Enter:
   - Host: `<your-project>.supabase.co`
   - Service Role Key: (from Supabase dashboard)

### 3. Configure Uptime Kuma

**Access Monitoring:**
```
URL: https://status.cdhomeimprovementsrockford.com
```

**First-Time Setup:**
1. Create admin account
2. Add monitors for all services:

**Monitor Configurations:**

| Name | Type | URL | Interval |
|------|------|-----|----------|
| Next.js Website | HTTP(s) | https://cdhomeimprovementsrockford.com | 5 min |
| Invoice Ninja Portal | HTTP(s) | https://portal.cdhomeimprovementsrockford.com | 5 min |
| n8n Automation | HTTP(s) | https://automate.cdhomeimprovementsrockford.com/healthz | 5 min |
| Uptime Kuma (self) | HTTP(s) | https://status.cdhomeimprovementsrockford.com | 10 min |
| MariaDB | Docker Container | cdhi-mariadb | 2 min |

**Configure Notifications:**
- Settings → Notifications
- Add Email/SMS/Slack

### 4. Configure Stripe Webhooks

**Add Webhook Endpoints:**

1. Stripe Dashboard → Developers → Webhooks
2. Add endpoint:

**For Invoice Ninja:**
```
URL: https://portal.cdhomeimprovementsrockford.com/public/api/stripe/webhook
Events:
  - payment_intent.succeeded
  - payment_intent.payment_failed
  - charge.refunded
  - customer.subscription.created
  - customer.subscription.deleted
```

**For Next.js API:**
```
URL: https://cdhomeimprovementsrockford.com/api/webhooks/stripe
Events:
  - payment_intent.succeeded
  - payment_intent.payment_failed
  - charge.succeeded
  - charge.refunded
```

3. Copy webhook secret (`whsec_...`) to `.env` as `STRIPE_WEBHOOK_SECRET`
4. Restart services: `docker compose restart invoiceninja`

---

## Service Management

### Basic Commands

```bash
cd /opt/cdhi-stack

# View all services
docker compose ps

# Start all services
docker compose up -d

# Stop all services
docker compose down

# Restart a specific service
docker compose restart invoiceninja

# View logs
docker compose logs -f              # All services
docker compose logs -f caddy        # Specific service
docker compose logs --tail=100 n8n  # Last 100 lines

# Execute command in container
docker compose exec invoiceninja php artisan cache:clear
docker compose exec mariadb mysql -u root -p
```

### Resource Monitoring

```bash
# View resource usage
docker stats

# View disk usage
docker system df

# Clean up unused resources
docker system prune -a
```

### Updating Services

```bash
# Pull latest images
docker compose pull

# Recreate containers with new images
docker compose up -d

# View what changed
docker compose ps
```

---

## Backup & Recovery

### Automated Backups

**Setup Daily Backups:**

```bash
# Make backup script executable (if not already)
chmod +x /opt/cdhi-stack/backup.sh

# Create backup directory
sudo mkdir -p /backup/cdhi
sudo chown $USER:$USER /backup/cdhi

# Test backup manually
cd /opt/cdhi-stack
./backup.sh

# Add to crontab for daily execution
crontab -e

# Add this line (runs daily at 2 AM):
0 2 * * * /opt/cdhi-stack/backup.sh >> /var/log/cdhi-backup.log 2>&1
```

**Backup Location:**
- `/backup/cdhi/` - All backup files with timestamp
- Retention: 14 days (automatic cleanup)

### Manual Backup

```bash
cd /opt/cdhi-stack

# Run backup script
./backup.sh

# Verify backups
ls -lh /backup/cdhi/
```

### Restore from Backup

**Restore Database:**

```bash
# Stop Invoice Ninja services
docker compose stop invoiceninja invoiceninja-queue invoiceninja-scheduler

# Restore database
gunzip < /backup/cdhi/mariadb_YYYYMMDD_HHMMSS.sql.gz | \
  docker compose exec -T mariadb mysql -u root -p"$DB_ROOT_PASSWORD"

# Restart services
docker compose start invoiceninja invoiceninja-queue invoiceninja-scheduler
```

**Restore n8n Workflows:**

```bash
# Extract backup
tar -xzf /backup/cdhi/n8n_data_YYYYMMDD_HHMMSS.tar.gz -C /tmp/n8n-restore

# Stop n8n
docker compose stop n8n

# Replace volume (CAREFUL!)
docker run --rm -v cdhi-stack_n8n_data:/data -v /tmp/n8n-restore:/backup alpine \
  sh -c "rm -rf /data/* && cp -a /backup/. /data/"

# Restart n8n
docker compose start n8n
```

---

## Troubleshooting

### Common Issues

#### 1. Let's Encrypt Certificate Failure

**Symptoms:** Caddy logs show certificate errors

**Solutions:**

```bash
# Check DNS resolution
dig +short portal.cdhomeimprovementsrockford.com
# Must return your VPS IP

# Check ports are accessible
curl -I http://portal.cdhomeimprovementsrockford.com
# Should get HTTP response (not connection refused)

# Check Caddy logs
docker compose logs caddy | grep -i error

# Force certificate renewal
docker compose exec caddy caddy reload --config /etc/caddy/Caddyfile

# If still failing, use Let's Encrypt staging (for testing)
# Edit Caddyfile: acme_ca https://acme-staging-v02.api.letsencrypt.org/directory
```

#### 2. Invoice Ninja 500 Error

**Solutions:**

```bash
# Check logs
docker compose logs invoiceninja | tail -50

# Clear cache
docker compose exec invoiceninja php artisan cache:clear
docker compose exec invoiceninja php artisan config:clear

# Check database connection
docker compose exec invoiceninja php artisan migrate:status

# Re-run migrations
docker compose exec invoiceninja php artisan migrate --force

# Check APP_KEY is set
docker compose exec invoiceninja env | grep APP_KEY
```

#### 3. n8n Webhooks Not Working

**Solutions:**

```bash
# Check webhook URL
docker compose exec n8n env | grep WEBHOOK_URL

# Test webhook directly
curl -X POST https://automate.cdhomeimprovementsrockford.com/webhook/test

# Check n8n logs
docker compose logs n8n | grep -i error

# Restart n8n
docker compose restart n8n
```

#### 4. MariaDB Won't Start

**Solutions:**

```bash
# Check logs
docker compose logs mariadb

# Check disk space
df -h

# If corrupted, restore from backup
# (See Restore from Backup section)

# Nuclear option (DESTROYS DATA):
docker compose down
docker volume rm cdhi-stack_mariadb_data
docker compose up -d mariadb
# Then re-run migrations
```

### Health Checks

```bash
# Check all service health
docker compose ps

# MariaDB connection test
docker compose exec mariadb mysql -u root -p"$DB_ROOT_PASSWORD" -e "SELECT 1;"

# Invoice Ninja health
curl -f https://portal.cdhomeimprovementsrockford.com/health

# n8n health
curl -f https://automate.cdhomeimprovementsrockford.com/healthz
```

---

## Security Checklist

Before going live, verify:

- [ ] All passwords changed from defaults
- [ ] `.env` file has 600 permissions (`chmod 600 .env`)
- [ ] Firewall active with only ports 22, 80, 443 open
- [ ] SSH key authentication enabled (password auth disabled)
- [ ] Regular automated backups configured
- [ ] Backup restore tested successfully
- [ ] Stripe webhook signatures verified
- [ ] Let's Encrypt certificates issued (not expired)
- [ ] All services showing "healthy" status
- [ ] Uptime Kuma monitors configured with alerts
- [ ] Admin credentials stored in password manager
- [ ] n8n basic auth enabled
- [ ] Invoice Ninja admin panel accessible only via HTTPS
- [ ] Database not accessible from external network
- [ ] Log rotation configured
- [ ] Calendar reminder set for quarterly password rotation

---

## Monitoring

### View Service Status

```bash
# Quick status
docker compose ps

# Detailed status with resources
docker stats

# Check specific service health
docker inspect cdhi-mariadb --format='{{.State.Health.Status}}'
```

### Log Management

**View Logs:**
```bash
# Real-time logs
docker compose logs -f

# Last 100 lines
docker compose logs --tail=100

# Specific service
docker compose logs -f invoiceninja

# Search logs
docker compose logs | grep -i error
```

**Log Rotation:**
```bash
# Docker handles log rotation automatically
# Configure in /etc/docker/daemon.json:
{
  "log-driver": "json-file",
  "log-opts": {
    "max-size": "10m",
    "max-file": "3"
  }
}

# Restart Docker after changes
sudo systemctl restart docker
```

---

## Support & Documentation

- **Invoice Ninja Docs:** https://invoiceninja.github.io/
- **n8n Docs:** https://docs.n8n.io/
- **Caddy Docs:** https://caddyserver.com/docs/
- **Docker Compose Docs:** https://docs.docker.com/compose/

---

## Quick Reference

### Important Files

- `docker-compose.yml` - Service definitions
- `Caddyfile` - Reverse proxy configuration
- `.env` - Environment variables (NEVER commit!)
- `backup.sh` - Automated backup script
- `mariadb-config/my.cnf` - Database tuning

### Important URLs

- Invoice Ninja Portal: https://portal.cdhomeimprovementsrockford.com
- n8n Automation: https://automate.cdhomeimprovementsrockford.com
- Uptime Kuma: https://status.cdhomeimprovementsrockford.com

### Emergency Contacts

- VPS Provider Support: (your provider)
- Domain Registrar Support: (your registrar)
- Stripe Support: https://support.stripe.com

---

**Last Updated:** 2025-01-28
**Version:** 1.0.0
