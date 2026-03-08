-- ============================================================
-- UDent Dental System - Complete Database Setup Script
-- Run this on a fresh Supabase project to set up all tables
-- ============================================================

-- ==================== ENUMS ====================
DO $$ BEGIN
  CREATE TYPE public.user_role_type AS ENUM (
    'super_admin', 'clinic_manager', 'dentist', 'assistant', 
    'accountant', 'owner', 'receptionist', 'secretary'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE public.event_category AS ENUM (
    'authentication', 'data_access', 'data_modification', 
    'permission_change', 'system_admin', 'financial', 'medical_record'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE public.operation_sensitivity AS ENUM ('normal', 'sensitive', 'critical');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ==================== CORE TABLES ====================

-- Profiles (linked to auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  full_name TEXT,
  email TEXT,
  phone TEXT,
  role TEXT DEFAULT 'user',
  clinic_id UUID,
  current_clinic_role user_role_type DEFAULT 'assistant',
  avatar_url TEXT,
  dashboard_link_validation_dismissed BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Subscription Plans
CREATE TABLE IF NOT EXISTS public.subscription_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  name_ar TEXT,
  description TEXT,
  price NUMERIC DEFAULT 0,
  currency TEXT DEFAULT 'IQD',
  billing_cycle TEXT DEFAULT 'monthly',
  max_users INTEGER DEFAULT 10,
  max_patients INTEGER DEFAULT 1000,
  max_monthly_appointments INTEGER DEFAULT 500,
  max_storage_gb INTEGER DEFAULT 5,
  features JSONB DEFAULT '{}',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Clinics
CREATE TABLE IF NOT EXISTS public.clinics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  address TEXT,
  city TEXT,
  country TEXT,
  phone TEXT,
  email TEXT,
  logo_url TEXT,
  license_number TEXT,
  is_active BOOLEAN DEFAULT true,
  max_users INTEGER DEFAULT 10,
  max_patients INTEGER DEFAULT 1000,
  subscription_plan TEXT,
  subscription_plan_id UUID REFERENCES public.subscription_plans(id),
  subscription_status TEXT DEFAULT 'active',
  subscription_start_date TIMESTAMPTZ,
  subscription_end_date TIMESTAMPTZ,
  subscription_notes TEXT,
  trial_end_date TIMESTAMPTZ,
  custom_plan_config JSONB,
  usage_metrics JSONB,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Add FK from profiles to clinics
ALTER TABLE public.profiles ADD CONSTRAINT profiles_clinic_id_fkey 
  FOREIGN KEY (clinic_id) REFERENCES public.clinics(id) ON DELETE SET NULL;

-- Clinic Settings
CREATE TABLE IF NOT EXISTS public.clinic_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id UUID REFERENCES public.clinics(id) ON DELETE CASCADE NOT NULL UNIQUE,
  currency TEXT DEFAULT 'IQD',
  language TEXT DEFAULT 'ar',
  time_format TEXT DEFAULT '24',
  timezone TEXT DEFAULT 'Asia/Baghdad',
  custom_preferences JSONB DEFAULT '{}',
  remote_access_enabled BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Clinic Memberships
CREATE TABLE IF NOT EXISTS public.clinic_memberships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id UUID REFERENCES public.clinics(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role user_role_type NOT NULL,
  is_active BOOLEAN DEFAULT true,
  joined_at TIMESTAMPTZ DEFAULT now()
);

-- Clinic Role Hierarchy
CREATE TABLE IF NOT EXISTS public.clinic_role_hierarchy (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  role_name user_role_type NOT NULL,
  level INTEGER NOT NULL,
  description TEXT,
  description_ar TEXT,
  permissions JSONB,
  can_manage user_role_type[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ==================== PATIENT & MEDICAL TABLES ====================

-- Doctors
CREATE TABLE IF NOT EXISTS public.doctors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id UUID NOT NULL,
  full_name TEXT NOT NULL,
  specialization TEXT,
  email TEXT,
  phone TEXT,
  address TEXT,
  date_of_birth DATE,
  gender TEXT,
  license_number TEXT,
  experience_years INTEGER,
  qualifications TEXT,
  consultation_fee NUMERIC,
  working_hours TEXT,
  hired_date DATE,
  bio TEXT,
  notes TEXT,
  status TEXT DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Patients
CREATE TABLE IF NOT EXISTS public.patients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id UUID NOT NULL REFERENCES public.profiles(id),
  full_name TEXT NOT NULL,
  phone TEXT,
  email TEXT,
  date_of_birth DATE,
  gender TEXT,
  address TEXT,
  national_id TEXT,
  blood_type TEXT,
  marital_status TEXT,
  occupation TEXT,
  medical_condition TEXT,
  medical_history TEXT,
  insurance_info TEXT,
  emergency_contact TEXT,
  emergency_phone TEXT,
  notes TEXT,
  patient_status TEXT DEFAULT 'active',
  assigned_doctor_id UUID REFERENCES public.doctors(id),
  financial_balance NUMERIC DEFAULT 0,
  financial_status TEXT DEFAULT 'clear',
  created_by_id UUID,
  created_by_name TEXT,
  created_by_role TEXT,
  last_modified_by_id UUID,
  last_modified_by_name TEXT,
  last_modified_by_role TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Appointments
CREATE TABLE IF NOT EXISTS public.appointments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id UUID NOT NULL REFERENCES public.profiles(id),
  patient_id UUID REFERENCES public.patients(id),
  appointment_date TIMESTAMPTZ NOT NULL,
  duration INTEGER DEFAULT 30,
  status TEXT DEFAULT 'scheduled',
  treatment_type TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Dental Treatments
CREATE TABLE IF NOT EXISTS public.dental_treatments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id UUID NOT NULL REFERENCES public.profiles(id),
  patient_id UUID NOT NULL REFERENCES public.patients(id),
  assigned_doctor_id UUID REFERENCES public.doctors(id),
  tooth_number TEXT NOT NULL,
  tooth_surface TEXT,
  numbering_system TEXT DEFAULT 'universal',
  diagnosis TEXT NOT NULL,
  treatment_plan TEXT NOT NULL,
  treatment_date DATE NOT NULL,
  status TEXT DEFAULT 'planned',
  notes TEXT,
  prescribed_medications JSONB,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Medical Records
CREATE TABLE IF NOT EXISTS public.medical_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id UUID NOT NULL,
  patient_id UUID NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  record_type TEXT DEFAULT 'general',
  diagnosis TEXT,
  treatment_plan TEXT,
  treatment_date DATE DEFAULT CURRENT_DATE,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Medical Images
CREATE TABLE IF NOT EXISTS public.medical_images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id UUID NOT NULL,
  patient_id UUID NOT NULL,
  record_id UUID REFERENCES public.medical_records(id),
  title TEXT NOT NULL,
  description TEXT,
  file_path TEXT NOT NULL,
  file_size INTEGER,
  mime_type TEXT,
  image_type TEXT DEFAULT 'xray',
  image_date DATE DEFAULT CURRENT_DATE,
  tooth_number TEXT,
  is_before_treatment BOOLEAN DEFAULT false,
  is_after_treatment BOOLEAN DEFAULT false,
  has_annotations BOOLEAN DEFAULT false,
  annotation_data JSONB,
  annotated_image_path TEXT,
  ai_analysis_status TEXT,
  ai_analysis_result JSONB,
  ai_analysis_date TIMESTAMPTZ,
  ai_confidence_score NUMERIC,
  ai_detected_conditions TEXT[],
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ==================== FINANCIAL TABLES ====================

-- Invoices
CREATE TABLE IF NOT EXISTS public.invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id UUID NOT NULL,
  patient_id UUID NOT NULL,
  invoice_number TEXT NOT NULL,
  issue_date DATE DEFAULT CURRENT_DATE,
  due_date DATE NOT NULL,
  subtotal NUMERIC DEFAULT 0,
  discount_percentage NUMERIC,
  discount_amount NUMERIC,
  tax_percentage NUMERIC,
  tax_amount NUMERIC,
  total_amount NUMERIC NOT NULL,
  paid_amount NUMERIC DEFAULT 0,
  balance_due NUMERIC DEFAULT 0,
  status TEXT DEFAULT 'pending',
  notes TEXT,
  treatment_plan_id UUID,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Invoice Items
CREATE TABLE IF NOT EXISTS public.invoice_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id UUID NOT NULL REFERENCES public.invoices(id) ON DELETE CASCADE,
  service_name TEXT NOT NULL,
  description TEXT,
  quantity INTEGER DEFAULT 1,
  unit_price NUMERIC NOT NULL,
  line_total NUMERIC NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Payments
CREATE TABLE IF NOT EXISTS public.payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id UUID NOT NULL,
  patient_id UUID NOT NULL,
  invoice_id UUID REFERENCES public.invoices(id),
  treatment_plan_id UUID,
  amount NUMERIC NOT NULL,
  payment_method TEXT DEFAULT 'cash',
  payment_date DATE DEFAULT CURRENT_DATE,
  reference_number TEXT,
  status TEXT DEFAULT 'completed',
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ==================== INVENTORY ====================

-- Medical Supplies
CREATE TABLE IF NOT EXISTS public.medical_supplies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id UUID NOT NULL,
  name TEXT NOT NULL,
  category TEXT DEFAULT 'general',
  unit TEXT DEFAULT 'piece',
  current_stock INTEGER DEFAULT 0,
  minimum_stock INTEGER DEFAULT 5,
  unit_cost NUMERIC DEFAULT 0,
  supplier TEXT,
  supplier_contact TEXT,
  brand TEXT,
  batch_number TEXT,
  expiry_date DATE,
  notes TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Medications
CREATE TABLE IF NOT EXISTS public.medications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id UUID NOT NULL,
  trade_name TEXT NOT NULL,
  generic_name TEXT,
  form TEXT NOT NULL,
  strength TEXT NOT NULL,
  frequency TEXT NOT NULL,
  duration TEXT,
  instructions TEXT,
  prescription_type TEXT DEFAULT 'general',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ==================== NOTIFICATIONS ====================

-- Notifications
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id UUID NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT DEFAULT 'general',
  priority TEXT DEFAULT 'medium',
  status TEXT DEFAULT 'pending',
  scheduled_for TIMESTAMPTZ NOT NULL,
  patient_id UUID,
  related_id UUID,
  related_type TEXT,
  auto_generated BOOLEAN DEFAULT false,
  reminded_count INTEGER DEFAULT 0,
  max_reminders INTEGER DEFAULT 3,
  dismissed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Notification Templates
CREATE TABLE IF NOT EXISTS public.notification_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id UUID NOT NULL,
  name TEXT NOT NULL,
  type TEXT NOT NULL,
  title_template TEXT NOT NULL,
  message_template TEXT NOT NULL,
  advance_days INTEGER DEFAULT 1,
  default_priority TEXT DEFAULT 'medium',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ==================== AUTH & PERMISSIONS ====================

-- User Roles
CREATE TABLE IF NOT EXISTS public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  role_name TEXT NOT NULL UNIQUE,
  role_name_ar TEXT,
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Permissions
CREATE TABLE IF NOT EXISTS public.permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  permission_key TEXT NOT NULL UNIQUE,
  permission_name TEXT NOT NULL,
  permission_name_ar TEXT NOT NULL,
  category TEXT NOT NULL,
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Role Permissions
CREATE TABLE IF NOT EXISTS public.role_permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  role_id UUID REFERENCES public.user_roles(id) ON DELETE CASCADE NOT NULL,
  permission_id UUID REFERENCES public.permissions(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(role_id, permission_id)
);

-- User Role Assignments
CREATE TABLE IF NOT EXISTS public.user_role_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role_id UUID REFERENCES public.user_roles(id) ON DELETE CASCADE NOT NULL,
  is_active BOOLEAN DEFAULT true,
  expires_at TIMESTAMPTZ,
  assigned_by UUID,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Temporary Permissions
CREATE TABLE IF NOT EXISTS public.temporary_permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  permission_key TEXT NOT NULL,
  is_active BOOLEAN DEFAULT true,
  expires_at TIMESTAMPTZ NOT NULL,
  granted_by UUID,
  reason TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ==================== API & INTEGRATIONS ====================

-- API Keys
CREATE TABLE IF NOT EXISTS public.api_keys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id UUID REFERENCES public.clinics(id) ON DELETE CASCADE NOT NULL,
  key_name TEXT NOT NULL,
  api_key TEXT NOT NULL,
  permissions JSONB,
  is_active BOOLEAN DEFAULT true,
  last_used_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  created_by UUID,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- API Logs
CREATE TABLE IF NOT EXISTS public.api_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id UUID REFERENCES public.clinics(id) ON DELETE CASCADE NOT NULL,
  api_key_id UUID REFERENCES public.api_keys(id),
  endpoint TEXT NOT NULL,
  method TEXT NOT NULL,
  status_code INTEGER,
  response_time_ms INTEGER,
  ip_address INET DEFAULT '0.0.0.0',
  user_agent TEXT,
  request_params JSONB,
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ==================== SECURITY & AUDIT ====================

-- Audit Log
CREATE TABLE IF NOT EXISTS public.audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  table_name TEXT NOT NULL,
  operation TEXT NOT NULL,
  old_data JSONB,
  new_data JSONB,
  user_id UUID,
  ip_address INET DEFAULT '0.0.0.0',
  user_agent TEXT,
  timestamp TIMESTAMPTZ DEFAULT now()
);

-- Security Events
CREATE TABLE IF NOT EXISTS public.security_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type TEXT NOT NULL,
  event_category public.event_category,
  sensitivity_level public.operation_sensitivity DEFAULT 'normal',
  user_id UUID,
  details JSONB,
  table_name TEXT,
  record_id UUID,
  operation TEXT,
  old_data JSONB,
  new_data JSONB,
  context_data JSONB,
  ip_address INET,
  user_agent TEXT,
  risk_score INTEGER DEFAULT 0,
  processed_for_alerts BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Security Alerts
CREATE TABLE IF NOT EXISTS public.security_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id UUID NOT NULL,
  alert_type TEXT NOT NULL,
  severity TEXT DEFAULT 'medium',
  title TEXT NOT NULL,
  description TEXT,
  user_id UUID,
  triggered_by_event_id UUID,
  metadata JSONB,
  status TEXT DEFAULT 'open',
  resolved_at TIMESTAMPTZ,
  resolved_by UUID,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ==================== OTHER TABLES ====================

-- Doctor Assistants
CREATE TABLE IF NOT EXISTS public.doctor_assistants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id UUID NOT NULL REFERENCES public.profiles(id),
  full_name TEXT NOT NULL,
  phone TEXT,
  email TEXT,
  address TEXT,
  specialization TEXT,
  experience_years INTEGER,
  salary NUMERIC,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Doctor Applications (public form)
CREATE TABLE IF NOT EXISTS public.doctor_applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  specialization TEXT,
  experience_years INTEGER,
  license_number TEXT,
  clinic_name TEXT,
  clinic_address TEXT,
  message TEXT,
  status TEXT DEFAULT 'pending',
  admin_id UUID,
  admin_message TEXT,
  reviewed_at TIMESTAMPTZ,
  application_hash TEXT,
  request_ip INET DEFAULT '0.0.0.0',
  request_user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Appointment Requests (public form)
CREATE TABLE IF NOT EXISTS public.appointment_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id UUID NOT NULL,
  patient_name TEXT NOT NULL,
  patient_phone TEXT,
  patient_email TEXT,
  patient_address TEXT,
  condition_description TEXT NOT NULL,
  preferred_date DATE NOT NULL,
  preferred_time TEXT NOT NULL,
  status TEXT DEFAULT 'pending',
  rejection_reason TEXT,
  approved_appointment_id UUID,
  verified BOOLEAN DEFAULT false,
  request_ip INET DEFAULT '0.0.0.0',
  request_user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Advanced Tooth Notes
CREATE TABLE IF NOT EXISTS public.advanced_tooth_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID NOT NULL,
  clinic_id UUID NOT NULL,
  tooth_number TEXT NOT NULL,
  numbering_system TEXT DEFAULT 'universal',
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  note_type TEXT DEFAULT 'general',
  diagnosis TEXT,
  treatment_plan TEXT,
  treatment_performed TEXT,
  clinical_findings TEXT,
  radiographic_findings TEXT,
  differential_diagnosis TEXT[],
  symptoms TEXT[],
  status TEXT DEFAULT 'active',
  priority TEXT DEFAULT 'medium',
  severity TEXT DEFAULT 'mild',
  color_code TEXT DEFAULT '#3b82f6',
  tags TEXT[],
  examination_date DATE DEFAULT CURRENT_DATE,
  follow_up_date DATE,
  next_appointment_date DATE,
  treatment_start_date DATE,
  treatment_completion_date DATE,
  treatment_outcome TEXT,
  patient_response TEXT,
  complications TEXT,
  materials_used TEXT[],
  treating_doctor TEXT,
  assisting_staff TEXT[],
  reference_links TEXT[],
  related_notes TEXT[],
  attachments JSONB,
  is_template BOOLEAN DEFAULT false,
  template_id UUID,
  peer_reviewed BOOLEAN DEFAULT false,
  reviewed_by UUID,
  review_date TIMESTAMPTZ,
  review_comments TEXT,
  quality_score INTEGER,
  created_by UUID,
  last_modified_by UUID,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Advanced Note Templates
CREATE TABLE IF NOT EXISTS public.advanced_note_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id UUID NOT NULL,
  created_by UUID NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL,
  title_template TEXT NOT NULL,
  content_template TEXT NOT NULL,
  default_note_type TEXT DEFAULT 'general',
  default_priority TEXT DEFAULT 'medium',
  default_status TEXT DEFAULT 'active',
  required_fields TEXT[],
  optional_fields TEXT[],
  field_validations JSONB DEFAULT '{}',
  is_active BOOLEAN DEFAULT true,
  is_public BOOLEAN DEFAULT false,
  usage_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Clinical Attachments
CREATE TABLE IF NOT EXISTS public.clinical_attachments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  note_id UUID NOT NULL REFERENCES public.advanced_tooth_notes(id) ON DELETE CASCADE,
  clinic_id UUID NOT NULL,
  file_name TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_type TEXT NOT NULL,
  file_size INTEGER,
  category TEXT,
  description TEXT,
  uploaded_by UUID NOT NULL,
  uploaded_at TIMESTAMPTZ DEFAULT now()
);

-- Medical Conditions
CREATE TABLE IF NOT EXISTS public.medical_conditions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id UUID NOT NULL REFERENCES public.profiles(id),
  name TEXT NOT NULL,
  description TEXT,
  category TEXT,
  severity_level TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- AI Analysis Results
CREATE TABLE IF NOT EXISTS public.ai_analysis_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  image_id UUID NOT NULL REFERENCES public.medical_images(id),
  clinic_id UUID NOT NULL,
  analysis_type TEXT NOT NULL,
  ai_model TEXT NOT NULL,
  confidence_score NUMERIC,
  analysis_data JSONB,
  detected_conditions JSONB,
  recommendations JSONB,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Dental 3D Models
CREATE TABLE IF NOT EXISTS public.dental_3d_models (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tooth_number TEXT NOT NULL,
  model_name TEXT NOT NULL,
  model_path TEXT NOT NULL,
  model_type TEXT DEFAULT 'standard',
  numbering_system TEXT DEFAULT 'universal',
  file_size INTEGER,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Patient Dental Models
CREATE TABLE IF NOT EXISTS public.patient_dental_models (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID NOT NULL,
  tooth_number TEXT NOT NULL,
  model_path TEXT NOT NULL,
  numbering_system TEXT DEFAULT 'universal',
  modifications JSONB,
  annotations JSONB,
  created_by UUID,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Clinic Specific Permissions
CREATE TABLE IF NOT EXISTS public.clinic_specific_permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id UUID NOT NULL,
  user_id UUID NOT NULL,
  permission_key TEXT NOT NULL,
  permission_category TEXT NOT NULL,
  is_granted BOOLEAN DEFAULT true,
  is_active BOOLEAN DEFAULT true,
  granted_by UUID,
  granted_at TIMESTAMPTZ DEFAULT now(),
  expires_at TIMESTAMPTZ,
  reason TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Plan Features
CREATE TABLE IF NOT EXISTS public.plan_features (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_id UUID REFERENCES public.subscription_plans(id) ON DELETE CASCADE NOT NULL,
  feature_key TEXT NOT NULL,
  is_enabled BOOLEAN DEFAULT true,
  custom_limit INTEGER,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Plan Permissions
CREATE TABLE IF NOT EXISTS public.plan_permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_id UUID REFERENCES public.subscription_plans(id) ON DELETE CASCADE NOT NULL,
  permission_key TEXT NOT NULL,
  is_enabled BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Clinic Subscription Usage
CREATE TABLE IF NOT EXISTS public.clinic_subscription_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id UUID NOT NULL,
  metric_type TEXT NOT NULL,
  current_count INTEGER DEFAULT 0,
  max_count INTEGER NOT NULL,
  last_reset_date DATE,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ==================== ENABLE RLS ON ALL TABLES ====================
DO $$ 
DECLARE
  tbl RECORD;
BEGIN
  FOR tbl IN 
    SELECT tablename FROM pg_tables WHERE schemaname = 'public'
  LOOP
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', tbl.tablename);
  END LOOP;
END $$;

-- ==================== PRINT SUCCESS ====================
DO $$ BEGIN RAISE NOTICE '✅ Database schema created successfully!'; END $$;
