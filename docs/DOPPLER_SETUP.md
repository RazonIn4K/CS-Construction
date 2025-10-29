# Doppler Setup Guide

## Why Doppler?

**Benefits**:
- ✅ No `.env` files in version control
- ✅ Team members sync secrets automatically
- ✅ Branch-specific configurations
- ✅ Audit trail of secret access
- ✅ Automatic rotation support
- ✅ Works with Vercel, CI/CD, local dev

## Prerequisites

1. **Create Doppler Account**
   - Visit: https://dashboard.doppler.com/register
   - Sign up (free for small teams)

2. **Install Doppler CLI**
   ```bash
   # macOS
   brew install dopplerhq/cli/doppler

   # Or download from https://docs.doppler.com/docs/install-cli
   ```

3. **Login to Doppler**
   ```bash
   doppler login
   ```

## Step 1: Create Doppler Project

```bash
# Navigate to project directory
cd /Users/davidortiz/Potentical-Fma/CD-Construction

# Create project
doppler projects create cd-construction

# Link local directory to project
doppler setup
# Select: cd-construction
# Select config: dev
```

## Step 2: Create Environments

Doppler projects have multiple "configs" (environments):

```bash
# Create staging config
doppler configs create staging --project cd-construction

# Create production config
doppler configs create production --project cd-construction
```

You'll now have:
- **dev** - Local development
- **staging** - Staging deployments
- **production** - Live production

## Step 3: Import Existing Secrets

### Option A: Import from .env.local

```bash
# Import all secrets from .env.local to dev config
doppler secrets upload .env.local --project cd-construction --config dev
```

### Option B: Set secrets manually

```bash
# Switch to dev config
doppler setup

# Set secrets one by one
doppler secrets set NODE_ENV=development
doppler secrets set NEXT_PUBLIC_APP_URL=http://localhost:3000

# Or use interactive mode
doppler secrets set
```

## Step 4: Update package.json Scripts

Your `package.json` has been updated to use Doppler:

```json
{
  "scripts": {
    "dev": "doppler run -- next dev",
    "build": "doppler run --config production -- next build",
    "start": "doppler run --config production -- next start",
    "lint": "eslint .",
    "type-check": "tsc --noEmit"
  }
}
```

## Step 5: Run Your App with Doppler

```bash
# Development (uses dev config from .doppler.yaml)
npm run dev

# Or specify config explicitly
doppler run --config dev -- npm run dev

# Build for production
doppler run --config production -- npm run build
```

## Step 6: Configure Secrets

### Required Secrets for Development

```bash
# Supabase
doppler secrets set NEXT_PUBLIC_SUPABASE_URL="https://[your-project].supabase.co"
doppler secrets set NEXT_PUBLIC_SUPABASE_ANON_KEY="eyJh..."
doppler secrets set SUPABASE_SERVICE_ROLE_KEY="eyJh..."
doppler secrets set DATABASE_URL="postgresql://..."

# Stripe (Test Mode)
doppler secrets set STRIPE_SECRET_KEY="sk_test_..."
doppler secrets set NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY="pk_test_..."
doppler secrets set STRIPE_WEBHOOK_SECRET="whsec_..."

# Invoice Ninja (Optional)
doppler secrets set INVOICENINJA_URL="https://invoicing.yourdomain.com"
doppler secrets set INVOICENINJA_API_TOKEN="your_token"
doppler secrets set INVOICENINJA_WEBHOOK_SECRET="your_webhook_secret"

# n8n (Optional)
doppler secrets set N8N_WEBHOOK_URL="https://n8n.yourdomain.com/webhook/..."
doppler secrets set N8N_API_KEY="your_api_key"

# Sentry
doppler secrets set NEXT_PUBLIC_SENTRY_DSN="https://...@sentry.io/..."
doppler secrets set SENTRY_AUTH_TOKEN="your_auth_token"

# Admin
doppler secrets set ADMIN_API_KEY="$(openssl rand -base64 32)"
doppler secrets set ADMIN_REPLAY_SECRET="$(openssl rand -base64 32)"

# Feature Flags
doppler secrets set ENABLE_INVOICENINJA_WEBHOOK="true"
doppler secrets set ENABLE_SMS_NOTIFICATIONS="false"
doppler secrets set ENABLE_EMAIL_NOTIFICATIONS="false"
```

