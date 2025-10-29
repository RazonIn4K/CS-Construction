#!/bin/bash
# ==============================================================================
# Doppler Secrets Update Helper Script
# ==============================================================================
# Purpose: Interactive script to update Doppler secrets with real credentials
# Usage: ./scripts/update-doppler-secrets.sh
# ==============================================================================

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Helper functions
info() {
    echo -e "${BLUE}ℹ${NC} $1"
}

success() {
    echo -e "${GREEN}✓${NC} $1"
}

warn() {
    echo -e "${YELLOW}⚠${NC} $1"
}

error() {
    echo -e "${RED}✗${NC} $1"
}

# Check if Doppler is installed and logged in
if ! command -v doppler &> /dev/null; then
    error "Doppler CLI not found. Install with: brew install dopplerhq/cli/doppler"
    exit 1
fi

if ! doppler me --plain &> /dev/null; then
    error "Not logged into Doppler. Run: doppler login"
    exit 1
fi

# Check if we're in the correct project
CURRENT_PROJECT=$(doppler configure get project --plain 2>/dev/null || echo "")
if [ "$CURRENT_PROJECT" != "cd-construction" ]; then
    warn "Not in cd-construction project. Switching..."
    doppler setup --project cd-construction --config dev --no-interactive
fi

echo ""
echo "=============================================================================="
echo "  CD Home Improvements - Doppler Secrets Update"
echo "=============================================================================="
echo ""
info "This script will help you update your Doppler secrets with real credentials."
echo ""
warn "IMPORTANT: Never commit real credentials to git!"
echo ""

# Function to update a secret
update_secret() {
    local key=$1
    local description=$2
    local current_value=$(doppler secrets get $key --plain 2>/dev/null || echo "not set")

    echo ""
    echo "──────────────────────────────────────────────────────────────────────────"
    info "$description"
    echo "  Key: $key"
    echo "  Current value: ${current_value:0:20}..."
    echo ""
    read -p "Update this secret? (y/N): " -n 1 -r
    echo

    if [[ $REPLY =~ ^[Yy]$ ]]; then
        read -sp "Enter new value (hidden): " new_value
        echo
        if [ -n "$new_value" ]; then
            doppler secrets set "$key=$new_value" --silent
            success "Updated $key"
        else
            warn "Skipped (empty value)"
        fi
    else
        info "Skipped $key"
    fi
}

# ==============================================================================
# Supabase Credentials
# ==============================================================================

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  Supabase Credentials"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
info "Get these from: https://supabase.com/dashboard/project/_/settings/api"

update_secret "NEXT_PUBLIC_SUPABASE_URL" "Supabase project URL (e.g., https://xxxxx.supabase.co)"
update_secret "NEXT_PUBLIC_SUPABASE_ANON_KEY" "Supabase anon/public key (safe for client-side)"
update_secret "SUPABASE_SERVICE_ROLE_KEY" "Supabase service role key (KEEP SECRET! Server-side only)"
update_secret "DATABASE_URL" "Direct database connection string (postgres://...)"

# ==============================================================================
# Stripe Credentials (Test Mode)
# ==============================================================================

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  Stripe Credentials (Test Mode)"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
info "Get these from: https://dashboard.stripe.com/test/apikeys"
warn "Start with TEST mode keys (sk_test_... and pk_test_...)"

update_secret "STRIPE_SECRET_KEY" "Stripe secret key (sk_test_... for test mode)"
update_secret "NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY" "Stripe publishable key (pk_test_... for test mode)"
update_secret "STRIPE_WEBHOOK_SECRET" "Stripe webhook signing secret (whsec_...)"

# ==============================================================================
# Invoice Ninja (Optional)
# ==============================================================================

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  Invoice Ninja (Optional)"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
info "Only needed if you're using Invoice Ninja for invoicing"
read -p "Do you want to configure Invoice Ninja? (y/N): " -n 1 -r
echo

if [[ $REPLY =~ ^[Yy]$ ]]; then
    update_secret "INVOICENINJA_URL" "Invoice Ninja URL (e.g., https://invoicing.co)"
    update_secret "INVOICENINJA_API_TOKEN" "Invoice Ninja API token"
    update_secret "INVOICENINJA_WEBHOOK_SECRET" "Invoice Ninja webhook secret"
fi

# ==============================================================================
# n8n Integration (Optional)
# ==============================================================================

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  n8n Workflow Automation (Optional)"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
info "Only needed if you're using n8n for workflow automation"
read -p "Do you want to configure n8n? (y/N): " -n 1 -r
echo

if [[ $REPLY =~ ^[Yy]$ ]]; then
    update_secret "N8N_API_KEY" "n8n API key"
    update_secret "N8N_WEBHOOK_BASE_URL" "n8n webhook base URL"
fi

# ==============================================================================
# Admin API Keys
# ==============================================================================

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  Admin API Keys"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
info "Generate secure random keys for admin endpoints"

read -p "Generate new admin API keys? (y/N): " -n 1 -r
echo

if [[ $REPLY =~ ^[Yy]$ ]]; then
    ADMIN_API_KEY=$(openssl rand -base64 32)
    ADMIN_REPLAY_SECRET=$(openssl rand -base64 32)

    doppler secrets set "ADMIN_API_KEY=$ADMIN_API_KEY" --silent
    doppler secrets set "ADMIN_REPLAY_SECRET=$ADMIN_REPLAY_SECRET" --silent

    success "Generated new admin API keys"
    info "ADMIN_API_KEY: ${ADMIN_API_KEY:0:20}..."
    info "ADMIN_REPLAY_SECRET: ${ADMIN_REPLAY_SECRET:0:20}..."
fi

# ==============================================================================
# Summary
# ==============================================================================

echo ""
echo "=============================================================================="
echo "  Summary"
echo "=============================================================================="
echo ""

# Count how many secrets are still placeholders
PLACEHOLDER_COUNT=$(doppler secrets --format json | jq -r 'to_entries[] | select(.value.computed == "placeholder") | .key' 2>/dev/null | wc -l || echo "0")

if [ "$PLACEHOLDER_COUNT" -gt 0 ]; then
    warn "$PLACEHOLDER_COUNT secrets still have placeholder values"
    info "Run this script again to update remaining secrets"
else
    success "All secrets have been updated!"
fi

echo ""
info "View all secrets: doppler secrets"
info "Update a single secret: doppler secrets set KEY=VALUE"
info "Open Doppler dashboard: doppler open"
echo ""

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
success "Doppler secrets update complete!"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
