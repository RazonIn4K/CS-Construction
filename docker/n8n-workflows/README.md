# n8n Workflows for CD Home Improvements

This directory contains pre-built n8n workflow templates for the CD Home Improvements automation stack.

## Available Workflows

### 1. Lead Intake Workflow (`lead-intake.json`)

**Purpose:** Automates the entire lead-to-quote process when a new lead is submitted via the website.

**Workflow Steps:**
1. **Webhook Trigger** - Receives lead data from Next.js API (`/api/leads`)
2. **Parse Data** - Validates and structures incoming payload
3. **Check Existing Client** - Searches Invoice Ninja by email
4. **Create or Use Client** - Creates new client or uses existing one
5. **Prepare Quote** - Calculates estimate based on service type
6. **Create Quote** - Creates quote in Invoice Ninja
7. **Send Client Email** - Sends quote link to client
8. **Send Internal Notification** - Notifies team of new lead
9. **Webhook Response** - Returns success to Next.js API

**Key Features:**
- ✅ Idempotent client creation (checks for existing email)
- ✅ Automatic quote generation with line items
- ✅ Professional HTML email templates
- ✅ Internal team notifications
- ✅ Stores Supabase IDs in Invoice Ninja custom fields

---

## Installation & Configuration

### Step 1: Import Workflow

1. Access n8n at `https://automate.cdhomeimprovementsrockford.com`
2. Click **"Workflows"** → **"Import from File"**
3. Upload `lead-intake.json`
4. Click **"Import"**

### Step 2: Configure Credentials

#### A. Invoice Ninja API

1. Go to **Settings** → **Credentials** → **Add Credential**
2. Select **"HTTP Header Auth"**
3. Name: `Invoice Ninja API`
4. Add header:
   - **Name:** `X-Api-Token`
   - **Value:** `<YOUR_INVOICENINJA_API_TOKEN>`

**To get Invoice Ninja API token:**
```bash
# Access Invoice Ninja container
docker exec -it invoiceninja php artisan ninja:create-token

# Or via web UI:
# https://portal.cdhomeimprovementsrockford.com/settings/tokens
```

#### B. Email SMTP

1. Go to **Settings** → **Credentials** → **Add Credential**
2. Select **"SMTP"**
3. Name: `Email SMTP`
4. Configure based on your provider:

**Postmark:**
```
Host: smtp.postmarkapp.com
Port: 587
User: <YOUR_POSTMARK_SERVER_TOKEN>
Password: <YOUR_POSTMARK_SERVER_TOKEN>
From Email: noreply@cdhomeimprovementsrockford.com
```

**SendGrid:**
```
Host: smtp.sendgrid.net
Port: 587
User: apikey
Password: <YOUR_SENDGRID_API_KEY>
From Email: noreply@cdhomeimprovementsrockford.com
```

### Step 3: Configure Environment Variables

The workflow uses the following environment variables (set in `docker/.env`):

```bash
# Invoice Ninja
INVOICENINJA_API_URL=https://portal.cdhomeimprovementsrockford.com
INVOICENINJA_PUBLIC_URL=https://portal.cdhomeimprovementsrockford.com

# Email
EMAIL_FROM=noreply@cdhomeimprovementsrockford.com
INTERNAL_NOTIFICATION_EMAIL=admin@cdhomeimprovementsrockford.com
```

**To add environment variables to n8n:**

1. Edit `docker-compose.yml` and add to `n8n` service:
```yaml
n8n:
  environment:
    - INVOICENINJA_API_URL=${INVOICENINJA_URL}
    - INVOICENINJA_PUBLIC_URL=${INVOICENINJA_URL}
    - EMAIL_FROM=${EMAIL_FROM}
    - INTERNAL_NOTIFICATION_EMAIL=${INTERNAL_NOTIFICATION_EMAIL:-admin@cdhomeimprovementsrockford.com}
```

2. Restart n8n:
```bash
docker-compose restart n8n
```

### Step 4: Activate Workflow

1. Open the imported workflow
2. Click the **"Inactive"** toggle in the top-right corner
3. Workflow status should change to **"Active"**

### Step 5: Get Webhook URL

1. Click on the **"Webhook Trigger"** node
2. Copy the **Production URL**
3. It should look like: `https://automate.cdhomeimprovementsrockford.com/webhook/lead-intake`

### Step 6: Update Next.js API

Update `lib/n8n.ts` with your webhook URL:

```typescript
const N8N_WEBHOOK_BASE_URL = process.env.N8N_WEBHOOK_BASE_URL || 'https://automate.cdhomeimprovementsrockford.com';

export async function triggerLeadIntake(leadData: LeadIntakeData) {
  return triggerN8nWorkflow('lead-intake', leadData); // Uses the webhook path from workflow
}
```

---

## Testing the Workflow

### Manual Test via n8n UI

1. Open the workflow
2. Click **"Execute Workflow"** button
3. Provide test data in the webhook node:

```json
{
  "body": {
    "client": {
      "client_id": "test-uuid",
      "first_name": "John",
      "last_name": "Doe",
      "email": "john.doe@example.com",
      "phone": "(815) 555-1234"
    },
    "property": {
      "property_id": "test-property-uuid",
      "street_address": "123 Main St",
      "city": "Rockford",
      "state": "IL",
      "zip_code": "61101"
    },
    "lead": {
      "lead_id": "test-lead-uuid",
      "service_type": "Kitchen Remodel",
      "message": "Interested in remodeling my kitchen. Looking for a quote."
    }
  }
}
```

