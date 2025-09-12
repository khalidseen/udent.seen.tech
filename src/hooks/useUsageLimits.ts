import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface UsageLimit {
  metric_type: string;
  current_count: number;
  max_count: number;
  usage_percentage: number;
}

export const useUsageLimits = (clinicId?: string) => {
  const [limits, setLimits] = useState<UsageLimit[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchUsageLimits = async () => {
    try {
      const { data, error } = await supabase
        .from('usage_tracking')
        .select('*')
        .eq('clinic_id', clinicId || 'current_clinic');

      if (error) throw error;

      const usageLimits = (data || []).map(item => ({
        metric_type: item.metric_type,
        current_count: item.current_count,
        max_count: item.max_count,
        usage_percentage: item.max_count > 0 ? (item.current_count / item.max_count) * 100 : 0
      }));

      setLimits(usageLimits);
    } catch (error) {
      console.error('Error fetching usage limits:', error);
    } finally {
      setLoading(false);
    }
  };

  const checkUsageLimit = async (metricType: string): Promise<boolean> => {
    try {
      const { data, error } = await supabase
        .rpc('check_usage_limit', {
          metric_type_param: metricType,
          clinic_id_param: clinicId
        });

      if (error) throw error;
      return data || false;
    } catch (error) {
      console.error('Error checking usage limit:', error);
      return false;
    }
  };

  const updateUsageMetric = async (metricType: string, newCount: number) => {
    try {
      const canProceed = await checkUsageLimit(metricType);
      
      if (!canProceed && newCount > 0) {
        const limit = limits.find(l => l.metric_type === metricType);
        toast({
          title: "تم الوصول للحد الأقصى",
          description: `لقد وصلت إلى الحد الأقصى المسموح لـ${metricType} (${limit?.max_count || 0}). يرجى ترقية خطتك.`,
          variant: "destructive"
        });
        return false;
      }

      const { error } = await supabase
        .rpc('update_usage_metric', {
          clinic_id_param: clinicId,
          metric_type_param: metricType,
          new_count: newCount
        });

      if (error) throw error;

      // Refresh limits after update
      await fetchUsageLimits();
      
      // Show warning if approaching limit (>80%)
      const updatedLimit = limits.find(l => l.metric_type === metricType);
      if (updatedLimit && updatedLimit.usage_percentage > 80) {
        toast({
          title: "تحذير: اقتراب من الحد الأقصى",
          description: `لقد استخدمت ${updatedLimit.usage_percentage.toFixed(1)}% من حد ${metricType}`,
          variant: "default"
        });
      }

      return true;
    } catch (error) {
      console.error('Error updating usage metric:', error);
      toast({
        title: "خطأ في تحديث الاستخدام",
        description: "فشل في تحديث إحصائيات الاستخدام",
        variant: "destructive"
      });
      return false;
    }
  };

  const getUsageStatus = (metricType: string) => {
    const limit = limits.find(l => l.metric_type === metricType);
    if (!limit) return { status: 'unknown', percentage: 0 };

    const percentage = limit.usage_percentage;
    let status = 'normal';
    
    if (percentage >= 100) status = 'exceeded';
    else if (percentage >= 90) status = 'critical';
    else if (percentage >= 75) status = 'warning';

    return { status, percentage };
  };

  useEffect(() => {
    if (clinicId) {
      fetchUsageLimits();
    }
  }, [clinicId]);

  return {
    limits,
    loading,
    checkUsageLimit,
    updateUsageMetric,
    getUsageStatus,
    refreshLimits: fetchUsageLimits
  };
};