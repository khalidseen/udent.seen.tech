import { supabase } from '@/integrations/supabase/client';

export interface MedicalRecord {
  id: string;
  clinic_id: string;
  patient_id: string;
  record_type: string;
  title: string;
  description?: string | null;
  diagnosis?: string | null;
  treatment_plan?: string | null;
  treatment_date: string;
  notes?: string | null;
  created_at: string;
}

export interface MedicalRecordCreateInput {
  patient_id: string;
  record_type: string;
  title: string;
  description?: string;
  diagnosis?: string;
  treatment_plan?: string;
  notes?: string;
}

async function getClinicId(): Promise<string> {
  const { data } = await supabase.rpc('get_current_user_profile');
  if (!data?.id) throw new Error('لا يمكن تحديد العيادة الحالية');
  return data.id;
}

export const medicalRecordService = {
  async getByPatient(patientId: string): Promise<MedicalRecord[]> {
    const { data, error } = await supabase
      .from('medical_records')
      .select('*')
      .eq('patient_id', patientId)
      .order('treatment_date', { ascending: false });
    if (error) throw error;
    return (data as unknown as MedicalRecord[]) || [];
  },

  async getById(id: string): Promise<MedicalRecord> {
    const { data, error } = await supabase
      .from('medical_records')
      .select('*')
      .eq('id', id)
      .single();
    if (error) throw error;
    return data as unknown as MedicalRecord;
  },

  async create(input: MedicalRecordCreateInput): Promise<MedicalRecord> {
    const clinicId = await getClinicId();
    const { data, error } = await supabase
      .from('medical_records')
      .insert({
        clinic_id: clinicId,
        patient_id: input.patient_id,
        record_type: input.record_type,
        title: input.title,
        description: input.description,
        diagnosis: input.diagnosis,
        treatment_plan: input.treatment_plan,
        notes: input.notes,
        treatment_date: new Date().toISOString(),
      })
      .select()
      .single();
    if (error) throw error;
    return data as unknown as MedicalRecord;
  },

  async update(id: string, input: Partial<MedicalRecordCreateInput>): Promise<MedicalRecord> {
    const { data, error } = await supabase
      .from('medical_records')
      .update(input)
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data as unknown as MedicalRecord;
  },

  async getPatientTimeline(patientId: string): Promise<{
    records: MedicalRecord[];
    treatments: { id: string; treatment_plan: string; treatment_date: string; status: string }[];
  }> {
    const [recordsResult, treatmentsResult] = await Promise.all([
      supabase
        .from('medical_records')
        .select('*')
        .eq('patient_id', patientId)
        .order('treatment_date', { ascending: false }),
      supabase
        .from('dental_treatments')
        .select('id, treatment_plan, treatment_date, status')
        .eq('patient_id', patientId)
        .order('treatment_date', { ascending: false }),
    ]);

    if (recordsResult.error) throw recordsResult.error;
    if (treatmentsResult.error) throw treatmentsResult.error;

    return {
      records: (recordsResult.data as unknown as MedicalRecord[]) || [],
      treatments: treatmentsResult.data || [],
    };
  },
};
