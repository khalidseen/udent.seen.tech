import * as Sentry from '@sentry/react';

const SENTRY_DSN = import.meta.env.VITE_SENTRY_DSN || '';
const IS_PRODUCTION = import.meta.env.PROD;

let initialized = false;

export const initializeMonitoring = () => {
  if (initialized || !SENTRY_DSN) {
    return;
  }

  Sentry.init({
    dsn: SENTRY_DSN,
    environment: IS_PRODUCTION ? 'production' : 'development',
    release: import.meta.env.VITE_APP_VERSION || 'udent@0.0.0',
    integrations: [
      Sentry.browserTracingIntegration(),
      Sentry.replayIntegration({ maskAllText: true, blockAllMedia: true }),
    ],
    tracesSampleRate: IS_PRODUCTION ? 0.2 : 1.0,
    replaysSessionSampleRate: IS_PRODUCTION ? 0.1 : 0,
    replaysOnErrorSampleRate: 1.0,
    beforeSend(event) {
      // Strip PII from breadcrumbs
      if (event.breadcrumbs) {
        event.breadcrumbs = event.breadcrumbs.map(bc => {
          if (bc.data?.url) {
            try {
              const url = new URL(bc.data.url, window.location.origin);
              url.searchParams.delete('token');
              url.searchParams.delete('key');
              bc.data.url = url.toString();
            } catch { /* leave as-is */ }
          }
          return bc;
        });
      }
      return event;
    },
  });

  initialized = true;
};

export const captureError = (error: Error, context?: Record<string, unknown>) => {
  console.error('[Error]', error);
  if (initialized) {
    Sentry.captureException(error, { extra: context });
  }
};

export const captureMessage = (message: string, level: Sentry.SeverityLevel = 'info') => {
  if (import.meta.env.DEV) console.log(`[${level}]`, message);
  if (initialized) {
    Sentry.captureMessage(message, level);
  }
};

export const setUser = (user: { id: string; email?: string; role?: string }) => {
  if (initialized) {
    Sentry.setUser({ id: user.id, role: user.role });
  }
};

export const clearUser = () => {
  if (initialized) {
    Sentry.setUser(null);
  }
};

export const setTags = (tags: Record<string, string>) => {
  if (initialized) {
    Object.entries(tags).forEach(([key, value]) => Sentry.setTag(key, value));
  }
};

export const setExtras = (extras: Record<string, unknown>) => {
  if (initialized) {
    Object.entries(extras).forEach(([key, value]) => Sentry.setExtra(key, value));
  }
};

export const setContext = (name: string, context: Record<string, unknown>) => {
  if (initialized) {
    Sentry.setContext(name, context);
  }
};

export const addBreadcrumb = (breadcrumb: Sentry.Breadcrumb) => {
  if (initialized) {
    Sentry.addBreadcrumb(breadcrumb);
  }
};

export const startTransaction = (name: string, op: string) => {
  if (initialized) {
    return Sentry.startInactiveSpan({ name, op });
  }
  return { end: () => {}, setAttribute: (_k: string, _v: unknown) => {} };
};

export const measurePerformance = async <T>(name: string, fn: () => Promise<T>): Promise<T> => {
  if (!initialized) return fn();
  return Sentry.startSpan({ name, op: 'function' }, async () => fn());
};

export const setupGlobalErrorHandling = () => {
  window.addEventListener('unhandledrejection', (event) => {
    captureError(
      event.reason instanceof Error ? event.reason : new Error(String(event.reason)),
      { source: 'unhandledrejection' }
    );
  });
};

export const showReportDialog = () => {
  if (initialized) {
    Sentry.showReportDialog();
  }
};

export const getMonitoringInfo = () => ({
  enabled: initialized,
  dsn: SENTRY_DSN ? '***configured***' : 'not configured',
  environment: IS_PRODUCTION ? 'production' : 'development',
});

export default {
  initializeMonitoring,
  captureError,
  captureMessage,
  setUser,
  clearUser,
  setTags,
  setExtras,
  setContext,
  addBreadcrumb,
  startTransaction,
  measurePerformance,
  setupGlobalErrorHandling,
  showReportDialog,
  getMonitoringInfo,
};
