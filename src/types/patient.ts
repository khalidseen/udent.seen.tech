// Patient types for the enhanced dental system
export interface Patient {
  id: string;
  full_name: string;
  phone?: string;
  email?: string;
  date_of_birth?: string;
  gender?: string;
  address?: string;
  emergency_contact?: string;
  insurance_info?: string;
  medical_history?: string;
  financial_balance?: number;
  patient_status: string;
  clinic_id: string;
  created_at: string;
  updated_at: string;
  age?: number; // computed field
}

export interface PatientFormData {
  full_name: string;
  phone?: string;
  email?: string;
  date_of_birth?: string;
  gender?: string;
  address?: string;
  emergency_contact?: string;
  insurance_info?: string;
  medical_history?: string;
}