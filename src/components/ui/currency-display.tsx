import React from 'react';
import { useCurrency } from '@/hooks/useCurrency';
import { CurrencyCode } from '@/types/currency';

interface CurrencyAmountProps {
  amount: number;
  showCurrency?: boolean;
  className?: string;
  precision?: number;
  fromCurrency?: CurrencyCode;
}

export const CurrencyAmount: React.FC<CurrencyAmountProps> = ({
  amount,
  showCurrency = true,
  className = '',
  precision,
  fromCurrency = 'IQD'
}) => {
  const { formatAmount, convertAmount, currentCurrency } = useCurrency();
  
  const displayAmount = convertAmount(amount, fromCurrency);
  
  const formatOptions = precision !== undefined 
    ? { 
        minimumFractionDigits: precision,
        maximumFractionDigits: precision 
      }
    : {
        minimumFractionDigits: currentCurrency.decimalPlaces,
        maximumFractionDigits: currentCurrency.decimalPlaces
      };
  
  const formattedAmount = new Intl.NumberFormat('ar-IQ', formatOptions).format(displayAmount);
  
  return (
    <span className={className}>
      {formattedAmount}
      {showCurrency && ` ${currentCurrency.symbol}`}
    </span>
  );
};

interface CurrencyInputProps {
  value: number;
  onChange: (value: number) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  min?: number;
  max?: number;
}

export const CurrencyInput: React.FC<CurrencyInputProps> = ({
  value,
  onChange,
  placeholder,
  className = '',
  disabled = false,
  min,
  max
}) => {
  const { currentCurrency } = useCurrency();
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const numericValue = parseFloat(e.target.value) || 0;
    onChange(numericValue);
  };
  
  return (
    <div className="relative">
      <input
        type="number"
        value={value}
        onChange={handleChange}
        placeholder={placeholder}
        className={`pr-12 ${className}`}
        disabled={disabled}
        min={min}
        max={max}
        step={0.01}
        dir="ltr"
      />
      <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
        <span className="text-gray-500 text-sm">{currentCurrency.symbol}</span>
      </div>
    </div>
  );
};
