-- Create tooth_conditions table for Palmer dental chart
CREATE TABLE public.tooth_conditions (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  patient_id uuid NOT NULL,
  clinic_id uuid NOT NULL,
  tooth_number text NOT NULL,
  numbering_system text NOT NULL DEFAULT 'palmer',
  condition_type text,
  condition_color text,
  notes text,
  treatment_date date,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.tooth_conditions ENABLE ROW LEVEL SECURITY;

-- Create policies for tooth_conditions
CREATE POLICY "Users can create tooth conditions for their clinic" 
ON public.tooth_conditions 
FOR INSERT 
WITH CHECK (clinic_id = ( SELECT get_current_user_profile.id
   FROM get_current_user_profile() get_current_user_profile(id, user_id, full_name, role, created_at, updated_at, status)));

CREATE POLICY "Users can view their clinic tooth conditions" 
ON public.tooth_conditions 
FOR SELECT 
USING (clinic_id = ( SELECT get_current_user_profile.id
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
EXECUTE FUNCTION public.update_updated_at_column();