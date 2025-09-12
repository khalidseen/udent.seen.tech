-- Create user roles enum
CREATE TYPE public.user_role AS ENUM ('admin', 'doctor', 'secretary');

-- Create profiles table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE NOT NULL,
  full_name TEXT NOT NULL,
  role user_role NOT NULL DEFAULT 'doctor',
  phone TEXT,
  specialization TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create patients table
CREATE TABLE public.patients (
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

-- Create appointments table
CREATE TABLE public.appointments (
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

-- Create policies for profiles
CREATE POLICY "Users can view their own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all profiles" ON public.profiles
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- Create policies for patients
CREATE POLICY "Doctors can view patients" ON public.patients
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE user_id = auth.uid() AND role IN ('doctor', 'admin', 'secretary')
    )
  );

CREATE POLICY "Doctors can insert patients" ON public.patients
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE user_id = auth.uid() AND role IN ('doctor', 'admin', 'secretary')
    )
  );

CREATE POLICY "Doctors can update patients" ON public.patients
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE user_id = auth.uid() AND role IN ('doctor', 'admin', 'secretary')
    )
  );

-- Create policies for appointments
CREATE POLICY "Doctors can view appointments" ON public.appointments
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE user_id = auth.uid() AND role IN ('doctor', 'admin', 'secretary')
    )
  );

CREATE POLICY "Doctors can insert appointments" ON public.appointments
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE user_id = auth.uid() AND role IN ('doctor', 'admin', 'secretary')
    )
  );

CREATE POLICY "Doctors can update appointments" ON public.appointments
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE user_id = auth.uid() AND role IN ('doctor', 'admin', 'secretary')
    )
  );

-- Create trigger function for updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_patients_updated_at
  BEFORE UPDATE ON public.patients
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_appointments_updated_at
  BEFORE UPDATE ON public.appointments
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Insert demo data
-- First create a demo user profile (you'll need to create the auth user first)
INSERT INTO public.profiles (user_id, full_name, role, phone, specialization) VALUES 
  ('00000000-0000-0000-0000-000000000001', 'د. أحمد محمد', 'doctor', '+201234567890', 'طب الأسنان العام'),
  ('00000000-0000-0000-0000-000000000002', 'د. فاطمة علي', 'doctor', '+201234567891', 'تقويم الأسنان'),
  ('00000000-0000-0000-0000-000000000003', 'سارة أحمد', 'secretary', '+201234567892', NULL);

-- Insert demo patients
INSERT INTO public.patients (clinic_id, full_name, phone, email, date_of_birth, gender, address, medical_history) VALUES
  ((SELECT id FROM public.profiles WHERE full_name = 'د. أحمد محمد'), 'محمد عبدالله', '+201111111111', 'mohamed@email.com', '1985-05-15', 'male', 'القاهرة، مصر الجديدة', 'لا يوجد تاريخ مرضي خاص'),
  ((SELECT id FROM public.profiles WHERE full_name = 'د. أحمد محمد'), 'عائشة محمود', '+201222222222', 'aisha@email.com', '1990-08-22', 'female', 'الجيزة، الدقي', 'حساسية من البنسلين'),
  ((SELECT id FROM public.profiles WHERE full_name = 'د. فاطمة علي'), 'أحمد حسن', '+201333333333', 'ahmed@email.com', '1995-12-10', 'male', 'الاسكندرية، سيدي جابر', 'لا يوجد');

-- Insert demo appointments
INSERT INTO public.appointments (patient_id, doctor_id, appointment_date, status, notes, cost) VALUES
  ((SELECT id FROM public.patients WHERE full_name = 'محمد عبدالله'), 
   (SELECT id FROM public.profiles WHERE full_name = 'د. أحمد محمد'), 
   '2024-01-30 10:00:00', 'scheduled', 'فحص دوري', 200.00),
  ((SELECT id FROM public.patients WHERE full_name = 'عائشة محمود'), 
   (SELECT id FROM public.profiles WHERE full_name = 'د. أحمد محمد'), 
   '2024-01-30 11:00:00', 'completed', 'تنظيف الأسنان', 150.00),
  ((SELECT id FROM public.patients WHERE full_name = 'أحمد حسن'), 
   (SELECT id FROM public.profiles WHERE full_name = 'د. فاطمة علي'), 
   '2024-01-31 09:00:00', 'scheduled', 'استشارة تقويم', 300.00);