import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface UsePatientDentalModelsProps {
  patientId: string;
  numberingSystem?: string;
}

export const usePatientDentalModels = ({ patientId, numberingSystem = 'universal' }: UsePatientDentalModelsProps) => {
  return useQuery({
    queryKey: ['patient-dental-models', patientId, numberingSystem],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('patient_dental_models')
        .select(`
          id,
          tooth_number,
          numbering_system,
          model_path,
          annotations,
          modifications,
          created_at
        `)
        .eq('patient_id', patientId)
        .eq('numbering_system', numberingSystem);

      if (error) throw error;

      // تحويل البيانات إلى format مناسب للعرض
      const modelsMap: Record<string, {
        modelUrl: string;
        annotations: any[];
        modifications: any;
        hasCustomModel: boolean;
      }> = {};

      data.forEach(model => {
        // الحصول على URL العام للنموذج
        const { data: { publicUrl } } = supabase.storage
          .from('dental-3d-models')
          .getPublicUrl(model.model_path);

        modelsMap[model.tooth_number] = {
          modelUrl: publicUrl,
          annotations: Array.isArray(model.annotations) ? model.annotations : [],
          modifications: model.modifications || {},
          hasCustomModel: true
        };
      });

      return modelsMap;
    },
    enabled: !!patientId
  });
};