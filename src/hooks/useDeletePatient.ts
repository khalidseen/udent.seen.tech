import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface DeletePatientParams {
  patientId: string;
  patientName: string;
}

const deletePatient = async (patientId: string) => {
  // Delete all related records in correct order before deleting the patient
  // (avoids FK constraint violations)

  // 1. Delete payments (references invoices + patient)
  await supabase.from('payments').delete().eq('patient_id', patientId);

  // 2. Delete invoice items via invoices cascade — delete invoices first
  const { data: invoices } = await supabase
    .from('invoices')
    .select('id')
    .eq('patient_id', patientId);
  if (invoices?.length) {
    const invoiceIds = invoices.map(i => i.id);
    await supabase.from('invoice_items').delete().in('invoice_id', invoiceIds);
  }
  await supabase.from('invoices').delete().eq('patient_id', patientId);

  // 3. Delete prescriptions (references patient)
  await supabase.from('prescriptions').delete().eq('patient_id', patientId);

  // 4. Delete dental treatments
  await supabase.from('dental_treatments').delete().eq('patient_id', patientId);

  // 5. Delete medical images (references medical_records)
  await supabase.from('medical_images').delete().eq('patient_id', patientId);

  // 6. Delete medical records
  await supabase.from('medical_records').delete().eq('patient_id', patientId);

  // 7. Delete advanced tooth notes (triggers cascade delete of clinical_attachments)
  await supabase.from('advanced_tooth_notes').delete().eq('patient_id', patientId);

  // 8. Delete notifications
  await supabase.from('notifications').delete().eq('patient_id', patientId);

  // 9. Delete appointments
  await supabase.from('appointments').delete().eq('patient_id', patientId);

  // 10. Delete patient dental models
  await supabase.from('patient_dental_models').delete().eq('patient_id', patientId);

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
      toast.error(`فشل في حذف المريض "${patientName}". حدث خطأ غير متوقع`, {
        duration: 5000,
      });
    },
  });
};
