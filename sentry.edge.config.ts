/**
 * ==============================================================================
 * Sentry Edge Runtime Configuration
 * ==============================================================================
 * Initializes Sentry error tracking for Next.js Edge Runtime
 * Used in Edge API routes and Middleware
 *
 * Features:
 * - Edge function error tracking
 * - Middleware error capture
 * - Lightweight configuration for Edge runtime constraints
 *
 * Setup:
 * Same as server configuration - uses SENTRY_DSN environment variable
 * ==============================================================================
 */

import * as Sentry from '@sentry/nextjs';

const SENTRY_DSN = process.env.SENTRY_DSN;
const ENVIRONMENT = process.env.VERCEL_ENV || process.env.NODE_ENV || 'development';

// Only initialize Sentry in production or if explicitly enabled
const shouldInitialize = SENTRY_DSN && (ENVIRONMENT === 'production' || process.env.SENTRY_ENABLED === 'true');

if (shouldInitialize) {
  Sentry.init({
    // DSN from Sentry project
    dsn: SENTRY_DSN,

    // Environment
    environment: ENVIRONMENT,

    // Release version
    release: process.env.VERCEL_GIT_COMMIT_SHA || process.env.npm_package_version,

    // ==============================================================================
    // Performance Monitoring (Reduced for Edge)
    // ==============================================================================
    // Lower sample rate for Edge runtime to reduce overhead
    tracesSampleRate: ENVIRONMENT === 'production' ? 0.05 : 0.5,

    // ==============================================================================
    // Error Filtering
    // ==============================================================================
    beforeSend(event) {
      // Remove sensitive data from Edge requests
      if (event.request?.headers) {
        delete event.request.headers['authorization'];
        delete event.request.headers['cookie'];
        delete event.request.headers['x-api-key'];
      }

      return event;
    },

    // ==============================================================================
    // Configuration (Minimal for Edge)
    // ==============================================================================
    // Attach stack traces
    attachStacktrace: true,

    // Reduced breadcrumbs for Edge runtime
    maxBreadcrumbs: 30,

    // Enable debug in development
    debug: ENVIRONMENT === 'development',
  });
}
