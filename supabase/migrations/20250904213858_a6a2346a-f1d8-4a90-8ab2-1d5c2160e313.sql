-- Migration to remove Palmer and FDI systems, keep only Universal
-- Update all existing records to use 'universal' numbering system

-- First, update all existing tooth_notes records
UPDATE tooth_notes 
SET numbering_system = 'universal' 
WHERE numbering_system IN ('palmer', 'fdi');

-- Update all existing tooth_conditions records  
UPDATE tooth_conditions 
SET numbering_system = 'universal'
WHERE numbering_system IN ('palmer', 'fdi');

-- Update all existing tooth_3d_annotations records
UPDATE tooth_3d_annotations 
SET numbering_system = 'universal'
WHERE numbering_system IN ('palmer', 'fdi');

-- Update all existing patient_dental_models records
UPDATE patient_dental_models 
SET numbering_system = 'universal'
WHERE numbering_system IN ('palmer', 'fdi');

-- Add constraint to ensure only 'universal' is allowed going forward
ALTER TABLE tooth_notes 
ADD CONSTRAINT check_numbering_system_universal 
CHECK (numbering_system = 'universal');

ALTER TABLE tooth_conditions 
ADD CONSTRAINT check_numbering_system_universal 
CHECK (numbering_system = 'universal');

ALTER TABLE tooth_3d_annotations 
ADD CONSTRAINT check_numbering_system_universal 
CHECK (numbering_system = 'universal');

ALTER TABLE patient_dental_models 
ADD CONSTRAINT check_numbering_system_universal 
CHECK (numbering_system = 'universal');

-- Create advanced tooth notes system tables

-- Advanced tooth notes table with enhanced features
CREATE TABLE IF NOT EXISTS advanced_tooth_notes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id UUID NOT NULL,
    clinic_id UUID NOT NULL,
    tooth_number TEXT NOT NULL,
    numbering_system TEXT NOT NULL DEFAULT 'universal',
    
    -- Note content and metadata
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    note_type TEXT NOT NULL DEFAULT 'general',
    
    -- Medical classifications
    diagnosis TEXT,
    treatment_plan TEXT,
    differential_diagnosis TEXT[],
    
    -- Status and priority
    status TEXT NOT NULL DEFAULT 'active',
    priority TEXT NOT NULL DEFAULT 'medium',
    severity TEXT DEFAULT 'mild',
    
    -- Visual and organization
    color_code TEXT DEFAULT '#3b82f6',
    tags TEXT[],
    
    -- Dates and tracking
    examination_date DATE DEFAULT CURRENT_DATE,
    follow_up_date DATE,
    treatment_start_date DATE,
    treatment_completion_date DATE,
    next_appointment_date DATE,
    
    -- Clinical details
    symptoms TEXT[],
    clinical_findings TEXT,
    radiographic_findings TEXT,
    treatment_performed TEXT,
    materials_used TEXT[],
    
    -- Outcomes and complications
    treatment_outcome TEXT,
    complications TEXT,
    patient_response TEXT,
    
    -- Professional details
    treating_doctor TEXT,
    assisting_staff TEXT[],
    
    -- Quality and review
    quality_score INTEGER CHECK (quality_score >= 1 AND quality_score <= 5),
    peer_reviewed BOOLEAN DEFAULT false,
    reviewed_by UUID,
    review_date DATE,
    review_comments TEXT,
    
    -- Attachments and references
    attachments JSONB DEFAULT '[]'::jsonb,
    references TEXT[],
    related_notes UUID[],
    
    -- Template and standardization
    template_id UUID,
    is_template BOOLEAN DEFAULT false,
    
    -- Audit trail
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    created_by UUID,
    last_modified_by UUID,
    
    -- Constraints
    CONSTRAINT check_advanced_numbering_system CHECK (numbering_system = 'universal'),
    CONSTRAINT check_note_type CHECK (note_type IN (
        'general', 'diagnosis', 'treatment_plan', 'progress_note', 
        'consultation', 'emergency', 'follow_up', 'referral',
        'surgical_note', 'endodontic', 'periodontal', 'prosthodontic',
        'orthodontic', 'pediatric', 'oral_surgery', 'preventive'
    )),
    CONSTRAINT check_priority CHECK (priority IN ('critical', 'high', 'medium', 'low')),
    CONSTRAINT check_status CHECK (status IN (
        'active', 'completed', 'cancelled', 'postponed', 
        'under_treatment', 'awaiting_results', 'referred'
    )),
    CONSTRAINT check_severity CHECK (severity IN ('mild', 'moderate', 'severe', 'critical'))
);

-- Note templates for standardized entries
CREATE TABLE IF NOT EXISTS advanced_note_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    clinic_id UUID NOT NULL,
    
    -- Template identification
    name TEXT NOT NULL,
    description TEXT,
    category TEXT NOT NULL,
    
    -- Template content
    title_template TEXT NOT NULL,
    content_template TEXT NOT NULL,
    
    -- Default values
    default_note_type TEXT DEFAULT 'general',
    default_priority TEXT DEFAULT 'medium',
    default_status TEXT DEFAULT 'active',
    
    -- Template structure
    required_fields TEXT[],
    optional_fields TEXT[],
    field_validations JSONB DEFAULT '{}'::jsonb,
    
    -- Usage and access
    is_active BOOLEAN DEFAULT true,
    is_public BOOLEAN DEFAULT false,
    usage_count INTEGER DEFAULT 0,
    
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    created_by UUID NOT NULL,
    
    CONSTRAINT check_template_category CHECK (category IN (
        'diagnosis', 'treatment', 'consultation', 'emergency',
        'preventive', 'surgical', 'follow_up', 'referral'
    ))
);

