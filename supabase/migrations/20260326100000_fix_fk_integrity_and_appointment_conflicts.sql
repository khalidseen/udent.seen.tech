-- Migration: Fix Foreign Key Referential Integrity & Add Appointment Conflict Detection
-- Date: 2026-03-26
-- Purpose: 
--   1. Fix clinic_id FKs that incorrectly reference profiles(id) instead of clinics(id)
--   2. Add appointment conflict detection to prevent double-booking
--   3. Add treatment status workflow enum

-- ============================================================
-- PART 1: Fix Foreign Key References (safe - only if FK exists)
-- ============================================================

-- Helper: Safely drop constraint if it exists, then re-create pointing to clinics(id)
-- We use DO blocks to handle cases where constraints may not exist or have different names.

DO $$
BEGIN
  -- Fix patients.clinic_id → clinics(id)
  BEGIN
    ALTER TABLE patients DROP CONSTRAINT IF EXISTS patients_clinic_id_fkey;
    ALTER TABLE patients 
      ADD CONSTRAINT patients_clinic_id_fkey 
      FOREIGN KEY (clinic_id) REFERENCES clinics(id) ON DELETE CASCADE;
    RAISE NOTICE 'Fixed patients.clinic_id FK';
  EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'Could not fix patients FK: %', SQLERRM;
  END;

  -- Fix appointments.clinic_id → clinics(id)
  BEGIN
    ALTER TABLE appointments DROP CONSTRAINT IF EXISTS appointments_clinic_id_fkey;
    ALTER TABLE appointments 
      ADD CONSTRAINT appointments_clinic_id_fkey 
      FOREIGN KEY (clinic_id) REFERENCES clinics(id) ON DELETE CASCADE;
    RAISE NOTICE 'Fixed appointments.clinic_id FK';
  EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'Could not fix appointments FK: %', SQLERRM;
  END;

  -- Fix dental_treatments.clinic_id → clinics(id)
  BEGIN
    ALTER TABLE dental_treatments DROP CONSTRAINT IF EXISTS dental_treatments_clinic_id_fkey;
    ALTER TABLE dental_treatments 
      ADD CONSTRAINT dental_treatments_clinic_id_fkey 
      FOREIGN KEY (clinic_id) REFERENCES clinics(id) ON DELETE CASCADE;
    RAISE NOTICE 'Fixed dental_treatments.clinic_id FK';
  EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'Could not fix dental_treatments FK: %', SQLERRM;
  END;

  -- Fix doctor_schedules.clinic_id → clinics(id)
  BEGIN
    ALTER TABLE doctor_schedules DROP CONSTRAINT IF EXISTS doctor_schedules_clinic_id_fkey;
    ALTER TABLE doctor_schedules 
      ADD CONSTRAINT doctor_schedules_clinic_id_fkey 
      FOREIGN KEY (clinic_id) REFERENCES clinics(id) ON DELETE CASCADE;
    RAISE NOTICE 'Fixed doctor_schedules.clinic_id FK';
  EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'Could not fix doctor_schedules FK: %', SQLERRM;
  END;

  -- Fix medical_records.clinic_id → clinics(id)
  BEGIN
    ALTER TABLE medical_records DROP CONSTRAINT IF EXISTS medical_records_clinic_id_fkey;
    ALTER TABLE medical_records 
      ADD CONSTRAINT medical_records_clinic_id_fkey 
      FOREIGN KEY (clinic_id) REFERENCES clinics(id) ON DELETE CASCADE;
    RAISE NOTICE 'Fixed medical_records.clinic_id FK';
  EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'Could not fix medical_records FK: %', SQLERRM;
  END;

  -- Fix invoices.clinic_id → clinics(id)
  BEGIN
    ALTER TABLE invoices DROP CONSTRAINT IF EXISTS invoices_clinic_id_fkey;
    ALTER TABLE invoices 
      ADD CONSTRAINT invoices_clinic_id_fkey 
      FOREIGN KEY (clinic_id) REFERENCES clinics(id) ON DELETE CASCADE;
    RAISE NOTICE 'Fixed invoices.clinic_id FK';
  EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'Could not fix invoices FK: %', SQLERRM;
  END;

  -- Fix doctor_assistants.clinic_id → clinics(id)
  BEGIN
    ALTER TABLE doctor_assistants DROP CONSTRAINT IF EXISTS doctor_assistants_clinic_id_fkey;
    ALTER TABLE doctor_assistants 
      ADD CONSTRAINT doctor_assistants_clinic_id_fkey 
      FOREIGN KEY (clinic_id) REFERENCES clinics(id) ON DELETE CASCADE;
    RAISE NOTICE 'Fixed doctor_assistants.clinic_id FK';
  EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'Could not fix doctor_assistants FK: %', SQLERRM;
  END;

  -- Fix medical_images.clinic_id → clinics(id)
  BEGIN
    ALTER TABLE medical_images DROP CONSTRAINT IF EXISTS medical_images_clinic_id_fkey;
    ALTER TABLE medical_images 
      ADD CONSTRAINT medical_images_clinic_id_fkey 
      FOREIGN KEY (clinic_id) REFERENCES clinics(id) ON DELETE CASCADE;
    RAISE NOTICE 'Fixed medical_images.clinic_id FK';
  EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'Could not fix medical_images FK: %', SQLERRM;
  END;
END $$;


-- ============================================================
-- PART 2: Appointment Conflict Detection
-- ============================================================

-- Function to check for appointment time conflicts for same doctor
CREATE OR REPLACE FUNCTION check_appointment_conflict()
RETURNS TRIGGER AS $$
DECLARE
  conflict_count INT;
  appt_duration INT;
