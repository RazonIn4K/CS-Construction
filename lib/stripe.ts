// Stripe client configuration and utilities
import Stripe from 'stripe';

const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
const stripeWebhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

if (!stripeSecretKey) {
  throw new Error('Missing environment variable: STRIPE_SECRET_KEY');
}

/**
 * Stripe client instance
 * Configured with latest API version and TypeScript types
 */
export const stripe = new Stripe(stripeSecretKey, {
  apiVersion: '2024-12-18.acacia',
  typescript: true,
  appInfo: {
    name: 'CS-Construction',
    version: '0.1.0',
  },
});

/**
 * Verify Stripe webhook signature
 * This ensures the webhook came from Stripe and hasn't been tampered with
 *
 * @param body - Raw webhook request body (as string or Buffer)
 * @param signature - Stripe signature from request headers
 * @returns Parsed and verified Stripe event
 * @throws Error if signature is invalid or webhook secret is not configured
 */
export function verifyStripeWebhook(
  body: string | Buffer,
  signature: string
): Stripe.Event {
  if (!stripeWebhookSecret) {
    throw new Error('Missing STRIPE_WEBHOOK_SECRET environment variable');
  }

  try {
    return stripe.webhooks.constructEvent(body, signature, stripeWebhookSecret);
  } catch (err) {
    const error = err as Error;
    throw new Error(`Webhook signature verification failed: ${error.message}`);
  }
}

/**
 * Check if Stripe is configured for webhooks
 */
export function isStripeWebhookConfigured(): boolean {
  return Boolean(stripeWebhookSecret);
}

/**
 * Format amount for Stripe (convert dollars to cents)
 * Stripe expects amounts in the smallest currency unit (cents for USD)
 *
 * @param amount - Amount in dollars
 * @returns Amount in cents
 */
export function toStripeAmount(amount: number): number {
  return Math.round(amount * 100);
}

/**
 * Format amount from Stripe (convert cents to dollars)
 *
 * @param amount - Amount in cents from Stripe
 * @returns Amount in dollars
 */
export function fromStripeAmount(amount: number): number {
  return amount / 100;
}

/**
 * Create a Stripe Checkout Session for invoice payment
 *
 * @param params - Checkout session parameters
 * @returns Stripe Checkout Session
 */
export async function createCheckoutSession(params: {
  invoiceId: string;
  invoiceNumber: string;
  amount: number;
  currency?: string;
  customerEmail: string;
  successUrl: string;
  cancelUrl: string;
  metadata?: Record<string, string>;
}) {
  const {
    invoiceId,
    invoiceNumber,
    amount,
    currency = 'usd',
    customerEmail,
    successUrl,
    cancelUrl,
    metadata = {},
  } = params;

  return await stripe.checkout.sessions.create({
    mode: 'payment',
    customer_email: customerEmail,
    line_items: [
      {
        price_data: {
          currency,
          product_data: {
            name: `Invoice ${invoiceNumber}`,
            description: `Payment for CD Home Improvements invoice ${invoiceNumber}`,
          },
          unit_amount: toStripeAmount(amount),
        },
        quantity: 1,
      },
    ],
    success_url: successUrl,
    cancel_url: cancelUrl,
    metadata: {
      invoice_id: invoiceId,
      invoice_number: invoiceNumber,
      ...metadata,
    },
    payment_intent_data: {
      metadata: {
        invoice_id: invoiceId,
        invoice_number: invoiceNumber,
        ...metadata,
      },
    },
  });
}

/**
 * Retrieve a payment intent
 *
 * @param paymentIntentId - Stripe Payment Intent ID
 * @returns Stripe Payment Intent
 */
export async function getPaymentIntent(paymentIntentId: string) {
  return await stripe.paymentIntents.retrieve(paymentIntentId);
}

/**
 * Get payment method details
 *
 * @param paymentMethodId - Stripe Payment Method ID
 * @returns Stripe Payment Method
 */
export async function getPaymentMethod(paymentMethodId: string) {
  return await stripe.paymentMethods.retrieve(paymentMethodId);
}

/**
 * Extract payment method type from Payment Intent
 *
 * @param paymentIntent - Stripe Payment Intent
 * @returns Payment method type (card, ach, etc.)
 */
export function extractPaymentMethod(
  paymentIntent: Stripe.PaymentIntent
): string {
  const charges = paymentIntent.charges?.data;
  if (charges && charges.length > 0) {
    const paymentMethodDetails = charges[0].payment_method_details;
    if (paymentMethodDetails) {
      return paymentMethodDetails.type || 'unknown';
    }
  }
  return 'unknown';
}

/**
 * Stripe webhook event types we care about
 */
export const WEBHOOK_EVENTS = {
  PAYMENT_INTENT_SUCCEEDED: 'payment_intent.succeeded',
  PAYMENT_INTENT_FAILED: 'payment_intent.payment_failed',
  CHARGE_SUCCEEDED: 'charge.succeeded',
  CHARGE_FAILED: 'charge.failed',
  CHARGE_REFUNDED: 'charge.refunded',
} as const;

export type WebhookEventType = (typeof WEBHOOK_EVENTS)[keyof typeof WEBHOOK_EVENTS];
