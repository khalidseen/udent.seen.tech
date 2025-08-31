import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface SubscriptionPlan {
  id: string;
  name: string;
  name_ar: string;
  description?: string;
  description_ar?: string;
  price: number;
  currency: string;
  duration_months: number;
  max_users: number;
  max_patients: number;
  max_monthly_appointments: number;
  max_storage_gb: number;
  is_active: boolean;
  is_customizable: boolean;
  is_trial: boolean;
  trial_duration_days?: number;
  display_order: number;
  created_at: string;
  updated_at: string;
}

interface SubscriptionFeature {
  id: string;
  feature_key: string;
  feature_name: string;
  feature_name_ar: string;
  description?: string;
  description_ar?: string;
  category: string;
  is_active: boolean;
}

interface PlanFeature {
  id: string;
  plan_id: string;
  feature_key: string;
  is_enabled: boolean;
  custom_limit?: number;
}

interface UsageMetrics {
  clinic_id: string;
  metric_type: string;
  current_count: number;
  max_count: number;
  last_updated: string;
}

export const useSubscriptionPlans = () => {
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [features, setFeatures] = useState<SubscriptionFeature[]>([]);
  const [planFeatures, setPlanFeatures] = useState<PlanFeature[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchPlans = async () => {
    try {
      const { data, error } = await supabase
        .from('subscription_plans')
        .select('*')
        .order('display_order');

      if (error) throw error;
      setPlans(data || []);
    } catch (error) {
      console.error('Error fetching plans:', error);
      toast({
        title: "خطأ",
        description: "فشل في تحميل خطط الاشتراك",
        variant: "destructive"
      });
    }
  };

  const fetchFeatures = async () => {
    try {
      const { data, error } = await supabase
        .from('subscription_features')
        .select('*')
        .eq('is_active', true)
        .order('category');

      if (error) throw error;
      setFeatures(data || []);
    } catch (error) {
      console.error('Error fetching features:', error);
    }
  };

  const fetchPlanFeatures = async () => {
    try {
      const { data, error } = await supabase
        .from('plan_features')
        .select('*');

      if (error) throw error;
      setPlanFeatures(data || []);
    } catch (error) {
      console.error('Error fetching plan features:', error);
    }
  };

  const createPlan = async (planData: Omit<SubscriptionPlan, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      const { data, error } = await supabase
        .from('subscription_plans')
        .insert([planData])
        .select()
        .single();

      if (error) throw error;

      toast({
        title: "تم بنجاح",
        description: "تم إنشاء خطة الاشتراك بنجاح"
      });

      await fetchPlans();
      return data;
    } catch (error) {
      console.error('Error creating plan:', error);
      toast({
        title: "خطأ",
        description: "فشل في إنشاء خطة الاشتراك",
        variant: "destructive"
      });
      throw error;
    }
  };

  const updatePlan = async (planId: string, updates: Partial<SubscriptionPlan>) => {
    try {
      const { data, error } = await supabase
        .from('subscription_plans')
        .update(updates)
        .eq('id', planId)
        .select()
        .single();

      if (error) throw error;

      toast({
        title: "تم التحديث",
        description: "تم تحديث خطة الاشتراك بنجاح"
      });

      await fetchPlans();
      return data;
    } catch (error) {
      console.error('Error updating plan:', error);
      toast({
        title: "خطأ",
        description: "فشل في تحديث خطة الاشتراك",
        variant: "destructive"
      });
      throw error;
    }
  };

  const updatePlanFeatures = async (planId: string, featureUpdates: { feature_key: string; is_enabled: boolean }[]) => {
    try {
      // Delete existing plan features
      await supabase
        .from('plan_features')
        .delete()
        .eq('plan_id', planId);

      // Insert new plan features
      const newFeatures = featureUpdates.map(feature => ({
        plan_id: planId,
        feature_key: feature.feature_key,
        is_enabled: feature.is_enabled
      }));

      const { error } = await supabase
        .from('plan_features')
        .insert(newFeatures);

      if (error) throw error;

      toast({
        title: "تم التحديث",
        description: "تم تحديث ميزات الخطة بنجاح"
      });

      await fetchPlanFeatures();
    } catch (error) {
      console.error('Error updating plan features:', error);
      toast({
        title: "خطأ",
        description: "فشل في تحديث ميزات الخطة",
        variant: "destructive"
      });
      throw error;
    }
  };

  const checkPlanFeature = async (featureKey: string, clinicId?: string): Promise<boolean> => {
    try {
      const { data, error } = await supabase
        .rpc('has_plan_feature', { 
          feature_key_param: featureKey,
          clinic_id_param: clinicId 
        });

      if (error) throw error;
      return data || false;
    } catch (error) {
      console.error('Error checking plan feature:', error);
      return false;
    }
  };

  const getUsageMetrics = async (clinicId: string): Promise<UsageMetrics[]> => {
    try {
      const { data, error } = await supabase
        .from('usage_tracking')
        .select('*')
        .eq('clinic_id', clinicId);

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching usage metrics:', error);
      return [];
    }
  };

  const updateUsageMetric = async (clinicId: string, metricType: string, newCount: number) => {
    try {
      const { error } = await supabase
        .rpc('update_usage_metric', {
          clinic_id_param: clinicId,
          metric_type_param: metricType,
          new_count: newCount
        });

      if (error) throw error;
    } catch (error) {
      console.error('Error updating usage metric:', error);
      throw error;
    }
  };

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await Promise.all([
        fetchPlans(),
        fetchFeatures(),
        fetchPlanFeatures()
      ]);
      setLoading(false);
    };

    loadData();
  }, []);

  return {
    plans,
    features,
    planFeatures,
    loading,
    createPlan,
    updatePlan,
    updatePlanFeatures,
    checkPlanFeature,
    getUsageMetrics,
    updateUsageMetric,
    refreshData: () => Promise.all([fetchPlans(), fetchFeatures(), fetchPlanFeatures()])
  };
};