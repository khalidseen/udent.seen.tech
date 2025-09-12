import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useUserProfile } from '@/hooks/useUserProfile';
import { toast } from 'sonner';

interface CreatePatientData {
  full_name: string;
  phone?: string;
  email?: string;
  date_of_birth?: string;
  gender?: string;
  address?: string;
  medical_history?: string;
  national_id?: string;
  emergency_contact?: string;
  emergency_phone?: string;
  insurance_info?: string;
  blood_type?: string;
  occupation?: string;
  marital_status?: string;
  medical_condition?: string;
  financial_status?: 'paid' | 'pending' | 'overdue' | 'partial';
  financial_balance?: number;
  total_payments?: number;
  total_charges?: number;
}

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

export const useCreatePatient = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { data: profile } = useUserProfile();

  return useMutation({
    mutationFn: async (patientData: CreatePatientData) => {
      if (!user || !profile) {
        throw new Error('المستخدم غير مسجل الدخول');
      }

      // إنشاء معلومات المنشئ الحقيقية
      const creatorInfo = `[المنشئ: ${profile.full_name} - ${getRoleInArabic(profile.role)} - ${new Date().toLocaleDateString('ar-SA')}]`;
      
      // إعداد البيانات مع معلومات المنشئ
      const patientWithCreator = {
        ...patientData,
        clinic_id: profile.id,
        notes: patientData.medical_history ? `${patientData.medical_history}\n\n${creatorInfo}` : creatorInfo,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        // تعيين الحالة المالية افتراضياً
        financial_status: patientData.financial_status || 'pending',
        financial_balance: patientData.financial_balance || 0,
        total_payments: patientData.total_payments || 0,
        total_charges: patientData.total_charges || 0
      };

      const { data, error } = await supabase
        .from('patients')
        .insert([patientWithCreator])
        .select('*')
        .single();

      if (error) {
        console.error('خطأ في إضافة المريض:', error);
        throw error;
      }

      return data;
    },
    onSuccess: (data) => {
      // إبطال cache المرضى لإعادة التحميل
      queryClient.invalidateQueries({ queryKey: ['patients'] });
      
      toast.success(`تم إضافة المريض ${data.full_name} بنجاح وربطه بحسابك`);
    },
    onError: (error) => {
      console.error('خطأ في إضافة المريض:', error);
      toast.error('حدث خطأ أثناء إضافة المريض');
    }
  });
};
