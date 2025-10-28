/**
 * ==============================================================================
 * Sentry Client-Side Configuration
 * ==============================================================================
 * Initializes Sentry error tracking for the browser
 *
 * Features:
 * - Automatic error capture and reporting
 * - Performance monitoring (Web Vitals)
 * - Session replay for error reproduction
 * - User context tracking
 * - Breadcrumbs for debugging
 *
 * Setup:
 * 1. Create Sentry project: https://sentry.io/signup/
 * 2. Copy DSN from project settings
 * 3. Add NEXT_PUBLIC_SENTRY_DSN to .env
 * ==============================================================================
 */

import * as Sentry from '@sentry/nextjs';

const SENTRY_DSN = process.env.NEXT_PUBLIC_SENTRY_DSN;
const ENVIRONMENT = process.env.NEXT_PUBLIC_VERCEL_ENV || process.env.NODE_ENV || 'development';

// Only initialize Sentry in production or if explicitly enabled
const shouldInitialize = SENTRY_DSN && (ENVIRONMENT === 'production' || process.env.NEXT_PUBLIC_SENTRY_ENABLED === 'true');

if (shouldInitialize) {
  Sentry.init({
    // DSN from Sentry project
    dsn: SENTRY_DSN,

    // Environment (production, preview, development)
    environment: ENVIRONMENT,

    // Release version (use git commit SHA or package version)
    release: process.env.NEXT_PUBLIC_VERCEL_GIT_COMMIT_SHA || process.env.npm_package_version,

    // ==============================================================================
    // Performance Monitoring
    // ==============================================================================
    // Sample rate for performance monitoring (0.0 - 1.0)
    // In production, sample 10% of transactions to reduce cost
    tracesSampleRate: ENVIRONMENT === 'production' ? 0.1 : 1.0,

    // Capture Web Vitals (LCP, FID, CLS)
    integrations: [
      Sentry.browserTracingIntegration({
        // Trace navigation and page loads
        tracePropagationTargets: [
          'localhost',
          /^https:\/\/cdhomeimprovementsrockford\.com/,
          /^https:\/\/.*\.vercel\.app/,
        ],
      }),

      // Session Replay for error reproduction
      Sentry.replayIntegration({
        // Sample rate for session replay (0.0 - 1.0)
        // Only capture 10% of normal sessions
        sessionSampleRate: ENVIRONMENT === 'production' ? 0.1 : 0.5,
        // Capture 100% of sessions with errors
        errorSampleRate: 1.0,
        // Mask all text content for privacy
        maskAllText: true,
        // Block all media (images, video, audio)
        blockAllMedia: true,
      }),
    ],

    // ==============================================================================
    // Error Filtering
    // ==============================================================================
    beforeSend(event, hint) {
      // Filter out non-critical errors

      // Ignore network errors (likely user connection issues)
      if (event.exception?.values?.[0]?.type === 'NetworkError') {
        return null;
      }

      // Ignore ResizeObserver errors (browser quirk, not actionable)
      if (event.message?.includes('ResizeObserver')) {
        return null;
      }

      // Ignore browser extension errors
      if (
        event.exception?.values?.[0]?.stacktrace?.frames?.some(
          (frame) =>
            frame.filename?.includes('chrome-extension://') ||
            frame.filename?.includes('moz-extension://')
        )
      ) {
        return null;
      }

      // Add user context if available
      if (typeof window !== 'undefined') {
        const userEmail = localStorage.getItem('user_email');
        if (userEmail) {
          event.user = {
            ...event.user,
            email: userEmail,
          };
        }
      }

      return event;
    },

    // ==============================================================================
    // Privacy & Security
    // ==============================================================================
    // Scrub sensitive data from error reports
    beforeBreadcrumb(breadcrumb) {
      // Remove sensitive data from breadcrumbs
      if (breadcrumb.category === 'fetch' || breadcrumb.category === 'xhr') {
        // Remove query parameters that might contain tokens
        if (breadcrumb.data?.url) {
          breadcrumb.data.url = breadcrumb.data.url.split('?')[0];
        }
      }

      // Remove form data that might contain PII
      if (breadcrumb.category === 'ui.input') {
        delete breadcrumb.message;
      }

      return breadcrumb;
    },

    // Ignore specific URLs (admin endpoints, health checks)
    ignoreErrors: [
      // Browser extensions
      'top.GLOBALS',
      'ResizeObserver loop',
      // Random network errors
      'Network request failed',
      'Failed to fetch',
      // React errors that are expected
      'Hydration failed',
    ],

    // Don't report errors from these URLs
    denyUrls: [
      // Chrome extensions
      /extensions\//i,
      /^chrome:\/\//i,
      /^moz-extension:\/\//i,
      // Browser internal URLs
      /^safari-extension:\/\//i,
    ],

    // ==============================================================================
    // Additional Configuration
    // ==============================================================================
    // Attach stack traces to all captured messages
    attachStacktrace: true,

    // Maximum breadcrumbs to keep
    maxBreadcrumbs: 50,

    // Enable debug mode in development
    debug: ENVIRONMENT === 'development',

    // Normalize URLs in error stack traces
    normalizeDepth: 10,
  });
}

// Export a function to manually capture exceptions if needed
export function captureException(error: Error, context?: Record<string, any>) {
  if (shouldInitialize) {
    Sentry.captureException(error, {
      extra: context,
    });
  } else {
    console.error('[Sentry disabled] Would have captured:', error, context);
  }
}

// Export a function to capture messages
export function captureMessage(message: string, level: Sentry.SeverityLevel = 'info') {
  if (shouldInitialize) {
    Sentry.captureMessage(message, level);
  } else {
    console.log(`[Sentry disabled] Would have captured message (${level}):`, message);
  }
}

// Export a function to set user context
export function setUser(user: { id: string; email?: string; username?: string }) {
  if (shouldInitialize) {
    Sentry.setUser(user);
  }
}

// Export a function to clear user context
export function clearUser() {
  if (shouldInitialize) {
    Sentry.setUser(null);
  }
}
