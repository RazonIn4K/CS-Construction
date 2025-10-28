-- ==============================================================================
-- Test Seed Data for CD Home Improvements
-- ==============================================================================
-- Purpose: Populate database with realistic test data for development
-- Usage: supabase db reset (applies migrations + seed data)
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

INSERT INTO clients (client_id, first_name, last_name, company, email, phone, phone_country_code, address1, address2, city, state, zip, country, client_type, lead_source, notes, created_at, updated_at) VALUES
  ('c1111111-1111-1111-1111-111111111111', 'John', 'Smith', 'Smith Realty', 'john.smith@example.com', '8155551234', 'US', '123 Main St', NULL, 'Rockford', 'IL', '61101', 'US', 'residential', 'website', 'Referred by neighbor. Interested in deck replacement.', now() - interval '30 days', now() - interval '30 days'),
  ('c2222222-2222-2222-2222-222222222222', 'Sarah', 'Johnson', NULL, 'sarah.j@example.com', '8155555678', 'US', '456 Oak Ave', 'Apt 2B', 'Loves Park', 'IL', '61111', 'US', 'residential', 'referral', 'Previous customer recommended us. Wants kitchen remodel.', now() - interval '25 days', now() - interval '5 days'),
  ('c3333333-3333-3333-3333-333333333333', 'Robert', 'Davis', 'Davis Properties LLC', 'robert@davisproperties.com', '8155559876', 'US', '789 Business Blvd', 'Suite 200', 'Rockford', 'IL', '61108', 'US', 'commercial', 'google', 'Commercial property owner. Multiple locations.', now() - interval '20 days', now() - interval '20 days'),
  ('c4444444-4444-4444-4444-444444444444', 'Emily', 'Brown', NULL, 'emily.brown@example.com', '8155552468', 'US', '321 Elm Street', NULL, 'Machesney Park', 'IL', '61115', 'US', 'residential', 'facebook', 'Saw our ad on Facebook. Needs bathroom remodel.', now() - interval '15 days', now() - interval '2 days'),
  ('c5555555-5555-5555-5555-555555555555', 'Michael', 'Wilson', 'Wilson Rentals Inc', 'mike@wilsonrentals.com', '8155558642', 'US', '654 Pine Road', NULL, 'Rockford', 'IL', '61103', 'US', 'commercial', 'repeat', 'Returning customer. Rental property maintenance.', now() - interval '10 days', now() - interval '1 day');

-- ==============================================================================
-- Test Properties
-- ==============================================================================

INSERT INTO properties (property_id, client_id, property_name, address1, address2, city, state, zip, country, property_type, notes, created_at, updated_at) VALUES
  ('p1111111-1111-1111-1111-111111111111', 'c1111111-1111-1111-1111-111111111111', 'Primary Residence', '123 Main St', NULL, 'Rockford', 'IL', '61101', 'US', 'single_family', '2-story home, built 2005', now() - interval '30 days', now() - interval '30 days'),
  ('p2222222-2222-2222-2222-222222222222', 'c2222222-2222-2222-2222-222222222222', 'Primary Residence', '456 Oak Ave', 'Apt 2B', 'Loves Park', 'IL', '61111', 'US', 'condo', 'Second floor unit', now() - interval '25 days', now() - interval '25 days'),
  ('p3333333-3333-3333-3333-333333333333', 'c3333333-3333-3333-3333-333333333333', 'Main Office Building', '789 Business Blvd', 'Suite 200', 'Rockford', 'IL', '61108', 'US', 'commercial', '5000 sq ft office space', now() - interval '20 days', now() - interval '20 days'),
  ('p4444444-4444-4444-4444-444444444444', 'c4444444-4444-4444-4444-444444444444', 'Primary Residence', '321 Elm Street', NULL, 'Machesney Park', 'IL', '61115', 'US', 'single_family', 'Ranch style, 1970s', now() - interval '15 days', now() - interval '15 days'),
  ('p5555555-5555-5555-5555-555555555555', 'c5555555-5555-5555-5555-555555555555', 'Rental Property #1', '654 Pine Road', 'Unit A', 'Rockford', 'IL', '61103', 'US', 'multi_family', '4-unit building', now() - interval '10 days', now() - interval '10 days');

