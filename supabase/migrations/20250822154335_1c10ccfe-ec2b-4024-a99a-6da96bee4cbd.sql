-- Create table for 3D tooth annotations and data
CREATE TABLE public.tooth_3d_annotations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  patient_id UUID NOT NULL,
  tooth_number TEXT NOT NULL,
  numbering_system TEXT NOT NULL DEFAULT 'universal',
  annotation_type TEXT NOT NULL, -- 'decay', 'fracture', 'filling', 'crown', 'note'
  position_x REAL NOT NULL,
  position_y REAL NOT NULL, 
  position_z REAL NOT NULL,
  color TEXT NOT NULL DEFAULT '#ff0000',
  title TEXT NOT NULL,
  description TEXT,
  severity TEXT DEFAULT 'medium', -- 'low', 'medium', 'high', 'critical'
  status TEXT DEFAULT 'active', -- 'active', 'treated', 'planned'
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID REFERENCES auth.users(id)
);

-- Enable RLS
ALTER TABLE public.tooth_3d_annotations ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view annotations for their clinic patients" 
ON public.tooth_3d_annotations 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.clinic_id IS NOT NULL
  )
);

CREATE POLICY "Users can create annotations for their clinic patients" 
ON public.tooth_3d_annotations 
FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.clinic_id IS NOT NULL
  )
);

CREATE POLICY "Users can update annotations for their clinic patients" 
ON public.tooth_3d_annotations 
FOR UPDATE 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.clinic_id IS NOT NULL
  )
);

CREATE POLICY "Users can delete annotations for their clinic patients" 
ON public.tooth_3d_annotations 
FOR DELETE 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.clinic_id IS NOT NULL
  )
);

-- Create index for better performance
CREATE INDEX idx_tooth_3d_annotations_patient_tooth ON public.tooth_3d_annotations(patient_id, tooth_number);
CREATE INDEX idx_tooth_3d_annotations_created_at ON public.tooth_3d_annotations(created_at);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_tooth_3d_annotations_updated_at
BEFORE UPDATE ON public.tooth_3d_annotations
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();