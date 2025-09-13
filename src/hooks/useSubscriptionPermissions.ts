import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';

interface PlanPermission {
  id: string;
  plan_id: string;
  permission_key: string;
  is_enabled: boolean;
}

interface PlanLimits {
  max_users: number;
  max_patients: number;
  max_monthly_appointments: number;
  max_storage_gb: number;
  current_users: number;
  current_patients: number;
  current_appointments: number;
  current_storage: number;
}

export const useSubscriptionPermissions = () => {
  const [planPermissions, setPlanPermissions] = useState<PlanPermission[]>([]);
  const [planLimits, setPlanLimits] = useState<PlanLimits | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const { user } = useAuth();

  const fetchPlanPermissions = async () => {
    try {
      const { data: profile } = await supabase
        .from('profiles')
        .select('clinic_id')
        .eq('user_id', user?.id)
        .single();

      if (!profile?.clinic_id) return;

      const { data: clinic } = await supabase
        .from('clinics')
        .select('subscription_plan_id')
        .eq('id', profile.clinic_id)
        .single();

      if (!clinic?.subscription_plan_id) return;

      const { data, error } = await supabase
        .from('plan_permissions')
        .select('*')
        .eq('plan_id', clinic.subscription_plan_id);

      if (error) throw error;
      setPlanPermissions(data || []);
    } catch (error) {
      console.error('Error fetching plan permissions:', error);
      toast({
        title: "خطأ",
        description: "فشل في تحميل صلاحيات الخطة",
        variant: "destructive"
      });
    }
  };

  const fetchPlanLimits = async () => {
    try {
      const { data: profile } = await supabase
        .from('profiles')
        .select('clinic_id')
        .eq('user_id', user?.id)
        .single();

      if (!profile?.clinic_id) return;

      const { data: clinic } = await supabase
        .from('clinics')
        .select(`
          *,
          subscription_plans!inner(*)
        `)
        .eq('id', profile.clinic_id)
        .single();

      if (!clinic) return;

      // Get current usage
      const { data: usersCount } = await supabase
        .from('profiles')
        .select('id', { count: 'exact' })
        .eq('clinic_id', profile.clinic_id);

      const { data: patientsCount } = await supabase
        .from('patients')
        .select('id', { count: 'exact' })
        .eq('clinic_id', profile.clinic_id);

      const { data: appointmentsCount } = await supabase
        .from('appointments')
        .select('id', { count: 'exact' })
        .eq('clinic_id', profile.clinic_id)
        .gte('appointment_date', new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString());

      const plan = (clinic.subscription_plans as any);
      
      setPlanLimits({
        max_users: plan.max_users || 0,
        max_patients: plan.max_patients || 0,
        max_monthly_appointments: plan.max_monthly_appointments || 0,
        max_storage_gb: plan.max_storage_gb || 0,
        current_users: usersCount?.length || 0,
        current_patients: patientsCount?.length || 0,
        current_appointments: appointmentsCount?.length || 0,
        current_storage: 0 // يمكن تحسينه لاحقاً
      });
    } catch (error) {
      console.error('Error fetching plan limits:', error);
    }
  };

  const checkPlanPermission = (permissionKey: string): boolean => {
    return planPermissions.some(p => 
      p.permission_key === permissionKey && p.is_enabled
    );
  };

  const checkUsageLimit = (type: 'users' | 'patients' | 'appointments' | 'storage'): boolean => {
    if (!planLimits) return true;
    
    switch (type) {
      case 'users':
        return planLimits.current_users < planLimits.max_users;
      case 'patients':
        return planLimits.current_patients < planLimits.max_patients;
      case 'appointments':
        return planLimits.current_appointments < planLimits.max_monthly_appointments;
      case 'storage':
        return planLimits.current_storage < planLimits.max_storage_gb;
      default:
        return true;
    }
  };

  const getUsagePercentage = (type: 'users' | 'patients' | 'appointments' | 'storage'): number => {
    if (!planLimits) return 0;
    
    switch (type) {
      case 'users':
        return Math.round((planLimits.current_users / planLimits.max_users) * 100);
      case 'patients':
        return Math.round((planLimits.current_patients / planLimits.max_patients) * 100);
      case 'appointments':
        return Math.round((planLimits.current_appointments / planLimits.max_monthly_appointments) * 100);
      case 'storage':
        return Math.round((planLimits.current_storage / planLimits.max_storage_gb) * 100);
      default:
        return 0;
    }
  };

  const shouldShowUpgradeAlert = (): boolean => {
    if (!planLimits) return false;
    
    return getUsagePercentage('users') >= 80 ||
           getUsagePercentage('patients') >= 80 ||
           getUsagePercentage('appointments') >= 80 ||
           getUsagePercentage('storage') >= 80;
  };

  useEffect(() => {
    if (user) {
      const loadData = async () => {
        setLoading(true);
        await Promise.all([
          fetchPlanPermissions(),
          fetchPlanLimits()
        ]);
        setLoading(false);
      };
      loadData();
    }
  }, [user]);

  return {
    planPermissions,
    planLimits,
    loading,
    checkPlanPermission,
    checkUsageLimit,
    getUsagePercentage,
    shouldShowUpgradeAlert,
    refreshData: () => Promise.all([fetchPlanPermissions(), fetchPlanLimits()])
  };
};