-- ==============================================================================
-- Test Leads
-- ==============================================================================

INSERT INTO leads (lead_id, client_id, property_id, first_name, last_name, email, phone, phone_country_code, source, channel, project_type, project_description, urgency, estimated_budget, status, notes, followed_up_at, converted_at, created_at, updated_at) VALUES
  ('l1111111-1111-1111-1111-111111111111', 'c1111111-1111-1111-1111-111111111111', 'p1111111-1111-1111-1111-111111111111', 'John', 'Smith', 'john.smith@example.com', '8155551234', 'US', 'website', 'organic', 'deck_patio', 'Replace old deck, approximately 300 sq ft', 'medium', 15000.00, 'qualified', 'Scheduled estimate for next week', now() - interval '29 days', now() - interval '28 days', now() - interval '30 days', now() - interval '28 days'),
  ('l2222222-2222-2222-2222-222222222222', 'c2222222-2222-2222-2222-222222222222', 'p2222222-2222-2222-2222-222222222222', 'Sarah', 'Johnson', 'sarah.j@example.com', '8155555678', 'US', 'referral', 'word_of_mouth', 'kitchen_remodel', 'Complete kitchen renovation, new cabinets and countertops', 'high', 35000.00, 'qualified', 'Very motivated, timeline flexible', now() - interval '24 days', now() - interval '23 days', now() - interval '25 days', now() - interval '23 days'),
  ('l3333333-3333-3333-3333-333333333333', 'c3333333-3333-3333-3333-333333333333', 'p3333333-3333-3333-3333-333333333333', 'Robert', 'Davis', 'robert@davisproperties.com', '8155559876', 'US', 'google', 'paid_search', 'commercial', 'Office space updates, painting and flooring', 'low', 20000.00, 'qualified', 'Multiple properties, starting with one', now() - interval '19 days', now() - interval '18 days', now() - interval '20 days', now() - interval '18 days'),
  ('l4444444-4444-4444-4444-444444444444', 'c4444444-4444-4444-4444-444444444444', 'p4444444-4444-4444-4444-444444444444', 'Emily', 'Brown', 'emily.brown@example.com', '8155552468', 'US', 'facebook', 'social_media', 'bathroom_remodel', 'Master bathroom remodel, new shower and vanity', 'medium', 12000.00, 'new', 'Just submitted today, need to follow up', NULL, NULL, now() - interval '1 day', now() - interval '1 day'),
  ('l5555555-5555-5555-5555-555555555555', 'c5555555-5555-5555-5555-555555555555', 'p5555555-5555-5555-5555-555555555555', 'Michael', 'Wilson', 'mike@wilsonrentals.com', '8155558642', 'US', 'repeat', 'direct', 'general_repairs', 'Misc repairs for rental unit turnover', 'high', 5000.00, 'contacted', 'Spoke with Mike, sending estimate tomorrow', now(), NULL, now() - interval '2 days', now());

-- ==============================================================================
-- Test Jobs
-- ==============================================================================

INSERT INTO jobs (job_id, client_id, property_id, job_name, job_type, description, status, start_date, end_date, estimated_cost, actual_cost, created_at, updated_at) VALUES
  ('j1111111-1111-1111-1111-111111111111', 'c1111111-1111-1111-1111-111111111111', 'p1111111-1111-1111-1111-111111111111', 'Smith Deck Replacement', 'deck_patio', 'Remove old deck and build new 300 sq ft composite deck', 'in_progress', now() - interval '5 days', now() + interval '10 days', 16500.00, NULL, now() - interval '20 days', now() - interval '1 day'),
  ('j2222222-2222-2222-2222-222222222222', 'c2222222-2222-2222-2222-222222222222', 'p2222222-2222-2222-2222-222222222222', 'Johnson Kitchen Remodel', 'kitchen_remodel', 'Full kitchen renovation including cabinets, countertops, backsplash', 'scheduled', now() + interval '7 days', now() + interval '35 days', 38000.00, NULL, now() - interval '15 days', now() - interval '2 days'),
  ('j3333333-3333-3333-3333-333333333333', 'c3333333-3333-3333-3333-333333333333', 'p3333333-3333-3333-3333-333333333333', 'Davis Office Renovation', 'commercial', 'Paint entire office, replace carpet with LVP flooring', 'completed', now() - interval '20 days', now() - interval '5 days', 22000.00, 21500.00, now() - interval '25 days', now() - interval '5 days'),
  ('j4444444-4444-4444-4444-444444444444', 'c5555555-5555-5555-5555-555555555555', 'p5555555-5555-5555-5555-555555555555', 'Wilson Rental - Unit A Turnover', 'general_repairs', 'Paint, minor drywall repair, new flooring in bedroom', 'in_progress', now() - interval '3 days', now() + interval '4 days', 4800.00, NULL, now() - interval '5 days', now());

