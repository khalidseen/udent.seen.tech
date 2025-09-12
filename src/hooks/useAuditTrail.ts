import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface SecurityEvent {
  id: string;
  event_type: string;
  event_category: string;
  sensitivity_level: string;
  user_id?: string;
  clinic_id?: string;
  table_name?: string;
  record_id?: string;
  operation?: string;
  old_data?: any;
  new_data?: any;
  context_data?: any;
  ip_address?: string;
  user_agent?: string;
  session_id?: string;
  geolocation?: any;
  success: boolean;
  error_message?: string;
  risk_score: number;
  created_at: string;
  processed_for_alerts: boolean;
}

export interface SecurityAlert {
  id: string;
  clinic_id: string;
  alert_type: string;
  severity: string;
  title: string;
  description: string;
  triggered_by_event_id?: string;
  user_id?: string;
  metadata?: any;
  status: string;
  resolved_by?: string;
  resolved_at?: string;
  resolution_notes?: string;
  created_at: string;
  updated_at: string;
}

export interface AuditStatistics {
  total_events: number;
  events_by_category: Record<string, number>;
  events_by_sensitivity: Record<string, number>;
  high_risk_events: number;
  active_alerts: number;
}

export const useAuditTrail = () => {
  const [events, setEvents] = useState<SecurityEvent[]>([]);
  const [alerts, setAlerts] = useState<SecurityAlert[]>([]);
  const [statistics, setStatistics] = useState<AuditStatistics | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchEvents = async (filters?: {
    days?: number;
    category?: string;
    sensitivity?: string;
    search?: string;
    limit?: number;
  }) => {
    try {
      setLoading(true);
      
      let query = supabase
        .from('security_events')
        .select('*')
        .order('created_at', { ascending: false });

      if (filters?.days) {
        const daysAgo = new Date();
        daysAgo.setDate(daysAgo.getDate() - filters.days);
        query = query.gte('created_at', daysAgo.toISOString());
      }

      if (filters?.category && filters.category !== '') {
        query = query.eq('event_category', filters.category as any);
      }

      if (filters?.sensitivity && filters.sensitivity !== '') {
        query = query.eq('sensitivity_level', filters.sensitivity as any);
      }

      if (filters?.search) {
        query = query.or(`event_type.ilike.%${filters.search}%,table_name.ilike.%${filters.search}%,operation.ilike.%${filters.search}%`);
      }

      if (filters?.limit) {
        query = query.limit(filters.limit);
      } else {
        query = query.limit(100);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching security events:', error);
        throw error;
      }

      setEvents((data || []) as SecurityEvent[]);
    } catch (error) {
      console.error('Error in fetchEvents:', error);
      toast({
        title: 'خطأ في جلب سجل التدقيق',
        description: 'حدث خطأ أثناء جلب أحداث الأمان',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchAlerts = async (status?: string) => {
    try {
      let query = supabase
        .from('security_alerts')
        .select('*')
        .order('created_at', { ascending: false });

      if (status) {
        query = query.eq('status', status);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching security alerts:', error);
        throw error;
      }

      setAlerts((data || []) as SecurityAlert[]);
    } catch (error) {
      console.error('Error in fetchAlerts:', error);
      toast({
        title: 'خطأ في جلب التنبيهات',
        description: 'حدث خطأ أثناء جلب التنبيهات الأمنية',
        variant: 'destructive',
      });
    }
  };

  const fetchStatistics = async (daysBack: number = 7) => {
    try {
      const { data, error } = await supabase.rpc('get_audit_statistics', {
        days_back: daysBack
      });

      if (error) {
        console.error('Error fetching audit statistics:', error);
        throw error;
      }

      setStatistics(data as unknown as AuditStatistics);
    } catch (error) {
      console.error('Error in fetchStatistics:', error);
      toast({
        title: 'خطأ في جلب الإحصائيات',
        description: 'حدث خطأ أثناء جلب إحصائيات التدقيق',
        variant: 'destructive',
      });
    }
  };

  const updateAlertStatus = async (
    alertId: string, 
    status: 'open' | 'investigating' | 'resolved' | 'false_positive',
    resolutionNotes?: string
  ) => {
    try {
      const { error } = await supabase
        .from('security_alerts')
        .update({
          status,
          resolved_by: status !== 'open' ? (await supabase.auth.getUser()).data.user?.id : null,
          resolved_at: status !== 'open' ? new Date().toISOString() : null,
          resolution_notes: resolutionNotes || null,
          updated_at: new Date().toISOString()
        })
        .eq('id', alertId);

      if (error) {
        console.error('Error updating alert status:', error);
        throw error;
      }

      // Refresh alerts
      await fetchAlerts();

      toast({
        title: 'تم تحديث التنبيه',
        description: 'تم تحديث حالة التنبيه الأمني بنجاح',
      });

      return true;
    } catch (error) {
      console.error('Error in updateAlertStatus:', error);
      toast({
        title: 'خطأ في تحديث التنبيه',
        description: 'حدث خطأ أثناء تحديث حالة التنبيه',
        variant: 'destructive',
      });
      return false;
    }
  };

  const runSuspiciousActivityDetection = async () => {
    try {
      const { error } = await supabase.rpc('detect_suspicious_activities');

      if (error) {
        console.error('Error running suspicious activity detection:', error);
        throw error;
      }

      // Refresh alerts after detection
      await fetchAlerts();

      toast({
        title: 'تم فحص الأنشطة المشبوهة',
        description: 'تم تشغيل نظام كشف الأنشطة المشبوهة',
      });

      return true;
    } catch (error) {
      console.error('Error in runSuspiciousActivityDetection:', error);
      toast({
        title: 'خطأ في فحص الأنشطة',
        description: 'حدث خطأ أثناء فحص الأنشطة المشبوهة',
        variant: 'destructive',
      });
      return false;
    }
  };

  const getCategoryDisplayName = (category: string) => {
    const categoryNames = {
      authentication: 'المصادقة',
      data_access: 'الوصول للبيانات',
      data_modification: 'تعديل البيانات',
      permission_change: 'تغيير الصلاحيات',
      system_admin: 'إدارة النظام',
      financial: 'مالية',
      medical_record: 'السجلات الطبية'
    };
    return categoryNames[category as keyof typeof categoryNames] || category;
  };

  const getSensitivityDisplayName = (sensitivity: string) => {
    const sensitivityNames = {
      normal: 'عادي',
      sensitive: 'حساس',
      critical: 'حرج'
    };
    return sensitivityNames[sensitivity as keyof typeof sensitivityNames] || sensitivity;
  };

  const getSeverityDisplayName = (severity: string) => {
    const severityNames = {
      low: 'منخفض',
      medium: 'متوسط',
      high: 'عالي',
      critical: 'حرج'
    };
    return severityNames[severity as keyof typeof severityNames] || severity;
  };

  const getStatusDisplayName = (status: string) => {
    const statusNames = {
      open: 'مفتوح',
      investigating: 'قيد التحقيق',
      resolved: 'محلول',
      false_positive: 'إنذار خاطئ'
    };
    return statusNames[status as keyof typeof statusNames] || status;
  };

  useEffect(() => {
    fetchEvents();
    fetchAlerts();
    fetchStatistics();
  }, []);

  return {
    events,
    alerts,
    statistics,
    loading,
    fetchEvents,
    fetchAlerts,
    fetchStatistics,
    updateAlertStatus,
    runSuspiciousActivityDetection,
    getCategoryDisplayName,
    getSensitivityDisplayName,
    getSeverityDisplayName,
    getStatusDisplayName
  };
};