# CD Home Improvements - API Documentation

**Complete API reference with examples and authentication**

---

## 📋 Table of Contents

- [Overview](#overview)
- [Authentication](#authentication)
- [Rate Limiting](#rate-limiting)
- [Error Handling](#error-handling)
- [API Endpoints](#api-endpoints)
  - [POST /api/leads](#post-apileads)
  - [POST /api/webhooks/stripe](#post-apiwebhooksstripe)
  - [POST /api/webhooks/invoiceninja](#post-apiwebhooksinvoiceninja)
  - [GET /api/admin/replay](#get-apiadminreplay)
  - [POST /api/admin/replay](#post-apiadminreplay)
- [Webhook Events](#webhook-events)
- [Testing](#testing)
- [Code Examples](#code-examples)

---

## 🎯 Overview

The CD Home Improvements API provides endpoints for lead submission, payment processing, and administrative functions. All endpoints use JSON for request and response bodies.

### Base URL

```
Production: https://cdhomeimprovementsrockford.com/api
Development: http://localhost:3000/api
```

### API Versioning

Current API Version: **v1** (implicit, no version in URL)

Future versions will be explicitly versioned (e.g., `/api/v2/leads`)

### Content Type

All requests and responses use `application/json` unless otherwise specified.

```http
Content-Type: application/json
Accept: application/json
```

---

## 🔐 Authentication

### Public Endpoints

**No authentication required:**
- `POST /api/leads` - Lead submission from website
- `POST /api/webhooks/stripe` - Stripe webhook (signature verification)
- `POST /api/webhooks/invoiceninja` - Invoice Ninja webhook (signature verification)

### Admin Endpoints

**Require Admin API Key:**
- `GET /api/admin/replay` - List failed webhook events
- `POST /api/admin/replay` - Replay failed webhook

**Authentication Header:**

```http
Authorization: Bearer YOUR_ADMIN_API_KEY
```

**Example:**

```bash
curl https://cdhomeimprovementsrockford.com/api/admin/replay \
  -H "Authorization: Bearer sk_admin_abc123xyz456"
```

**Error Response (Unauthorized):**

```json
{
  "error": "Unauthorized",
  "message": "Invalid or missing API key"
}
```

---

## ⚡ Rate Limiting

Rate limits protect the API from abuse and ensure fair usage.

### Limits

| Endpoint | Rate Limit | Window |
|----------|-----------|--------|
| POST /api/leads | 10 requests | Per hour per IP |
| POST /api/webhooks/* | 100 requests | Per minute per IP |
| GET /api/admin/replay | 60 requests | Per minute |
| POST /api/admin/replay | 20 requests | Per minute |

### Rate Limit Headers

Response includes rate limit information:

```http
X-RateLimit-Limit: 10
X-RateLimit-Remaining: 7
X-RateLimit-Reset: 1643723400
```

### Rate Limit Exceeded

**Status Code:** `429 Too Many Requests`

```json
{
  "error": "Rate limit exceeded",
  "message": "Too many requests. Please try again later.",
  "retry_after": 3600
}
```

---

## ❌ Error Handling

### Error Response Format

All errors follow a consistent format:

```json
{
  "error": "Error Type",
  "message": "Human-readable error message",
  "details": {
    "field": "Additional error details"
  }
}
```

### HTTP Status Codes

| Code | Meaning | Usage |
|------|---------|-------|
| 200 | OK | Successful request |
| 201 | Created | Resource created successfully |
| 400 | Bad Request | Invalid input or validation error |
| 401 | Unauthorized | Missing or invalid authentication |
| 403 | Forbidden | Authenticated but not authorized |
| 404 | Not Found | Resource not found |
| 429 | Too Many Requests | Rate limit exceeded |
| 500 | Internal Server Error | Server error (logged to Sentry) |
| 503 | Service Unavailable | Temporary service disruption |

### Validation Errors

**Status Code:** `400 Bad Request`

```json
{
  "error": "Validation Error",
  "message": "Invalid input data",
  "details": {
    "email": "Invalid email format",
    "zip_code": "Must be exactly 5 digits"
  }
}
```

---

## 📡 API Endpoints

### POST /api/leads

Submit a new lead from the website contact form.

#### Request

**Method:** `POST`

**URL:** `/api/leads`

**Headers:**

```http
Content-Type: application/json
```

**Body:**

```json
{
  "first_name": "string (1-100 chars, required)",
  "last_name": "string (1-100 chars, required)",
  "email": "string (valid email, required)",
  "phone": "string (optional, US format)",
  "street_address": "string (1-200 chars, required)",
  "city": "string (1-100 chars, required)",
  "state": "string (2 chars, IL, required)",
  "zip_code": "string (5 digits, required)",
  "service_type": "enum (required)",
  "message": "string (max 1000 chars, optional)"
}
```

**Service Types:**
- `"Kitchen Remodel"`
- `"Bathroom Remodel"`
- `"Deck Installation"`
- `"Window Installation"`
- `"Siding"`
- `"Roofing"`
- `"Other"`

**Example Request:**

```bash
curl -X POST https://cdhomeimprovementsrockford.com/api/leads \
  -H "Content-Type: application/json" \
  -d '{
    "first_name": "John",
    "last_name": "Doe",
    "email": "john.doe@example.com",
    "phone": "(815) 555-1234",
    "street_address": "123 Main Street",
    "city": "Rockford",
    "state": "IL",
    "zip_code": "61101",
    "service_type": "Kitchen Remodel",
    "message": "Interested in full kitchen renovation"
  }'
```

#### Response

**Status Code:** `200 OK`

**Body:**

```json
{
  "success": true,
  "client_id": "550e8400-e29b-41d4-a716-446655440000",
  "property_id": "660e8400-e29b-41d4-a716-446655440000",
  "lead_id": "770e8400-e29b-41d4-a716-446655440000",
  "message": "Thank you! We'll contact you soon."
}
```

**Response Fields:**
- `success` (boolean) - Always `true` for successful requests
- `client_id` (UUID) - Unique client identifier
- `property_id` (UUID) - Unique property identifier
- `lead_id` (UUID) - Unique lead identifier
- `message` (string) - Success message for display

#### Error Responses

**400 Bad Request - Validation Error:**

```json
{
  "error": "Validation Error",
  "message": "Invalid input data",
  "details": {
    "email": "Invalid email format",
    "zip_code": "Must be exactly 5 digits",
    "service_type": "Must be one of: Kitchen Remodel, Bathroom Remodel, ..."
  }
}
```

**500 Internal Server Error:**

```json
{
  "error": "Internal Server Error",
  "message": "Failed to process lead. Please try again.",
  "incident_id": "sentry_abc123"
}
```

#### Side Effects

1. **Database:**
   - Creates/updates client record in `clients` table
   - Creates property record in `properties` table
   - Creates lead record in `leads` table with status `NEW`

2. **n8n Workflow:**
   - Triggers lead intake workflow
   - Creates client in Invoice Ninja
   - Generates quote
   - Sends email notification to client

3. **Monitoring:**
   - Logged to Sentry (if enabled)
   - Tracked in Uptime Kuma

---

### POST /api/webhooks/stripe

Receive webhook events from Stripe for payment processing.

#### Request

**Method:** `POST`

**URL:** `/api/webhooks/stripe`

**Headers:**

```http
Content-Type: application/json
Stripe-Signature: t=1643723400,v1=abc123signature...
```

**Body:**

Stripe sends standard webhook event format. See [Stripe Webhook Documentation](https://stripe.com/docs/api/events).

**Example Event (payment_intent.succeeded):**

```json
{
  "id": "evt_1abc123",
  "object": "event",
  "type": "payment_intent.succeeded",
  "data": {
    "object": {
      "id": "pi_abc123",
      "amount": 500000,
      "currency": "usd",
      "status": "succeeded",
      "metadata": {
        "invoice_id": "550e8400-e29b-41d4-a716-446655440000",
        "client_id": "660e8400-e29b-41d4-a716-446655440000"
      }
    }
  },
  "created": 1643723400
}
```

#### Response

**Status Code:** `200 OK`

**Body:**

```json
{
  "received": true
}
```

**Idempotent Response (duplicate event):**

```json
{
  "received": true,
  "idempotent": true,
  "message": "Event already processed"
}
```

#### Error Responses

**400 Bad Request - Invalid Payload:**

```json
{
  "error": "Invalid payload",
  "message": "Webhook payload is not valid JSON"
}
```

**401 Unauthorized - Invalid Signature:**

```json
{
  "error": "Invalid signature",
  "message": "Webhook signature verification failed"
}
```

#### Supported Event Types

- `payment_intent.succeeded` - Payment successful
- `payment_intent.payment_failed` - Payment failed
- `charge.refunded` - Payment refunded

#### Side Effects

**For payment_intent.succeeded:**
1. Creates payment record in `payments` table
2. Updates invoice status to `PAID` in `invoices` table
3. Triggers Invoice Ninja webhook to mark invoice as paid

**For payment_intent.payment_failed:**
1. Logs failure in `payment_failures` table
2. Sends notification to admin

**For charge.refunded:**
1. Creates refund record in `refunds` table
2. Updates payment status

#### Idempotency

All webhook events are idempotent using `external_id` (Stripe event ID). Duplicate events return `200 OK` with `idempotent: true` and are not reprocessed.

---

### POST /api/webhooks/invoiceninja

Receive webhook events from Invoice Ninja.

#### Request

**Method:** `POST`

**URL:** `/api/webhooks/invoiceninja`

**Headers:**

```http
Content-Type: application/json
X-Ninja-Signature: sha256_signature_here
```

**Body:**

```json
{
  "event": "quote.approved",
  "quote": {
    "id": "abc123",
    "number": "Q-0001",
    "client_id": "client_abc",
    "amount": 5000.00,
    "status": "approved"
  }
}
```

#### Response

**Status Code:** `200 OK`

**Body:**

```json
{
  "received": true
}
```

#### Error Responses

**401 Unauthorized - Invalid Signature:**

```json
{
  "error": "Invalid signature",
  "message": "Webhook signature verification failed"
}
```

#### Supported Event Types

- `quote.approved` - Quote approved by client
- `invoice.created` - Invoice created
- `invoice.updated` - Invoice updated
- `payment.created` - Payment created in Invoice Ninja

#### Side Effects

**For quote.approved:**
1. Updates lead status to `QUALIFIED` in `leads` table
2. Creates invoice record in `invoices` table

**For invoice.created:**
1. Syncs invoice data to local database
2. Sends notification to admin

---

### GET /api/admin/replay

List failed webhook events from the Dead Letter Queue (DLQ).

#### Authentication

**Required:** Admin API Key

**Header:**

```http
Authorization: Bearer YOUR_ADMIN_API_KEY
```

#### Request

**Method:** `GET`

**URL:** `/api/admin/replay`

**Query Parameters:**

| Parameter | Type | Description | Default |
|-----------|------|-------------|---------|
| `limit` | integer | Max events to return | 100 |
| `offset` | integer | Pagination offset | 0 |
| `event_source` | string | Filter by source (`stripe`, `invoiceninja`) | all |
| `status` | string | Filter by status (`pending`, `replayed`) | `pending` |

**Example Request:**

```bash
curl "https://cdhomeimprovementsrockford.com/api/admin/replay?limit=50&event_source=stripe" \
  -H "Authorization: Bearer sk_admin_abc123"
```

#### Response

**Status Code:** `200 OK`

**Body:**

```json
{
  "events": [
    {
      "event_id": "dlq_abc123",
      "event_source": "stripe",
      "event_type": "payment_intent.succeeded",
      "external_id": "evt_stripe_xyz",
      "payload": { /* original webhook payload */ },
      "error_message": "Database connection timeout",
      "retry_count": 3,
      "received_at": "2025-01-28T10:30:00Z",
      "replayed_at": null
    }
  ],
  "total": 1,
  "limit": 50,
  "offset": 0
}
```

**Empty Response:**

```json
{
  "events": [],
  "total": 0,
  "limit": 100,
  "offset": 0
}
```

---

### POST /api/admin/replay

Replay a failed webhook event from the DLQ.

#### Authentication

**Required:** Admin API Key

#### Request

**Method:** `POST`

**URL:** `/api/admin/replay`

**Headers:**

```http
Content-Type: application/json
Authorization: Bearer YOUR_ADMIN_API_KEY
```

**Body:**

```json
{
  "event_id": "dlq_abc123",
  "force": false
}
```

**Parameters:**
- `event_id` (required) - DLQ event ID to replay
- `force` (optional) - Force replay even if already replayed (default: false)

**Example Request:**

```bash
curl -X POST https://cdhomeimprovementsrockford.com/api/admin/replay \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer sk_admin_abc123" \
  -d '{
    "event_id": "dlq_abc123",
    "force": false
  }'
```

#### Response

**Status Code:** `200 OK`

**Body:**

```json
{
  "success": true,
  "event_id": "dlq_abc123",
  "replayed_at": "2025-01-28T11:00:00Z",
  "message": "Event replayed successfully"
}
```

#### Error Responses

**404 Not Found:**

```json
{
  "error": "Event not found",
  "message": "No event found with ID: dlq_abc123"
}
```

**409 Conflict (already replayed):**

```json
{
  "error": "Already replayed",
  "message": "Event was already replayed at 2025-01-28T10:45:00Z. Use force=true to replay again."
}
```

**500 Replay Failed:**

```json
{
  "error": "Replay failed",
  "message": "Failed to replay event: Database connection timeout",
  "original_error": "..."
}
```

---

## 🔔 Webhook Events

### Registering Webhooks

#### Stripe

1. Go to: https://dashboard.stripe.com/webhooks
2. Click "Add endpoint"
3. URL: `https://cdhomeimprovementsrockford.com/api/webhooks/stripe`
4. Events: `payment_intent.succeeded`, `payment_intent.payment_failed`, `charge.refunded`
5. Copy signing secret to `STRIPE_WEBHOOK_SECRET`

#### Invoice Ninja

1. Go to: Invoice Ninja → Settings → Webhooks
2. Target URL: `https://cdhomeimprovementsrockford.com/api/webhooks/invoiceninja`
3. Events: All events
4. Set shared secret in Invoice Ninja and `INVOICENINJA_WEBHOOK_SECRET`

### Webhook Security

All webhooks verify signatures:

**Stripe:** Uses `Stripe-Signature` header with HMAC-SHA256

**Invoice Ninja:** Uses `X-Ninja-Signature` header with HMAC-SHA256

**Verification fails → 401 Unauthorized**

---

## 🧪 Testing

### Local Testing

#### Test Lead Submission

```bash
# Start development server
npm run dev

# Submit test lead
curl -X POST http://localhost:3000/api/leads \
  -H "Content-Type: application/json" \
  -d '{
    "first_name": "Test",
    "last_name": "User",
    "email": "test@example.com",
    "street_address": "123 Test St",
    "city": "Rockford",
    "state": "IL",
    "zip_code": "61101",
    "service_type": "Other"
  }'
```

#### Test Stripe Webhook

```bash
# Install Stripe CLI
brew install stripe/stripe-brew/stripe

# Login
stripe login

# Forward webhooks to localhost
stripe listen --forward-to localhost:3000/api/webhooks/stripe

# Trigger test event
stripe trigger payment_intent.succeeded
```

### Production Testing

#### Test with Curl

```bash
# Test lead submission (production)
curl -X POST https://cdhomeimprovementsrockford.com/api/leads \
  -H "Content-Type: application/json" \
  -d @test-lead.json
```

#### Test with Postman

Import this collection:

```json
{
  "info": {
    "name": "CD Home Improvements API",
    "schema": "https://schema.getpostman.com/json/collection/v2.1.0/collection.json"
  },
  "item": [
    {
      "name": "Submit Lead",
      "request": {
        "method": "POST",
        "header": [
          {
            "key": "Content-Type",
            "value": "application/json"
          }
        ],
        "url": {
          "raw": "{{base_url}}/api/leads",
          "host": ["{{base_url}}"],
          "path": ["api", "leads"]
        },
        "body": {
          "mode": "raw",
          "raw": "{\n  \"first_name\": \"Test\",\n  \"last_name\": \"User\",\n  \"email\": \"test@example.com\",\n  \"street_address\": \"123 Test St\",\n  \"city\": \"Rockford\",\n  \"state\": \"IL\",\n  \"zip_code\": \"61101\",\n  \"service_type\": \"Other\"\n}"
        }
      }
    }
  ],
  "variable": [
    {
      "key": "base_url",
      "value": "https://cdhomeimprovementsrockford.com",
      "type": "string"
    }
  ]
}
```

---

## 💻 Code Examples

### JavaScript/TypeScript

```typescript
// Submit lead
async function submitLead(leadData: LeadData) {
  const response = await fetch('https://cdhomeimprovementsrockford.com/api/leads', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(leadData),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message);
  }

  return await response.json();
}

// Usage
try {
  const result = await submitLead({
    first_name: 'John',
    last_name: 'Doe',
    email: 'john@example.com',
    street_address: '123 Main St',
    city: 'Rockford',
    state: 'IL',
    zip_code: '61101',
    service_type: 'Kitchen Remodel',
  });

  console.log('Lead submitted:', result.lead_id);
} catch (error) {
  console.error('Failed to submit lead:', error);
}
```

### Python

```python
import requests

def submit_lead(lead_data):
    """Submit a lead to CD Home Improvements API"""
    url = 'https://cdhomeimprovementsrockford.com/api/leads'
    headers = {'Content-Type': 'application/json'}

    response = requests.post(url, json=lead_data, headers=headers)

    if response.status_code == 200:
        return response.json()
    else:
        raise Exception(f"Failed to submit lead: {response.json()}")

# Usage
try:
    result = submit_lead({
        'first_name': 'John',
        'last_name': 'Doe',
        'email': 'john@example.com',
        'street_address': '123 Main St',
        'city': 'Rockford',
        'state': 'IL',
        'zip_code': '61101',
        'service_type': 'Kitchen Remodel'
    })

    print(f"Lead submitted: {result['lead_id']}")
except Exception as e:
    print(f"Error: {e}")
```

### PHP

```php
<?php

function submitLead($leadData) {
    $url = 'https://cdhomeimprovementsrockford.com/api/leads';

    $ch = curl_init($url);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_POST, true);
    curl_setopt($ch, CURLOPT_HTTPHEADER, ['Content-Type: application/json']);
    curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($leadData));

    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);

    if ($httpCode === 200) {
        return json_decode($response, true);
    } else {
        throw new Exception("Failed to submit lead: $response");
    }
}

// Usage
try {
    $result = submitLead([
        'first_name' => 'John',
        'last_name' => 'Doe',
        'email' => 'john@example.com',
        'street_address' => '123 Main St',
        'city' => 'Rockford',
        'state' => 'IL',
        'zip_code' => '61101',
        'service_type' => 'Kitchen Remodel'
    ]);

    echo "Lead submitted: " . $result['lead_id'];
} catch (Exception $e) {
    echo "Error: " . $e->getMessage();
}
?>
```

### cURL (Bash)

```bash
#!/bin/bash

# Submit lead via API
submit_lead() {
  curl -X POST https://cdhomeimprovementsrockford.com/api/leads \
    -H "Content-Type: application/json" \
    -d '{
      "first_name": "John",
      "last_name": "Doe",
      "email": "john@example.com",
      "street_address": "123 Main St",
      "city": "Rockford",
      "state": "IL",
      "zip_code": "61101",
      "service_type": "Kitchen Remodel"
    }'
}

# Execute
result=$(submit_lead)

# Check if successful
if echo "$result" | grep -q '"success":true'; then
  echo "✅ Lead submitted successfully"
  lead_id=$(echo "$result" | jq -r '.lead_id')
  echo "Lead ID: $lead_id"
else
  echo "❌ Failed to submit lead"
  echo "$result"
fi
```

---

## 📚 Additional Resources

- **Stripe API Documentation:** https://stripe.com/docs/api
- **Invoice Ninja API Documentation:** https://api-docs.invoicing.co/
- **Supabase Documentation:** https://supabase.com/docs
- **Next.js API Routes:** https://nextjs.org/docs/app/building-your-application/routing/route-handlers

---

**Last Updated:** 2025-01-28
**API Version:** v1
**Maintained by:** CD Home Improvements Development Team
