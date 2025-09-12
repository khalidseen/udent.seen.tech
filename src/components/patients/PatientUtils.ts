// Patient utility functions
import type { Patient } from '@/types/patient';

export const calculateAge = (dateOfBirth: string | null | undefined): number => {
  if (!dateOfBirth) return 0;
  
  const birth = new Date(dateOfBirth);
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();
  
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age--;
  }
  
  return age;
};

export const enrichPatientWithAge = (patient: Patient): Patient & { age: number } => ({
  ...patient,
  age: calculateAge(patient.date_of_birth)
});