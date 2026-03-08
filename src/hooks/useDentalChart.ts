import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useMemo } from 'react';

export interface DentalTreatmentRecord {
  id?: string;
  patient_id: string;
  clinic_id: string;
  tooth_number: string;
  numbering_system: string;
  diagnosis: string;
  treatment_plan: string;
  status: string;
  tooth_surface?: string;
  notes?: string;
  treatment_date: string;
  assigned_doctor_id?: string;
  prescribed_medications?: any;
}

export interface ChartStatistics {
  totalTeeth: number;
  recordedTeeth: number;
  healthyTeeth: number;
  decayedTeeth: number;
  filledTeeth: number;
  missingTeeth: number;
  urgentCases: number;
  rootCanalTeeth: number;
}

async function getClinicId(): Promise<string | null> {
  try {
    const { data } = await supabase.rpc('get_current_user_profile');
    return (data as any)?.id || null;
  } catch {
    return null;
  }
}

export function useDentalChart(patientId: string) {
  const queryClient = useQueryClient();

  const { data: treatments, isLoading } = useQuery({
    queryKey: ['dental-chart', patientId],
    queryFn: async () => {
      const clinicId = await getClinicId();
      if (!clinicId) return [];
      
      const { data, error } = await supabase
        .from('dental_treatments')
        .select('*')
        .eq('patient_id', patientId)
        .eq('clinic_id', clinicId)
        .order('updated_at', { ascending: false });

      if (error) throw error;
      return data || [];
    },
    enabled: !!patientId,
  });

  // Map: FDI tooth number → latest treatment record
  const toothRecordsMap = useMemo(() => {
    const map = new Map<string, DentalTreatmentRecord>();
    if (!treatments) return map;
    
    for (const t of treatments) {
      // Keep only the latest record per tooth (already sorted by updated_at desc)
      if (!map.has(t.tooth_number)) {
        map.set(t.tooth_number, t as DentalTreatmentRecord);
      }
    }
    return map;
  }, [treatments]);

  // Statistics
  const statistics: ChartStatistics = useMemo(() => {
    const stats: ChartStatistics = {
      totalTeeth: 32,
      recordedTeeth: 0,
      healthyTeeth: 0,
      decayedTeeth: 0,
      filledTeeth: 0,
      missingTeeth: 0,
      urgentCases: 0,
      rootCanalTeeth: 0,
    };

    toothRecordsMap.forEach((record) => {
      stats.recordedTeeth++;
      const d = record.diagnosis?.toLowerCase() || '';
      if (d.includes('sound') || d.includes('سليم')) stats.healthyTeeth++;
      else if (d.includes('caries') || d.includes('تسوس') || d.includes('decay')) stats.decayedTeeth++;
      else if (d.includes('filled') || d.includes('محشو')) stats.filledTeeth++;
      else if (d.includes('missing') || d.includes('مفقود')) stats.missingTeeth++;
      else if (d.includes('root_canal') || d.includes('عصب')) stats.rootCanalTeeth++;
      
      if (record.status === 'planned' && (d.includes('caries') || d.includes('تسوس'))) {
        stats.urgentCases++;
      }
    });

    return stats;
  }, [toothRecordsMap]);

  // Save/update tooth record
  const saveMutation = useMutation({
    mutationFn: async (record: Omit<DentalTreatmentRecord, 'id' | 'clinic_id'> & { id?: string }) => {
      const clinicId = await getClinicId();
      if (!clinicId) throw new Error('لم يتم العثور على العيادة');

      const payload = {
        ...record,
        clinic_id: clinicId,
        numbering_system: record.numbering_system || 'fdi',
      };

      if (record.id) {
        const { data, error } = await supabase
          .from('dental_treatments')
          .update(payload)
          .eq('id', record.id)
          .select()
          .single();
        if (error) throw error;
        return data;
      } else {
        const { id, ...insertPayload } = payload;
        const { data, error } = await supabase
          .from('dental_treatments')
          .insert(insertPayload)
          .select()
          .single();
        if (error) throw error;
        return data;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dental-chart', patientId] });
    },
  });

  // Get all treatments for a specific tooth
  const getToothHistory = (toothNumber: string) => {
    return (treatments || []).filter(t => t.tooth_number === toothNumber);
  };

  return {
    toothRecordsMap,
    treatments: treatments || [],
    statistics,
    isLoading,
    saveToothRecord: saveMutation.mutateAsync,
    isSaving: saveMutation.isPending,
    getToothHistory,
  };
}
