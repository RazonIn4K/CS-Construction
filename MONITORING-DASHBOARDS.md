# Monitoring Dashboards and Alerting Configuration

## Table of Contents
1. [Overview](#overview)
2. [Uptime Kuma Setup](#uptime-kuma-setup)
3. [Application Metrics](#application-metrics)
4. [Prometheus Configuration](#prometheus-configuration)
5. [Grafana Dashboards](#grafana-dashboards)
6. [Log Aggregation](#log-aggregation)
7. [Error Tracking with Sentry](#error-tracking-with-sentry)
8. [Alert Configuration](#alert-configuration)
9. [Health Check Endpoints](#health-check-endpoints)
10. [Performance Monitoring](#performance-monitoring)
11. [Incident Response](#incident-response)
12. [Monitoring Best Practices](#monitoring-best-practices)

---

## Overview

This guide provides comprehensive monitoring and alerting configuration for the CD Home Improvements system. Effective monitoring ensures:

- **Proactive Issue Detection**: Identify problems before users report them
- **Performance Visibility**: Track system performance and optimization opportunities
- **Incident Response**: Quick detection and resolution of issues
- **Business Insights**: Track key metrics and business KPIs
- **Compliance**: Meet uptime and availability requirements

### Monitoring Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     Monitoring Stack                         │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │ Uptime Kuma  │  │  Prometheus  │  │    Grafana   │     │
│  │              │  │              │  │              │     │
│  │ • HTTP checks│  │ • Metrics DB │  │ • Dashboards │     │
│  │ • Ping checks│  │ • Time series│  │ • Graphs     │     │
│  │ • Alerts     │  │ • Scraping   │  │ • Alerts     │     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
│                                                              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │    Loki      │  │    Sentry    │  │  Vercel      │     │
│  │              │  │              │  │  Analytics   │     │
│  │ • Log aggr.  │  │ • Error track│  │              │     │
│  │ • Search     │  │ • Stack trace│  │ • Web Vitals │     │
│  │ • Retention  │  │ • Sessions   │  │ • Functions  │     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
│                                                              │
└─────────────────────────────────────────────────────────────┘
                             │
                             ↓
                    ┌────────────────┐
                    │  Alert Channels │
                    ├────────────────┤
                    │ • Email        │
                    │ • SMS (Twilio) │
                    │ • Slack        │
                    │ • PagerDuty    │
                    └────────────────┘
```

### Monitoring Targets

| Target | Check Type | Frequency | Alert Threshold |
|--------|-----------|-----------|-----------------|
| **Website** | HTTP | 60s | Down for 2 mins |
| **API Endpoints** | HTTP | 60s | >500ms or errors |
| **Database** | Connection | 300s | Connection failure |
| **Invoice Ninja** | HTTP | 60s | Down for 2 mins |
| **n8n** | HTTP | 60s | Down for 5 mins |
| **Uptime Kuma** | Self-check | 60s | Down for 1 min |
| **VPS Resources** | System | 60s | CPU >80%, RAM >85% |
| **SSL Certificates** | Certificate | 86400s (daily) | Expires in <7 days |
| **Disk Space** | System | 300s | >85% used |
| **Error Rate** | Application | 60s | >1% of requests |

---

## Uptime Kuma Setup

### Installation (Already in Docker Stack)

```yaml
# docker-compose.yml (already configured)
services:
  uptime-kuma:
    image: louislam/uptime-kuma:1
    container_name: uptime-kuma
    volumes:
      - uptime-kuma-data:/app/data
    ports:
      - "3001:3001"
    restart: unless-stopped
    networks:
      - cdhi-network

volumes:
  uptime-kuma-data:

networks:
  cdhi-network:
```

### Initial Configuration

```bash
# 1. Access Uptime Kuma
# URL: https://status.cdhomeimprovementsrockford.com

# 2. First-time setup
# - Create admin account
# - Set timezone (America/Chicago)
# - Configure email settings

# 3. Add notification channels (Settings → Notifications)
```

### Notification Channels

#### 1. Email Notifications

```javascript
// In Uptime Kuma Dashboard:
// Settings → Notifications → Add

Name: Admin Email
Notification Type: Email (SMTP)
SMTP Host: smtp.postmarkapp.com
SMTP Port: 587
Security: TLS
From Email: alerts@cdhomeimprovementsrockford.com
To Email: admin@cdhomeimprovementsrockford.com
Username: (Postmark API Token)
Password: (Postmark API Token)

// Test notification to verify setup
```

#### 2. SMS Notifications (Twilio)

```javascript
// In Uptime Kuma Dashboard:
// Settings → Notifications → Add

Name: Admin SMS
Notification Type: Twilio
Account SID: AC_YOUR_TWILIO_ACCOUNT_SID
Auth Token: YOUR_TWILIO_AUTH_TOKEN
From Phone: +18155551234  // Your Twilio number
To Phone: +18155555678    // Admin's phone

// Configure for critical alerts only
```

#### 3. Slack Notifications

```javascript
// Create Slack Webhook:
// 1. Go to https://api.slack.com/apps
// 2. Create New App → From scratch
// 3. App Name: "CD Home Improvements Monitoring"
// 4. Workspace: Your workspace
// 5. Incoming Webhooks → Activate
// 6. Add New Webhook to Workspace
// 7. Copy Webhook URL

// In Uptime Kuma Dashboard:
Name: Slack Alerts
Notification Type: Slack
Webhook URL: https://hooks.slack.com/services/YOUR/WEBHOOK/URL
Channel: #alerts
Username: Uptime Kuma
Icon URL: (optional)
```

### Monitor Configuration

#### 1. Website Monitor (Main Site)

```javascript
// Add New Monitor
Monitor Type: HTTP(s)
Friendly Name: CD Home Improvements Website
URL: https://cdhomeimprovementsrockford.com
Heartbeat Interval: 60 seconds
Retries: 3
Heartbeat Retry Interval: 60 seconds

Advanced Options:
- Accepted Status Codes: 200-299
- Ignore TLS/SSL Error: No
- Max Redirects: 3
- Timeout: 30 seconds

Notifications:
- Email: Admin Email
- SMS: Admin SMS (for critical only)
- Slack: Slack Alerts

Tags:
- production
- website
```

#### 2. API Health Check Monitor

```javascript
// Add New Monitor
Monitor Type: HTTP(s)
Friendly Name: API Health Check
URL: https://cdhomeimprovementsrockford.com/api/health
Heartbeat Interval: 60 seconds
Retries: 2

Expected Response:
Body Includes: "status":"ok"

Advanced Options:
- Method: GET
- Accepted Status Codes: 200
- Timeout: 10 seconds

Notifications:
- Email: Admin Email
- Slack: Slack Alerts
```

#### 3. Database Monitor

```javascript
// Add New Monitor
Monitor Type: HTTP(s)
Friendly Name: Database Health
URL: https://cdhomeimprovementsrockford.com/api/health/database
Heartbeat Interval: 300 seconds (5 minutes)
Retries: 2

Expected Response:
Body Includes: "database":"connected"

Notifications:
- Email: Admin Email
- SMS: Admin SMS
- Slack: Slack Alerts
```

#### 4. Invoice Ninja Monitor

```javascript
// Add New Monitor
Monitor Type: HTTP(s)
Friendly Name: Invoice Ninja Portal
URL: https://portal.cdhomeimprovementsrockford.com/health
Heartbeat Interval: 60 seconds
Retries: 3

Advanced Options:
- Accepted Status Codes: 200
- Timeout: 30 seconds

Notifications:
- Email: Admin Email
- Slack: Slack Alerts
```

#### 5. n8n Workflow Monitor

```javascript
// Add New Monitor
Monitor Type: HTTP(s)
Friendly Name: n8n Automation
URL: https://automate.cdhomeimprovementsrockford.com/healthz
Heartbeat Interval: 60 seconds
Retries: 3

Notifications:
- Email: Admin Email
- Slack: Slack Alerts
```

#### 6. SSL Certificate Monitor

```javascript
// Add New Monitor
Monitor Type: HTTP(s)
Friendly Name: SSL Certificate Check
URL: https://cdhomeimprovementsrockford.com
Heartbeat Interval: 86400 seconds (24 hours)

Certificate Expiry Notification:
- Alert when certificate expires in: 7 days

Notifications:
- Email: Admin Email
- Slack: Slack Alerts
```

#### 7. VPS Resource Monitor (Custom Script)

```javascript
// Add New Monitor
Monitor Type: HTTP(s)
Friendly Name: VPS Resources
URL: https://YOUR_VPS_IP:9090/metrics  // Prometheus endpoint
Heartbeat Interval: 60 seconds

Advanced Options:
- Method: GET
- Accepted Status Codes: 200

// Script to expose metrics (see Prometheus section)
```

### Status Page Configuration

```javascript
// Create Public Status Page
// Settings → Status Pages → Add New

Status Page Name: CD Home Improvements Status
Slug: cdhomeimprovements
Description: System status and uptime for CD Home Improvements

Theme: Auto (follows system)
Language: English

Monitors to Display:
- CD Home Improvements Website
- API Health Check
- Invoice Ninja Portal
- n8n Automation

Custom Domain: status.cdhomeimprovementsrockford.com

Google Analytics ID: (optional)

Footer Text:
"For support, contact support@cdhomeimprovementsrockford.com"

// Configure Caddy to proxy status page
// See DEPLOYMENT.md for Caddy configuration
```

---

## Application Metrics

### Custom Metrics Collection

```typescript
// lib/metrics.ts
import { Counter, Histogram, Gauge, Registry } from 'prom-client';

// Create metrics registry
export const register = new Registry();

// HTTP request metrics
export const httpRequestDuration = new Histogram({
  name: 'http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route', 'status_code'],
  buckets: [0.01, 0.05, 0.1, 0.5, 1, 2, 5],
  registers: [register],
});

export const httpRequestTotal = new Counter({
  name: 'http_requests_total',
  help: 'Total number of HTTP requests',
  labelNames: ['method', 'route', 'status_code'],
  registers: [register],
});

export const httpRequestErrors = new Counter({
  name: 'http_request_errors_total',
  help: 'Total number of HTTP request errors',
  labelNames: ['method', 'route', 'error_type'],
  registers: [register],
});

// Business metrics
export const leadsTotal = new Counter({
  name: 'leads_total',
  help: 'Total number of leads created',
  labelNames: ['status', 'service_type'],
  registers: [register],
});

export const leadsGauge = new Gauge({
  name: 'leads_by_status',
  help: 'Number of leads by status',
  labelNames: ['status'],
  registers: [register],
});

export const paymentsTotal = new Counter({
  name: 'payments_total',
  help: 'Total number of payments',
  labelNames: ['status'],
  registers: [register],
});

export const paymentAmount = new Histogram({
  name: 'payment_amount_cents',
  help: 'Payment amounts in cents',
  buckets: [1000, 5000, 10000, 50000, 100000, 500000],
  registers: [register],
});

// Database metrics
export const databaseQueryDuration = new Histogram({
  name: 'database_query_duration_seconds',
  help: 'Duration of database queries in seconds',
  labelNames: ['operation', 'table'],
  buckets: [0.001, 0.01, 0.05, 0.1, 0.5, 1],
  registers: [register],
});

export const databaseConnections = new Gauge({
  name: 'database_connections',
  help: 'Number of active database connections',
  registers: [register],
});

// Cache metrics
export const cacheHits = new Counter({
  name: 'cache_hits_total',
  help: 'Total number of cache hits',
  labelNames: ['cache_key'],
  registers: [register],
});

export const cacheMisses = new Counter({
  name: 'cache_misses_total',
  help: 'Total number of cache misses',
  labelNames: ['cache_key'],
  registers: [register],
});

// Webhook metrics
export const webhookReceived = new Counter({
  name: 'webhook_received_total',
  help: 'Total number of webhooks received',
  labelNames: ['source', 'event_type'],
  registers: [register],
});

export const webhookProcessingDuration = new Histogram({
  name: 'webhook_processing_duration_seconds',
  help: 'Duration of webhook processing in seconds',
  labelNames: ['source', 'event_type', 'status'],
  buckets: [0.1, 0.5, 1, 2, 5, 10],
  registers: [register],
});

export const webhookErrors = new Counter({
  name: 'webhook_errors_total',
  help: 'Total number of webhook processing errors',
  labelNames: ['source', 'event_type', 'error_type'],
  registers: [register],
});
```

### Metrics Middleware

```typescript
// middleware/metrics.ts
import { NextRequest, NextResponse } from 'next/server';
import { httpRequestDuration, httpRequestTotal, httpRequestErrors } from '@/lib/metrics';

export async function metricsMiddleware(
  request: NextRequest,
  handler: () => Promise<NextResponse>
) {
  const start = Date.now();
  const method = request.method;
  const route = request.nextUrl.pathname;

  try {
    const response = await handler();
    const duration = (Date.now() - start) / 1000;
    const statusCode = response.status;

    // Record metrics
    httpRequestDuration.labels(method, route, statusCode.toString()).observe(duration);
    httpRequestTotal.labels(method, route, statusCode.toString()).inc();

    if (statusCode >= 500) {
      httpRequestErrors.labels(method, route, 'server_error').inc();
    } else if (statusCode >= 400) {
      httpRequestErrors.labels(method, route, 'client_error').inc();
    }

    return response;
  } catch (error) {
    const duration = (Date.now() - start) / 1000;
    httpRequestDuration.labels(method, route, '500').observe(duration);
    httpRequestErrors.labels(method, route, 'exception').inc();
    throw error;
  }
}

// Usage in API route
export async function GET(request: NextRequest) {
  return metricsMiddleware(request, async () => {
    // Your API logic here
    const { data } = await supabase.from('leads').select('*');
    return NextResponse.json(data);
  });
}
```

### Metrics Endpoint

```typescript
// app/api/metrics/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { register } from '@/lib/metrics';

export async function GET(request: NextRequest) {
  // Verify request is from Prometheus or monitoring tool
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.METRICS_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Return metrics in Prometheus format
  const metrics = await register.metrics();
  return new NextResponse(metrics, {
    headers: {
      'Content-Type': register.contentType,
    },
  });
}

// Add to .env:
// METRICS_SECRET=random_secret_key_here
```

### Business Metrics Collection

```typescript
// Track lead creation
import { leadsTotal, leadsGauge } from '@/lib/metrics';

export async function POST(request: NextRequest) {
  const body = await request.json();

  const { data: lead, error } = await supabase
    .from('leads')
    .insert(body)
    .select()
    .single();

  if (!error) {
    // Increment lead counter
    leadsTotal.labels(lead.status, lead.service_type).inc();

    // Update gauge (run periodically)
    // See updateBusinessMetrics() below
  }

  return NextResponse.json(lead);
}

// Periodic business metrics update (run every 5 minutes)
export async function updateBusinessMetrics() {
  const { data: leadsByStatus } = await supabase
    .from('leads')
    .select('status')
    .eq('deleted_at', null);

  // Group by status
  const statusCounts = leadsByStatus.reduce((acc, lead) => {
    acc[lead.status] = (acc[lead.status] || 0) + 1;
    return acc;
  }, {});

  // Update gauge
  for (const [status, count] of Object.entries(statusCounts)) {
    leadsGauge.labels(status).set(count as number);
  }
}
```

---

## Prometheus Configuration

### Installation

```yaml
# docker-compose.yml - Add Prometheus
services:
  prometheus:
    image: prom/prometheus:latest
    container_name: prometheus
    volumes:
      - ./prometheus/prometheus.yml:/etc/prometheus/prometheus.yml
      - prometheus-data:/prometheus
    command:
      - '--config.file=/etc/prometheus/prometheus.yml'
      - '--storage.tsdb.path=/prometheus'
      - '--web.console.libraries=/etc/prometheus/console_libraries'
      - '--web.console.templates=/etc/prometheus/consoles'
      - '--storage.tsdb.retention.time=90d'  # Keep data for 90 days
      - '--web.enable-lifecycle'
    ports:
      - "9090:9090"
    restart: unless-stopped
    networks:
      - cdhi-network

volumes:
  prometheus-data:
```

### Prometheus Configuration

```yaml
# prometheus/prometheus.yml
global:
  scrape_interval: 15s  # How often to scrape targets
  evaluation_interval: 15s  # How often to evaluate rules
  external_labels:
    cluster: 'cd-home-improvements'
    environment: 'production'

# Alertmanager configuration (optional)
alerting:
  alertmanagers:
    - static_configs:
        - targets:
            - localhost:9093

# Rule files (for alerting)
rule_files:
  - /etc/prometheus/alerts.yml

# Scrape configurations
scrape_configs:
  # Prometheus self-monitoring
  - job_name: 'prometheus'
    static_configs:
      - targets: ['localhost:9090']

  # Next.js application metrics
  - job_name: 'nextjs-app'
    metrics_path: '/api/metrics'
    scheme: https
    authorization:
      credentials: 'YOUR_METRICS_SECRET'
    static_configs:
      - targets: ['cdhomeimprovementsrockford.com']
    scrape_interval: 30s

  # Node Exporter (system metrics)
  - job_name: 'node-exporter'
    static_configs:
      - targets: ['localhost:9100']

  # Docker metrics (cAdvisor)
  - job_name: 'docker'
    static_configs:
      - targets: ['localhost:8080']

  # PostgreSQL metrics (optional)
  - job_name: 'postgres'
    static_configs:
      - targets: ['localhost:9187']

  # Redis metrics (optional)
  - job_name: 'redis'
    static_configs:
      - targets: ['localhost:9121']
```

### Alert Rules

```yaml
# prometheus/alerts.yml
groups:
  - name: application_alerts
    interval: 30s
    rules:
      # High error rate
      - alert: HighErrorRate
        expr: |
          sum(rate(http_request_errors_total[5m])) by (route)
          / sum(rate(http_requests_total[5m])) by (route) > 0.01
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "High error rate on {{ $labels.route }}"
          description: "Error rate is {{ $value | humanizePercentage }} on route {{ $labels.route }}"

      # Slow API response
      - alert: SlowAPIResponse
        expr: |
          histogram_quantile(0.95,
            sum(rate(http_request_duration_seconds_bucket[5m])) by (route, le)
          ) > 1
        for: 10m
        labels:
          severity: warning
        annotations:
          summary: "Slow API response on {{ $labels.route }}"
          description: "95th percentile response time is {{ $value }}s on route {{ $labels.route }}"

      # High database query duration
      - alert: SlowDatabaseQueries
        expr: |
          histogram_quantile(0.95,
            sum(rate(database_query_duration_seconds_bucket[5m])) by (table, le)
          ) > 0.5
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "Slow database queries on {{ $labels.table }}"
          description: "95th percentile query time is {{ $value }}s on table {{ $labels.table }}"

      # High webhook error rate
      - alert: HighWebhookErrorRate
        expr: |
          sum(rate(webhook_errors_total[5m])) by (source)
          / sum(rate(webhook_received_total[5m])) by (source) > 0.05
        for: 5m
        labels:
          severity: critical
        annotations:
          summary: "High webhook error rate from {{ $labels.source }}"
          description: "Error rate is {{ $value | humanizePercentage }} for webhooks from {{ $labels.source }}"

  - name: system_alerts
    interval: 30s
    rules:
      # High CPU usage
      - alert: HighCPUUsage
        expr: |
          100 - (avg by(instance) (rate(node_cpu_seconds_total{mode="idle"}[5m])) * 100) > 80
        for: 10m
        labels:
          severity: warning
        annotations:
          summary: "High CPU usage on {{ $labels.instance }}"
          description: "CPU usage is {{ $value }}% on {{ $labels.instance }}"

      # High memory usage
      - alert: HighMemoryUsage
        expr: |
          (1 - (node_memory_MemAvailable_bytes / node_memory_MemTotal_bytes)) * 100 > 85
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "High memory usage on {{ $labels.instance }}"
          description: "Memory usage is {{ $value }}% on {{ $labels.instance }}"

      # High disk usage
      - alert: HighDiskUsage
        expr: |
          (1 - (node_filesystem_avail_bytes / node_filesystem_size_bytes)) * 100 > 85
        for: 5m
        labels:
          severity: critical
        annotations:
          summary: "High disk usage on {{ $labels.instance }}"
          description: "Disk usage is {{ $value }}% on {{ $labels.instance }}"

      # Container down
      - alert: ContainerDown
        expr: |
          absent(up{job="docker"})
        for: 2m
        labels:
          severity: critical
        annotations:
          summary: "Docker container is down"
          description: "Docker container has been down for more than 2 minutes"
```

### Node Exporter (System Metrics)

```yaml
# docker-compose.yml - Add Node Exporter
services:
  node-exporter:
    image: prom/node-exporter:latest
    container_name: node-exporter
    command:
      - '--path.procfs=/host/proc'
      - '--path.sysfs=/host/sys'
      - '--path.rootfs=/host'
      - '--collector.filesystem.mount-points-exclude=^/(sys|proc|dev|host|etc)($$|/)'
    volumes:
      - /proc:/host/proc:ro
      - /sys:/host/sys:ro
      - /:/host:ro
    ports:
      - "9100:9100"
    restart: unless-stopped
    networks:
      - cdhi-network
```

### cAdvisor (Docker Metrics)

```yaml
# docker-compose.yml - Add cAdvisor
services:
  cadvisor:
    image: gcr.io/cadvisor/cadvisor:latest
    container_name: cadvisor
    volumes:
      - /:/rootfs:ro
      - /var/run:/var/run:ro
      - /sys:/sys:ro
      - /var/lib/docker/:/var/lib/docker:ro
    ports:
      - "8080:8080"
    restart: unless-stopped
    networks:
      - cdhi-network
```

---

## Grafana Dashboards

### Installation

```yaml
# docker-compose.yml - Add Grafana
services:
  grafana:
    image: grafana/grafana:latest
    container_name: grafana
    environment:
      - GF_SECURITY_ADMIN_USER=admin
      - GF_SECURITY_ADMIN_PASSWORD=${GRAFANA_ADMIN_PASSWORD}
      - GF_SERVER_ROOT_URL=https://monitoring.cdhomeimprovementsrockford.com
      - GF_INSTALL_PLUGINS=grafana-clock-panel,grafana-simple-json-datasource
    volumes:
      - grafana-data:/var/lib/grafana
      - ./grafana/provisioning:/etc/grafana/provisioning
    ports:
      - "3002:3000"
    restart: unless-stopped
    networks:
      - cdhi-network
    depends_on:
      - prometheus

volumes:
  grafana-data:
```

### Grafana Data Source Configuration

```yaml
# grafana/provisioning/datasources/prometheus.yml
apiVersion: 1

datasources:
  - name: Prometheus
    type: prometheus
    access: proxy
    url: http://prometheus:9090
    isDefault: true
    editable: false

  - name: Loki
    type: loki
    access: proxy
    url: http://loki:3100
    editable: false
```

### Dashboard: System Overview

```json
// grafana/provisioning/dashboards/system-overview.json
{
  "dashboard": {
    "title": "CD Home Improvements - System Overview",
    "tags": ["system", "overview"],
    "timezone": "browser",
    "panels": [
      {
        "title": "HTTP Requests per Minute",
        "type": "graph",
        "targets": [
          {
            "expr": "sum(rate(http_requests_total[1m])) by (route)",
            "legendFormat": "{{ route }}"
          }
        ]
      },
      {
        "title": "API Response Time (95th percentile)",
        "type": "graph",
        "targets": [
          {
            "expr": "histogram_quantile(0.95, sum(rate(http_request_duration_seconds_bucket[5m])) by (route, le))",
            "legendFormat": "{{ route }}"
          }
        ]
      },
      {
        "title": "Error Rate",
        "type": "graph",
        "targets": [
          {
            "expr": "sum(rate(http_request_errors_total[5m])) by (route) / sum(rate(http_requests_total[5m])) by (route)",
            "legendFormat": "{{ route }}"
          }
        ]
      },
      {
        "title": "CPU Usage",
        "type": "gauge",
        "targets": [
          {
            "expr": "100 - (avg by(instance) (rate(node_cpu_seconds_total{mode=\"idle\"}[5m])) * 100)"
          }
        ],
        "thresholds": [
          { "value": 0, "color": "green" },
          { "value": 70, "color": "yellow" },
          { "value": 85, "color": "red" }
        ]
      },
      {
        "title": "Memory Usage",
        "type": "gauge",
        "targets": [
          {
            "expr": "(1 - (node_memory_MemAvailable_bytes / node_memory_MemTotal_bytes)) * 100"
          }
        ],
        "thresholds": [
          { "value": 0, "color": "green" },
          { "value": 70, "color": "yellow" },
          { "value": 85, "color": "red" }
        ]
      },
      {
        "title": "Disk Usage",
        "type": "gauge",
        "targets": [
          {
            "expr": "(1 - (node_filesystem_avail_bytes / node_filesystem_size_bytes)) * 100"
          }
        ],
        "thresholds": [
          { "value": 0, "color": "green" },
          { "value": 70, "color": "yellow" },
          { "value": 85, "color": "red" }
        ]
      }
    ]
  }
}
```

### Dashboard: Business Metrics

```json
// grafana/provisioning/dashboards/business-metrics.json
{
  "dashboard": {
    "title": "CD Home Improvements - Business Metrics",
    "tags": ["business", "kpi"],
    "panels": [
      {
        "title": "Leads by Status",
        "type": "piechart",
        "targets": [
          {
            "expr": "leads_by_status",
            "legendFormat": "{{ status }}"
          }
        ]
      },
      {
        "title": "New Leads per Day",
        "type": "graph",
        "targets": [
          {
            "expr": "sum(increase(leads_total[24h])) by (status)"
          }
        ]
      },
      {
        "title": "Payments per Day",
        "type": "graph",
        "targets": [
          {
            "expr": "sum(increase(payments_total[24h]))"
          }
        ]
      },
      {
        "title": "Average Payment Amount",
        "type": "stat",
        "targets": [
          {
            "expr": "avg(payment_amount_cents) / 100"
          }
        ],
        "unit": "currencyUSD"
      },
      {
        "title": "Webhook Processing Time",
        "type": "graph",
        "targets": [
          {
            "expr": "histogram_quantile(0.95, sum(rate(webhook_processing_duration_seconds_bucket[5m])) by (source, le))"
          }
        ]
      },
      {
        "title": "Cache Hit Rate",
        "type": "stat",
        "targets": [
          {
            "expr": "sum(rate(cache_hits_total[5m])) / (sum(rate(cache_hits_total[5m])) + sum(rate(cache_misses_total[5m])))"
          }
        ],
        "unit": "percentunit"
      }
    ]
  }
}
```

### Dashboard: Database Performance

```json
// grafana/provisioning/dashboards/database-performance.json
{
  "dashboard": {
    "title": "CD Home Improvements - Database Performance",
    "tags": ["database", "performance"],
    "panels": [
      {
        "title": "Query Duration (95th percentile)",
        "type": "graph",
        "targets": [
          {
            "expr": "histogram_quantile(0.95, sum(rate(database_query_duration_seconds_bucket[5m])) by (table, le))",
            "legendFormat": "{{ table }}"
          }
        ]
      },
      {
        "title": "Active Connections",
        "type": "graph",
        "targets": [
          {
            "expr": "database_connections"
          }
        ]
      },
      {
        "title": "Queries per Second",
        "type": "graph",
        "targets": [
          {
            "expr": "sum(rate(database_query_duration_seconds_count[1m])) by (operation)"
          }
        ]
      },
      {
        "title": "Slow Queries (>500ms)",
        "type": "table",
        "targets": [
          {
            "expr": "topk(10, sum(rate(database_query_duration_seconds_count{quantile=\"0.95\"}[5m])) by (table))"
          }
        ]
      }
    ]
  }
}
```

---

## Log Aggregation

### Loki Installation

```yaml
# docker-compose.yml - Add Loki
services:
  loki:
    image: grafana/loki:latest
    container_name: loki
    ports:
      - "3100:3100"
    volumes:
      - ./loki/loki-config.yml:/etc/loki/loki-config.yml
      - loki-data:/loki
    command: -config.file=/etc/loki/loki-config.yml
    restart: unless-stopped
    networks:
      - cdhi-network

  promtail:
    image: grafana/promtail:latest
    container_name: promtail
    volumes:
      - ./loki/promtail-config.yml:/etc/promtail/promtail-config.yml
      - /var/log:/var/log:ro
      - /var/lib/docker/containers:/var/lib/docker/containers:ro
    command: -config.file=/etc/promtail/promtail-config.yml
    restart: unless-stopped
    networks:
      - cdhi-network
    depends_on:
      - loki

volumes:
  loki-data:
```

### Loki Configuration

```yaml
# loki/loki-config.yml
auth_enabled: false

server:
  http_listen_port: 3100

ingester:
  lifecycler:
    address: 127.0.0.1
    ring:
      kvstore:
        store: inmemory
      replication_factor: 1
  chunk_idle_period: 5m
  chunk_retain_period: 30s

schema_config:
  configs:
    - from: 2023-01-01
      store: boltdb
      object_store: filesystem
      schema: v11
      index:
        prefix: index_
        period: 168h

storage_config:
  boltdb:
    directory: /loki/index
  filesystem:
    directory: /loki/chunks

limits_config:
  enforce_metric_name: false
  reject_old_samples: true
  reject_old_samples_max_age: 168h
  ingestion_rate_mb: 10
  ingestion_burst_size_mb: 20

chunk_store_config:
  max_look_back_period: 720h  # 30 days

table_manager:
  retention_deletes_enabled: true
  retention_period: 720h  # 30 days
```

### Promtail Configuration

```yaml
# loki/promtail-config.yml
server:
  http_listen_port: 9080
  grpc_listen_port: 0

positions:
  filename: /tmp/positions.yaml

clients:
  - url: http://loki:3100/loki/api/v1/push

scrape_configs:
  # Docker container logs
  - job_name: docker
    docker_sd_configs:
      - host: unix:///var/run/docker.sock
        refresh_interval: 5s
    relabel_configs:
      - source_labels: ['__meta_docker_container_name']
        regex: '/(.*)'
        target_label: 'container'
      - source_labels: ['__meta_docker_container_log_stream']
        target_label: 'stream'

  # System logs
  - job_name: system
    static_configs:
      - targets:
          - localhost
        labels:
          job: varlogs
          __path__: /var/log/*log

  # Application logs (if writing to file)
  - job_name: application
    static_configs:
      - targets:
          - localhost
        labels:
          job: app
          __path__: /var/www/cd-construction/logs/*.log
```

### Application Logging

```typescript
// lib/logger.ts
import winston from 'winston';
import LokiTransport from 'winston-loki';

export const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: {
    service: 'cd-construction',
    environment: process.env.NODE_ENV,
  },
  transports: [
    // Console (for development)
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      ),
    }),

    // Loki (for production)
    new LokiTransport({
      host: 'http://localhost:3100',
      labels: { app: 'cd-construction' },
      json: true,
      format: winston.format.json(),
      replaceTimestamp: true,
      onConnectionError: (err) => console.error('Loki connection error:', err),
    }),

    // File (backup)
    new winston.transports.File({
      filename: 'logs/error.log',
      level: 'error',
      maxsize: 5242880, // 5MB
      maxFiles: 5,
    }),
    new winston.transports.File({
      filename: 'logs/combined.log',
      maxsize: 5242880, // 5MB
      maxFiles: 5,
    }),
  ],
});

// Usage in API routes
export async function POST(request: NextRequest) {
  logger.info('Received lead submission', {
    method: request.method,
    url: request.url,
  });

  try {
    const body = await request.json();
    const { data, error } = await supabase.from('leads').insert(body);

    if (error) {
      logger.error('Failed to create lead', {
        error: error.message,
        code: error.code,
        body,
      });
      return NextResponse.json({ error }, { status: 500 });
    }

    logger.info('Lead created successfully', { leadId: data.lead_id });
    return NextResponse.json(data);
  } catch (error) {
    logger.error('Unexpected error in lead creation', {
      error: error.message,
      stack: error.stack,
    });
    throw error;
  }
}
```

---

## Error Tracking with Sentry

### Sentry Configuration

```typescript
// sentry.client.config.ts
import * as Sentry from '@sentry/nextjs';

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  environment: process.env.NODE_ENV,
  tracesSampleRate: 0.1,  // 10% of transactions
  replaysSessionSampleRate: 0.1,  // 10% of sessions
  replaysOnErrorSampleRate: 1.0,  // 100% of errors

  // Ignore common browser errors
  ignoreErrors: [
    'ResizeObserver loop limit exceeded',
    'Non-Error promise rejection captured',
    'Network request failed',
    'Failed to fetch',
  ],

  // Don't send errors from browser extensions
  denyUrls: [
    /extensions\//i,
    /^chrome:\/\//i,
    /^moz-extension:\/\//i,
  ],

  beforeSend(event, hint) {
    // Filter out sensitive data
    if (event.request?.data) {
      delete event.request.data.password;
      delete event.request.data.credit_card;
    }

    // Add custom context
    event.tags = {
      ...event.tags,
      version: process.env.NEXT_PUBLIC_APP_VERSION,
    };

    return event;
  },
});
```

### Sentry Server Configuration

```typescript
// sentry.server.config.ts
import * as Sentry from '@sentry/nextjs';

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV,
  tracesSampleRate: 0.1,

  // Server-specific integrations
  integrations: [
    new Sentry.Integrations.Http({ tracing: true }),
    new Sentry.Integrations.Postgres(),
  ],

  beforeSend(event, hint) {
    // Don't send errors from health checks
    if (event.request?.url?.includes('/api/health')) {
      return null;
    }

    return event;
  },
});
```

### Error Monitoring in Code

```typescript
// Track custom errors
import * as Sentry from '@sentry/nextjs';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate input
    if (!body.email) {
      // Track validation error
      Sentry.captureMessage('Invalid lead submission: missing email', {
        level: 'warning',
        extra: { body },
      });
      return NextResponse.json({ error: 'Email required' }, { status: 400 });
    }

    const { data, error } = await supabase.from('leads').insert(body);

    if (error) {
      // Track database error
      Sentry.captureException(error, {
        tags: { component: 'database', operation: 'insert' },
        extra: { table: 'leads', body },
      });
      return NextResponse.json({ error }, { status: 500 });
    }

    // Track successful lead creation (optional, for metrics)
    Sentry.addBreadcrumb({
      category: 'business',
      message: 'Lead created',
      level: 'info',
      data: { leadId: data.lead_id, serviceType: data.service_type },
    });

    return NextResponse.json(data);
  } catch (error) {
    // Track unexpected errors
    Sentry.captureException(error, {
      tags: { component: 'api', endpoint: '/api/leads' },
    });
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
```

### Performance Monitoring

```typescript
// Track performance of critical operations
import * as Sentry from '@sentry/nextjs';

export async function GET(request: NextRequest) {
  const transaction = Sentry.startTransaction({
    name: 'GET /api/leads',
    op: 'http.server',
  });

  try {
    // Track database query
    const querySpan = transaction.startChild({
      op: 'db.query',
      description: 'SELECT leads',
    });

    const { data } = await supabase.from('leads').select('*').limit(100);

    querySpan.finish();

    // Track transformation
    const transformSpan = transaction.startChild({
      op: 'serialize',
      description: 'Transform leads',
    });

    const transformed = data.map(transformLead);

    transformSpan.finish();

    transaction.setStatus('ok');
    return NextResponse.json(transformed);
  } catch (error) {
    transaction.setStatus('internal_error');
    Sentry.captureException(error);
    return NextResponse.json({ error }, { status: 500 });
  } finally {
    transaction.finish();
  }
}
```

---

## Alert Configuration

### Alert Routing Strategy

```
Priority Levels:
┌─────────────┬───────────┬──────────┬──────────┐
│   Priority  │   Email   │   SMS    │  Slack   │
├─────────────┼───────────┼──────────┼──────────┤
│  P1 (Critical) │     ✅     │    ✅     │    ✅     │
│  - Site down   │  Immediate│ Immediate│ @channel │
│  - DB failure  │           │          │          │
│  - Payment fail│           │          │          │
├─────────────┼───────────┼──────────┼──────────┤
│  P2 (High)  │     ✅     │    ❌     │    ✅     │
│  - API errors │  5 min    │   No     │  Normal  │
│  - Slow queries│  delay    │          │          │
├─────────────┼───────────┼──────────┼──────────┤
│  P3 (Medium)│     ✅     │    ❌     │    ✅     │
│  - High CPU  │  15 min   │   No     │  Normal  │
│  - Disk space│  delay    │          │          │
├─────────────┼───────────┼──────────┼──────────┤
│  P4 (Low)   │     ✅     │    ❌     │    ❌     │
│  - Info      │  Daily    │   No     │   No     │
│  - Summaries │  digest   │          │          │
└─────────────┴───────────┴──────────┴──────────┘
```

### Alertmanager Configuration

```yaml
# prometheus/alertmanager.yml
global:
  resolve_timeout: 5m
  smtp_smarthost: 'smtp.postmarkapp.com:587'
  smtp_from: 'alerts@cdhomeimprovementsrockford.com'
  smtp_auth_username: 'YOUR_POSTMARK_API_TOKEN'
  smtp_auth_password: 'YOUR_POSTMARK_API_TOKEN'

route:
  receiver: 'default'
  group_by: ['alertname', 'cluster', 'service']
  group_wait: 30s
  group_interval: 5m
  repeat_interval: 4h

  # Route based on severity
  routes:
    # Critical alerts
    - match:
        severity: critical
      receiver: 'critical'
      continue: false
      group_wait: 10s
      repeat_interval: 1h

    # Warning alerts
    - match:
        severity: warning
      receiver: 'warning'
      group_wait: 1m
      repeat_interval: 4h

    # Info alerts
    - match:
        severity: info
      receiver: 'info'
      group_wait: 5m
      repeat_interval: 24h

receivers:
  # Critical alerts: Email + SMS + Slack
  - name: 'critical'
    email_configs:
      - to: 'admin@cdhomeimprovementsrockford.com'
        subject: '🚨 CRITICAL: {{ .GroupLabels.alertname }}'
        html: |
          <h2>Critical Alert</h2>
          <p><strong>Alert:</strong> {{ .GroupLabels.alertname }}</p>
          <p><strong>Severity:</strong> {{ .CommonLabels.severity }}</p>
          <p><strong>Description:</strong> {{ .CommonAnnotations.description }}</p>
          <p><strong>Time:</strong> {{ .StartsAt }}</p>

    # Twilio SMS webhook
    webhook_configs:
      - url: 'https://cdhomeimprovementsrockford.com/api/alerts/sms'
        send_resolved: false

    # Slack
    slack_configs:
      - api_url: 'https://hooks.slack.com/services/YOUR/WEBHOOK/URL'
        channel: '#alerts'
        title: '🚨 CRITICAL: {{ .GroupLabels.alertname }}'
        text: '{{ .CommonAnnotations.description }}'
        send_resolved: true

  # Warning alerts: Email + Slack
  - name: 'warning'
    email_configs:
      - to: 'admin@cdhomeimprovementsrockford.com'
        subject: '⚠️ WARNING: {{ .GroupLabels.alertname }}'

    slack_configs:
      - api_url: 'https://hooks.slack.com/services/YOUR/WEBHOOK/URL'
        channel: '#alerts'
        title: '⚠️ WARNING: {{ .GroupLabels.alertname }}'
        text: '{{ .CommonAnnotations.description }}'
        send_resolved: true

  # Info alerts: Email only (daily digest)
  - name: 'info'
    email_configs:
      - to: 'admin@cdhomeimprovementsrockford.com'
        subject: 'ℹ️ INFO: {{ .GroupLabels.alertname }}'

  # Default receiver
  - name: 'default'
    email_configs:
      - to: 'admin@cdhomeimprovementsrockford.com'

inhibit_rules:
  # Inhibit warning if critical is firing
  - source_match:
      severity: 'critical'
    target_match:
      severity: 'warning'
    equal: ['alertname', 'cluster', 'service']
```

### SMS Alert Webhook

```typescript
// app/api/alerts/sms/route.ts
import { NextRequest, NextResponse } from 'next/server';
import twilio from 'twilio';

const client = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);

export async function POST(request: NextRequest) {
  const alert = await request.json();

  // Extract alert details
  const alertName = alert.groupLabels?.alertname || 'Unknown';
  const description = alert.commonAnnotations?.description || 'No description';
  const severity = alert.commonLabels?.severity || 'unknown';

  // Only send SMS for critical alerts
  if (severity !== 'critical') {
    return NextResponse.json({ status: 'skipped' });
  }

  // Send SMS
  try {
    await client.messages.create({
      to: process.env.SMS_ADMIN_NUMBER!,
      from: process.env.TWILIO_PHONE_NUMBER!,
      body: `🚨 CRITICAL ALERT\n\n${alertName}\n\n${description}`,
    });

    return NextResponse.json({ status: 'sent' });
  } catch (error) {
    console.error('Failed to send SMS alert:', error);
    return NextResponse.json({ error }, { status: 500 });
  }
}
```

---

## Health Check Endpoints

### Application Health Check

```typescript
// app/api/health/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function GET(request: NextRequest) {
  const checks = {
    status: 'ok',
    timestamp: new Date().toISOString(),
    version: process.env.NEXT_PUBLIC_APP_VERSION || 'unknown',
    checks: {
      database: 'unknown',
      redis: 'unknown',
      external_apis: 'unknown',
    },
  };

  try {
    // Database check
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { error: dbError } = await supabase
      .from('leads')
      .select('count')
      .limit(1);

    checks.checks.database = dbError ? 'error' : 'ok';

    // Redis check (if using)
    try {
      const redis = new Redis(process.env.REDIS_URL);
      await redis.ping();
      checks.checks.redis = 'ok';
    } catch (error) {
      checks.checks.redis = 'error';
    }

    // External API checks (Stripe, Invoice Ninja, etc.)
    try {
      const stripeCheck = await fetch('https://api.stripe.com/healthcheck');
      checks.checks.external_apis = stripeCheck.ok ? 'ok' : 'degraded';
    } catch (error) {
      checks.checks.external_apis = 'error';
    }

    // Overall status
    const hasErrors = Object.values(checks.checks).some(
      (status) => status === 'error'
    );
    checks.status = hasErrors ? 'degraded' : 'ok';

    return NextResponse.json(checks, {
      status: hasErrors ? 503 : 200,
    });
  } catch (error) {
    checks.status = 'error';
    return NextResponse.json(checks, { status: 503 });
  }
}
```

### Database Health Check

```typescript
// app/api/health/database/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function GET(request: NextRequest) {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Check database connection
    const start = Date.now();
    const { data, error } = await supabase
      .from('leads')
      .select('count')
      .limit(1);
    const duration = Date.now() - start;

    if (error) {
      return NextResponse.json(
        {
          database: 'error',
          error: error.message,
          timestamp: new Date().toISOString(),
        },
        { status: 503 }
      );
    }

    return NextResponse.json({
      database: 'connected',
      response_time_ms: duration,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    return NextResponse.json(
      {
        database: 'error',
        error: error.message,
        timestamp: new Date().toISOString(),
      },
      { status: 503 }
    );
  }
}
```

### Deep Health Check

```typescript
// app/api/health/deep/route.ts
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const results = {
    status: 'ok',
    timestamp: new Date().toISOString(),
    checks: {
      database: await checkDatabase(),
      cache: await checkCache(),
      external_apis: await checkExternalAPIs(),
      disk_space: await checkDiskSpace(),
      memory: await checkMemory(),
    },
  };

  const hasErrors = Object.values(results.checks).some(
    (check: any) => check.status === 'error'
  );
  results.status = hasErrors ? 'degraded' : 'ok';

  return NextResponse.json(results, {
    status: hasErrors ? 503 : 200,
  });
}

async function checkDatabase() {
  // Database connection and query test
  try {
    const start = Date.now();
    const { data, error } = await supabase.from('leads').select('count').limit(1);
    const duration = Date.now() - start;

    return {
      status: error ? 'error' : 'ok',
      response_time_ms: duration,
      error: error?.message,
    };
  } catch (error) {
    return { status: 'error', error: error.message };
  }
}

async function checkCache() {
  // Redis connection test
  try {
    const redis = new Redis(process.env.REDIS_URL);
    const start = Date.now();
    await redis.ping();
    const duration = Date.now() - start;

    return {
      status: 'ok',
      response_time_ms: duration,
    };
  } catch (error) {
    return { status: 'error', error: error.message };
  }
}

async function checkExternalAPIs() {
  // Check Stripe, Invoice Ninja, etc.
  const apis = [];

  try {
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
    await stripe.balance.retrieve();
    apis.push({ name: 'stripe', status: 'ok' });
  } catch (error) {
    apis.push({ name: 'stripe', status: 'error', error: error.message });
  }

  return apis;
}

async function checkDiskSpace() {
  // Check available disk space (server-side only)
  // Requires system call or monitoring agent
  return { status: 'ok', available_gb: 50, total_gb: 80, used_percent: 37 };
}

async function checkMemory() {
  // Check memory usage (server-side only)
  if (typeof process !== 'undefined') {
    const used = process.memoryUsage();
    return {
      status: 'ok',
      heap_used_mb: Math.round(used.heapUsed / 1024 / 1024),
      heap_total_mb: Math.round(used.heapTotal / 1024 / 1024),
      rss_mb: Math.round(used.rss / 1024 / 1024),
    };
  }
  return { status: 'unknown' };
}
```

---

## Performance Monitoring

### Web Vitals Tracking

```typescript
// app/layout.tsx
'use client';

import { useReportWebVitals } from 'next/web-vitals';
import * as Sentry from '@sentry/nextjs';

export function WebVitals() {
  useReportWebVitals((metric) => {
    // Send to Sentry
    Sentry.captureMessage(`Web Vital: ${metric.name}`, {
      level: 'info',
      tags: {
        web_vital: metric.name,
      },
      extra: {
        value: metric.value,
        rating: metric.rating,
        id: metric.id,
      },
    });

    // Send to custom analytics
    if (typeof window !== 'undefined') {
      fetch('/api/analytics/web-vitals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(metric),
      });
    }

    // Log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.log(metric);
    }
  });

  return null;
}
```

### Custom Performance Metrics

```typescript
// lib/performance.ts
export function measurePerformance(name: string, fn: () => Promise<any>) {
  return async (...args: any[]) => {
    const start = performance.now();

    try {
      const result = await fn(...args);
      const duration = performance.now() - start;

      // Record metric
      httpRequestDuration.labels(name).observe(duration / 1000);

      // Log slow operations
      if (duration > 1000) {
        console.warn(`Slow operation: ${name} took ${duration}ms`);
      }

      return result;
    } catch (error) {
      const duration = performance.now() - start;
      httpRequestDuration.labels(name).observe(duration / 1000);
      httpRequestErrors.labels(name, 'exception').inc();
      throw error;
    }
  };
}

// Usage
export const getLeadsWithPerformanceTracking = measurePerformance(
  'getLeads',
  async () => {
    const { data } = await supabase.from('leads').select('*');
    return data;
  }
);
```

---

## Incident Response

### Incident Response Workflow

```
Incident Detected
       ↓
   Acknowledge
       ↓
    Assess
       ↓
   Communicate
       ↓
    Mitigate
       ↓
    Resolve
       ↓
  Post-Mortem
```

### Incident Response Checklist

```markdown
## Incident Response Checklist

### 1. Detection (0-2 minutes)
- [ ] Alert received (Uptime Kuma, Sentry, or user report)
- [ ] Verify incident is real (not false positive)
- [ ] Determine severity level (P1/P2/P3/P4)

### 2. Acknowledgment (0-5 minutes)
- [ ] Acknowledge alert in monitoring system
- [ ] Notify team in Slack (#incidents channel)
- [ ] Assign incident commander (for P1/P2)

### 3. Assessment (5-15 minutes)
- [ ] Check status page (Uptime Kuma)
- [ ] Check error logs (Sentry)
- [ ] Check system metrics (Grafana)
- [ ] Check recent deployments
- [ ] Identify affected systems/users

### 4. Communication (Throughout incident)
- [ ] Update status page with incident details
- [ ] Post updates in Slack every 15 minutes
- [ ] Notify affected customers (if applicable)
- [ ] Document timeline in incident log

### 5. Mitigation (15 minutes - 2 hours)
- [ ] Apply immediate fix or workaround
- [ ] Rollback recent deployment (if applicable)
- [ ] Scale resources (if performance issue)
- [ ] Restart affected services
- [ ] Verify mitigation worked

### 6. Resolution (2-24 hours)
- [ ] Implement permanent fix
- [ ] Deploy fix to production
- [ ] Monitor for 2 hours post-fix
- [ ] Mark incident as resolved
- [ ] Update status page

### 7. Post-Mortem (1-3 days after resolution)
- [ ] Schedule post-mortem meeting
- [ ] Document timeline and actions taken
- [ ] Identify root cause
- [ ] Create action items to prevent recurrence
- [ ] Share lessons learned with team
```

### Incident Severity Levels

| Level | Description | Response Time | Example |
|-------|-------------|---------------|---------|
| **P1 - Critical** | Complete system outage | < 5 minutes | Website down, database failure |
| **P2 - High** | Major functionality broken | < 15 minutes | Payment processing failure, API errors |
| **P3 - Medium** | Partial functionality impaired | < 1 hour | Slow page loads, non-critical bug |
| **P4 - Low** | Minor issue, no user impact | < 24 hours | UI glitch, typo |

### Incident Communication Template

```markdown
## Incident Update Template

**Status:** [Investigating / Identified / Monitoring / Resolved]
**Severity:** [P1 / P2 / P3 / P4]
**Impact:** [Description of user impact]
**Time Detected:** [Timestamp]
**Affected Systems:** [List of affected systems]

**Current Status:**
[Brief description of current situation]

**Actions Taken:**
- [Action 1]
- [Action 2]

**Next Steps:**
- [Next step 1]
- [Next step 2]

**Next Update:** [Timestamp]
```

---

## Monitoring Best Practices

### Monitoring Checklist

**Daily:**
- [ ] Review overnight alerts
- [ ] Check Uptime Kuma dashboard
- [ ] Review error rate in Sentry
- [ ] Check recent deployments

**Weekly:**
- [ ] Review slow queries in Grafana
- [ ] Check disk space and resource usage
- [ ] Review backup logs
- [ ] Test alert notifications

**Monthly:**
- [ ] Review and optimize alert thresholds
- [ ] Test disaster recovery procedures
- [ ] Update monitoring documentation
- [ ] Review incident post-mortems

**Quarterly:**
- [ ] Audit monitoring coverage
- [ ] Test all alert channels
- [ ] Review and update runbooks
- [ ] Conduct incident response drill

### Key Metrics to Monitor

```typescript
// Four Golden Signals of Monitoring

// 1. Latency (How long does it take?)
histogram_quantile(0.95,
  sum(rate(http_request_duration_seconds_bucket[5m])) by (route, le)
)

// 2. Traffic (How much demand?)
sum(rate(http_requests_total[5m])) by (route)

// 3. Errors (How many failures?)
sum(rate(http_request_errors_total[5m])) by (route)
/ sum(rate(http_requests_total[5m])) by (route)

// 4. Saturation (How full is it?)
(1 - (node_memory_MemAvailable_bytes / node_memory_MemTotal_bytes)) * 100
```

---

## Summary

### Quick Start Monitoring Setup

```bash
# 1. Start monitoring stack
cd /opt/cdhi-stack/docker
docker-compose up -d uptime-kuma prometheus grafana loki

# 2. Configure Uptime Kuma
# URL: https://status.cdhomeimprovementsrockford.com
# Add monitors for all services

# 3. Configure Grafana
# URL: https://monitoring.cdhomeimprovementsrockford.com
# Import dashboards

# 4. Set up alerts
# Configure email, SMS, and Slack notifications

# 5. Test monitoring
# Simulate failure, verify alerts received
```

### Monitoring Stack URLs

| Service | URL | Purpose |
|---------|-----|---------|
| **Uptime Kuma** | https://status.cdhomeimprovementsrockford.com | Uptime monitoring |
| **Grafana** | https://monitoring.cdhomeimprovementsrockford.com | Dashboards and metrics |
| **Prometheus** | http://localhost:9090 | Metrics database |
| **Loki** | http://localhost:3100 | Log aggregation |
| **Sentry** | https://sentry.io/organizations/cd-home-improvements | Error tracking |

---

**Remember**: Good monitoring prevents problems from becoming incidents. Monitor proactively, alert thoughtfully, and respond quickly.
