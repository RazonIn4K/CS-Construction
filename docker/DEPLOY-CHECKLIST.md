# CS-Construction Docker Stack - Deployment Checklist

**Quick reference guide for deploying the complete infrastructure**

---

## Pre-Deployment (Do These First)

### ✅ DNS Configuration
- [ ] `portal.cdhomeimprovementsrockford.com` → VPS IP
- [ ] `automate.cdhomeimprovementsrockford.com` → VPS IP
- [ ] `status.cdhomeimprovementsrockford.com` → VPS IP
- [ ] Wait 10-15 minutes for DNS propagation
- [ ] Verify with: `dig +short portal.cdhomeimprovementsrockford.com`

### ✅ VPS Provisioning
- [ ] VPS created (minimum: 2 vCPU, 4GB RAM, 80GB SSD)
- [ ] Ubuntu 22.04 or 24.04 LTS installed
- [ ] SSH access confirmed
- [ ] Root or sudo access available

### ✅ Gather Credentials
- [ ] Stripe Live API keys (`pk_live_...`, `sk_live_...`)
- [ ] Postmark or SendGrid API token
- [ ] Supabase project URL and anon key (already have)
- [ ] Password manager ready for storing generated secrets

---

## VPS Setup

### 1. Install Docker
```bash
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker $USER
newgrp docker
sudo apt install docker-compose-plugin
```

- [ ] Docker installed
- [ ] Docker Compose V2 installed
- [ ] User added to docker group

### 2. Configure Firewall
```bash
sudo ufw allow 22/tcp
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw enable
```

- [ ] UFW firewall enabled
- [ ] Only ports 22, 80, 443 open
- [ ] SSH still accessible after enabling

### 3. Upload Files
```bash
cd /opt
git clone <your-repo> cdhi-stack
cd cdhi-stack/docker
```

OR

```bash
scp -r docker/* user@vps-ip:/opt/cdhi-stack/
```

- [ ] All Docker files uploaded
- [ ] Directory structure verified

---

## Configuration

### 4. Create .env File
```bash
cd /opt/cdhi-stack
cp .env.docker.example .env

# Generate secrets
echo "DB_ROOT_PASSWORD=$(openssl rand -base64 32)" >> .env
echo "DB_PASSWORD=$(openssl rand -base64 32)" >> .env
echo "N8N_ENCRYPTION_KEY=$(openssl rand -hex 32)" >> .env
echo "N8N_BASIC_AUTH_PASSWORD=$(openssl rand -base64 16)" >> .env

chmod 600 .env
nano .env  # Fill in remaining values
```

- [ ] `.env` file created from template
- [ ] Secrets auto-generated
- [ ] Stripe keys added
- [ ] Email credentials added
- [ ] All domain URLs verified
- [ ] File permissions set to 600

### 5. Start Database
```bash
docker compose up -d mariadb
sleep 60
docker compose ps mariadb
```

- [ ] MariaDB container running
- [ ] Status shows "healthy"
- [ ] Logs show "ready for connections"

### 6. Generate Invoice Ninja APP_KEY
```bash
docker compose up -d invoiceninja
docker compose exec invoiceninja php artisan key:generate --show

# Copy output and add to .env
nano .env
# Set: INVOICENINJA_APP_KEY=base64:XXXXXXX

docker compose restart invoiceninja
```

- [ ] APP_KEY generated
- [ ] Added to .env file
- [ ] Invoice Ninja restarted

---

## Deployment

### 7. Initialize Invoice Ninja
```bash
# Run migrations
docker compose exec invoiceninja php artisan migrate:fresh --seed --force

# Create admin account
docker compose exec invoiceninja php artisan ninja:create-account \
  --email admin@cdhomeimprovementsrockford.com \
  --password <YOUR_SECURE_PASSWORD>
```

- [ ] Database migrations completed
- [ ] Admin account created
- [ ] Credentials saved in password manager

### 8. Start All Services
```bash
docker compose up -d
docker compose ps
```

- [ ] All 7 containers running
- [ ] All services show "healthy" or "Up"
- [ ] No restart loops

### 9. Verify HTTPS
```bash
# Watch for certificate issuance
docker compose logs -f caddy

# Test endpoints
curl -I https://portal.cdhomeimprovementsrockford.com
curl -I https://automate.cdhomeimprovementsrockford.com
curl -I https://status.cdhomeimprovementsrockford.com
```

- [ ] Let's Encrypt certificates issued
- [ ] All 3 domains return HTTP/2 200
- [ ] No certificate errors in browser

---

## Service Configuration

### 10. Configure Invoice Ninja
**URL:** https://portal.cdhomeimprovementsrockford.com

- [ ] Logged in with admin credentials
- [ ] Settings → Payment Gateways → Stripe configured
- [ ] Stripe keys entered (live mode)
- [ ] Test payment processed successfully
- [ ] API token generated for n8n

### 11. Configure n8n
**URL:** https://automate.cdhomeimprovementsrockford.com

