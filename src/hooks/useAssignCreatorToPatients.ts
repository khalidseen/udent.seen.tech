import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useUserProfile } from '@/hooks/useUserProfile';
import { toast } from 'sonner';

export const useAssignCreatorToPatients = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { data: profile } = useUserProfile();

  return useMutation({
    mutationFn: async () => {
      if (!user || !profile) {
        throw new Error('المستخدم غير مسجل الدخول');
      }

      // الحصول على جميع المرضى التابعين للعيادة
      const { data: patients, error: fetchError } = await supabase
        .from('patients')
        .select('id, full_name, notes')
        .eq('clinic_id', profile.id);

      if (fetchError) throw fetchError;

      if (!patients || patients.length === 0) {
        throw new Error('لا توجد مرضى للتحديث');
      }

      let updatedCount = 0;

      // تحديث كل مريض بمعلومات المنشئ الحقيقية
      for (const patient of patients) {
        // التحقق من عدم وجود معلومات منشئ مسبقاً
        if (!patient.notes?.includes(`[المنشئ: ${profile.full_name}`)) {
          const creatorInfo = `[المنشئ: ${profile.full_name} - ${getRoleInArabic(profile.role)} - ${new Date().toLocaleDateString('ar-SA')}]`;
          const updatedNotes = patient.notes ? `${patient.notes}\n\n${creatorInfo}` : creatorInfo;
          
          const { error: updateError } = await supabase
            .from('patients')
            .update({ 
              notes: updatedNotes,
              updated_at: new Date().toISOString()
            })
            .eq('id', patient.id);

          if (updateError) {
            console.error(`خطأ في تحديث المريض ${patient.full_name}:`, updateError);
          } else {
            updatedCount++;
          }
        }
      }

      return { total: patients.length, updated: updatedCount };
    },
    onSuccess: (data) => {
      // إبطال cache المرضى لإعادة التحميل
      queryClient.invalidateQueries({ queryKey: ['patients'] });
      
      if (data.updated > 0) {
        toast.success(`تم ربط ${data.updated} مريض بحسابك بنجاح`);
      } else {
        toast.info('جميع المرضى مرتبطين بحسابك بالفعل');
      }
    },
    onError: (error) => {
      console.error('خطأ في ربط المرضى:', error);
      toast.error('حدث خطأ أثناء ربط المرضى بحسابك');
    }
  });
};

const getRoleInArabic = (role?: string): string => {
  switch (role) {
    case 'doctor': return 'طبيب';
    case 'assistant': return 'مساعد طبيب';
    case 'secretary': return 'سكرتير';
    case 'admin': return 'مدير العيادة';
    case 'super_admin': return 'مدير عام';
    default: return 'موظف';
  }
};
