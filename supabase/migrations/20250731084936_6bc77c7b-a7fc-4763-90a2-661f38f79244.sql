-- Make patient_id nullable in appointments table for appointment requests
ALTER TABLE public.appointments ALTER COLUMN patient_id DROP NOT NULL;