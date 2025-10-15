import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
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

  // Fetch financial summary data
  const { data: financialData, isLoading } = useQuery({
    queryKey: ["financial-dashboard"],
    queryFn: async () => {
      try {
        // Get today's payments
        const today = new Date().toISOString().split('T')[0];
        const { data: todayPayments, error: paymentsError } = await supabase
          .from("payments")
          .select("amount, status, patient_id")
          .eq("payment_date", today)
          .eq("status", "completed");

        if (paymentsError) throw paymentsError;

        // Get treatment plans with patient info
        const { data: treatmentPlans, error: plansError } = await supabase
          .from("treatment_plans")
          .select("id, patient_id, estimated_cost");

        if (plansError) throw plansError;

        // Get all patients to map names
        const { data: allPatients, error: patientsError } = await supabase
          .from("patients")
          .select("id, full_name");

        if (patientsError) throw patientsError;

        // Get all payments to calculate balances
        const { data: allPayments, error: allPaymentsError } = await supabase
          .from("payments")
          .select("amount, patient_id, status")
          .eq("status", "completed");

        if (allPaymentsError) throw allPaymentsError;

        // Calculate patient balances
        const patientBalances: Record<string, PatientBalance> = {};
        
        // Create patient name map
        const patientNameMap = new Map<string, string>();
        allPatients?.forEach(patient => {
          patientNameMap.set(patient.id, patient.full_name);
        });

        // Initialize with treatment plans
        treatmentPlans?.forEach(plan => {
          const patientId = plan.patient_id;
          const patientName = patientNameMap.get(patientId) || 'مريض غير معروف';
          
          if (!patientBalances[patientId]) {
            patientBalances[patientId] = {
              patient_id: patientId,
              patient_name: patientName,
              total_cost: 0,
              total_paid: 0,
              remaining_balance: 0
            };
          }
          patientBalances[patientId].total_cost += plan.estimated_cost || 0;
        });

        // Add payments
        allPayments?.forEach(payment => {
          const patientId = payment.patient_id;
          if (patientBalances[patientId]) {
            patientBalances[patientId].total_paid += payment.amount || 0;
          }
        });

        // Calculate remaining balances
        Object.values(patientBalances).forEach(balance => {
          balance.remaining_balance = balance.total_cost - balance.total_paid;
        });

        // Filter patients with outstanding balances
        const outstandingBalances = Object.values(patientBalances)
          .filter(balance => balance.remaining_balance > 0)
          .sort((a, b) => b.remaining_balance - a.remaining_balance);

        // Calculate today's collections
        const todayCollection = todayPayments?.reduce((sum, payment) => sum + (payment.amount || 0), 0) || 0;

        // Calculate total outstanding
        const totalOutstanding = outstandingBalances.reduce((sum, balance) => sum + balance.remaining_balance, 0);

        return {
          todayCollection,
          totalOutstanding,
          outstandingBalances,
          todayPaymentsCount: todayPayments?.length || 0,
          patientsWithDebt: outstandingBalances.length
        };
      } catch (error) {
        console.error("Error fetching financial data:", error);
        throw error;
      }
    },
    refetchInterval: 5 * 60 * 1000 // Refresh every 5 minutes
  });

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