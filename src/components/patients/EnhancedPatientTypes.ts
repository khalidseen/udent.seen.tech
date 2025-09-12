// Enhanced patient types with complete interface
export interface EnhancedPatient {
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

// Utility to add age to patient
export const addAgeToPatient = (patient: any): EnhancedPatient => ({
  ...patient,
  age: patient.date_of_birth ? calculateAge(patient.date_of_birth) : undefined
});

function calculateAge(dateOfBirth: string): number {
  const birth = new Date(dateOfBirth);
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();
  
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age--;
  }
  
  return age;
}