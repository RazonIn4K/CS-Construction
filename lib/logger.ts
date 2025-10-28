// Logging utility with Sentry integration
import * as Sentry from '@sentry/nextjs';

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

export interface LogContext {
  [key: string]: any;
}

/**
 * Structured logging utility
 * Logs to console in development, integrates with Sentry in production
 */
class Logger {
  private isDevelopment = process.env.NODE_ENV === 'development';

  private formatMessage(level: LogLevel, message: string, context?: LogContext): string {
    const timestamp = new Date().toISOString();
    const contextStr = context ? ` | ${JSON.stringify(context)}` : '';
    return `[${timestamp}] [${level.toUpperCase()}] ${message}${contextStr}`;
  }

  debug(message: string, context?: LogContext): void {
    if (this.isDevelopment) {
      console.log(this.formatMessage('debug', message, context));
    }
  }

  info(message: string, context?: LogContext): void {
    console.log(this.formatMessage('info', message, context));

    if (!this.isDevelopment && context) {
      Sentry.addBreadcrumb({
        level: 'info',
        message,
        data: context,
      });
    }
  }

  warn(message: string, context?: LogContext): void {
    console.warn(this.formatMessage('warn', message, context));

    Sentry.captureMessage(message, {
      level: 'warning',
      contexts: { custom: context },
    });
  }

  error(message: string, error?: Error | unknown, context?: LogContext): void {
    console.error(this.formatMessage('error', message, context), error);

    if (error instanceof Error) {
      Sentry.captureException(error, {
        contexts: {
          custom: context,
        },
        extra: {
          message,
        },
      });
    } else {
      Sentry.captureMessage(message, {
        level: 'error',
        contexts: { custom: { ...context, error } },
      });
    }
  }

  /**
   * Add user context to error tracking
   */
  setUser(user: { id: string; email?: string; username?: string }): void {
    Sentry.setUser(user);
  }

  /**
   * Clear user context
   */
  clearUser(): void {
    Sentry.setUser(null);
  }

  /**
   * Add custom context to all subsequent logs
   */
  setContext(key: string, data: Record<string, any>): void {
    Sentry.setContext(key, data);
  }
}

export const logger = new Logger();
