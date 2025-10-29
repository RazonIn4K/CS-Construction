#!/bin/bash
# ==============================================================================
# API Endpoint Testing Script
# ==============================================================================
# Tests all CRUD operations against the live database
#
# Usage:
#   ./scripts/test-api-endpoints.sh <base_url> <access_token>
#
# Example:
#   ./scripts/test-api-endpoints.sh http://localhost:3000 eyJhbGc...
#   ./scripts/test-api-endpoints.sh https://your-app.vercel.app eyJhbGc...
# ==============================================================================

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
BASE_URL="${1:-http://localhost:3000}"
ACCESS_TOKEN="${2}"

if [ -z "$ACCESS_TOKEN" ]; then
  echo -e "${RED}Error: ACCESS_TOKEN is required${NC}"
  echo "Usage: $0 <base_url> <access_token>"
  echo ""
  echo "To get your access token:"
  echo "1. Login at ${BASE_URL}/login"
  echo "2. Open browser DevTools -> Application -> Cookies"
  echo "3. Copy the value of 'sb-access-token'"
  exit 1
fi

# Test counter
TOTAL_TESTS=0
PASSED_TESTS=0
FAILED_TESTS=0

# Test IDs (will be populated during tests)
CLIENT_ID=""
LEAD_ID=""
JOB_ID=""
INVOICE_ID=""

# Helper function to make API requests
api_request() {
  local method="$1"
  local endpoint="$2"
  local data="$3"

  if [ -z "$data" ]; then
    curl -s -X "$method" \
      -H "Authorization: Bearer $ACCESS_TOKEN" \
      -H "Content-Type: application/json" \
      "${BASE_URL}${endpoint}"
  else
    curl -s -X "$method" \
      -H "Authorization: Bearer $ACCESS_TOKEN" \
      -H "Content-Type: application/json" \
      -d "$data" \
      "${BASE_URL}${endpoint}"
  fi
}

# Helper function to test an endpoint
test_endpoint() {
  local test_name="$1"
  local method="$2"
  local endpoint="$3"
  local data="$4"
  local expected_status="${5:-200}"

  TOTAL_TESTS=$((TOTAL_TESTS + 1))

  echo -e "\n${BLUE}[$TOTAL_TESTS] Testing: ${test_name}${NC}"
  echo "    ${method} ${endpoint}"

  # Make request and capture response
  response=$(api_request "$method" "$endpoint" "$data")
  http_code=$(echo "$response" | tail -1)

  # Check for errors in response
  if echo "$response" | jq -e '.error' > /dev/null 2>&1; then
    error=$(echo "$response" | jq -r '.error')
    echo -e "    ${RED}✗ FAILED: ${error}${NC}"
    FAILED_TESTS=$((FAILED_TESTS + 1))
    return 1
  fi

  echo -e "    ${GREEN}✓ PASSED${NC}"
  PASSED_TESTS=$((PASSED_TESTS + 1))

  # Return response for further processing
  echo "$response"
}

# Start testing
echo -e "${YELLOW}"
echo "=============================================================================="
echo "  API Endpoint Testing"
echo "=============================================================================="
echo -e "${NC}"
echo "Base URL: ${BASE_URL}"
echo "Access Token: ${ACCESS_TOKEN:0:20}..."
echo ""

# ==============================================================================
# Test Dashboard Stats
# ==============================================================================
echo -e "\n${YELLOW}=== Dashboard API Tests ===${NC}"

test_endpoint \
  "Get dashboard stats" \
  "GET" \
  "/api/dashboard/stats" \
  "" \
  200 > /tmp/stats.json

cat /tmp/stats.json | jq '.'

test_endpoint \
  "Get current projects" \
  "GET" \
  "/api/dashboard/projects" \
  "" \
  200 > /tmp/projects.json

cat /tmp/projects.json | jq '.'

test_endpoint \
  "Get recent invoices" \
  "GET" \
  "/api/dashboard/invoices" \
  "" \
  200 > /tmp/invoices_dash.json

cat /tmp/invoices_dash.json | jq '.'

