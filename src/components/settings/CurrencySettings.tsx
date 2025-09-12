import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useCurrency } from '@/hooks/useCurrency';
import { CurrencyCode } from '@/types/currency';
import { Coins, Globe } from 'lucide-react';

const CurrencySettings: React.FC = () => {
  const { currentCurrency, currencyCode, setCurrency, getAllCurrencies } = useCurrency();
  const currencies = getAllCurrencies();

  const handleCurrencyChange = (newCurrencyCode: string) => {
    setCurrency(newCurrencyCode as CurrencyCode);
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center gap-2">
          <Coins className="h-5 w-5 text-blue-600" />
          <CardTitle>إعدادات العملة</CardTitle>
        </div>
        <CardDescription>
          اختر العملة المفضلة لعرض الأسعار والمبالغ في النظام
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* العملة الحالية */}
        <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg border border-blue-200">
          <div className="flex items-center gap-3">
            <div className="text-2xl">{currentCurrency.icon}</div>
            <div>
              <h4 className="font-semibold text-blue-900">العملة الحالية</h4>
              <p className="text-sm text-blue-700">
                {currentCurrency.nameAr} ({currentCurrency.symbol})
              </p>
            </div>
          </div>
          <Badge variant="secondary" className="bg-blue-100 text-blue-800">
            نشط
          </Badge>
        </div>

        {/* اختيار العملة */}
        <div className="space-y-2">
          <Label htmlFor="currency-select" className="flex items-center gap-2">
            <Globe className="h-4 w-4" />
            اختر العملة
          </Label>
          <Select value={currencyCode} onValueChange={handleCurrencyChange}>
            <SelectTrigger id="currency-select" className="w-full">
              <SelectValue placeholder="اختر العملة" />
            </SelectTrigger>
            <SelectContent>
              {currencies.map((currency) => (
                <SelectItem key={currency.code} value={currency.code}>
                  <div className="flex items-center gap-3 w-full">
                    <span className="text-lg">{currency.icon}</span>
                    <div className="flex-1">
                      <span className="font-medium">{currency.nameAr}</span>
                      <span className="text-sm text-gray-500 ml-2">
                        ({currency.symbol})
                      </span>
                    </div>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* معاينة التنسيق */}
        <div className="p-4 bg-gray-50 rounded-lg">
          <h4 className="font-medium text-gray-900 mb-2">معاينة التنسيق:</h4>
          <div className="space-y-1 text-sm">
            <div className="flex justify-between">
              <span>مبلغ صغير:</span>
              <span className="font-mono">100 {currentCurrency.symbol}</span>
            </div>
            <div className="flex justify-between">
              <span>مبلغ متوسط:</span>
              <span className="font-mono">2,500 {currentCurrency.symbol}</span>
            </div>
            <div className="flex justify-between">
              <span>مبلغ كبير:</span>
              <span className="font-mono">50,000 {currentCurrency.symbol}</span>
            </div>
          </div>
        </div>

        {/* ملاحظة */}
        <div className="text-xs text-gray-500 bg-yellow-50 p-3 rounded border border-yellow-200">
          <strong>ملاحظة:</strong> سيتم تطبيق العملة المختارة على جميع أجزاء النظام فوراً. 
          المبالغ المحفوظة في قاعدة البيانات بالدينار العراقي وسيتم تحويلها تلقائياً للعرض.
        </div>
      </CardContent>
    </Card>
  );
};

export default CurrencySettings;
