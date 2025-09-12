// Fixed Dental Chart Hook for compatibility
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { ToothRecord, ConditionType, PriorityLevel } from '@/types/dentalChart';

interface UseDentalChartProps {
  patientId: string;
  clinicId: string;
}

export const useDentalChartFixed = ({ patientId, clinicId }: UseDentalChartProps) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // استعلام السجلات
  const { data: records, isLoading, error, refetch } = useQuery({
    queryKey: ['tooth-records-fixed', patientId],
    queryFn: async () => {
      if (!patientId) return [];
      
      const { data, error } = await supabase
        .from('advanced_tooth_notes')
        .select('*')
        .eq('patient_id', patientId)
        .order('tooth_number');
      
      if (error) {
        console.error('Error fetching tooth records:', error);
        throw error;
      }
      
      return data?.map(record => ({
        id: record.id,
        tooth_number: record.tooth_number,
        patient_id: record.patient_id,
        clinic_id: record.clinic_id,
        diagnosis: {
          primary_condition: ConditionType.SOUND,
          priority_level: PriorityLevel.LOW,
          diagnosis_notes: record.diagnosis || ''
        },
        surfaces: {
          mesial: 'sound',
          distal: 'sound',
          buccal: 'sound',
          lingual: 'sound',
          occlusal: 'sound',
          incisal: 'sound'
        },
        clinical_measurements: {
          mobility: 0,
          pocket_depths: {
            mesial_buccal: 0,
            mid_buccal: 0,
            distal_buccal: 0,
            mesial_lingual: 0,
            mid_lingual: 0,
            distal_lingual: 0
          },
          bleeding_on_probing: false,
          gingival_recession: {
            buccal: 0,
            lingual: 0
          },
          plaque_index: 0
        },
        roots: {
          number_of_roots: 1,
          root_conditions: [],
          root_canal_treatment: {
            completed: false
          }
        },
        notes: {
          clinical_notes: record.content || '',
          treatment_plan: record.treatment_plan || '',
          additional_comments: record.diagnosis || ''
        },
        imageUrl: record.attachments?.[0]?.url,
        imageData: record.attachments?.[0]?.data,
        priority: record.priority as PriorityLevel,
        created_at: record.created_at,
        updated_at: record.updated_at
      } as ToothRecord)) || [];
    },
    enabled: !!patientId,
  });

  // حفظ السجل
  const saveToothRecord = useMutation({
    mutationFn: async (record: ToothRecord) => {
      const saveData = {
        id: record.id,
        tooth_number: record.tooth_number,
        patient_id: record.patient_id,
        clinic_id: record.clinic_id,
        title: `سن رقم ${record.tooth_number}`,
        content: record.notes.clinical_notes,
        diagnosis: record.notes.additional_comments,
        treatment_plan: record.notes.treatment_plan,
        priority: record.priority || 'medium',
        note_type: 'dental',
        numbering_system: 'universal'
      };
      
      const { data, error } = await supabase
        .from('advanced_tooth_notes')
        .upsert([saveData])
        .select()
        .single();
      
      if (error) {
        console.error('Error saving tooth record:', error);
        throw error;
      }
      
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tooth-records-fixed', patientId] });
      toast({
        title: "تم الحفظ",
        description: "تم حفظ بيانات السن بنجاح"
      });
    },
    onError: (error) => {
      console.error('Error saving tooth record:', error);
      toast({
        title: "خطأ في الحفظ",
        description: "فشل في حفظ بيانات السن",
        variant: "destructive"
      });
    }
  });

  // حذف السجل
  const deleteToothRecord = useMutation({
    mutationFn: async (recordId: string) => {
      const { error } = await supabase
        .from('advanced_tooth_notes')
        .delete()
        .eq('id', recordId);
      
      if (error) {
        console.error('Error deleting tooth record:', error);
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tooth-records-fixed', patientId] });
      toast({
        title: "تم الحذف",
        description: "تم حذف بيانات السن بنجاح"
      });
    },
    onError: (error) => {
      console.error('Error deleting tooth record:', error);
      toast({
        title: "خطأ في الحذف",
        description: "فشل في حذف بيانات السن",
        variant: "destructive"
      });
    }
  });

  return {
    records: records || [],
    isLoading,
    error,
    refetch,
    saveToothRecord: saveToothRecord.mutate,
    deleteToothRecord: deleteToothRecord.mutate,
    isSaving: saveToothRecord.isPending,
    isDeleting: deleteToothRecord.isPending
  };
};