BEGIN
  -- Default duration 30 minutes if not specified
  appt_duration := COALESCE(NEW.duration, 30);
  
  -- Only check if we have a doctor_id and appointment_date
  IF NEW.doctor_id IS NOT NULL AND NEW.appointment_date IS NOT NULL THEN
    SELECT COUNT(*) INTO conflict_count
    FROM appointments
    WHERE id != COALESCE(NEW.id, '00000000-0000-0000-0000-000000000000'::uuid)
      AND doctor_id = NEW.doctor_id
      AND clinic_id = NEW.clinic_id
      AND status NOT IN ('cancelled', 'no_show', 'rejected')
      AND (
        -- New appointment overlaps with existing appointment
        (NEW.appointment_date, NEW.appointment_date + (appt_duration || ' minutes')::interval)
        OVERLAPS
        (appointment_date, appointment_date + (COALESCE(duration, 30) || ' minutes')::interval)
      );
    
    IF conflict_count > 0 THEN
      RAISE EXCEPTION 'هذا الطبيب لديه موعد آخر في نفس الوقت / Doctor has a conflicting appointment at this time'
        USING ERRCODE = 'unique_violation';
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for conflict detection (drop first if exists)
DROP TRIGGER IF EXISTS trg_check_appointment_conflict ON appointments;
CREATE TRIGGER trg_check_appointment_conflict
  BEFORE INSERT OR UPDATE ON appointments
  FOR EACH ROW
  EXECUTE FUNCTION check_appointment_conflict();


-- ============================================================
-- PART 3: Treatment Status Workflow
-- ============================================================

-- Create treatment status type if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'treatment_status_enum') THEN
    CREATE TYPE treatment_status_enum AS ENUM (
      'planned',
      'in_progress', 
      'completed',
      'on_hold',
      'cancelled',
      'archived'
    );
  END IF;
END $$;

-- Add treatment_workflow_status column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'dental_treatments' AND column_name = 'workflow_status'
  ) THEN
    ALTER TABLE dental_treatments 
      ADD COLUMN workflow_status TEXT DEFAULT 'planned'
      CHECK (workflow_status IN ('planned', 'in_progress', 'completed', 'on_hold', 'cancelled', 'archived'));
  END IF;

  -- Add started_at / completed_at timestamps
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'dental_treatments' AND column_name = 'started_at'
  ) THEN
    ALTER TABLE dental_treatments ADD COLUMN started_at TIMESTAMPTZ;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'dental_treatments' AND column_name = 'completed_at'
  ) THEN
    ALTER TABLE dental_treatments ADD COLUMN completed_at TIMESTAMPTZ;
  END IF;
END $$;

-- Function to validate treatment status transitions
CREATE OR REPLACE FUNCTION validate_treatment_status_transition()
RETURNS TRIGGER AS $$
BEGIN
  -- Auto-set timestamps based on status changes
  IF NEW.workflow_status = 'in_progress' AND OLD.workflow_status = 'planned' THEN
    NEW.started_at := NOW();
  ELSIF NEW.workflow_status = 'completed' AND OLD.workflow_status = 'in_progress' THEN
    NEW.completed_at := NOW();
  END IF;
  
  -- Validate transitions
  IF OLD.workflow_status = 'completed' AND NEW.workflow_status NOT IN ('archived', 'completed') THEN
    RAISE EXCEPTION 'Cannot change status from completed to %', NEW.workflow_status;
  END IF;
  
  IF OLD.workflow_status = 'archived' THEN
    RAISE EXCEPTION 'Cannot change status of archived treatment';
  END IF;
  
  IF OLD.workflow_status = 'cancelled' AND NEW.workflow_status != 'planned' THEN
    RAISE EXCEPTION 'Cancelled treatments can only be reopened as planned';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for treatment status validation
DROP TRIGGER IF EXISTS trg_validate_treatment_status ON dental_treatments;
CREATE TRIGGER trg_validate_treatment_status
  BEFORE UPDATE ON dental_treatments
  FOR EACH ROW
  WHEN (OLD.workflow_status IS DISTINCT FROM NEW.workflow_status)
  EXECUTE FUNCTION validate_treatment_status_transition();


-- ============================================================
-- PART 4: Prescriptions table (if not exists)
-- ============================================================

CREATE TABLE IF NOT EXISTS prescriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id UUID NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
  patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  doctor_id UUID NOT NULL REFERENCES doctors(id),
  treatment_id UUID REFERENCES dental_treatments(id),
  
  -- Prescription details
  prescription_number TEXT,
  diagnosis TEXT,
  notes TEXT,
  
  -- Medications as JSONB array
  medications JSONB DEFAULT '[]'::jsonb,
  -- Each item: {name, dosage, frequency, duration, instructions, quantity}
  
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'dispensed', 'expired', 'cancelled')),
  
  prescribed_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ,
  dispensed_at TIMESTAMPTZ,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS for prescriptions
ALTER TABLE prescriptions ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'prescriptions' AND policyname = 'prescriptions_clinic_isolation'
  ) THEN
    CREATE POLICY prescriptions_clinic_isolation ON prescriptions
      FOR ALL USING (clinic_id IN (SELECT get_user_accessible_clinics()));
  END IF;
END $$;

-- Index for faster lookups
CREATE INDEX IF NOT EXISTS idx_prescriptions_patient ON prescriptions(patient_id);
CREATE INDEX IF NOT EXISTS idx_prescriptions_doctor ON prescriptions(doctor_id);
CREATE INDEX IF NOT EXISTS idx_prescriptions_clinic ON prescriptions(clinic_id);
CREATE INDEX IF NOT EXISTS idx_appointments_doctor_date ON appointments(doctor_id, appointment_date) WHERE status NOT IN ('cancelled', 'no_show', 'rejected');
