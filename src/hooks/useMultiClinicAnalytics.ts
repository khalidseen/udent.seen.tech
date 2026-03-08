import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface ClinicAnalytics {
  clinic_id: string;
  clinic_name: string;
  is_active: boolean;
  subscription_plan: string | null;
  patient_count: number;
  appointment_count: number;
  completed_appointments: number;
  total_revenue: number;
  this_month_revenue: number;
  user_count: number;
}

export interface AccessibleClinic {
  clinic_id: string;
  clinic_name: string;
  is_current: boolean;
  access_type: string;
}

export interface ClinicSettings {
  id: string;
  clinic_id: string;
  currency: string;
  language: string;
  time_format: string;
  timezone: string;
  custom_preferences: Record<string, any>;
  remote_access_enabled: boolean;
}

export const useMultiClinicAnalytics = () => {
  const [clinics, setClinics] = useState<AccessibleClinic[]>([]);
  const [analytics, setAnalytics] = useState<ClinicAnalytics[]>([]);
  const [settings, setSettings] = useState<ClinicSettings[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch accessible clinics
      const { data: clinicsData, error: clinicsError } = await supabase
        .rpc('get_user_accessible_clinics');

      if (clinicsError) throw clinicsError;
      setClinics(clinicsData || []);

      // Fetch aggregated analytics
      const { data: analyticsData, error: analyticsError } = await supabase
        .rpc('get_all_clinics_analytics');

      if (analyticsError) throw analyticsError;
      setAnalytics(analyticsData || []);

      // Fetch clinic settings
      const { data: settingsData, error: settingsError } = await supabase
        .from('clinic_settings')
        .select('*');

      if (settingsError) throw settingsError;
      setSettings((settingsData || []) as unknown as ClinicSettings[]);

    } catch (err: any) {
      console.error('Error fetching multi-clinic data:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const updateClinicSettings = async (clinicId: string, updates: Partial<ClinicSettings>) => {
    try {
      // Try upsert
      const { error } = await supabase
        .from('clinic_settings')
        .upsert({
          clinic_id: clinicId,
          ...updates,
        }, { onConflict: 'clinic_id' });

      if (error) throw error;
      await fetchData();
      return true;
    } catch (err: any) {
      console.error('Error updating clinic settings:', err);
      return false;
    }
  };

  const switchClinic = async (clinicId: string) => {
    try {
      const { data, error } = await supabase
        .rpc('switch_user_clinic', { new_clinic_id: clinicId });

      if (error) throw error;
      return data;
    } catch (err: any) {
      console.error('Error switching clinic:', err);
      return false;
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const aggregated = {
    totalPatients: analytics.reduce((s, a) => s + a.patient_count, 0),
    totalAppointments: analytics.reduce((s, a) => s + a.appointment_count, 0),
    totalRevenue: analytics.reduce((s, a) => s + a.total_revenue, 0),
    thisMonthRevenue: analytics.reduce((s, a) => s + a.this_month_revenue, 0),
    totalUsers: analytics.reduce((s, a) => s + a.user_count, 0),
    activeClinics: analytics.filter(a => a.is_active).length,
    totalClinics: analytics.length,
  };

  return {
    clinics,
    analytics,
    settings,
    aggregated,
    loading,
    error,
    updateClinicSettings,
    switchClinic,
    refresh: fetchData,
  };
};
