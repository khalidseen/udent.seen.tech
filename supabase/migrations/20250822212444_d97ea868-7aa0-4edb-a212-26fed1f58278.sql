-- Create tooth_conditions table for Palmer dental chart
CREATE TABLE public.tooth_conditions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  patient_id UUID NOT NULL,
  clinic_id UUID NOT NULL,
  tooth_number TEXT NOT NULL,
  numbering_system TEXT NOT NULL DEFAULT 'palmer',
  condition_type TEXT,
  condition_color TEXT DEFAULT '#ffffff',
  notes TEXT,
  treatment_date DATE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.tooth_conditions ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view their clinic tooth conditions"
ON public.tooth_conditions
FOR SELECT
USING (clinic_id = (SELECT id FROM get_current_user_profile()));

CREATE POLICY "Users can create tooth conditions for their clinic"
ON public.tooth_conditions
FOR INSERT
WITH CHECK (clinic_id = (SELECT id FROM get_current_user_profile()));

CREATE POLICY "Users can update their clinic tooth conditions"
ON public.tooth_conditions
FOR UPDATE
USING (clinic_id = (SELECT id FROM get_current_user_profile()));

CREATE POLICY "Users can delete their clinic tooth conditions"
ON public.tooth_conditions
FOR DELETE
USING (clinic_id = (SELECT id FROM get_current_user_profile()));

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_tooth_conditions_updated_at
  BEFORE UPDATE ON public.tooth_conditions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_tooth_conditions_updated_at();

-- Add index for better performance
CREATE INDEX idx_tooth_conditions_patient_tooth ON public.tooth_conditions (patient_id, tooth_number, numbering_system);
CREATE INDEX idx_tooth_conditions_clinic ON public.tooth_conditions (clinic_id);