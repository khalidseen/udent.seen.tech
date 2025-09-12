-- Create prescriptions table
CREATE TABLE public.prescriptions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  clinic_id UUID NOT NULL,
  patient_id UUID NOT NULL,
  doctor_name TEXT NOT NULL,
  doctor_license TEXT,
  clinic_name TEXT,
  clinic_address TEXT,
  clinic_phone TEXT,
  diagnosis TEXT NOT NULL,
  prescription_date DATE NOT NULL DEFAULT CURRENT_DATE,
  notes TEXT,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'completed', 'cancelled')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create prescription medications table (many-to-many relationship)
CREATE TABLE public.prescription_medications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  prescription_id UUID NOT NULL REFERENCES public.prescriptions(id) ON DELETE CASCADE,
  medication_id UUID REFERENCES public.medications(id),
  medication_name TEXT NOT NULL,
  dosage TEXT NOT NULL,
  frequency TEXT NOT NULL,
  duration TEXT NOT NULL,
  instructions TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on prescriptions table
ALTER TABLE public.prescriptions ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for prescriptions
CREATE POLICY "Users can create prescriptions for their clinic" 
ON public.prescriptions 
FOR INSERT 
WITH CHECK (clinic_id = (SELECT get_current_user_profile()).id);

CREATE POLICY "Users can view their clinic prescriptions" 
ON public.prescriptions 
FOR SELECT 
USING (clinic_id = (SELECT get_current_user_profile()).id);

CREATE POLICY "Users can update their clinic prescriptions" 
ON public.prescriptions 
FOR UPDATE 
USING (clinic_id = (SELECT get_current_user_profile()).id);

CREATE POLICY "Users can delete their clinic prescriptions" 
ON public.prescriptions 
FOR DELETE 
USING (clinic_id = (SELECT get_current_user_profile()).id);

-- Enable RLS on prescription_medications table
ALTER TABLE public.prescription_medications ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for prescription_medications
CREATE POLICY "Users can create prescription medications for their clinic" 
ON public.prescription_medications 
FOR INSERT 
WITH CHECK (prescription_id IN (
  SELECT id FROM public.prescriptions 
  WHERE clinic_id = (SELECT get_current_user_profile()).id
));

CREATE POLICY "Users can view their clinic prescription medications" 
ON public.prescription_medications 
FOR SELECT 
USING (prescription_id IN (
  SELECT id FROM public.prescriptions 
  WHERE clinic_id = (SELECT get_current_user_profile()).id
));

CREATE POLICY "Users can update their clinic prescription medications" 
ON public.prescription_medications 
FOR UPDATE 
USING (prescription_id IN (
  SELECT id FROM public.prescriptions 
  WHERE clinic_id = (SELECT get_current_user_profile()).id
));

CREATE POLICY "Users can delete their clinic prescription medications" 
ON public.prescription_medications 
FOR DELETE 
USING (prescription_id IN (
  SELECT id FROM public.prescriptions 
  WHERE clinic_id = (SELECT get_current_user_profile()).id
));

-- Create trigger for updating updated_at timestamp
CREATE TRIGGER update_prescriptions_updated_at
  BEFORE UPDATE ON public.prescriptions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();