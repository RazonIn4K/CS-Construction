# Database Optimization and Query Tuning Guide

## Table of Contents
1. [Overview](#overview)
2. [Database Schema Optimization](#database-schema-optimization)
3. [Index Strategies](#index-strategies)
4. [Query Optimization](#query-optimization)
5. [Connection Pooling](#connection-pooling)
6. [Query Performance Analysis](#query-performance-analysis)
7. [N+1 Query Prevention](#n1-query-prevention)
8. [Caching Strategies](#caching-strategies)
9. [Database Maintenance](#database-maintenance)
10. [Monitoring and Alerts](#monitoring-and-alerts)
11. [Backup Optimization](#backup-optimization)
12. [Common Performance Issues](#common-performance-issues)

---

## Overview

This guide provides comprehensive database optimization strategies for the CD Home Improvements project using Supabase (PostgreSQL). Proper database optimization ensures:

- **Fast Query Performance**: Sub-100ms response times for most queries
- **Scalability**: Handle growing data without performance degradation
- **Reliability**: Consistent performance under load
- **Cost Efficiency**: Optimize resource usage and reduce costs

### Performance Targets

| Operation | Target | Measurement |
|-----------|--------|-------------|
| **Simple SELECT** | < 50ms | Single row lookup by primary key |
| **Complex JOIN** | < 200ms | Multi-table queries with filters |
| **INSERT/UPDATE** | < 100ms | Single row operations |
| **Batch INSERT** | < 500ms | 100 rows |
| **Full Table Scan** | < 1s | Small tables (< 10,000 rows) |
| **Dashboard Load** | < 300ms | All aggregated data |

---

## Database Schema Optimization

### Current Schema Analysis

```sql
-- Review current table sizes
SELECT
    schemaname,
    tablename,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS total_size,
    pg_size_pretty(pg_relation_size(schemaname||'.'||tablename)) AS table_size,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename) -
                   pg_relation_size(schemaname||'.'||tablename)) AS index_size
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;
```

### Schema Design Best Practices

#### 1. Use Appropriate Data Types

```sql
-- ❌ Bad: Using TEXT for everything
CREATE TABLE leads (
    lead_id TEXT,           -- Should be UUID
    created_at TEXT,        -- Should be TIMESTAMPTZ
    estimated_value TEXT,   -- Should be INTEGER/NUMERIC
    status TEXT            -- Should be ENUM or limited VARCHAR
);

-- ✅ Good: Proper data types
CREATE TABLE leads (
    lead_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    estimated_value INTEGER,  -- Stored in cents
    status VARCHAR(20) CHECK (status IN ('new', 'in_progress', 'converted', 'lost')),
    deleted_at TIMESTAMPTZ    -- For soft deletes
);

-- Benefits:
-- - UUID: Smaller than TEXT (16 bytes vs 37 bytes as string)
-- - TIMESTAMPTZ: Built-in timezone support, indexable, sortable
-- - INTEGER: Fast arithmetic, 4 bytes vs unlimited TEXT
-- - VARCHAR(20): Enforces data integrity, more efficient than TEXT
-- - CHECK constraint: Database-level validation
```

#### 2. Normalize Appropriately

```sql
-- ❌ Bad: Denormalized (storing client data in leads table)
CREATE TABLE leads (
    lead_id UUID PRIMARY KEY,
    client_first_name VARCHAR(100),
    client_last_name VARCHAR(100),
    client_email VARCHAR(255),
    client_phone VARCHAR(20),
    client_address TEXT,
    -- ... more client fields duplicated
    service_type VARCHAR(100)
);
-- Problem: Client data duplicated across multiple leads

-- ✅ Good: Normalized (separate clients table)
CREATE TABLE clients (
    client_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    phone VARCHAR(20),
    address TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE leads (
    lead_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id UUID NOT NULL REFERENCES clients(client_id) ON DELETE CASCADE,
    service_type VARCHAR(100) NOT NULL,
    estimated_value INTEGER,
    status VARCHAR(20) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Benefits:
-- - No data duplication
-- - Update client info once, reflected in all leads
-- - Enforced referential integrity
-- - Smaller storage footprint
```

#### 3. Use Soft Deletes

```sql
-- ❌ Bad: Hard delete (data permanently lost)
DELETE FROM leads WHERE lead_id = 'abc123';

-- ✅ Good: Soft delete (data preserved, can be restored)
ALTER TABLE leads ADD COLUMN deleted_at TIMESTAMPTZ;

-- Create index for active records only
CREATE INDEX idx_leads_active ON leads(created_at DESC)
WHERE deleted_at IS NULL;

-- Delete query becomes update
UPDATE leads
SET deleted_at = NOW()
WHERE lead_id = 'abc123';

-- Select only active records
SELECT * FROM leads WHERE deleted_at IS NULL;

-- Benefits:
-- - Can restore deleted data
-- - Audit trail preserved
-- - Historical reporting possible
-- - Safer operations
```

#### 4. Partition Large Tables

```sql
-- For tables that will grow very large (> 10M rows)
-- Partition by date (e.g., leads table)

-- Create parent table
CREATE TABLE leads_partitioned (
    lead_id UUID NOT NULL,
    client_id UUID NOT NULL,
    service_type VARCHAR(100) NOT NULL,
    estimated_value INTEGER,
    status VARCHAR(20) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMPTZ
) PARTITION BY RANGE (created_at);

-- Create partitions for each year
CREATE TABLE leads_2024 PARTITION OF leads_partitioned
    FOR VALUES FROM ('2024-01-01') TO ('2025-01-01');

CREATE TABLE leads_2025 PARTITION OF leads_partitioned
    FOR VALUES FROM ('2025-01-01') TO ('2026-01-01');

-- Create indexes on each partition
CREATE INDEX ON leads_2024(client_id);
CREATE INDEX ON leads_2024(status, created_at);

CREATE INDEX ON leads_2025(client_id);
CREATE INDEX ON leads_2025(status, created_at);

-- Benefits:
-- - Faster queries (smaller partitions)
-- - Easier archiving (drop old partitions)
-- - Better maintenance (vacuum/analyze per partition)
-- - Improved performance for time-range queries
```

---

## Index Strategies

### Index Types

#### 1. B-Tree Index (Default, Most Common)

```sql
-- Use for: Equality and range queries (<, >, <=, >=, BETWEEN, IN)

-- Single column index
CREATE INDEX idx_leads_status ON leads(status);

-- Query that uses this index
SELECT * FROM leads WHERE status = 'new';  -- ✅ Index used

-- Multi-column (composite) index
CREATE INDEX idx_leads_status_created ON leads(status, created_at DESC);

-- Query that uses this index
SELECT * FROM leads
WHERE status = 'new'
ORDER BY created_at DESC;  -- ✅ Index used
```

#### 2. Partial Index (Conditional Index)

```sql
-- Use for: Indexing subset of rows (common query filters)

-- Only index active (non-deleted) leads
CREATE INDEX idx_leads_active ON leads(created_at DESC)
WHERE deleted_at IS NULL;

-- Benefits:
-- - Smaller index size (only indexes relevant rows)
-- - Faster updates (fewer index updates)
-- - Better performance for filtered queries

-- Query that uses this index
SELECT * FROM leads
WHERE deleted_at IS NULL
ORDER BY created_at DESC;  -- ✅ Index used

-- Only index high-value leads
CREATE INDEX idx_leads_high_value ON leads(client_id, created_at DESC)
WHERE estimated_value >= 10000;

-- Query that uses this index
SELECT * FROM leads
WHERE estimated_value >= 10000
ORDER BY created_at DESC;  -- ✅ Index used
```

#### 3. GIN Index (Generalized Inverted Index)

```sql
-- Use for: Full-text search, JSONB, arrays

-- Full-text search index
ALTER TABLE leads ADD COLUMN search_vector tsvector;

CREATE INDEX idx_leads_search ON leads USING GIN(search_vector);

-- Update search vector
UPDATE leads
SET search_vector = to_tsvector('english',
    coalesce(notes, '') || ' ' ||
    coalesce(service_type, '')
);

-- Full-text search query
SELECT * FROM leads
WHERE search_vector @@ to_tsquery('english', 'kitchen & remodel');

-- JSONB index
CREATE INDEX idx_leads_metadata ON leads USING GIN(metadata);

-- Query JSONB field
SELECT * FROM leads
WHERE metadata @> '{"source": "website"}';
```

#### 4. GiST Index (Generalized Search Tree)

```sql
-- Use for: Geometric data, range types, full-text search

-- For location-based queries (if storing lat/lng)
CREATE EXTENSION IF NOT EXISTS postgis;

ALTER TABLE clients ADD COLUMN location GEOGRAPHY(POINT);

CREATE INDEX idx_clients_location ON clients USING GIST(location);

-- Find clients within 10 miles of location
SELECT * FROM clients
WHERE ST_DWithin(
    location,
    ST_MakePoint(-89.094, 42.271)::geography,  -- Rockford, IL
    16093.4  -- 10 miles in meters
);
```

### Index Design Guidelines

#### 1. Index Selection Strategy

```sql
-- Analyze query patterns first
-- Check pg_stat_statements for most frequent queries

-- Enable pg_stat_statements
CREATE EXTENSION IF NOT EXISTS pg_stat_statements;

-- View most expensive queries
SELECT
    query,
    calls,
    total_exec_time,
    mean_exec_time,
    stddev_exec_time
FROM pg_stat_statements
ORDER BY mean_exec_time DESC
LIMIT 20;

-- Create indexes for slow, frequent queries
```

#### 2. Composite Index Column Order

```sql
-- ❌ Bad: Wrong order (less selective column first)
CREATE INDEX idx_leads_bad ON leads(status, email);

-- ✅ Good: Right order (more selective column first)
CREATE INDEX idx_leads_good ON leads(email, status);

-- Rule: Put most selective columns first
-- Selectivity: email (unique) > status (few values)

-- ❌ Bad: Index not useful for common query
CREATE INDEX idx_leads_wrong_order ON leads(created_at, status);

-- Query only filters by status (index not used)
SELECT * FROM leads WHERE status = 'new';  -- ❌ Index not used

-- ✅ Good: Index useful for common query
CREATE INDEX idx_leads_right_order ON leads(status, created_at DESC);

-- Query filters by status (index used)
SELECT * FROM leads WHERE status = 'new';  -- ✅ Index used

-- Query filters by status and sorts by created_at (index fully used)
SELECT * FROM leads
WHERE status = 'new'
ORDER BY created_at DESC;  -- ✅ Index fully used
```

#### 3. Index Maintenance

```sql
-- Monitor index usage
SELECT
    schemaname,
    tablename,
    indexname,
    idx_scan,          -- Number of index scans
    idx_tup_read,      -- Rows read from index
    idx_tup_fetch      -- Rows fetched using index
FROM pg_stat_user_indexes
WHERE schemaname = 'public'
ORDER BY idx_scan ASC;  -- Find unused indexes

-- Remove unused indexes
-- If idx_scan is 0 or very low, consider dropping
DROP INDEX IF EXISTS idx_unused_index;

-- Monitor index bloat
SELECT
    schemaname,
    tablename,
    indexname,
    pg_size_pretty(pg_relation_size(indexrelid)) AS index_size,
    idx_scan,
    idx_tup_read,
    idx_tup_fetch,
    idx_tup_read::float / NULLIF(idx_scan, 0) AS rows_per_scan
FROM pg_stat_user_indexes
WHERE schemaname = 'public'
ORDER BY pg_relation_size(indexrelid) DESC;

-- Reindex to reduce bloat
REINDEX INDEX CONCURRENTLY idx_leads_status;  -- Non-blocking
-- Or rebuild all indexes for a table
REINDEX TABLE CONCURRENTLY leads;
```

### Recommended Indexes for CD Construction Schema

```sql
-- ====================================
-- Leads Table Indexes
-- ====================================

-- Primary key (automatic)
-- leads_pkey on lead_id

-- Most common query: List leads by status, sorted by date
CREATE INDEX idx_leads_status_created
ON leads(status, created_at DESC)
WHERE deleted_at IS NULL;

-- Search leads by email
CREATE INDEX idx_leads_email
ON leads(email)
WHERE deleted_at IS NULL;

-- Search leads by client
CREATE INDEX idx_leads_client
ON leads(client_id, created_at DESC)
WHERE deleted_at IS NULL;

-- Search high-value leads
CREATE INDEX idx_leads_high_value
ON leads(estimated_value DESC, created_at DESC)
WHERE deleted_at IS NULL AND estimated_value >= 10000;

-- Full-text search on notes/service
CREATE INDEX idx_leads_search
ON leads USING GIN(to_tsvector('english',
    coalesce(notes, '') || ' ' || coalesce(service_type, '')
));

-- ====================================
-- Clients Table Indexes
-- ====================================

-- Primary key (automatic)
-- clients_pkey on client_id

-- Unique email constraint (automatic index)
-- clients_email_key on email

-- Search by phone
CREATE INDEX idx_clients_phone
ON clients(phone)
WHERE deleted_at IS NULL;

-- Search by last name (for quick lookup)
CREATE INDEX idx_clients_last_name
ON clients(last_name, first_name)
WHERE deleted_at IS NULL;

-- ====================================
-- Invoices Table Indexes
-- ====================================

-- Primary key (automatic)
-- invoices_pkey on invoice_id

-- Most common query: List invoices for client
CREATE INDEX idx_invoices_client_status
ON invoices(client_id, status, created_at DESC)
WHERE deleted_at IS NULL;

-- Search by Invoice Ninja ID (for webhook processing)
CREATE INDEX idx_invoices_ninja_id
ON invoices(invoiceninja_invoice_id)
WHERE deleted_at IS NULL;

-- Search overdue invoices
CREATE INDEX idx_invoices_overdue
ON invoices(due_date, client_id)
WHERE deleted_at IS NULL AND status IN ('sent', 'partial');

-- ====================================
-- Payments Table Indexes
-- ====================================

-- Primary key (automatic)
-- payments_pkey on payment_id

-- Most common query: List payments for invoice
CREATE INDEX idx_payments_invoice
ON payments(invoice_id, created_at DESC);

-- Search by Stripe payment intent
CREATE INDEX idx_payments_stripe
ON payments(stripe_payment_intent_id)
WHERE stripe_payment_intent_id IS NOT NULL;

-- Search by client (for payment history)
CREATE INDEX idx_payments_client
ON payments(client_id, created_at DESC);

-- ====================================
-- Dead Letter Queue (DLQ) Indexes
-- ====================================

-- Primary key (automatic)
-- dead_letter_queue_pkey on id

-- Process pending events
CREATE INDEX idx_dlq_status_created
ON dead_letter_queue(status, created_at)
WHERE status = 'pending';

-- Search by event type
CREATE INDEX idx_dlq_event_type
ON dead_letter_queue(event_type, status, created_at DESC);
```

---

## Query Optimization

### Query Analysis Tools

#### 1. EXPLAIN ANALYZE

```sql
-- Analyze query execution plan
EXPLAIN ANALYZE
SELECT l.*, c.first_name, c.last_name
FROM leads l
JOIN clients c ON l.client_id = c.client_id
WHERE l.status = 'new'
  AND l.deleted_at IS NULL
ORDER BY l.created_at DESC
LIMIT 50;

-- Example output:
-- Limit  (cost=0.42..123.45 rows=50 width=234) (actual time=0.123..1.234 rows=50 loops=1)
--   ->  Nested Loop  (cost=0.42..12345.67 rows=5000 width=234) (actual time=0.121..1.221 rows=50 loops=1)
--         ->  Index Scan using idx_leads_status_created on leads l  (cost=0.29..5678.90 rows=5000 width=123) (actual time=0.045..0.567 rows=50 loops=1)
--               Index Cond: (status = 'new')
--               Filter: (deleted_at IS NULL)
--         ->  Index Scan using clients_pkey on clients c  (cost=0.13..1.34 rows=1 width=111) (actual time=0.012..0.012 rows=1 loops=50)
--               Index Cond: (client_id = l.client_id)
-- Planning Time: 0.234 ms
-- Execution Time: 1.456 ms

-- Key metrics:
-- - cost: Estimated cost (relative units)
-- - rows: Estimated rows
-- - width: Average row size in bytes
-- - actual time: Real execution time in milliseconds
-- - rows (actual): Actual rows returned
-- - loops: Number of times node executed
```

#### 2. Reading EXPLAIN Output

```sql
-- ✅ Good: Index Scan (fast)
-- Index Scan using idx_leads_status on leads
-- Uses index to find rows

-- ✅ Good: Index Only Scan (fastest)
-- Index Only Scan using idx_leads_status_created on leads
-- All data retrieved from index (no table lookup needed)

-- ⚠️ Warning: Seq Scan (slow for large tables)
-- Seq Scan on leads
-- Full table scan (no index used)
-- Acceptable for small tables (< 1000 rows)
-- Bad for large tables

-- ⚠️ Warning: Nested Loop (can be slow)
-- Nested Loop
-- Joins rows one by one
-- Slow when joining large tables
-- Fast when joining small result sets

-- ✅ Good: Hash Join (fast for large tables)
-- Hash Join
-- Builds hash table, then joins
-- Efficient for large tables

-- ⚠️ Warning: Sort (memory intensive)
-- Sort
-- Sorts results in memory or on disk
-- Can be slow for large result sets
-- Consider adding index with ORDER BY column
```

### Query Optimization Techniques

#### 1. Select Only Needed Columns

```sql
-- ❌ Bad: Select all columns
SELECT * FROM leads WHERE status = 'new';
-- Returns all columns, even if you only need a few
-- Wastes bandwidth and memory

-- ✅ Good: Select specific columns
SELECT lead_id, client_id, service_type, created_at
FROM leads
WHERE status = 'new';
-- Returns only needed columns
-- Faster, uses less memory, less bandwidth
```

#### 2. Use LIMIT for Large Result Sets

```sql
-- ❌ Bad: No limit (could return millions of rows)
SELECT * FROM leads ORDER BY created_at DESC;

-- ✅ Good: Limit results
SELECT * FROM leads
ORDER BY created_at DESC
LIMIT 100;

-- ✅ Better: Pagination
SELECT * FROM leads
ORDER BY created_at DESC
LIMIT 100 OFFSET 0;  -- Page 1

SELECT * FROM leads
ORDER BY created_at DESC
LIMIT 100 OFFSET 100;  -- Page 2
```

#### 3. Avoid Function Calls on Indexed Columns

```sql
-- ❌ Bad: Function on indexed column (index not used)
SELECT * FROM clients
WHERE LOWER(email) = 'john@example.com';
-- Index on email not used because of LOWER()

-- ✅ Good: No function (index used)
SELECT * FROM clients
WHERE email = 'john@example.com';
-- Index on email used

-- ✅ Alternative: Functional index
CREATE INDEX idx_clients_email_lower ON clients(LOWER(email));

-- Now this query uses the index
SELECT * FROM clients
WHERE LOWER(email) = 'john@example.com';
```

#### 4. Use EXISTS Instead of COUNT

```sql
-- ❌ Bad: COUNT for existence check (scans all matching rows)
SELECT COUNT(*) FROM leads WHERE client_id = '123';
-- If count > 0, client has leads
-- Scans all matching rows (slow)

-- ✅ Good: EXISTS (stops after first match)
SELECT EXISTS(
    SELECT 1 FROM leads WHERE client_id = '123' LIMIT 1
);
-- Returns true/false immediately after finding first match
-- Much faster for large result sets
```

#### 5. Avoid OR Conditions (Use UNION)

```sql
-- ❌ Bad: OR condition (indexes not used efficiently)
SELECT * FROM leads
WHERE status = 'new' OR status = 'in_progress';
-- May not use index efficiently

-- ✅ Good: IN clause (better than OR)
SELECT * FROM leads
WHERE status IN ('new', 'in_progress');
-- Can use index more efficiently

-- ✅ Better: UNION (for complex conditions)
SELECT * FROM leads WHERE status = 'new'
UNION ALL
SELECT * FROM leads WHERE status = 'in_progress';
-- Executes two separate optimized queries
-- Faster for large tables with indexes
```

#### 6. Use JOINs Instead of Subqueries

```sql
-- ❌ Bad: Correlated subquery (slow)
SELECT
    c.*,
    (SELECT COUNT(*) FROM leads WHERE client_id = c.client_id) AS lead_count
FROM clients c;
-- Subquery executed for each client (N queries)

-- ✅ Good: JOIN with GROUP BY (fast)
SELECT
    c.*,
    COUNT(l.lead_id) AS lead_count
FROM clients c
LEFT JOIN leads l ON c.client_id = l.client_id
GROUP BY c.client_id;
-- Single query with join (1 query)
```

#### 7. Avoid SELECT DISTINCT (Use GROUP BY)

```sql
-- ❌ Bad: DISTINCT (requires sorting entire result set)
SELECT DISTINCT client_id FROM leads;
-- Sorts all rows to find unique values

-- ✅ Good: GROUP BY (can use index)
SELECT client_id FROM leads GROUP BY client_id;
-- Can use index, no full sort needed
```

#### 8. Use Window Functions for Rankings

```sql
-- ❌ Bad: Subquery for ranking (slow)
SELECT
    l.*,
    (SELECT COUNT(*)
     FROM leads l2
     WHERE l2.created_at >= l.created_at) AS rank
FROM leads l
ORDER BY created_at DESC;
-- Correlated subquery executed for each row

-- ✅ Good: Window function (fast)
SELECT
    l.*,
    ROW_NUMBER() OVER (ORDER BY created_at DESC) AS rank
FROM leads l;
-- Single pass through data, highly optimized
```

---

## Connection Pooling

### PgBouncer Configuration

```bash
# Supabase provides built-in connection pooling
# Use pooled connection string for application queries

# Connection string formats:
# Direct connection (port 5432): For migrations, admin tasks
DATABASE_URL=postgresql://postgres:PASSWORD@db.PROJECT.supabase.co:5432/postgres

# Pooled connection (port 6543): For application queries
DATABASE_URL=postgresql://postgres:PASSWORD@db.PROJECT.supabase.co:6543/postgres?pgbouncer=true

# Benefits of connection pooling:
# - Reduced connection overhead (connection reuse)
# - Supports more concurrent connections
# - Better performance under load
# - Automatic connection management
```

### Connection Pooling Best Practices

```typescript
// ❌ Bad: Creating new connection for each query
async function getLeads() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
  });
  await client.connect();  // New connection for each request
  const result = await client.query('SELECT * FROM leads');
  await client.end();
  return result.rows;
}

// ✅ Good: Using Supabase client with connection pooling
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function getLeads() {
  const { data, error } = await supabase
    .from('leads')
    .select('*');
  return data;
}

// ✅ Alternative: Using pg with pool
import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL + '?pgbouncer=true',
  max: 20,  // Maximum number of clients in pool
  idleTimeoutMillis: 30000,  // Close idle clients after 30 seconds
  connectionTimeoutMillis: 2000,  // Timeout if no connection available
});

async function getLeads() {
  const client = await pool.connect();  // Reuses existing connection
  try {
    const result = await client.query('SELECT * FROM leads');
    return result.rows;
  } finally {
    client.release();  // Return connection to pool
  }
}
```

### Connection Pool Sizing

```typescript
// Calculate optimal pool size
// Formula: connections = (core_count * 2) + effective_spindle_count

// Example for 4 vCPU VPS:
// connections = (4 * 2) + 1 = 9

// Supabase Free tier: 60 concurrent connections
// Supabase Pro tier: 200 concurrent connections

// Pool configuration
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 20,  // Maximum pool size (adjust based on traffic)
  min: 2,   // Minimum pool size (keep-alive connections)
  idleTimeoutMillis: 30000,  // 30 seconds
  connectionTimeoutMillis: 2000,  // 2 seconds
});

// Monitor pool health
pool.on('error', (err, client) => {
  console.error('Unexpected error on idle client', err);
});

pool.on('connect', (client) => {
  console.log('New client connected to pool');
});

pool.on('remove', (client) => {
  console.log('Client removed from pool');
});
```

---

## Query Performance Analysis

### Monitoring Slow Queries

```sql
-- Enable query logging (Supabase dashboard)
-- Settings → Database → Query Performance

-- View slow queries
SELECT
    query,
    calls,
    total_exec_time,
    mean_exec_time,
    stddev_exec_time,
    rows
FROM pg_stat_statements
WHERE mean_exec_time > 100  -- Queries taking > 100ms
ORDER BY mean_exec_time DESC
LIMIT 20;

-- Find queries causing most load
SELECT
    query,
    calls,
    total_exec_time,
    mean_exec_time,
    (total_exec_time / sum(total_exec_time) OVER ()) * 100 AS percentage
FROM pg_stat_statements
ORDER BY total_exec_time DESC
LIMIT 20;
```

### Query Optimization Workflow

```sql
-- 1. Identify slow query
SELECT query, mean_exec_time
FROM pg_stat_statements
WHERE query LIKE '%leads%'
ORDER BY mean_exec_time DESC
LIMIT 1;

-- 2. Analyze with EXPLAIN ANALYZE
EXPLAIN ANALYZE
SELECT l.*, c.first_name, c.last_name
FROM leads l
JOIN clients c ON l.client_id = c.client_id
WHERE l.status = 'new'
ORDER BY l.created_at DESC
LIMIT 50;

-- 3. Check if indexes exist
SELECT
    tablename,
    indexname,
    indexdef
FROM pg_indexes
WHERE tablename = 'leads';

-- 4. Create missing index
CREATE INDEX CONCURRENTLY idx_leads_status_created
ON leads(status, created_at DESC)
WHERE deleted_at IS NULL;

-- 5. Re-analyze query
EXPLAIN ANALYZE
SELECT l.*, c.first_name, c.last_name
FROM leads l
JOIN clients c ON l.client_id = c.client_id
WHERE l.status = 'new'
ORDER BY l.created_at DESC
LIMIT 50;

-- 6. Compare before/after performance
-- Before: Execution Time: 234.567 ms
-- After: Execution Time: 12.345 ms
-- Improvement: 19x faster
```

---

## N+1 Query Prevention

### The N+1 Problem

```typescript
// ❌ Bad: N+1 query problem
// 1 query to fetch leads, then N queries to fetch clients (one per lead)
async function getLeadsWithClients() {
  // Query 1: Fetch leads
  const { data: leads } = await supabase
    .from('leads')
    .select('*')
    .limit(100);

  // Queries 2-101: Fetch client for each lead (N queries)
  for (const lead of leads) {
    const { data: client } = await supabase
      .from('clients')
      .select('*')
      .eq('client_id', lead.client_id)
      .single();

    lead.client = client;
  }

  return leads;
}
// Total queries: 101 (1 + 100)
// Time: ~1000ms (10ms per query)

// ✅ Good: Single query with join
async function getLeadsWithClients() {
  const { data: leads } = await supabase
    .from('leads')
    .select(`
      *,
      client:clients (
        client_id,
        first_name,
        last_name,
        email
      )
    `)
    .limit(100);

  return leads;
}
// Total queries: 1
// Time: ~50ms
// 20x faster!
```

### Prevention Strategies

#### 1. Use Supabase Joins

```typescript
// Fetch leads with client and invoices
const { data: leads } = await supabase
  .from('leads')
  .select(`
    *,
    client:clients (
      client_id,
      first_name,
      last_name,
      email,
      phone
    ),
    invoices (
      invoice_id,
      amount,
      status,
      due_date
    )
  `)
  .eq('status', 'new')
  .order('created_at', { ascending: false })
  .limit(50);

// Single query, all data fetched at once
```

#### 2. Use DataLoader (for complex APIs)

```typescript
// Install DataLoader
// npm install dataloader

import DataLoader from 'dataloader';

// Create batch loading function
async function batchLoadClients(clientIds: string[]) {
  const { data: clients } = await supabase
    .from('clients')
    .select('*')
    .in('client_id', clientIds);

  // Return clients in same order as requested
  return clientIds.map(id =>
    clients?.find(client => client.client_id === id)
  );
}

// Create DataLoader instance
const clientLoader = new DataLoader(batchLoadClients);

// Usage (automatically batches requests)
async function getLeadsWithClients() {
  const { data: leads } = await supabase
    .from('leads')
    .select('*')
    .limit(100);

  // These calls are automatically batched into single query
  const leadsWithClients = await Promise.all(
    leads.map(async (lead) => ({
      ...lead,
      client: await clientLoader.load(lead.client_id),
    }))
  );

  return leadsWithClients;
}

// DataLoader batches all clientLoader.load() calls
// Result: 2 queries instead of 101
```

#### 3. Use Database Views

```sql
-- Create view combining leads and clients
CREATE VIEW leads_with_clients AS
SELECT
    l.*,
    c.first_name AS client_first_name,
    c.last_name AS client_last_name,
    c.email AS client_email,
    c.phone AS client_phone
FROM leads l
LEFT JOIN clients c ON l.client_id = c.client_id
WHERE l.deleted_at IS NULL;

-- Query view (single query, no N+1)
SELECT * FROM leads_with_clients
WHERE status = 'new'
ORDER BY created_at DESC
LIMIT 50;
```

---

## Caching Strategies

### Application-Level Caching

```typescript
// lib/cache.ts
import Redis from 'ioredis';

const redis = new Redis(process.env.REDIS_URL);

// Cache GET function
export async function cacheGet<T>(key: string): Promise<T | null> {
  try {
    const cached = await redis.get(key);
    return cached ? JSON.parse(cached) : null;
  } catch (error) {
    console.error('Cache GET error:', error);
    return null;
  }
}

// Cache SET function
export async function cacheSet(
  key: string,
  value: any,
  ttl: number = 300  // 5 minutes default
): Promise<void> {
  try {
    await redis.setex(key, ttl, JSON.stringify(value));
  } catch (error) {
    console.error('Cache SET error:', error);
  }
}

// Cache DELETE function
export async function cacheDel(key: string): Promise<void> {
  try {
    await redis.del(key);
  } catch (error) {
    console.error('Cache DEL error:', error);
  }
}

// Usage in API route
import { cacheGet, cacheSet } from '@/lib/cache';

export async function GET(request: NextRequest) {
  const cacheKey = 'leads:recent:50';

  // Check cache first
  const cached = await cacheGet(cacheKey);
  if (cached) {
    return NextResponse.json(cached);
  }

  // Cache miss - fetch from database
  const { data: leads } = await supabase
    .from('leads')
    .select('*, client:clients(*)')
    .order('created_at', { ascending: false })
    .limit(50);

  // Store in cache (5 minutes)
  await cacheSet(cacheKey, leads, 300);

  return NextResponse.json(leads);
}
```

### Database Query Result Caching

```sql
-- Create materialized view (pre-computed, cached results)
CREATE MATERIALIZED VIEW dashboard_stats AS
SELECT
    COUNT(*) FILTER (WHERE status = 'new') AS new_leads,
    COUNT(*) FILTER (WHERE status = 'in_progress') AS in_progress_leads,
    COUNT(*) FILTER (WHERE status = 'converted') AS converted_leads,
    COUNT(*) FILTER (WHERE status = 'lost') AS lost_leads,
    AVG(estimated_value) FILTER (WHERE status = 'converted') AS avg_project_value,
    COUNT(*) FILTER (WHERE created_at >= NOW() - INTERVAL '30 days') AS leads_this_month
FROM leads
WHERE deleted_at IS NULL;

-- Create index on materialized view
CREATE INDEX ON dashboard_stats(new_leads);

-- Query materialized view (instant results)
SELECT * FROM dashboard_stats;

-- Refresh materialized view (run hourly via cron)
REFRESH MATERIALIZED VIEW CONCURRENTLY dashboard_stats;

-- Schedule refresh
-- Add to crontab or use pg_cron extension
CREATE EXTENSION IF NOT EXISTS pg_cron;

SELECT cron.schedule(
    'refresh-dashboard-stats',  -- Job name
    '0 * * * *',                -- Every hour
    $$REFRESH MATERIALIZED VIEW CONCURRENTLY dashboard_stats$$
);
```

### Cache Invalidation

```typescript
// Invalidate cache when data changes
import { cacheDel } from '@/lib/cache';

export async function POST(request: NextRequest) {
  const body = await request.json();

  // Create new lead
  const { data: lead, error } = await supabase
    .from('leads')
    .insert(body)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error }, { status: 500 });
  }

  // Invalidate cached lead lists
  await cacheDel('leads:recent:50');
  await cacheDel(`leads:client:${lead.client_id}`);
  await cacheDel('dashboard:stats');

  return NextResponse.json(lead);
}

// Pattern-based cache invalidation
async function invalidateLeadCache(leadId: string) {
  // Invalidate all cache keys starting with "leads:"
  const keys = await redis.keys('leads:*');
  if (keys.length > 0) {
    await redis.del(...keys);
  }
}
```

---

## Database Maintenance

### Routine Maintenance Tasks

```sql
-- ====================================
-- Weekly Maintenance
-- ====================================

-- 1. VACUUM (reclaim space and update statistics)
-- Runs automatically, but manual VACUUM can help

-- Analyze table statistics
VACUUM ANALYZE leads;
VACUUM ANALYZE clients;
VACUUM ANALYZE invoices;
VACUUM ANALYZE payments;

-- Check table bloat
SELECT
    schemaname,
    tablename,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS total_size,
    n_live_tup,
    n_dead_tup,
    round(n_dead_tup * 100.0 / NULLIF(n_live_tup + n_dead_tup, 0), 2) AS dead_ratio
FROM pg_stat_user_tables
WHERE schemaname = 'public'
ORDER BY n_dead_tup DESC;

-- If dead_ratio > 20%, run VACUUM FULL (locks table!)
-- VACUUM FULL leads;  -- Use carefully in production

-- 2. REINDEX (rebuild indexes to reduce bloat)
-- Run CONCURRENTLY to avoid locking
REINDEX INDEX CONCURRENTLY idx_leads_status_created;
REINDEX INDEX CONCURRENTLY idx_clients_email;

-- Or reindex entire table
REINDEX TABLE CONCURRENTLY leads;

-- 3. Update table statistics
ANALYZE leads;
ANALYZE clients;
ANALYZE invoices;

-- ====================================
-- Monthly Maintenance
-- ====================================

-- 1. Review and optimize slow queries
SELECT
    query,
    calls,
    mean_exec_time,
    total_exec_time
FROM pg_stat_statements
WHERE mean_exec_time > 100
ORDER BY mean_exec_time DESC
LIMIT 20;

-- 2. Archive old data
-- Move leads older than 2 years to archive table
INSERT INTO leads_archive
SELECT * FROM leads
WHERE created_at < NOW() - INTERVAL '2 years'
  AND deleted_at IS NOT NULL;

DELETE FROM leads
WHERE lead_id IN (SELECT lead_id FROM leads_archive);

-- 3. Check database size
SELECT
    pg_database.datname,
    pg_size_pretty(pg_database_size(pg_database.datname)) AS size
FROM pg_database
WHERE datname = current_database();

-- 4. Check table sizes
SELECT
    schemaname,
    tablename,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS total_size,
    pg_size_pretty(pg_relation_size(schemaname||'.'||tablename)) AS table_size,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename) -
                   pg_relation_size(schemaname||'.'||tablename)) AS index_size
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;
```

### Automated Maintenance Script

```bash
#!/bin/bash
# /opt/cdhi-stack/scripts/db-maintenance.sh

echo "🔧 Database Maintenance Script"
echo "================================"

DB_URL=${DATABASE_URL}

# 1. VACUUM ANALYZE
echo "Running VACUUM ANALYZE..."
psql $DB_URL -c "VACUUM ANALYZE leads;"
psql $DB_URL -c "VACUUM ANALYZE clients;"
psql $DB_URL -c "VACUUM ANALYZE invoices;"
psql $DB_URL -c "VACUUM ANALYZE payments;"

# 2. Check table bloat
echo "Checking table bloat..."
psql $DB_URL -c "
SELECT
    tablename,
    pg_size_pretty(pg_total_relation_size('public.'||tablename)) AS total_size,
    n_live_tup,
    n_dead_tup,
    round(n_dead_tup * 100.0 / NULLIF(n_live_tup + n_dead_tup, 0), 2) AS dead_ratio
FROM pg_stat_user_tables
WHERE schemaname = 'public'
  AND n_dead_tup > 1000
ORDER BY dead_ratio DESC;
"

# 3. REINDEX if needed
echo "Checking index bloat..."
psql $DB_URL -c "
SELECT
    schemaname,
    tablename,
    indexname,
    pg_size_pretty(pg_relation_size(indexrelid)) AS index_size,
    idx_scan,
    idx_tup_read
FROM pg_stat_user_indexes
WHERE schemaname = 'public'
  AND idx_scan < 100
ORDER BY pg_relation_size(indexrelid) DESC;
"

# 4. Archive old data
echo "Archiving old deleted leads..."
psql $DB_URL -c "
DELETE FROM leads
WHERE deleted_at < NOW() - INTERVAL '2 years';
"

echo "Maintenance complete!"
```

Schedule with cron:
```bash
# Run weekly on Sunday at 2 AM
0 2 * * 0 /opt/cdhi-stack/scripts/db-maintenance.sh >> /var/log/db-maintenance.log 2>&1
```

---

## Monitoring and Alerts

### Database Performance Monitoring

```typescript
// lib/db-monitor.ts
import { createClient } from '@supabase/supabase-js';

export async function checkDatabaseHealth() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  // Check database size
  const { data: dbSize } = await supabase.rpc('get_database_size');

  // Check connection count
  const { data: connections } = await supabase.rpc('get_connection_count');

  // Check slow queries
  const { data: slowQueries } = await supabase.rpc('get_slow_queries');

  // Check table sizes
  const { data: tableSizes } = await supabase.rpc('get_table_sizes');

  return {
    database_size: dbSize,
    connections: connections,
    slow_queries: slowQueries,
    table_sizes: tableSizes,
  };
}

// Create RPC functions in Supabase

-- Function: Get database size
CREATE OR REPLACE FUNCTION get_database_size()
RETURNS TABLE (size_bytes BIGINT, size_pretty TEXT) AS $$
BEGIN
  RETURN QUERY
  SELECT
    pg_database_size(current_database())::BIGINT AS size_bytes,
    pg_size_pretty(pg_database_size(current_database())) AS size_pretty;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: Get connection count
CREATE OR REPLACE FUNCTION get_connection_count()
RETURNS TABLE (total_connections BIGINT, active_connections BIGINT) AS $$
BEGIN
  RETURN QUERY
  SELECT
    COUNT(*)::BIGINT AS total_connections,
    COUNT(*) FILTER (WHERE state = 'active')::BIGINT AS active_connections
  FROM pg_stat_activity
  WHERE datname = current_database();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: Get slow queries (> 100ms)
CREATE OR REPLACE FUNCTION get_slow_queries()
RETURNS TABLE (
  query TEXT,
  mean_exec_time NUMERIC,
  calls BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    pss.query::TEXT,
    pss.mean_exec_time::NUMERIC,
    pss.calls::BIGINT
  FROM pg_stat_statements pss
  WHERE pss.mean_exec_time > 100
  ORDER BY pss.mean_exec_time DESC
  LIMIT 10;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: Get table sizes
CREATE OR REPLACE FUNCTION get_table_sizes()
RETURNS TABLE (
  table_name TEXT,
  total_size_bytes BIGINT,
  total_size_pretty TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    tablename::TEXT,
    pg_total_relation_size('public.'||tablename)::BIGINT AS total_size_bytes,
    pg_size_pretty(pg_total_relation_size('public.'||tablename)) AS total_size_pretty
  FROM pg_tables
  WHERE schemaname = 'public'
  ORDER BY pg_total_relation_size('public.'||tablename) DESC
  LIMIT 10;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

### Automated Alerts

```typescript
// api/cron/db-health-check/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { checkDatabaseHealth } from '@/lib/db-monitor';
import { sendEmail } from '@/lib/email';

export async function GET(request: NextRequest) {
  // Verify cron secret
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const health = await checkDatabaseHealth();

  // Alert if database size exceeds 80% of limit (400MB for free tier)
  if (health.database_size.size_bytes > 400 * 1024 * 1024 * 0.8) {
    await sendEmail({
      to: 'admin@cdhomeimprovementsrockford.com',
      subject: '⚠️ Database Size Alert',
      body: `Database size: ${health.database_size.size_pretty} (80% of limit)`,
    });
  }

  // Alert if slow queries detected
  if (health.slow_queries.length > 0) {
    await sendEmail({
      to: 'admin@cdhomeimprovementsrockford.com',
      subject: '🐌 Slow Queries Detected',
      body: `Detected ${health.slow_queries.length} slow queries (>100ms)`,
    });
  }

  // Alert if too many connections
  if (health.connections.active_connections > 50) {
    await sendEmail({
      to: 'admin@cdhomeimprovementsrockford.com',
      subject: '🔌 High Connection Count',
      body: `Active connections: ${health.connections.active_connections}`,
    });
  }

  return NextResponse.json({ status: 'ok', health });
}

// Schedule with Vercel Cron
// vercel.json
{
  "crons": [
    {
      "path": "/api/cron/db-health-check",
      "schedule": "0 * * * *"  // Every hour
    }
  ]
}
```

---

## Backup Optimization

### Optimized Backup Strategy

```bash
# See DISASTER-RECOVERY.md for complete backup procedures

# Key optimizations:

# 1. Incremental backups (daily)
mysqldump --single-transaction \
  --flush-logs \
  --master-data=2 \
  --incremental \
  --all-databases > backup_incremental.sql

# 2. Compressed backups
gzip -9 backup.sql  # Maximum compression

# 3. Parallel backups (faster for large databases)
pg_dump -j 4 \  # 4 parallel jobs
  --format=directory \
  --file=/backup/db \
  postgres

# 4. Offsite backups (S3 with lifecycle)
aws s3 cp backup.sql.gz s3://cdhi-backups/ \
  --storage-class STANDARD_IA

# See COST-OPTIMIZATION.md for S3 lifecycle policies
```

---

## Common Performance Issues

### Issue 1: Slow Dashboard Load

**Symptom**: Dashboard takes > 2 seconds to load

**Diagnosis**:
```sql
EXPLAIN ANALYZE
SELECT
    COUNT(*) FILTER (WHERE status = 'new') AS new_leads,
    COUNT(*) FILTER (WHERE status = 'in_progress') AS in_progress_leads,
    COUNT(*) FILTER (WHERE status = 'converted') AS converted_leads
FROM leads
WHERE deleted_at IS NULL;
```

**Solution**: Create materialized view
```sql
CREATE MATERIALIZED VIEW dashboard_stats AS
SELECT
    COUNT(*) FILTER (WHERE status = 'new') AS new_leads,
    COUNT(*) FILTER (WHERE status = 'in_progress') AS in_progress_leads,
    COUNT(*) FILTER (WHERE status = 'converted') AS converted_leads
FROM leads
WHERE deleted_at IS NULL;

-- Refresh hourly
REFRESH MATERIALIZED VIEW CONCURRENTLY dashboard_stats;
```

### Issue 2: High Memory Usage

**Symptom**: Database using > 80% memory

**Diagnosis**:
```sql
-- Check memory-hungry queries
SELECT
    query,
    calls,
    total_exec_time,
    mean_exec_time,
    shared_blks_hit,
    shared_blks_read
FROM pg_stat_statements
ORDER BY shared_blks_read DESC
LIMIT 10;
```

**Solution**: Add indexes, reduce result set size
```sql
-- Add missing indexes
CREATE INDEX idx_leads_status ON leads(status) WHERE deleted_at IS NULL;

-- Use LIMIT on large queries
SELECT * FROM leads ORDER BY created_at DESC LIMIT 100;
```

### Issue 3: Connection Pool Exhaustion

**Symptom**: "remaining connection slots reserved" errors

**Diagnosis**:
```sql
-- Check active connections
SELECT
    COUNT(*) AS total_connections,
    COUNT(*) FILTER (WHERE state = 'active') AS active_connections,
    COUNT(*) FILTER (WHERE state = 'idle') AS idle_connections
FROM pg_stat_activity
WHERE datname = current_database();
```

**Solution**: Use connection pooling, close connections
```typescript
// Use pooled connection string
DATABASE_URL=postgresql://postgres:PASSWORD@db.PROJECT.supabase.co:6543/postgres?pgbouncer=true

// Always release connections
const client = await pool.connect();
try {
  // Query here
} finally {
  client.release();  // ⚠️ CRITICAL: Always release!
}
```

---

## Summary Checklist

### Database Optimization Checklist

**Schema Design:**
- [ ] Use appropriate data types (UUID, TIMESTAMPTZ, INTEGER)
- [ ] Normalize to reduce duplication
- [ ] Use soft deletes for important data
- [ ] Add CHECK constraints for data integrity

**Indexing:**
- [ ] Index all foreign keys
- [ ] Index frequently queried columns
- [ ] Use composite indexes for common query patterns
- [ ] Use partial indexes for filtered queries
- [ ] Monitor and remove unused indexes

**Query Optimization:**
- [ ] Select only needed columns
- [ ] Use LIMIT for large result sets
- [ ] Avoid functions on indexed columns
- [ ] Use EXISTS instead of COUNT for existence checks
- [ ] Use JOINs instead of subqueries
- [ ] Prevent N+1 queries

**Connection Management:**
- [ ] Use connection pooling (port 6543)
- [ ] Close/release connections properly
- [ ] Monitor active connections

**Caching:**
- [ ] Cache expensive queries (Redis)
- [ ] Use materialized views for dashboards
- [ ] Implement cache invalidation

**Maintenance:**
- [ ] Run VACUUM ANALYZE weekly
- [ ] REINDEX bloated indexes monthly
- [ ] Archive old data quarterly
- [ ] Monitor database size

**Monitoring:**
- [ ] Set up slow query alerts
- [ ] Monitor database size
- [ ] Track connection pool usage
- [ ] Alert on high resource usage

---

**Remember**: Measure first, optimize second. Use EXPLAIN ANALYZE to understand query performance before making changes.
