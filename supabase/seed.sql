-- ==============================================================================
-- Test Seed Data for CD Home Improvements
-- ==============================================================================
-- Purpose: Populate database with realistic test data for development
-- Matches actual schema from 20251028000000_initial_schema.sql
-- ==============================================================================

-- ==============================================================================
-- Clear existing data (for re-seeding)
-- ==============================================================================

TRUNCATE TABLE
  tasks,
  photos,
  communications,
  payments,
  invoice_items,
  invoices,
  change_orders,
  estimate_items,
  estimates,
  job_phases,
  jobs,
  leads,
  properties,
  clients,
  webhook_event_dlq
CASCADE;

-- ==============================================================================
-- Test Clients
-- ==============================================================================

INSERT INTO clients (client_id, first_name, last_name, company, email, phone, sms_opt_in, created_at, updated_at) VALUES
  ('c1111111-1111-1111-1111-111111111111', 'John', 'Smith', 'Smith Realty', 'john.smith@example.com', '8155551234', true, now() - interval '30 days', now() - interval '30 days'),
  ('c2222222-2222-2222-2222-222222222222', 'Sarah', 'Johnson', NULL, 'sarah.j@example.com', '8155555678', true, now() - interval '25 days', now() - interval '5 days'),
  ('c3333333-3333-3333-3333-333333333333', 'Robert', 'Davis', 'Davis Properties LLC', 'robert@davisproperties.com', '8155559876', false, now() - interval '20 days', now() - interval '20 days'),
  ('c4444444-4444-4444-4444-444444444444', 'Emily', 'Brown', NULL, 'emily.brown@example.com', '8155552468', true, now() - interval '15 days', now() - interval '2 days'),
  ('c5555555-5555-5555-5555-555555555555', 'Michael', 'Wilson', 'Wilson Rentals Inc', 'mike@wilsonrentals.com', '8155558642', false, now() - interval '10 days', now() - interval '1 day');

-- ==============================================================================
-- Test Properties
-- ==============================================================================

INSERT INTO properties (property_id, client_id, address1, address2, city, state, zip, lat, lng, created_at) VALUES
  ('p1111111-1111-1111-1111-111111111111', 'c1111111-1111-1111-1111-111111111111', '123 Main St', NULL, 'Rockford', 'IL', '61101', 42.2711, -89.0940, now() - interval '30 days'),
  ('p2222222-2222-2222-2222-222222222222', 'c2222222-2222-2222-2222-222222222222', '456 Oak Ave', 'Apt 2B', 'Loves Park', 'IL', '61111', 42.3236, -89.0303, now() - interval '25 days'),
  ('p3333333-3333-3333-3333-333333333333', 'c3333333-3333-3333-3333-333333333333', '789 Business Blvd', 'Suite 200', 'Rockford', 'IL', '61108', 42.2597, -89.0637, now() - interval '20 days'),
  ('p4444444-4444-4444-4444-444444444444', 'c4444444-4444-4444-4444-444444444444', '321 Elm Street', NULL, 'Machesney Park', 'IL', '61115', 42.3475, -89.0390, now() - interval '15 days'),
  ('p5555555-5555-5555-5555-555555555555', 'c5555555-5555-5555-5555-555555555555', '654 Pine Road', 'Unit A', 'Rockford', 'IL', '61103', 42.2808, -89.0773, now() - interval '10 days');

-- ==============================================================================
-- Test Leads
-- ==============================================================================

