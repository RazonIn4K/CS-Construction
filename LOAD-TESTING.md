# Load Testing and Performance Validation

## Table of Contents
1. [Overview](#overview)
2. [Load Testing Strategy](#load-testing-strategy)
3. [k6 Setup and Configuration](#k6-setup-and-configuration)
4. [Apache Bench Testing](#apache-bench-testing)
5. [Load Testing Scenarios](#load-testing-scenarios)
6. [Stress Testing](#stress-testing)
7. [Spike Testing](#spike-testing)
8. [Soak Testing](#soak-testing)
9. [Performance Validation](#performance-validation)
10. [Analyzing Results](#analyzing-results)
11. [Common Performance Issues](#common-performance-issues)
12. [Continuous Performance Testing](#continuous-performance-testing)

---

## Overview

This guide provides comprehensive load testing and performance validation procedures for the CD Home Improvements system. Load testing ensures:

- **Capacity Planning**: Understand system limits and plan for growth
- **Performance Validation**: Verify system meets performance targets
- **Bottleneck Identification**: Find and fix performance bottlenecks
- **Reliability**: Ensure system stability under load
- **User Experience**: Maintain fast response times under realistic load

### Performance Targets

| Metric | Target | Measurement |
|--------|--------|-------------|
| **Page Load Time** | < 2s | Time to Interactive (TTI) |
| **API Response Time** | < 500ms | 95th percentile |
| **Database Query Time** | < 100ms | 95th percentile |
| **Error Rate** | < 0.1% | Errors / Total Requests |
| **Concurrent Users** | 100+ | Simultaneous active users |
| **Throughput** | 1000+ req/min | Sustained request rate |
| **Availability** | 99.9% | Uptime target |

### Testing Types

| Test Type | Purpose | Duration | Load Pattern |
|-----------|---------|----------|--------------|
| **Smoke Test** | Basic functionality | 1-5 min | 1-5 users |
| **Load Test** | Normal capacity | 10-30 min | Ramp up to target |
| **Stress Test** | Find breaking point | 30-60 min | Beyond capacity |
| **Spike Test** | Sudden traffic surge | 5-15 min | Sharp spike |
| **Soak Test** | Stability over time | 2-12 hours | Sustained load |
| **Scalability Test** | Horizontal scaling | 30-60 min | Incremental increase |

---

## Load Testing Strategy

### Testing Phases

```
Phase 1: Smoke Testing
├── Verify basic functionality
├── 1-5 virtual users
└── Duration: 1-5 minutes

Phase 2: Load Testing
├── Normal expected load
├── 50-100 virtual users
└── Duration: 10-30 minutes

Phase 3: Stress Testing
├── Push beyond capacity
├── 100-500 virtual users
└── Duration: 30-60 minutes

Phase 4: Spike Testing
├── Sudden traffic surge
├── 10 → 200 → 10 users
└── Duration: 5-15 minutes

Phase 5: Soak Testing
├── Sustained load over time
├── 50-100 virtual users
└── Duration: 2-12 hours
```

### Test Environment

```bash
# Production-like environment
# Separate from actual production!

# Infrastructure:
# - Same VPS specs as production
# - Same database size and data volume
# - Same network configuration
# - Separate domain: test.cdhomeimprovementsrockford.com

# Data:
# - Use production-like test data
# - ~10,000 test leads
# - ~1,000 test clients
# - ~500 test invoices
```

### Testing Best Practices

```markdown
## Load Testing Checklist

**Before Testing:**
- [ ] Test in production-like environment (not production!)
- [ ] Use realistic test data and scenarios
- [ ] Warm up system (cache, database connections)
- [ ] Baseline current performance
- [ ] Monitor system resources during test
- [ ] Notify team of testing schedule

**During Testing:**
- [ ] Monitor CPU, memory, disk, network
- [ ] Watch error rates and response times
- [ ] Check database connection pool
- [ ] Monitor application logs
- [ ] Track user experience metrics

**After Testing:**
- [ ] Analyze results and compare to targets
- [ ] Identify bottlenecks and issues
- [ ] Document findings and recommendations
- [ ] Create tickets for performance improvements
- [ ] Re-test after optimizations
```

---

## k6 Setup and Configuration

### Installation

```bash
# Install k6 (macOS)
brew install k6

# Install k6 (Linux)
sudo gpg -k
sudo gpg --no-default-keyring --keyring /usr/share/keyrings/k6-archive-keyring.gpg --keyserver hkp://keyserver.ubuntu.com:80 --recv-keys C5AD17C747E3415A3642D57D77C6C491D6AC1D69
echo "deb [signed-by=/usr/share/keyrings/k6-archive-keyring.gpg] https://dl.k6.io/deb stable main" | sudo tee /etc/apt/sources.list.d/k6.list
sudo apt-get update
sudo apt-get install k6

# Install k6 (Windows)
choco install k6

# Verify installation
k6 version
```

### Basic k6 Script

```javascript
// tests/load/smoke-test.js
import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  vus: 5,  // 5 virtual users
  duration: '1m',  // Run for 1 minute
  thresholds: {
    http_req_duration: ['p(95)<500'],  // 95% of requests < 500ms
    http_req_failed: ['rate<0.01'],    // Error rate < 1%
  },
};

export default function () {
  // Homepage
  const homeResponse = http.get('https://test.cdhomeimprovementsrockford.com');
  check(homeResponse, {
    'homepage status is 200': (r) => r.status === 200,
    'homepage load time < 2s': (r) => r.timings.duration < 2000,
  });

  sleep(1);

  // Services page
  const servicesResponse = http.get('https://test.cdhomeimprovementsrockford.com/services');
  check(servicesResponse, {
    'services status is 200': (r) => r.status === 200,
  });

  sleep(1);
}
```

### Running k6 Tests

```bash
# Run smoke test
k6 run tests/load/smoke-test.js

# Run with custom VUs and duration
k6 run --vus 10 --duration 30s tests/load/smoke-test.js

# Run with environment variables
k6 run -e BASE_URL=https://test.cdhomeimprovementsrockford.com tests/load/load-test.js

# Run with JSON output
k6 run --out json=results.json tests/load/load-test.js

# Run with cloud output (k6 Cloud)
k6 cloud tests/load/load-test.js
```

---

## Load Testing Scenarios

### Scenario 1: Homepage Load Test

```javascript
// tests/load/homepage-load-test.js
import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  stages: [
    { duration: '2m', target: 10 },   // Ramp up to 10 users
    { duration: '5m', target: 10 },   // Stay at 10 users
    { duration: '2m', target: 50 },   // Ramp up to 50 users
    { duration: '5m', target: 50 },   // Stay at 50 users
    { duration: '2m', target: 100 },  // Ramp up to 100 users
    { duration: '5m', target: 100 },  // Stay at 100 users
    { duration: '2m', target: 0 },    // Ramp down to 0
  ],
  thresholds: {
    http_req_duration: ['p(95)<2000'],  // 95% < 2s
    http_req_failed: ['rate<0.01'],     // < 1% errors
  },
};

export default function () {
  const response = http.get('https://test.cdhomeimprovementsrockford.com');

  check(response, {
    'status is 200': (r) => r.status === 200,
    'has correct title': (r) => r.body.includes('CD Home Improvements'),
    'load time < 2s': (r) => r.timings.duration < 2000,
  });

  sleep(Math.random() * 3 + 2);  // Sleep 2-5 seconds (realistic user behavior)
}
```

### Scenario 2: Lead Submission Load Test

```javascript
// tests/load/lead-submission-test.js
import http from 'k6/http';
import { check, sleep } from 'k6';
import { SharedArray } from 'k6/data';

// Load test data
const testLeads = new SharedArray('leads', function () {
  return JSON.parse(open('./test-data/leads.json'));
});

export const options = {
  stages: [
    { duration: '1m', target: 10 },
    { duration: '3m', target: 10 },
    { duration: '1m', target: 0 },
  ],
  thresholds: {
    http_req_duration: ['p(95)<500'],
    http_req_failed: ['rate<0.01'],
  },
};

export default function () {
  // Get random lead from test data
  const lead = testLeads[Math.floor(Math.random() * testLeads.length)];

  // Submit lead
  const payload = JSON.stringify({
    first_name: lead.first_name,
    last_name: lead.last_name,
    email: `test-${Date.now()}-${__VU}@example.com`,  // Unique email
    phone: lead.phone,
    service_type: lead.service_type,
    message: lead.message,
  });

  const params = {
    headers: {
      'Content-Type': 'application/json',
    },
  };

  const response = http.post(
    'https://test.cdhomeimprovementsrockford.com/api/leads',
    payload,
    params
  );

  check(response, {
    'status is 200 or 201': (r) => r.status === 200 || r.status === 201,
    'response has lead_id': (r) => JSON.parse(r.body).lead_id !== undefined,
    'response time < 500ms': (r) => r.timings.duration < 500,
  });

  sleep(5);  // Wait 5 seconds between submissions
}
```

### Scenario 3: API Endpoint Load Test

```javascript
// tests/load/api-load-test.js
import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  stages: [
    { duration: '2m', target: 20 },
    { duration: '5m', target: 20 },
    { duration: '2m', target: 0 },
  ],
  thresholds: {
    http_req_duration: ['p(95)<500'],
    http_req_failed: ['rate<0.01'],
  },
};

const BASE_URL = 'https://test.cdhomeimprovementsrockford.com';

export default function () {
  // Test multiple API endpoints

  // 1. GET /api/leads
  const leadsResponse = http.get(`${BASE_URL}/api/leads?limit=50`);
  check(leadsResponse, {
    'GET leads status 200': (r) => r.status === 200,
    'GET leads < 500ms': (r) => r.timings.duration < 500,
  });

  sleep(1);

  // 2. GET /api/clients
  const clientsResponse = http.get(`${BASE_URL}/api/clients?limit=50`);
  check(clientsResponse, {
    'GET clients status 200': (r) => r.status === 200,
    'GET clients < 500ms': (r) => r.timings.duration < 500,
  });

  sleep(1);

  // 3. GET /api/invoices
  const invoicesResponse = http.get(`${BASE_URL}/api/invoices?limit=50`);
  check(invoicesResponse, {
    'GET invoices status 200': (r) => r.status === 200,
    'GET invoices < 500ms': (r) => r.timings.duration < 500,
  });

  sleep(1);

  // 4. GET /api/health
  const healthResponse = http.get(`${BASE_URL}/api/health`);
  check(healthResponse, {
    'Health check status 200': (r) => r.status === 200,
    'Health check < 100ms': (r) => r.timings.duration < 100,
  });

  sleep(2);
}
```

### Scenario 4: Mixed User Journey

```javascript
// tests/load/user-journey-test.js
import http from 'k6/http';
import { check, sleep, group } from 'k6';

export const options = {
  stages: [
    { duration: '2m', target: 50 },
    { duration: '5m', target: 50 },
    { duration: '2m', target: 0 },
  ],
  thresholds: {
    http_req_duration: ['p(95)<2000'],
    http_req_failed: ['rate<0.01'],
    'group_duration{group:::Homepage}': ['p(95)<2000'],
    'group_duration{group:::Services}': ['p(95)<2000'],
    'group_duration{group:::Contact}': ['p(95)<2000'],
  },
};

const BASE_URL = 'https://test.cdhomeimprovementsrockford.com';

export default function () {
  // Simulate realistic user journey

  group('Homepage', function () {
    const response = http.get(BASE_URL);
    check(response, {
      'homepage loaded': (r) => r.status === 200,
    });
    sleep(2);  // User reads homepage
  });

  group('Services', function () {
    const response = http.get(`${BASE_URL}/services`);
    check(response, {
      'services loaded': (r) => r.status === 200,
    });
    sleep(5);  // User browses services
  });

  group('About', function () {
    const response = http.get(`${BASE_URL}/about`);
    check(response, {
      'about loaded': (r) => r.status === 200,
    });
    sleep(3);  // User reads about page
  });

  // 30% of users submit contact form
  if (Math.random() < 0.3) {
    group('Contact', function () {
      const response = http.get(`${BASE_URL}/contact`);
      check(response, {
        'contact loaded': (r) => r.status === 200,
      });
      sleep(10);  // User fills out form

      // Submit lead
      const payload = JSON.stringify({
        first_name: 'Load',
        last_name: 'Test',
        email: `test-${Date.now()}-${__VU}@example.com`,
        phone: '815-555-1234',
        service_type: 'Kitchen Remodeling',
        message: 'Load test lead submission',
      });

      const submitResponse = http.post(
        `${BASE_URL}/api/leads`,
        payload,
        { headers: { 'Content-Type': 'application/json' } }
      );

      check(submitResponse, {
        'lead submitted': (r) => r.status === 200 || r.status === 201,
      });
    });
  }

  sleep(5);  // User idle time before leaving
}
```

---

## Stress Testing

### Purpose

Stress testing pushes the system beyond normal capacity to:
- Find the breaking point
- Identify how the system fails
- Verify error handling under stress
- Plan capacity for growth

### Stress Test Script

```javascript
// tests/stress/stress-test.js
import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  stages: [
    { duration: '2m', target: 50 },    // Warm up
    { duration: '5m', target: 50 },    // Baseline
    { duration: '2m', target: 100 },   // Ramp up
    { duration: '5m', target: 100 },   // Sustained load
    { duration: '2m', target: 200 },   // Push further
    { duration: '5m', target: 200 },   // High load
    { duration: '2m', target: 500 },   // Breaking point
    { duration: '5m', target: 500 },   // Sustained stress
    { duration: '5m', target: 0 },     // Recovery
  ],
  thresholds: {
    http_req_duration: ['p(95)<5000'],  // Relaxed threshold
    http_req_failed: ['rate<0.05'],     // Allow up to 5% errors
  },
};

const BASE_URL = 'https://test.cdhomeimprovementsrockford.com';

export default function () {
  const response = http.get(BASE_URL);

  check(response, {
    'status is 200': (r) => r.status === 200,
    'not timing out': (r) => r.timings.duration < 30000,
  });

  // Log high response times
  if (response.timings.duration > 2000) {
    console.log(`High response time: ${response.timings.duration}ms at ${__VU} VUs`);
  }

  // Log errors
  if (response.status !== 200) {
    console.log(`Error: ${response.status} at ${__VU} VUs`);
  }

  sleep(1);
}
```

### Analyzing Stress Test Results

```bash
# Run stress test with detailed output
k6 run --out json=stress-results.json tests/stress/stress-test.js

# Analyze results
cat stress-results.json | jq -r '
  select(.type == "Point" and .metric == "http_req_duration") |
  "\(.data.time) - \(.data.value)ms - \(.data.tags.status)"
' | tail -1000

# Find breaking point (when errors start)
cat stress-results.json | jq -r '
  select(.type == "Point" and .metric == "http_req_failed" and .data.value == 1) |
  "\(.data.time) - Failed request"
' | head -10

# Check system resources during test
# (Run on server during test)
while true; do
  echo "$(date) - CPU: $(top -bn1 | grep "Cpu(s)" | awk '{print $2}')% - RAM: $(free -m | awk 'NR==2{printf "%.2f%%", $3*100/$2 }')"
  sleep 5
done
```

---

## Spike Testing

### Purpose

Spike testing simulates sudden traffic surges to:
- Verify auto-scaling works
- Test rate limiting
- Validate cache behavior
- Check for race conditions

### Spike Test Script

```javascript
// tests/spike/spike-test.js
import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  stages: [
    { duration: '1m', target: 10 },    // Normal load
    { duration: '30s', target: 200 },  // Sudden spike!
    { duration: '1m', target: 200 },   // Sustained spike
    { duration: '30s', target: 10 },   // Return to normal
    { duration: '1m', target: 10 },    // Recovery
  ],
  thresholds: {
    http_req_duration: ['p(95)<3000'],
    http_req_failed: ['rate<0.05'],
  },
};

const BASE_URL = 'https://test.cdhomeimprovementsrockford.com';

export default function () {
  const response = http.get(BASE_URL);

  check(response, {
    'status is 200': (r) => r.status === 200,
    'response time acceptable': (r) => r.timings.duration < 5000,
  });

  // No sleep - maximum requests per VU
}
```

### Monitoring During Spike Test

```bash
# Monitor in real-time during spike test
watch -n 1 'curl -s https://test.cdhomeimprovementsrockford.com/api/health | jq'

# Monitor server resources
ssh user@test-server "watch -n 1 'free -m && echo && uptime'"

# Check cache hit rate
watch -n 1 'redis-cli INFO stats | grep keyspace_hits'
```

---

## Soak Testing

### Purpose

Soak testing runs sustained load to:
- Find memory leaks
- Detect resource exhaustion
- Verify stability over time
- Check for degradation

### Soak Test Script

```javascript
// tests/soak/soak-test.js
import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  stages: [
    { duration: '5m', target: 50 },      // Ramp up
    { duration: '2h', target: 50 },      // Sustained load for 2 hours
    { duration: '5m', target: 0 },       // Ramp down
  ],
  thresholds: {
    http_req_duration: ['p(95)<1000'],
    http_req_failed: ['rate<0.01'],
  },
};

const BASE_URL = 'https://test.cdhomeimprovementsrockford.com';

export default function () {
  // Vary requests to simulate realistic usage
  const endpoints = [
    '/',
    '/services',
    '/about',
    '/contact',
    '/api/leads',
  ];

  const endpoint = endpoints[Math.floor(Math.random() * endpoints.length)];
  const response = http.get(`${BASE_URL}${endpoint}`);

  check(response, {
    'status is 200': (r) => r.status === 200,
    'response time stable': (r) => r.timings.duration < 1000,
  });

  sleep(Math.random() * 5 + 2);  // Sleep 2-7 seconds
}
```

### Monitoring During Soak Test

```bash
# Monitor memory over time (run on server)
#!/bin/bash
# monitor-soak.sh

LOG_FILE="soak-test-$(date +%Y%m%d-%H%M%S).log"

echo "Timestamp,CPU%,RAM%,Disk%,Load1m,Load5m,Load15m" > $LOG_FILE

while true; do
  TIMESTAMP=$(date +%Y-%m-%d\ %H:%M:%S)
  CPU=$(top -bn1 | grep "Cpu(s)" | awk '{print $2}' | cut -d'%' -f1)
  RAM=$(free | awk '/Mem/{printf("%.2f"), $3/$2*100}')
  DISK=$(df -h / | awk 'NR==2{print $5}' | sed 's/%//')
  LOAD=$(uptime | awk -F'load average:' '{print $2}' | awk '{print $1" "$2" "$3}' | tr ',' ' ')

  echo "$TIMESTAMP,$CPU,$RAM,$DISK,$LOAD" >> $LOG_FILE

  sleep 60  # Log every minute
done

# Run during soak test:
# ./monitor-soak.sh &
# MONITOR_PID=$!
#
# # After test:
# kill $MONITOR_PID
```

### Analyzing Soak Test Results

```python
# analyze-soak.py
import pandas as pd
import matplotlib.pyplot as plt

# Load data
df = pd.read_csv('soak-test-20240101-120000.log')
df['Timestamp'] = pd.to_datetime(df['Timestamp'])

# Plot CPU over time
plt.figure(figsize=(12, 6))
plt.plot(df['Timestamp'], df['CPU%'])
plt.xlabel('Time')
plt.ylabel('CPU Usage (%)')
plt.title('CPU Usage During Soak Test')
plt.xticks(rotation=45)
plt.tight_layout()
plt.savefig('soak-cpu.png')

# Plot RAM over time
plt.figure(figsize=(12, 6))
plt.plot(df['Timestamp'], df['RAM%'])
plt.xlabel('Time')
plt.ylabel('RAM Usage (%)')
plt.title('RAM Usage During Soak Test')
plt.xticks(rotation=45)
plt.tight_layout()
plt.savefig('soak-ram.png')

# Check for memory leak (RAM trending upward)
if df['RAM%'].iloc[-1] > df['RAM%'].iloc[0] + 10:
    print("⚠️ WARNING: Possible memory leak detected")
    print(f"RAM increased from {df['RAM%'].iloc[0]:.2f}% to {df['RAM%'].iloc[-1]:.2f}%")
else:
    print("✅ No memory leak detected")
```

---

## Performance Validation

### Automated Performance Tests

```javascript
// tests/performance/validation-test.js
import http from 'k6/http';
import { check } from 'k6';

export const options = {
  vus: 10,
  duration: '2m',
  thresholds: {
    // Page load times
    'http_req_duration{page:homepage}': ['p(95)<2000'],
    'http_req_duration{page:services}': ['p(95)<2000'],
    'http_req_duration{page:contact}': ['p(95)<2000'],

    // API endpoints
    'http_req_duration{endpoint:leads}': ['p(95)<500'],
    'http_req_duration{endpoint:clients}': ['p(95)<500'],
    'http_req_duration{endpoint:health}': ['p(95)<100'],

    // Error rates
    'http_req_failed': ['rate<0.001'],  // < 0.1% errors

    // Throughput
    'http_reqs': ['rate>100'],  // > 100 requests/second
  },
};

const BASE_URL = 'https://test.cdhomeimprovementsrockford.com';

export default function () {
  // Test homepage
  const homeResponse = http.get(BASE_URL, {
    tags: { page: 'homepage' },
  });
  check(homeResponse, {
    'homepage < 2s': (r) => r.timings.duration < 2000,
  });

  // Test services page
  const servicesResponse = http.get(`${BASE_URL}/services`, {
    tags: { page: 'services' },
  });
  check(servicesResponse, {
    'services < 2s': (r) => r.timings.duration < 2000,
  });

  // Test API endpoints
  const leadsResponse = http.get(`${BASE_URL}/api/leads?limit=50`, {
    tags: { endpoint: 'leads' },
  });
  check(leadsResponse, {
    'leads API < 500ms': (r) => r.timings.duration < 500,
  });

  const healthResponse = http.get(`${BASE_URL}/api/health`, {
    tags: { endpoint: 'health' },
  });
  check(healthResponse, {
    'health check < 100ms': (r) => r.timings.duration < 100,
  });
}
```

### CI/CD Performance Tests

```yaml
# .github/workflows/performance-test.yml
name: Performance Testing

on:
  pull_request:
    branches: [main]
  schedule:
    - cron: '0 0 * * 0'  # Weekly on Sunday

jobs:
  performance-test:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v3

      - name: Setup k6
        uses: grafana/setup-k6-action@v1

      - name: Run performance validation test
        run: |
          k6 run --out json=results.json tests/performance/validation-test.js

      - name: Check thresholds
        run: |
          # Exit with error if thresholds failed
          if grep -q '"thresholds".*"failed":true' results.json; then
            echo "❌ Performance thresholds failed"
            exit 1
          else
            echo "✅ Performance thresholds passed"
          fi

      - name: Upload results
        if: always()
        uses: actions/upload-artifact@v3
        with:
          name: k6-results
          path: results.json

      - name: Comment PR with results
        if: github.event_name == 'pull_request'
        uses: actions/github-script@v6
        with:
          script: |
            const fs = require('fs');
            const results = JSON.parse(fs.readFileSync('results.json', 'utf8'));

            // Extract metrics
            const metrics = results.filter(r => r.type === 'Metric');
            const httpReqDuration = metrics.find(m => m.metric === 'http_req_duration');
            const httpReqFailed = metrics.find(m => m.metric === 'http_req_failed');

            // Create comment
            const comment = `
            ## Performance Test Results

            | Metric | Value | Target |
            |--------|-------|--------|
            | Response Time (p95) | ${httpReqDuration?.data?.values?.p95}ms | < 2000ms |
            | Error Rate | ${(httpReqFailed?.data?.values?.rate * 100).toFixed(2)}% | < 0.1% |

            ${httpReqDuration?.data?.values?.p95 < 2000 ? '✅' : '❌'} Response time target
            ${httpReqFailed?.data?.values?.rate < 0.001 ? '✅' : '❌'} Error rate target
            `;

            github.rest.issues.createComment({
              issue_number: context.issue.number,
              owner: context.repo.owner,
              repo: context.repo.repo,
              body: comment
            });
```

---

## Apache Bench Testing

### Basic Apache Bench Usage

```bash
# Install Apache Bench
sudo apt-get install apache2-utils  # Linux
brew install httpd  # macOS (includes ab)

# Simple test: 1000 requests, 10 concurrent
ab -n 1000 -c 10 https://test.cdhomeimprovementsrockford.com/

# Test with POST request
ab -n 100 -c 10 -p lead.json -T application/json https://test.cdhomeimprovementsrockford.com/api/leads

# Test with authentication
ab -n 1000 -c 10 -H "Authorization: Bearer TOKEN" https://test.cdhomeimprovementsrockford.com/api/leads
```

### Apache Bench Test Scripts

```bash
#!/bin/bash
# tests/ab/homepage-test.sh

echo "🔥 Apache Bench - Homepage Load Test"
echo "====================================="

URL="https://test.cdhomeimprovementsrockford.com"
REQUESTS=10000
CONCURRENCY=100

echo "URL: $URL"
echo "Requests: $REQUESTS"
echo "Concurrency: $CONCURRENCY"
echo ""

ab -n $REQUESTS -c $CONCURRENCY -g results.tsv $URL

echo ""
echo "Results saved to results.tsv"
echo ""

# Parse results
echo "📊 Summary:"
grep "Requests per second:" results.tsv
grep "Time per request:" results.tsv
grep "Failed requests:" results.tsv

# Check if passed thresholds
RPS=$(ab -n $REQUESTS -c $CONCURRENCY $URL 2>&1 | grep "Requests per second" | awk '{print $4}' | cut -d'.' -f1)

if [ $RPS -gt 100 ]; then
  echo "✅ PASSED: $RPS requests/second (target: > 100)"
else
  echo "❌ FAILED: $RPS requests/second (target: > 100)"
  exit 1
fi
```

### API Endpoint Testing

```bash
#!/bin/bash
# tests/ab/api-test.sh

echo "🔥 Apache Bench - API Endpoint Test"
echo "===================================="

BASE_URL="https://test.cdhomeimprovementsrockford.com"
REQUESTS=5000
CONCURRENCY=50

# Test GET /api/leads
echo "Testing GET /api/leads..."
ab -n $REQUESTS -c $CONCURRENCY \
   -H "Accept: application/json" \
   "$BASE_URL/api/leads?limit=50" \
   > ab-leads-get.txt

# Test POST /api/leads
echo "Testing POST /api/leads..."
cat > lead-payload.json << 'EOF'
{
  "first_name": "Load",
  "last_name": "Test",
  "email": "loadtest@example.com",
  "phone": "815-555-1234",
  "service_type": "Kitchen Remodeling",
  "message": "Load test submission"
}
EOF

ab -n 100 -c 10 \
   -p lead-payload.json \
   -T "application/json" \
   "$BASE_URL/api/leads" \
   > ab-leads-post.txt

# Test GET /api/health
echo "Testing GET /api/health..."
ab -n 10000 -c 100 \
   "$BASE_URL/api/health" \
   > ab-health.txt

echo ""
echo "✅ Tests completed"
echo "Results saved to ab-*.txt"
```

---

## Analyzing Results

### k6 Results Analysis

```bash
# View summary
k6 run tests/load/load-test.js | tail -50

# Extract key metrics
k6 run --out json=results.json tests/load/load-test.js

# Parse JSON results
cat results.json | jq -r '
  select(.type == "Point" and .metric == "http_req_duration") |
  .data.value
' | awk '{sum+=$1; count++} END {print "Average:", sum/count, "ms"}'

# Get percentiles
cat results.json | jq -r '
  select(.type == "Point" and .metric == "http_req_duration") |
  .data.value
' | sort -n | awk '
  BEGIN {count=0}
  {values[count]=$1; count++}
  END {
    print "p50:", values[int(count*0.50)]
    print "p95:", values[int(count*0.95)]
    print "p99:", values[int(count*0.99)]
  }
'
```

### Creating Performance Report

```python
# analyze-results.py
import json
import statistics
import matplotlib.pyplot as plt

# Load k6 results
with open('results.json', 'r') as f:
    results = [json.loads(line) for line in f]

# Extract HTTP request durations
durations = [
    r['data']['value']
    for r in results
    if r.get('type') == 'Point' and r.get('metric') == 'http_req_duration'
]

# Calculate statistics
stats = {
    'min': min(durations),
    'max': max(durations),
    'mean': statistics.mean(durations),
    'median': statistics.median(durations),
    'p95': statistics.quantiles(durations, n=20)[18],  # 95th percentile
    'p99': statistics.quantiles(durations, n=100)[98],  # 99th percentile
}

print("Performance Statistics")
print("=" * 50)
print(f"Min:    {stats['min']:.2f}ms")
print(f"Max:    {stats['max']:.2f}ms")
print(f"Mean:   {stats['mean']:.2f}ms")
print(f"Median: {stats['median']:.2f}ms")
print(f"P95:    {stats['p95']:.2f}ms")
print(f"P99:    {stats['p99']:.2f}ms")

# Create histogram
plt.figure(figsize=(10, 6))
plt.hist(durations, bins=50, edgecolor='black')
plt.xlabel('Response Time (ms)')
plt.ylabel('Frequency')
plt.title('HTTP Request Duration Distribution')
plt.axvline(stats['p95'], color='r', linestyle='--', label=f'P95: {stats["p95"]:.2f}ms')
plt.legend()
plt.savefig('performance-histogram.png')
print("\nHistogram saved to performance-histogram.png")

# Check thresholds
print("\nThreshold Validation")
print("=" * 50)

if stats['p95'] < 2000:
    print("✅ P95 < 2000ms: PASSED")
else:
    print(f"❌ P95 < 2000ms: FAILED ({stats['p95']:.2f}ms)")

if stats['mean'] < 500:
    print("✅ Mean < 500ms: PASSED")
else:
    print(f"❌ Mean < 500ms: FAILED ({stats['mean']:.2f}ms)")
```

---

## Common Performance Issues

### Issue 1: Slow Database Queries

**Symptoms:**
- High response times under load
- Increasing response times over time
- Database CPU at 100%

**Diagnosis:**
```sql
-- Find slow queries
SELECT
    query,
    mean_exec_time,
    calls
FROM pg_stat_statements
WHERE mean_exec_time > 100
ORDER BY mean_exec_time DESC
LIMIT 10;
```

**Fix:**
```sql
-- Add missing indexes
CREATE INDEX CONCURRENTLY idx_leads_status_created
ON leads(status, created_at DESC)
WHERE deleted_at IS NULL;

-- Optimize query
-- Before: N+1 queries
SELECT * FROM leads;
-- Then for each lead:
SELECT * FROM clients WHERE client_id = lead.client_id;

-- After: Single query with join
SELECT l.*, c.*
FROM leads l
JOIN clients c ON l.client_id = c.client_id;
```

### Issue 2: Memory Leak

**Symptoms:**
- RAM usage increasing over time
- Application crashes under sustained load
- Swap usage increasing

**Diagnosis:**
```bash
# Monitor memory during test
while true; do
  free -m | awk 'NR==2{printf "%.2f%%\n", $3*100/$2 }'
  sleep 60
done

# Check Node.js heap
node --inspect --expose-gc app.js
# Use Chrome DevTools to analyze heap
```

**Fix:**
```typescript
// Common causes:

// 1. Event listeners not removed
component.addEventListener('click', handler);
// Fix: Remove on unmount
component.removeEventListener('click', handler);

// 2. Intervals/timeouts not cleared
const interval = setInterval(() => {}, 1000);
// Fix: Clear on cleanup
clearInterval(interval);

// 3. Large objects in closure
function createHandler() {
  const largeData = fetchLargeData();  // Kept in memory!
  return () => processData(largeData);
}
// Fix: Don't keep large objects in closure

// 4. Cache without TTL
const cache = new Map();
cache.set(key, value);  // Never expires!
// Fix: Use TTL or LRU cache
```

### Issue 3: Connection Pool Exhaustion

**Symptoms:**
- "remaining connection slots reserved" errors
- Slow queries under load
- Connection timeouts

**Diagnosis:**
```sql
-- Check active connections
SELECT
    COUNT(*) as total,
    COUNT(*) FILTER (WHERE state = 'active') as active,
    COUNT(*) FILTER (WHERE state = 'idle') as idle
FROM pg_stat_activity
WHERE datname = 'postgres';
```

**Fix:**
```typescript
// Use connection pooling
const pool = new Pool({
  connectionString: process.env.DATABASE_URL + '?pgbouncer=true',
  max: 20,  // Increase pool size
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

// Always release connections
const client = await pool.connect();
try {
  await client.query('SELECT * FROM leads');
} finally {
  client.release();  // CRITICAL!
}
```

### Issue 4: Rate Limiting Too Aggressive

**Symptoms:**
- 429 errors under normal load
- Users can't submit forms

**Diagnosis:**
```bash
# Monitor rate limit hits
grep "429" /var/log/nginx/access.log | wc -l
```

**Fix:**
```typescript
// Adjust rate limits
import rateLimit from 'express-rate-limit';

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,  // 15 minutes
  max: 100,  // Increase from 10 to 100
  message: 'Too many requests',
});
```

---

## Continuous Performance Testing

### Scheduled Performance Tests

```yaml
# .github/workflows/nightly-performance.yml
name: Nightly Performance Tests

on:
  schedule:
    - cron: '0 2 * * *'  # 2 AM daily
  workflow_dispatch:  # Manual trigger

jobs:
  performance-test:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v3

      - name: Setup k6
        uses: grafana/setup-k6-action@v1

      - name: Run load test
        run: k6 run --out json=load-results.json tests/load/load-test.js

      - name: Run stress test
        run: k6 run --out json=stress-results.json tests/stress/stress-test.js

      - name: Analyze results
        run: python analyze-results.py

      - name: Upload results
        uses: actions/upload-artifact@v3
        with:
          name: performance-results
          path: |
            load-results.json
            stress-results.json
            performance-histogram.png

      - name: Create issue if thresholds failed
        if: failure()
        uses: actions/github-script@v6
        with:
          script: |
            github.rest.issues.create({
              owner: context.repo.owner,
              repo: context.repo.repo,
              title: 'Performance Thresholds Failed',
              body: 'Nightly performance test failed. Check artifacts for details.',
              labels: ['performance', 'bug']
            });
```

### Performance Tracking Dashboard

```javascript
// Store performance metrics over time
// tests/utils/track-performance.js
import { readFileSync, writeFileSync } from 'fs';

export function trackPerformance(results) {
  const history = JSON.parse(readFileSync('performance-history.json', 'utf-8'));

  const metrics = {
    timestamp: new Date().toISOString(),
    p50: results.p50,
    p95: results.p95,
    p99: results.p99,
    mean: results.mean,
    rps: results.requestsPerSecond,
    errors: results.errorRate,
  };

  history.push(metrics);

  // Keep last 90 days
  const ninetyDaysAgo = Date.now() - (90 * 24 * 60 * 60 * 1000);
  const filtered = history.filter(m =>
    new Date(m.timestamp).getTime() > ninetyDaysAgo
  );

  writeFileSync('performance-history.json', JSON.stringify(filtered, null, 2));

  // Alert if degradation
  if (filtered.length > 7) {
    const recentAvg = filtered.slice(-7).reduce((sum, m) => sum + m.p95, 0) / 7;
    const previousAvg = filtered.slice(-14, -7).reduce((sum, m) => sum + m.p95, 0) / 7;

    if (recentAvg > previousAvg * 1.2) {
      console.log('⚠️ Performance degradation detected!');
      console.log(`P95 increased from ${previousAvg.toFixed(2)}ms to ${recentAvg.toFixed(2)}ms`);
    }
  }
}
```

---

## Summary

### Load Testing Checklist

**Before Each Release:**
- [ ] Run smoke test (5 minutes)
- [ ] Run load test (30 minutes)
- [ ] Verify performance targets met
- [ ] Check for errors and timeouts
- [ ] Review system resource usage

**Weekly:**
- [ ] Run full test suite (load + stress)
- [ ] Review performance trends
- [ ] Optimize slow endpoints
- [ ] Update test scenarios

**Monthly:**
- [ ] Run soak test (4 hours)
- [ ] Run spike test
- [ ] Update performance baselines
- [ ] Review and update thresholds

**Quarterly:**
- [ ] Comprehensive stress test
- [ ] Scalability testing
- [ ] Capacity planning review
- [ ] Load testing infrastructure update

### Quick Reference

```bash
# Smoke test (quick validation)
k6 run tests/load/smoke-test.js

# Load test (normal capacity)
k6 run tests/load/load-test.js

# Stress test (find limits)
k6 run tests/stress/stress-test.js

# Spike test (sudden surge)
k6 run tests/spike/spike-test.js

# Soak test (stability over time)
k6 run tests/soak/soak-test.js

# Apache Bench (simple test)
ab -n 1000 -c 10 https://test.cdhomeimprovementsrockford.com/
```

---

**Remember**: Load test regularly, test in production-like environment, and always monitor system resources during tests. Performance is a feature!