-- ==============================================================================
-- Test Estimates
-- ==============================================================================

INSERT INTO estimates (estimate_id, client_id, property_id, job_id, estimate_number, issue_date, valid_until_date, status, subtotal, tax_amount, discount_amount, total_amount, notes, approved_at, created_at, updated_at) VALUES
  ('e1111111-1111-1111-1111-111111111111', 'c1111111-1111-1111-1111-111111111111', 'p1111111-1111-1111-1111-111111111111', 'j1111111-1111-1111-1111-111111111111', 'EST-2024-001', now() - interval '22 days', now() + interval '8 days', 'approved', 15000.00, 1237.50, 0.00, 16237.50, 'Materials: Trex composite decking, pressure-treated framing', now() - interval '20 days', now() - interval '22 days', now() - interval '20 days'),
  ('e2222222-2222-2222-2222-222222222222', 'c2222222-2222-2222-2222-222222222222', 'p2222222-2222-2222-2222-222222222222', 'j2222222-2222-2222-2222-222222222222', 'EST-2024-002', now() - interval '17 days', now() + interval '13 days', 'approved', 35000.00, 2887.50, 1000.00, 36887.50, 'Early booking discount applied', now() - interval '15 days', now() - interval '17 days', now() - interval '15 days'),
  ('e3333333-3333-3333-3333-333333333333', 'c4444444-4444-4444-4444-444444444444', 'p4444444-4444-4444-4444-444444444444', NULL, 'EST-2024-003', now() - interval '2 days', now() + interval '28 days', 'sent', 11500.00, 948.75, 0.00, 12448.75, 'Master bath: new shower, vanity, tile work', NULL, now() - interval '2 days', now() - interval '2 days');

-- ==============================================================================
-- Test Estimate Items
-- ==============================================================================

INSERT INTO estimate_items (item_id, estimate_id, description, quantity, unit_price, amount) VALUES
  ('ei111111-1111-1111-1111-111111111111', 'e1111111-1111-1111-1111-111111111111', 'Demolish existing deck', 1, 1200.00, 1200.00),
  ('ei222222-2222-2222-2222-222222222222', 'e1111111-1111-1111-1111-111111111111', 'Trex composite decking (300 sq ft)', 300, 25.00, 7500.00),
  ('ei333333-3333-3333-3333-333333333333', 'e1111111-1111-1111-1111-111111111111', 'Pressure-treated framing and posts', 1, 3800.00, 3800.00),
  ('ei444444-4444-4444-4444-444444444444', 'e1111111-1111-1111-1111-111111111111', 'Composite railing system', 40, 62.50, 2500.00),
  ('ei555555-5555-5555-5555-555555555555', 'e2222222-2222-2222-2222-222222222222', 'Kitchen cabinets - custom', 1, 18000.00, 18000.00),
  ('ei666666-6666-6666-6666-666666666666', 'e2222222-2222-2222-2222-222222222222', 'Quartz countertops', 1, 8500.00, 8500.00),
  ('ei777777-7777-7777-7777-777777777777', 'e2222222-2222-2222-2222-222222222222', 'Backsplash tile and installation', 1, 3200.00, 3200.00),
  ('ei888888-8888-8888-8888-888888888888', 'e2222222-2222-2222-2222-222222222222', 'Plumbing and electrical updates', 1, 5300.00, 5300.00);

