import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useSharedFinancialData } from '@/hooks/useSharedFinancialData';
import { useCurrency } from '@/hooks/useCurrency';
import { 
  DollarSign, 
  TrendingUp, 
  TrendingDown,
  RefreshCw,
  Eye,
  CreditCard
} from 'lucide-react';

interface FinancialTestComponentProps {
  patientId: string;
  patientName: string;
}

const FinancialTestComponent: React.FC<FinancialTestComponentProps> = ({
  patientId,
  patientName
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const { formatAmount } = useCurrency();
  
  const { 
    summary, 
    transactions, 
    isLoading, 
    error,
    refreshData 
  } = useSharedFinancialData({ patientId });

  if (isLoading) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle>جاري تحميل البيانات المالية...</CardTitle>
        </CardHeader>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="w-full border-red-200">
        <CardHeader>
          <CardTitle className="text-red-600">خطأ في تحميل البيانات المالية</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-red-500">{error}</p>
          <Button onClick={refreshData} className="mt-2">
            <RefreshCw className="h-4 w-4 ml-2" />
            إعادة المحاولة
          </Button>
        </CardContent>
      </Card>
    );
  }

  const getBalanceColor = (balance: number) => {
    if (balance > 0) return 'text-red-600';
    if (balance < 0) return 'text-green-600';
    return 'text-gray-600';
  };

  const getBalanceIcon = (balance: number) => {
    if (balance > 0) return <TrendingUp className="h-4 w-4" />;
    if (balance < 0) return <TrendingDown className="h-4 w-4" />;
    return <DollarSign className="h-4 w-4" />;
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            اختبار البيانات المالية - {patientName}
          </CardTitle>
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => setIsExpanded(!isExpanded)}
          >
            <Eye className="h-4 w-4 ml-2" />
            {isExpanded ? 'إخفاء' : 'عرض'} التفاصيل
          </Button>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* الملخص المالي السريع */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center">
            <div className="text-sm text-gray-600">الرصيد الحالي</div>
            <div className={`text-lg font-bold flex items-center justify-center gap-1 ${getBalanceColor(summary.totalBalance)}`}>
              {getBalanceIcon(summary.totalBalance)}
              {formatAmount(summary.totalBalance)}
            </div>
          </div>
          
          <div className="text-center">
            <div className="text-sm text-gray-600">إجمالي المدفوع</div>
            <div className="text-lg font-bold text-green-600">
              {formatAmount(summary.totalPaid)}
            </div>
          </div>
          
          <div className="text-center">
            <div className="text-sm text-gray-600">إجمالي الرسوم</div>
            <div className="text-lg font-bold text-blue-600">
              {formatAmount(summary.totalCharges)}
            </div>
          </div>
          
          <div className="text-center">
            <div className="text-sm text-gray-600">المبلغ المعلق</div>
            <div className="text-lg font-bold text-orange-600">
              {formatAmount(summary.pendingAmount)}
            </div>
          </div>
        </div>

        {/* آخر دفعة */}
        {summary.lastPaymentDate && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-green-700">آخر دفعة:</span>
              <div className="text-left">
                <div className="font-medium text-green-800">
                  {formatAmount(summary.lastPaymentAmount || 0)}
                </div>
                <div className="text-xs text-green-600">
                  {new Date(summary.lastPaymentDate).toLocaleDateString('ar-SA')}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* التفاصيل الموسعة */}
        {isExpanded && (
          <div className="space-y-4 border-t pt-4">
            <div className="flex items-center justify-between">
              <h4 className="font-semibold">المعاملات الأخيرة ({transactions.length})</h4>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={refreshData}
                disabled={isLoading}
              >
                <RefreshCw className={`h-4 w-4 ml-2 ${isLoading ? 'animate-spin' : ''}`} />
                تحديث
              </Button>
            </div>
            
            {transactions.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <CreditCard className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>لا توجد معاملات مالية بعد</p>
              </div>
            ) : (
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {transactions.map((transaction) => (
                  <div 
                    key={transaction.id} 
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                  >
                    <div>
                      <div className="font-medium">{transaction.description}</div>
                      <div className="text-sm text-gray-500">
                        {new Date(transaction.transaction_date).toLocaleDateString('ar-SA')}
                      </div>
                    </div>
                    <div className="text-left">
                      <div className={`font-bold ${
                        transaction.type === 'payment' ? 'text-green-600' : 'text-blue-600'
                      }`}>
                        {transaction.type === 'payment' ? '-' : '+'}
                        {formatAmount(transaction.amount)}
                      </div>
                      <Badge 
                        variant={transaction.status === 'completed' ? 'default' : 'secondary'}
                        className="text-xs"
                      >
                        {transaction.status === 'completed' ? 'مكتمل' : 
                         transaction.status === 'pending' ? 'معلق' : 'ملغي'}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* معلومات Debug */}
        <div className="bg-gray-50 border rounded-lg p-3 text-xs text-gray-600">
          <div>Patient ID: {patientId}</div>
          <div>Hook Status: {isLoading ? 'Loading' : 'Ready'}</div>
          <div>Transactions Count: {transactions.length}</div>
          <div>Last Refresh: {new Date().toLocaleTimeString('ar-SA')}</div>
        </div>
      </CardContent>
    </Card>
  );
};

export default FinancialTestComponent;