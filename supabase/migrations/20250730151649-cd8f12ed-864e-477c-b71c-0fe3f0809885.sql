-- Remove demo data from previous failed migration
-- Create user roles enum (if not exists)
DO $$ BEGIN
    CREATE TYPE public.user_role AS ENUM ('admin', 'doctor', 'secretary');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Create profiles table (if not exists)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE NOT NULL,
  full_name TEXT NOT NULL,
  role user_role NOT NULL DEFAULT 'doctor',
  phone TEXT,
  specialization TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create patients table (if not exists)
CREATE TABLE IF NOT EXISTS public.patients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  full_name TEXT NOT NULL,
  phone TEXT,
  email TEXT,
  date_of_birth DATE,
  gender TEXT CHECK (gender IN ('male', 'female')),
  address TEXT,
  medical_history TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create appointments table (if not exists)
CREATE TABLE IF NOT EXISTS public.appointments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID REFERENCES public.patients(id) ON DELETE CASCADE NOT NULL,
  doctor_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  appointment_date TIMESTAMP WITH TIME ZONE NOT NULL,
  duration_minutes INTEGER DEFAULT 30,
  status TEXT CHECK (status IN ('scheduled', 'completed', 'cancelled', 'no_show')) DEFAULT 'scheduled',
  notes TEXT,
  treatment_plan TEXT,
  cost DECIMAL(10,2),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.patients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Doctors can view patients" ON public.patients;
DROP POLICY IF EXISTS "Doctors can insert patients" ON public.patients;
DROP POLICY IF EXISTS "Doctors can update patients" ON public.patients;
DROP POLICY IF EXISTS "Doctors can view appointments" ON public.appointments;
DROP POLICY IF EXISTS "Doctors can insert appointments" ON public.appointments;
DROP POLICY IF EXISTS "Doctors can update appointments" ON public.appointments;

-- Create security definer function to get current user role
CREATE OR REPLACE FUNCTION public.get_current_user_role()
RETURNS user_role AS $$
  SELECT role FROM public.profiles WHERE user_id = auth.uid();
$$ LANGUAGE SQL SECURITY DEFINER STABLE;

-- Create policies for profiles
CREATE POLICY "Users can view their own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own profile" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all profiles" ON public.profiles
  FOR SELECT USING (public.get_current_user_role() = 'admin');

-- Create policies for patients
CREATE POLICY "Doctors can view patients" ON public.patients
  FOR SELECT USING (public.get_current_user_role() IN ('doctor', 'admin', 'secretary'));

CREATE POLICY "Doctors can insert patients" ON public.patients
  FOR INSERT WITH CHECK (public.get_current_user_role() IN ('doctor', 'admin', 'secretary'));

CREATE POLICY "Doctors can update patients" ON public.patients
  FOR UPDATE USING (public.get_current_user_role() IN ('doctor', 'admin', 'secretary'));

CREATE POLICY "Doctors can delete patients" ON public.patients
  FOR DELETE USING (public.get_current_user_role() IN ('doctor', 'admin', 'secretary'));

-- Create policies for appointments
CREATE POLICY "Doctors can view appointments" ON public.appointments
  FOR SELECT USING (public.get_current_user_role() IN ('doctor', 'admin', 'secretary'));

CREATE POLICY "Doctors can insert appointments" ON public.appointments
  FOR INSERT WITH CHECK (public.get_current_user_role() IN ('doctor', 'admin', 'secretary'));

CREATE POLICY "Doctors can update appointments" ON public.appointments
  FOR UPDATE USING (public.get_current_user_role() IN ('doctor', 'admin', 'secretary'));

CREATE POLICY "Doctors can delete appointments" ON public.appointments
  FOR DELETE USING (public.get_current_user_role() IN ('doctor', 'admin', 'secretary'));

-- Create trigger function for updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers (drop if exist first)
DROP TRIGGER IF EXISTS update_profiles_updated_at ON public.profiles;
DROP TRIGGER IF EXISTS update_patients_updated_at ON public.patients;
DROP TRIGGER IF EXISTS update_appointments_updated_at ON public.appointments;

CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_patients_updated_at
  BEFORE UPDATE ON public.patients
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_appointments_updated_at
  BEFORE UPDATE ON public.appointments
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();