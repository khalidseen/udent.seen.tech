// تعريفات أنواع العملات
export interface Currency {
  code: string;
  name: string;
  nameAr: string;
  symbol: string;
  icon: string;
  decimalPlaces: number;
  exchangeRate: number; // معدل التحويل بالنسبة للدينار العراقي
}

export const CURRENCIES: Record<string, Currency> = {
  IQD: {
    code: 'IQD',
    name: 'Iraqi Dinar',
    nameAr: 'دينار عراقي',
    symbol: 'د.ع',
    icon: '🇮🇶',
    decimalPlaces: 0,
    exchangeRate: 1, // العملة الأساسية
  },
  USD: {
    code: 'USD',
    name: 'US Dollar',
    nameAr: 'دولار أمريكي',
    symbol: '$',
    icon: '🇺🇸',
    decimalPlaces: 2,
    exchangeRate: 0.00076, // تقريبي
  },
  EUR: {
    code: 'EUR',
    name: 'Euro',
    nameAr: 'يورو',
    symbol: '€',
    icon: '🇪🇺',
    decimalPlaces: 2,
    exchangeRate: 0.00069, // تقريبي
  },
  SAR: {
    code: 'SAR',
    name: 'Saudi Riyal',
    nameAr: 'ريال سعودي',
    symbol: 'ر.س',
    icon: '🇸🇦',
    decimalPlaces: 2,
    exchangeRate: 0.0029, // تقريبي
  },
  AED: {
    code: 'AED',
    name: 'UAE Dirham',
    nameAr: 'درهم إماراتي',
    symbol: 'د.إ',
    icon: '🇦🇪',
    decimalPlaces: 2,
    exchangeRate: 0.0028, // تقريبي
  },
};

export const DEFAULT_CURRENCY = 'IQD';

export type CurrencyCode = keyof typeof CURRENCIES;