- [ ] Logged in with basic auth
- [ ] Invoice Ninja credentials added
- [ ] Supabase credentials added
- [ ] Test workflow created
- [ ] Webhook test successful

### 12. Configure Uptime Kuma
**URL:** https://status.cdhomeimprovementsrockford.com

- [ ] Admin account created
- [ ] Monitors added for all 5 services
- [ ] Email notifications configured
- [ ] Test alert sent successfully
- [ ] All monitors showing green

### 13. Configure Stripe Webhooks

**Invoice Ninja Webhook:**
```
URL: https://portal.cdhomeimprovementsrockford.com/public/api/stripe/webhook
Events: payment_intent.succeeded, payment_intent.payment_failed, charge.refunded
```

**Next.js API Webhook:**
```
URL: https://cdhomeimprovementsrockford.com/api/webhooks/stripe
Events: payment_intent.succeeded, payment_intent.payment_failed, charge.refunded
```

- [ ] Invoice Ninja webhook configured in Stripe
- [ ] Next.js webhook configured in Stripe
- [ ] Webhook secrets copied to .env
- [ ] Services restarted
- [ ] Test webhooks sent successfully

---

## Backup & Monitoring

### 14. Setup Automated Backups
```bash
chmod +x /opt/cdhi-stack/backup.sh
sudo mkdir -p /backup/cdhi
sudo chown $USER:$USER /backup/cdhi

# Test backup
./backup.sh

# Add to cron
crontab -e
# Add: 0 2 * * * /opt/cdhi-stack/backup.sh >> /var/log/cdhi-backup.log 2>&1
```

- [ ] Backup script executable
- [ ] Backup directory created
- [ ] Manual backup test successful
- [ ] Cron job configured
- [ ] Backup verification completed

---

## Security Hardening

### 15. Final Security Checks

- [ ] All default passwords changed
- [ ] `.env` file has 600 permissions
- [ ] Firewall active and configured
- [ ] SSH key authentication enabled
- [ ] Password authentication disabled (optional but recommended)
- [ ] Fail2ban installed (optional but recommended)
- [ ] Let's Encrypt certificates valid
- [ ] All admin credentials stored in password manager

---

## Testing

### 16. End-to-End Flow Test

**Lead Submission:**
- [ ] Submit test lead via website form
- [ ] Lead appears in Supabase
- [ ] n8n workflow triggers
- [ ] Client created in Invoice Ninja
- [ ] Quote created in Invoice Ninja
- [ ] Client receives portal email

**Payment Processing:**
- [ ] Open quote in portal
- [ ] Approve quote
- [ ] Convert to invoice
- [ ] Pay via Stripe (test card: 4242 4242 4242 4242)
- [ ] Payment recorded in Supabase
- [ ] Invoice marked as paid
- [ ] Receipt email sent

---

## Go-Live

### 17. Production Cutover

- [ ] All tests passing
- [ ] All services healthy
- [ ] Monitoring active
- [ ] Backups running
- [ ] Team trained on accessing services
- [ ] Support contacts documented
- [ ] Rollback plan documented
- [ ] Announcement sent (if applicable)

---

## Post-Launch (First 48 Hours)

### 18. Monitor Closely

- [ ] Check Uptime Kuma dashboard hourly
- [ ] Review Caddy logs for errors
- [ ] Monitor Sentry for exceptions
- [ ] Verify backups running successfully
- [ ] Test payment flow with real transaction
- [ ] Confirm webhook delivery in Stripe dashboard
- [ ] Check n8n execution logs

---

## Maintenance Schedule

### Daily
- Monitor Uptime Kuma alerts
- Review critical error logs

### Weekly
- Check backup logs
- Review resource usage (`docker stats`)
- Update Docker images if needed

### Monthly
- Test backup restore procedure
- Review security updates
- Check SSL certificate expiry dates
- Rotate logs

### Quarterly
- Rotate passwords and API keys
- Review and update firewall rules
- Audit user accounts
- Performance optimization review

---

## Troubleshooting Quick Commands

```bash
# Check all services
docker compose ps

# Restart a service
docker compose restart invoiceninja

# View logs
docker compose logs -f

# Health check
docker inspect cdhi-mariadb --format='{{.State.Health.Status}}'

# Resource usage
docker stats

# Emergency stop all
docker compose down

# Emergency start all
docker compose up -d
```

---

## Support Contacts

- **VPS Provider:** _______________
- **Domain Registrar:** _______________
- **Stripe Support:** https://support.stripe.com
- **Invoice Ninja Community:** https://forum.invoiceninja.com
- **n8n Community:** https://community.n8n.io

---

## Notes

- Document any custom configurations here
- Track any deviations from standard deployment
- Note any issues encountered and resolutions

---

**Deployment Date:** __________
**Deployed By:** __________
**VPS Provider:** __________
**VPS IP:** __________

**Status:**
- [ ] Deployed to production
- [ ] All checks passed
- [ ] Team notified
- [ ] Documentation updated
