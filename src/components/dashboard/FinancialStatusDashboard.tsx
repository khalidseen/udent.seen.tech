import { useOptimizedFinancialSummary } from "@/hooks/useOptimizedFinancial";
import { supabase } from "@/integrations/supabase/client";
import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { DollarSign, TrendingUp, Users, AlertTriangle } from "lucide-react";
import { format, isToday } from "date-fns";
import { ar } from "date-fns/locale";
import { useNavigate } from "react-router-dom";
import { CurrencyAmount } from "@/components/ui/currency-display";

interface PatientBalance {
  patient_id: string;
  patient_name: string;
  total_cost: number;
  total_paid: number;
  remaining_balance: number;
}

const FinancialStatusDashboard = () => {
  const navigate = useNavigate();
  const [clinicId, setClinicId] = useState<string | null>(null);

  // جلب clinic ID
  useEffect(() => {
    const fetchClinicId = async () => {
      const { data: profile } = await supabase
        .from('profiles')
        .select('clinic_id')
        .single();
      setClinicId(profile?.clinic_id || null);
    };
    fetchClinicId();
  }, []);

  // استخدام الـ hook المحسن
  const { data: financialData, isLoading } = useOptimizedFinancialSummary(clinicId);

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
        {[...Array(4)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-6">
              <div className="h-16 bg-muted rounded"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const data = financialData || {
    todayCollection: 0,
    totalOutstanding: 0,
    outstandingBalances: [],
    todayPaymentsCount: 0,
    patientsWithDebt: 0
  };

  return (
    <div className="space-y-6">
      {/* Financial Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="border-2 border-green-200 bg-green-50 dark:bg-green-950">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-green-600">تحصيل اليوم</p>
                <p className="text-2xl font-bold text-green-700">
                  <CurrencyAmount amount={data.todayCollection} />
                </p>
                <p className="text-xs text-green-600">
                  {data.todayPaymentsCount} دفعة
                </p>
              </div>
              <TrendingUp className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-2 border-red-200 bg-red-50 dark:bg-red-950">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-red-600">إجمالي المتبقي</p>
                <p className="text-2xl font-bold text-red-700">
                  <CurrencyAmount amount={data.totalOutstanding} />
                </p>
                <p className="text-xs text-red-600">
                  من {data.patientsWithDebt} مريض
                </p>
              </div>
              <DollarSign className="h-8 w-8 text-red-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-2 border-orange-200 bg-orange-50 dark:bg-orange-950">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-orange-600">معدل التحصيل</p>
                <p className="text-2xl font-bold text-orange-700">
                  {data.totalOutstanding + data.todayCollection > 0 
                    ? Math.round((data.todayCollection / (data.totalOutstanding + data.todayCollection)) * 100)
                    : 0}%
                </p>
                <p className="text-xs text-orange-600">اليوم</p>
              </div>
              <AlertTriangle className="h-8 w-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-2 border-blue-200 bg-blue-50 dark:bg-blue-950">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-blue-600">متوسط المديونية</p>
                <p className="text-2xl font-bold text-blue-700">
                  <CurrencyAmount 
                    amount={data.patientsWithDebt > 0 
                      ? Math.round(data.totalOutstanding / data.patientsWithDebt)
                      : 0} 
                  />
                </p>
                <p className="text-xs text-blue-600">لكل مريض</p>
              </div>
              <Users className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Outstanding Balances List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center">
              <DollarSign className="w-5 h-5 ml-2" />
              المرضى ذوو المديونيات
            </span>
            <Badge variant="secondary">
              {data.outstandingBalances.length} مريض
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {data.outstandingBalances.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              لا توجد مديونيات معلقة 🎉
            </div>
          ) : (
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {data.outstandingBalances.slice(0, 10).map((balance) => {
                const paymentPercentage = balance.total_cost > 0 
                  ? ((balance.total_paid / balance.total_cost) * 100) 
                  : 0;

                return (
                  <div 
                    key={balance.patient_id}
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 cursor-pointer transition-colors"
                    onClick={() => navigate(`/patients/${balance.patient_id}`)}
                  >
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="font-medium">{balance.patient_name}</h3>
                        <Badge 
                          variant={balance.remaining_balance > 1000 ? "destructive" : "secondary"}
                          className="ml-2"
                        >
                          <CurrencyAmount amount={balance.remaining_balance} />
                        </Badge>
                      </div>
                      <div className="space-y-1">
                        <div className="flex justify-between text-sm text-muted-foreground">
                          <span>مدفوع: <CurrencyAmount amount={balance.total_paid} /></span>
                          <span>إجمالي: <CurrencyAmount amount={balance.total_cost} /></span>
                        </div>
                        <Progress value={paymentPercentage} className="h-2" />
                      </div>
                    </div>
                  </div>
                );
              })}
              
              {data.outstandingBalances.length > 10 && (
                <div className="text-center pt-4">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => navigate("/patients")}
                  >
                    عرض جميع المرضى ({data.outstandingBalances.length - 10} أكثر)
                  </Button>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default FinancialStatusDashboard;