-- First drop ALL existing policies for patients table
DROP POLICY IF EXISTS "Users can view their clinic patients" ON public.patients;
DROP POLICY IF EXISTS "Users can create patients for their clinic" ON public.patients;
DROP POLICY IF EXISTS "Users can update their clinic patients" ON public.patients;
DROP POLICY IF EXISTS "Users can delete their clinic patients" ON public.patients;
DROP POLICY IF EXISTS "Super admins can view all patients" ON public.patients;
DROP POLICY IF EXISTS "Super admins can create patients for any clinic" ON public.patients;
DROP POLICY IF EXISTS "Super admins can update all patients" ON public.patients;
DROP POLICY IF EXISTS "Super admins can delete all patients" ON public.patients;

-- Create new correct policies for patients
CREATE POLICY "Users can view their clinic patients" ON public.patients
    FOR SELECT USING (
        clinic_id = (SELECT clinic_id FROM public.profiles WHERE user_id = auth.uid())
    );

CREATE POLICY "Super admins can view all patients" ON public.patients
    FOR SELECT USING (
        EXISTS (SELECT 1 FROM public.profiles WHERE user_id = auth.uid() AND role = 'admin')
    );

CREATE POLICY "Users can create patients for their clinic" ON public.patients
    FOR INSERT WITH CHECK (
        clinic_id = (SELECT clinic_id FROM public.profiles WHERE user_id = auth.uid())
    );

CREATE POLICY "Super admins can create patients for any clinic" ON public.patients
    FOR INSERT WITH CHECK (
        EXISTS (SELECT 1 FROM public.profiles WHERE user_id = auth.uid() AND role = 'admin')
    );

CREATE POLICY "Users can update their clinic patients" ON public.patients
    FOR UPDATE USING (
        clinic_id = (SELECT clinic_id FROM public.profiles WHERE user_id = auth.uid())
    );

CREATE POLICY "Super admins can update all patients" ON public.patients
    FOR UPDATE USING (
        EXISTS (SELECT 1 FROM public.profiles WHERE user_id = auth.uid() AND role = 'admin')
    );

CREATE POLICY "Users can delete their clinic patients" ON public.patients
    FOR DELETE USING (
        clinic_id = (SELECT clinic_id FROM public.profiles WHERE user_id = auth.uid())
    );

CREATE POLICY "Super admins can delete all patients" ON public.patients
    FOR DELETE USING (
        EXISTS (SELECT 1 FROM public.profiles WHERE user_id = auth.uid() AND role = 'admin')
    );