-- Add creator tracking fields to patients table
ALTER TABLE public.patients 
ADD COLUMN created_by_id UUID REFERENCES public.profiles(id),
ADD COLUMN created_by_name TEXT,
ADD COLUMN created_by_role TEXT CHECK (created_by_role IN ('doctor', 'assistant', 'secretary', 'admin', 'super_admin')),
ADD COLUMN last_modified_by_id UUID REFERENCES public.profiles(id),
ADD COLUMN last_modified_by_name TEXT,
ADD COLUMN last_modified_by_role TEXT CHECK (last_modified_by_role IN ('doctor', 'assistant', 'secretary', 'admin', 'super_admin'));

-- Create function to automatically set creator info when inserting patients
CREATE OR REPLACE FUNCTION set_patient_creator_info()
RETURNS TRIGGER AS $$
DECLARE
    user_profile RECORD;
BEGIN
    -- Get current user profile information
    SELECT profiles.id, profiles.full_name, profiles.role 
    INTO user_profile
    FROM public.profiles 
    WHERE profiles.id = auth.uid();
    
    -- Set creator information
    NEW.created_by_id = user_profile.id;
    NEW.created_by_name = user_profile.full_name;
    NEW.created_by_role = user_profile.role;
    
    -- Set initial modifier information (same as creator)
    NEW.last_modified_by_id = user_profile.id;
    NEW.last_modified_by_name = user_profile.full_name;
    NEW.last_modified_by_role = user_profile.role;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to automatically set modifier info when updating patients
CREATE OR REPLACE FUNCTION set_patient_modifier_info()
RETURNS TRIGGER AS $$
DECLARE
    user_profile RECORD;
BEGIN
    -- Get current user profile information
    SELECT profiles.id, profiles.full_name, profiles.role 
    INTO user_profile
    FROM public.profiles 
    WHERE profiles.id = auth.uid();
    
    -- Set modifier information
    NEW.last_modified_by_id = user_profile.id;
    NEW.last_modified_by_name = user_profile.full_name;
    NEW.last_modified_by_role = user_profile.role;
    NEW.updated_at = now();
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create triggers for patient creator and modifier tracking
CREATE TRIGGER trigger_set_patient_creator_info
    BEFORE INSERT ON public.patients
    FOR EACH ROW
    EXECUTE FUNCTION set_patient_creator_info();

CREATE TRIGGER trigger_set_patient_modifier_info
    BEFORE UPDATE ON public.patients
    FOR EACH ROW
    EXECUTE FUNCTION set_patient_modifier_info();

-- Add financial_balance column for better financial tracking
ALTER TABLE public.patients 
ADD COLUMN financial_balance DECIMAL(10,2) DEFAULT 0.00,
ADD COLUMN total_payments DECIMAL(10,2) DEFAULT 0.00,
ADD COLUMN total_charges DECIMAL(10,2) DEFAULT 0.00;

-- Create function to calculate financial status based on balance
CREATE OR REPLACE FUNCTION calculate_patient_financial_status(patient_id UUID)
RETURNS TEXT AS $$
DECLARE
    balance DECIMAL(10,2);
    status TEXT;
BEGIN
    -- Get patient balance
    SELECT financial_balance INTO balance
    FROM public.patients 
    WHERE id = patient_id;
    
    -- Determine status based on balance
    IF balance = 0 THEN
        status = 'paid';
    ELSIF balance > 0 THEN
        status = 'overdue';
    ELSE
        status = 'pending';
    END IF;
    
    RETURN status;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update existing patients with default creator info (set to clinic owner for now)
UPDATE public.patients 
SET 
    created_by_id = clinic_id,
    created_by_name = (SELECT full_name FROM public.profiles WHERE id = patients.clinic_id),
    created_by_role = 'admin',
    last_modified_by_id = clinic_id,
    last_modified_by_name = (SELECT full_name FROM public.profiles WHERE id = patients.clinic_id),
    last_modified_by_role = 'admin'
WHERE created_by_id IS NULL;
