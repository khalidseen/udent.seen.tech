-- Create dental_treatments table for tracking dental treatments per patient
CREATE TABLE public.dental_treatments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  patient_id UUID NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
  tooth_number TEXT NOT NULL,
  numbering_system TEXT NOT NULL CHECK (numbering_system IN ('universal', 'palmer', 'fdi')),
  tooth_surface TEXT,
  diagnosis TEXT,
  treatment_plan TEXT,
  notes TEXT,
  status TEXT DEFAULT 'planned' CHECK (status IN ('planned', 'in_progress', 'completed', 'cancelled')),
  treatment_date DATE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.dental_treatments ENABLE ROW LEVEL SECURITY;

-- Create policies for dental_treatments
CREATE POLICY "Users can view dental treatments for their patients" 
ON public.dental_treatments 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.patients 
    WHERE patients.id = dental_treatments.patient_id 
    AND patients.clinic_id IN (
      SELECT id FROM public.profiles WHERE user_id = auth.uid()
    )
  )
);

CREATE POLICY "Users can create dental treatments for their patients" 
ON public.dental_treatments 
FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.patients 
    WHERE patients.id = dental_treatments.patient_id 
    AND patients.clinic_id IN (
      SELECT id FROM public.profiles WHERE user_id = auth.uid()
    )
  )
);

CREATE POLICY "Users can update dental treatments for their patients" 
ON public.dental_treatments 
FOR UPDATE 
USING (
  EXISTS (
    SELECT 1 FROM public.patients 
    WHERE patients.id = dental_treatments.patient_id 
    AND patients.clinic_id IN (
      SELECT id FROM public.profiles WHERE user_id = auth.uid()
    )
  )
);

CREATE POLICY "Users can delete dental treatments for their patients" 
ON public.dental_treatments 
FOR DELETE 
USING (
  EXISTS (
    SELECT 1 FROM public.patients 
    WHERE patients.id = dental_treatments.patient_id 
    AND patients.clinic_id IN (
      SELECT id FROM public.profiles WHERE user_id = auth.uid()
    )
  )
);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_dental_treatments_updated_at
BEFORE UPDATE ON public.dental_treatments
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();