export const defaultPatientFormData = {
  full_name: '',
  phone: '',
  email: '',
  date_of_birth: '',
  gender: '',
  address: '',
  medical_history: '',
  notes: '',
  emergency_contact: '',
  emergency_phone: '',
  patient_status: 'active',
  insurance_info: '',
  blood_type: '',
  occupation: '',
  marital_status: ''
};

export type PatientFormData = typeof defaultPatientFormData;

export const validatePatientData = (data: PatientFormData): string | null => {
  if (!data.full_name.trim()) return 'يجب إدخال اسم المريض';
  if (data.full_name.trim().length < 2) return 'اسم المريض يجب أن يكون حرفين على الأقل';
  if (data.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) return 'البريد الإلكتروني غير صحيح';
  return null;
};

export const preparePatientInsertData = (data: PatientFormData, clinicId: string) => ({
  clinic_id: clinicId,
  full_name: data.full_name.trim(),
  phone: data.phone || null,
  email: data.email || null,
  date_of_birth: data.date_of_birth || null,
  gender: data.gender || null,
  address: data.address || null,
  medical_history: data.medical_history || null,
  notes: data.notes || null,
  emergency_contact: data.emergency_contact || null,
  emergency_phone: data.emergency_phone || null,
  patient_status: data.patient_status || 'active',
  insurance_info: data.insurance_info || null,
  blood_type: data.blood_type || null,
  occupation: data.occupation || null,
  marital_status: data.marital_status || null
});

export const bloodTypes = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

export const maritalStatuses = [
  { value: 'single', label: 'أعزب' },
  { value: 'married', label: 'متزوج' },
  { value: 'divorced', label: 'مطلق' },
  { value: 'widowed', label: 'أرمل' }
];

export const genderOptions = [
  { value: 'male', label: 'ذكر' },
  { value: 'female', label: 'أنثى' }
];

export const patientStatusOptions = [
  { value: 'active', label: 'نشط' },
  { value: 'inactive', label: 'غير نشط' },
  { value: 'transferred', label: 'محول' }
];
