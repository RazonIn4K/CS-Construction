/**
 * ==============================================================================
 * Sentry Server-Side Configuration
 * ==============================================================================
 * Initializes Sentry error tracking for Next.js server-side code
 *
 * Features:
 * - API route error tracking
 * - Server-side rendering error capture
 * - Database query error monitoring
 * - Integration with logger utility
 *
 * Setup:
 * 1. Create Sentry project: https://sentry.io/signup/
 * 2. Copy DSN from project settings
 * 3. Add SENTRY_DSN to .env (server-only, not NEXT_PUBLIC_)
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

    // Environment (production, preview, development)
    environment: ENVIRONMENT,

    // Release version (use git commit SHA or package version)
    release: process.env.VERCEL_GIT_COMMIT_SHA || process.env.npm_package_version,

    // ==============================================================================
    // Performance Monitoring
    // ==============================================================================
    // Sample rate for performance monitoring (0.0 - 1.0)
    // In production, sample 10% of transactions to reduce cost
    tracesSampleRate: ENVIRONMENT === 'production' ? 0.1 : 1.0,

    // Trace HTTP requests to external services
    integrations: [
      Sentry.httpIntegration({
        // Trace outgoing HTTP requests
        tracing: true,
      }),
    ],

    // ==============================================================================
    // Error Filtering
    // ==============================================================================
    beforeSend(event, hint) {
      // Filter out non-critical errors

      // Ignore expected 404 errors
      if (event.exception?.values?.[0]?.type === 'NotFoundError') {
        return null;
      }

      // Ignore webhook signature validation failures (potential attacks)
      if (event.message?.includes('Invalid signature')) {
        // Still log to console for security monitoring
        console.warn('Potential webhook attack detected:', hint.originalException);
        return null;
      }

      // Add server context
      if (event.request) {
        // Remove sensitive headers
        if (event.request.headers) {
          delete event.request.headers['authorization'];
          delete event.request.headers['cookie'];
          delete event.request.headers['x-api-key'];
        }

        // Remove sensitive query parameters
        if (event.request.query_string) {
          event.request.query_string = event.request.query_string
            .split('&')
            .filter((param) => !param.startsWith('token=') && !param.startsWith('key='))
            .join('&');
        }
      }

      return event;
    },

    // ==============================================================================
    // Privacy & Security
    // ==============================================================================
    // Scrub sensitive data from breadcrumbs
    beforeBreadcrumb(breadcrumb) {
      // Remove sensitive data from database queries
      if (breadcrumb.category === 'query') {
        // Mask potential sensitive data in queries
        if (breadcrumb.data?.sql) {
          breadcrumb.data.sql = breadcrumb.data.sql.replace(
            /password\s*=\s*'[^']+'/gi,
            "password='***'"
          );
          breadcrumb.data.sql = breadcrumb.data.sql.replace(
            /api[_-]?key\s*=\s*'[^']+'/gi,
            "api_key='***'"
          );
        }
      }

      // Remove sensitive data from HTTP requests
      if (breadcrumb.category === 'http') {
        if (breadcrumb.data?.headers) {
          delete breadcrumb.data.headers['authorization'];
          delete breadcrumb.data.headers['x-api-key'];
        }
      }

      return breadcrumb;
    },

    // Ignore specific errors
    ignoreErrors: [
      // Expected validation errors
      'ValidationError',
      'ZodError',
      // Network timeouts (not actionable)
      'ETIMEDOUT',
      'ECONNRESET',
      // Rate limit errors (expected behavior)
      'Too Many Requests',
    ],

    // ==============================================================================
    // Additional Configuration
    // ==============================================================================
    // Attach stack traces to all captured messages
    attachStacktrace: true,

    // Maximum breadcrumbs to keep
    maxBreadcrumbs: 100,

    // Enable debug mode in development
    debug: ENVIRONMENT === 'development',

    // Normalize URLs in error stack traces
    normalizeDepth: 10,

    // ==============================================================================
    // Sampling
    // ==============================================================================
    // Profile sample rate (0.0 - 1.0)
    // Profiling helps identify performance bottlenecks
    profilesSampleRate: ENVIRONMENT === 'production' ? 0.1 : 0,
  });
}

// Export a function to manually capture exceptions
export function captureException(
  error: Error,
  context?: {
    user?: { id: string; email?: string };
    tags?: Record<string, string>;
    extra?: Record<string, any>;
  }
) {
  if (shouldInitialize) {
    Sentry.withScope((scope) => {
      if (context?.user) {
        scope.setUser(context.user);
      }

      if (context?.tags) {
        Object.entries(context.tags).forEach(([key, value]) => {
          scope.setTag(key, value);
        });
      }

      if (context?.extra) {
        Object.entries(context.extra).forEach(([key, value]) => {
          scope.setExtra(key, value);
        });
      }

      Sentry.captureException(error);
    });
  } else {
    console.error('[Sentry disabled] Would have captured:', error, context);
  }
}

// Export a function to capture messages
export function captureMessage(
  message: string,
  level: Sentry.SeverityLevel = 'info',
  context?: {
    tags?: Record<string, string>;
    extra?: Record<string, any>;
  }
) {
  if (shouldInitialize) {
    Sentry.withScope((scope) => {
      if (context?.tags) {
        Object.entries(context.tags).forEach(([key, value]) => {
          scope.setTag(key, value);
        });
      }

      if (context?.extra) {
        Object.entries(context.extra).forEach(([key, value]) => {
          scope.setExtra(key, value);
        });
      }

      Sentry.captureMessage(message, level);
    });
  } else {
    console.log(`[Sentry disabled] Would have captured message (${level}):`, message, context);
  }
}

// Export a function to wrap async handlers with error tracking
export function withSentry<T extends (...args: any[]) => Promise<any>>(
  handler: T,
  options?: {
    operationName?: string;
    tags?: Record<string, string>;
  }
): T {
  return (async (...args: any[]) => {
    try {
      if (shouldInitialize && options?.operationName) {
        return await Sentry.startSpan(
          {
            op: 'function',
            name: options.operationName,
          },
          async () => {
            return await handler(...args);
          }
        );
      }

      return await handler(...args);
    } catch (error) {
      captureException(error as Error, {
        tags: options?.tags,
        extra: {
          handler: handler.name,
          args: args.map((arg) => (typeof arg === 'object' ? JSON.stringify(arg) : String(arg))),
        },
      });

      throw error;
    }
  }) as T;
}

// Export a function to measure performance of async operations
export async function measurePerformance<T>(
  operationName: string,
  operation: () => Promise<T>
): Promise<T> {
  if (!shouldInitialize) {
    return operation();
  }

  return Sentry.startSpan(
    {
      op: 'function',
      name: operationName,
    },
    async () => {
      return await operation();
    }
  );
}

// Export a function to add breadcrumbs manually
export function addBreadcrumb(breadcrumb: {
  message: string;
  category?: string;
  level?: Sentry.SeverityLevel;
  data?: Record<string, any>;
}) {
  if (shouldInitialize) {
    Sentry.addBreadcrumb(breadcrumb);
  }
}
