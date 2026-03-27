import { supabase } from '@/integrations/supabase/client';

export interface Treatment {
  id: string;
  clinic_id: string;
  patient_id: string;
  assigned_doctor_id?: string | null;
  tooth_number: string;
  treatment_plan: string;
  diagnosis: string;
  status: string;
  notes?: string | null;
  treatment_date: string;
  tooth_surface?: string | null;
  numbering_system?: string;
  created_at: string;
  patient?: { id?: string; full_name: string; phone?: string | null };
  doctor?: { id?: string; full_name: string };
}

export interface TreatmentCreateInput {
  patient_id: string;
  assigned_doctor_id?: string;
  tooth_number: string;
  tooth_surface?: string;
  numbering_system?: string;
  treatment_plan: string;
  diagnosis: string;
  description?: string;
  notes?: string;
  treatment_date?: string;
  status?: string;
}

export interface TreatmentFilters {
  patientId?: string;
  doctorId?: string;
  status?: string;
  dateFrom?: string;
  dateTo?: string;
}

async function getClinicId(): Promise<string> {
  const { data } = await supabase.rpc('get_current_user_profile');
  if (!data?.id) throw new Error('لا يمكن تحديد العيادة الحالية');
  return data.id;
}

export const treatmentService = {
  async getAll(filters: TreatmentFilters = {}): Promise<Treatment[]> {
    const clinicId = await getClinicId();
    let query = supabase
      .from('dental_treatments')
      .select('*, patient:patients(id, full_name, phone), doctor:doctors(id, full_name)')
      .eq('clinic_id', clinicId)
      .order('treatment_date', { ascending: false });

    if (filters.patientId) query = query.eq('patient_id', filters.patientId);
    if (filters.doctorId) query = query.eq('assigned_doctor_id', filters.doctorId);
    if (filters.status) query = query.eq('status', filters.status);
    if (filters.dateFrom) query = query.gte('treatment_date', filters.dateFrom);
    if (filters.dateTo) query = query.lte('treatment_date', filters.dateTo);

    const { data, error } = await query;
    if (error) throw error;
    return (data as unknown as Treatment[]) || [];
  },

  async getById(id: string): Promise<Treatment> {
    const { data, error } = await supabase
      .from('dental_treatments')
      .select('*, patient:patients(id, full_name, phone), doctor:doctors(id, full_name)')
      .eq('id', id)
      .single();
    if (error) throw error;
    return data as unknown as Treatment;
  },

  async create(input: TreatmentCreateInput): Promise<Treatment> {
    const clinicId = await getClinicId();
    const { data, error } = await supabase
      .from('dental_treatments')
      .insert({
        clinic_id: clinicId,
        patient_id: input.patient_id,
        assigned_doctor_id: input.assigned_doctor_id,
        tooth_number: input.tooth_number,
        tooth_surface: input.tooth_surface || null,
        numbering_system: input.numbering_system || 'universal',
        treatment_plan: input.treatment_plan,
        diagnosis: input.diagnosis,
        notes: input.notes,
        status: input.status || 'planned',
        treatment_date: input.treatment_date || new Date().toISOString(),
      })
      .select()
      .single();
    if (error) throw error;
    return data as unknown as Treatment;
  },

  async update(id: string, input: Partial<TreatmentCreateInput> & { status?: string }): Promise<Treatment> {
    const updateData: Record<string, unknown> = {};
    if (input.patient_id) updateData.patient_id = input.patient_id;
    if (input.assigned_doctor_id) updateData.assigned_doctor_id = input.assigned_doctor_id;
    if (input.tooth_number) updateData.tooth_number = input.tooth_number;
    if (input.tooth_surface !== undefined) updateData.tooth_surface = input.tooth_surface || null;
    if (input.numbering_system) updateData.numbering_system = input.numbering_system;
    if (input.treatment_plan) updateData.treatment_plan = input.treatment_plan;
    if (input.diagnosis) updateData.diagnosis = input.diagnosis;
    if (input.notes !== undefined) updateData.notes = input.notes;
    if (input.treatment_date) updateData.treatment_date = input.treatment_date;
    if (input.status) updateData.status = input.status;

    const { data, error } = await supabase
      .from('dental_treatments')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data as unknown as Treatment;
  },

  async updateStatus(id: string, newStatus: string): Promise<void> {
    const { error } = await supabase
      .from('dental_treatments')
      .update({ status: newStatus })
      .eq('id', id);
    if (error) {
      if (error.message?.includes('انتقال غير صالح')) {
        throw new Error(error.message);
      }
      throw error;
    }
  },

  async remove(id: string): Promise<void> {
    const { error } = await supabase
      .from('dental_treatments')
      .delete()
      .eq('id', id);
    if (error) throw error;
  },

  async getByTooth(patientId: string, toothNumber: string): Promise<Treatment[]> {
    const { data, error } = await supabase
      .from('dental_treatments')
      .select('*, doctor:doctors(full_name)')
      .eq('patient_id', patientId)
      .eq('tooth_number', toothNumber)
      .order('treatment_date', { ascending: false });
    if (error) throw error;
    return (data as unknown as Treatment[]) || [];
  },

  async getStats(dateFrom?: string, dateTo?: string): Promise<{
    total: number;
    completed: number;
    inProgress: number;
    planned: number;
  }> {
    const clinicId = await getClinicId();
    let query = supabase
      .from('dental_treatments')
      .select('status')
      .eq('clinic_id', clinicId);

    if (dateFrom) query = query.gte('treatment_date', dateFrom);
    if (dateTo) query = query.lte('treatment_date', dateTo);

    const { data, error } = await query;
    if (error) throw error;

    const treatments = data || [];
    return {
      total: treatments.length,
      completed: treatments.filter(t => t.status === 'completed').length,
      inProgress: treatments.filter(t => t.status === 'in_progress').length,
      planned: treatments.filter(t => t.status === 'planned').length,
    };
  },
};
