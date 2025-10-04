import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface Doctor {
  id: string;
  full_name: string;
  email: string;
  phone?: string;
  specialization?: string;
  role: string;
  profile_picture_url?: string;
}

export const useDoctors = () => {
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchDoctors();
  }, []);

  const fetchDoctors = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .in('role', ['doctor', 'dentist', 'specialist', 'clinic_owner'])
        .eq('active', true)
        .order('full_name');

      if (error) throw error;

      setDoctors(data || []);
    } catch (err) {
      console.error('خطأ في جلب الأطباء:', err);
      setError('فشل في جلب قائمة الأطباء');
    } finally {
      setLoading(false);
    }
  };

  const getDoctorById = (id: string): Doctor | undefined => {
    return doctors.find(doctor => doctor.id === id);
  };

  return {
    doctors,
    loading,
    error,
    fetchDoctors,
    getDoctorById
  };
};
