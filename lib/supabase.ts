// Supabase client configuration
import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/types/database.types';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl) {
  throw new Error('Missing environment variable: SUPABASE_URL');
}

if (!supabaseAnonKey) {
  throw new Error('Missing environment variable: SUPABASE_ANON_KEY');
}

/**
 * Public Supabase client for client-side use and general API operations
 * Uses the anon key with Row Level Security (RLS) enforced
 */
export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
});

/**
 * Service role client for server-side operations that bypass RLS
 * Only use this for admin operations and server-side logic
 * NEVER expose this client to the browser
 */
export const supabaseAdmin = supabaseServiceRoleKey
  ? createClient<Database>(supabaseUrl, supabaseServiceRoleKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    })
  : null;

/**
 * Helper to ensure service role client is available
 */
export function requireAdminClient() {
  if (!supabaseAdmin) {
    throw new Error('Supabase service role client not configured. Missing SUPABASE_SERVICE_ROLE_KEY.');
  }
  return supabaseAdmin;
}

/**
 * Type-safe database query helpers
 */
export const db = {
  clients: () => supabase.from('clients'),
  properties: () => supabase.from('properties'),
  leads: () => supabase.from('leads'),
  jobs: () => supabase.from('jobs'),
  jobPhases: () => supabase.from('job_phases'),
  estimates: () => supabase.from('estimates'),
  estimateItems: () => supabase.from('estimate_items'),
  changeOrders: () => supabase.from('change_orders'),
  invoices: () => supabase.from('invoices'),
  invoiceItems: () => supabase.from('invoice_items'),
  payments: () => supabase.from('payments'),
  communications: () => supabase.from('communications'),
  photos: () => supabase.from('photos'),
  tasks: () => supabase.from('tasks'),
  // Views
  invoiceSummary: () => supabase.from('v_invoice_summary'),
  clientAR: () => supabase.from('v_client_ar'),
};

/**
 * Admin database query helpers (bypass RLS)
 */
export const adminDb = {
  clients: () => requireAdminClient().from('clients'),
  properties: () => requireAdminClient().from('properties'),
  leads: () => requireAdminClient().from('leads'),
  jobs: () => requireAdminClient().from('jobs'),
  jobPhases: () => requireAdminClient().from('job_phases'),
  estimates: () => requireAdminClient().from('estimates'),
  estimateItems: () => requireAdminClient().from('estimate_items'),
  changeOrders: () => requireAdminClient().from('change_orders'),
  invoices: () => requireAdminClient().from('invoices'),
  invoiceItems: () => requireAdminClient().from('invoice_items'),
  payments: () => requireAdminClient().from('payments'),
  communications: () => requireAdminClient().from('communications'),
  photos: () => requireAdminClient().from('photos'),
  tasks: () => requireAdminClient().from('tasks'),
  // Views
  invoiceSummary: () => requireAdminClient().from('v_invoice_summary'),
  clientAR: () => requireAdminClient().from('v_client_ar'),
};
