-- Add new fields to patients table for enhanced patient management
ALTER TABLE public.patients 
ADD COLUMN assigned_doctor_id UUID REFERENCES public.doctors(id),
ADD COLUMN medical_condition TEXT,
ADD COLUMN financial_status TEXT DEFAULT 'pending' CHECK (financial_status IN ('paid', 'pending', 'overdue', 'partial'));

-- Create medical_conditions lookup table for standardized conditions
CREATE TABLE public.medical_conditions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  clinic_id UUID NOT NULL REFERENCES public.profiles(id),
  name TEXT NOT NULL,
  description TEXT,
  category TEXT DEFAULT 'general',
  severity_level TEXT DEFAULT 'medium' CHECK (severity_level IN ('low', 'medium', 'high', 'critical')),
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on medical_conditions
ALTER TABLE public.medical_conditions ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for medical_conditions
CREATE POLICY "Users can view their clinic medical conditions"
ON public.medical_conditions
FOR SELECT
USING (clinic_id = (SELECT get_current_user_profile()).id);

CREATE POLICY "Users can create medical conditions for their clinic"
ON public.medical_conditions
FOR INSERT
WITH CHECK (clinic_id = (SELECT get_current_user_profile()).id);

CREATE POLICY "Users can update their clinic medical conditions"
ON public.medical_conditions
FOR UPDATE
USING (clinic_id = (SELECT get_current_user_profile()).id);

CREATE POLICY "Users can delete their clinic medical conditions"
ON public.medical_conditions
FOR DELETE
USING (clinic_id = (SELECT get_current_user_profile()).id);

-- Add assigned_doctor_id to dental_treatments table for better tracking
ALTER TABLE public.dental_treatments 
ADD COLUMN assigned_doctor_id UUID REFERENCES public.doctors(id);

-- Create trigger for updating medical_conditions timestamps
CREATE TRIGGER update_medical_conditions_updated_at
BEFORE UPDATE ON public.medical_conditions
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create indexes for better performance
CREATE INDEX idx_patients_assigned_doctor ON public.patients(assigned_doctor_id);
CREATE INDEX idx_patients_medical_condition ON public.patients(medical_condition);
CREATE INDEX idx_patients_financial_status ON public.patients(financial_status);
CREATE INDEX idx_medical_conditions_clinic ON public.medical_conditions(clinic_id);
CREATE INDEX idx_dental_treatments_assigned_doctor ON public.dental_treatments(assigned_doctor_id);