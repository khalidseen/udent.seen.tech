import { useContext } from 'react';
import { Currency, CURRENCIES, DEFAULT_CURRENCY, CurrencyCode } from '@/types/currency';
import { createContext } from 'react';

interface CurrencyContextType {
  currentCurrency: Currency;
  currencyCode: CurrencyCode;
  setCurrency: (code: CurrencyCode) => void;
  formatAmount: (amount: number, includeCurrency?: boolean) => string;
  convertAmount: (amount: number, fromCurrency?: CurrencyCode) => number;
  getAllCurrencies: () => Currency[];
}

export const CurrencyContext = createContext<CurrencyContextType | undefined>(undefined);

export const useCurrency = () => {
  const context = useContext(CurrencyContext);
  if (!context) {
    throw new Error('useCurrency must be used within a CurrencyProvider');
  }
  return context;
};
