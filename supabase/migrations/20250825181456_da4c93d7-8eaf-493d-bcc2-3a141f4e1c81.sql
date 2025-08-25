-- Create table for individual tooth notes
CREATE TABLE public.tooth_notes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  clinic_id UUID NOT NULL,
  patient_id UUID NOT NULL,
  tooth_number TEXT NOT NULL,
  numbering_system TEXT NOT NULL DEFAULT 'fdi',
  note_type TEXT NOT NULL DEFAULT 'general', -- general, diagnosis, treatment, observation
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  diagnosis TEXT,
  treatment_plan TEXT,
  status TEXT NOT NULL DEFAULT 'active', -- active, resolved, follow_up
  examination_date DATE NOT NULL DEFAULT CURRENT_DATE,
  follow_up_date DATE,
  priority TEXT NOT NULL DEFAULT 'medium', -- low, medium, high, urgent
  color_code TEXT DEFAULT '#3b82f6', -- Color for visual indication
  images JSONB DEFAULT '[]'::jsonb, -- Array of image paths
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.tooth_notes ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their clinic tooth notes" 
ON public.tooth_notes 
FOR SELECT 
USING (clinic_id = ( SELECT get_current_user_profile.id FROM get_current_user_profile()));

CREATE POLICY "Users can create tooth notes for their clinic" 
ON public.tooth_notes 
FOR INSERT 
WITH CHECK (clinic_id = ( SELECT get_current_user_profile.id FROM get_current_user_profile()));

CREATE POLICY "Users can update their clinic tooth notes" 
ON public.tooth_notes 
FOR UPDATE 
USING (clinic_id = ( SELECT get_current_user_profile.id FROM get_current_user_profile()));

CREATE POLICY "Users can delete their clinic tooth notes" 
ON public.tooth_notes 
FOR DELETE 
USING (clinic_id = ( SELECT get_current_user_profile.id FROM get_current_user_profile()));

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_tooth_notes_updated_at
  BEFORE UPDATE ON public.tooth_notes
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create index for better performance
CREATE INDEX idx_tooth_notes_patient_tooth ON public.tooth_notes(patient_id, tooth_number);
CREATE INDEX idx_tooth_notes_clinic ON public.tooth_notes(clinic_id);
CREATE INDEX idx_tooth_notes_status ON public.tooth_notes(status);