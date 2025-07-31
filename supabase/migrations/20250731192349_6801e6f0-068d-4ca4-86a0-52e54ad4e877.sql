-- Add password field to doctor applications
ALTER TABLE public.doctor_applications 
ADD COLUMN IF NOT EXISTS password TEXT;