-- Treatment history tracking
CREATE TABLE IF NOT EXISTS tooth_treatment_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id UUID NOT NULL,
    clinic_id UUID NOT NULL,
    tooth_number TEXT NOT NULL,
    numbering_system TEXT NOT NULL DEFAULT 'universal',
    
    -- Treatment details
    treatment_type TEXT NOT NULL,
    treatment_name TEXT NOT NULL,
    description TEXT,
    
    -- Dates and duration
    treatment_date DATE NOT NULL,
    start_time TIME,
    end_time TIME,
    duration_minutes INTEGER,
    
    -- Clinical details
    anesthesia_used TEXT[],
    materials_used JSONB DEFAULT '[]'::jsonb,
    equipment_used TEXT[],
    
    -- Outcomes
    success_rate DECIMAL(3,2) CHECK (success_rate >= 0 AND success_rate <= 1),
    complications TEXT,
    patient_satisfaction INTEGER CHECK (patient_satisfaction >= 1 AND patient_satisfaction <= 5),
    
    -- Financial
    cost DECIMAL(10,2),
    insurance_covered BOOLEAN DEFAULT false,
    insurance_amount DECIMAL(10,2),
    
    -- Professional
    primary_doctor UUID,
    assisting_doctors UUID[],
    
    -- References
    related_note_id UUID REFERENCES advanced_tooth_notes(id),
    appointment_id UUID,
    
    -- Audit
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    created_by UUID NOT NULL,
    
    CONSTRAINT check_treatment_numbering_system CHECK (numbering_system = 'universal')
);

-- Clinical attachments for notes
CREATE TABLE IF NOT EXISTS clinical_attachments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    note_id UUID NOT NULL REFERENCES advanced_tooth_notes(id) ON DELETE CASCADE,
    clinic_id UUID NOT NULL,
    
    -- File details
    file_name TEXT NOT NULL,
    file_path TEXT NOT NULL,
    file_type TEXT NOT NULL,
    file_size INTEGER,
    
    -- Metadata
    description TEXT,
    category TEXT DEFAULT 'general',
    
    -- Dates
    uploaded_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    uploaded_by UUID NOT NULL,
    
    CONSTRAINT check_attachment_category CHECK (category IN (
        'general', 'xray', 'photo', 'scan', 'document', 'video', 'audio'
    ))
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_advanced_tooth_notes_patient_tooth 
ON advanced_tooth_notes(patient_id, tooth_number);

CREATE INDEX IF NOT EXISTS idx_advanced_tooth_notes_clinic 
ON advanced_tooth_notes(clinic_id);

CREATE INDEX IF NOT EXISTS idx_advanced_tooth_notes_date 
ON advanced_tooth_notes(examination_date);

CREATE INDEX IF NOT EXISTS idx_advanced_tooth_notes_status 
ON advanced_tooth_notes(status, priority);

CREATE INDEX IF NOT EXISTS idx_treatment_history_patient_tooth 
ON tooth_treatment_history(patient_id, tooth_number);

CREATE INDEX IF NOT EXISTS idx_note_templates_clinic 
ON advanced_note_templates(clinic_id);

-- Enable RLS policies for all new tables
ALTER TABLE advanced_tooth_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE advanced_note_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE tooth_treatment_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE clinical_attachments ENABLE ROW LEVEL SECURITY;

-- RLS Policies for advanced_tooth_notes
CREATE POLICY "Users can manage their clinic advanced tooth notes" 
ON advanced_tooth_notes 
FOR ALL 
USING (clinic_id = (SELECT get_current_user_profile()).id);

-- RLS Policies for advanced_note_templates
CREATE POLICY "Users can manage their clinic note templates" 
ON advanced_note_templates 
FOR ALL 
USING (clinic_id = (SELECT get_current_user_profile()).id OR is_public = true);

-- RLS Policies for tooth_treatment_history
CREATE POLICY "Users can manage their clinic treatment history" 
ON tooth_treatment_history 
FOR ALL 
USING (clinic_id = (SELECT get_current_user_profile()).id);

-- RLS Policies for clinical_attachments
CREATE POLICY "Users can manage their clinic attachments" 
ON clinical_attachments 
FOR ALL 
USING (clinic_id = (SELECT get_current_user_profile()).id);

-- Functions for automatic timestamp updates
CREATE OR REPLACE FUNCTION update_advanced_notes_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for automatic updates
CREATE TRIGGER update_advanced_tooth_notes_updated_at
    BEFORE UPDATE ON advanced_tooth_notes
    FOR EACH ROW
    EXECUTE FUNCTION update_advanced_notes_updated_at();

CREATE TRIGGER update_advanced_note_templates_updated_at
    BEFORE UPDATE ON advanced_note_templates
    FOR EACH ROW
    EXECUTE FUNCTION update_advanced_notes_updated_at();