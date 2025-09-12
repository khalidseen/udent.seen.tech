import React from 'react';
import { Button } from '@/components/ui/button';
import { Plus, Users } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

const AddSamplePatientsButton = () => {
  const addSamplePatients = async () => {
    try {
      const samplePatients = [
        {
          clinic_id: 'default-clinic-id',
          full_name: 'أحمد محمد علي',
          phone: '07901234567',
          email: 'ahmed@email.com',
          date_of_birth: '1990-01-15',
          gender: 'male',
          address: 'بغداد - الكرادة',
          medical_history: 'لا يوجد تاريخ مرضي'
        },
        {
          clinic_id: 'default-clinic-id',
          full_name: 'فاطمة حسن جعفر',
          phone: '07901234568',
          email: 'fatima@email.com',
          date_of_birth: '1985-05-20',
          gender: 'female',
          address: 'بغداد - الجادرية',
          medical_history: 'حساسية من البنسلين'
        },
        {
          clinic_id: 'default-clinic-id',
          full_name: 'علي كريم صالح',
          phone: '07901234569',
          email: 'ali@email.com',
          date_of_birth: '1995-03-10',
          gender: 'male',
          address: 'بغداد - المنصور',
          medical_history: 'إجراء جراحة أسنان سابقة'
        }
      ];

      const { data, error } = await supabase
        .from('patients')
        .upsert(samplePatients, { 
          onConflict: 'id',
          ignoreDuplicates: false 
        });

      if (error) throw error;

      toast.success('تم إضافة المرضى التجريبيين بنجاح!', {
        description: `تم إضافة ${samplePatients.length} مرضى إلى النظام`
      });

    } catch (error) {
      console.error('Error adding sample patients:', error);
      toast.error('فشل في إضافة المرضى التجريبيين', {
        description: error instanceof Error ? error.message : 'حدث خطأ غير متوقع'
      });
    }
  };

  return (
    <Button 
      onClick={addSamplePatients}
      variant="outline"
      className="flex items-center gap-2"
    >
      <Users className="h-4 w-4" />
      إضافة مرضى تجريبيين
    </Button>
  );
};

export default AddSamplePatientsButton;
