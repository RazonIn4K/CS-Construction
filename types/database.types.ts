// Auto-generated TypeScript types from cdhi_supabase_schema.sql
// Generated: 2025-10-28

// ===== Enums =====
export type LeadStatus = 'new' | 'contacted' | 'qualified' | 'quoted' | 'won' | 'lost';
export type JobStatus = 'lead' | 'pending' | 'active' | 'on_hold' | 'complete' | 'closed';
export type JobPhase = 'intake' | 'estimate' | 'contract' | 'deposit' | 'construction' | 'inspection' | 'final_invoice' | 'closed';
export type EstimateStatus = 'draft' | 'sent' | 'approved' | 'declined' | 'converted';
export type ChangeOrderStatus = 'draft' | 'sent' | 'approved' | 'declined' | 'billed';
export type InvoiceStatus = 'draft' | 'sent' | 'viewed' | 'partial' | 'paid' | 'void' | 'uncollectible';
export type PaymentStatus = 'unapplied' | 'applied' | 'failed' | 'refunded';
export type PaymentMethod = 'card' | 'ach' | 'cash' | 'check';
export type CommunicationChannel = 'email' | 'sms' | 'call' | 'note';

// ===== Core Tables =====

export interface Client {
  client_id: string;
  first_name: string;
  last_name: string | null;
  company: string | null;
  email: string;
  phone: string | null;
  sms_opt_in: boolean;
  created_at: string;
  updated_at: string;
}

