import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface ClinicInfo {
  id: string;
  name: string;
  subscription_plan: string;
  is_active: boolean;
}

interface AccessibleClinic {
  clinic_id: string;
  clinic_name: string;
  is_current: boolean;
  access_type: string;
}

export const useClinicContext = () => {
  const [currentClinic, setCurrentClinic] = useState<ClinicInfo | null>(null);
  const [accessibleClinics, setAccessibleClinics] = useState<AccessibleClinic[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchCurrentClinic = async () => {
    try {
      const { data: profile, error: profileError } = await supabase
        .rpc('get_current_user_profile');
      
      if (profileError) throw profileError;
      
      if (profile?.clinic_id) {
        const { data: clinic, error: clinicError } = await supabase
          .from('clinics')
          .select('id, name, subscription_plan, is_active')
          .eq('id', profile.clinic_id)
          .single();
        
        if (clinicError) throw clinicError;
        
        setCurrentClinic(clinic);
      }
    } catch (error) {
      console.error('Error fetching current clinic:', error);
    }
  };

  const fetchAccessibleClinics = async () => {
    try {
      const { data, error } = await supabase.rpc('get_user_accessible_clinics');
      
      if (error) throw error;
      
      setAccessibleClinics(data || []);
    } catch (error) {
      console.error('Error fetching accessible clinics:', error);
    }
  };

  const switchClinic = async (clinicId: string) => {
    try {
      const { data, error } = await supabase.rpc('switch_user_clinic', {
        new_clinic_id: clinicId
      });
      
      if (error) throw error;
      
      if (data) {
        await fetchCurrentClinic();
        await fetchAccessibleClinics();
        
        toast({
          title: "تم تغيير العيادة",
          description: "تم تغيير العيادة الحالية بنجاح",
        });
        
        return true;
      } else {
        toast({
          title: "خطأ",
          description: "لا تملك صلاحية للوصول لهذه العيادة",
          variant: "destructive",
        });
        return false;
      }
    } catch (error) {
      console.error('Error switching clinic:', error);
      toast({
        title: "خطأ",
        description: "فشل في تغيير العيادة",
        variant: "destructive",
      });
      return false;
    }
  };

  const refreshData = async () => {
    setLoading(true);
    await Promise.all([fetchCurrentClinic(), fetchAccessibleClinics()]);
    setLoading(false);
  };

  useEffect(() => {
    refreshData();
  }, []);

  return {
    currentClinic,
    accessibleClinics,
    loading,
    switchClinic,
    refreshData,
    canSwitchClinics: accessibleClinics.length > 1,
  };
};