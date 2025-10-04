import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Patient } from '@/hooks/usePatients';
import { useCurrency } from '@/hooks/useCurrency';

interface FinancialUpdateData {
  patientId: string;
  financial_status: 'paid' | 'pending' | 'overdue' | 'partial';
  financial_balance?: number;
  total_payments?: number;
  total_charges?: number;
  payment_amount?: number;
  payment_note?: string;
}

export const useUpdatePatientFinancials = () => {
  const queryClient = useQueryClient();
  const { convertAmount, currentCurrency, formatAmount } = useCurrency();

  return useMutation({
    mutationFn: async (data: FinancialUpdateData) => {
      // تحويل المبالغ إلى الدينار العراقي قبل الحفظ في قاعدة البيانات
      const convertedBalance = data.financial_balance ? convertAmount(data.financial_balance, currentCurrency.code) : 0;
      const convertedPayment = data.payment_amount ? convertAmount(data.payment_amount, currentCurrency.code) : 0;

      // حساب الرصيد الجديد بالدينار العراقي
      let newBalance = convertedBalance;
      if (convertedPayment > 0) {
        newBalance = convertedBalance - convertedPayment;
      }

      // تحديد الحالة المالية بناءً على الرصيد
      let finalStatus = data.financial_status;
      if (newBalance <= 0) {
        finalStatus = 'paid';
      } else if (newBalance > 0 && convertedPayment > 0) {
        finalStatus = 'partial';
      } else {
        finalStatus = 'pending';
      }

      // إعداد البيانات للتحديث
      const updateData: Partial<Patient> = {
        financial_status: finalStatus
      };

      // إضافة الرصيد المحول إلى الدينار العراقي
      if (newBalance !== undefined) updateData.financial_balance = newBalance;

      // إضافة ملاحظة الدفعة إذا كانت موجودة
      if (data.payment_note && convertedPayment > 0) {
        const { data: currentPatient } = await supabase
          .from('patients')
          .select('notes')
          .eq('id', data.patientId)
          .single();

        const paymentNote = `\n[دفعة: ${formatAmount(data.payment_amount || 0)} - ${new Date().toLocaleDateString('ar-SA')} - ${data.payment_note}]`;
        updateData.notes = (currentPatient?.notes || '') + paymentNote;
      }

      // تحديث المريض
      const { data: updatedPatient, error } = await supabase
        .from('patients')
        .update(updateData)
        .eq('id', data.patientId)
        .select('*')
        .single();

      if (error) {
        throw error;
      }

      return updatedPatient;
    },
    onSuccess: (updatedPatient) => {
      // إبطال cache المرضى لإعادة التحميل
      queryClient.invalidateQueries({ queryKey: ['patients'] });
      
      toast.success(`تم تحديث الحالة المالية للمريض ${updatedPatient.full_name}`);
    },
    onError: (error) => {
      console.error('خطأ في تحديث الحالة المالية:', error);
      toast.error('حدث خطأ أثناء تحديث الحالة المالية');
    }
  });
};

// Hook لإضافة رسوم جديدة
export const useAddPatientCharges = () => {
  const queryClient = useQueryClient();
  const { convertAmount, currentCurrency, formatAmount } = useCurrency();

  return useMutation({
    mutationFn: async ({ patientId, amount, description }: { 
      patientId: string; 
      amount: number; 
      description: string; 
    }) => {
      // الحصول على البيانات الحالية للمريض
      const { data: currentPatient, error: fetchError } = await supabase
        .from('patients')
        .select('*')
        .eq('id', patientId)
        .single();

      if (fetchError) throw fetchError;

      // تحويل المبلغ إلى الدينار العراقي قبل الحفظ
      const convertedAmount = convertAmount(amount, currentCurrency.code);
      
      // حساب الرصيد الجديد (استخدام الحقول الموجودة فقط)
      const currentBalance = (currentPatient as Patient).financial_balance || 0;
      const newBalance = currentBalance + convertedAmount;

      // تحديد الحالة المالية الجديدة
      let newStatus: 'paid' | 'pending' | 'overdue' | 'partial';
      if (newBalance <= 0) {
        newStatus = 'paid';
      } else if (currentBalance < newBalance) {
        newStatus = 'pending';
      } else {
        newStatus = 'partial';
      }

      // إضافة ملاحظة الرسوم الجديدة
      const chargeNote = `\n[رسوم: ${formatAmount(amount)} - ${new Date().toLocaleDateString('ar-SA')} - ${description}]`;
      const updatedNotes = (currentPatient.notes || '') + chargeNote;

      // تحديث المريض
      const { data: updatedPatient, error: updateError } = await supabase
        .from('patients')
        .update({
          financial_balance: newBalance,
          financial_status: newStatus,
          notes: updatedNotes
        })
        .eq('id', patientId)
        .select('*')
        .single();

      if (updateError) throw updateError;

      return updatedPatient;
    },
    onSuccess: (updatedPatient) => {
      queryClient.invalidateQueries({ queryKey: ['patients'] });
      toast.success(`تمت إضافة رسوم جديدة للمريض ${(updatedPatient as Patient).full_name}`);
    },
    onError: (error) => {
      console.error('خطأ في إضافة الرسوم:', error);
      toast.error('حدث خطأ أثناء إضافة الرسوم');
    }
  });
};
