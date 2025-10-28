# Testing Guide - CD Home Improvements

**Comprehensive testing procedures for ensuring system reliability**

---

## Table of Contents

- [Testing Strategy](#testing-strategy)
- [Pre-Test Setup](#pre-test-setup)
- [Unit Testing](#unit-testing)
- [API Testing](#api-testing)
- [Integration Testing](#integration-testing)
- [End-to-End Testing](#end-to-end-testing)
- [Performance Testing](#performance-testing)
- [Security Testing](#security-testing)
- [Regression Testing](#regression-testing)
- [Test Data](#test-data)

---

## Testing Strategy

### Test Pyramid

```
        ┌─────────────────┐
        │   E2E Tests     │  ← Manual (Critical flows)
        │    (Manual)     │
        ├─────────────────┤
        │  Integration    │  ← API + Database
        │     Tests       │
        ├─────────────────┤
        │   Unit Tests    │  ← Validation logic
        └─────────────────┘
```

### Testing Environments

1. **Local Development** - `http://localhost:3000`
2. **Preview (Vercel)** - Automatic PR deployments
3. **Production** - `https://cdhomeimprovementsrockford.com`

---

## Pre-Test Setup

### 1. Required Accounts

- [ ] Supabase project with test data
- [ ] Stripe test mode enabled
- [ ] Test email account for receiving notifications
- [ ] Invoice Ninja test account
- [ ] n8n test workflow imported

### 2. Test Stripe Cards

**Success:**
- `4242 4242 4242 4242` - Visa (Always succeeds)
- `5555 5555 5555 4444` - Mastercard (Always succeeds)

**Failure:**
- `4000 0000 0000 0002` - Card declined
- `4000 0000 0000 9995` - Insufficient funds

**3D Secure:**
- `4000 0025 0000 3155` - Requires authentication

**Expiration:** Any future date (e.g., 12/25)
**CVV:** Any 3 digits (e.g., 123)

### 3. Environment Variables

Verify all environment variables are set:

```bash
# Check Next.js environment
npm run type-check

# Check Docker environment
cd docker
cat .env | grep -v "^#" | grep -v "^$"
```

---

## Unit Testing

### Validation Schemas

**Test Zod schemas in `types/schemas.ts`:**

```bash
# Create test file
cat > test-schemas.mjs << 'EOF'
import { LeadSubmissionSchema } from './types/schemas.js';

// Valid lead
const validLead = {
  first_name: "John",
  last_name: "Doe",
  email: "john@example.com",
  phone: "(815) 555-1234",
  street_address: "123 Main St",
  city: "Rockford",
  state: "IL",
  zip_code: "61101",
  service_type: "Kitchen Remodel",
  message: "Need new cabinets"
};

console.log('Testing valid lead...');
const result = LeadSubmissionSchema.safeParse(validLead);
console.log(result.success ? '✅ PASS' : '❌ FAIL', result);

// Invalid email
const invalidEmail = { ...validLead, email: 'not-an-email' };
const result2 = LeadSubmissionSchema.safeParse(invalidEmail);
console.log(result2.success ? '❌ FAIL' : '✅ PASS (Expected failure)');

// Missing required field
const missingField = { ...validLead, first_name: undefined };
const result3 = LeadSubmissionSchema.safeParse(missingField);
console.log(result3.success ? '❌ FAIL' : '✅ PASS (Expected failure)');
EOF

node test-schemas.mjs
```

**Expected Results:**
- ✅ Valid lead should pass
- ✅ Invalid email should fail with error message
- ✅ Missing required field should fail

### Database Type Safety

**Test TypeScript types:**

```bash
npm run type-check
```

**Expected:** No type errors

---

## API Testing

### 1. Lead Submission API

**Test POST /api/leads:**

```bash
# Valid submission
curl -X POST http://localhost:3000/api/leads \
  -H "Content-Type: application/json" \
  -d '{
    "first_name": "Jane",
    "last_name": "Smith",
    "email": "jane.smith@example.com",
    "phone": "(815) 555-5678",
    "street_address": "456 Oak Ave",
    "city": "Rockford",
    "state": "IL",
    "zip_code": "61102",
    "service_type": "Bathroom Remodel",
    "message": "Looking to update master bathroom"
  }'
```

**Expected Response (200):**
```json
{
  "success": true,
  "client_id": "uuid-here",
  "property_id": "uuid-here",
  "lead_id": "uuid-here"
}
```

**Test Validation Errors:**

```bash
# Missing required field
curl -X POST http://localhost:3000/api/leads \
  -H "Content-Type: application/json" \
  -d '{
    "first_name": "John",
    "email": "john@example.com"
  }'
```

**Expected Response (400):**
```json
{
  "error": "Validation error",
  "details": [
    {
      "path": ["last_name"],
      "message": "Required"
    }
  ]
}
```

**Test Invalid Email:**

```bash
curl -X POST http://localhost:3000/api/leads \
  -H "Content-Type: application/json" \
  -d '{
    "first_name": "John",
    "last_name": "Doe",
    "email": "not-an-email",
    "street_address": "123 Main St",
    "city": "Rockford",
    "state": "IL",
    "zip_code": "61101",
    "service_type": "Other"
  }'
```

**Expected Response (400):**
```json
{
  "error": "Validation error",
  "details": [
    {
      "path": ["email"],
      "message": "Invalid email"
    }
  ]
}
```

### 2. Stripe Webhook API

**Test webhook endpoint availability:**

```bash
# Should return 400/401 (invalid signature)
curl -X POST http://localhost:3000/api/webhooks/stripe \
  -H "Content-Type: application/json" \
  -d '{"test": true}'
```

**Expected Response (400 or 401):**
```json
{
  "error": "Invalid signature"
}
```

**Test with Stripe CLI:**

```bash
# Install Stripe CLI
brew install stripe/stripe-cli/stripe

# Login
stripe login

# Forward webhooks to local
stripe listen --forward-to http://localhost:3000/api/webhooks/stripe

# Trigger test event
stripe trigger payment_intent.succeeded
```

**Expected:**
- ✅ Webhook received
- ✅ Payment record created in Supabase
- ✅ Invoice status updated

### 3. Invoice Ninja Webhook API

**Test endpoint:**

```bash
curl -X POST http://localhost:3000/api/webhooks/invoiceninja \
  -H "Content-Type: application/json" \
  -d '{"event": "invoice.created"}'
```

**Expected Response (200):**
```json
{
  "received": true
}
```

### 4. Admin DLQ Replay API

**Test authentication:**

```bash
# Without auth (should fail)
curl -X GET http://localhost:3000/api/admin/replay
```

**Expected Response (401):**
```json
{
  "error": "Unauthorized"
}
```

**With auth:**

```bash
curl -X GET http://localhost:3000/api/admin/replay \
  -H "Authorization: Bearer your-admin-api-key"
```

**Expected Response (200):**
```json
{
  "events": [],
  "total": 0,
  "limit": 50,
  "offset": 0
}
```

---

## Integration Testing

### 1. Lead Submission → Supabase

**Test Flow:**

1. Submit lead via API
2. Verify data in Supabase

```bash
# Submit lead
curl -X POST http://localhost:3000/api/leads \
  -H "Content-Type: application/json" \
  -d '{
    "first_name": "Test",
    "last_name": "Integration",
    "email": "test-integration@example.com",
    "street_address": "789 Test St",
    "city": "Rockford",
    "state": "IL",
    "zip_code": "61103",
    "service_type": "Kitchen Remodel"
  }'

# Note the lead_id from response

# Verify in Supabase
# Go to Supabase Dashboard > Table Editor > leads
# Search for email: test-integration@example.com
```

**Expected:**
- ✅ Client record created
- ✅ Property record created with address
- ✅ Lead record created with service type
- ✅ All foreign keys properly linked

### 2. Lead → n8n Workflow

**Test Flow:**

1. Submit lead via frontend form
2. Check n8n execution log
3. Verify client created in Invoice Ninja
4. Verify quote created
5. Verify email sent

**Steps:**

1. **Navigate to:** `http://localhost:3000`
2. **Fill out form** with test data
3. **Submit** and note success message
4. **Check n8n:** `https://automate.cdhomeimprovementsrockford.com/executions`
5. **Check Invoice Ninja:** `https://portal.cdhomeimprovementsrockford.com/clients`
6. **Check email** (test inbox)

**Expected:**
- ✅ n8n workflow shows "Success" status
- ✅ Client appears in Invoice Ninja
- ✅ Quote created with correct line items
- ✅ Email received with quote link

### 3. Payment → Invoice Update

**Test Flow:**

1. Create test invoice in Invoice Ninja
2. Process payment via Stripe
3. Verify webhook received
4. Verify invoice marked as paid

**Steps:**

1. **Create test invoice** in Invoice Ninja
2. **Get invoice ID** from URL
3. **Trigger test payment** via Stripe dashboard
4. **Check Supabase** payments table
5. **Check Invoice Ninja** invoice status

**Expected:**
- ✅ Webhook event logged
- ✅ Payment record in Supabase
- ✅ Invoice status = PAID
- ✅ paid_at timestamp set

---

## End-to-End Testing

### Critical User Journey: Lead to Payment

**Scenario:** Customer requests quote, receives it, and pays online

#### Phase 1: Lead Submission

**Steps:**

1. Navigate to `https://cdhomeimprovementsrockford.com`
2. Scroll to "Get Your Free Quote" section
3. Fill out form:
   - **First Name:** Sarah
   - **Last Name:** Anderson
   - **Email:** sarah.anderson+test@gmail.com
   - **Phone:** (815) 555-9999
   - **Street Address:** 321 Maple Drive
   - **City:** Rockford
   - **State:** IL
   - **ZIP Code:** 61104
   - **Service Type:** Kitchen Remodel
   - **Message:** "Need complete kitchen renovation"
4. Click "Get Free Quote"

**Expected Results:**
- ✅ Form validates all fields
- ✅ Loading spinner appears
- ✅ Success message displays
- ✅ Form resets after submission

**Verify in Backend:**

```bash
# Check Supabase
# Tables: clients, properties, leads
# Email: sarah.anderson+test@gmail.com should exist

# Check n8n execution
# https://automate.cdhomeimprovementsrockford.com/executions
# Most recent execution should be "Success"
```

#### Phase 2: Automated Workflow

**Expected (no action required):**
- ✅ n8n workflow triggers within 5 seconds
- ✅ Client created in Invoice Ninja
- ✅ Quote generated with $15,000 estimate
- ✅ Email sent to sarah.anderson+test@gmail.com
- ✅ Internal notification to admin

**Verify:**

1. **Check email inbox** for sarah.anderson+test@gmail.com
2. **Email should contain:**
   - Subject: "Your CD Home Improvements Quote - Q-0001"
   - Quote link to client portal
   - Professional branding
   - Call-to-action button

3. **Check Invoice Ninja:**
   - `https://portal.cdhomeimprovementsrockford.com/clients`
   - Client "Sarah Anderson" exists
   - Quote Q-0001 (or next number) exists
   - Quote status: "Sent"

#### Phase 3: Quote Approval

**Steps:**

1. **Open quote link** from email
2. **Review quote** details
3. **Click "Approve"**

**Expected:**
- ✅ Quote status changes to "Approved"
- ✅ Invoice automatically created (or ready to create)

**Note:** Invoice Ninja may require manual invoice creation from quote. If so:

1. Login to Invoice Ninja admin
2. Navigate to Quotes
3. Find approved quote
4. Click "Convert to Invoice"

#### Phase 4: Payment Processing

**Steps:**

1. **Navigate to invoice** in client portal
2. **Click "Pay Now"**
3. **Enter test card:**
   - Card: 4242 4242 4242 4242
   - Expiry: 12/25
   - CVV: 123
   - ZIP: 61104
4. **Submit payment**

**Expected:**
- ✅ Stripe payment form loads
- ✅ Payment processes successfully
- ✅ Success message displays
- ✅ Receipt email sent

**Verify in Backend:**

```bash
# Check Stripe dashboard
# https://dashboard.stripe.com/test/payments
# Payment should appear with "Succeeded" status

# Check Supabase
# Table: payments
# New payment record with:
# - amount: 15000.00
# - status: COMPLETED
# - transaction_id: pi_xxx

# Check Invoice Ninja
# Invoice status: PAID
# Payment recorded
```

#### Phase 5: Post-Payment

**Expected (no action required):**
- ✅ Invoice marked as paid
- ✅ Receipt emailed to customer
- ✅ Admin notification sent
- ✅ Payment logged in Supabase

**Total Time:** ~5-10 minutes for complete flow

---

## Performance Testing

### Page Load Times

**Test homepage performance:**

```bash
# Use Lighthouse
npm install -g lighthouse

lighthouse https://cdhomeimprovementsrockford.com \
  --output=html \
  --output-path=./lighthouse-report.html \
  --chrome-flags="--headless"
```

**Target Metrics:**
- Performance: 90+
- Accessibility: 95+
- Best Practices: 95+
- SEO: 95+

**Core Web Vitals:**
- LCP (Largest Contentful Paint): < 2.5s
- FID (First Input Delay): < 100ms
- CLS (Cumulative Layout Shift): < 0.1

### API Response Times

**Test API endpoint performance:**

```bash
# Install Apache Bench
# macOS: brew install ab
# Ubuntu: sudo apt-get install apache2-utils

# Test lead submission
ab -n 100 -c 10 -p lead-payload.json -T application/json \
  http://localhost:3000/api/leads
```

**Target:**
- Average response time: < 500ms
- 99th percentile: < 1000ms
- Success rate: 100%

### Database Query Performance

**Monitor slow queries:**

```bash
# Check Supabase slow queries
# Dashboard > Database > Query Performance

# Check MariaDB slow queries
docker-compose exec mariadb \
  tail -f /var/lib/mysql/slow-query.log
```

**Target:**
- Average query time: < 100ms
- No queries > 2 seconds

---

## Security Testing

### 1. SQL Injection

**Test API inputs for SQL injection:**

```bash
curl -X POST http://localhost:3000/api/leads \
  -H "Content-Type: application/json" \
  -d '{
    "first_name": "Robert'"'"'; DROP TABLE clients; --",
    "last_name": "Hacker",
    "email": "test@example.com",
    "street_address": "123 Main St",
    "city": "Rockford",
    "state": "IL",
    "zip_code": "61101",
    "service_type": "Other"
  }'
```

**Expected:**
- ✅ Request fails validation OR
- ✅ Input is properly escaped
- ✅ No SQL errors in logs
- ✅ Database tables intact

### 2. XSS (Cross-Site Scripting)

**Test form inputs for XSS:**

```bash
curl -X POST http://localhost:3000/api/leads \
  -H "Content-Type: application/json" \
  -d '{
    "first_name": "<script>alert(\"XSS\")</script>",
    "last_name": "Test",
    "email": "test@example.com",
    "street_address": "123 Main St",
    "city": "Rockford",
    "state": "IL",
    "zip_code": "61101",
    "service_type": "Other"
  }'
```

**Expected:**
- ✅ Script tags rejected OR properly escaped
- ✅ No script execution in admin panels

### 3. Webhook Signature Verification

**Test Stripe webhook without signature:**

```bash
curl -X POST http://localhost:3000/api/webhooks/stripe \
  -H "Content-Type: application/json" \
  -d '{
    "type": "payment_intent.succeeded",
    "data": {
      "object": {
        "id": "pi_fake",
        "amount": 999999
      }
    }
  }'
```

**Expected:**
- ✅ Returns 401 Unauthorized
- ✅ No payment record created
- ✅ Security event logged

### 4. Environment Variable Exposure

**Check for exposed secrets:**

```bash
# Check production site source
curl https://cdhomeimprovementsrockford.com | grep -i "secret\|api_key\|password"

# Should only see NEXT_PUBLIC_ variables
```

**Expected:**
- ✅ No private keys in HTML
- ✅ No database credentials
- ✅ No API secrets

---

## Regression Testing

### Checklist After Each Deployment

**Frontend:**
- [ ] Homepage loads correctly
- [ ] All navigation links work
- [ ] Lead form visible and functional
- [ ] Form validation works
- [ ] Success/error messages display
- [ ] Mobile responsive design intact
- [ ] Images load properly

**API:**
- [ ] POST /api/leads returns 200
- [ ] Validation errors return 400
- [ ] Webhooks return expected status codes
- [ ] Database records created correctly

**Docker Stack:**
- [ ] All 7 services running
- [ ] All services show "healthy"
- [ ] HTTPS certificates valid
- [ ] Reverse proxy working
- [ ] Invoice Ninja accessible
- [ ] n8n accessible
- [ ] Uptime Kuma accessible

**Monitoring:**
- [ ] All Uptime Kuma monitors green
- [ ] No errors in Sentry
- [ ] Email notifications working
- [ ] Slack notifications working (if enabled)

---

## Test Data

### Sample Lead Data

```json
{
  "first_name": "Michael",
  "last_name": "Johnson",
  "email": "michael.johnson@example.com",
  "phone": "(815) 555-1111",
  "street_address": "555 Pine Street",
  "city": "Rockford",
  "state": "IL",
  "zip_code": "61105",
  "service_type": "Deck Installation",
  "message": "Looking for 20x12 composite deck"
}
```

### Test Email Addresses

Use Gmail `+` trick for testing:

- `yourname+test1@gmail.com`
- `yourname+test2@gmail.com`
- `yourname+kitchen@gmail.com`
- `yourname+bathroom@gmail.com`

All go to same inbox but treated as unique by system.

---

## Test Reporting

### Bug Report Template

```markdown
## Bug Report

**Title:** [Short description]

**Environment:** [Local / Preview / Production]

**Severity:** [Critical / High / Medium / Low]

**Steps to Reproduce:**
1. Step 1
2. Step 2
3. Step 3

**Expected Behavior:**
[What should happen]

**Actual Behavior:**
[What actually happened]

**Screenshots:**
[If applicable]

**Console Errors:**
```
[Paste any errors]
```

**Additional Context:**
[Any other relevant information]
```

### Test Results Template

```markdown
## Test Results - [Date]

**Tested By:** [Name]
**Environment:** [Local / Preview / Production]
**Duration:** [Time taken]

### Summary
- ✅ Passed: X
- ❌ Failed: Y
- ⏭️ Skipped: Z

### Details

#### Lead Submission
- ✅ Valid submission works
- ✅ Validation catches errors
- ❌ Phone formatting inconsistent

#### Payment Flow
- ✅ Test card processes
- ✅ Webhook received
- ✅ Invoice updated

### Issues Found
1. [Issue description] - [Severity]
2. [Issue description] - [Severity]

### Recommendations
1. [Recommendation]
2. [Recommendation]
```

---

## Testing Schedule

### Before Each Deployment
- Run all API tests
- Test lead submission
- Verify database connection

### Weekly
- Full E2E flow test
- Performance testing
- Security scan

### Monthly
- Regression testing (full suite)
- Load testing
- Backup/restore test

### Quarterly
- Penetration testing
- Accessibility audit
- SEO audit

---

## Automated Testing (Future)

### Recommended Tools

**Unit Testing:**
- Jest
- React Testing Library

**E2E Testing:**
- Playwright
- Cypress

**API Testing:**
- Postman/Newman (CI)
- Supertest

**Example Playwright Test:**

```typescript
// tests/lead-submission.spec.ts
import { test, expect } from '@playwright/test';

test('submit lead form', async ({ page }) => {
  await page.goto('https://cdhomeimprovementsrockford.com');

  await page.fill('[name="first_name"]', 'Test');
  await page.fill('[name="last_name"]', 'User');
  await page.fill('[name="email"]', 'test@example.com');
  await page.fill('[name="street_address"]', '123 Test St');
  await page.fill('[name="city"]', 'Rockford');
  await page.selectOption('[name="state"]', 'IL');
  await page.fill('[name="zip_code"]', '61101');
  await page.selectOption('[name="service_type"]', 'Kitchen Remodel');

  await page.click('button[type="submit"]');

  await expect(page.locator('.success-message')).toBeVisible();
});
```

---

**Last Updated:** 2025-01-28
**Version:** 1.0
**Maintained by:** CD Home Improvements DevOps Team
