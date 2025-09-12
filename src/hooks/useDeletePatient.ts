import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface DeletePatientParams {
  patientId: string;
  patientName: string;
}

const deletePatient = async (patientId: string) => {
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
      toast.error(`فشل في حذف المريض "${patientName}". ${error.message || 'حدث خطأ غير متوقع'}`, {
        duration: 5000,
      });
    },
  });
};
