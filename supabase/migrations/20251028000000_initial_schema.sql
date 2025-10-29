-- cdhi_supabase_schema.sql
-- Generated 2025-10-27
-- Default integration target: Invoice Ninja v5 (self-hosted). Crater diffs noted inline.
-- Requires: Supabase/Postgres with pgcrypto extension for gen_random_uuid().

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- === Core Reference Tables ===
CREATE TABLE IF NOT EXISTS clients (
  client_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  first_name text NOT NULL,
  last_name text,
  company text,
  email text NOT NULL,
  phone text,
  sms_opt_in boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS properties (
  property_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid NOT NULL REFERENCES clients(client_id) ON DELETE CASCADE,
  address1 text NOT NULL,
  address2 text,
  city text NOT NULL,
  state text NOT NULL,
  zip text NOT NULL,
  lat numeric(9,6),
  lng numeric(9,6),
  created_at timestamptz DEFAULT now()
);

-- Lead pipeline
DO $$ BEGIN
  CREATE TYPE lead_status AS ENUM ('new','contacted','qualified','quoted','won','lost');
EXCEPTION WHEN duplicate_object THEN null; END $$;

CREATE TABLE IF NOT EXISTS leads (
  lead_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid NOT NULL REFERENCES clients(client_id) ON DELETE CASCADE,
  property_id uuid NOT NULL REFERENCES properties(property_id) ON DELETE CASCADE,
  channel text DEFAULT 'web',
  intake_notes text,
  budget_min numeric(12,2),
  budget_max numeric(12,2),
  status lead_status DEFAULT 'new',
  source text,
  created_at timestamptz DEFAULT now()
);

-- Jobs / Projects
DO $$ BEGIN
  CREATE TYPE job_status AS ENUM ('lead','pending','active','on_hold','complete','closed');
EXCEPTION WHEN duplicate_object THEN null; END $$;

CREATE TABLE IF NOT EXISTS jobs (
  job_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid NOT NULL REFERENCES clients(client_id) ON DELETE CASCADE,
  property_id uuid REFERENCES properties(property_id) ON DELETE SET NULL,
  title text NOT NULL,
  description text,
  status job_status DEFAULT 'lead',
  start_date date,
  end_date date,
  created_at timestamptz DEFAULT now()
);

DO $$ BEGIN
  CREATE TYPE job_phase AS ENUM ('intake','estimate','contract','deposit','construction','inspection','final_invoice','closed');
EXCEPTION WHEN duplicate_object THEN null; END $$;

CREATE TABLE IF NOT EXISTS job_phases (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id uuid NOT NULL REFERENCES jobs(job_id) ON DELETE CASCADE,
  phase job_phase NOT NULL,
  status text DEFAULT 'open',
  started_at timestamptz,
  completed_at timestamptz
);

-- Estimates (quotes)
DO $$ BEGIN
  CREATE TYPE estimate_status AS ENUM ('draft','sent','approved','declined','converted');
EXCEPTION WHEN duplicate_object THEN null; END $$;

CREATE TABLE IF NOT EXISTS estimates (
  estimate_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid NOT NULL REFERENCES clients(client_id) ON DELETE CASCADE,
  job_id uuid REFERENCES jobs(job_id) ON DELETE SET NULL,
  external_id text,           -- map to Invoice Ninja quote id OR Crater estimate id
  external_number text,       -- map to quote number
  status estimate_status DEFAULT 'draft',
  issue_date date DEFAULT current_date,
  valid_until date,
  currency char(3) DEFAULT 'USD',
  terms text,
  notes text,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS estimate_items (
  item_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  estimate_id uuid NOT NULL REFERENCES estimates(estimate_id) ON DELETE CASCADE,
  kind text DEFAULT 'service',
  name text NOT NULL,
  description text,
  quantity numeric(12,2) NOT NULL DEFAULT 1,
  unit_price numeric(12,2) NOT NULL DEFAULT 0,
  discount_percent numeric(5,2) DEFAULT 0,
  tax_percent numeric(5,2) DEFAULT 0,
  sort_order int DEFAULT 0
);

-- Change Orders
DO $$ BEGIN
  CREATE TYPE change_order_status AS ENUM ('draft','sent','approved','declined','billed');
EXCEPTION WHEN duplicate_object THEN null; END $$;

CREATE TABLE IF NOT EXISTS change_orders (
  co_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id uuid NOT NULL REFERENCES jobs(job_id) ON DELETE CASCADE,
  external_id text,           -- invoice/estimate id in invoicing app if CO billed separately
  title text NOT NULL,
  description text,
  status change_order_status DEFAULT 'draft',
  amount numeric(12,2) NOT NULL DEFAULT 0,
  approved_at timestamptz,
  created_at timestamptz DEFAULT now()
);

-- Invoices
DO $$ BEGIN
  CREATE TYPE invoice_status AS ENUM ('draft','sent','viewed','partial','paid','void','uncollectible');
EXCEPTION WHEN duplicate_object THEN null; END $$;

CREATE TABLE IF NOT EXISTS invoices (
  invoice_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid NOT NULL REFERENCES clients(client_id) ON DELETE CASCADE,
  job_id uuid REFERENCES jobs(job_id) ON DELETE SET NULL,
  change_order_id uuid REFERENCES change_orders(co_id) ON DELETE SET NULL,
  external_id text,           -- map to Invoice Ninja invoice id OR Crater invoice id
  external_number text,       -- human-readable number
  status invoice_status DEFAULT 'draft',
  issue_date date NOT NULL DEFAULT current_date,
  due_date date,
  currency char(3) DEFAULT 'USD',
  memo text,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS invoice_items (
  item_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id uuid NOT NULL REFERENCES invoices(invoice_id) ON DELETE CASCADE,
  kind text DEFAULT 'service',
  name text NOT NULL,
  description text,
  quantity numeric(12,2) NOT NULL DEFAULT 1,
  unit_price numeric(12,2) NOT NULL DEFAULT 0,
  discount_percent numeric(5,2) DEFAULT 0,
  tax_percent numeric(5,2) DEFAULT 0,
  sort_order int DEFAULT 0
);

-- Payments
DO $$ BEGIN
  CREATE TYPE payment_status AS ENUM ('unapplied','applied','failed','refunded');
EXCEPTION WHEN duplicate_object THEN null; END $$;

CREATE TABLE IF NOT EXISTS payments (
  payment_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id uuid REFERENCES invoices(invoice_id) ON DELETE SET NULL,
  external_id text,           -- Stripe payment_intent / charge id
  method text,                -- 'card','ach','cash','check'
  amount numeric(12,2) NOT NULL,
  currency char(3) DEFAULT 'USD',
  paid_at timestamptz,
  status payment_status DEFAULT 'applied',
  raw_event jsonb,
  created_at timestamptz DEFAULT now()
);

-- Lightweight comms & assets
CREATE TABLE IF NOT EXISTS communications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid REFERENCES clients(client_id) ON DELETE CASCADE,
  job_id uuid REFERENCES jobs(job_id) ON DELETE CASCADE,
  channel text,               -- 'email','sms','call','note'
  subject text,
  body text,
  sent_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS photos (
  photo_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id uuid NOT NULL REFERENCES jobs(job_id) ON DELETE CASCADE,
  url text NOT NULL,
  caption text,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS tasks (
  task_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id uuid REFERENCES jobs(job_id) ON DELETE CASCADE,
  title text NOT NULL,
  status text DEFAULT 'open',
  due_date date,
  created_at timestamptz DEFAULT now()
);

-- === Views ===
-- Invoice financial summary
CREATE OR REPLACE VIEW v_invoice_summary AS
SELECT
  i.invoice_id,
  i.client_id,
  COALESCE(SUM(ii.quantity*ii.unit_price * (1 - ii.discount_percent/100.0) * (1 + ii.tax_percent/100.0)), 0)::numeric(12,2) AS line_total,
  COALESCE((SELECT SUM(p.amount) FROM payments p WHERE p.invoice_id = i.invoice_id AND p.status IN ('applied')), 0)::numeric(12,2) AS paid_total,
  (COALESCE(SUM(ii.quantity*ii.unit_price * (1 - ii.discount_percent/100.0) * (1 + ii.tax_percent/100.0)), 0)
   - COALESCE((SELECT SUM(p.amount) FROM payments p WHERE p.invoice_id = i.invoice_id AND p.status IN ('applied')), 0))::numeric(12,2) AS balance_due
FROM invoices i
LEFT JOIN invoice_items ii ON ii.invoice_id = i.invoice_id
GROUP BY i.invoice_id;

-- Client A/R view
CREATE OR REPLACE VIEW v_client_ar AS
SELECT
  c.client_id,
  c.first_name,
  c.last_name,
  COALESCE(SUM(v.balance_due),0)::numeric(12,2) AS ar_balance
FROM clients c
LEFT JOIN v_invoice_summary v ON v.client_id = c.client_id
GROUP BY c.client_id;

-- === Indexes for common lookups ===
CREATE INDEX IF NOT EXISTS idx_invoices_client ON invoices(client_id);
CREATE INDEX IF NOT EXISTS idx_payments_invoice ON payments(invoice_id);
CREATE INDEX IF NOT EXISTS idx_jobs_client ON jobs(client_id);
CREATE INDEX IF NOT EXISTS idx_leads_status ON leads(status);

-- === Notes on external mappings ===
-- Invoice Ninja: line items are commonly represented as an array; we normalize into invoice_items.
-- Store the full raw invoice/quote payload if needed by adding a jsonb column 'external_snapshot' on estimates/invoices.
-- Crater: similar mapping; primary difference is field names and tax handling (single vs multi tax lines).
