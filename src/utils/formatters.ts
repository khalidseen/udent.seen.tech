/**
 * Standalone locale utilities for use outside React components (hooks, utils).
 * For React components, prefer useFormatters() hook.
 */

export function getAppLocale(): string {
  const lang = localStorage.getItem('language') || 'ar';
  return lang === 'ar' ? 'ar-IQ' : 'en-US';
}

export function getTimeFormat(): boolean {
  const fmt = localStorage.getItem('timeFormat') || '12';
  return fmt === '12';
}

export function formatDateUtil(date: string | Date, options?: Intl.DateTimeFormatOptions): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  const locale = getAppLocale();
  return d.toLocaleDateString(locale, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    ...options,
  });
}

export function formatTimeUtil(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleTimeString(getAppLocale(), {
    hour: '2-digit',
    minute: '2-digit',
    hour12: getTimeFormat(),
  });
}

export function formatDateTimeUtil(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleString(getAppLocale(), {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: getTimeFormat(),
  });
}
