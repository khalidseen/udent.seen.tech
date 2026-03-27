import { supabase } from '@/integrations/supabase/client';

export interface Doctor {
  id: string;
  clinic_id: string;
  full_name: string;
  specialization?: string | null;
  phone?: string | null;
  email?: string | null;
  license_number?: string | null;
  experience_years?: number | null;
  status: string;
  bio?: string | null;
  working_hours?: string | null;
  created_at: string;
}

export interface DoctorCreateInput {
  full_name: string;
  specialization?: string;
  phone?: string;
  email?: string;
  license_number?: string;
  experience_years?: number;
  bio?: string;
  working_hours?: string;
}

export interface DoctorFilters {
  search?: string;
  specialization?: string;
  isActive?: boolean;
}

async function getClinicId(): Promise<string> {
  const { data } = await supabase.rpc('get_current_user_profile');
  if (!data?.id) throw new Error('لا يمكن تحديد العيادة الحالية');
  return data.id;
}

export const doctorService = {
  async getAll(filters: DoctorFilters = {}): Promise<Doctor[]> {
    const clinicId = await getClinicId();
    let query = supabase
      .from('doctors')
      .select('*')
      .eq('clinic_id', clinicId)
      .order('full_name');

    if (filters.search) {
      query = query.or(`full_name.ilike.%${filters.search}%,specialization.ilike.%${filters.search}%`);
    }
    if (filters.specialization) query = query.eq('specialization', filters.specialization);
    if (filters.isActive !== undefined) query = query.eq('status', filters.isActive ? 'active' : 'inactive');

    const { data, error } = await query;
    if (error) throw error;
    return (data as unknown as Doctor[]) || [];
  },

  async getById(id: string): Promise<Doctor> {
    const { data, error } = await supabase
      .from('doctors')
      .select('*')
      .eq('id', id)
      .single();
    if (error) throw error;
    return data as unknown as Doctor;
  },

  async create(input: DoctorCreateInput): Promise<Doctor> {
    const clinicId = await getClinicId();
    const { data, error } = await supabase
      .from('doctors')
      .insert({ ...input, clinic_id: clinicId, status: 'active' })
      .select()
      .single();
    if (error) throw error;
    return data as unknown as Doctor;
  },

  async update(id: string, input: Partial<DoctorCreateInput> & { status?: string }): Promise<Doctor> {
    const { data, error } = await supabase
      .from('doctors')
      .update(input)
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data as unknown as Doctor;
  },

  async delete(id: string): Promise<void> {
    const { error } = await supabase.from('doctors').delete().eq('id', id);
    if (error) throw error;
  },

  async getSchedule(doctorId: string, date: string): Promise<{ start_time: string; end_time: string; is_active: boolean | null }[]> {
    const { data, error } = await supabase
      .from('doctor_schedules')
      .select('start_time, end_time, is_active')
      .eq('doctor_id', doctorId)
      .eq('day_of_week', new Date(date).getDay())
      .order('start_time');
    if (error) throw error;
    return data || [];
  },

  async getSpecializations(): Promise<string[]> {
    const clinicId = await getClinicId();
    const { data, error } = await supabase
      .from('doctors')
      .select('specialization')
      .eq('clinic_id', clinicId)
      .not('specialization', 'is', null);
    if (error) throw error;
    const unique = [...new Set((data || []).map(d => d.specialization).filter(Boolean))];
    return unique as string[];
  },

  async getStats(): Promise<{ total: number; active: number; avgExperience: number }> {
    const clinicId = await getClinicId();
    const { data, error } = await supabase
      .from('doctors')
      .select('status, experience_years')
      .eq('clinic_id', clinicId);
    if (error) throw error;

    const doctors = data || [];
    const active = doctors.filter(d => d.status === 'active').length;
    const totalExp = doctors.reduce((s, d) => s + (d.experience_years || 0), 0);
    return {
      total: doctors.length,
      active,
      avgExperience: doctors.length ? Math.round(totalExp / doctors.length) : 0,
    };
  },
};
