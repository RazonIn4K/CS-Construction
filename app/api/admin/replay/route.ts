/**
 * ==============================================================================
 * Dead Letter Queue (DLQ) Replay Handler
 * ==============================================================================
 * Admin-only endpoint to replay failed webhook events from the DLQ
 *
 * Usage:
 *   POST /api/admin/replay
 *   Authorization: Bearer <ADMIN_API_KEY>
 *   Body: { "event_id": "uuid-from-dlq", "force": false }
 *
 * This route allows replaying events that failed to process initially due to:
 * - Database unavailability
 * - Network timeouts
 * - Temporary service disruptions
 * - Invalid data (after manual correction)
 *
 * Security:
 * - Requires ADMIN_API_KEY environment variable
 * - Should be protected by firewall/IP whitelist in production
 * ==============================================================================
 */

import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin as adminDb } from '@/lib/supabase';
import { logger } from '@/lib/logger';
import { z } from 'zod';
import Stripe from 'stripe';
import { verifyStripeWebhook } from '@/lib/stripe';

// ==============================================================================
// Types & Validation
// ==============================================================================

const ReplayRequestSchema = z.object({
  event_id: z.string().uuid('Invalid event ID format'),
  force: z.boolean().optional().default(false), // Force replay even if already replayed
});

type ReplayRequest = z.infer<typeof ReplayRequestSchema>;

interface DLQEvent {
  event_id: string;
  event_source: string;
  event_type: string;
  payload: any;
  error_message: string;
  received_at: string;
  replayed_at: string | null;
  replay_count: number;
}

// ==============================================================================
// Authentication
// ==============================================================================

/**
 * Verify admin API key from Authorization header
 */
function verifyAdminAuth(request: NextRequest): boolean {
  const adminApiKey = process.env.ADMIN_API_KEY;

  if (!adminApiKey) {
    logger.error('ADMIN_API_KEY not configured', {
      context: 'admin_auth',
    });
    return false;
  }

  const authHeader = request.headers.get('authorization');

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    logger.warn('Missing or invalid Authorization header', {
      context: 'admin_auth',
      has_header: !!authHeader,
    });
    return false;
  }

  const providedKey = authHeader.substring(7); // Remove "Bearer "

  // Constant-time comparison
  const expectedBuffer = Buffer.from(adminApiKey);
  const providedBuffer = Buffer.from(providedKey);

  if (expectedBuffer.length !== providedBuffer.length) {
    return false;
  }

  return crypto.timingSafeEqual(expectedBuffer, providedBuffer);
}

// ==============================================================================
// Replay Handlers by Source
// ==============================================================================

/**
 * Replay a Stripe webhook event
 */
async function replayStripeEvent(event: DLQEvent): Promise<void> {
  logger.info('Replaying Stripe event', {
    event_id: event.event_id,
    event_type: event.event_type,
  });

  try {
    // Parse the Stripe event from payload
    let stripeEvent: Stripe.Event;

    if (typeof event.payload === 'string') {
      stripeEvent = JSON.parse(event.payload);
    } else {
      stripeEvent = event.payload;
    }

    // Process the event based on type
    switch (stripeEvent.type) {
      case 'payment_intent.succeeded':
        await handleStripePaymentIntentSucceeded(stripeEvent);
        break;

      case 'payment_intent.payment_failed':
        await handleStripePaymentIntentFailed(stripeEvent);
        break;

      case 'charge.succeeded':
        await handleStripeChargeSucceeded(stripeEvent);
        break;

      case 'charge.refunded':
        await handleStripeChargeRefunded(stripeEvent);
        break;

      default:
        logger.warn('Unhandled Stripe event type in replay', {
          event_type: stripeEvent.type,
        });
    }

    logger.info('Stripe event replayed successfully', {
      event_id: event.event_id,
      stripe_event_id: stripeEvent.id,
    });
  } catch (error) {
    logger.error('Failed to replay Stripe event', {
      event_id: event.event_id,
      error,
    });
    throw error;
  }
}

/**
 * Replay an Invoice Ninja webhook event
 */
async function replayInvoiceNinjaEvent(event: DLQEvent): Promise<void> {
  logger.info('Replaying Invoice Ninja event', {
    event_id: event.event_id,
    event_type: event.event_type,
  });

  try {
    // Parse the Invoice Ninja event from payload
    let payload: any;

    if (typeof event.payload === 'string') {
      payload = JSON.parse(event.payload);
    } else {
      payload = event.payload;
    }

    // Process the event based on type
    switch (payload.event) {
      case 'quote.approved':
        await handleInvoiceNinjaQuoteApproved(payload);
        break;

      case 'invoice.created':
        await handleInvoiceNinjaInvoiceCreated(payload);
        break;

      case 'invoice.updated':
        await handleInvoiceNinjaInvoiceUpdated(payload);
        break;

      case 'payment.created':
        await handleInvoiceNinjaPaymentCreated(payload);
        break;

      default:
        logger.warn('Unhandled Invoice Ninja event type in replay', {
          event_type: payload.event,
        });
    }

    logger.info('Invoice Ninja event replayed successfully', {
      event_id: event.event_id,
      invoiceninja_event: payload.event,
    });
  } catch (error) {
    logger.error('Failed to replay Invoice Ninja event', {
      event_id: event.event_id,
      error,
    });
    throw error;
  }
}

