# CD Home Improvements - Disaster Recovery Runbook

**Complete backup, restore, and disaster recovery procedures**

---

## 📋 Table of Contents

- [Overview](#overview)
- [Backup Strategy](#backup-strategy)
- [Automated Backups](#automated-backups)
- [Manual Backup Procedures](#manual-backup-procedures)
- [Restore Procedures](#restore-procedures)
- [Disaster Scenarios](#disaster-scenarios)
- [Recovery Time Objectives](#recovery-time-objectives)
- [Business Continuity](#business-continuity)
- [Testing & Validation](#testing--validation)

---

## 🎯 Overview

This runbook provides comprehensive disaster recovery procedures for the CD Home Improvements system. It covers backup strategies, restore procedures, and specific disaster scenarios with step-by-step recovery instructions.

### Critical Assets

**Priority 1 (Must Restore First):**
- Supabase PostgreSQL database (customer data, leads, invoices, payments)
- Invoice Ninja MariaDB database (invoice history, client records)
- Stripe payment records (handled by Stripe)

**Priority 2 (Restore Second):**
- n8n workflow configurations and execution history
- Uptime Kuma monitoring history
- Caddy SSL certificates

**Priority 3 (Restore Last):**
- Docker configuration files
- Application code (available in GitHub)
- Documentation

### Recovery Team

**Primary Contact:**
- Name: _____________
- Phone: _____________
- Email: _____________
- Role: Technical Lead

**Secondary Contact:**
- Name: _____________
- Phone: _____________
- Email: _____________
- Role: Business Owner

**External Support:**
- VPS Provider: _____________
- Vercel Support: https://vercel.com/support
- Supabase Support: https://supabase.com/support

---

## 📊 Backup Strategy

### Backup Types

**Full Backups (Weekly)**
- All databases (Supabase + MariaDB)
- All Docker volumes
- All configuration files
- Schedule: Every Sunday at 2:00 AM UTC
- Retention: 4 weeks (28 days)

**Incremental Backups (Daily)**
- Database changes only
- Modified configuration files
- Schedule: Every day at 2:00 AM UTC
- Retention: 14 days

**Real-Time Backups (Continuous)**
- Supabase automatic Point-in-Time Recovery (PITR)
- Retention: 7 days for free tier, 30 days for Pro tier
- Stripe payment records (handled by Stripe)

### Backup Locations

**Primary Storage:**
- Location: `/backup/cdhi/` on VPS
- Capacity: 40GB allocated
- Type: Local disk

**Secondary Storage (Offsite):**
- Location: AWS S3 / Backblaze B2 / rsync.net
- Capacity: 100GB allocated
- Type: Cloud storage
- Encryption: AES-256

**Tertiary Storage (Cold Storage):**
- Location: External hard drive / tape backup
- Frequency: Monthly
- Retention: 12 months

### Data Retention Policy

| Backup Type | Retention | Location |
|------------|-----------|----------|
| Real-time (Supabase PITR) | 7-30 days | Supabase cloud |
| Daily incremental | 14 days | VPS + S3 |
| Weekly full | 4 weeks | VPS + S3 |
| Monthly archive | 12 months | S3 Glacier / External |

---

## 🤖 Automated Backups

### Backup Script Configuration

The automated backup script is located at: `docker/backup.sh`

**Cron Schedule:**
```bash
# Edit crontab
crontab -e

# Add these lines:
# Daily backup at 2:00 AM UTC
0 2 * * * /opt/cdhi-stack/docker/backup.sh daily >> /var/log/cdhi-backup.log 2>&1

# Weekly full backup at 2:00 AM UTC on Sundays
0 2 * * 0 /opt/cdhi-stack/docker/backup.sh full >> /var/log/cdhi-backup.log 2>&1

# Monthly archive at 3:00 AM UTC on 1st of month
0 3 1 * * /opt/cdhi-stack/docker/backup.sh archive >> /var/log/cdhi-backup.log 2>&1
```

**Verify Cron Jobs:**
```bash
# List cron jobs
crontab -l

# Check backup log
tail -f /var/log/cdhi-backup.log
```

### Backup Script Enhancement

Update the backup script to include offsite sync:

```bash
# Add to /opt/cdhi-stack/docker/backup.sh

# Offsite backup to S3 (requires AWS CLI)
sync_to_s3() {
    log "Syncing backups to S3..."

    # Install AWS CLI if not present
    if ! command -v aws &> /dev/null; then
        log "AWS CLI not found, skipping S3 sync"
        return
    fi

    # Sync to S3 bucket
    aws s3 sync /backup/cdhi/ s3://cdhi-backups/ \
        --storage-class STANDARD_IA \
        --exclude "*.tmp" \
        --delete

    log "S3 sync completed"
}

# Add to main() function
main() {
    create_backup_dir
    backup_mariadb
    backup_invoiceninja_storage
    backup_n8n
    backup_uptime_kuma
    backup_caddy
    backup_configs
    cleanup_old_backups
    sync_to_s3  # Add this line
    send_notification "Backup completed successfully"
}
```

### S3 Configuration

```bash
# Install AWS CLI
sudo apt install -y awscli

# Configure AWS credentials
aws configure
# AWS Access Key ID: YOUR_ACCESS_KEY
# AWS Secret Access Key: YOUR_SECRET_KEY
# Default region: us-east-1
# Default output format: json

# Create S3 bucket
aws s3 mb s3://cdhi-backups --region us-east-1

# Enable versioning
aws s3api put-bucket-versioning \
    --bucket cdhi-backups \
    --versioning-configuration Status=Enabled

# Enable lifecycle policy (delete after 90 days)
cat > /tmp/lifecycle.json << 'EOF'
{
    "Rules": [
        {
            "Id": "Delete old backups",
            "Status": "Enabled",
            "Expiration": {
                "Days": 90
            }
        }
    ]
}
EOF

aws s3api put-bucket-lifecycle-configuration \
    --bucket cdhi-backups \
    --lifecycle-configuration file:///tmp/lifecycle.json
```

### Backup Monitoring

**Monitor Backup Success:**

```bash
# Check last backup timestamp
ls -lh /backup/cdhi/ | head -20

# Verify backup integrity
cd /backup/cdhi
for file in *.sql.gz; do
    echo "Checking $file..."
    gunzip -t "$file" && echo "✅ OK" || echo "❌ CORRUPTED"
done

# Check backup size (should be > 10MB for full backup)
du -sh /backup/cdhi/
```

**Alert on Backup Failure:**

Add to backup.sh:

```bash
send_notification() {
    local message="$1"
    local status="$2"  # "success" or "failure"

    # Email notification via Postmark/SendGrid
    if [ "$status" = "failure" ]; then
        curl -X POST https://api.postmarkapp.com/email \
            -H "X-Postmark-Server-Token: ${POSTMARK_API_TOKEN}" \
            -H "Content-Type: application/json" \
            -d "{
                \"From\": \"alerts@cdhomeimprovementsrockford.com\",
                \"To\": \"admin@cdhomeimprovementsrockford.com\",
                \"Subject\": \"🚨 BACKUP FAILED: CD Home Improvements\",
                \"TextBody\": \"${message}\",
                \"MessageStream\": \"outbound\"
            }"
    fi

    # Log to Sentry
    # ... (add Sentry integration if needed)
}

# Usage in backup functions
backup_mariadb() {
    local backup_file="$BACKUP_DIR/mariadb_$DATE.sql"

    if docker-compose exec -T mariadb mysqldump ...; then
        log "✅ MariaDB backup completed"
        send_notification "MariaDB backup successful" "success"
    else
        log "❌ MariaDB backup FAILED"
        send_notification "MariaDB backup FAILED - immediate attention required" "failure"
        exit 1
    fi
}
```

---

## 📝 Manual Backup Procedures

### Full System Backup (Pre-Maintenance)

**Run before any major changes:**

```bash
ssh root@YOUR_VPS_IP

cd /opt/cdhi-stack/docker

# Create timestamped backup directory
BACKUP_DATE=$(date +%Y%m%d_%H%M%S)
mkdir -p /backup/cdhi/manual_$BACKUP_DATE

# 1. Backup all databases
./backup.sh full

# 2. Backup entire Docker volumes
docker-compose stop
tar -czf /backup/cdhi/manual_$BACKUP_DATE/docker-volumes.tar.gz \
    /var/lib/docker/volumes/docker_*

# 3. Backup configuration files
tar -czf /backup/cdhi/manual_$BACKUP_DATE/configs.tar.gz \
    /opt/cdhi-stack/docker/.env \
    /opt/cdhi-stack/docker/docker-compose.yml \
    /opt/cdhi-stack/docker/Caddyfile \
    /opt/cdhi-stack/docker/mariadb-config/

# 4. Restart services
docker-compose up -d

# 5. Verify backup
ls -lh /backup/cdhi/manual_$BACKUP_DATE/

echo "✅ Manual backup completed: /backup/cdhi/manual_$BACKUP_DATE/"
```

### Supabase Database Backup

**Manual Supabase backup:**

```bash
# On local machine
cd /path/to/cd-construction

# Export entire database schema + data
supabase db dump \
    --db-url "postgresql://postgres:PASSWORD@db.PROJECT_ID.supabase.co:5432/postgres" \
    -f supabase_backup_$(date +%Y%m%d_%H%M%S).sql

# Or via pg_dump directly
pg_dump "postgresql://postgres:PASSWORD@db.PROJECT_ID.supabase.co:5432/postgres" \
    > supabase_backup_$(date +%Y%m%d_%H%M%S).sql

# Compress
gzip supabase_backup_*.sql

# Upload to S3
aws s3 cp supabase_backup_*.sql.gz s3://cdhi-backups/supabase/
```

### Invoice Ninja MariaDB Backup

**Manual MariaDB backup:**

```bash
ssh root@YOUR_VPS_IP

cd /opt/cdhi-stack/docker

# Backup single database
docker-compose exec -T mariadb mysqldump \
    -u root -p"$DB_ROOT_PASSWORD" \
    --single-transaction \
    --quick \
    invoiceninja \
    > /backup/cdhi/invoiceninja_manual_$(date +%Y%m%d_%H%M%S).sql

# Compress
gzip /backup/cdhi/invoiceninja_manual_*.sql

echo "✅ Invoice Ninja database backed up"
```

### n8n Workflow Backup

**Export all workflows:**

```bash
# Via n8n UI
1. Login to https://automate.cdhomeimprovementsrockford.com
2. Go to Workflows
3. Select all workflows
4. Click "Export" → Download as JSON
5. Save to: /backup/cdhi/n8n_workflows_$(date +%Y%m%d).json

# Or via n8n CLI (if installed)
n8n export:workflow --all --output=/backup/cdhi/n8n_workflows.json

# Backup n8n data volume
docker run --rm \
    -v docker_n8n_data:/data \
    -v /backup/cdhi:/backup \
    busybox \
    tar -czf /backup/n8n_data_$(date +%Y%m%d_%H%M%S).tar.gz /data
```

### Configuration Backup

**Backup all configuration files:**

```bash
ssh root@YOUR_VPS_IP

# Create config backup
tar -czf /backup/cdhi/configs_$(date +%Y%m%d_%H%M%S).tar.gz \
    /opt/cdhi-stack/docker/.env \
    /opt/cdhi-stack/docker/docker-compose.yml \
    /opt/cdhi-stack/docker/Caddyfile \
    /opt/cdhi-stack/docker/mariadb-config/ \
    /opt/cdhi-stack/docker/backup.sh \
    /etc/cron.d/ \
    /etc/fail2ban/

echo "✅ Configuration files backed up"
```

---

## 🔄 Restore Procedures

### Full System Restore

**Complete system restoration from backup:**

**Prerequisites:**
- New VPS provisioned (or existing VPS accessible)
- Docker and Docker Compose installed
- Backup files accessible

**Estimated Time:** 2-4 hours

**Steps:**

```bash
# 1. SSH into VPS
ssh root@YOUR_VPS_IP

# 2. Install Docker (if not present)
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo apt install -y docker-compose-plugin

# 3. Create application directory
sudo mkdir -p /opt/cdhi-stack
cd /opt/cdhi-stack

# 4. Clone repository (or extract from backup)
git clone https://github.com/YOUR_USERNAME/cd-construction.git .

# 5. Restore configuration files
cd docker
# Upload .env file from backup
scp /path/to/backup/.env root@YOUR_VPS_IP:/opt/cdhi-stack/docker/.env

# 6. Start services (without data yet)
docker-compose up -d

# Wait for services to initialize
sleep 60

# 7. Stop services for data restore
docker-compose stop

# 8. Restore Docker volumes
cd /backup/cdhi
tar -xzf docker-volumes_LATEST.tar.gz -C /

# 9. Restore MariaDB database
gunzip -c mariadb_LATEST.sql.gz | \
    docker-compose exec -T mariadb mysql \
        -u root -p"$DB_ROOT_PASSWORD"

# 10. Restore n8n data
docker run --rm \
    -v docker_n8n_data:/data \
    -v /backup/cdhi:/backup \
    busybox \
    tar -xzf /backup/n8n_data_LATEST.tar.gz -C /

# 11. Restart all services
docker-compose up -d

# 12. Verify services
docker-compose ps
docker-compose logs -f

# 13. Test functionality
curl -I https://portal.cdhomeimprovementsrockford.com
curl -I https://automate.cdhomeimprovementsrockford.com
curl -I https://status.cdhomeimprovementsrockford.com
```

**Verification:**
- [ ] All containers running
- [ ] MariaDB accessible
- [ ] Invoice Ninja UI loads
- [ ] n8n workflows visible
- [ ] Uptime Kuma monitoring active
- [ ] SSL certificates valid

### Supabase Database Restore

**Restore Supabase from backup:**

```bash
# On local machine
cd /path/to/cd-construction

# Download backup from S3
aws s3 cp s3://cdhi-backups/supabase/supabase_backup_LATEST.sql.gz .

# Decompress
gunzip supabase_backup_LATEST.sql.gz

# Connect to Supabase
psql "postgresql://postgres:PASSWORD@db.PROJECT_ID.supabase.co:5432/postgres"

# Drop all tables (CAUTION!)
DROP SCHEMA public CASCADE;
CREATE SCHEMA public;

# Or use Supabase CLI to reset
supabase db reset --linked

# Restore from backup
psql "postgresql://postgres:PASSWORD@db.PROJECT_ID.supabase.co:5432/postgres" \
    < supabase_backup_LATEST.sql

# Verify restoration
psql "postgresql://postgres:PASSWORD@db.PROJECT_ID.supabase.co:5432/postgres" \
    -c "SELECT COUNT(*) FROM clients;" \
    -c "SELECT COUNT(*) FROM leads;" \
    -c "SELECT COUNT(*) FROM invoices;"
```

**Verification:**
- [ ] All tables restored
- [ ] Record counts match backup
- [ ] Views functioning
- [ ] Functions/triggers working

### Point-in-Time Recovery (Supabase)

**Restore to specific timestamp:**

Supabase Pro tier supports Point-in-Time Recovery (PITR):

1. **Via Supabase Dashboard:**
   - Go to: Database → Backups
   - Click "Point in Time Recovery"
   - Select timestamp (e.g., "2 hours ago")
   - Confirm restoration

2. **Via Supabase CLI:**
   ```bash
   # Restore to specific timestamp
   supabase db restore \
       --project-ref YOUR_PROJECT_ID \
       --timestamp "2025-01-28T14:30:00Z"
   ```

**Note:** PITR creates a new database instance. You'll need to:
- Update connection strings in Vercel
- Re-run migrations if needed
- Verify data integrity

### Selective Data Restore

**Restore specific tables only:**

```bash
# Extract specific table from backup
gunzip -c supabase_backup_LATEST.sql.gz | \
    grep -A 10000 "Table structure for table.*clients" | \
    grep -B 10000 "Table structure for table.*properties" \
    > clients_only.sql

# Restore single table
psql "postgresql://..." < clients_only.sql
```

### Invoice Ninja Data Recovery

**Restore Invoice Ninja from MariaDB backup:**

```bash
ssh root@YOUR_VPS_IP

cd /opt/cdhi-stack/docker

# Stop Invoice Ninja services
docker-compose stop invoiceninja invoiceninja-queue invoiceninja-scheduler

# Restore database
gunzip -c /backup/cdhi/invoiceninja_backup_LATEST.sql.gz | \
    docker-compose exec -T mariadb mysql \
        -u root -p"$DB_ROOT_PASSWORD" \
        invoiceninja

# Restore storage volume
docker run --rm \
    -v docker_invoiceninja_storage:/storage \
    -v /backup/cdhi:/backup \
    busybox \
    tar -xzf /backup/invoiceninja_storage_LATEST.tar.gz -C /

# Restart services
docker-compose start invoiceninja invoiceninja-queue invoiceninja-scheduler

# Verify
docker-compose logs -f invoiceninja
```

**Verification:**
- [ ] All clients visible
- [ ] All quotes/invoices present
- [ ] Attachments accessible
- [ ] Settings preserved

---

## 🚨 Disaster Scenarios

### Scenario 1: Complete VPS Failure

**Symptoms:**
- VPS completely unresponsive
- SSH connection fails
- All Docker services down
- Cannot recover VPS

**Recovery Steps:**

**Phase 1: Emergency Response (15 minutes)**
```bash
# 1. Update status page
# Via Uptime Kuma or manual status update
echo "All services temporarily unavailable. Recovery in progress."

# 2. Notify business owner and team
# Email/SMS: "VPS failure detected. Provisioning new server."

# 3. Contact VPS provider
# Check if hardware failure, DDoS, or account issue
```

**Phase 2: Provision New VPS (30 minutes)**
```bash
# 1. Provision new VPS (same specs or better)
# - 2 vCPU, 4GB RAM, 80GB SSD minimum
# - Ubuntu 22.04 LTS

# 2. Update DNS records
# Point A records to new VPS IP:
# @ → NEW_VPS_IP
# portal → NEW_VPS_IP
# automate → NEW_VPS_IP
# status → NEW_VPS_IP

# 3. Wait for DNS propagation (5-10 minutes)
```

**Phase 3: Restore Services (90-120 minutes)**
```bash
# Follow "Full System Restore" procedure above

# 1. Install Docker
# 2. Clone repository
# 3. Restore configuration
# 4. Restore databases
# 5. Restore Docker volumes
# 6. Start services
# 7. Verify functionality
```

**Phase 4: Verification (30 minutes)**
```bash
# 1. Test all services
curl -I https://cdhomeimprovementsrockford.com
curl -I https://portal.cdhomeimprovementsrockford.com
curl -I https://automate.cdhomeimprovementsrockford.com

# 2. Test lead submission
# Submit test lead via website

# 3. Verify data integrity
# Check recent leads, invoices, payments in database

# 4. Update monitoring
# Configure Uptime Kuma monitors

# 5. Notify team
# "Services restored. System operational."
```

**Total Recovery Time:** 2.5-3 hours

**Recovery Point Objective (RPO):** Last successful backup (max 24 hours data loss)

**Recovery Time Objective (RTO):** 4 hours

---

### Scenario 2: Database Corruption

**Symptoms:**
- MariaDB or Supabase queries failing
- Data inconsistencies
- Foreign key constraint violations
- Transaction errors

**Recovery Steps:**

**For MariaDB Corruption:**

```bash
ssh root@YOUR_VPS_IP

cd /opt/cdhi-stack/docker

# 1. Stop Invoice Ninja services
docker-compose stop invoiceninja invoiceninja-queue invoiceninja-scheduler

# 2. Check database integrity
docker-compose exec mariadb mysqlcheck \
    -u root -p"$DB_ROOT_PASSWORD" \
    --check --all-databases

# 3. Attempt repair
docker-compose exec mariadb mysqlcheck \
    -u root -p"$DB_ROOT_PASSWORD" \
    --repair --all-databases

# 4. If repair fails, restore from backup
gunzip -c /backup/cdhi/mariadb_LATEST.sql.gz | \
    docker-compose exec -T mariadb mysql \
        -u root -p"$DB_ROOT_PASSWORD"

# 5. Restart services
docker-compose start invoiceninja invoiceninja-queue invoiceninja-scheduler

# 6. Verify
docker-compose logs -f invoiceninja
```

**For Supabase Corruption:**

```bash
# 1. Check for recent automatic backups
# Supabase Dashboard → Database → Backups

# 2. Restore from automatic backup
# Click "Restore" on most recent backup

# 3. Or restore from manual backup
psql "postgresql://..." < /backup/supabase_backup_LATEST.sql

# 4. Verify data integrity
psql "postgresql://..." -c "
    SELECT tablename, n_live_tup
    FROM pg_stat_user_tables
    ORDER BY n_live_tup DESC;
"
```

**Verification:**
- [ ] All queries executing successfully
- [ ] No constraint violations
- [ ] Record counts correct
- [ ] Recent data present (check timestamps)

---

### Scenario 3: Accidental Data Deletion

**Symptoms:**
- Client reports missing data
- Records deleted from database
- Invoices or payments missing

**Recovery Steps:**

**Step 1: Assess Scope**
```sql
-- Check recent deletions (if using triggers/audit logs)
SELECT * FROM audit_log
WHERE action = 'DELETE'
AND created_at > NOW() - INTERVAL '24 hours';

-- Check specific table
SELECT COUNT(*) FROM clients WHERE deleted_at IS NOT NULL;
SELECT COUNT(*) FROM invoices WHERE deleted_at IS NOT NULL;
```

**Step 2: Restore from PITR (if available)**
```bash
# For Supabase (Pro tier)
supabase db restore \
    --project-ref YOUR_PROJECT_ID \
    --timestamp "2025-01-28T12:00:00Z"  # Before deletion

# This creates new instance - switch connection strings
```

**Step 3: Selective Table Restore**
```bash
# Extract deleted records from backup
gunzip -c /backup/cdhi/supabase_backup_LATEST.sql.gz | \
    grep -A 100 "COPY public.clients" \
    > clients_backup.sql

# Compare with current data
psql "postgresql://..." -c "SELECT client_id FROM clients" > current_clients.txt

# Identify missing records
diff current_clients.txt clients_backup.txt

# Restore missing records
psql "postgresql://..." < clients_backup.sql
```

**Verification:**
- [ ] Deleted records restored
- [ ] No data inconsistencies
- [ ] Foreign key relationships intact
- [ ] Client confirms data is correct

---

### Scenario 4: Ransomware/Security Breach

**Symptoms:**
- Files encrypted
- Unauthorized database access
- Suspicious activity in logs
- Extortion demands

**IMMEDIATE ACTIONS (DO NOT DELAY):**

```bash
# 1. DISCONNECT FROM NETWORK IMMEDIATELY
# SSH into VPS
ssh root@YOUR_VPS_IP

# Disable network on affected systems
sudo ufw deny out
sudo ufw deny in

# 2. Stop all services
docker-compose down

# 3. Preserve evidence
# DO NOT DELETE ANYTHING YET
tar -czf /tmp/forensic-evidence-$(date +%Y%m%d_%H%M%S).tar.gz \
    /opt/cdhi-stack/ \
    /var/log/ \
    /backup/cdhi/

# 4. Notify authorities
# - Local law enforcement
# - FBI IC3 (https://www.ic3.gov)
# - Your insurance provider

# 5. Contact security professionals
# - Incident response team
# - Forensic investigators
```

**Recovery Steps (After Investigation):**

```bash
# 1. Provision CLEAN VPS
# Fresh server, different provider if compromised via provider

# 2. Restore from CLEAN BACKUPS
# Use backup from BEFORE breach occurred
# Verify backup files are not encrypted/compromised

# 3. Change ALL credentials
# - VPS root password
# - Database passwords
# - API keys (Stripe, Supabase, etc.)
# - SSH keys
# - Admin passwords

# 4. Audit security
# - Review firewall rules
# - Update all software
# - Enable 2FA everywhere
# - Implement stricter access controls

# 5. Monitor for re-infection
# Install intrusion detection (fail2ban, OSSEC)
# Enable detailed logging
# Monitor for 30 days minimum
```

**Prevention:**
- Regular backups (automated)
- Offsite backups (S3/Backblaze)
- Immutable backups (version-locked S3)
- Principle of least privilege
- Regular security audits
- Keep software updated

---

### Scenario 5: SSL Certificate Expiration

**Symptoms:**
- Browser shows "Your connection is not private"
- SSL certificate expired warning
- Services unreachable via HTTPS

**Recovery Steps:**

```bash
ssh root@YOUR_VPS_IP

cd /opt/cdhi-stack/docker

# 1. Check Caddy logs
docker-compose logs caddy | grep -i certificate

# 2. Force certificate renewal
docker-compose exec caddy caddy reload --config /etc/caddy/Caddyfile

# 3. If renewal fails, restart Caddy
docker-compose restart caddy

# 4. Check certificate status
openssl s_client -connect cdhomeimprovementsrockford.com:443 -servername cdhomeimprovementsrockford.com < /dev/null | \
    openssl x509 -noout -dates

# 5. If still failing, check Let's Encrypt rate limits
# https://letsencrypt.org/docs/rate-limits/

# 6. Temporary fix: Use staging certificates
# Edit Caddyfile to use Let's Encrypt staging
# (Not for production, but useful for testing)
```

**Verification:**
- [ ] Certificate renewed
- [ ] Valid until > 30 days from now
- [ ] All subdomains have valid certificates
- [ ] No browser warnings

---

## ⏱️ Recovery Time Objectives

| Disaster Scenario | RPO (Data Loss) | RTO (Downtime) | Priority |
|-------------------|-----------------|----------------|----------|
| Complete VPS failure | 24 hours | 4 hours | P0 |
| Database corruption | 24 hours | 2 hours | P0 |
| Accidental deletion | 1 hour (PITR) | 1 hour | P1 |
| Ransomware/breach | 24 hours | 8 hours | P0 |
| SSL certificate issue | 0 hours | 30 minutes | P1 |
| Service crash | 0 hours | 15 minutes | P2 |
| Docker volume loss | 24 hours | 2 hours | P1 |

**Definitions:**
- **RPO (Recovery Point Objective):** Maximum acceptable data loss
- **RTO (Recovery Time Objective):** Maximum acceptable downtime
- **Priority:** P0 = Critical, P1 = High, P2 = Medium

---

## 🏢 Business Continuity

### Temporary Workarounds

**If system is down but recovery is in progress:**

**Lead Collection:**
1. **Google Forms Alternative:**
   - Create Google Form with same fields as lead form
   - Share link: forms.google.com/YOUR_FORM_ID
   - Export responses hourly
   - Manually process leads when system restored

2. **Email Fallback:**
   - Update website with banner: "System maintenance. Email leads to: leads@cdhomeimprovementsrockford.com"
   - Manually create clients in Invoice Ninja when restored

**Invoice/Payment Processing:**
1. **Manual Invoice Ninja Access:**
   - If Supabase down but Invoice Ninja up, continue using Invoice Ninja directly
   - Sync data to Supabase when restored

2. **Stripe Direct:**
   - Send payment links directly from Stripe Dashboard
   - Manually record payments when system restored

3. **Manual Invoices:**
   - Use Invoice Ninja offline mode
   - Email PDF invoices directly
   - Accept checks/wire transfers temporarily

### Communication Plan

**Internal Team Communication:**
```
Subject: [URGENT] System Outage - Recovery in Progress

Team,

System Status: DOWN
Estimated Recovery: [X] hours
Data Loss Risk: [X] hours

Current Actions:
- [Action 1]
- [Action 2]

Next Update: [Time]

Contact: [Technical Lead]
```

**Customer Communication:**
```
Subject: Temporary Service Interruption

Dear Valued Customer,

We are currently experiencing a temporary service interruption.
Our team is working to restore full service as quickly as possible.

Current Status: [Status]
Expected Resolution: [Time]

During this time:
- You can still reach us at: (815) 555-5555
- Email inquiries: info@cdhomeimprovementsrockford.com

We apologize for any inconvenience.

CD Home Improvements Team
```

**Website Banner:**
```html
<!-- Add to top of website -->
<div style="background: #f59e0b; color: white; padding: 1rem; text-align: center;">
  ⚠️ System maintenance in progress. For urgent matters, call (815) 555-5555
</div>
```

---

## 🧪 Testing & Validation

### Disaster Recovery Drills

**Schedule quarterly disaster recovery tests:**

**Q1 Test: Database Restore**
- Delete test database
- Restore from backup
- Verify data integrity
- Document restoration time

**Q2 Test: Full System Restore**
- Provision test VPS
- Restore complete system from backup
- Test all functionality
- Document issues encountered

**Q3 Test: Failover Exercise**
- Simulate VPS failure
- Execute emergency procedures
- Test communication protocols
- Update runbook with findings

**Q4 Test: Ransomware Simulation**
- Encrypt test files
- Execute breach procedures
- Restore from clean backups
- Review security posture

### Backup Verification

**Monthly backup verification checklist:**

```bash
# 1. List recent backups
ls -lh /backup/cdhi/ | head -20

# 2. Verify backup integrity
for file in /backup/cdhi/*.sql.gz; do
    echo "Testing $file..."
    gunzip -t "$file" && echo "✅ OK" || echo "❌ FAILED"
done

# 3. Test random backup restore (on test environment)
# Select random backup from last month
RANDOM_BACKUP=$(ls /backup/cdhi/*.sql.gz | shuf -n 1)
echo "Testing restore from: $RANDOM_BACKUP"

# Create test database
docker-compose exec mariadb mysql -u root -p"$DB_ROOT_PASSWORD" \
    -e "CREATE DATABASE test_restore;"

# Restore backup
gunzip -c "$RANDOM_BACKUP" | \
    docker-compose exec -T mariadb mysql -u root -p"$DB_ROOT_PASSWORD" test_restore

# Verify record counts
docker-compose exec mariadb mysql -u root -p"$DB_ROOT_PASSWORD" test_restore \
    -e "SHOW TABLES; SELECT COUNT(*) FROM clients;"

# Cleanup
docker-compose exec mariadb mysql -u root -p"$DB_ROOT_PASSWORD" \
    -e "DROP DATABASE test_restore;"

echo "✅ Backup verification complete"
```

**Verification Checklist:**
- [ ] All scheduled backups completed in last week
- [ ] Backup files not corrupted (gunzip -t passes)
- [ ] Backup sizes reasonable (> 10MB for full backup)
- [ ] Offsite backups synced to S3
- [ ] Test restore successful
- [ ] Documentation up to date

---

## 📞 Emergency Contacts

### Internal Team

**Technical Lead**
- Name: _____________
- Phone: _____________
- Email: _____________
- Available: 24/7 (first 48 hours after launch)

**Database Administrator**
- Name: _____________
- Phone: _____________
- Email: _____________
- Available: Business hours + on-call

**Business Owner**
- Name: _____________
- Phone: _____________
- Email: _____________
- Available: Business hours

### External Support

**VPS Provider**
- Provider: _____________
- Support Phone: _____________
- Support Email: _____________
- Account Number: _____________

**Vercel Support**
- Email: support@vercel.com
- Dashboard: https://vercel.com/support

**Supabase Support**
- Email: support@supabase.com
- Dashboard: https://supabase.com/support

**Stripe Support**
- Phone: 1-888-926-2289
- Email: https://support.stripe.com/

**Security Incident Response**
- FBI IC3: https://www.ic3.gov
- CISA: 1-888-282-0870
- Cyber Insurance: _____________

---

## 📋 Disaster Recovery Checklist

**Print this checklist and keep accessible:**

### Immediate Response (0-15 minutes)

- [ ] Identify the disaster type
- [ ] Assess severity (P0/P1/P2)
- [ ] Alert technical lead
- [ ] Update status page
- [ ] Document incident start time

### Assessment Phase (15-30 minutes)

- [ ] Determine scope of impact
- [ ] Identify affected services
- [ ] Estimate data loss window (RPO)
- [ ] Estimate recovery time (RTO)
- [ ] Notify business owner

### Recovery Phase (30 minutes - 4 hours)

- [ ] Execute recovery procedures (see scenarios above)
- [ ] Verify backup availability
- [ ] Provision new resources if needed
- [ ] Restore data from backups
- [ ] Restart services
- [ ] Test functionality

### Verification Phase (1-2 hours)

- [ ] Test all critical functions
- [ ] Verify data integrity
- [ ] Check recent transactions
- [ ] Run end-to-end tests
- [ ] Monitor for errors

### Communication Phase (Ongoing)

- [ ] Update team every 30 minutes
- [ ] Notify customers if downtime > 1 hour
- [ ] Update status page
- [ ] Document recovery progress

### Post-Incident (24 hours after)

- [ ] Write incident report
- [ ] Conduct post-mortem meeting
- [ ] Identify root cause
- [ ] Implement preventive measures
- [ ] Update runbook with lessons learned

---

**Last Updated:** 2025-01-28
**Version:** 1.0
**Next Review:** 2025-04-28 (Quarterly)

**Maintained by:** CD Home Improvements DevOps Team
