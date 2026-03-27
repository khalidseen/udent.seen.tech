import { supabase } from '@/integrations/supabase/client';

export interface Appointment {
  id: string;
  patient_id: string;
  doctor_id?: string;
  clinic_id: string;
  appointment_date: string;
  status: string;
  treatment_type?: string;
  duration?: number;
  notes?: string;
  created_at: string;
  patient?: { full_name: string; phone: string };
  doctor?: { full_name: string };
}

export interface AppointmentCreateInput {
  patient_id: string;
  doctor_id?: string;
  appointment_date: string;
  treatment_type?: string;
  duration?: number;
  notes?: string;
  status?: string;
}

export interface AppointmentFilters {
  dateFrom?: string;
  dateTo?: string;
  status?: string;
  doctorId?: string;
  patientId?: string;
  limit?: number;
  offset?: number;
}

async function getClinicId(): Promise<string> {
  const { data } = await supabase.rpc('get_current_user_profile');
  if (!data?.id) throw new Error('لا يمكن تحديد العيادة الحالية');
  return data.id;
}

export const appointmentService = {
  async getAll(filters: AppointmentFilters = {}): Promise<{ data: Appointment[]; count: number }> {
    const clinicId = await getClinicId();
    let query = supabase
      .from('appointments')
      .select('*, patient:patients(full_name, phone), doctor:doctors(full_name)', { count: 'exact' })
      .eq('clinic_id', clinicId);

    if (filters.dateFrom) query = query.gte('appointment_date', filters.dateFrom);
    if (filters.dateTo) query = query.lte('appointment_date', filters.dateTo);
    if (filters.status) query = query.eq('status', filters.status);
    if (filters.doctorId) query = query.eq('doctor_id', filters.doctorId);
    if (filters.patientId) query = query.eq('patient_id', filters.patientId);

    query = query.order('appointment_date', { ascending: true });
    if (filters.limit) query = query.limit(filters.limit);
    if (filters.offset) query = query.range(filters.offset, filters.offset + (filters.limit || 50) - 1);

    const { data, error, count } = await query;
    if (error) throw error;
    return { data: (data as unknown as Appointment[]) || [], count: count || 0 };
  },

  async getById(id: string): Promise<Appointment> {
    const { data, error } = await supabase
      .from('appointments')
      .select('*, patient:patients(full_name, phone), doctor:doctors(full_name)')
      .eq('id', id)
      .single();
    if (error) throw error;
    return data as unknown as Appointment;
  },

  async create(input: AppointmentCreateInput): Promise<Appointment> {
    const clinicId = await getClinicId();
    const { data, error } = await supabase
      .from('appointments')
      .insert({
        ...input,
        clinic_id: clinicId,
        status: input.status || 'scheduled',
      })
      .select()
      .single();
    if (error) {
      // Handle appointment conflict from DB trigger
      if (error.message?.includes('conflicting appointment') || error.code === '23505') {
        throw new Error('هذا الطبيب لديه موعد آخر في نفس الوقت');
      }
      throw error;
    }
    return data as Appointment;
  },

  async update(id: string, input: Partial<AppointmentCreateInput>): Promise<Appointment> {
    const { data, error } = await supabase
      .from('appointments')
      .update(input)
      .eq('id', id)
      .select()
      .single();
    if (error) {
      if (error.message?.includes('conflicting appointment') || error.code === '23505') {
        throw new Error('هذا الطبيب لديه موعد آخر في نفس الوقت');
      }
      throw error;
    }
    return data as Appointment;
  },

  async updateStatus(id: string, status: string): Promise<void> {
    const { error } = await supabase
      .from('appointments')
      .update({ status })
      .eq('id', id);
    if (error) throw error;
  },

  async cancel(id: string): Promise<void> {
    await this.updateStatus(id, 'cancelled');
  },

  async getTodayAppointments(doctorId?: string): Promise<Appointment[]> {
    const clinicId = await getClinicId();
    const today = new Date().toISOString().split('T')[0];
    
    let query = supabase
      .from('appointments')
      .select('*, patient:patients(full_name, phone), doctor:doctors(full_name)')
      .eq('clinic_id', clinicId)
      .gte('appointment_date', `${today}T00:00:00`)
      .lte('appointment_date', `${today}T23:59:59`)
      .in('status', ['scheduled', 'confirmed', 'in_progress'])
      .order('appointment_date', { ascending: true });
    
    if (doctorId) query = query.eq('doctor_id', doctorId);
    
    const { data, error } = await query;
    if (error) throw error;
    return (data as unknown as Appointment[]) || [];
  },

  async getStats(clinicId?: string): Promise<{
    total: number;
    today: number;
    upcoming: number;
    byStatus: Record<string, number>;
  }> {
    const cId = clinicId || await getClinicId();
    const today = new Date().toISOString().split('T')[0];
    
    const { data, error } = await supabase
      .from('appointments')
      .select('status, appointment_date')
      .eq('clinic_id', cId);
    if (error) throw error;

    const appointments = data || [];
    const byStatus: Record<string, number> = {};
    let todayCount = 0;
    let upcomingCount = 0;

    appointments.forEach(a => {
      byStatus[a.status] = (byStatus[a.status] || 0) + 1;
      const apptDate = a.appointment_date?.split('T')[0];
      if (apptDate === today) todayCount++;
      if (apptDate && apptDate >= today) upcomingCount++;
    });

    return {
      total: appointments.length,
      today: todayCount,
      upcoming: upcomingCount,
      byStatus,
    };
  },
};
