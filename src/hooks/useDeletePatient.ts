import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { offlineDB } from '@/lib/offline-db';
import { toast } from 'sonner';

interface DeletePatientParams {
  patientId: string;
  patientName: string;
}

const deletePatient = async (patientId: string) => {
  // حذف من قاعدة البيانات الرئيسية
  const { error } = await supabase
    .from('patients')
    .delete()
    .eq('id', patientId);

  if (error) {
    throw error;
  }

  // حذف من قاعدة البيانات المحلية
  try {
    await offlineDB.delete('patients', patientId);
  } catch (offlineError) {
    console.warn('Failed to delete from offline DB:', offlineError);
    // لا نرمي خطأ هنا لأن الحذف الرئيسي نجح
  }
};

export const useDeletePatient = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ patientId }: DeletePatientParams) => deletePatient(patientId),
    onSuccess: (_, { patientName }) => {
      // إلغاء صحة وإعادة جلب جميع استعلامات المرضى
      queryClient.invalidateQueries({ queryKey: ['patients'] });
      queryClient.invalidateQueries({ queryKey: ['patients-stats'] });
      
      // إزالة فورية من الـ cache لتجنب التأخير
      queryClient.removeQueries({ queryKey: ['patients'] });
      
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
