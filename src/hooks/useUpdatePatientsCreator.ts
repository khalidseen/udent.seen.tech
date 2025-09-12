import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useUserProfile } from '@/hooks/useUserProfile';
import { toast } from 'sonner';

export const useUpdatePatientsCreator = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { data: profile } = useUserProfile();

  return useMutation({
    mutationFn: async () => {
      if (!user || !profile) {
        throw new Error('المستخدم غير مسجل الدخول');
      }

      // تحديث جميع المرضى الذين لا يحتوون على معلومات منشئ
      const { data, error } = await supabase
        .from('patients')
        .update({
          created_by_id: user.id,
          created_by_name: profile.full_name,
          created_by_role: profile.role,
          last_modified_by_id: user.id,
          last_modified_by_name: profile.full_name,
          last_modified_by_role: profile.role
        })
        .is('created_by_id', null)
        .select('id, full_name');

      if (error) {
        throw error;
      }

      return data;
    },
    onSuccess: (data) => {
      // إبطال cache المرضى لإعادة التحميل
      queryClient.invalidateQueries({ queryKey: ['patients'] });
      
      if (data && data.length > 0) {
        toast.success(`تم تحديث معلومات المنشئ لـ ${data.length} مريض`);
      } else {
        toast.success('جميع المرضى محدثين بالفعل');
      }
    },
    onError: (error) => {
      console.error('خطأ في تحديث معلومات المنشئ:', error);
      toast.error('حدث خطأ أثناء تحديث معلومات المنشئ');
    }
  });
};
