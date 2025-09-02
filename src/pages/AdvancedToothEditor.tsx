import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { FullScreenToothEditor } from '@/components/dental/FullScreenToothEditor';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';

export default function AdvancedToothEditor() {
  const { patientId, toothNumber } = useParams<{
    patientId: string;
    toothNumber: string;
  }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  // جلب معلومات المريض للتحقق من الصلاحيات
  const { data: patient, isLoading, error } = useQuery({
    queryKey: ['patient', patientId],
    queryFn: async () => {
      if (!patientId || !user) return null;
      
      // الحصول على clinic_id من الملف الشخصي للمستخدم
      const { data: profile } = await supabase
        .from('profiles')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (!profile) {
        throw new Error('لم يتم العثور على الملف الشخصي');
      }

      // جلب بيانات المريض
      const { data, error } = await supabase
        .from('patients')
        .select('id, full_name, phone, email')
        .eq('id', patientId)
        .eq('clinic_id', profile.id)
        .single();

      if (error) throw error;
      return data;
    },
    enabled: !!patientId && !!user
  });

  const handleSave = async (data: any) => {
    try {
      // منطق حفظ البيانات
      console.log('Saving editor data:', data);
      toast.success('تم حفظ التعديلات بنجاح');
    } catch (error) {
      console.error('Error saving data:', error);
      toast.error('فشل في حفظ التعديلات');
    }
  };

  const handleClose = () => {
    // إذا كان المحرر يعمل في نافذة منبثقة، أغلقها
    if (window.opener) {
      window.close();
    } else {
      // وإلا اذهب إلى صفحة المريض
      navigate(`/patients/${patientId}`);
    }
  };

  // عرض شاشة التحميل
  if (isLoading || !user) {
    return (
      <div className="fixed inset-0 bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin mx-auto" />
          <p className="text-muted-foreground">جاري تحميل محرر الأسنان...</p>
        </div>
      </div>
    );
  }

  // عرض رسالة خطأ
  if (error || !patient || !patientId || !toothNumber) {
    return (
      <div className="fixed inset-0 bg-background flex items-center justify-center">
        <div className="text-center space-y-4 max-w-md p-6">
          <div className="text-6xl">⚠️</div>
          <h2 className="text-xl font-bold">خطأ في التحميل</h2>
          <p className="text-muted-foreground">
            {error ? 'حدث خطأ أثناء تحميل بيانات المريض' : 'معلومات غير مكتملة'}
          </p>
          <button
            onClick={handleClose}
            className="bg-primary text-primary-foreground px-6 py-2 rounded-lg hover:bg-primary/90 transition-colors"
          >
            إغلاق والعودة
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-screen overflow-hidden">
      <FullScreenToothEditor
        toothNumber={toothNumber}
        patientId={patientId}
        numberingSystem="universal"
        onClose={handleClose}
        onSave={handleSave}
      />
      
      {/* معلومات المريض في الزاوية */}
      <div className="fixed top-16 right-4 bg-card/90 backdrop-blur-sm border rounded-lg p-3 shadow-lg z-40">
        <div className="text-sm space-y-1">
          <div className="font-medium">{patient.full_name}</div>
          <div className="text-muted-foreground text-xs">
            {patient.phone && `📞 ${patient.phone}`}
          </div>
          <div className="text-muted-foreground text-xs">
            {patient.email && `📧 ${patient.email}`}
          </div>
        </div>
      </div>
    </div>
  );
}