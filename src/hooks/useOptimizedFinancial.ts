import { useOptimizedQuery } from "./useOptimizedQuery";
import { supabase } from "@/integrations/supabase/client";

interface FinancialSummary {
  todayCollection: number;
  totalOutstanding: number;
  outstandingBalances: PatientBalance[];
  todayPaymentsCount: number;
  patientsWithDebt: number;
}

interface PatientBalance {
  patient_id: string;
  patient_name: string;
  total_cost: number;
  total_paid: number;
  remaining_balance: number;
}

export function useOptimizedFinancialSummary(clinicId: string | null) {
  return useOptimizedQuery<FinancialSummary>(
    ['financial-summary', clinicId],
    async () => {
      if (!clinicId) {
        return {
          todayCollection: 0,
          totalOutstanding: 0,
          outstandingBalances: [],
          todayPaymentsCount: 0,
          patientsWithDebt: 0
        };
      }

      const today = new Date().toISOString().split('T')[0];

      // جلب البيانات بالتوازي
      const [paymentsResult, invoicesResult, patientsResult] = await Promise.all([
        supabase
          .from("payments")
          .select("amount, status, patient_id")
          .eq("payment_date", today)
          .eq("status", "completed"),
        
        supabase
          .from("invoices")
          .select("patient_id, total_amount, paid_amount, balance_due")
          .gt("balance_due", 0),
        
        supabase
          .from("patients")
          .select("id, full_name")
      ]);

      if (paymentsResult.error) throw paymentsResult.error;
      if (invoicesResult.error) throw invoicesResult.error;
      if (patientsResult.error) throw patientsResult.error;

      const todayPayments = paymentsResult.data || [];
      const outstandingInvoices = invoicesResult.data || [];
      const patients = patientsResult.data || [];

      // حساب التحصيل اليومي
      const todayCollection = todayPayments.reduce((sum, p) => sum + (p.amount || 0), 0);

      // إنشاء خريطة أسماء المرضى
      const patientMap = new Map(patients.map(p => [p.id, p.full_name]));

      // حساب أرصدة المرضى
      const balanceMap = new Map<string, PatientBalance>();

      outstandingInvoices.forEach(invoice => {
        const patientId = invoice.patient_id;
        const patientName = patientMap.get(patientId) || 'مريض غير معروف';

        if (!balanceMap.has(patientId)) {
          balanceMap.set(patientId, {
            patient_id: patientId,
            patient_name: patientName,
            total_cost: 0,
            total_paid: 0,
            remaining_balance: 0
          });
        }

        const balance = balanceMap.get(patientId)!;
        balance.total_cost += invoice.total_amount || 0;
        balance.total_paid += invoice.paid_amount || 0;
        balance.remaining_balance += invoice.balance_due || 0;
      });

      const outstandingBalances = Array.from(balanceMap.values())
        .sort((a, b) => b.remaining_balance - a.remaining_balance);

      const totalOutstanding = outstandingBalances.reduce((sum, b) => sum + b.remaining_balance, 0);

      return {
        todayCollection,
        totalOutstanding,
        outstandingBalances,
        todayPaymentsCount: todayPayments.length,
        patientsWithDebt: outstandingBalances.length
      };
    },
    {
      enabled: !!clinicId,
      staleTime: 3 * 60 * 1000, // 3 minutes
      cacheTime: 10 * 60 * 1000,
      localCacheMinutes: 3
    }
  );
}
