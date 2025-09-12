-- Create appointment_requests table for public booking
CREATE TABLE public.appointment_requests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  clinic_id UUID NOT NULL,
  patient_name TEXT NOT NULL,
  patient_phone TEXT,
  patient_email TEXT,
  patient_address TEXT,
  condition_description TEXT NOT NULL,
  preferred_date DATE NOT NULL,
  preferred_time TIME NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  approved_appointment_id UUID,
  rejection_reason TEXT
);

-- Enable RLS
ALTER TABLE public.appointment_requests ENABLE ROW LEVEL SECURITY;

-- Create policies for appointment_requests
CREATE POLICY "Anyone can create appointment requests" 
ON public.appointment_requests 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Clinic owners can view their appointment requests" 
ON public.appointment_requests 
FOR SELECT 
USING (clinic_id IN (
  SELECT profiles.id
  FROM profiles
  WHERE profiles.user_id = auth.uid()
));

CREATE POLICY "Clinic owners can update their appointment requests" 
ON public.appointment_requests 
FOR UPDATE 
USING (clinic_id IN (
  SELECT profiles.id
  FROM profiles
  WHERE profiles.user_id = auth.uid()
));

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_appointment_requests_updated_at
BEFORE UPDATE ON public.appointment_requests
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Add indexes for better performance
CREATE INDEX idx_appointment_requests_clinic_id ON public.appointment_requests(clinic_id);
CREATE INDEX idx_appointment_requests_status ON public.appointment_requests(status);
CREATE INDEX idx_appointment_requests_date ON public.appointment_requests(preferred_date);