// ==============================================================================
// Stripe Event Handlers (copied from webhook handler)
// ==============================================================================

async function handleStripePaymentIntentSucceeded(
  event: Stripe.Event
): Promise<void> {
  const paymentIntent = event.data.object as Stripe.PaymentIntent;

  const invoiceId = paymentIntent.metadata.invoice_id;
  if (!invoiceId) {
    throw new Error('invoice_id missing from payment intent metadata');
  }

  // Check for existing payment (idempotency)
  const { data: existingPayment } = await adminDb
    .from('payments')
    .select('payment_id')
    .eq('external_id', event.id)
    .single();

  if (existingPayment) {
    logger.info('Payment already exists (idempotent)', {
      payment_id: existingPayment.payment_id,
      stripe_event_id: event.id,
    });
    return;
  }

  // Get invoice details
  const { data: invoice, error: invoiceError } = await adminDb
    .from('invoices')
    .select('invoice_id, client_id, job_id')
    .eq('invoice_id', invoiceId)
    .single();

  if (invoiceError || !invoice) {
    throw new Error(`Invoice not found: ${invoiceId}`);
  }

  // Insert payment
  const { error: paymentError } = await adminDb.from('payments').insert({
    invoice_id: invoice.invoice_id,
    client_id: invoice.client_id,
    job_id: invoice.job_id,
    external_id: event.id,
    amount: paymentIntent.amount / 100, // Convert cents to dollars
    payment_method: 'CREDIT_CARD',
    payment_date: new Date(paymentIntent.created * 1000).toISOString(),
    transaction_id: paymentIntent.id,
    status: 'COMPLETED',
  });

  if (paymentError) {
    throw new Error(`Failed to insert payment: ${paymentError.message}`);
  }

  // Update invoice status to PAID
  const { error: updateError } = await adminDb
    .from('invoices')
    .update({
      status: 'PAID',
      paid_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('invoice_id', invoice.invoice_id);

  if (updateError) {
    throw new Error(`Failed to update invoice: ${updateError.message}`);
  }

  logger.info('Payment processed successfully', {
    invoice_id: invoice.invoice_id,
    amount: paymentIntent.amount / 100,
  });
}

async function handleStripePaymentIntentFailed(
  event: Stripe.Event
): Promise<void> {
  const paymentIntent = event.data.object as Stripe.PaymentIntent;

  logger.warn('Payment intent failed', {
    payment_intent_id: paymentIntent.id,
    last_payment_error: paymentIntent.last_payment_error?.message,
  });

  // Could trigger notification workflow here
}

async function handleStripeChargeSucceeded(event: Stripe.Event): Promise<void> {
  // Similar to payment_intent.succeeded but for direct charges
  logger.info('Charge succeeded', { event_id: event.id });
}

async function handleStripeChargeRefunded(event: Stripe.Event): Promise<void> {
  const charge = event.data.object as Stripe.Charge;

  logger.info('Processing charge refund', {
    charge_id: charge.id,
    amount_refunded: charge.amount_refunded,
  });

  // Find the payment by transaction_id
  const { data: payment } = await adminDb
    .from('payments')
    .select('payment_id, invoice_id, amount')
    .eq('transaction_id', charge.payment_intent as string)
    .single();

  if (!payment) {
    logger.warn('Payment not found for refund', { charge_id: charge.id });
    return;
  }

  // Update payment status
  const { error: updateError } = await adminDb
    .from('payments')
    .update({
      status: 'REFUNDED',
      updated_at: new Date().toISOString(),
    })
    .eq('payment_id', payment.payment_id);

  if (updateError) {
    throw new Error(`Failed to update payment: ${updateError.message}`);
  }

  logger.info('Payment marked as refunded', { payment_id: payment.payment_id });
}

// ==============================================================================
// Invoice Ninja Event Handlers (stubs - implement as needed)
// ==============================================================================

async function handleInvoiceNinjaQuoteApproved(payload: any): Promise<void> {
  logger.info('Processing replayed quote approval', { quote_id: payload.quote?.id });
  // Implementation would mirror /api/webhooks/invoiceninja handler
}

async function handleInvoiceNinjaInvoiceCreated(payload: any): Promise<void> {
  logger.info('Processing replayed invoice creation', { invoice_id: payload.invoice?.id });
  // Implementation would mirror /api/webhooks/invoiceninja handler
}

async function handleInvoiceNinjaInvoiceUpdated(payload: any): Promise<void> {
  logger.info('Processing replayed invoice update', { invoice_id: payload.invoice?.id });
  // Implementation would mirror /api/webhooks/invoiceninja handler
}

async function handleInvoiceNinjaPaymentCreated(payload: any): Promise<void> {
  logger.info('Processing replayed payment creation', { payment_id: payload.payment?.id });
  // Implementation would mirror /api/webhooks/invoiceninja handler
}

// ==============================================================================
// Main Handler
// ==============================================================================

export async function POST(request: NextRequest) {
  try {
    // Verify admin authentication
    if (!verifyAdminAuth(request)) {
      logger.warn('Unauthorized DLQ replay attempt', {
        ip: request.headers.get('x-forwarded-for') || 'unknown',
      });
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Parse and validate request body
    const body = await request.json();
    const validated = ReplayRequestSchema.parse(body);

    logger.info('DLQ replay requested', {
      event_id: validated.event_id,
      force: validated.force,
    });

    // Fetch event from DLQ
    const { data: event, error: fetchError } = await adminDb
      .from('webhook_event_dlq')
      .select('*')
      .eq('event_id', validated.event_id)
      .single();

    if (fetchError || !event) {
      logger.warn('DLQ event not found', {
        event_id: validated.event_id,
        error: fetchError,
      });
      return NextResponse.json({ error: 'Event not found' }, { status: 404 });
    }

    // Check if already replayed
    if (event.replayed_at && !validated.force) {
      logger.warn('Event already replayed', {
        event_id: event.event_id,
        replayed_at: event.replayed_at,
        replay_count: event.replay_count,
      });
      return NextResponse.json(
        {
          error: 'Event already replayed',
          replayed_at: event.replayed_at,
          replay_count: event.replay_count,
          hint: 'Use force: true to replay anyway',
        },
        { status: 400 }
      );
    }

    // Replay the event based on source
    try {
      switch (event.event_source) {
        case 'stripe':
          await replayStripeEvent(event);
          break;

        case 'invoiceninja':
          await replayInvoiceNinjaEvent(event);
          break;

        default:
          throw new Error(`Unsupported event source: ${event.event_source}`);
      }

      // Mark event as replayed
      const { error: updateError } = await adminDb
        .from('webhook_event_dlq')
        .update({
          replayed_at: new Date().toISOString(),
          replay_count: (event.replay_count || 0) + 1,
        })
        .eq('event_id', event.event_id);

      if (updateError) {
        logger.error('Failed to update DLQ event after replay', {
          event_id: event.event_id,
          error: updateError,
        });
      }

      logger.info('DLQ event replayed successfully', {
        event_id: event.event_id,
        event_source: event.event_source,
        event_type: event.event_type,
      });

      return NextResponse.json({
        success: true,
        event_id: event.event_id,
        event_source: event.event_source,
        event_type: event.event_type,
        replayed_at: new Date().toISOString(),
        replay_count: (event.replay_count || 0) + 1,
      });
    } catch (replayError) {
      logger.error('Failed to replay DLQ event', {
        event_id: event.event_id,
        error: replayError,
      });

      // Update error message in DLQ
      await adminDb
        .from('webhook_event_dlq')
        .update({
          error_message: `Replay failed: ${
            replayError instanceof Error
              ? replayError.message
              : String(replayError)
          }`,
          replay_count: (event.replay_count || 0) + 1,
        })
        .eq('event_id', event.event_id);

      return NextResponse.json(
        {
          error: 'Replay failed',
          message:
            replayError instanceof Error
              ? replayError.message
              : String(replayError),
        },
        { status: 500 }
      );
    }
  } catch (error) {
    logger.error('Error in DLQ replay handler', { error });

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          error: 'Validation error',
          details: error.errors,
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// ==============================================================================
// List DLQ Events (GET endpoint for admin dashboard)
// ==============================================================================

export async function GET(request: NextRequest) {
  try {
    // Verify admin authentication
    if (!verifyAdminAuth(request)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get query parameters
    const searchParams = request.nextUrl.searchParams;
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');
    const source = searchParams.get('source'); // Filter by event_source
    const unprocessedOnly = searchParams.get('unprocessed_only') === 'true';

    // Build query
    let query = adminDb
      .from('webhook_event_dlq')
      .select('*', { count: 'exact' })
      .order('received_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (source) {
      query = query.eq('event_source', source);
    }

    if (unprocessedOnly) {
      query = query.is('replayed_at', null);
    }

    const { data: events, error, count } = await query;

    if (error) {
      logger.error('Failed to fetch DLQ events', { error });
      return NextResponse.json(
        { error: 'Failed to fetch events' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      events: events || [],
      total: count || 0,
      limit,
      offset,
    });
  } catch (error) {
    logger.error('Error in DLQ list handler', { error });
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
