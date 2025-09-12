import React, { useState, useEffect, ReactNode } from 'react';
import { Currency, CURRENCIES, DEFAULT_CURRENCY, CurrencyCode } from '@/types/currency';
import { CurrencyContext } from '@/hooks/useCurrency';

interface CurrencyProviderProps {
  children: ReactNode;
}

export const CurrencyProvider: React.FC<CurrencyProviderProps> = ({ children }) => {
  const [currencyCode, setCurrencyCode] = useState<CurrencyCode>(() => {
    const stored = localStorage.getItem('selectedCurrency');
    return (stored && stored in CURRENCIES) ? stored as CurrencyCode : DEFAULT_CURRENCY;
  });

  const currentCurrency = CURRENCIES[currencyCode];

  useEffect(() => {
    localStorage.setItem('selectedCurrency', currencyCode);
  }, [currencyCode]);

  const setCurrency = (code: CurrencyCode) => {
    setCurrencyCode(code);
  };

  const formatAmount = (amount: number, includeCurrency: boolean = true): string => {
    const convertedAmount = convertAmount(amount);
    const formatted = new Intl.NumberFormat('ar-IQ', {
      minimumFractionDigits: currentCurrency.decimalPlaces,
      maximumFractionDigits: currentCurrency.decimalPlaces,
    }).format(convertedAmount);

    if (includeCurrency) {
      return `${formatted} ${currentCurrency.symbol}`;
    }
    return formatted;
  };

  const convertAmount = (amount: number, fromCurrency: CurrencyCode = 'IQD'): number => {
    if (fromCurrency === currencyCode) return amount;
    
    // تحويل إلى الدينار العراقي أولاً (العملة الأساسية)
    const baseAmount = fromCurrency === 'IQD' 
      ? amount 
      : amount / CURRENCIES[fromCurrency].exchangeRate;
    
    // ثم تحويل إلى العملة المطلوبة
    return currencyCode === 'IQD' 
      ? baseAmount 
      : baseAmount * currentCurrency.exchangeRate;
  };

  const getAllCurrencies = (): Currency[] => {
    return Object.values(CURRENCIES);
  };

  const value = {
    currentCurrency,
    currencyCode,
    setCurrency,
    formatAmount,
    convertAmount,
    getAllCurrencies,
  };

  return (
    <CurrencyContext.Provider value={value}>
      {children}
    </CurrencyContext.Provider>
  );
};
