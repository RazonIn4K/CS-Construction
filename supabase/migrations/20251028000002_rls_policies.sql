-- ==============================================================================
-- Row-Level Security (RLS) Policies
-- ==============================================================================
-- Purpose: Secure database access with fine-grained permissions
-- Strategy:
-- - Public: Can insert leads (form submissions)
-- - Authenticated: Read-only access to own data
-- - Service role: Full access (bypasses RLS)
-- ==============================================================================

-- ==============================================================================
-- Enable RLS on all tables
-- ==============================================================================

ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE properties ENABLE ROW LEVEL SECURITY;
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE job_phases ENABLE ROW LEVEL SECURITY;
ALTER TABLE estimates ENABLE ROW LEVEL SECURITY;
ALTER TABLE estimate_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE change_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoice_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE communications ENABLE ROW LEVEL SECURITY;
ALTER TABLE photos ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE webhook_event_dlq ENABLE ROW LEVEL SECURITY;

-- ==============================================================================
-- Public Policies (Anonymous Users)
-- ==============================================================================

-- Allow public to insert leads (website form submission)
CREATE POLICY "Public can insert leads"
  ON leads
  FOR INSERT
  TO anon
  WITH CHECK (true);

-- ==============================================================================
-- Service Role Policies (Backend/Admin)
-- ==============================================================================
-- Note: service_role key automatically bypasses RLS
-- These policies are for explicit documentation

-- Allow service role full access to all tables
CREATE POLICY "Service role has full access to clients"
  ON clients
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Service role has full access to properties"
  ON properties
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Service role has full access to leads"
  ON leads
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Service role has full access to jobs"
  ON jobs
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Service role has full access to job_phases"
  ON job_phases
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Service role has full access to estimates"
  ON estimates
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Service role has full access to estimate_items"
  ON estimate_items
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Service role has full access to change_orders"
  ON change_orders
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Service role has full access to invoices"
  ON invoices
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Service role has full access to invoice_items"
  ON invoice_items
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Service role has full access to payments"
  ON payments
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Service role has full access to communications"
  ON communications
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Service role has full access to photos"
  ON photos
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Service role has full access to tasks"
  ON tasks
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Service role has full access to webhook_event_dlq"
  ON webhook_event_dlq
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- ==============================================================================
-- Future: Authenticated User Policies
-- ==============================================================================
-- When you add user authentication, uncomment and customize these

-- -- Clients can view their own data
-- CREATE POLICY "Clients can view own client record"
--   ON clients
--   FOR SELECT
--   TO authenticated
--   USING (auth.uid() = user_id);

-- -- Clients can view their own properties
-- CREATE POLICY "Clients can view own properties"
--   ON properties
--   FOR SELECT
--   TO authenticated
--   USING (client_id IN (
--     SELECT client_id FROM clients WHERE user_id = auth.uid()
--   ));

-- -- Clients can view their own jobs
-- CREATE POLICY "Clients can view own jobs"
--   ON jobs
--   FOR SELECT
--   TO authenticated
--   USING (client_id IN (
--     SELECT client_id FROM clients WHERE user_id = auth.uid()
--   ));

-- -- Clients can view their own invoices
-- CREATE POLICY "Clients can view own invoices"
--   ON invoices
--   FOR SELECT
--   TO authenticated
--   USING (client_id IN (
--     SELECT client_id FROM clients WHERE user_id = auth.uid()
--   ));

-- ==============================================================================
-- Comments for Documentation
-- ==============================================================================

COMMENT ON POLICY "Public can insert leads" ON leads IS
  'Allows website visitors to submit lead forms without authentication';

COMMENT ON POLICY "Service role has full access to clients" ON clients IS
  'Backend API has full CRUD access using service role key';
