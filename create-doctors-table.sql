-- Create doctors table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.doctors (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    clinic_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    full_name TEXT NOT NULL,
    email TEXT,
    phone TEXT,
    specialization TEXT NOT NULL,
    license_number TEXT,
    qualifications TEXT,
    experience_years INTEGER DEFAULT 0,
    consultation_fee DECIMAL(10,2) DEFAULT 0,
    working_hours TEXT,
    address TEXT,
    bio TEXT,
    gender TEXT CHECK (gender IN ('male', 'female')),
    date_of_birth DATE,
    hired_date DATE DEFAULT CURRENT_DATE,
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'suspended')),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_doctors_clinic_id ON public.doctors(clinic_id);
CREATE INDEX IF NOT EXISTS idx_doctors_status ON public.doctors(status);
CREATE INDEX IF NOT EXISTS idx_doctors_specialization ON public.doctors(specialization);

-- Enable RLS (Row Level Security)
ALTER TABLE public.doctors ENABLE ROW LEVEL SECURITY;

-- Create policy to allow users to manage doctors in their clinic
CREATE POLICY "Users can manage doctors in their clinic" ON public.doctors
    FOR ALL USING (
        clinic_id IN (
            SELECT id FROM public.profiles 
            WHERE user_id = auth.uid()
        )
    );

-- Grant permissions
GRANT ALL ON public.doctors TO authenticated;
GRANT USAGE ON SCHEMA public TO authenticated;