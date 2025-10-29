/**
 * ==============================================================================
 * Invoice Ninja Webhook Handler
 * ==============================================================================
 * Handles webhooks from Invoice Ninja for:
 * - Quote approved/rejected (trigger invoice creation)
 * - Invoice created (sync to Supabase)
 * - Invoice updated (status changes)
 * - Payment received (update payment status)
 *
 * Invoice Ninja webhook configuration:
 * 1. Settings → Webhooks → New Webhook
 * 2. Target URL: https://cdhomeimprovementsrockford.com/api/webhooks/invoiceninja
 * 3. Events: quote.approved, invoice.created, invoice.updated, payment.created
 * 4. Secret: Set INVOICENINJA_WEBHOOK_SECRET in .env
 * ==============================================================================
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireAdminClient } from '@/lib/supabase';
import { logger } from '@/lib/logger';
import crypto from 'crypto';

// ==============================================================================
// Types
// ==============================================================================

interface InvoiceNinjaWebhookPayload {
  event: string;
  quote?: InvoiceNinjaQuote;
  invoice?: InvoiceNinjaInvoice;
  payment?: InvoiceNinjaPayment;
  client?: InvoiceNinjaClient;
}

interface InvoiceNinjaQuote {
  id: string;
  number: string;
  client_id: string;
  status_id: string;
  amount: number;
  balance: number;
  date: string;
  due_date: string;
  public_notes?: string;
  private_notes?: string;
}

interface InvoiceNinjaInvoice {
  id: string;
  number: string;
  client_id: string;
  status_id: string;
  amount: number;
  balance: number;
  date: string;
  due_date: string;
  public_notes?: string;
  private_notes?: string;
  quote_id?: string;
}

interface InvoiceNinjaPayment {
  id: string;
  invoice_id: string;
  amount: number;
  transaction_reference?: string;
  date: string;
  type_id: string;
}

interface InvoiceNinjaClient {
  id: string;
  name: string;
  email?: string;
  phone?: string;
}

// Status ID mapping (Invoice Ninja uses numeric status IDs)
const QUOTE_STATUS = {
  DRAFT: '1',
  SENT: '2',
  APPROVED: '3',
  EXPIRED: '4',
  CONVERTED: '-2',
};

const INVOICE_STATUS = {
  DRAFT: '1',
  SENT: '2',
  PARTIAL: '3',
  PAID: '4',
  CANCELLED: '5',
  REVERSED: '6',
};

// ==============================================================================
// Webhook Signature Verification
// ==============================================================================

/**
 * Verify Invoice Ninja webhook signature
 * Invoice Ninja signs webhooks with HMAC-SHA256
 */
function verifyInvoiceNinjaWebhook(
  body: string,
  signature: string | null
): boolean {
  const secret = process.env.INVOICENINJA_WEBHOOK_SECRET;

  if (!secret) {
    logger.warn('INVOICENINJA_WEBHOOK_SECRET not configured', {
      context: 'webhook_verification',
    });
    return false;
  }

  if (!signature) {
    logger.warn('Missing X-Ninja-Signature header', {
      context: 'webhook_verification',
    });
    return false;
  }

  try {
    const hmac = crypto.createHmac('sha256', secret);
    hmac.update(body);
    const expectedSignature = hmac.digest('hex');

    // Constant-time comparison to prevent timing attacks
    return crypto.timingSafeEqual(
      Buffer.from(signature),
      Buffer.from(expectedSignature)
    );
  } catch (error) {
    logger.error('Webhook signature verification failed', {
      context: 'webhook_verification',
      error,
    });
    return false;
  }
}

// ==============================================================================
// Event Handlers
// ==============================================================================

/**
 * Handle quote.approved event
 * When a quote is approved, sync the status to Supabase
 */
