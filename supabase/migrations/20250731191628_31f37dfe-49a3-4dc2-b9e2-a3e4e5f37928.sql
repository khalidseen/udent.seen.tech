-- Fix RLS policies to properly show data for authenticated users
-- First create a security definer function to get current user profile
CREATE OR REPLACE FUNCTION public.get_current_user_profile()
RETURNS public.profiles AS $$
  SELECT * FROM public.profiles WHERE user_id = auth.uid() LIMIT 1;
$$ LANGUAGE SQL SECURITY DEFINER STABLE;

-- Update RLS policies to use the new function
DROP POLICY IF EXISTS "Users can view their clinic appointments" ON public.appointments;
DROP POLICY IF EXISTS "Users can create appointments for their clinic" ON public.appointments;
DROP POLICY IF EXISTS "Users can update their clinic appointments" ON public.appointments;
DROP POLICY IF EXISTS "Users can delete their clinic appointments" ON public.appointments;

CREATE POLICY "Users can view their clinic appointments" 
ON public.appointments 
FOR SELECT 
USING (
  clinic_id = (SELECT id FROM public.get_current_user_profile())
);

CREATE POLICY "Users can create appointments for their clinic" 
ON public.appointments 
FOR INSERT 
WITH CHECK (
  clinic_id = (SELECT id FROM public.get_current_user_profile())
);

CREATE POLICY "Users can update their clinic appointments" 
ON public.appointments 
FOR UPDATE 
USING (
  clinic_id = (SELECT id FROM public.get_current_user_profile())
);

CREATE POLICY "Users can delete their clinic appointments" 
ON public.appointments 
FOR DELETE 
USING (
  clinic_id = (SELECT id FROM public.get_current_user_profile())
);

-- Update patients policies
DROP POLICY IF EXISTS "Users can view their clinic patients" ON public.patients;
DROP POLICY IF EXISTS "Users can create patients for their clinic" ON public.patients;
DROP POLICY IF EXISTS "Users can update their clinic patients" ON public.patients;
DROP POLICY IF EXISTS "Users can delete their clinic patients" ON public.patients;

CREATE POLICY "Users can view their clinic patients" 
ON public.patients 
FOR SELECT 
USING (
  clinic_id = (SELECT id FROM public.get_current_user_profile())
);

CREATE POLICY "Users can create patients for their clinic" 
ON public.patients 
FOR INSERT 
WITH CHECK (
  clinic_id = (SELECT id FROM public.get_current_user_profile())
);

CREATE POLICY "Users can update their clinic patients" 
ON public.patients 
FOR UPDATE 
USING (
  clinic_id = (SELECT id FROM public.get_current_user_profile())
);

CREATE POLICY "Users can delete their clinic patients" 
ON public.patients 
FOR DELETE 
USING (
  clinic_id = (SELECT id FROM public.get_current_user_profile())
);

-- Update dental treatments policies
DROP POLICY IF EXISTS "Users can view their clinic dental treatments" ON public.dental_treatments;
DROP POLICY IF EXISTS "Users can create dental treatments for their clinic" ON public.dental_treatments;
DROP POLICY IF EXISTS "Users can update their clinic dental treatments" ON public.dental_treatments;
DROP POLICY IF EXISTS "Users can delete their clinic dental treatments" ON public.dental_treatments;

CREATE POLICY "Users can view their clinic dental treatments" 
ON public.dental_treatments 
FOR SELECT 
USING (
  clinic_id = (SELECT id FROM public.get_current_user_profile())
);

CREATE POLICY "Users can create dental treatments for their clinic" 
ON public.dental_treatments 
FOR INSERT 
WITH CHECK (
  clinic_id = (SELECT id FROM public.get_current_user_profile())
);

CREATE POLICY "Users can update their clinic dental treatments" 
ON public.dental_treatments 
FOR UPDATE 
USING (
  clinic_id = (SELECT id FROM public.get_current_user_profile())
);

CREATE POLICY "Users can delete their clinic dental treatments" 
ON public.dental_treatments 
FOR DELETE 
USING (
  clinic_id = (SELECT id FROM public.get_current_user_profile())
);

-- Update appointment requests policies
DROP POLICY IF EXISTS "Clinic owners can view their appointment requests" ON public.appointment_requests;
DROP POLICY IF EXISTS "Clinic owners can update their appointment requests" ON public.appointment_requests;

CREATE POLICY "Clinic owners can view their appointment requests" 
ON public.appointment_requests 
FOR SELECT 
USING (
  clinic_id = (SELECT id FROM public.get_current_user_profile())
);

CREATE POLICY "Clinic owners can update their appointment requests" 
ON public.appointment_requests 
FOR UPDATE 
USING (
  clinic_id = (SELECT id FROM public.get_current_user_profile())
);

-- Update doctor applications policies for admin access
DROP POLICY IF EXISTS "Admins can view all applications" ON public.doctor_applications;
DROP POLICY IF EXISTS "Admins can update applications" ON public.doctor_applications;

CREATE POLICY "Admins can view all applications" 
ON public.doctor_applications 
FOR SELECT 
USING (
  (SELECT role FROM public.get_current_user_profile()) = 'admin'
);

CREATE POLICY "Admins can update applications" 
ON public.doctor_applications 
FOR UPDATE 
USING (
  (SELECT role FROM public.get_current_user_profile()) = 'admin'
);