4. Check execution log for errors
5. Verify quote created in Invoice Ninja
6. Check email sent to client

### End-to-End Test

1. Submit a lead via website form at `https://cdhomeimprovementsrockford.com`
2. Check n8n execution log
3. Verify client created/found in Invoice Ninja
4. Verify quote created with correct details
5. Verify client received email with quote link
6. Verify internal notification sent to team

---

## Troubleshooting

### Workflow fails at "Check Existing Client"

**Error:** `401 Unauthorized`

**Solution:** Verify Invoice Ninja API token in credentials:
```bash
# Test API token
curl -H "X-Api-Token: YOUR_TOKEN" https://portal.cdhomeimprovementsrockford.com/api/v1/clients
```

### Email not sending

**Error:** `SMTP connection failed`

**Solutions:**
1. Verify SMTP credentials
2. Check firewall allows port 587 outbound
3. Test SMTP manually:
```bash
docker exec -it n8n npm install -g nodemailer
docker exec -it n8n node -e "
const nodemailer = require('nodemailer');
const transport = nodemailer.createTransport({
  host: 'smtp.postmarkapp.com',
  port: 587,
  auth: { user: 'YOUR_TOKEN', pass: 'YOUR_TOKEN' }
});
transport.verify((err, success) => {
  console.log(err ? 'Error: ' + err : 'SMTP OK');
});
"
```

### Quote creation fails

**Error:** `Invoice Ninja API error: Client not found`

**Solution:** Ensure client was created successfully in previous step. Check Invoice Ninja logs:
```bash
docker-compose logs invoiceninja | grep ERROR
```

### Workflow not triggered from Next.js

**Solutions:**
1. Verify webhook URL is correct in `lib/n8n.ts`
2. Check n8n webhook path: `https://automate.cdhomeimprovementsrockford.com/webhook-test/lead-intake`
3. Verify Caddy reverse proxy is working:
```bash
curl -I https://automate.cdhomeimprovementsrockford.com/webhook/lead-intake
# Should return 200 or 405 (Method Not Allowed), not 404
```
4. Check n8n logs:
```bash
docker-compose logs -f n8n
```

---

## Workflow Customization

### Adjust Quote Estimates

Edit the **"Prepare Quote"** node → Code block:

```javascript
const serviceEstimates = {
  'Kitchen Remodel': 15000,  // Adjust values
  'Bathroom Remodel': 8000,
  'Deck Installation': 12000,
  'Window Installation': 5000,
  'Other': 3000
};
```

### Modify Email Templates

Edit the **"Send Client Email"** or **"Send Internal Notification"** nodes → HTML content.

### Add SMS Notifications

1. Add **Twilio** node after "Create Quote"
2. Configure Twilio credentials
3. Send SMS to `client.phone`:

```
Hi {{ client.name }}, thanks for your interest! We've sent a quote to your email. View it here: {{ quote_url }}
```

### Add Slack Notifications

1. Add **Slack** node after "Create Quote"
2. Configure Slack webhook
3. Send message to `#leads` channel

---

## Monitoring & Logs

### View Execution History

1. Go to **Executions** in n8n
2. Filter by workflow: "CDHI Lead Intake Workflow"
3. Click on execution to view detailed logs

### Common Success Metrics

- **Execution Time:** 3-8 seconds (normal)
- **Success Rate:** 98%+ (after initial setup)
- **Failed Executions:** Usually due to temporary API unavailability

### Set Up Alerts

1. Add **Error Trigger** node to workflow
2. Send alert via email/Slack when workflow fails
3. Configure retry logic for transient failures

---

## Advanced Configuration

### Add Retry Logic

Edit any HTTP Request node → **Settings** → **Retries**:
- **Max Retries:** 3
- **Retry On HTTP Codes:** 500, 502, 503, 504
- **Wait Between Retries:** 1000ms

### Add Conditional Logic

Example: Skip quote creation if lead budget is below minimum:

1. Add **IF** node after "Parse Webhook Data"
2. Condition: `{{ $json.lead.budget }} >= 5000`
3. True: Continue to "Check Existing Client"
4. False: Send "out of scope" email

### Integrate with CRM

If using external CRM (Salesforce, HubSpot):

1. Add **HTTP Request** or CRM-specific node
2. Create lead in CRM after quote creation
3. Sync client data bidirectionally

---

## Backup & Version Control

### Export Workflow

```bash
# From n8n UI
Workflows → CDHI Lead Intake Workflow → More → Export

# Save to this directory
mv ~/Downloads/CDHI_Lead_Intake_Workflow.json docker/n8n-workflows/lead-intake-v2.json
```

### Automated Backup

Workflows are included in the automated backup script (`backup.sh`):
```bash
docker-compose exec -T n8n n8n export:workflow --all > /backup/cdhi/n8n_workflows_$(date +%Y%m%d).json
```

---

## Support Resources

- **n8n Documentation:** https://docs.n8n.io
- **Invoice Ninja API Docs:** https://docs.invoiceninja.com/api/
- **n8n Community Forum:** https://community.n8n.io
- **CDHI Stack Documentation:** `../README-DOCKER.md`

---

**Last Updated:** 2025-01-28
**Version:** 1.0
**Maintained by:** CD Home Improvements DevOps Team