INSERT INTO leads (lead_id, client_id, property_id, channel, intake_notes, budget_min, budget_max, status, source, created_at) VALUES
  ('l1111111-1111-1111-1111-111111111111', 'c1111111-1111-1111-1111-111111111111', 'p1111111-1111-1111-1111-111111111111', 'web', 'Replace old deck, approximately 300 sq ft. Referred by neighbor.', 12000.00, 18000.00, 'qualified', 'referral', now() - interval '30 days'),
  ('l2222222-2222-2222-2222-222222222222', 'c2222222-2222-2222-2222-222222222222', 'p2222222-2222-2222-2222-222222222222', 'web', 'Complete kitchen renovation, new cabinets and countertops. Very motivated, timeline flexible.', 30000.00, 40000.00, 'quoted', 'google_search', now() - interval '25 days'),
  ('l3333333-3333-3333-3333-333333333333', 'c3333333-3333-3333-3333-333333333333', 'p3333333-3333-3333-3333-333333333333', 'phone', 'Office space updates, painting and flooring. Multiple properties, starting with one.', 18000.00, 25000.00, 'won', 'google_ads', now() - interval '20 days'),
  ('l4444444-4444-4444-4444-444444444444', 'c4444444-4444-4444-4444-444444444444', 'p4444444-4444-4444-4444-444444444444', 'web', 'Master bathroom remodel, new shower and vanity. Saw ad on Facebook.', 10000.00, 15000.00, 'new', 'facebook', now() - interval '1 day'),
  ('l5555555-5555-5555-5555-555555555555', 'c5555555-5555-5555-5555-555555555555', 'p5555555-5555-5555-5555-555555555555', 'phone', 'Misc repairs for rental unit turnover. Returning customer.', 4000.00, 6000.00, 'contacted', 'repeat', now() - interval '2 days');

-- ==============================================================================
-- Test Jobs
-- ==============================================================================

INSERT INTO jobs (job_id, client_id, property_id, title, description, status, start_date, end_date, created_at) VALUES
  ('j1111111-1111-1111-1111-111111111111', 'c1111111-1111-1111-1111-111111111111', 'p1111111-1111-1111-1111-111111111111', 'Smith Deck Replacement', 'Remove old deck and build new 300 sq ft composite deck with Trex materials', 'active', (now() - interval '5 days')::date, (now() + interval '10 days')::date, now() - interval '20 days'),
  ('j2222222-2222-2222-2222-222222222222', 'c2222222-2222-2222-2222-222222222222', 'p2222222-2222-2222-2222-222222222222', 'Johnson Kitchen Remodel', 'Full kitchen renovation including custom cabinets, quartz countertops, tile backsplash', 'pending', (now() + interval '7 days')::date, (now() + interval '35 days')::date, now() - interval '15 days'),
  ('j3333333-3333-3333-3333-333333333333', 'c3333333-3333-3333-3333-333333333333', 'p3333333-3333-3333-3333-333333333333', 'Davis Office Renovation', 'Paint entire 5000 sq ft office space, replace carpet with LVP flooring', 'complete', (now() - interval '20 days')::date, (now() - interval '5 days')::date, now() - interval '25 days'),
  ('j4444444-4444-4444-4444-444444444444', 'c5555555-5555-5555-5555-555555555555', 'p5555555-5555-5555-5555-555555555555', 'Wilson Rental - Unit A Turnover', 'Paint walls, minor drywall repair, new LVP flooring in bedroom', 'active', (now() - interval '3 days')::date, (now() + interval '4 days')::date, now() - interval '5 days');

-- ==============================================================================
-- Test Estimates
-- ==============================================================================

INSERT INTO estimates (estimate_id, client_id, job_id, external_id, external_number, status, issue_date, valid_until, currency, terms, notes, created_at) VALUES
  ('e1111111-1111-1111-1111-111111111111', 'c1111111-1111-1111-1111-111111111111', 'j1111111-1111-1111-1111-111111111111', NULL, 'EST-2024-001', 'approved', (now() - interval '22 days')::date, (now() + interval '8 days')::date, 'USD', 'Payment due within 30 days of completion', 'Materials: Trex composite decking, pressure-treated framing', now() - interval '22 days'),
  ('e2222222-2222-2222-2222-222222222222', 'c2222222-2222-2222-2222-222222222222', 'j2222222-2222-2222-2222-222222222222', NULL, 'EST-2024-002', 'approved', (now() - interval '17 days')::date, (now() + interval '13 days')::date, 'USD', 'Net 30 days', 'Early booking discount applied - $1000 off', now() - interval '17 days'),
  ('e3333333-3333-3333-3333-333333333333', 'c4444444-4444-4444-4444-444444444444', NULL, NULL, 'EST-2024-003', 'sent', (now() - interval '2 days')::date, (now() + interval '28 days')::date, 'USD', 'Due on receipt', 'Master bath: new shower system, vanity, tile work', now() - interval '2 days');

