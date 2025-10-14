import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const useTreatmentPlans = (patientId?: string) => {
  const queryClient = useQueryClient();

  const { data: treatmentPlans, isLoading } = useQuery({
    queryKey: ['treatment-plans', patientId],
    queryFn: async () => {
      const { data: profile } = await supabase
        .from('profiles')
        .select('id')
        .eq('user_id', (await supabase.auth.getUser()).data.user?.id)
        .single();

      if (!profile) throw new Error('Profile not found');

      let query = supabase
        .from('dental_treatments')
        .select(`
          *,
          patients!inner (full_name, phone, email)
        `)
        .eq('clinic_id', profile.id)
        .eq('status', 'planned');

      if (patientId) {
        query = query.eq('patient_id', patientId);
      }

      const { data, error } = await query.order('treatment_date', { ascending: false });
      
      if (error) throw error;
      return data;
    },
    enabled: true,
  });

  const createTreatmentPlan = useMutation({
    mutationFn: async (planData: any) => {
      const { data: profile } = await supabase
        .from('profiles')
        .select('id')
        .eq('user_id', (await supabase.auth.getUser()).data.user?.id)
        .single();

      if (!profile) throw new Error('Profile not found');

      const { data, error } = await supabase
        .from('dental_treatments')
        .insert({
          ...planData,
          clinic_id: profile.id,
          status: 'planned',
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['treatment-plans'] });
      toast.success('تم إنشاء خطة العلاج بنجاح');
    },
    onError: (error: any) => {
      console.error('Error creating treatment plan:', error);
      toast.error('فشل في إنشاء خطة العلاج');
    },
  });

  const updateTreatmentPlan = useMutation({
    mutationFn: async ({ id, ...updates }: any) => {
      const { data, error } = await supabase
        .from('dental_treatments')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['treatment-plans'] });
      toast.success('تم تحديث خطة العلاج بنجاح');
    },
    onError: (error: any) => {
      console.error('Error updating treatment plan:', error);
      toast.error('فشل في تحديث خطة العلاج');
    },
  });

  const deleteTreatmentPlan = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('dental_treatments')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['treatment-plans'] });
      toast.success('تم حذف خطة العلاج بنجاح');
    },
    onError: (error: any) => {
      console.error('Error deleting treatment plan:', error);
      toast.error('فشل في حذف خطة العلاج');
    },
  });

  return {
    treatmentPlans,
    isLoading,
    createTreatmentPlan: createTreatmentPlan.mutate,
    updateTreatmentPlan: updateTreatmentPlan.mutate,
    deleteTreatmentPlan: deleteTreatmentPlan.mutate,
    isCreating: createTreatmentPlan.isPending,
    isUpdating: updateTreatmentPlan.isPending,
    isDeleting: deleteTreatmentPlan.isPending,
  };
};
