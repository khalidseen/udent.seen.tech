import { useCallback, useMemo } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';

/**
 * Central formatting hook that respects the user's language and time format settings.
 * All date/time/number formatting in the app should use this hook.
 */
export function useFormatters() {
  const { language } = useLanguage();

  const locale = useMemo(() => {
    return language === 'ar' ? 'ar-IQ' : 'en-US';
  }, [language]);

  const timeFormat = useMemo(() => {
    const saved = localStorage.getItem('timeFormat');
    return (saved as '12' | '24') || '12';
  }, []);

  const hour12 = timeFormat === '12';

  const formatDate = useCallback((date: string | Date, options?: Intl.DateTimeFormatOptions) => {
    const d = typeof date === 'string' ? new Date(date) : date;
    return d.toLocaleDateString(locale, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      ...options,
    });
  }, [locale]);

  const formatDateLong = useCallback((date: string | Date) => {
    const d = typeof date === 'string' ? new Date(date) : date;
    return d.toLocaleDateString(locale, {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  }, [locale]);

  const formatTime = useCallback((date: string | Date) => {
    const d = typeof date === 'string' ? new Date(date) : date;
    return d.toLocaleTimeString(locale, {
      hour: '2-digit',
      minute: '2-digit',
      hour12,
    });
  }, [locale, hour12]);

  const formatDateTime = useCallback((date: string | Date) => {
    const d = typeof date === 'string' ? new Date(date) : date;
    return d.toLocaleString(locale, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12,
    });
  }, [locale, hour12]);

  const formatRelativeDate = useCallback((date: string | Date) => {
    const d = typeof date === 'string' ? new Date(date) : date;
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return language === 'ar' ? 'اليوم' : 'Today';
    if (diffDays === 1) return language === 'ar' ? 'أمس' : 'Yesterday';
    if (diffDays < 7) return language === 'ar' ? `منذ ${diffDays} أيام` : `${diffDays} days ago`;
    return formatDate(d);
  }, [language, formatDate]);

  const formatNumber = useCallback((num: number, options?: Intl.NumberFormatOptions) => {
    return new Intl.NumberFormat(locale, options).format(num);
  }, [locale]);

  return {
    locale,
    language,
    hour12,
    formatDate,
    formatDateLong,
    formatTime,
    formatDateTime,
    formatRelativeDate,
    formatNumber,
  };
}
