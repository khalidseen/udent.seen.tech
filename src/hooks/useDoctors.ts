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
        .from('profiles' as any)
        .select('id, full_name, role')
        .in('role', ['doctor', 'dentist', 'specialist', 'clinic_owner'] as any)
        .order('full_name');

      if (error) throw error;

      const mapped: Doctor[] = (data || []).map((row: any) => ({
        id: row.id,
        full_name: row.full_name || 'طبيب',
        email: row.email || '',
        phone: row.phone || undefined,
        specialization: row.specialization || undefined,
        role: row.role || 'doctor',
        profile_picture_url: row.profile_picture_url || undefined,
      }));

      setDoctors(mapped);
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
