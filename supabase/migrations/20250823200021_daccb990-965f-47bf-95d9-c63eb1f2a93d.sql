-- Create medications table
CREATE TABLE public.medications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  clinic_id UUID NOT NULL,
  trade_name TEXT NOT NULL,
  generic_name TEXT,
  strength TEXT NOT NULL,
  form TEXT NOT NULL CHECK (form IN ('كبسول', 'أقراص', 'سائل', 'حقن', 'مرهم', 'قطرات', 'بخاخ', 'أخرى')),
  frequency TEXT NOT NULL,
  duration TEXT,
  instructions TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.medications ENABLE ROW LEVEL SECURITY;

-- Create policies for medications
CREATE POLICY "Users can create medications for their clinic" 
ON public.medications 
FOR INSERT 
WITH CHECK (clinic_id = ( SELECT get_current_user_profile.id
  FROM get_current_user_profile() get_current_user_profile(id, user_id, full_name, role, created_at, updated_at, status)));

CREATE POLICY "Users can view their clinic medications" 
ON public.medications 
FOR SELECT 
USING (clinic_id = ( SELECT get_current_user_profile.id
  FROM get_current_user_profile() get_current_user_profile(id, user_id, full_name, role, created_at, updated_at, status)));

CREATE POLICY "Users can update their clinic medications" 
ON public.medications 
FOR UPDATE 
USING (clinic_id = ( SELECT get_current_user_profile.id
  FROM get_current_user_profile() get_current_user_profile(id, user_id, full_name, role, created_at, updated_at, status)));

CREATE POLICY "Users can delete their clinic medications" 
ON public.medications 
FOR DELETE 
USING (clinic_id = ( SELECT get_current_user_profile.id
  FROM get_current_user_profile() get_current_user_profile(id, user_id, full_name, role, created_at, updated_at, status)));

-- Add prescribed_medications field to dental_treatments table
ALTER TABLE public.dental_treatments 
ADD COLUMN prescribed_medications JSONB DEFAULT '[]'::jsonb;

-- Create trigger for updated_at
CREATE TRIGGER update_medications_updated_at
BEFORE UPDATE ON public.medications
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create index for better performance
CREATE INDEX idx_medications_clinic_id ON public.medications(clinic_id);
CREATE INDEX idx_medications_trade_name ON public.medications(trade_name);
CREATE INDEX idx_medications_is_active ON public.medications(is_active);