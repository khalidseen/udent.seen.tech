import { supabase } from '@/integrations/supabase/client';
import type { Patient } from '@/hooks/usePatients';

export interface PatientCreateInput {
  full_name: string;
  phone: string;
  email?: string;
  date_of_birth?: string;
  gender?: string;
  address?: string;
  medical_history?: string;
  notes?: string;
  national_id?: string;
  emergency_contact?: string;
  emergency_phone?: string;
  insurance_info?: string;
  blood_type?: string;
  occupation?: string;
  marital_status?: string;
  assigned_doctor_id?: string;
  medical_condition?: string;
}

export interface PatientFilters {
  search?: string;
  status?: string;
  gender?: string;
  doctorId?: string;
  limit?: number;
  offset?: number;
  orderBy?: string;
  orderDir?: 'asc' | 'desc';
}

async function getClinicId(): Promise<string> {
  const { data } = await supabase.rpc('get_current_user_profile');
  if (!data?.id) throw new Error('لا يمكن تحديد العيادة الحالية');
  return data.id;
}

export const patientService = {
  async getAll(filters: PatientFilters = {}): Promise<{ data: Patient[]; count: number }> {
    const clinicId = await getClinicId();
    let query = supabase
      .from('patients')
      .select('*, assigned_doctor:doctors!patients_assigned_doctor_id_fkey(full_name)', { count: 'exact' })
      .eq('clinic_id', clinicId);

    if (filters.search) {
      query = query.or(`full_name.ilike.%${filters.search}%,phone.ilike.%${filters.search}%,email.ilike.%${filters.search}%`);
    }
    if (filters.status) query = query.eq('patient_status', filters.status);
    if (filters.gender) query = query.eq('gender', filters.gender);
    if (filters.doctorId) query = query.eq('assigned_doctor_id', filters.doctorId);

    const orderBy = filters.orderBy || 'created_at';
    const orderDir = filters.orderDir === 'asc' ? true : false;
    query = query.order(orderBy, { ascending: orderDir });

    if (filters.limit) query = query.limit(filters.limit);
    if (filters.offset) query = query.range(filters.offset, filters.offset + (filters.limit || 50) - 1);

    const { data, error, count } = await query;
    if (error) throw error;
    return { data: (data as Patient[]) || [], count: count || 0 };
  },

  async getById(id: string): Promise<Patient> {
    const { data, error } = await supabase
      .from('patients')
      .select('*, assigned_doctor:doctors!patients_assigned_doctor_id_fkey(full_name)')
      .eq('id', id)
      .single();
    if (error) throw error;
    return data as Patient;
  },

  async create(input: PatientCreateInput): Promise<Patient> {
    const clinicId = await getClinicId();
    const { data: { user } } = await supabase.auth.getUser();
    
    const { data, error } = await supabase
      .from('patients')
      .insert({
        ...input,
        clinic_id: clinicId,
        patient_status: 'active',
        financial_status: 'pending',
        created_by_id: user?.id,
      })
      .select()
      .single();
    if (error) throw error;
    return data as Patient;
  },

  async update(id: string, input: Partial<PatientCreateInput>): Promise<Patient> {
    const { data: { user } } = await supabase.auth.getUser();
    const { data, error } = await supabase
      .from('patients')
      .update({ ...input, last_modified_by_id: user?.id })
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data as Patient;
  },

  async delete(id: string): Promise<void> {
    const { error } = await supabase.from('patients').delete().eq('id', id);
    if (error) throw error;
  },

  async getStats(clinicId?: string): Promise<{
    total: number;
    active: number;
    inactive: number;
    byGender: Record<string, number>;
  }> {
    const cId = clinicId || await getClinicId();
    const { data, error } = await supabase
      .from('patients')
      .select('patient_status, gender')
      .eq('clinic_id', cId);
    if (error) throw error;

    const patients = data || [];
    const byGender: Record<string, number> = {};
    patients.forEach(p => {
      const g = p.gender || 'unknown';
      byGender[g] = (byGender[g] || 0) + 1;
    });

    return {
      total: patients.length,
      active: patients.filter(p => p.patient_status === 'active').length,
      inactive: patients.filter(p => p.patient_status !== 'active').length,
      byGender,
    };
  },
};