-- ==============================================================================
-- Test Invoices
-- ==============================================================================

INSERT INTO invoices (invoice_id, job_id, client_id, invoice_number, issue_date, due_date, subtotal, tax_amount, discount_amount, total_amount, balance_due, status, payment_terms, notes, created_at, updated_at) VALUES
  ('i1111111-1111-1111-1111-111111111111', 'j1111111-1111-1111-1111-111111111111', 'c1111111-1111-1111-1111-111111111111', 'INV-2024-001', now() - interval '5 days', now() + interval '25 days', 8250.00, 680.63, 0.00, 8930.63, 8930.63, 'sent', 'net_30', 'First progress payment - 50% deposit', now() - interval '5 days', now() - interval '5 days'),
  ('i2222222-2222-2222-2222-222222222222', 'j3333333-3333-3333-3333-333333333333', 'c3333333-3333-3333-3333-333333333333', 'INV-2024-002', now() - interval '10 days', now() - interval '20 days', 22000.00, 1815.00, 0.00, 23815.00, 0.00, 'paid', 'net_15', 'Completed project invoice', now() - interval '10 days', now() - interval '3 days'),
  ('i3333333-3333-3333-3333-333333333333', 'j4444444-4444-4444-4444-444444444444', 'c5555555-5555-5555-5555-555555555555', 'INV-2024-003', now() - interval '1 day', now() + interval '6 days', 4800.00, 396.00, 0.00, 5196.00, 2596.00, 'partial', 'due_on_receipt', 'Rental unit turnover - partial payment received', now() - interval '1 day', now());

-- ==============================================================================
-- Test Payments
-- ==============================================================================

INSERT INTO payments (payment_id, invoice_id, client_id, job_id, amount, payment_method, payment_date, transaction_id, status, notes, created_at, updated_at) VALUES
  ('py111111-1111-1111-1111-111111111111', 'i2222222-2222-2222-2222-222222222222', 'c3333333-3333-3333-3333-333333333333', 'j3333333-3333-3333-3333-333333333333', 23815.00, 'check', now() - interval '3 days', 'CHK-4521', 'completed', 'Check #4521 cleared', now() - interval '3 days', now() - interval '3 days'),
  ('py222222-2222-2222-2222-222222222222', 'i3333333-3333-3333-3333-333333333333', 'c5555555-5555-5555-5555-555555555555', 'j4444444-4444-4444-4444-444444444444', 2600.00, 'credit_card', now(), 'ch_3Abc123Def456', 'completed', 'Stripe payment - partial', now(), now());

-- ==============================================================================
-- Test Communications
-- ==============================================================================

INSERT INTO communications (communication_id, client_id, job_id, communication_type, direction, subject, content, sent_at, delivered_at, opened_at, status, created_at, updated_at) VALUES
  ('cm111111-1111-1111-1111-111111111111', 'c1111111-1111-1111-1111-111111111111', 'j1111111-1111-1111-1111-111111111111', 'email', 'outbound', 'Your Estimate is Ready - Deck Replacement', 'Hi John, Your estimate for the deck replacement project is attached. Please review and let us know if you have any questions.', now() - interval '22 days', now() - interval '22 days', now() - interval '21 days', 'delivered', now() - interval '22 days', now() - interval '22 days'),
  ('cm222222-2222-2222-2222-222222222222', 'c2222222-2222-2222-2222-222222222222', 'j2222222-2222-2222-2222-222222222222', 'sms', 'outbound', NULL, 'Hi Sarah, this is CD Home Improvements. Your kitchen remodel is scheduled to start next Tuesday. We''ll arrive at 8am. Reply if you have questions.', now() - interval '8 days', now() - interval '8 days', NULL, 'delivered', now() - interval '8 days', now() - interval '8 days'),
  ('cm333333-3333-3333-3333-333333333333', 'c3333333-3333-3333-3333-333333333333', 'j3333333-3333-3333-3333-333333333333', 'email', 'outbound', 'Project Complete - Thank You!', 'Robert, Your office renovation is complete. Invoice attached. Thank you for choosing CD Home Improvements!', now() - interval '5 days', now() - interval '5 days', now() - interval '4 days', 'delivered', now() - interval '5 days', now() - interval '5 days');