# ==============================================================================
# Test Clients CRUD
# ==============================================================================
echo -e "\n${YELLOW}=== Clients API Tests ===${NC}"

# Create client
create_client_response=$(test_endpoint \
  "Create new client" \
  "POST" \
  "/api/clients" \
  '{
    "first_name": "Test",
    "last_name": "Client",
    "email": "test.client@example.com",
    "phone": "(555) 123-4567",
    "company_name": "Test Company LLC",
    "preferred_contact_method": "email"
  }' \
  200)

CLIENT_ID=$(echo "$create_client_response" | jq -r '.client.id')
echo "    Created Client ID: ${CLIENT_ID}"

# List clients
test_endpoint \
  "List all clients" \
  "GET" \
  "/api/clients" \
  "" \
  200 > /tmp/clients.json

# Get client by ID
test_endpoint \
  "Get client by ID" \
  "GET" \
  "/api/clients/${CLIENT_ID}" \
  "" \
  200 > /tmp/client_detail.json

# Update client
test_endpoint \
  "Update client" \
  "PATCH" \
  "/api/clients/${CLIENT_ID}" \
  '{
    "company_name": "Updated Test Company LLC",
    "phone": "(555) 999-9999"
  }' \
  200 > /tmp/client_updated.json

# ==============================================================================
# Test Leads CRUD
# ==============================================================================
echo -e "\n${YELLOW}=== Leads API Tests ===${NC}"

# Create lead (public endpoint - no auth required)
create_lead_response=$(curl -s -X POST \
  -H "Content-Type: application/json" \
  -d '{
    "first_name": "Test",
    "last_name": "Lead",
    "email": "test.lead@example.com",
    "phone": "(555) 234-5678",
    "address1": "123 Test Street",
    "city": "Test City",
    "state": "CA",
    "zip": "12345",
    "service_interest": "Kitchen Remodel",
    "intake_notes": "Test lead from API script"
  }' \
  "${BASE_URL}/api/leads")

LEAD_ID=$(echo "$create_lead_response" | jq -r '.lead.id')
echo -e "${BLUE}[*] Created Lead ID: ${LEAD_ID}${NC}"

# List leads (authenticated)
test_endpoint \
  "List all leads" \
  "GET" \
  "/api/leads/list" \
  "" \
  200 > /tmp/leads.json

# Get lead by ID
test_endpoint \
  "Get lead by ID" \
  "GET" \
  "/api/leads/${LEAD_ID}" \
  "" \
  200 > /tmp/lead_detail.json

# Update lead status
test_endpoint \
  "Update lead status" \
  "PATCH" \
  "/api/leads/${LEAD_ID}" \
  '{
    "status": "contacted",
    "notes": "Called and left voicemail",
    "follow_up_date": "2025-11-05"
  }' \
  200 > /tmp/lead_updated.json

# ==============================================================================
# Test Jobs CRUD
# ==============================================================================
echo -e "\n${YELLOW}=== Jobs API Tests ===${NC}"

# Create job
create_job_response=$(test_endpoint \
  "Create new job" \
  "POST" \
  "/api/jobs" \
  "{
    \"client_id\": \"${CLIENT_ID}\",
    \"job_number\": \"JOB-TEST-$(date +%s)\",
    \"title\": \"Test Kitchen Remodel\",
    \"description\": \"Complete kitchen renovation\",
    \"status\": \"scheduled\",
    \"start_date\": \"2025-11-10\",
    \"estimated_completion\": \"2025-12-15\",
    \"budget\": 25000.00
  }" \
  200)

JOB_ID=$(echo "$create_job_response" | jq -r '.job.id')
echo "    Created Job ID: ${JOB_ID}"

# List jobs
test_endpoint \
  "List all jobs" \
  "GET" \
  "/api/jobs" \
  "" \
  200 > /tmp/jobs.json

# Get job by ID
test_endpoint \
  "Get job by ID" \
  "GET" \
  "/api/jobs/${JOB_ID}" \
  "" \
  200 > /tmp/job_detail.json

# Update job status
test_endpoint \
  "Update job status" \
  "PATCH" \
  "/api/jobs/${JOB_ID}" \
  '{
    "status": "in_progress",
    "actual_start_date": "2025-11-10"
  }' \
  200 > /tmp/job_updated.json

