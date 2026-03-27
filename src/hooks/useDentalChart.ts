import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useCallback, useMemo } from 'react';
import type { ChartStatistics, DentalTreatmentRecord } from '@/types/dental-enhanced';
import { buildToothRecordsMap, computeChartStatistics, isChartNoteRecord } from '@/utils/dentalChart';

export type { ChartStatistics, DentalTreatmentRecord } from '@/types/dental-enhanced';

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
    queryFn: async (): Promise<DentalTreatmentRecord[]> => {
      const clinicId = await getClinicId();
      if (!clinicId) return [];
      
      const { data, error } = await supabase
        .from('dental_treatments')
        .select('*')
        .eq('patient_id', patientId)
        .eq('clinic_id', clinicId)
        .order('updated_at', { ascending: false });

      if (error) throw error;
      return (data as DentalTreatmentRecord[]) || [];
    },
    enabled: !!patientId,
    staleTime: 30_000,
    refetchOnWindowFocus: false,
  });

  const toothRecordsMap = useMemo(() => {
    return buildToothRecordsMap(treatments || []);
  }, [treatments]);

  const chartNotes = useMemo(() => {
    return (treatments || []).filter(record => isChartNoteRecord(record));
  }, [treatments]);

  const statistics: ChartStatistics = useMemo(() => {
    return computeChartStatistics(treatments || []);
  }, [treatments]);

  const toothHistoryMap = useMemo(() => {
    const map = new Map<string, DentalTreatmentRecord[]>();
    for (const record of (treatments || [])) {
      if (isChartNoteRecord(record)) continue;
      const list = map.get(record.tooth_number) || [];
      list.push(record);
      map.set(record.tooth_number, list);
    }
    return map;
  }, [treatments]);

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

  const getToothHistory = useCallback((toothNumber: string) => {
    return toothHistoryMap.get(toothNumber) || [];
  }, [toothHistoryMap]);

  return {
    toothRecordsMap,
    treatments: treatments || [],
    chartNotes,
    statistics,
    isLoading,
    saveToothRecord: saveMutation.mutateAsync,
    isSaving: saveMutation.isPending,
    getToothHistory,
  };
}
