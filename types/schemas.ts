// Zod validation schemas for API requests
import { z } from 'zod';

// ===== Lead Submission Schema =====
export const LeadSubmissionSchema = z.object({
  // Client information
  first_name: z.string().min(1, 'First name is required').max(100),
  last_name: z.string().max(100).optional(),
  company: z.string().max(200).optional(),
  email: z.string().email('Valid email is required'),
  phone: z.string().regex(/^[\d\s\-\(\)\+]+$/, 'Invalid phone number').optional(),
  sms_opt_in: z.boolean().default(false),

  // Property information
  address1: z.string().min(1, 'Street address is required').max(200),
  address2: z.string().max(200).optional(),
  city: z.string().min(1, 'City is required').max(100),
  state: z.string().length(2, 'State must be 2 characters').toUpperCase(),
  zip: z.string().regex(/^\d{5}(-\d{4})?$/, 'Invalid ZIP code'),

  // Lead details
  service_type: z.string().optional(), // 'kitchen', 'bathroom', 'deck', 'windows', etc.
  intake_notes: z.string().max(2000).optional(),
  budget_min: z.number().nonnegative().optional(),
  budget_max: z.number().nonnegative().optional(),
  source: z.string().max(100).optional(),
  channel: z.string().default('web'),
});

export type LeadSubmissionInput = z.infer<typeof LeadSubmissionSchema>;

// ===== Stripe Webhook Event Schema =====
export const StripeWebhookSchema = z.object({
  id: z.string(), // event ID (e.g., evt_xxx)
  type: z.string(), // event type (e.g., payment_intent.succeeded)
  data: z.object({
    object: z.any(), // The actual Stripe object (payment_intent, charge, etc.)
  }),
  created: z.number(), // Unix timestamp
  livemode: z.boolean(),
});

export type StripeWebhookEvent = z.infer<typeof StripeWebhookSchema>;

// ===== Invoice Ninja Webhook Schema =====
export const InvoiceNinjaWebhookSchema = z.object({
  event: z.string(), // e.g., 'quote.approved', 'invoice.paid'
  entity_id: z.string(),
  entity_type: z.string(), // 'quote', 'invoice', 'payment'
  data: z.any(), // Full entity object from Invoice Ninja
  timestamp: z.string().datetime().optional(),
});

export type InvoiceNinjaWebhookEvent = z.infer<typeof InvoiceNinjaWebhookSchema>;

// ===== DLQ Replay Request Schema =====
export const DLQReplaySchema = z.object({
  event_id: z.string().uuid('Invalid event ID'),
  force: z.boolean().default(false), // Force replay even if already processed
});

export type DLQReplayRequest = z.infer<typeof DLQReplaySchema>;

// ===== Payment Upsert Schema (internal use) =====
export const PaymentUpsertSchema = z.object({
  external_id: z.string(), // Stripe payment_intent ID
  invoice_id: z.string().uuid().optional().nullable(),
  method: z.enum(['card', 'ach', 'cash', 'check']).optional().nullable(),
  amount: z.number().positive(),
  currency: z.string().length(3).default('USD'),
  paid_at: z.string().datetime().optional().nullable(),
  status: z.enum(['unapplied', 'applied', 'failed', 'refunded']).default('applied'),
  raw_event: z.any().optional().nullable(),
});

export type PaymentUpsertInput = z.infer<typeof PaymentUpsertSchema>;

// ===== Client Creation Schema =====
export const ClientCreateSchema = z.object({
  first_name: z.string().min(1).max(100),
  last_name: z.string().max(100).optional().nullable(),
  company: z.string().max(200).optional().nullable(),
  email: z.string().email(),
  phone: z.string().max(20).optional().nullable(),
  sms_opt_in: z.boolean().default(false),
});

export type ClientCreateInput = z.infer<typeof ClientCreateSchema>;

// ===== Property Creation Schema =====
export const PropertyCreateSchema = z.object({
  client_id: z.string().uuid(),
  address1: z.string().min(1).max(200),
  address2: z.string().max(200).optional().nullable(),
  city: z.string().min(1).max(100),
  state: z.string().length(2).toUpperCase(),
  zip: z.string().regex(/^\d{5}(-\d{4})?$/),
  lat: z.number().optional().nullable(),
  lng: z.number().optional().nullable(),
});

export type PropertyCreateInput = z.infer<typeof PropertyCreateSchema>;

// ===== Estimate Update Schema =====
export const EstimateUpdateSchema = z.object({
  external_id: z.string().optional().nullable(),
  external_number: z.string().optional().nullable(),
  status: z.enum(['draft', 'sent', 'approved', 'declined', 'converted']).optional(),
});

export type EstimateUpdateInput = z.infer<typeof EstimateUpdateSchema>;

// ===== Invoice Update Schema =====
export const InvoiceUpdateSchema = z.object({
  external_id: z.string().optional().nullable(),
  external_number: z.string().optional().nullable(),
  status: z.enum(['draft', 'sent', 'viewed', 'partial', 'paid', 'void', 'uncollectible']).optional(),
  due_date: z.string().date().optional().nullable(),
});

export type InvoiceUpdateInput = z.infer<typeof InvoiceUpdateSchema>;

// ===== Contact Form Schema (Alternative lead form) =====
export const ContactFormSchema = z.object({
  name: z.string().min(1, 'Name is required').max(200),
  email: z.string().email('Valid email is required'),
  phone: z.string().optional(),
  message: z.string().min(1, 'Message is required').max(2000),
  service_interest: z.string().optional(),
});

export type ContactFormInput = z.infer<typeof ContactFormSchema>;

// ===== Error Response Schema =====
export const ErrorResponseSchema = z.object({
  error: z.string(),
  message: z.string(),
  details: z.any().optional(),
  timestamp: z.string().datetime().default(() => new Date().toISOString()),
});

export type ErrorResponse = z.infer<typeof ErrorResponseSchema>;

// ===== Success Response Schema =====
export const SuccessResponseSchema = z.object({
  success: z.boolean().default(true),
  message: z.string().optional(),
  data: z.any().optional(),
  timestamp: z.string().datetime().default(() => new Date().toISOString()),
});

export type SuccessResponse = z.infer<typeof SuccessResponseSchema>;
