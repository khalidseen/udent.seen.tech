-- Add doctor_id column to appointments table
ALTER TABLE public.appointments ADD COLUMN IF NOT EXISTS doctor_id UUID REFERENCES public.doctors(id) ON DELETE SET NULL;

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_appointments_doctor_id ON public.appointments(doctor_id);

-- Add doctor_id column to doctor_assistants table for linking assistants to specific doctors
ALTER TABLE public.doctor_assistants ADD COLUMN IF NOT EXISTS doctor_id UUID REFERENCES public.doctors(id) ON DELETE SET NULL;

-- Create index
CREATE INDEX IF NOT EXISTS idx_doctor_assistants_doctor_id ON public.doctor_assistants(doctor_id);