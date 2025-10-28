# CD Home Improvements - Security Hardening Guide

**Production security configuration and hardening procedures**

---

## 📋 Table of Contents

- [Overview](#overview)
- [Server Hardening](#server-hardening)
- [Docker Security](#docker-security)
- [Application Security](#application-security)
- [Database Security](#database-security)
- [Network Security](#network-security)
- [Access Control](#access-control)
- [Monitoring & Auditing](#monitoring--auditing)
- [Incident Response](#incident-response)
- [Security Checklist](#security-checklist)

---

## 🎯 Overview

This guide provides comprehensive security hardening procedures for the CD Home Improvements production environment. Follow these guidelines to protect against common attack vectors and maintain security best practices.

### Security Principles

1. **Defense in Depth** - Multiple layers of security
2. **Principle of Least Privilege** - Minimum necessary access
3. **Zero Trust** - Verify everything, trust nothing
4. **Security by Default** - Secure configurations out of the box
5. **Regular Updates** - Keep all software current

### Threat Model

**Assets to Protect:**
- Customer PII (names, addresses, emails, phone numbers)
- Payment information (handled by Stripe, not stored)
- Business data (quotes, invoices, financial records)
- System credentials and API keys
- Application code and intellectual property

**Threat Actors:**
- Automated bots and scanners
- Opportunistic attackers
- Competitors
- Disgruntled customers/employees
- Nation-state actors (low probability)

**Attack Vectors:**
- SQL injection
- Cross-site scripting (XSS)
- Cross-site request forgery (CSRF)
- Brute-force attacks
- DDoS attacks
- Phishing and social engineering
- Supply chain attacks
- Insider threats

---

## 🖥️ Server Hardening

### Initial VPS Security

**Update and patch system:**

```bash
# SSH into VPS
ssh root@YOUR_VPS_IP

# Update package lists
sudo apt update

# Upgrade all packages
sudo apt upgrade -y

# Remove unnecessary packages
sudo apt autoremove -y

# Enable automatic security updates
sudo apt install -y unattended-upgrades
sudo dpkg-reconfigure -plow unattended-upgrades

# Configure automatic updates
cat > /etc/apt/apt.conf.d/50unattended-upgrades << 'EOF'
Unattended-Upgrade::Allowed-Origins {
    "${distro_id}:${distro_codename}-security";
    "${distro_id}ESMApps:${distro_codename}-apps-security";
};
Unattended-Upgrade::AutoFixInterruptedDpkg "true";
Unattended-Upgrade::Remove-Unused-Dependencies "true";
Unattended-Upgrade::Automatic-Reboot "true";
Unattended-Upgrade::Automatic-Reboot-Time "03:00";
EOF
```

### SSH Hardening

**Disable password authentication, enforce key-based auth:**

```bash
# Backup original config
sudo cp /etc/ssh/sshd_config /etc/ssh/sshd_config.backup

# Edit SSH config
sudo nano /etc/ssh/sshd_config

# Apply these settings:
Port 22  # Consider changing to non-standard port
PermitRootLogin prohibit-password  # Or "no" for even stricter security
PasswordAuthentication no
PubkeyAuthentication yes
ChallengeResponseAuthentication no
UsePAM no
X11Forwarding no
MaxAuthTries 3
MaxSessions 2
ClientAliveInterval 300
ClientAliveCountMax 2
AllowUsers cdhi-admin  # Replace with your username

# Restart SSH
sudo systemctl restart sshd

# Test SSH connection in NEW terminal before closing current session
ssh -i ~/.ssh/id_rsa cdhi-admin@YOUR_VPS_IP
```

**Configure SSH key authentication:**

```bash
# On your local machine
ssh-keygen -t ed25519 -C "cdhi-admin@cdhomeimprovements"

# Copy public key to server
ssh-copy-id -i ~/.ssh/id_ed25519.pub cdhi-admin@YOUR_VPS_IP

# Test key-based login
ssh -i ~/.ssh/id_ed25519 cdhi-admin@YOUR_VPS_IP
```

### Firewall Configuration

**Configure UFW (Uncomplicated Firewall):**

```bash
# Install UFW
sudo apt install -y ufw

# Set default policies
sudo ufw default deny incoming
sudo ufw default allow outgoing

# Allow SSH (IMPORTANT: Do this first!)
sudo ufw allow 22/tcp comment 'SSH'

# Allow HTTP/HTTPS
sudo ufw allow 80/tcp comment 'HTTP'
sudo ufw allow 443/tcp comment 'HTTPS'

# Enable firewall
sudo ufw enable

# Verify status
sudo ufw status verbose

# Expected output:
# Status: active
# To                         Action      From
# --                         ------      ----
# 22/tcp                     ALLOW       Anywhere
# 80/tcp                     ALLOW       Anywhere
# 443/tcp                    ALLOW       Anywhere
```

**Advanced firewall rules (rate limiting):**

```bash
# Limit SSH connection attempts
sudo ufw limit 22/tcp comment 'Rate limit SSH'

# Limit HTTP requests (anti-DDoS)
sudo ufw limit 80/tcp comment 'Rate limit HTTP'
sudo ufw limit 443/tcp comment 'Rate limit HTTPS'

# Block specific IP
sudo ufw deny from 192.0.2.10 comment 'Blocked suspicious IP'

# Allow from specific IP only (admin access)
# sudo ufw allow from YOUR_IP_ADDRESS to any port 22 comment 'Admin SSH access'
```

### Fail2Ban Configuration

**Protect against brute-force attacks:**

```bash
# Install Fail2Ban
sudo apt install -y fail2ban

# Create local configuration
sudo cp /etc/fail2ban/jail.conf /etc/fail2ban/jail.local

# Configure Fail2Ban
sudo nano /etc/fail2ban/jail.local

# Add/modify these settings:
[DEFAULT]
bantime = 3600
findtime = 600
maxretry = 3
destemail = admin@cdhomeimprovementsrockford.com
sendername = Fail2Ban

[sshd]
enabled = true
port = 22
filter = sshd
logpath = /var/log/auth.log
maxretry = 3
bantime = 7200

[caddy]
enabled = true
port = 80,443
filter = caddy
logpath = /var/log/caddy/access.log
maxretry = 50
findtime = 300
bantime = 3600
```

**Create Caddy filter:**

```bash
# Create Caddy Fail2Ban filter
sudo nano /etc/fail2ban/filter.d/caddy.conf

# Add:
[Definition]
failregex = ^<HOST> - .* "(GET|POST|HEAD).*" (404|403|401)
ignoreregex =
```

**Start Fail2Ban:**

```bash
# Enable and start
sudo systemctl enable fail2ban
sudo systemctl start fail2ban

# Check status
sudo fail2ban-client status

# Check SSH jail
sudo fail2ban-client status sshd

# View banned IPs
sudo fail2ban-client get sshd banned

# Manually unban IP (if needed)
sudo fail2ban-client set sshd unbanip 192.0.2.10
```

### System Auditing

**Enable auditd for security monitoring:**

```bash
# Install auditd
sudo apt install -y auditd

# Configure audit rules
sudo nano /etc/audit/rules.d/audit.rules

# Add these rules:
# Monitor file changes
-w /etc/passwd -p wa -k passwd_changes
-w /etc/shadow -p wa -k shadow_changes
-w /etc/sudoers -p wa -k sudoers_changes

# Monitor system calls
-a exit,always -F arch=b64 -S execve -k exec

# Monitor Docker
-w /usr/bin/docker -p x -k docker
-w /var/lib/docker/ -p wa -k docker

# Monitor sensitive directories
-w /opt/cdhi-stack/ -p wa -k cdhi_changes

# Reload rules
sudo augenrules --load

# Start auditd
sudo systemctl enable auditd
sudo systemctl start auditd

# Search audit logs
sudo ausearch -k passwd_changes
sudo ausearch -k docker
```

---

## 🐳 Docker Security

### Docker Daemon Hardening

**Configure Docker securely:**

```bash
# Create Docker daemon configuration
sudo mkdir -p /etc/docker
sudo nano /etc/docker/daemon.json

# Add:
{
  "log-driver": "json-file",
  "log-opts": {
    "max-size": "10m",
    "max-file": "3"
  },
  "live-restore": true,
  "userland-proxy": false,
  "no-new-privileges": true,
  "icc": false,
  "userns-remap": "default"
}

# Restart Docker
sudo systemctl restart docker
```

### Container Security

**Secure docker-compose.yml configuration:**

```yaml
# Add to docker/docker-compose.yml

services:
  mariadb:
    security_opt:
      - no-new-privileges:true
    cap_drop:
      - ALL
    cap_add:
      - CHOWN
      - SETGID
      - SETUID
    read_only: true
    tmpfs:
      - /tmp:noexec,nosuid,size=64M
    healthcheck:
      test: ["CMD", "healthcheck.sh", "--connect", "--innodb_initialized"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 40s

  invoiceninja:
    security_opt:
      - no-new-privileges:true
    cap_drop:
      - ALL
    cap_add:
      - CHOWN
      - SETGID
      - SETUID
      - NET_BIND_SERVICE

  n8n:
    security_opt:
      - no-new-privileges:true
    cap_drop:
      - ALL
    environment:
      NODE_TLS_REJECT_UNAUTHORIZED: "1"  # Enforce TLS verification

  caddy:
    security_opt:
      - no-new-privileges:true
    cap_drop:
      - ALL
    cap_add:
      - NET_BIND_SERVICE
```

### Docker Image Security

**Scan images for vulnerabilities:**

```bash
# Install Trivy (vulnerability scanner)
sudo apt install -y wget apt-transport-https gnupg lsb-release
wget -qO - https://aquasecurity.github.io/trivy-repo/deb/public.key | sudo apt-key add -
echo "deb https://aquasecurity.github.io/trivy-repo/deb $(lsb_release -sc) main" | sudo tee -a /etc/apt/sources.list.d/trivy.list
sudo apt update
sudo apt install -y trivy

# Scan Docker images
cd /opt/cdhi-stack/docker

trivy image mariadb:10.11
trivy image invoiceninja/invoiceninja:5
trivy image n8nio/n8n:latest
trivy image louislam/uptime-kuma:1
trivy image caddy:2-alpine

# Scan for HIGH and CRITICAL only
trivy image --severity HIGH,CRITICAL invoiceninja/invoiceninja:5

# Generate report
trivy image --format json --output report.json invoiceninja/invoiceninja:5
```

**Pin image versions:**

```yaml
# Update docker-compose.yml to use specific versions
services:
  mariadb:
    image: mariadb:10.11.6  # Pin to specific version

  invoiceninja:
    image: invoiceninja/invoiceninja:5.8.32  # Pin to specific version

  n8n:
    image: n8nio/n8n:1.23.1  # Pin to specific version

  uptime-kuma:
    image: louislam/uptime-kuma:1.23.11  # Pin to specific version

  caddy:
    image: caddy:2.7.6-alpine  # Pin to specific version
```

### Docker Network Security

**Isolate networks:**

```yaml
# docker-compose.yml already configured with network isolation

networks:
  frontend:
    driver: bridge
    driver_opts:
      com.docker.network.bridge.name: cdhi_frontend
      com.docker.network.bridge.enable_ip_masquerade: "true"

  backend:
    driver: bridge
    internal: true  # No internet access
    driver_opts:
      com.docker.network.bridge.name: cdhi_backend
```

**Verify network isolation:**

```bash
# Test that backend network has no internet access
docker run --rm --network docker_backend alpine ping -c 3 8.8.8.8

# Expected: "ping: bad address '8.8.8.8'" or timeout
```

---

## 🔐 Application Security

### Environment Variable Security

**Secure .env file:**

```bash
cd /opt/cdhi-stack/docker

# Set correct permissions (owner read/write only)
chmod 600 .env

# Verify
ls -l .env
# Expected: -rw------- 1 root root

# Restrict directory access
chmod 700 /opt/cdhi-stack/docker

# Audit .env file for weak passwords
grep -i "password" .env | awk -F'=' '{print $1, length($2), "chars"}'

# All passwords should be 32+ characters
```

**Rotate secrets regularly:**

```bash
# Generate new secure passwords
openssl rand -base64 32

# Update .env with new passwords
nano .env

# Restart affected services
docker-compose up -d --force-recreate mariadb invoiceninja n8n

# Verify services started correctly
docker-compose ps
docker-compose logs -f --tail=100
```

### API Security

**Rate limiting in Caddy:**

```caddyfile
# Update docker/Caddyfile

# Global rate limiting
(rate_limit) {
    rate_limit {
        zone api {
            key {remote_host}
            events 100
            window 1m
        }
    }
}

# Apply to API routes
cdhomeimprovementsrockford.com {
    @api {
        path /api/*
    }

    handle @api {
        import rate_limit
        reverse_proxy vercel:3000
    }

    # Rest of configuration...
}
```

**API key rotation:**

```bash
# Generate new API keys
ADMIN_API_KEY=$(openssl rand -hex 32)
STRIPE_WEBHOOK_SECRET=whsec_...  # From Stripe dashboard
N8N_API_TOKEN=$(openssl rand -hex 32)

# Update Vercel environment variables
vercel env add ADMIN_API_KEY production
vercel env add STRIPE_WEBHOOK_SECRET production

# Redeploy
vercel --prod
```

### Input Validation

**Ensure all inputs validated (already implemented):**

```typescript
// types/schemas.ts - Already implemented
export const LeadSubmissionSchema = z.object({
  first_name: z.string().min(1).max(100),
  last_name: z.string().min(1).max(100),
  email: z.string().email().max(255),
  phone: z.string().regex(/^[\d\s\-\(\)\+]+$/).max(20).optional(),
  street_address: z.string().min(1).max(200),
  city: z.string().min(1).max(100),
  state: z.string().length(2).regex(/^[A-Z]{2}$/),
  zip_code: z.string().regex(/^\d{5}$/),
  service_type: z.enum([...]),
  message: z.string().max(1000).optional(),
});
```

**Additional validation layers:**

```typescript
// lib/validation.ts (create this file)

export function sanitizeInput(input: string): string {
  // Remove potential XSS
  return input
    .replace(/[<>]/g, '')
    .replace(/javascript:/gi, '')
    .replace(/on\w+=/gi, '')
    .trim();
}

export function validateEmail(email: string): boolean {
  // RFC 5322 compliant
  const regex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
  return regex.test(email);
}

export function validatePhone(phone: string): boolean {
  // US phone numbers only
  const cleaned = phone.replace(/\D/g, '');
  return cleaned.length === 10 || cleaned.length === 11;
}

export function sanitizeSqlInput(input: string): string {
  // Prevent SQL injection (use parameterized queries instead)
  return input.replace(/['";\\]/g, '');
}
```

### Content Security Policy

**Configure CSP headers in next.config.ts:**

```typescript
// next.config.ts
const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,

  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://js.stripe.com",
              "style-src 'self' 'unsafe-inline'",
              "img-src 'self' data: https:",
              "font-src 'self' data:",
              "connect-src 'self' https://*.supabase.co https://api.stripe.com",
              "frame-src https://js.stripe.com",
              "object-src 'none'",
              "base-uri 'self'",
              "form-action 'self'",
              "frame-ancestors 'none'",
              "upgrade-insecure-requests",
            ].join('; '),
          },
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=()',
          },
        ],
      },
    ];
  },
};
```

---

## 🗄️ Database Security

### PostgreSQL (Supabase) Security

**Enable Row Level Security (RLS):**

```sql
-- Run in Supabase SQL Editor

-- Enable RLS on all tables
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE properties ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE quotes ENABLE ROW LEVEL SECURITY;
ALTER TABLE line_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE client_addresses ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE webhook_event_dlq ENABLE ROW LEVEL SECURITY;

-- Example RLS policy (restrict to service role)
CREATE POLICY "Service role full access" ON clients
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Public can only insert leads (via API)
CREATE POLICY "Public can insert leads" ON leads
  FOR INSERT
  TO anon
  WITH CHECK (true);

-- Authenticated users can read their own data
CREATE POLICY "Users can read own data" ON clients
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);  -- If you add user_id column
```

**Database encryption:**

```sql
-- Enable pgcrypto extension (already in migration)
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Encrypt sensitive data
CREATE TABLE encrypted_data (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID REFERENCES clients(client_id),
  ssn_encrypted BYTEA,  -- Store encrypted SSN
  credit_card_encrypted BYTEA,  -- Never store full CC numbers!
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Encrypt function
CREATE OR REPLACE FUNCTION encrypt_data(plaintext TEXT, key TEXT)
RETURNS BYTEA AS $$
  SELECT pgp_sym_encrypt(plaintext, key);
$$ LANGUAGE SQL IMMUTABLE;

-- Decrypt function (service role only)
CREATE OR REPLACE FUNCTION decrypt_data(ciphertext BYTEA, key TEXT)
RETURNS TEXT AS $$
  SELECT pgp_sym_decrypt(ciphertext, key);
$$ LANGUAGE SQL IMMUTABLE;
```

**Database backups:**

```bash
# Already configured in DISASTER-RECOVERY.md
# Ensure encrypted backups
pg_dump "postgresql://..." | gzip | gpg --encrypt --recipient admin@cdhomeimprovementsrockford.com > backup.sql.gz.gpg

# Decrypt backup
gpg --decrypt backup.sql.gz.gpg | gunzip > backup.sql
```

### MariaDB Security

**Secure MariaDB configuration:**

```bash
# Create secure MariaDB config
sudo nano /opt/cdhi-stack/docker/mariadb-config/security.cnf

# Add:
[mysqld]
# Disable local infile
local-infile=0

# Bind to internal network only (already configured)
bind-address=0.0.0.0

# Require secure connections
require_secure_transport=OFF  # Internal Docker network already isolated

# Disable symbolic links
symbolic-links=0

# Max connections
max_connections=100

# Connection timeout
wait_timeout=300
interactive_timeout=300

# Log security events
log_error=/var/log/mysql/error.log

# Restart MariaDB
docker-compose restart mariadb
```

**Database user privileges:**

```bash
docker-compose exec mariadb mysql -u root -p"$DB_ROOT_PASSWORD"

-- Create read-only user for reporting
CREATE USER 'readonly'@'%' IDENTIFIED BY 'SECURE_PASSWORD';
GRANT SELECT ON invoiceninja.* TO 'readonly'@'%';
FLUSH PRIVILEGES;

-- Audit user privileges
SELECT User, Host, Select_priv, Insert_priv, Update_priv, Delete_priv
FROM mysql.user;

-- Remove anonymous users
DELETE FROM mysql.user WHERE User='';
FLUSH PRIVILEGES;

-- Remove test database
DROP DATABASE IF EXISTS test;
```

**SQL injection prevention:**

```typescript
// Always use parameterized queries (already implemented)

// ✅ GOOD (Supabase client - safe)
const { data } = await supabase
  .from('clients')
  .select('*')
  .eq('email', userInput);

// ❌ BAD (Raw SQL - vulnerable)
const query = `SELECT * FROM clients WHERE email = '${userInput}'`;
```

---

## 🌐 Network Security

### HTTPS Configuration

**Enforce HTTPS everywhere:**

```caddyfile
# docker/Caddyfile - Already configured

# Automatic HTTPS redirect
http://cdhomeimprovementsrockford.com {
    redir https://cdhomeimprovementsrockford.com{uri} permanent
}

# HTTPS with security headers
cdhomeimprovementsrockford.com {
    header {
        Strict-Transport-Security "max-age=31536000; includeSubDomains; preload"
        X-Content-Type-Options "nosniff"
        X-Frame-Options "SAMEORIGIN"
        X-XSS-Protection "1; mode=block"
        Referrer-Policy "strict-origin-when-cross-origin"
        Permissions-Policy "geolocation=(), microphone=(), camera=()"
    }

    encode gzip

    reverse_proxy nextjs:3000
}
```

**HSTS Preload:**

```bash
# Submit domain to HSTS preload list
# Visit: https://hstspreload.org/
# Enter: cdhomeimprovementsrockford.com
# Verify requirements met:
# ✅ Valid certificate
# ✅ Redirect HTTP to HTTPS
# ✅ HSTS header on all subdomains
# ✅ max-age >= 31536000 (1 year)

# Check HSTS status
curl -I https://cdhomeimprovementsrockford.com | grep -i strict
```

### DDoS Protection

**Implement rate limiting (Caddy):**

```caddyfile
# Update Caddyfile with rate limiting
cdhomeimprovementsrockford.com {
    # Rate limit by IP
    rate_limit {
        zone static {
            key {remote_host}
            events 60
            window 1m
        }
        zone api {
            key {remote_host}
            events 20
            window 1m
        }
    }

    # Apply to API routes
    @api path /api/*
    handle @api {
        rate_limit api
        reverse_proxy nextjs:3000
    }

    # Apply to static content
    handle {
        rate_limit static
        reverse_proxy nextjs:3000
    }
}
```

**CloudFlare integration (optional):**

```bash
# If using CloudFlare for DDoS protection:
# 1. Update DNS to point to CloudFlare
# 2. Enable "Under Attack" mode during DDoS
# 3. Configure firewall rules
# 4. Enable Bot Fight Mode
# 5. Set up rate limiting rules
```

### VPN Access (Optional)

**Set up WireGuard VPN for admin access:**

```bash
# Install WireGuard
sudo apt install -y wireguard

# Generate keys
wg genkey | tee privatekey | wg pubkey > publickey

# Configure WireGuard
sudo nano /etc/wireguard/wg0.conf

# Add:
[Interface]
PrivateKey = SERVER_PRIVATE_KEY
Address = 10.0.0.1/24
ListenPort = 51820
SaveConfig = true

[Peer]
PublicKey = CLIENT_PUBLIC_KEY
AllowedIPs = 10.0.0.2/32

# Start WireGuard
sudo wg-quick up wg0
sudo systemctl enable wg-quick@wg0

# Allow VPN port
sudo ufw allow 51820/udp comment 'WireGuard VPN'

# Restrict SSH to VPN clients only
sudo ufw delete allow 22/tcp
sudo ufw allow from 10.0.0.0/24 to any port 22 comment 'SSH via VPN only'
```

---

## 🔑 Access Control

### User Management

**Create separate admin user (not root):**

```bash
# Create admin user
sudo adduser cdhi-admin

# Add to sudo group
sudo usermod -aG sudo cdhi-admin

# Add to docker group
sudo usermod -aG docker cdhi-admin

# Test sudo access
su - cdhi-admin
sudo whoami  # Should output: root

# Disable root login
sudo passwd -l root

# Or via SSH config
sudo nano /etc/ssh/sshd_config
# PermitRootLogin no
sudo systemctl restart sshd
```

### Multi-Factor Authentication

**Enable 2FA for critical services:**

**Vercel:**
1. Go to: Account Settings → Security
2. Enable Two-Factor Authentication
3. Use authenticator app (Google Authenticator, Authy)

**Supabase:**
1. Go to: Account → Security
2. Enable 2FA
3. Save backup codes

**Stripe:**
1. Go to: Settings → Team → Security
2. Enable 2FA for all team members
3. Enforce 2FA for sensitive operations

**GitHub:**
1. Settings → Account security
2. Enable Two-factor authentication
3. Use authenticator app + backup codes

**n8n (Basic Auth + Reverse Proxy):**

```yaml
# docker-compose.yml
n8n:
  environment:
    N8N_BASIC_AUTH_ACTIVE: "true"
    N8N_BASIC_AUTH_USER: "${N8N_BASIC_AUTH_USER}"
    N8N_BASIC_AUTH_PASSWORD: "${N8N_BASIC_AUTH_PASSWORD}"
```

**Uptime Kuma (Password + Optional 2FA):**
1. Settings → Security
2. Enable Two-Factor Authentication
3. Scan QR code with authenticator app

### Password Policy

**Enforce strong passwords:**

```bash
# Install password quality checker
sudo apt install -y libpam-pwquality

# Configure password requirements
sudo nano /etc/pam.d/common-password

# Add/modify line:
password requisite pam_pwquality.so retry=3 minlen=16 difok=3 ucredit=-1 lcredit=-1 dcredit=-1 ocredit=-1

# Explanation:
# minlen=16     - Minimum 16 characters
# difok=3       - At least 3 different characters from old password
# ucredit=-1    - At least 1 uppercase letter
# lcredit=-1    - At least 1 lowercase letter
# dcredit=-1    - At least 1 digit
# ocredit=-1    - At least 1 special character
```

**Password rotation schedule:**

| Service | Rotation Frequency | Responsibility |
|---------|-------------------|----------------|
| VPS root/admin | Every 90 days | Technical Lead |
| Database passwords | Every 180 days | DBA |
| API keys | Every 180 days | Technical Lead |
| SSL/TLS certificates | Automatic | Caddy |
| SSH keys | Every 365 days | Technical Lead |

---

## 📊 Monitoring & Auditing

### Security Event Logging

**Centralized logging configuration:**

```bash
# Configure rsyslog for centralized logging
sudo nano /etc/rsyslog.d/50-default.conf

# Add:
*.* @@logs.example.com:514  # Remote syslog server (optional)

# Or log to file
*.* /var/log/security.log

# Restart rsyslog
sudo systemctl restart rsyslog
```

**Configure application logging:**

```typescript
// lib/logger.ts enhancement

import * as Sentry from '@sentry/nextjs';

export const securityLogger = {
  logAuthFailure(email: string, ip: string) {
    const event = {
      level: 'warning',
      message: 'Authentication failure',
      email,
      ip,
      timestamp: new Date().toISOString(),
    };

    console.warn(JSON.stringify(event));
    Sentry.captureMessage('Authentication failure', {
      level: 'warning',
      tags: { security: true },
      extra: event,
    });
  },

  logSuspiciousActivity(activity: string, details: any) {
    const event = {
      level: 'error',
      message: 'Suspicious activity detected',
      activity,
      details,
      timestamp: new Date().toISOString(),
    };

    console.error(JSON.stringify(event));
    Sentry.captureException(new Error('Suspicious activity'), {
      level: 'error',
      tags: { security: true, suspicious: true },
      extra: event,
    });
  },

  logDataAccess(user: string, table: string, action: string) {
    const event = {
      level: 'info',
      message: 'Data access',
      user,
      table,
      action,
      timestamp: new Date().toISOString(),
    };

    console.info(JSON.stringify(event));
  },
};
```

### Security Scanning

**Automated vulnerability scanning:**

```bash
# Create security scan script
cat > /opt/cdhi-stack/security-scan.sh << 'EOF'
#!/bin/bash

echo "🔍 Running security scans..."

# 1. Scan Docker images
echo "Scanning Docker images..."
trivy image --severity HIGH,CRITICAL invoiceninja/invoiceninja:5

# 2. Scan filesystem
echo "Scanning filesystem..."
sudo clamscan -r /opt/cdhi-stack/

# 3. Check for rootkits
echo "Checking for rootkits..."
sudo rkhunter --check --skip-keypress --report-warnings-only

# 4. Network port scan
echo "Scanning open ports..."
sudo netstat -tulpn | grep LISTEN

# 5. Check for failed login attempts
echo "Failed login attempts (last 24 hours):"
sudo grep "Failed password" /var/log/auth.log | grep "$(date +%b\ %e)"

# 6. Check Fail2Ban status
echo "Fail2Ban banned IPs:"
sudo fail2ban-client status sshd

# 7. Check disk usage
echo "Disk usage:"
df -h

# 8. Check suspicious processes
echo "Checking for suspicious processes..."
ps aux | grep -E "(nc|ncat|netcat|/dev/tcp)" | grep -v grep

echo "✅ Security scan complete"
EOF

chmod +x /opt/cdhi-stack/security-scan.sh

# Run weekly via cron
crontab -e
# Add:
0 3 * * 0 /opt/cdhi-stack/security-scan.sh >> /var/log/security-scan.log 2>&1
```

**Install additional security tools:**

```bash
# Install ClamAV (antivirus)
sudo apt install -y clamav clamav-daemon

# Update virus definitions
sudo freshclam

# Install rkhunter (rootkit detection)
sudo apt install -y rkhunter

# Update rkhunter database
sudo rkhunter --update

# Run first scan
sudo rkhunter --check --skip-keypress
```

### Intrusion Detection

**Install OSSEC (Host Intrusion Detection System):**

```bash
# Download OSSEC
cd /tmp
wget https://github.com/ossec/ossec-hids/archive/3.7.0.tar.gz
tar -xzf 3.7.0.tar.gz
cd ossec-hids-3.7.0

# Install
sudo ./install.sh

# Choose: local installation
# Enable rootcheck: yes
# Enable syscheck: yes
# Enable active response: yes

# Configure OSSEC
sudo nano /var/ossec/etc/ossec.conf

# Add custom rules for Docker monitoring
<syscheck>
  <directories check_all="yes">/opt/cdhi-stack/</directories>
  <directories check_all="yes">/var/lib/docker/</directories>
</syscheck>

# Start OSSEC
sudo /var/ossec/bin/ossec-control start

# Check OSSEC logs
sudo tail -f /var/ossec/logs/alerts/alerts.log
```

---

## 🚨 Incident Response

### Incident Response Plan

**Phase 1: Detection (0-15 minutes)**
1. Security alert triggered (Sentry, Fail2Ban, OSSEC)
2. Verify alert legitimacy
3. Assess severity (P0/P1/P2)
4. Alert security team

**Phase 2: Containment (15-60 minutes)**
1. Isolate affected systems
2. Block attacker IP addresses
3. Disable compromised accounts
4. Preserve evidence (logs, memory dumps)

**Phase 3: Eradication (1-4 hours)**
1. Identify root cause
2. Remove malware/backdoors
3. Patch vulnerabilities
4. Change all credentials

**Phase 4: Recovery (4-24 hours)**
1. Restore from clean backups
2. Gradually restore services
3. Monitor for re-infection
4. Verify system integrity

**Phase 5: Post-Incident (24-48 hours)**
1. Document incident details
2. Conduct post-mortem meeting
3. Update security procedures
4. Implement preventive measures

### Security Incident Log

**Document all security incidents:**

```bash
# Create incident log template
cat > /var/log/security-incidents.log << 'EOF'
# Security Incident Log
# Format: [DATE] [SEVERITY] [TYPE] [DESCRIPTION] [ACTION TAKEN] [RESOLVED]

# Example:
# 2025-01-28 14:30 P1 BRUTE_FORCE Multiple failed SSH attempts from 192.0.2.10 IP banned by Fail2Ban YES
EOF

# Log incident (example)
echo "$(date +%Y-%m-%d\ %H:%M) P1 SUSPICIOUS_ACTIVITY Unusual database queries detected Manual review required NO" >> /var/log/security-incidents.log
```

---

## ✅ Security Checklist

### Initial Setup

- [ ] Server updated and patched
- [ ] Automatic security updates enabled
- [ ] SSH hardened (key-based auth only)
- [ ] Firewall configured (UFW)
- [ ] Fail2Ban installed and configured
- [ ] System auditing enabled (auditd)

### Docker Security

- [ ] Docker daemon hardened
- [ ] Container security options configured
- [ ] Image versions pinned
- [ ] Vulnerability scanning implemented (Trivy)
- [ ] Network isolation configured
- [ ] Resource limits set

### Application Security

- [ ] Environment variables secured (600 permissions)
- [ ] API rate limiting configured
- [ ] Input validation implemented
- [ ] Content Security Policy configured
- [ ] Security headers enabled

### Database Security

- [ ] Row Level Security enabled (Supabase)
- [ ] Database users follow least privilege
- [ ] Encrypted backups configured
- [ ] SQL injection prevention verified
- [ ] Database auditing enabled

### Access Control

- [ ] Separate admin user created (not root)
- [ ] 2FA enabled on all critical services
- [ ] Strong password policy enforced
- [ ] Password rotation schedule established
- [ ] VPN configured for admin access (optional)

### Monitoring

- [ ] Security event logging configured
- [ ] Sentry error tracking active
- [ ] Uptime Kuma monitoring configured
- [ ] Fail2Ban alerts configured
- [ ] Security scanning automated (weekly)
- [ ] Intrusion detection system installed (OSSEC)

### Compliance

- [ ] Data retention policy documented
- [ ] Privacy policy published
- [ ] Terms of service published
- [ ] PCI DSS compliance (Stripe handles)
- [ ] GDPR compliance (if applicable)

### Incident Response

- [ ] Incident response plan documented
- [ ] Security team identified
- [ ] Incident log created
- [ ] Contact information current
- [ ] Disaster recovery tested

---

## 📞 Security Contacts

**Internal Security Team**
- Security Lead: _____________
- Phone: _____________
- Email: security@cdhomeimprovementsrockford.com

**External Resources**
- FBI IC3 (Cyber Crime): https://www.ic3.gov
- CISA (Cybersecurity & Infrastructure Security Agency): 1-888-282-0870
- Stripe Security: security@stripe.com
- Vercel Security: security@vercel.com
- Supabase Security: security@supabase.com

**Incident Reporting**
- Email: security@cdhomeimprovementsrockford.com
- Emergency Phone: _____________
- PGP Key: [If available]

---

**Last Updated:** 2025-01-28
**Version:** 1.0
**Next Security Audit:** 2025-04-28 (Quarterly)

**Maintained by:** CD Home Improvements Security Team
