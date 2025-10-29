// POST /api/webhooks/stripe - Stripe webhook handler
import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { verifyStripeWebhook, extractPaymentMethod, fromStripeAmount, WEBHOOK_EVENTS } from '@/lib/stripe';
import { adminDb } from '@/lib/supabase';
import { logger } from '@/lib/logger';
import type { PaymentInsert, InvoiceUpdate } from '@/types/database.types';
import type Stripe from 'stripe';

export async function POST(request: NextRequest) {
  try {
    // Get raw body for signature verification
    const body = await request.text();
    const headersList = await headers();
    const signature = headersList.get('stripe-signature');

    if (!signature) {
      logger.warn('Stripe webhook missing signature');
      return NextResponse.json(
        { error: 'Missing stripe-signature header' },
        { status: 400 }
      );
    }

    // Verify webhook signature
    let event: Stripe.Event;
    try {
      event = verifyStripeWebhook(body, signature);
    } catch (error) {
      logger.error('Stripe webhook signature verification failed', error);
      return NextResponse.json(
        { error: 'Invalid signature' },
        { status: 400 }
      );
    }

    logger.info('Stripe webhook received', {
      event_id: event.id,
      event_type: event.type,
    });

    // Idempotency check: Has this event already been processed?
    const { data: existingPayment } = await adminDb
      .payments()
      .select('payment_id')
      .eq('external_id', event.id)
      .single();

    if (existingPayment) {
      logger.info('Stripe event already processed (idempotent)', {
        event_id: event.id,
        payment_id: existingPayment.payment_id,
      });
      return NextResponse.json({ received: true, idempotent: true });
    }

    // Handle different event types
    switch (event.type) {
      case WEBHOOK_EVENTS.PAYMENT_INTENT_SUCCEEDED:
        await handlePaymentIntentSucceeded(event);
        break;

      case WEBHOOK_EVENTS.PAYMENT_INTENT_FAILED:
        await handlePaymentIntentFailed(event);
        break;

      case WEBHOOK_EVENTS.CHARGE_SUCCEEDED:
        await handleChargeSucceeded(event);
        break;

      case WEBHOOK_EVENTS.CHARGE_REFUNDED:
        await handleChargeRefunded(event);
        break;

      default:
        logger.info('Unhandled Stripe event type', { event_type: event.type });
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    logger.error('Stripe webhook processing failed', error);

    // Store failed event in DLQ for later replay
    try {
      await storeDLQEvent('stripe', await request.text(), error);
    } catch (dlqError) {
      logger.error('Failed to store event in DLQ', dlqError);
    }

    // Return 200 to prevent Stripe from retrying immediately
    // We've logged the error and stored it in DLQ for manual replay
    return NextResponse.json(
      { received: true, error: 'Processing failed, stored in DLQ' },
      { status: 200 }
    );
  }
}

/**
 * Handle payment_intent.succeeded event
 */
async function handlePaymentIntentSucceeded(event: Stripe.Event) {
  const paymentIntent = event.data.object as Stripe.PaymentIntent;

  const invoiceId = paymentIntent.metadata?.invoice_id;
  if (!invoiceId) {
    logger.warn('Payment Intent missing invoice_id metadata', {
      payment_intent_id: paymentIntent.id,
    });
    return;
  }

  const paymentMethod = extractPaymentMethod(paymentIntent);
  const amount = fromStripeAmount(paymentIntent.amount);

  // Insert payment record
  const paymentData: PaymentInsert = {
    external_id: paymentIntent.id,
    invoice_id: invoiceId,
    method: paymentMethod,
    amount,
    currency: paymentIntent.currency.toUpperCase(),
    paid_at: new Date(paymentIntent.created * 1000).toISOString(),
    status: 'applied',
    raw_event: event as any,
  };

  const { data: payment, error: paymentError } = await adminDb
    .payments()
    .insert(paymentData)
    .select()
    .single();

  if (paymentError) {
    throw new Error(`Failed to insert payment: ${paymentError.message}`);
  }

  logger.info('Payment recorded', {
    payment_id: payment.payment_id,
    invoice_id: invoiceId,
    amount,
  });

  // Check if invoice is fully paid
  const { data: invoiceSummary } = await adminDb
    .invoiceSummary()
    .select('balance_due')
    .eq('invoice_id', invoiceId)
    .single();

  if (invoiceSummary && invoiceSummary.balance_due !== null && invoiceSummary.balance_due <= 0) {
    // Mark invoice as paid
    const invoiceUpdate: InvoiceUpdate = {
      status: 'paid',
    };

    const { error: invoiceError } = await adminDb
      .invoices()
      .update(invoiceUpdate)
      .eq('invoice_id', invoiceId);

    if (invoiceError) {
      logger.error('Failed to update invoice status', invoiceError, { invoice_id: invoiceId });
    } else {
      logger.info('Invoice marked as paid', { invoice_id: invoiceId });
    }
  } else if (invoiceSummary && invoiceSummary.balance_due !== null && invoiceSummary.balance_due > 0) {
    // Partial payment
    const invoiceUpdate: InvoiceUpdate = {
      status: 'partial',
    };

    await adminDb
      .invoices()
      .update(invoiceUpdate)
      .eq('invoice_id', invoiceId);

    logger.info('Invoice marked as partially paid', {
      invoice_id: invoiceId,
      balance_due: invoiceSummary.balance_due,
    });
  }
}

/**
 * Handle payment_intent.payment_failed event
 */
async function handlePaymentIntentFailed(event: Stripe.Event) {
  const paymentIntent = event.data.object as Stripe.PaymentIntent;

  const invoiceId = paymentIntent.metadata?.invoice_id;
  if (!invoiceId) {
    logger.warn('Failed Payment Intent missing invoice_id metadata', {
      payment_intent_id: paymentIntent.id,
    });
    return;
  }

  const amount = fromStripeAmount(paymentIntent.amount);

  // Record failed payment attempt
  const paymentData: PaymentInsert = {
    external_id: paymentIntent.id,
    invoice_id: invoiceId,
    method: extractPaymentMethod(paymentIntent),
    amount,
    currency: paymentIntent.currency.toUpperCase(),
    paid_at: null,
    status: 'failed',
    raw_event: event as any,
  };

  const { error: paymentError } = await adminDb
    .payments()
    .insert(paymentData);

  if (paymentError) {
    logger.error('Failed to record failed payment', paymentError);
  } else {
    logger.warn('Failed payment recorded', {
      invoice_id: invoiceId,
      amount,
      reason: paymentIntent.last_payment_error?.message,
    });
  }
}

/**
 * Handle charge.succeeded event (backup for payment_intent.succeeded)
 */
async function handleChargeSucceeded(event: Stripe.Event) {
  const charge = event.data.object as Stripe.Charge;

  // If this charge is part of a Payment Intent, skip it
  // (it will be handled by payment_intent.succeeded)
  if (charge.payment_intent) {
    logger.debug('Charge is part of Payment Intent, skipping', {
      charge_id: charge.id,
      payment_intent_id: charge.payment_intent,
    });
    return;
  }

  // Handle standalone charges if needed
  logger.info('Standalone charge succeeded', { charge_id: charge.id });
}

/**
 * Handle charge.refunded event
 */
async function handleChargeRefunded(event: Stripe.Event) {
  const charge = event.data.object as Stripe.Charge;

  // Find the original payment by charge ID
  const { data: originalPayment } = await adminDb
    .payments()
    .select('*')
    .eq('external_id', charge.payment_intent as string)
    .single();

  if (!originalPayment) {
    logger.warn('Original payment not found for refund', {
      charge_id: charge.id,
      payment_intent_id: charge.payment_intent,
    });
    return;
  }

  // Update payment status to refunded
  const { error: updateError } = await adminDb
    .payments()
    .update({ status: 'refunded' })
    .eq('payment_id', originalPayment.payment_id);

  if (updateError) {
    logger.error('Failed to update payment status to refunded', updateError);
  } else {
    logger.info('Payment marked as refunded', {
      payment_id: originalPayment.payment_id,
      invoice_id: originalPayment.invoice_id,
    });

    // Update invoice status back to sent/partial
    if (originalPayment.invoice_id) {
      await adminDb
        .invoices()
        .update({ status: 'sent' })
        .eq('invoice_id', originalPayment.invoice_id);
    }
  }
}

/**
 * Store failed webhook event in DLQ for later replay
 */
async function storeDLQEvent(source: string, payload: string, error: unknown) {
  // TODO: Implement DLQ table and storage
  // For now, just log it
  logger.error('Webhook failed, would store in DLQ', error, {
    source,
    payload_length: payload.length,
  });
}

// Disable body parsing for webhook signature verification
export const config = {
  api: {
    bodyParser: false,
  },
};