async function handleQuoteApproved(payload: InvoiceNinjaWebhookPayload) {
  const adminDb = requireAdminClient();
  const quote = payload.quote;
  if (!quote) {
    logger.warn('Quote data missing in quote.approved event', { payload });
    return;
  }

  logger.info('Processing quote.approved event', {
    quote_id: quote.id,
    quote_number: quote.number,
  });

  try {
    // Find the estimate in Supabase by external_id (Invoice Ninja quote ID)
    const { data: estimate, error: findError } = await adminDb
      .from('estimates')
      .select('estimate_id, job_id, client_id')
      .eq('external_id', quote.id)
      .single();

    if (findError || !estimate) {
      logger.warn('Estimate not found for Invoice Ninja quote', {
        quote_id: quote.id,
        error: findError,
      });
      return;
    }

    // Update estimate status to approved
    const { error: updateError } = await adminDb
      .from('estimates')
      .update({
        status: 'approved',
        approved_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('estimate_id', estimate.estimate_id);

    if (updateError) {
      logger.error('Failed to update estimate status', {
        estimate_id: estimate.estimate_id,
        error: updateError,
      });
      return;
    }

    logger.info('Estimate marked as approved', {
      estimate_id: estimate.estimate_id,
      quote_id: quote.id,
    });

    // Note: Invoice creation should be handled by Invoice Ninja automatically
    // or by n8n workflow that monitors quote approval
  } catch (error) {
    logger.error('Error handling quote.approved event', {
      quote_id: quote?.id,
      error,
    });
  }
}

/**
 * Handle invoice.created event
 * Sync new invoices to Supabase
 */
async function handleInvoiceCreated(payload: InvoiceNinjaWebhookPayload) {
  const adminDb = requireAdminClient();
  const invoice = payload.invoice;
  if (!invoice) {
    logger.warn('Invoice data missing in invoice.created event', { payload });
    return;
  }

  logger.info('Processing invoice.created event', {
    invoice_id: invoice.id,
    invoice_number: invoice.number,
  });

  try {
    // Check if invoice already exists (idempotency)
    const { data: existingInvoice } = await adminDb
      .from('invoices')
      .select('invoice_id')
      .eq('external_id', invoice.id)
      .single();

    if (existingInvoice) {
      logger.info('Invoice already exists in Supabase', {
        invoice_id: invoice.id,
        supabase_invoice_id: existingInvoice.invoice_id,
      });
      return;
    }

    // Find the job by external_id (if invoice is linked to a quote)
    let jobId: string | null = null;
    let clientId: string | null = null;

    if (invoice.quote_id) {
      const { data: estimate } = await adminDb
        .from('estimates')
        .select('job_id, client_id')
        .eq('external_id', invoice.quote_id)
        .single();

      if (estimate) {
        jobId = estimate.job_id;
        clientId = estimate.client_id;
      }
    }

    // If no job found via quote, try to find client by Invoice Ninja client_id
    if (!clientId && payload.client?.email) {
      const { data: client } = await adminDb
        .from('clients')
        .select('client_id')
        .eq('email', payload.client.email)
        .single();

      if (client) {
        clientId = client.client_id;
      }
    }

    if (!clientId) {
      logger.warn('Cannot create invoice without client_id', {
        invoice_id: invoice.id,
      });
      return;
    }

    // Map Invoice Ninja status to our enum
    const statusMapping: Record<string, string> = {
      [INVOICE_STATUS.DRAFT]: 'DRAFT',
      [INVOICE_STATUS.SENT]: 'SENT',
      [INVOICE_STATUS.PARTIAL]: 'PARTIALLY_PAID',
      [INVOICE_STATUS.PAID]: 'PAID',
      [INVOICE_STATUS.CANCELLED]: 'VOID',
    };

    const status = statusMapping[invoice.status_id] || 'DRAFT';

    // Insert invoice into Supabase
    const { error: insertError } = await adminDb.from('invoices').insert({
      job_id: jobId,
      client_id: clientId,
      external_id: invoice.id,
      invoice_number: invoice.number,
      issue_date: invoice.date,
      due_date: invoice.due_date,
      subtotal: invoice.amount,
      tax_amount: 0, // Invoice Ninja doesn't separate tax in webhook
      total_amount: invoice.amount,
      balance_due: invoice.balance,
      status: status as any,
      notes: invoice.public_notes || null,
      internal_notes: invoice.private_notes || null,
    });

    if (insertError) {
      logger.error('Failed to insert invoice', {
        invoice_id: invoice.id,
        error: insertError,
      });
      return;
    }

    logger.info('Invoice synced to Supabase', {
      invoice_id: invoice.id,
      invoice_number: invoice.number,
    });
  } catch (error) {
    logger.error('Error handling invoice.created event', {
      invoice_id: invoice?.id,
      error,
    });
  }
}

/**
 * Handle invoice.updated event
 * Sync invoice status changes to Supabase
 */
async function handleInvoiceUpdated(payload: InvoiceNinjaWebhookPayload) {
  const adminDb = requireAdminClient();
  const invoice = payload.invoice;
  if (!invoice) {
    logger.warn('Invoice data missing in invoice.updated event', { payload });
    return;
  }

  logger.info('Processing invoice.updated event', {
    invoice_id: invoice.id,
    invoice_number: invoice.number,
  });

  try {
    // Find invoice in Supabase
    const { data: existingInvoice, error: findError } = await adminDb
      .from('invoices')
      .select('invoice_id, status')
      .eq('external_id', invoice.id)
      .single();

    if (findError || !existingInvoice) {
      logger.warn('Invoice not found in Supabase', {
        invoice_id: invoice.id,
        error: findError,
      });
      return;
    }

    // Map status
    const statusMapping: Record<string, string> = {
      [INVOICE_STATUS.DRAFT]: 'DRAFT',
      [INVOICE_STATUS.SENT]: 'SENT',
      [INVOICE_STATUS.PARTIAL]: 'PARTIALLY_PAID',
      [INVOICE_STATUS.PAID]: 'PAID',
      [INVOICE_STATUS.CANCELLED]: 'VOID',
    };

    const newStatus = statusMapping[invoice.status_id] || 'DRAFT';

    // Update invoice in Supabase
    const { error: updateError } = await adminDb
      .from('invoices')
      .update({
        status: newStatus as any,
        balance_due: invoice.balance,
        updated_at: new Date().toISOString(),
        paid_at:
          newStatus === 'PAID' && !existingInvoice.status.includes('PAID')
            ? new Date().toISOString()
            : undefined,
      })
      .eq('invoice_id', existingInvoice.invoice_id);

    if (updateError) {
      logger.error('Failed to update invoice', {
        invoice_id: invoice.id,
        error: updateError,
      });
      return;
    }

    logger.info('Invoice status updated', {
      invoice_id: invoice.id,
      old_status: existingInvoice.status,
      new_status: newStatus,
    });
  } catch (error) {
    logger.error('Error handling invoice.updated event', {
      invoice_id: invoice?.id,
      error,
    });
  }
}

/**
 * Handle payment.created event
 * Sync payments to Supabase
 */
async function handlePaymentCreated(payload: InvoiceNinjaWebhookPayload) {
  const adminDb = requireAdminClient();
  const payment = payload.payment;
  if (!payment) {
    logger.warn('Payment data missing in payment.created event', { payload });
    return;
  }

  logger.info('Processing payment.created event', {
    payment_id: payment.id,
    invoice_id: payment.invoice_id,
    amount: payment.amount,
  });

  try {
    // Find invoice in Supabase
    const { data: invoice, error: findError } = await adminDb
      .from('invoices')
      .select('invoice_id, client_id, job_id')
      .eq('external_id', payment.invoice_id)
      .single();

    if (findError || !invoice) {
      logger.warn('Invoice not found for payment', {
        payment_id: payment.id,
        invoice_id: payment.invoice_id,
        error: findError,
      });
      return;
    }

    // Check if payment already exists (idempotency)
    const { data: existingPayment } = await adminDb
      .from('payments')
      .select('payment_id')
      .eq('external_id', payment.id)
      .single();

    if (existingPayment) {
      logger.info('Payment already exists in Supabase', {
        payment_id: payment.id,
        supabase_payment_id: existingPayment.payment_id,
      });
      return;
    }

    // Insert payment
    const { error: insertError } = await adminDb.from('payments').insert({
      invoice_id: invoice.invoice_id,
      external_id: payment.id,
      amount: payment.amount,
      method: 'card', // Default, can be refined
      paid_at: payment.date,
      status: 'applied',
    });

    if (insertError) {
      logger.error('Failed to insert payment', {
        payment_id: payment.id,
        error: insertError,
      });
      return;
    }

    logger.info('Payment synced to Supabase', {
      payment_id: payment.id,
      invoice_id: invoice.invoice_id,
      amount: payment.amount,
    });

    // Note: Invoice status update should be handled by invoice.updated event
  } catch (error) {
    logger.error('Error handling payment.created event', {
      payment_id: payment?.id,
      error,
    });
  }
}

// ==============================================================================
// Main Handler
// ==============================================================================

export async function POST(request: NextRequest) {
  const adminDb = requireAdminClient();
  let rawBody = '';

  try {
    // Read raw body for signature verification
    rawBody = await request.text();

    // Verify webhook signature
    const signature = request.headers.get('x-ninja-signature');

    if (process.env.NODE_ENV === 'production') {
      const isValid = verifyInvoiceNinjaWebhook(rawBody, signature);
      if (!isValid) {
        logger.warn('Invalid Invoice Ninja webhook signature', {
          has_signature: !!signature,
        });
        return NextResponse.json(
          { error: 'Invalid signature' },
          { status: 401 }
        );
      }
    }

    // Parse payload
    const payload: InvoiceNinjaWebhookPayload = JSON.parse(rawBody);

    logger.info('Invoice Ninja webhook received', {
      event: payload.event,
      has_quote: !!payload.quote,
      has_invoice: !!payload.invoice,
      has_payment: !!payload.payment,
    });

    // Route to appropriate handler
    switch (payload.event) {
      case 'quote.approved':
        await handleQuoteApproved(payload);
        break;

      case 'invoice.created':
        await handleInvoiceCreated(payload);
        break;

      case 'invoice.updated':
        await handleInvoiceUpdated(payload);
        break;

      case 'payment.created':
        await handlePaymentCreated(payload);
        break;

      default:
        logger.info('Unhandled Invoice Ninja webhook event', {
          event: payload.event,
        });
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    logger.error('Error processing Invoice Ninja webhook', {
      error,
      raw_body: rawBody.substring(0, 500), // Log first 500 chars for debugging
    });

    // Return 200 to prevent Invoice Ninja from retrying
    // Log error to DLQ for manual review
    try {
      await adminDb.from('webhook_event_dlq').insert({
        event_source: 'invoiceninja',
        event_type: 'unknown',
        payload: rawBody,
        error_message: error instanceof Error ? error.message : String(error),
        received_at: new Date().toISOString(),
      });
    } catch (dlqError) {
      logger.error('Failed to write to DLQ', { error: dlqError });
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
