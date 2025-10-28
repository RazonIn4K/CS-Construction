# CD Home Improvements - Performance Optimization Guide

**Complete guide for optimizing system performance and scalability**

---

## 📋 Table of Contents

- [Overview](#overview)
- [Performance Targets](#performance-targets)
- [Frontend Optimization](#frontend-optimization)
- [API Optimization](#api-optimization)
- [Database Optimization](#database-optimization)
- [Caching Strategy](#caching-strategy)
- [CDN & Assets](#cdn--assets)
- [Server Optimization](#server-optimization)
- [Monitoring & Profiling](#monitoring--profiling)
- [Load Testing](#load-testing)
- [Scalability Planning](#scalability-planning)

---

## 🎯 Overview

This guide provides comprehensive performance optimization strategies for the CD Home Improvements system. Performance directly impacts user experience, SEO rankings, and conversion rates.

### Performance Impact

**1 second delay = 7% reduction in conversions**

| Page Load Time | User Impact | Business Impact |
|----------------|-------------|-----------------|
| < 1s | Excellent | +25% conversion |
| 1-3s | Good | Baseline |
| 3-5s | Acceptable | -10% conversion |
| 5-10s | Poor | -40% conversion |
| > 10s | Unacceptable | -70% conversion |

---

## 📊 Performance Targets

### Core Web Vitals

| Metric | Target | Acceptable | Poor |
|--------|--------|------------|------|
| **LCP** (Largest Contentful Paint) | < 2.5s | 2.5-4s | > 4s |
| **FID** (First Input Delay) | < 100ms | 100-300ms | > 300ms |
| **CLS** (Cumulative Layout Shift) | < 0.1 | 0.1-0.25 | > 0.25 |
| **TTFB** (Time to First Byte) | < 200ms | 200-600ms | > 600ms |
| **FCP** (First Contentful Paint) | < 1.8s | 1.8-3s | > 3s |

### API Performance Targets

| Endpoint | Target | Acceptable | Action Required |
|----------|--------|------------|-----------------|
| POST /api/leads | < 300ms | 300-500ms | Optimize > 500ms |
| POST /api/webhooks/* | < 200ms | 200-400ms | Optimize > 400ms |
| GET /api/admin/replay | < 150ms | 150-300ms | Optimize > 300ms |

### Database Performance Targets

| Operation | Target | Acceptable | Action Required |
|-----------|--------|------------|-----------------|
| Simple SELECT | < 10ms | 10-50ms | Optimize > 50ms |
| Complex JOIN | < 50ms | 50-100ms | Optimize > 100ms |
| INSERT | < 20ms | 20-50ms | Optimize > 50ms |
| UPDATE | < 30ms | 30-75ms | Optimize > 75ms |

---

## 🌐 Frontend Optimization

### Next.js Configuration

**Optimize next.config.ts:**

```typescript
// next.config.ts
import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,

  // Compiler optimizations
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production',
  },

  // Experimental features
  experimental: {
    instrumentationHook: true,
    optimizeCss: true,
    scrollRestoration: true,
  },

  // Image optimization
  images: {
    domains: ['supabase.co', 'YOUR_CDN_DOMAIN'],
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    minimumCacheTTL: 60,
    dangerouslyAllowSVG: false,
  },

  // Compression
  compress: true,

  // Production optimizations
  swcMinify: true,

  // Headers for caching
  async headers() {
    return [
      {
        source: '/fonts/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      {
        source: '/_next/static/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
    ];
  },
};

export default nextConfig;
```

### Component Optimization

**Use React.memo for expensive components:**

```typescript
// components/LeadForm.tsx
import React, { memo } from 'react';

const LeadForm = memo(function LeadForm({ onSuccess, className }: LeadFormProps) {
  // Component implementation
}, (prevProps, nextProps) => {
  // Custom comparison function
  return prevProps.className === nextProps.className;
});

export default LeadForm;
```

**Lazy load components:**

```typescript
// app/page.tsx
import dynamic from 'next/dynamic';

// Lazy load below-fold components
const Testimonials = dynamic(() => import('@/components/Testimonials'), {
  loading: () => <div>Loading...</div>,
  ssr: false, // Skip SSR if not needed
});

const Footer = dynamic(() => import('@/components/Footer'), {
  ssr: true, // Include in SSR
});

export default function HomePage() {
  return (
    <>
      {/* Above fold content */}
      <Hero />
      <Services />

      {/* Below fold - lazy loaded */}
      <Testimonials />
      <Footer />
    </>
  );
}
```

### Image Optimization

**Use Next.js Image component:**

```typescript
// components/Hero.tsx
import Image from 'next/image';

export function Hero() {
  return (
    <div className="hero">
      {/* Priority images (above fold) */}
      <Image
        src="/hero-background.jpg"
        alt="CD Home Improvements"
        width={1920}
        height={1080}
        priority
        quality={85}
        placeholder="blur"
        blurDataURL="data:image/jpeg;base64,/9j/4AAQSkZJRg..."
      />

      {/* Lazy loaded images (below fold) */}
      <Image
        src="/kitchen-remodel.jpg"
        alt="Kitchen Remodel"
        width={800}
        height={600}
        loading="lazy"
        quality={75}
      />
    </div>
  );
}
```

**Generate blur placeholders:**

```bash
# Install sharp for image processing
npm install sharp

# Create script to generate blur data URLs
node scripts/generate-blur-placeholders.js
```

```javascript
// scripts/generate-blur-placeholders.js
const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

async function generateBlurDataURL(imagePath) {
  const image = sharp(imagePath);
  const buffer = await image
    .resize(10, 10, { fit: 'inside' })
    .blur()
    .toBuffer();

  return `data:image/jpeg;base64,${buffer.toString('base64')}`;
}

// Usage
const images = [
  'public/hero-background.jpg',
  'public/kitchen-remodel.jpg',
];

images.forEach(async (img) => {
  const blurDataURL = await generateBlurDataURL(img);
  console.log(`${img}: ${blurDataURL}`);
});
```

### Font Optimization

**Use next/font for automatic optimization:**

```typescript
// app/layout.tsx
import { Inter } from 'next/font/google';

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
  preload: true,
  fallback: ['system-ui', 'arial'],
});

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={inter.variable}>
      <body>{children}</body>
    </html>
  );
}
```

**Self-host fonts for better performance:**

```bash
# Download fonts
mkdir -p public/fonts
cd public/fonts

# Download Inter font
curl -O https://github.com/rsms/inter/releases/download/v3.19/Inter-3.19.zip
unzip Inter-3.19.zip
```

```css
/* app/globals.css */
@font-face {
  font-family: 'Inter';
  src: url('/fonts/Inter-Regular.woff2') format('woff2');
  font-weight: 400;
  font-style: normal;
  font-display: swap;
}

@font-face {
  font-family: 'Inter';
  src: url('/fonts/Inter-Bold.woff2') format('woff2');
  font-weight: 700;
  font-style: normal;
  font-display: swap;
}
```

### JavaScript Optimization

**Code splitting:**

```typescript
// Automatic code splitting by route (Next.js default)
// Each page in app/ directory is automatically split

// Manual code splitting for large libraries
const Chart = dynamic(() => import('chart.js'), {
  ssr: false,
  loading: () => <div>Loading chart...</div>,
});
```

**Tree shaking:**

```typescript
// Import only what you need
// ❌ Bad - imports entire library
import * as _ from 'lodash';

// ✅ Good - imports only specific function
import debounce from 'lodash/debounce';

// ✅ Better - use ES6 modules
import { debounce } from 'lodash-es';
```

**Reduce bundle size:**

```bash
# Analyze bundle size
npm install -g @next/bundle-analyzer

# Add to next.config.ts
const withBundleAnalyzer = require('@next/bundle-analyzer')({
  enabled: process.env.ANALYZE === 'true',
});

module.exports = withBundleAnalyzer(nextConfig);

# Run analysis
ANALYZE=true npm run build
```

---

## ⚡ API Optimization

### Response Caching

**Implement API route caching:**

```typescript
// app/api/leads/route.ts
import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'edge'; // Use edge runtime for faster response
export const revalidate = 60; // Cache for 60 seconds

// Add caching headers
export async function GET(request: NextRequest) {
  const data = await fetchData();

  return NextResponse.json(data, {
    headers: {
      'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=120',
    },
  });
}
```

### Database Connection Pooling

**Use Supabase connection pooler:**

```typescript
// lib/supabase.ts
import { createClient } from '@supabase/supabase-js';

// Use connection pooler URL for better performance
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// For serverless functions, use pooler
const databaseUrl = process.env.DATABASE_URL?.includes('6543')
  ? process.env.DATABASE_URL // Already using pooler
  : process.env.DATABASE_URL?.replace(':5432', ':6543'); // Switch to pooler

export const supabase = createClient(supabaseUrl, supabaseKey, {
  db: {
    schema: 'public',
  },
  auth: {
    persistSession: false, // Disable session persistence in API routes
  },
  global: {
    headers: {
      'x-connection-pool': 'true',
    },
  },
});
```

### Async Processing

**Move heavy operations to background:**

```typescript
// app/api/leads/route.ts
export async function POST(request: NextRequest) {
  const data = await request.json();
  const validated = LeadSubmissionSchema.parse(data);

  // Synchronous operations (fast)
  const { data: lead } = await supabase
    .from('leads')
    .insert(validated)
    .select()
    .single();

  // Asynchronous operations (don't wait)
  // Use Promise.allSettled to not block response
  Promise.allSettled([
    triggerN8nWorkflow(lead), // Don't wait for n8n
    sendEmail(lead.email),    // Don't wait for email
  ]).catch((error) => {
    // Log errors but don't fail the request
    console.error('Background task failed:', error);
  });

  // Return immediately
  return NextResponse.json({
    success: true,
    lead_id: lead.lead_id,
  });
}
```

### Request Compression

**Enable compression in Vercel:**

```json
// vercel.json
{
  "headers": [
    {
      "source": "/api/(.*)",
      "headers": [
        {
          "key": "Content-Encoding",
          "value": "gzip"
        }
      ]
    }
  ]
}
```

---

## 🗄️ Database Optimization

### Index Optimization

**Create strategic indexes:**

```sql
-- Run in Supabase SQL Editor

-- Index for lead lookups by email
CREATE INDEX CONCURRENTLY idx_leads_email
ON leads(email)
WHERE deleted_at IS NULL;

-- Index for lead status filtering
CREATE INDEX CONCURRENTLY idx_leads_status_created
ON leads(status, created_at DESC)
WHERE deleted_at IS NULL;

-- Index for client lookups
CREATE INDEX CONCURRENTLY idx_clients_email
ON clients(email)
WHERE deleted_at IS NULL;

-- Composite index for invoice queries
CREATE INDEX CONCURRENTLY idx_invoices_client_status
ON invoices(client_id, status, created_at DESC);

-- Index for payment lookups
CREATE INDEX CONCURRENTLY idx_payments_invoice
ON payments(invoice_id, status);

-- Index for property lookups
CREATE INDEX CONCURRENTLY idx_properties_client
ON properties(client_id);

-- Partial index for active leads only
CREATE INDEX CONCURRENTLY idx_active_leads
ON leads(created_at DESC)
WHERE status IN ('NEW', 'CONTACTED', 'QUALIFIED');

-- Index for webhook event lookups
CREATE INDEX CONCURRENTLY idx_webhook_external_id
ON webhook_event_dlq(external_id)
WHERE replayed_at IS NULL;
```

**Verify index usage:**

```sql
-- Check if indexes are being used
EXPLAIN ANALYZE
SELECT * FROM leads
WHERE status = 'NEW'
AND created_at > NOW() - INTERVAL '7 days';

-- Look for "Index Scan" instead of "Seq Scan"

-- Check index sizes
SELECT
    schemaname,
    tablename,
    indexname,
    pg_size_pretty(pg_relation_size(indexrelid)) AS index_size
FROM pg_stat_user_indexes
ORDER BY pg_relation_size(indexrelid) DESC;
```

### Query Optimization

**Optimize N+1 queries:**

```typescript
// ❌ Bad - N+1 query problem
const leads = await supabase.from('leads').select('*');
for (const lead of leads.data) {
  const client = await supabase
    .from('clients')
    .select('*')
    .eq('client_id', lead.client_id)
    .single();
  // Process...
}

// ✅ Good - Single query with join
const { data: leads } = await supabase
  .from('leads')
  .select(`
    *,
    client:clients(*)
  `);
```

**Use database views for complex queries:**

```sql
-- Create view for common query patterns
CREATE OR REPLACE VIEW v_lead_summary AS
SELECT
    l.lead_id,
    l.service_type,
    l.status,
    l.created_at,
    c.first_name,
    c.last_name,
    c.email,
    p.street_address,
    p.city,
    p.state,
    p.zip_code,
    COUNT(i.invoice_id) as invoice_count,
    SUM(i.total_amount) as total_revenue
FROM leads l
JOIN clients c ON l.client_id = c.client_id
JOIN properties p ON l.property_id = p.property_id
LEFT JOIN invoices i ON c.client_id = i.client_id
WHERE l.deleted_at IS NULL
GROUP BY l.lead_id, c.client_id, p.property_id;

-- Use view in application
const { data } = await supabase.from('v_lead_summary').select('*');
```

**Batch operations:**

```typescript
// ❌ Bad - Multiple individual inserts
for (const lead of leads) {
  await supabase.from('leads').insert(lead);
}

// ✅ Good - Batch insert
await supabase.from('leads').insert(leads);
```

### Connection Management

**Implement connection pooling in VPS:**

```yaml
# docker-compose.yml
services:
  pgbouncer:
    image: pgbouncer/pgbouncer:latest
    container_name: cdhi-pgbouncer
    networks: [backend]
    environment:
      DATABASES_HOST: db.PROJECT_ID.supabase.co
      DATABASES_PORT: 5432
      DATABASES_USER: postgres
      DATABASES_PASSWORD: ${DB_PASSWORD}
      DATABASES_DBNAME: postgres
      PGBOUNCER_POOL_MODE: transaction
      PGBOUNCER_MAX_CLIENT_CONN: 100
      PGBOUNCER_DEFAULT_POOL_SIZE: 20
      PGBOUNCER_MIN_POOL_SIZE: 5
      PGBOUNCER_RESERVE_POOL_SIZE: 5
    ports:
      - "6432:6432"
```

---

## 💾 Caching Strategy

### Client-Side Caching

**Use SWR for data fetching:**

```bash
npm install swr
```

```typescript
// hooks/useLeads.ts
import useSWR from 'swr';

const fetcher = (url: string) => fetch(url).then((r) => r.json());

export function useLeads() {
  const { data, error, isLoading, mutate } = useSWR(
    '/api/admin/leads',
    fetcher,
    {
      refreshInterval: 30000, // Refresh every 30 seconds
      revalidateOnFocus: false,
      dedupingInterval: 5000, // Dedupe requests within 5s
    }
  );

  return {
    leads: data,
    isLoading,
    isError: error,
    refresh: mutate,
  };
}
```

### Server-Side Caching

**Implement Redis caching:**

```bash
# Add Redis to docker-compose.yml
```

```yaml
services:
  redis:
    image: redis:7-alpine
    container_name: cdhi-redis
    networks: [backend]
    command: redis-server --appendonly yes --maxmemory 256mb --maxmemory-policy allkeys-lru
    volumes:
      - redis_data:/data
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 10s
      timeout: 3s
      retries: 3

volumes:
  redis_data: {}
```

**Use Redis in API routes:**

```typescript
// lib/cache.ts
import Redis from 'ioredis';

const redis = new Redis({
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379'),
  password: process.env.REDIS_PASSWORD,
  maxRetriesPerRequest: 3,
  retryStrategy: (times) => Math.min(times * 50, 2000),
});

export async function cacheGet<T>(key: string): Promise<T | null> {
  const cached = await redis.get(key);
  return cached ? JSON.parse(cached) : null;
}

export async function cacheSet(
  key: string,
  value: any,
  ttl: number = 60
): Promise<void> {
  await redis.setex(key, ttl, JSON.stringify(value));
}

export async function cacheDel(key: string): Promise<void> {
  await redis.del(key);
}

// Usage in API route
export async function GET(request: NextRequest) {
  const cacheKey = 'leads:recent';

  // Try cache first
  const cached = await cacheGet(cacheKey);
  if (cached) {
    return NextResponse.json(cached);
  }

  // Fetch from database
  const { data } = await supabase.from('leads').select('*').limit(100);

  // Cache result
  await cacheSet(cacheKey, data, 300); // Cache for 5 minutes

  return NextResponse.json(data);
}
```

### HTTP Caching

**Configure Caddy caching:**

```caddyfile
# docker/Caddyfile
cdhomeimprovementsrockford.com {
    # Cache static assets
    @static {
        path *.js *.css *.png *.jpg *.jpeg *.gif *.ico *.svg *.woff *.woff2
    }

    header @static {
        Cache-Control "public, max-age=31536000, immutable"
    }

    # Cache API responses (with validation)
    @api {
        path /api/*
    }

    header @api {
        Cache-Control "public, max-age=60, must-revalidate"
    }

    # Don't cache dynamic pages
    header / {
        Cache-Control "public, max-age=0, must-revalidate"
    }

    reverse_proxy vercel:3000
}
```

---

## 🌍 CDN & Assets

### Vercel CDN (Automatic)

Vercel automatically serves static assets via CDN. No configuration needed.

### CloudFlare CDN (Optional)

**Add CloudFlare for additional caching:**

1. **Set up CloudFlare:**
   - Add domain to CloudFlare
   - Update nameservers
   - Enable "Full (strict)" SSL

2. **Configure Page Rules:**

```
Rule 1: /api/*
  Cache Level: Bypass

Rule 2: /_next/static/*
  Cache Level: Cache Everything
  Edge Cache TTL: 1 year

Rule 3: /fonts/*
  Cache Level: Cache Everything
  Edge Cache TTL: 1 year

Rule 4: /*
  Cache Level: Standard
  Browser Cache TTL: 4 hours
```

3. **Enable optimizations:**
   - ✅ Auto Minify (JavaScript, CSS, HTML)
   - ✅ Brotli compression
   - ✅ Rocket Loader (careful - test first)
   - ✅ Mirage (image optimization)

### Image CDN

**Use Cloudinary for image optimization:**

```bash
npm install cloudinary
```

```typescript
// lib/cloudinary.ts
import { v2 as cloudinary } from 'cloudinary';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export function getOptimizedImageUrl(
  publicId: string,
  width: number = 800,
  quality: number = 80
): string {
  return cloudinary.url(publicId, {
    width,
    quality,
    fetch_format: 'auto', // Auto-select best format (WebP, AVIF)
    secure: true,
    transformation: [
      { dpr: 'auto' }, // Auto device pixel ratio
      { responsive: true },
    ],
  });
}
```

---

## 🖥️ Server Optimization

### Docker Resource Limits

**Optimize resource allocation:**

```yaml
# docker-compose.yml
services:
  mariadb:
    deploy:
      resources:
        limits:
          cpus: '2.0'
          memory: 1G
        reservations:
          cpus: '0.5'
          memory: 512M
    command: >
      --max-connections=200
      --query-cache-size=64M
      --query-cache-type=1
      --innodb-buffer-pool-size=512M
      --innodb-log-file-size=128M

  invoiceninja:
    deploy:
      resources:
        limits:
          cpus: '1.0'
          memory: 512M
    environment:
      PHP_MEMORY_LIMIT: 256M
      PHP_MAX_EXECUTION_TIME: 60

  n8n:
    deploy:
      resources:
        limits:
          cpus: '1.0'
          memory: 512M
    environment:
      NODE_OPTIONS: --max-old-space-size=384
```

### System Tuning

**Optimize Linux kernel parameters:**

```bash
# /etc/sysctl.conf
sudo tee -a /etc/sysctl.conf << 'EOF'
# Network optimizations
net.core.somaxconn = 1024
net.core.netdev_max_backlog = 5000
net.ipv4.tcp_max_syn_backlog = 2048
net.ipv4.tcp_fin_timeout = 15
net.ipv4.tcp_keepalive_time = 300

# File descriptor limits
fs.file-max = 100000

# Shared memory
kernel.shmmax = 268435456
kernel.shmall = 268435456
EOF

# Apply changes
sudo sysctl -p
```

**Increase file descriptor limits:**

```bash
# /etc/security/limits.conf
sudo tee -a /etc/security/limits.conf << 'EOF'
* soft nofile 65536
* hard nofile 65536
root soft nofile 65536
root hard nofile 65536
EOF

# Verify
ulimit -n
```

### Nginx (if not using Caddy)

**Optimize Nginx:**

```nginx
# /etc/nginx/nginx.conf
worker_processes auto;
worker_rlimit_nofile 65536;

events {
    worker_connections 4096;
    use epoll;
    multi_accept on;
}

http {
    # Caching
    proxy_cache_path /var/cache/nginx levels=1:2 keys_zone=my_cache:10m max_size=1g inactive=60m use_temp_path=off;

    # Compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css text/xml text/javascript application/javascript application/json;

    # Timeouts
    keepalive_timeout 65;
    client_body_timeout 12;
    client_header_timeout 12;
    send_timeout 10;

    # Buffer sizes
    client_body_buffer_size 128k;
    client_max_body_size 10m;
    client_header_buffer_size 1k;
    large_client_header_buffers 4 4k;

    # TCP optimizations
    tcp_nopush on;
    tcp_nodelay on;
}
```

---

## 📈 Monitoring & Profiling

### Performance Monitoring Dashboard

**Create monitoring script:**

```bash
#!/bin/bash
# /opt/cdhi-stack/performance-monitor.sh

echo "📊 CD Home Improvements - Performance Report"
echo "=============================================="
echo "Timestamp: $(date)"
echo ""

# 1. API Response Times
echo "🌐 API Response Times:"
for endpoint in "/api/leads" "/api/webhooks/stripe" "/"; do
    response_time=$(curl -o /dev/null -s -w '%{time_total}' "https://cdhomeimprovementsrockford.com$endpoint" || echo "N/A")
    echo "  $endpoint: ${response_time}s"
done
echo ""

# 2. Database Performance
echo "🗄️ Database Performance:"
psql "$DATABASE_URL" -c "
SELECT
    query,
    calls,
    mean_exec_time,
    max_exec_time
FROM pg_stat_statements
ORDER BY mean_exec_time DESC
LIMIT 5;
" || echo "  Unable to connect to database"
echo ""

# 3. Server Resources
echo "💻 Server Resources:"
echo "  CPU Usage: $(top -bn1 | grep "Cpu(s)" | awk '{print $2 + $4}')"
echo "  Memory Usage: $(free -m | awk 'NR==2{printf "%.2f%%", $3*100/$2 }')"
echo "  Disk Usage: $(df -h / | awk 'NR==2{print $5}')"
echo ""

# 4. Docker Stats
echo "🐳 Docker Container Stats:"
docker stats --no-stream --format "table {{.Name}}\t{{.CPUPerc}}\t{{.MemUsage}}"
echo ""

# 5. Lighthouse Score (requires puppeteer)
echo "🔬 Lighthouse Scores (run manually with Chrome DevTools)"

echo "=============================================="
```

### Vercel Analytics

**Enable Vercel Analytics:**

```bash
npm install @vercel/analytics
```

```typescript
// app/layout.tsx
import { Analytics } from '@vercel/analytics/react';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html>
      <body>
        {children}
        <Analytics />
      </body>
    </html>
  );
}
```

### Real User Monitoring (RUM)

**Track Web Vitals:**

```typescript
// app/web-vitals.ts
import { onCLS, onFID, onFCP, onLCP, onTTFB } from 'web-vitals';

function sendToAnalytics(metric: any) {
  // Send to your analytics endpoint
  fetch('/api/analytics', {
    method: 'POST',
    body: JSON.stringify(metric),
    headers: { 'Content-Type': 'application/json' },
  }).catch(console.error);
}

export function registerWebVitals() {
  onCLS(sendToAnalytics);
  onFID(sendToAnalytics);
  onFCP(sendToAnalytics);
  onLCP(sendToAnalytics);
  onTTFB(sendToAnalytics);
}
```

```typescript
// app/layout.tsx
'use client';

import { useEffect } from 'react';
import { registerWebVitals } from './web-vitals';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    registerWebVitals();
  }, []);

  return <html><body>{children}</body></html>;
}
```

---

## 🧪 Load Testing

### Apache Bench (ab)

```bash
# Install Apache Bench
sudo apt install apache2-utils

# Test homepage
ab -n 1000 -c 10 https://cdhomeimprovementsrockford.com/

# Test API endpoint
ab -n 1000 -c 10 -p test-lead.json -T application/json \
  https://cdhomeimprovementsrockford.com/api/leads
```

### k6 Load Testing

```bash
# Install k6
sudo gpg --no-default-keyring --keyring /usr/share/keyrings/k6-archive-keyring.gpg --keyserver hkp://keyserver.ubuntu.com:80 --recv-keys C5AD17C747E3415A3642D57D77C6C491D6AC1D69
echo "deb [signed-by=/usr/share/keyrings/k6-archive-keyring.gpg] https://dl.k6.io/deb stable main" | sudo tee /etc/apt/sources.list.d/k6.list
sudo apt update
sudo apt install k6
```

```javascript
// tests/load-test.js
import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  stages: [
    { duration: '2m', target: 10 }, // Ramp up to 10 users
    { duration: '5m', target: 10 }, // Stay at 10 users
    { duration: '2m', target: 50 }, // Ramp up to 50 users
    { duration: '5m', target: 50 }, // Stay at 50 users
    { duration: '2m', target: 0 },  // Ramp down to 0 users
  ],
  thresholds: {
    http_req_duration: ['p(95)<500'], // 95% of requests must complete below 500ms
    http_req_failed: ['rate<0.01'],   // Less than 1% failure rate
  },
};

export default function () {
  // Test homepage
  const res1 = http.get('https://cdhomeimprovementsrockford.com');
  check(res1, { 'homepage status 200': (r) => r.status === 200 });

  sleep(1);

  // Test API
  const leadData = {
    first_name: 'Load',
    last_name: 'Test',
    email: `loadtest${__VU}@example.com`,
    street_address: '123 Test St',
    city: 'Rockford',
    state: 'IL',
    zip_code: '61101',
    service_type: 'Other',
  };

  const res2 = http.post(
    'https://cdhomeimprovementsrockford.com/api/leads',
    JSON.stringify(leadData),
    { headers: { 'Content-Type': 'application/json' } }
  );

  check(res2, {
    'lead submission status 200': (r) => r.status === 200,
    'lead submission time < 500ms': (r) => r.timings.duration < 500,
  });

  sleep(2);
}
```

**Run load test:**

```bash
k6 run tests/load-test.js
```

---

## 📈 Scalability Planning

### When to Scale

**Triggers:**

| Metric | Current | Scale When | Action |
|--------|---------|------------|--------|
| CPU Usage | 40% | > 70% sustained | Upgrade VPS |
| Memory Usage | 50% | > 80% | Add RAM/swap |
| API Response Time | 300ms | > 500ms avg | Optimize queries |
| Database Connections | 20 | > 80 | Increase pool size |
| Disk Usage | 60% | > 85% | Upgrade storage |
| Error Rate | 0.1% | > 1% | Investigate & fix |

### Horizontal Scaling (Future)

**Load balancer setup (when needed):**

```yaml
# docker-compose.yml (multi-server setup)
services:
  nginx-lb:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx-lb.conf:/etc/nginx/nginx.conf
    depends_on:
      - app1
      - app2

  app1:
    image: invoiceninja/invoiceninja:5
    # ... config

  app2:
    image: invoiceninja/invoiceninja:5
    # ... config
```

### Database Scaling

**Read replicas (when needed):**

- Use Supabase read replicas for read-heavy workloads
- Configure in Supabase dashboard
- Update connection strings for read operations

**Sharding strategy (future consideration):**

- Shard by client_id or property_id
- Requires significant refactoring
- Consider only when database > 1TB

---

**Last Updated:** 2025-01-28
**Version:** 1.0
**Maintained by:** CD Home Improvements Performance Team
