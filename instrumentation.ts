/**
 * ==============================================================================
 * Next.js Instrumentation
 * ==============================================================================
 * Enables Sentry instrumentation for server-side and edge runtime
 * This file is automatically loaded by Next.js before the application starts
 *
 * Learn more: https://nextjs.org/docs/app/building-your-application/optimizing/instrumentation
 * ==============================================================================
 */

export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    // Server-side runtime
    await import('./sentry.server.config');
  }

  if (process.env.NEXT_RUNTIME === 'edge') {
    // Edge runtime
    await import('./sentry.edge.config');
  }
}

export const onRequestError = async (
  err: Error,
  request: {
    path: string;
    method: string;
    headers: Headers;
  }
) => {
  // This function is called when a request error occurs
  // You can use it to send errors to Sentry or other monitoring services

  // Import Sentry based on runtime
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    const { captureException } = await import('./sentry.server.config');
    captureException(err, {
      tags: {
        path: request.path,
        method: request.method,
      },
    });
  } else if (process.env.NEXT_RUNTIME === 'edge') {
    const Sentry = await import('@sentry/nextjs');
    Sentry.captureException(err, {
      tags: {
        path: request.path,
        method: request.method,
      },
    });
  }
};