-- ==============================================================================
-- Test Estimate Items
-- ==============================================================================

INSERT INTO estimate_items (item_id, estimate_id, kind, name, description, quantity, unit_price, discount_percent, tax_percent, sort_order) VALUES
  ('ei111111-1111-1111-1111-111111111111', 'e1111111-1111-1111-1111-111111111111', 'service', 'Deck Demolition', 'Remove and dispose of existing deck structure', 1, 1200.00, 0, 8.25, 1),
  ('ei222222-2222-2222-2222-222222222222', 'e1111111-1111-1111-1111-111111111111', 'material', 'Trex Composite Decking', '300 sq ft of premium composite decking boards', 300, 25.00, 0, 8.25, 2),
  ('ei333333-3333-3333-3333-333333333333', 'e1111111-1111-1111-1111-111111111111', 'material', 'Framing & Posts', 'Pressure-treated lumber for substructure', 1, 3800.00, 0, 8.25, 3),
  ('ei444444-4444-4444-4444-444444444444', 'e1111111-1111-1111-1111-111111111111', 'material', 'Railing System', 'Composite railing system with posts', 40, 62.50, 0, 8.25, 4),
  ('ei555555-5555-5555-5555-555555555555', 'e2222222-2222-2222-2222-222222222222', 'material', 'Custom Kitchen Cabinets', 'Semi-custom cabinet set with soft-close hardware', 1, 18000.00, 5.56, 8.25, 1),
  ('ei666666-6666-6666-6666-666666666666', 'e2222222-2222-2222-2222-222222222222', 'material', 'Quartz Countertops', 'Engineered quartz with undermount sink cutout', 1, 8500.00, 0, 8.25, 2),
  ('ei777777-7777-7777-7777-777777777777', 'e2222222-2222-2222-2222-222222222222', 'service', 'Backsplash Installation', 'Tile backsplash with subway tile pattern', 1, 3200.00, 0, 8.25, 3),
  ('ei888888-8888-8888-8888-888888888888', 'e2222222-2222-2222-2222-222222222222', 'service', 'Plumbing & Electrical', 'Update plumbing fixtures and add outlets', 1, 5300.00, 0, 8.25, 4');

-- ==============================================================================
-- Test Invoices
-- ==============================================================================

INSERT INTO invoices (invoice_id, client_id, job_id, change_order_id, external_id, external_number, status, issue_date, due_date, currency, memo, created_at) VALUES
  ('i1111111-1111-1111-1111-111111111111', 'c1111111-1111-1111-1111-111111111111', 'j1111111-1111-1111-1111-111111111111', NULL, NULL, 'INV-2024-001', 'sent', (now() - interval '5 days')::date, (now() + interval '25 days')::date, 'USD', 'First progress payment - 50% deposit for deck project', now() - interval '5 days'),
  ('i2222222-2222-2222-2222-222222222222', 'c3333333-3333-3333-3333-333333333333', 'j3333333-3333-3333-3333-333333333333', NULL, NULL, 'INV-2024-002', 'paid', (now() - interval '10 days')::date, (now() - interval '5 days')::date, 'USD', 'Final invoice for completed office renovation', now() - interval '10 days'),
  ('i3333333-3333-3333-3333-333333333333', 'c5555555-5555-5555-5555-555555555555', 'j4444444-4444-4444-4444-444444444444', NULL, NULL, 'INV-2024-003', 'partial', (now() - interval '1 day')::date, (now() + interval '6 days')::date, 'USD', 'Rental unit turnover - materials and labor', now() - interval '1 day');

-- ==============================================================================
-- Test Invoice Items
-- ==============================================================================

INSERT INTO invoice_items (item_id, invoice_id, kind, name, description, quantity, unit_price, discount_percent, tax_percent, sort_order) VALUES
  ('ii111111-1111-1111-1111-111111111111', 'i1111111-1111-1111-1111-111111111111', 'service', 'Deck Project - 50% Deposit', 'Progress payment for deck replacement project', 1, 8250.00, 0, 8.25, 1),
  ('ii222222-2222-2222-2222-222222222222', 'i2222222-2222-2222-2222-222222222222', 'service', 'Office Painting', 'Complete interior paint 5000 sq ft', 5000, 2.50, 0, 8.25, 1),
  ('ii333333-3333-3333-3333-333333333333', 'i2222222-2222-2222-2222-222222222222', 'material', 'LVP Flooring Installation', 'Luxury vinyl plank flooring with installation', 5000, 1.90, 0, 8.25, 2),
  ('ii444444-4444-4444-4444-444444444444', 'i3333333-3333-3333-3333-333333333333', 'service', 'Unit Turnover Labor', 'Painting, drywall repair, flooring installation', 1, 3200.00, 0, 8.25, 1),
  ('ii555555-5555-5555-5555-555555555555', 'i3333333-3333-3333-3333-333333333333', 'material', 'LVP Flooring - Bedroom', 'Luxury vinyl plank for 200 sq ft bedroom', 200, 3.00, 0, 8.25, 2);

-- ==============================================================================
-- Test Payments
-- ==============================================================================

INSERT INTO payments (payment_id, invoice_id, external_id, method, amount, currency, paid_at, status, raw_event, created_at) VALUES
  ('py111111-1111-1111-1111-111111111111', 'i2222222-2222-2222-2222-222222222222', 'ch_3abc123def456', 'check', 23815.00, 'USD', now() - interval '3 days', 'applied', '{"check_number":"4521","bank":"First Midwest"}', now() - interval '3 days'),
  ('py222222-2222-2222-2222-222222222222', 'i3333333-3333-3333-3333-333333333333', 'pi_3xyz789ghi012', 'card', 2600.00, 'USD', now(), 'applied', '{"stripe_pi":"pi_3xyz789ghi012","last4":"4242"}', now());

-- ==============================================================================
-- Test Communications
-- ==============================================================================

INSERT INTO communications (id, client_id, job_id, channel, subject, body, sent_at) VALUES
  ('cm111111-1111-1111-1111-111111111111', 'c1111111-1111-1111-1111-111111111111', 'j1111111-1111-1111-1111-111111111111', 'email', 'Your Estimate is Ready', 'Hi John, Your estimate for the deck replacement project is attached. Please review and let us know if you have any questions. We can start as soon as next week!', now() - interval '22 days'),
  ('cm222222-2222-2222-2222-222222222222', 'c2222222-2222-2222-2222-222222222222', 'j2222222-2222-2222-2222-222222222222', 'sms', NULL, 'Hi Sarah, this is CD Home Improvements. Your kitchen remodel is scheduled to start next Tuesday at 8am. Reply with any questions!', now() - interval '8 days'),
  ('cm333333-3333-3333-3333-333333333333', 'c3333333-3333-3333-3333-333333333333', 'j3333333-3333-3333-3333-333333333333', 'email', 'Project Complete - Thank You!', 'Robert, Your office renovation is complete! Invoice attached. Thank you for choosing CD Home Improvements. We appreciate your business!', now() - interval '5 days'),
  ('cm444444-4444-4444-4444-444444444444', 'c4444444-4444-4444-4444-444444444444', NULL, 'call', NULL, 'Initial consultation call - discussed bathroom remodel scope, budget, and timeline. Sending estimate by end of week.', now() - interval '1 day');

-- ==============================================================================
-- Test Photos
-- ==============================================================================

INSERT INTO photos (photo_id, job_id, url, caption, created_at) VALUES
  ('ph111111-1111-1111-1111-111111111111', 'j1111111-1111-1111-1111-111111111111', 'https://placeholder.com/deck-before-1.jpg', 'Old deck before demolition - front view showing weathered boards', now() - interval '6 days'),
  ('ph222222-2222-2222-2222-222222222222', 'j1111111-1111-1111-1111-111111111111', 'https://placeholder.com/deck-progress-1.jpg', 'Framing in progress - pressure treated posts and joists installed', now() - interval '2 days'),
  ('ph333333-3333-3333-3333-333333333333', 'j3333333-3333-3333-3333-333333333333', 'https://placeholder.com/office-after-1.jpg', 'Completed office renovation - freshly painted walls and new LVP flooring', now() - interval '5 days'),
  ('ph444444-4444-4444-4444-444444444444', 'j3333333-3333-3333-3333-333333333333', 'https://placeholder.com/office-after-2.jpg', 'Office renovation detail - corner showing paint and flooring junction', now() - interval '5 days');

-- ==============================================================================
-- Test Tasks
-- ==============================================================================

INSERT INTO tasks (task_id, job_id, title, status, due_date, created_at) VALUES
  ('t1111111-1111-1111-1111-111111111111', 'j1111111-1111-1111-1111-111111111111', 'Order Trex decking materials - 300 sq ft Spiced Rum color', 'closed', (now() - interval '4 days')::date, now() - interval '7 days'),
  ('t2222222-2222-2222-2222-222222222222', 'j1111111-1111-1111-1111-111111111111', 'Schedule railing subcontractor for installation', 'open', (now() + interval '5 days')::date, now() - interval '3 days'),
  ('t3333333-3333-3333-3333-333333333333', 'j2222222-2222-2222-2222-222222222222', 'Place custom cabinet order - 6 week lead time', 'open', (now() - interval '1 day')::date, now() - interval '5 days'),
  ('t4444444-4444-4444-4444-444444444444', 'j4444444-4444-4444-4444-444444444444', 'Pick up LVP flooring from supplier', 'open', (now() + interval '1 day')::date, now() - interval '2 days'),
  ('t5555555-5555-5555-5555-555555555555', 'j2222222-2222-2222-2222-222222222222', 'Final walkthrough with Sarah to confirm cabinet layout', 'open', (now() + interval '3 days')::date, now() - interval '1 day');

-- ==============================================================================
-- Test Webhook DLQ Events
-- ==============================================================================

INSERT INTO webhook_event_dlq (event_id, event_source, event_type, payload, error_message, received_at, replayed_at, replay_count, created_at, updated_at) VALUES
  ('we111111-1111-1111-1111-111111111111', 'stripe', 'payment_intent.succeeded', '{"id":"pi_test_123","amount":8930,"currency":"usd"}', 'Database connection timeout during payment processing', now() - interval '12 hours', NULL, 0, now() - interval '12 hours', now() - interval '12 hours'),
  ('we222222-2222-2222-2222-222222222222', 'invoiceninja', 'invoice.created', '{"invoice_id":"inv_456","total":5196}', 'Client lookup failed - email mismatch', now() - interval '6 hours', now() - interval '2 hours', 1, now() - interval '6 hours', now() - interval '2 hours');

-- ==============================================================================
-- Verification Queries
-- ==============================================================================

-- Uncomment to verify seed data after running:

-- SELECT 'Clients' as table_name, COUNT(*) as row_count FROM clients
-- UNION ALL
-- SELECT 'Properties', COUNT(*) FROM properties
-- UNION ALL
-- SELECT 'Leads', COUNT(*) FROM leads
-- UNION ALL
-- SELECT 'Jobs', COUNT(*) FROM jobs
-- UNION ALL
-- SELECT 'Estimates', COUNT(*) FROM estimates
-- UNION ALL
-- SELECT 'Estimate Items', COUNT(*) FROM estimate_items
-- UNION ALL
-- SELECT 'Invoices', COUNT(*) FROM invoices
-- UNION ALL
-- SELECT 'Invoice Items', COUNT(*) FROM invoice_items
-- UNION ALL
-- SELECT 'Payments', COUNT(*) FROM payments
-- UNION ALL
-- SELECT 'Communications', COUNT(*) FROM communications
-- UNION ALL
-- SELECT 'Photos', COUNT(*) FROM photos
-- UNION ALL
-- SELECT 'Tasks', COUNT(*) FROM tasks
-- UNION ALL
-- SELECT 'Webhook DLQ', COUNT(*) FROM webhook_event_dlq;
