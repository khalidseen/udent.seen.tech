import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface FinancialStatus {
  total_charges: number;
  total_payments: number;
  balance_due: number;
  status: 'paid' | 'pending' | 'partial' | 'overdue';
}

export const usePatientFinancials = (patientId: string) => {
  const [financialStatus, setFinancialStatus] = useState<FinancialStatus>({
    total_charges: 0,
    total_payments: 0,
    balance_due: 0,
    status: 'pending'
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchFinancialStatus = async () => {
    if (!patientId) return;
    
    setLoading(true);
    setError(null);
    
    try {
      // استخدام الدالة الجديدة لحساب الحالة المالية
      const { data, error: rpcError } = await supabase.rpc(
        'calculate_patient_financial_status',
        { patient_id_param: patientId }
      );

      if (rpcError) {
        console.error('Error calculating financial status:', rpcError);
        setError(rpcError.message);
        return;
      }

      if (data && data.length > 0) {
        const result = data[0];
        setFinancialStatus({
          total_charges: Number(result.total_charges) || 0,
          total_payments: Number(result.total_payments) || 0,
          balance_due: Number(result.balance_due) || 0,
          status: result.status as 'paid' | 'pending' | 'partial' | 'overdue'
        });
      }
    } catch (err) {
      console.error('Error fetching financial status:', err);
      setError('فشل في تحميل البيانات المالية');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFinancialStatus();
  }, [patientId]);

  return {
    financialStatus,
    loading,
    error,
    refetch: fetchFinancialStatus
  };
};