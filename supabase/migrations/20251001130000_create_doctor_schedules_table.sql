-- Create doctor_schedules table for comprehensive appointment management
CREATE TABLE IF NOT EXISTS doctor_schedules (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    doctor_id uuid NOT NULL REFERENCES doctors(id) ON DELETE CASCADE,
    clinic_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    day_of_week integer NOT NULL CHECK (day_of_week >= 0 AND day_of_week <= 6), -- 0 = Sunday, 6 = Saturday
    start_time time NOT NULL,
    end_time time NOT NULL CHECK (end_time > start_time),
    slot_duration integer NOT NULL DEFAULT 30 CHECK (slot_duration > 0), -- Duration in minutes
    is_active boolean NOT NULL DEFAULT true,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    
    -- Ensure unique schedule per doctor per day
    UNIQUE(doctor_id, day_of_week)
);

-- Add RLS (Row Level Security)
ALTER TABLE doctor_schedules ENABLE ROW LEVEL SECURITY;

-- Create policy for doctor_schedules
CREATE POLICY "Users can view doctor schedules for their clinic" ON doctor_schedules
    FOR SELECT USING (
        clinic_id IN (
            SELECT id FROM profiles WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Users can manage doctor schedules for their clinic" ON doctor_schedules
    FOR ALL USING (
        clinic_id IN (
            SELECT id FROM profiles WHERE user_id = auth.uid()
        )
    );

-- Create indexes for performance
CREATE INDEX idx_doctor_schedules_doctor_id ON doctor_schedules(doctor_id);
CREATE INDEX idx_doctor_schedules_clinic_id ON doctor_schedules(clinic_id);
CREATE INDEX idx_doctor_schedules_day_of_week ON doctor_schedules(day_of_week);
CREATE INDEX idx_doctor_schedules_active ON doctor_schedules(is_active);

-- Add updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_doctor_schedules_updated_at 
    BEFORE UPDATE ON doctor_schedules 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Insert some sample schedules (optional - can be removed in production)
INSERT INTO doctor_schedules (doctor_id, clinic_id, day_of_week, start_time, end_time, slot_duration) 
SELECT 
    d.id,
    d.clinic_id,
    generate_series(0, 4) as day_of_week, -- Sunday to Thursday
    '09:00'::time as start_time,
    '17:00'::time as end_time,
    30 as slot_duration
FROM doctors d
WHERE d.is_active = true
ON CONFLICT (doctor_id, day_of_week) DO NOTHING;