export interface ClientInsert {
  client_id?: string;
  first_name: string;
  last_name?: string | null;
  company?: string | null;
  email: string;
  phone?: string | null;
  sms_opt_in?: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface ClientUpdate {
  first_name?: string;
  last_name?: string | null;
  company?: string | null;
  email?: string;
  phone?: string | null;
  sms_opt_in?: boolean;
  updated_at?: string;
}

export interface Property {
  property_id: string;
  client_id: string;
  address1: string;
  address2: string | null;
  city: string;
  state: string;
  zip: string;
  lat: number | null;
  lng: number | null;
  created_at: string;
}

export interface PropertyInsert {
  property_id?: string;
  client_id: string;
  address1: string;
  address2?: string | null;
  city: string;
  state: string;
  zip: string;
  lat?: number | null;
  lng?: number | null;
  created_at?: string;
}

export interface PropertyUpdate {
  client_id?: string;
  address1?: string;
  address2?: string | null;
  city?: string;
  state?: string;
  zip?: string;
  lat?: number | null;
  lng?: number | null;
}

export interface Lead {
  lead_id: string;
  client_id: string;
  property_id: string;
  channel: string;
  intake_notes: string | null;
  budget_min: number | null;
  budget_max: number | null;
  status: LeadStatus;
  source: string | null;
  created_at: string;
}

export interface LeadInsert {
  lead_id?: string;
  client_id: string;
  property_id: string;
  channel?: string;
  intake_notes?: string | null;
  budget_min?: number | null;
  budget_max?: number | null;
  status?: LeadStatus;
  source?: string | null;
  created_at?: string;
}

export interface LeadUpdate {
  client_id?: string;
  property_id?: string;
  channel?: string;
  intake_notes?: string | null;
  budget_min?: number | null;
  budget_max?: number | null;
  status?: LeadStatus;
  source?: string | null;
}

export interface Job {
  job_id: string;
  client_id: string;
  property_id: string | null;
  title: string;
  description: string | null;
  status: JobStatus;
  start_date: string | null;
  end_date: string | null;
  created_at: string;
}

export interface JobInsert {
  job_id?: string;
  client_id: string;
  property_id?: string | null;
  title: string;
  description?: string | null;
  status?: JobStatus;
  start_date?: string | null;
  end_date?: string | null;
  created_at?: string;
}

export interface JobUpdate {
  client_id?: string;
  property_id?: string | null;
  title?: string;
  description?: string | null;
  status?: JobStatus;
  start_date?: string | null;
  end_date?: string | null;
}

export interface JobPhaseRecord {
  id: string;
  job_id: string;
  phase: JobPhase;
  status: string;
  started_at: string | null;
  completed_at: string | null;
}

export interface JobPhaseInsert {
  id?: string;
  job_id: string;
  phase: JobPhase;
  status?: string;
  started_at?: string | null;
  completed_at?: string | null;
}

export interface JobPhaseUpdate {
  job_id?: string;
  phase?: JobPhase;
  status?: string;
  started_at?: string | null;
  completed_at?: string | null;
}

export interface Estimate {
  estimate_id: string;
  client_id: string;
  job_id: string | null;
  external_id: string | null;
  external_number: string | null;
  status: EstimateStatus;
  issue_date: string;
  valid_until: string | null;
  currency: string;
  terms: string | null;
  notes: string | null;
  created_at: string;
}

export interface EstimateInsert {
  estimate_id?: string;
  client_id: string;
  job_id?: string | null;
  external_id?: string | null;
  external_number?: string | null;
  status?: EstimateStatus;
  issue_date?: string;
  valid_until?: string | null;
  currency?: string;
  terms?: string | null;
  notes?: string | null;
  created_at?: string;
}

export interface EstimateUpdate {
  client_id?: string;
  job_id?: string | null;
  external_id?: string | null;
  external_number?: string | null;
  status?: EstimateStatus;
  issue_date?: string;
  valid_until?: string | null;
  currency?: string;
  terms?: string | null;
  notes?: string | null;
}

export interface EstimateItem {
  item_id: string;
  estimate_id: string;
  kind: string;
  name: string;
  description: string | null;
  quantity: number;
  unit_price: number;
  discount_percent: number;
  tax_percent: number;
  sort_order: number;
}

export interface EstimateItemInsert {
  item_id?: string;
  estimate_id: string;
  kind?: string;
  name: string;
  description?: string | null;
  quantity?: number;
  unit_price?: number;
  discount_percent?: number;
  tax_percent?: number;
  sort_order?: number;
}

export interface ChangeOrder {
  co_id: string;
  job_id: string;
  external_id: string | null;
  title: string;
  description: string | null;
  status: ChangeOrderStatus;
  amount: number;
  approved_at: string | null;
  created_at: string;
}

export interface ChangeOrderInsert {
  co_id?: string;
  job_id: string;
  external_id?: string | null;
  title: string;
  description?: string | null;
  status?: ChangeOrderStatus;
  amount?: number;
  approved_at?: string | null;
  created_at?: string;
}

export interface ChangeOrderUpdate {
  job_id?: string;
  external_id?: string | null;
  title?: string;
  description?: string | null;
  status?: ChangeOrderStatus;
  amount?: number;
  approved_at?: string | null;
}

export interface Invoice {
  invoice_id: string;
  client_id: string;
  job_id: string | null;
  change_order_id: string | null;
  external_id: string | null;
  external_number: string | null;
  status: InvoiceStatus;
  issue_date: string;
  due_date: string | null;
  currency: string;
  memo: string | null;
  created_at: string;
}

export interface InvoiceInsert {
  invoice_id?: string;
  client_id: string;
  job_id?: string | null;
  change_order_id?: string | null;
  external_id?: string | null;
  external_number?: string | null;
  status?: InvoiceStatus;
  issue_date?: string;
  due_date?: string | null;
  currency?: string;
  memo?: string | null;
  created_at?: string;
}

export interface InvoiceUpdate {
  client_id?: string;
  job_id?: string | null;
  change_order_id?: string | null;
  external_id?: string | null;
  external_number?: string | null;
  status?: InvoiceStatus;
  issue_date?: string;
  due_date?: string | null;
  currency?: string;
  memo?: string | null;
}

export interface InvoiceItem {
  item_id: string;
  invoice_id: string;
  kind: string;
  name: string;
  description: string | null;
  quantity: number;
  unit_price: number;
  discount_percent: number;
  tax_percent: number;
  sort_order: number;
}

export interface InvoiceItemInsert {
  item_id?: string;
  invoice_id: string;
  kind?: string;
  name: string;
  description?: string | null;
  quantity?: number;
  unit_price?: number;
  discount_percent?: number;
  tax_percent?: number;
  sort_order?: number;
}

export interface Payment {
  payment_id: string;
  invoice_id: string | null;
  external_id: string | null;
  method: string | null;
  amount: number;
  currency: string;
  paid_at: string | null;
  status: PaymentStatus;
  raw_event: any | null; // jsonb
  created_at: string;
}

export interface PaymentInsert {
  payment_id?: string;
  invoice_id?: string | null;
  external_id?: string | null;
  method?: string | null;
  amount: number;
  currency?: string;
  paid_at?: string | null;
  status?: PaymentStatus;
  raw_event?: any | null;
  created_at?: string;
}

export interface PaymentUpdate {
  invoice_id?: string | null;
  external_id?: string | null;
  method?: string | null;
  amount?: number;
  currency?: string;
  paid_at?: string | null;
  status?: PaymentStatus;
  raw_event?: any | null;
}

export interface Communication {
  id: string;
  client_id: string | null;
  job_id: string | null;
  channel: string | null;
  subject: string | null;
  body: string | null;
  sent_at: string;
}

export interface CommunicationInsert {
  id?: string;
  client_id?: string | null;
  job_id?: string | null;
  channel?: string | null;
  subject?: string | null;
  body?: string | null;
  sent_at?: string;
}

export interface Photo {
  photo_id: string;
  job_id: string;
  url: string;
  caption: string | null;
  created_at: string;
}

export interface PhotoInsert {
  photo_id?: string;
  job_id: string;
  url: string;
  caption?: string | null;
  created_at?: string;
}

export interface Task {
  task_id: string;
  job_id: string | null;
  title: string;
  status: string;
  due_date: string | null;
  created_at: string;
}

export interface TaskInsert {
  task_id?: string;
  job_id?: string | null;
  title: string;
  status?: string;
  due_date?: string | null;
  created_at?: string;
}

export interface TaskUpdate {
  job_id?: string | null;
  title?: string;
  status?: string;
  due_date?: string | null;
}

// ===== Views =====

export interface InvoiceSummary {
  invoice_id: string;
  client_id: string;
  line_total: number;
  paid_total: number;
  balance_due: number;
}

export interface ClientAR {
  client_id: string;
  first_name: string;
  last_name: string | null;
  ar_balance: number;
}

// ===== Database Type (for Supabase Client) =====

export interface Database {
  public: {
    Tables: {
      clients: {
        Row: Client;
        Insert: ClientInsert;
        Update: ClientUpdate;
      };
      properties: {
        Row: Property;
        Insert: PropertyInsert;
        Update: PropertyUpdate;
      };
      leads: {
        Row: Lead;
        Insert: LeadInsert;
        Update: LeadUpdate;
      };
      jobs: {
        Row: Job;
        Insert: JobInsert;
        Update: JobUpdate;
      };
      job_phases: {
        Row: JobPhaseRecord;
        Insert: JobPhaseInsert;
        Update: JobPhaseUpdate;
      };
      estimates: {
        Row: Estimate;
        Insert: EstimateInsert;
        Update: EstimateUpdate;
      };
      estimate_items: {
        Row: EstimateItem;
        Insert: EstimateItemInsert;
        Update: Partial<EstimateItem>;
      };
      change_orders: {
        Row: ChangeOrder;
        Insert: ChangeOrderInsert;
        Update: ChangeOrderUpdate;
      };
      invoices: {
        Row: Invoice;
        Insert: InvoiceInsert;
        Update: InvoiceUpdate;
      };
      invoice_items: {
        Row: InvoiceItem;
        Insert: InvoiceItemInsert;
        Update: Partial<InvoiceItem>;
      };
      payments: {
        Row: Payment;
        Insert: PaymentInsert;
        Update: PaymentUpdate;
      };
      communications: {
        Row: Communication;
        Insert: CommunicationInsert;
        Update: Partial<Communication>;
      };
      photos: {
        Row: Photo;
        Insert: PhotoInsert;
        Update: Partial<Photo>;
      };
      tasks: {
        Row: Task;
        Insert: TaskInsert;
        Update: TaskUpdate;
      };
    };
    Views: {
      v_invoice_summary: {
        Row: InvoiceSummary;
      };
      v_client_ar: {
        Row: ClientAR;
      };
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      lead_status: LeadStatus;
      job_status: JobStatus;
      job_phase: JobPhase;
      estimate_status: EstimateStatus;
      change_order_status: ChangeOrderStatus;
      invoice_status: InvoiceStatus;
      payment_status: PaymentStatus;
    };
  };
}