# ==============================================================================
# Test Invoices
# ==============================================================================
echo -e "\n${YELLOW}=== Invoices API Tests ===${NC}"

# Create invoice
create_invoice_response=$(test_endpoint \
  "Create new invoice" \
  "POST" \
  "/api/invoices" \
  "{
    \"client_id\": \"${CLIENT_ID}\",
    \"job_id\": \"${JOB_ID}\",
    \"invoice_number\": \"INV-TEST-$(date +%s)\",
    \"issue_date\": \"2025-10-29\",
    \"due_date\": \"2025-11-29\",
    \"status\": \"sent\",
    \"items\": [
      {
        \"description\": \"Kitchen Cabinets\",
        \"quantity\": 10,
        \"unit_price\": 500.00
      },
      {
        \"description\": \"Labor\",
        \"quantity\": 40,
        \"unit_price\": 75.00
      }
    ]
  }" \
  200)

INVOICE_ID=$(echo "$create_invoice_response" | jq -r '.invoice.id')
echo "    Created Invoice ID: ${INVOICE_ID}"

# List invoices
test_endpoint \
  "List all invoices" \
  "GET" \
  "/api/invoices" \
  "" \
  200 > /tmp/invoices.json

# Get invoice by ID (includes items and payments)
test_endpoint \
  "Get invoice by ID" \
  "GET" \
  "/api/invoices/${INVOICE_ID}" \
  "" \
  200 > /tmp/invoice_detail.json

echo -e "\n${BLUE}Invoice Details:${NC}"
cat /tmp/invoice_detail.json | jq '{
  invoice_number: .invoice.invoice_number,
  status: .invoice.status,
  subtotal: .invoice.subtotal,
  amount_paid: .invoice.amount_paid,
  balance_due: .invoice.balance_due,
  items: .invoice.invoice_items | length,
  payments: .invoice.payments | length
}'

# ==============================================================================
# Cleanup (optional - comment out to keep test data)
# ==============================================================================
echo -e "\n${YELLOW}=== Cleanup ===${NC}"

read -p "Delete test data? (y/N) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
  # Delete in reverse order of creation (due to foreign keys)
  if [ -n "$INVOICE_ID" ]; then
    test_endpoint "Delete invoice" "DELETE" "/api/invoices/${INVOICE_ID}" "" 200 > /dev/null || true
  fi

  if [ -n "$JOB_ID" ]; then
    test_endpoint "Delete job" "DELETE" "/api/jobs/${JOB_ID}" "" 200 > /dev/null || true
  fi

  if [ -n "$LEAD_ID" ]; then
    test_endpoint "Delete lead" "DELETE" "/api/leads/${LEAD_ID}" "" 200 > /dev/null || true
  fi

  if [ -n "$CLIENT_ID" ]; then
    test_endpoint "Delete client" "DELETE" "/api/clients/${CLIENT_ID}" "" 200 > /dev/null || true
  fi

  echo -e "${GREEN}Test data cleaned up${NC}"
else
  echo -e "${YELLOW}Test data preserved. IDs:${NC}"
  echo "  CLIENT_ID: ${CLIENT_ID}"
  echo "  LEAD_ID: ${LEAD_ID}"
  echo "  JOB_ID: ${JOB_ID}"
  echo "  INVOICE_ID: ${INVOICE_ID}"
fi

# ==============================================================================
# Summary
# ==============================================================================
echo -e "\n${YELLOW}"
echo "=============================================================================="
echo "  Test Summary"
echo "=============================================================================="
echo -e "${NC}"
echo "Total Tests:  ${TOTAL_TESTS}"
echo -e "Passed:       ${GREEN}${PASSED_TESTS}${NC}"
echo -e "Failed:       ${RED}${FAILED_TESTS}${NC}"
echo ""

if [ $FAILED_TESTS -eq 0 ]; then
  echo -e "${GREEN}✓ All tests passed!${NC}"
  exit 0
else
  echo -e "${RED}✗ Some tests failed${NC}"
  exit 1
fi