-- ==============================================================================
-- Test Photos
-- ==============================================================================

INSERT INTO photos (photo_id, job_id, property_id, category, description, file_url, thumbnail_url, taken_at, uploaded_by, created_at, updated_at) VALUES
  ('ph111111-1111-1111-1111-111111111111', 'j1111111-1111-1111-1111-111111111111', 'p1111111-1111-1111-1111-111111111111', 'before', 'Old deck before demolition - front view', 'https://placeholder.com/deck-before-1.jpg', 'https://placeholder.com/deck-before-1-thumb.jpg', now() - interval '6 days', 'System', now() - interval '6 days', now() - interval '6 days'),
  ('ph222222-2222-2222-2222-222222222222', 'j1111111-1111-1111-1111-111111111111', 'p1111111-1111-1111-1111-111111111111', 'progress', 'Framing in progress', 'https://placeholder.com/deck-progress-1.jpg', 'https://placeholder.com/deck-progress-1-thumb.jpg', now() - interval '2 days', 'System', now() - interval '2 days', now() - interval '2 days'),
  ('ph333333-3333-3333-3333-333333333333', 'j3333333-3333-3333-3333-333333333333', 'p3333333-3333-3333-3333-333333333333', 'after', 'Completed office renovation', 'https://placeholder.com/office-after-1.jpg', 'https://placeholder.com/office-after-1-thumb.jpg', now() - interval '5 days', 'System', now() - interval '5 days', now() - interval '5 days');

-- ==============================================================================
-- Test Tasks
-- ==============================================================================

INSERT INTO tasks (task_id, job_id, title, description, assigned_to, due_date, priority, status, created_at, updated_at) VALUES
  ('t1111111-1111-1111-1111-111111111111', 'j1111111-1111-1111-1111-111111111111', 'Order composite decking materials', 'Order Trex decking boards - 300 sq ft, color: Spiced Rum', 'David', now() - interval '4 days', 'high', 'completed', now() - interval '7 days', now() - interval '4 days'),
  ('t2222222-2222-2222-2222-222222222222', 'j1111111-1111-1111-1111-111111111111', 'Schedule railing installation', 'Coordinate with railing subcontractor for installation', 'Maria', now() + interval '5 days', 'medium', 'pending', now() - interval '3 days', now() - interval '3 days'),
  ('t3333333-3333-3333-3333-333333333333', 'j2222222-2222-2222-2222-222222222222', 'Order kitchen cabinets', 'Place custom cabinet order with manufacturer - 6 week lead time', 'David', now() - interval '1 day', 'high', 'in_progress', now() - interval '5 days', now()),
  ('t4444444-4444-4444-4444-444444444444', 'j4444444-4444-4444-4444-444444444444', 'Pick up flooring', 'Pick up LVP flooring from supplier', 'Carlos', now() + interval '1 day', 'medium', 'pending', now() - interval '2 days', now() - interval '2 days');

-- ==============================================================================
-- Test Webhook DLQ Events
-- ==============================================================================

INSERT INTO webhook_event_dlq (event_id, event_source, event_type, payload, error_message, received_at, replayed_at, replay_count, created_at, updated_at) VALUES
  ('we111111-1111-1111-1111-111111111111', 'stripe', 'payment_intent.succeeded', '{"id":"pi_test_123","amount":8930,"currency":"usd"}', 'Database connection timeout', now() - interval '12 hours', NULL, 0, now() - interval '12 hours', now() - interval '12 hours'),
  ('we222222-2222-2222-2222-222222222222', 'invoiceninja', 'invoice.created', '{"invoice_id":"inv_456","total":5196}', 'Client not found in database', now() - interval '6 hours', now() - interval '2 hours', 1, now() - interval '6 hours', now() - interval '2 hours');

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
-- SELECT 'Invoices', COUNT(*) FROM invoices
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
