-- Add foreign key constraint to prescriptions table
ALTER TABLE public.prescriptions ADD CONSTRAINT prescriptions_patient_id_fkey 
FOREIGN KEY (patient_id) REFERENCES public.patients(id);