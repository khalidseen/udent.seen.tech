-- Create doctor applications table
CREATE TABLE public.doctor_applications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  full_name TEXT NOT NULL,
  phone TEXT,
  specialization TEXT,
  experience_years INTEGER,
  license_number TEXT,
  clinic_name TEXT,
  clinic_address TEXT,
  message TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  admin_message TEXT,
  admin_id UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  reviewed_at TIMESTAMP WITH TIME ZONE
);

-- Enable RLS on doctor applications
ALTER TABLE public.doctor_applications ENABLE ROW LEVEL SECURITY;

-- Admins can view all applications
CREATE POLICY "Admins can view all applications" 
ON public.doctor_applications 
FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM public.profiles 
  WHERE user_id = auth.uid() AND role = 'admin'
));

-- Admins can update applications
CREATE POLICY "Admins can update applications" 
ON public.doctor_applications 
FOR UPDATE 
USING (EXISTS (
  SELECT 1 FROM public.profiles 
  WHERE user_id = auth.uid() AND role = 'admin'
));

-- Anyone can create applications
CREATE POLICY "Anyone can create applications" 
ON public.doctor_applications 
FOR INSERT 
WITH CHECK (true);

-- Add status column to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected'));

-- Add role column check if not exists
DO $$ 
BEGIN 
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'profiles' 
    AND column_name = 'role' 
    AND table_schema = 'public'
  ) THEN 
    ALTER TABLE public.profiles ADD COLUMN role TEXT DEFAULT 'doctor';
  END IF;
END $$;

-- Update handle_new_user function to work with application system
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Check if there's an approved application for this email
  IF EXISTS (
    SELECT 1 FROM public.doctor_applications 
    WHERE email = NEW.email AND status = 'approved'
  ) THEN
    -- Create profile with approved status
    INSERT INTO public.profiles (user_id, full_name, role, status)
    VALUES (
      NEW.id, 
      COALESCE(NEW.raw_user_meta_data->>'full_name', 
               (SELECT full_name FROM public.doctor_applications WHERE email = NEW.email AND status = 'approved' LIMIT 1),
               NEW.email, 
               'مستخدم جديد'),
      'doctor',
      'approved'
    );
    
    -- Update application with user_id reference
    UPDATE public.doctor_applications 
    SET admin_id = NEW.id 
    WHERE email = NEW.email AND status = 'approved';
  ELSE
    -- Create profile with pending status (will need admin approval)
    INSERT INTO public.profiles (user_id, full_name, role, status)
    VALUES (
      NEW.id, 
      COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email, 'مستخدم جديد'),
      'doctor',
      'pending'
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = '';

-- Create trigger for automatic timestamp updates on doctor_applications
CREATE TRIGGER update_doctor_applications_updated_at
BEFORE UPDATE ON public.doctor_applications
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();