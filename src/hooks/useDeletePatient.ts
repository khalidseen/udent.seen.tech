import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface DeletePatientParams {
  patientId: string;
  patientName: string;
}

const ensureNoError = (
  error: { message?: string; code?: string } | null,
  step: string
) => {
  if (error) {
    throw new Error(`${step}: ${error.message || 'Unknown database error'}`);
  }
};

const deletePatient = async (patientId: string) => {
  // Delete all related records in correct order before deleting the patient
  // (avoids FK constraint violations)

  // 1. Delete payments (references invoices + patient)
  {
    const { error } = await supabase.from('payments').delete().eq('patient_id', patientId);
    ensureNoError(error, 'Failed deleting payments');
  }

  // 2. Delete invoice items via invoices cascade — delete invoices first
  const { data: invoices, error: invoicesError } = await supabase
    .from('invoices')
    .select('id')
    .eq('patient_id', patientId);
  ensureNoError(invoicesError, 'Failed loading invoices');

  if (invoices?.length) {
    const invoiceIds = invoices.map(i => i.id);
    const { error } = await supabase.from('invoice_items').delete().in('invoice_id', invoiceIds);
    ensureNoError(error, 'Failed deleting invoice items');
  }
  {
    const { error } = await supabase.from('invoices').delete().eq('patient_id', patientId);
    ensureNoError(error, 'Failed deleting invoices');
  }

  // 3. Delete treatment plans
  {
    const { error } = await supabase.from('treatment_plans').delete().eq('patient_id', patientId);
    ensureNoError(error, 'Failed deleting treatment plans');
  }

  // 4. Delete prescriptions (references patient)
  {
    const { error } = await supabase.from('prescriptions').delete().eq('patient_id', patientId);
    ensureNoError(error, 'Failed deleting prescriptions');
  }

  // 5. Delete dental treatments
  {
    const { error } = await supabase.from('dental_treatments').delete().eq('patient_id', patientId);
    ensureNoError(error, 'Failed deleting dental treatments');
  }

  // 6. Delete medical images (references medical_records)
  {
    const { error } = await supabase.from('medical_images').delete().eq('patient_id', patientId);
    ensureNoError(error, 'Failed deleting medical images');
  }

  // 7. Delete medical records
  {
    const { error } = await supabase.from('medical_records').delete().eq('patient_id', patientId);
    ensureNoError(error, 'Failed deleting medical records');
  }

  // 8. Delete advanced tooth notes (triggers cascade delete of clinical_attachments)
  {
    const { error } = await supabase.from('advanced_tooth_notes').delete().eq('patient_id', patientId);
    ensureNoError(error, 'Failed deleting advanced tooth notes');
  }

  // 9. Delete notifications
  {
    const { error } = await supabase.from('notifications').delete().eq('patient_id', patientId);
    ensureNoError(error, 'Failed deleting notifications');
  }

  // 10. Delete appointments
  {
    const { error } = await supabase.from('appointments').delete().eq('patient_id', patientId);
    ensureNoError(error, 'Failed deleting appointments');
  }

  // 11. Delete patient dental models
  {
    const { error } = await supabase.from('patient_dental_models').delete().eq('patient_id', patientId);
    ensureNoError(error, 'Failed deleting patient dental models');
  }

  // Finally delete the patient
  const { error } = await supabase
    .from('patients')
    .delete()
    .eq('id', patientId);

  if (error) {
    throw error;
  }
};

export const useDeletePatient = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ patientId }: DeletePatientParams) => deletePatient(patientId),
    onSuccess: (_, { patientName }) => {
      // Invalidate patients query to refetch data
      queryClient.invalidateQueries({ queryKey: ['patients'] });
      queryClient.invalidateQueries({ queryKey: ['patients-stats'] });
      
      toast.success(`تم حذف المريض "${patientName}" بنجاح`, {
        duration: 3000,
      });
    },
    onError: (error: Error, { patientName }) => {
      console.error('Error deleting patient:', error);
      const message = error?.message || 'حدث خطأ غير متوقع';
      toast.error(`فشل في حذف المريض "${patientName}": ${message}`, {
        duration: 5000,
      });
    },
  });
};
