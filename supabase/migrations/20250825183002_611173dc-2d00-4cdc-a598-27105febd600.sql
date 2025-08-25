-- Create tooth_conditions table for storing tooth states and colors
CREATE TABLE public.tooth_conditions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  patient_id UUID NOT NULL,
  clinic_id UUID NOT NULL,
  tooth_number TEXT NOT NULL,
  numbering_system TEXT NOT NULL DEFAULT 'universal',
  condition_type TEXT NOT NULL DEFAULT 'healthy',
  color_code TEXT NOT NULL DEFAULT '#FFFFFF',
  notes TEXT,
  treatment_date DATE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(patient_id, tooth_number, numbering_system)
);

-- Enable RLS
ALTER TABLE public.tooth_conditions ENABLE ROW LEVEL SECURITY;

-- Create policies for user access
CREATE POLICY "Users can view their clinic tooth conditions" 
ON public.tooth_conditions 
FOR SELECT 
USING (clinic_id = ( SELECT get_current_user_profile.id
   FROM get_current_user_profile() get_current_user_profile(id, user_id, full_name, role, created_at, updated_at, status)));

CREATE POLICY "Users can create tooth conditions for their clinic" 
ON public.tooth_conditions 
FOR INSERT 
WITH CHECK (clinic_id = ( SELECT get_current_user_profile.id
   FROM get_current_user_profile() get_current_user_profile(id, user_id, full_name, role, created_at, updated_at, status)));

CREATE POLICY "Users can update their clinic tooth conditions" 
ON public.tooth_conditions 
FOR UPDATE 
USING (clinic_id = ( SELECT get_current_user_profile.id
   FROM get_current_user_profile() get_current_user_profile(id, user_id, full_name, role, created_at, updated_at, status)));

CREATE POLICY "Users can delete their clinic tooth conditions" 
ON public.tooth_conditions 
FOR DELETE 
USING (clinic_id = ( SELECT get_current_user_profile.id
   FROM get_current_user_profile() get_current_user_profile(id, user_id, full_name, role, created_at, updated_at, status)));

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_tooth_conditions_updated_at
BEFORE UPDATE ON public.tooth_conditions
FOR EACH ROW
EXECUTE FUNCTION public.update_tooth_conditions_updated_at();