## Step 7: Team Collaboration

### Invite Team Members

1. Go to Doppler dashboard
2. Navigate to cd-construction project
3. Click "Team" → "Invite Members"
4. Team members run:
   ```bash
   doppler login
   doppler setup
   npm run dev  # Automatically pulls secrets
   ```

### Benefits for Team
- No sharing .env files via Slack/email
- Everyone always has latest secrets
- New team member? Just `doppler setup && npm run dev`

## Step 8: Configure CI/CD

### GitHub Actions

Add Doppler token to GitHub secrets:
1. Doppler dashboard → cd-construction → Access → Service Tokens
2. Create token for "production" config
3. GitHub repo → Settings → Secrets → New repository secret
4. Name: `DOPPLER_TOKEN_PRODUCTION`
5. Value: `dp.st.prod....`

Update `.github/workflows/deploy-vercel.yml`:

```yaml
- name: Install dependencies
  run: |
    npm install -g @dopplerhq/cli
    doppler run --token=${{ secrets.DOPPLER_TOKEN_PRODUCTION }} -- npm ci
```

### Vercel Integration

Doppler has native Vercel integration:

1. Doppler dashboard → cd-construction → Integrations
2. Click "Vercel"
3. Authorize Vercel
4. Map configs:
   - dev → Preview
   - staging → Preview (optional)
   - production → Production
5. Secrets auto-sync to Vercel!

## Step 9: Clean Up Old .env Files

After Doppler is working:

```bash
# Remove .env files from repository (keep examples)
rm .env.local .env.development .env.production

# Verify .gitignore has these
cat .gitignore | grep .env

# Should see:
# .env
# .env.local
# .env*.local
```

## Common Commands

```bash
# View all secrets in current config
doppler secrets

# Get specific secret
doppler secrets get SUPABASE_URL

# Set secret in multiple configs
doppler secrets set API_KEY=value --config dev
doppler secrets set API_KEY=value --config production

# Download secrets to .env file (for debugging)
doppler secrets download --no-file --format env > .env.debug

# Switch config
doppler setup --config staging
```

## Troubleshooting

### Error: "No Doppler token found"
```bash
# Run setup again
doppler setup --project cd-construction --config dev
```

### Error: "Invalid token"
```bash
# Re-authenticate
doppler logout
doppler login
```

### Secrets not updating
```bash
# Clear cache
rm -rf ~/.doppler

# Re-setup
doppler setup
```

## Best Practices

### DO ✅
- Use different configs for dev/staging/production
- Rotate secrets regularly (Doppler has built-in rotation)
- Use service tokens for CI/CD
- Enable audit logs (Doppler Pro)

### DON'T ❌
- Commit Doppler service tokens to git
- Share service tokens in Slack/email
- Use production secrets in development
- Hardcode secrets in code

## Cost

- **Free tier**:
  - 5 users
  - 1 project
  - Unlimited secrets
  - Perfect for small teams

- **Paid plans**:
  - Start at $10/month
  - Multiple projects
  - Advanced features (rotation, RBAC)

## Next Steps

After Doppler setup:
1. ✅ Migrate all secrets from .env files
2. ✅ Test local development: `npm run dev`
3. ✅ Configure Vercel integration
4. ✅ Invite team members
5. ✅ Remove .env files from git
6. ✅ Set up production config

## Support

- Docs: https://docs.doppler.com
- Community: https://community.doppler.com
- Support: support@doppler.com
