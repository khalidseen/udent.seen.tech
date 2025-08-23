-- Add prescription type column to medications table
ALTER TABLE public.medications ADD COLUMN prescription_type TEXT NOT NULL DEFAULT 'prescription';

-- Add comment to explain the prescription types
COMMENT ON COLUMN public.medications.prescription_type IS 'Types: prescription (بوصفة طبية), otc (بدون وصفة طبية)';

-- Update the table to set default values
UPDATE public.medications SET prescription_type = 'prescription' WHERE prescription_type IS NULL;