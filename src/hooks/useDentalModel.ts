import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface UseDentalModelProps {
  patientId: string;
  toothNumber: string;
  numberingSystem: string;
}

export const useDentalModel = ({ patientId, toothNumber, numberingSystem }: UseDentalModelProps) => {
  return useQuery({
    queryKey: ['dental-model', patientId, toothNumber, numberingSystem],
    queryFn: async () => {
      // أولاً، البحث عن نموذج مخصص للمريض
      const { data: patientModel, error: patientError } = await supabase
        .from('patient_dental_models')
        .select('*')
        .eq('patient_id', patientId)
        .eq('tooth_number', toothNumber)
        .eq('numbering_system', numberingSystem)
        .single();

      if (patientModel && !patientError) {
        // الحصول على URL العام للنموذج المخصص
        const { data: { publicUrl } } = supabase.storage
          .from('dental-3d-models')
          .getPublicUrl(patientModel.model_path);
        
        return {
          type: 'patient',
          modelUrl: publicUrl,
          annotations: patientModel.annotations || [],
          modifications: patientModel.modifications || {}
        };
      }

      // إذا لم يوجد نموذج مخصص، البحث عن النموذج الافتراضي
      const { data: defaultModel, error: defaultError } = await supabase
        .from('dental_3d_models')
        .select('*')
        .eq('tooth_number', toothNumber)
        .eq('numbering_system', numberingSystem)
        .eq('model_type', 'default')
        .eq('is_active', true)
        .single();

      if (defaultModel && !defaultError) {
        // الحصول على URL العام للنموذج الافتراضي
        const { data: { publicUrl } } = supabase.storage
          .from('dental-3d-models')
          .getPublicUrl(defaultModel.model_path);
        
        return {
          type: 'default',
          modelUrl: publicUrl,
          annotations: [],
          modifications: {}
        };
      }

      // إذا لم يوجد أي نموذج، إرجاع null لاستخدام النموذج الافتراضي المولد
      return {
        type: 'generated',
        modelUrl: null,
        annotations: [],
        modifications: {}
      };
    }
  });
};