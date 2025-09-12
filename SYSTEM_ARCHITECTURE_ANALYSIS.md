# 🏥 تحليل نظام Udent الطبي - دليل التطوير والتحسين الشامل

## 📋 معلومات عامة

**النظام:** Udent - نظام إدارة العيادات الطبية والأسنان  
**النوع:** تطبيق ويب متقدم  
**التاريخ:** سبتمبر 2025  
**الحالة:** قيد التطوير المتقدم  

---

## 🏗️ البنية التقنية الحالية

### Frontend Stack المكتشف

```json
{
  "framework": "React 19.1.1",
  "bundler": "Vite 5.4.1",
  "language": "TypeScript 5.5.3",
  "ui_library": "Radix UI + shadcn/ui",
  "styling": "Tailwind CSS 3.4.11",
  "state_management": "Zustand 5.0.8",
  "routing": "React Router DOM 6.26.2",
  "data_fetching": "TanStack Query 5.56.2",
  "forms": "React Hook Form 7.53.0",
  "validation": "Zod 3.23.8",
  "charts": "Chart.js 4.5.0 + Recharts 2.12.7",
  "3d_graphics": "Three.js 0.160.1 + React Three Fiber",
  "offline_support": "IndexedDB (idb 8.0.3)",
  "pwa": "Vite PWA Plugin 1.0.3"
}
```

### Backend/Database Integration

```json
{
  "database": "Supabase 2.53.0",
  "authentication": "Supabase Auth",
  "real_time": "Supabase Realtime",
  "file_storage": "Supabase Storage"
}
```

---

## 🎯 ميزات النظام المكتشفة

### 1. إدارة المرضى والمواعيد
- ✅ سجلات المرضى الشاملة
- ✅ نظام حجز المواعيد المتقدم
- ✅ الحجز العام (Public Booking)
- ✅ طلبات المواعيد (Appointment Requests)

### 2. النظام الطبي
- ✅ السجلات الطبية (Medical Records)
- ✅ الأدوية والوصفات (Medications & Prescriptions)
- ✅ العلاجات المتقدمة (Treatments)
- ✅ التشخيص الذكي (Smart Diagnosis)
- ✅ رؤى الذكاء الاصطناعي (AI Insights)

### 3. طب الأسنان المتقدم
- ✅ نماذج الأسنان ثلاثية الأبعاد (3D Dental Models)
- ✅ محرر الأسنان المتقدم (Advanced Tooth Editor)
- ✅ إدارة نماذج الأسنان (Dental Models Admin)
- ✅ علاجات الأسنان (Dental Treatments)

### 4. إدارة الطاقم الطبي
- ✅ إدارة الأطباء (Doctors)
- ✅ مساعدو الأطباء (Doctor Assistants)
- ✅ السكرتارية (Secretaries)
- ✅ طلبات الأطباء (Doctor Applications)

### 5. الإدارة المالية
- ✅ الفواتير (Invoices)
- ✅ المدفوعات (Payments)
- ✅ أسعار الخدمات (Service Prices)

### 6. إدارة المخزون
- ✅ المخزون (Inventory)
- ✅ أوامر الشراء (Purchase Orders)
- ✅ حركات المخزون (Stock Movements)

### 7. النظام الإداري
- ✅ التقارير (Reports)
- ✅ الإشعارات (Notifications)
- ✅ قوالب الإشعارات (Notification Templates)
- ✅ الإعدادات المتقدمة (Settings)

---

## 🔐 تحليل نظام الصلاحيات الحالي

### الأدوار المكتشفة
```typescript
enum UserRole {
  SUPER_ADMIN = 'super_admin',
  ADMIN = 'admin',
  DOCTOR = 'doctor',
  ASSISTANT = 'assistant',
  SECRETARY = 'secretary',
  PATIENT = 'patient'
}
```

### مستويات الوصول
```typescript
const PERMISSION_LEVELS = {
  // إدارة عليا
  SUPER_ADMIN: {
    scope: 'global',
    permissions: ['*'], // جميع الصلاحيات
    restrictions: []
  },
  
  // إداري
  ADMIN: {
    scope: 'clinic',
    permissions: [
      'manage_users',
      'view_reports',
      'manage_settings',
      'manage_inventory',
      'manage_finances'
    ],
    restrictions: ['super_admin_functions']
  },
  
  // طبيب
  DOCTOR: {
    scope: 'medical',
    permissions: [
      'view_patients',
      'manage_appointments',
      'create_prescriptions',
      'update_medical_records',
      'use_ai_diagnosis',
      'manage_treatments'
    ],
    restrictions: ['admin_functions', 'other_doctor_data']
  },
  
  // مساعد طبيب
  ASSISTANT: {
    scope: 'limited_medical',
    permissions: [
      'view_assigned_patients',
      'schedule_appointments',
      'update_basic_records'
    ],
    restrictions: ['prescriptions', 'diagnosis', 'financial_data']
  },
  
  // سكرتير
  SECRETARY: {
    scope: 'administrative',
    permissions: [
      'manage_appointments',
      'view_patient_list',
      'handle_communications',
      'basic_reports'
    ],
    restrictions: ['medical_records', 'financial_data', 'system_settings']
  },
  
  // مريض
  PATIENT: {
    scope: 'personal',
    permissions: [
      'view_own_records',
      'book_appointments',
      'view_own_invoices',
      'update_personal_info'
    ],
    restrictions: ['all_other_data']
  }
};
```

---

## 🛡️ تحليل الأمان الحالي

### نقاط القوة
- ✅ استخدام Supabase للمصادقة الآمنة
- ✅ Row Level Security (RLS) في قاعدة البيانات
- ✅ Context-based permissions
- ✅ TypeScript لتحسين الأمان

### نقاط التحسين المطلوبة
- 🔸 إضافة Two-Factor Authentication (2FA)
- 🔸 تشفير البيانات الحساسة
- 🔸 Session management محسن
- 🔸 Rate limiting للحماية من الهجمات
- 🔸 Audit logging للعمليات الحساسة

---

## 📊 تحليل قاعدة البيانات المقترحة

### البنية المحسنة لقاعدة البيانات

```sql
-- =======================
-- جداول المستخدمين والأمان
-- =======================

-- المستخدمين الأساسي
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    phone VARCHAR(20) UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    role user_role NOT NULL DEFAULT 'patient',
    status user_status NOT NULL DEFAULT 'active',
    email_verified BOOLEAN DEFAULT FALSE,
    phone_verified BOOLEAN DEFAULT FALSE,
    two_factor_enabled BOOLEAN DEFAULT FALSE,
    two_factor_secret VARCHAR(255),
    last_login TIMESTAMPTZ,
    failed_login_attempts INTEGER DEFAULT 0,
    locked_until TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID REFERENCES users(id),
    clinic_id UUID REFERENCES clinics(id)
);

-- الملفات الشخصية
CREATE TABLE user_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    middle_name VARCHAR(100),
    date_of_birth DATE,
    gender gender_type,
    nationality VARCHAR(100),
    id_number VARCHAR(50) UNIQUE,
    avatar_url TEXT,
    address JSONB,
    emergency_contact JSONB,
    preferred_language VARCHAR(10) DEFAULT 'ar',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- العيادات
CREATE TABLE clinics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(200) NOT NULL,
    description TEXT,
    license_number VARCHAR(100) UNIQUE,
    specializations TEXT[],
    contact_info JSONB NOT NULL,
    address JSONB NOT NULL,
    working_hours JSONB,
    settings JSONB DEFAULT '{}',
    subscription_plan subscription_plan_type DEFAULT 'basic',
    subscription_expires_at TIMESTAMPTZ,
    status clinic_status DEFAULT 'active',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =======================
-- جداول الطاقم الطبي
-- =======================

-- الأطباء
CREATE TABLE doctors (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    clinic_id UUID NOT NULL REFERENCES clinics(id),
    license_number VARCHAR(100) UNIQUE NOT NULL,
    specializations TEXT[] NOT NULL,
    qualification JSONB,
    experience_years INTEGER,
    consultation_fee DECIMAL(10,2),
    commission_rate DECIMAL(5,2),
    working_hours JSONB,
    bio TEXT,
    languages TEXT[],
    status doctor_status DEFAULT 'active',
    verified_at TIMESTAMPTZ,
    verified_by UUID REFERENCES users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- مساعدو الأطباء
CREATE TABLE assistants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    clinic_id UUID NOT NULL REFERENCES clinics(id),
    supervising_doctor_id UUID REFERENCES doctors(id),
    certification_level VARCHAR(100),
    permissions JSONB DEFAULT '{}',
    working_hours JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- السكرتارية
CREATE TABLE secretaries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    clinic_id UUID NOT NULL REFERENCES clinics(id),
    department VARCHAR(100),
    access_level INTEGER DEFAULT 1,
    working_hours JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =======================
-- جداول المرضى
-- =======================

-- المرضى
CREATE TABLE patients (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    clinic_id UUID NOT NULL REFERENCES clinics(id),
    patient_number VARCHAR(50) UNIQUE NOT NULL,
    medical_history JSONB DEFAULT '{}',
    allergies TEXT[],
    chronic_diseases TEXT[],
    medications TEXT[],
    insurance_info JSONB,
    emergency_contact JSONB,
    privacy_settings JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- للمرضى بدون حساب (walk-in patients)
    guest_name VARCHAR(200),
    guest_phone VARCHAR(20),
    guest_email VARCHAR(255),
    is_guest BOOLEAN DEFAULT FALSE
);

-- =======================
-- نظام المواعيد
-- =======================

-- المواعيد
CREATE TABLE appointments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id UUID NOT NULL REFERENCES patients(id),
    doctor_id UUID NOT NULL REFERENCES doctors(id),
    clinic_id UUID NOT NULL REFERENCES clinics(id),
    appointment_type appointment_type_enum NOT NULL,
    status appointment_status DEFAULT 'scheduled',
    priority appointment_priority DEFAULT 'normal',
    scheduled_at TIMESTAMPTZ NOT NULL,
    duration_minutes INTEGER DEFAULT 30,
    chief_complaint TEXT,
    notes TEXT,
    room_number VARCHAR(20),
    reminder_sent BOOLEAN DEFAULT FALSE,
    no_show BOOLEAN DEFAULT FALSE,
    cancellation_reason TEXT,
    cancelled_at TIMESTAMPTZ,
    cancelled_by UUID REFERENCES users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID REFERENCES users(id)
);

-- طلبات المواعيد
CREATE TABLE appointment_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id UUID REFERENCES patients(id),
    doctor_id UUID REFERENCES doctors(id),
    clinic_id UUID NOT NULL REFERENCES clinics(id),
    preferred_date DATE,
    preferred_time TIME,
    chief_complaint TEXT,
    urgency urgency_level DEFAULT 'normal',
    status request_status DEFAULT 'pending',
    processed_by UUID REFERENCES users(id),
    processed_at TIMESTAMPTZ,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- للطلبات من المرضى الضيوف
    guest_name VARCHAR(200),
    guest_phone VARCHAR(20),
    guest_email VARCHAR(255),
    is_guest BOOLEAN DEFAULT FALSE
);

-- =======================
-- السجلات الطبية
-- =======================

-- السجلات الطبية
CREATE TABLE medical_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id UUID NOT NULL REFERENCES patients(id),
    doctor_id UUID NOT NULL REFERENCES doctors(id),
    appointment_id UUID REFERENCES appointments(id),
    clinic_id UUID NOT NULL REFERENCES clinics(id),
    visit_date TIMESTAMPTZ NOT NULL,
    chief_complaint TEXT,
    history_of_present_illness TEXT,
    examination_findings JSONB,
    vital_signs JSONB,
    diagnosis JSONB,
    treatment_plan JSONB,
    follow_up_instructions TEXT,
    notes TEXT,
    attachments JSONB DEFAULT '[]',
    is_confidential BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- الأدوية
CREATE TABLE medications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(200) NOT NULL,
    generic_name VARCHAR(200),
    brand_names TEXT[],
    dosage_forms TEXT[],
    strengths TEXT[],
    category medication_category,
    description TEXT,
    side_effects TEXT[],
    contraindications TEXT[],
    interactions TEXT[],
    pregnancy_category VARCHAR(10),
    storage_conditions TEXT,
    manufacturer VARCHAR(200),
    barcode VARCHAR(100),
    is_prescription_only BOOLEAN DEFAULT TRUE,
    is_controlled BOOLEAN DEFAULT FALSE,
    status medication_status DEFAULT 'active',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- الوصفات الطبية
CREATE TABLE prescriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id UUID NOT NULL REFERENCES patients(id),
    doctor_id UUID NOT NULL REFERENCES doctors(id),
    medical_record_id UUID REFERENCES medical_records(id),
    clinic_id UUID NOT NULL REFERENCES clinics(id),
    prescription_number VARCHAR(50) UNIQUE NOT NULL,
    status prescription_status DEFAULT 'active',
    issued_date DATE NOT NULL,
    expiry_date DATE,
    notes TEXT,
    pharmacy_instructions TEXT,
    is_repeatable BOOLEAN DEFAULT FALSE,
    repeat_count INTEGER DEFAULT 0,
    max_repeats INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- أدوية الوصفة
CREATE TABLE prescription_medications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    prescription_id UUID NOT NULL REFERENCES prescriptions(id) ON DELETE CASCADE,
    medication_id UUID NOT NULL REFERENCES medications(id),
    dosage VARCHAR(100) NOT NULL,
    frequency VARCHAR(100) NOT NULL,
    duration VARCHAR(100),
    quantity INTEGER,
    instructions TEXT,
    substitution_allowed BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =======================
-- طب الأسنان
-- =======================

-- نماذج الأسنان
CREATE TABLE dental_models (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id UUID NOT NULL REFERENCES patients(id),
    doctor_id UUID NOT NULL REFERENCES doctors(id),
    clinic_id UUID NOT NULL REFERENCES clinics(id),
    model_name VARCHAR(200),
    model_type dental_model_type,
    scan_date DATE,
    model_data JSONB NOT NULL, -- بيانات النموذج ثلاثي الأبعاد
    teeth_data JSONB DEFAULT '{}', -- بيانات الأسنان الفردية
    annotations JSONB DEFAULT '[]', -- الملاحظات والتعليقات
    measurements JSONB DEFAULT '{}', -- القياسات
    quality_score DECIMAL(3,2),
    file_urls JSONB DEFAULT '[]', -- ملفات النموذج
    thumbnail_url TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- علاجات الأسنان
CREATE TABLE dental_treatments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id UUID NOT NULL REFERENCES patients(id),
    doctor_id UUID NOT NULL REFERENCES doctors(id),
    dental_model_id UUID REFERENCES dental_models(id),
    clinic_id UUID NOT NULL REFERENCES clinics(id),
    treatment_type dental_treatment_type NOT NULL,
    tooth_numbers INTEGER[],
    status treatment_status DEFAULT 'planned',
    treatment_plan JSONB,
    sessions_planned INTEGER DEFAULT 1,
    sessions_completed INTEGER DEFAULT 0,
    start_date DATE,
    completion_date DATE,
    cost DECIMAL(10,2),
    notes TEXT,
    before_images JSONB DEFAULT '[]',
    after_images JSONB DEFAULT '[]',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =======================
-- النظام المالي
-- =======================

-- الفواتير
CREATE TABLE invoices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id UUID NOT NULL REFERENCES patients(id),
    clinic_id UUID NOT NULL REFERENCES clinics(id),
    invoice_number VARCHAR(50) UNIQUE NOT NULL,
    issue_date DATE NOT NULL,
    due_date DATE,
    status invoice_status DEFAULT 'draft',
    subtotal DECIMAL(10,2) NOT NULL,
    tax_amount DECIMAL(10,2) DEFAULT 0,
    discount_amount DECIMAL(10,2) DEFAULT 0,
    total_amount DECIMAL(10,2) NOT NULL,
    paid_amount DECIMAL(10,2) DEFAULT 0,
    currency VARCHAR(3) DEFAULT 'SAR',
    payment_terms TEXT,
    notes TEXT,
    created_by UUID NOT NULL REFERENCES users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- عناصر الفواتير
CREATE TABLE invoice_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    invoice_id UUID NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
    service_id UUID REFERENCES services(id),
    description TEXT NOT NULL,
    quantity DECIMAL(10,2) DEFAULT 1,
    unit_price DECIMAL(10,2) NOT NULL,
    discount_percentage DECIMAL(5,2) DEFAULT 0,
    tax_percentage DECIMAL(5,2) DEFAULT 0,
    total_amount DECIMAL(10,2) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- المدفوعات
CREATE TABLE payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    invoice_id UUID NOT NULL REFERENCES invoices(id),
    patient_id UUID NOT NULL REFERENCES patients(id),
    clinic_id UUID NOT NULL REFERENCES clinics(id),
    payment_method payment_method_type NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'SAR',
    reference_number VARCHAR(100),
    transaction_id VARCHAR(100),
    gateway_response JSONB,
    status payment_status DEFAULT 'pending',
    processed_at TIMESTAMPTZ,
    notes TEXT,
    created_by UUID NOT NULL REFERENCES users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =======================
-- إدارة المخزون
-- =======================

-- المنتجات والمواد
CREATE TABLE inventory_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    clinic_id UUID NOT NULL REFERENCES clinics(id),
    name VARCHAR(200) NOT NULL,
    description TEXT,
    category item_category,
    sku VARCHAR(100) UNIQUE,
    barcode VARCHAR(100),
    unit_of_measure VARCHAR(50),
    reorder_level INTEGER DEFAULT 0,
    max_stock_level INTEGER,
    cost_price DECIMAL(10,2),
    selling_price DECIMAL(10,2),
    supplier_info JSONB,
    storage_conditions TEXT,
    expiry_tracking BOOLEAN DEFAULT FALSE,
    batch_tracking BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- المخزون الحالي
CREATE TABLE inventory_stock (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    item_id UUID NOT NULL REFERENCES inventory_items(id),
    clinic_id UUID NOT NULL REFERENCES clinics(id),
    batch_number VARCHAR(100),
    expiry_date DATE,
    quantity_available INTEGER NOT NULL DEFAULT 0,
    quantity_reserved INTEGER DEFAULT 0,
    location VARCHAR(100),
    last_counted_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =======================
-- النظام التقني
-- =======================

-- سجل العمليات (Audit Log)
CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id),
    clinic_id UUID REFERENCES clinics(id),
    action audit_action NOT NULL,
    resource_type VARCHAR(100) NOT NULL,
    resource_id UUID,
    old_values JSONB,
    new_values JSONB,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- الإشعارات
CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id),
    clinic_id UUID REFERENCES clinics(id),
    type notification_type NOT NULL,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    data JSONB DEFAULT '{}',
    status notification_status DEFAULT 'unread',
    priority notification_priority DEFAULT 'normal',
    expires_at TIMESTAMPTZ,
    sent_via TEXT[], -- ['email', 'sms', 'push', 'in_app']
    sent_at TIMESTAMPTZ,
    read_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =======================
-- Types and Enums
-- =======================

-- أنواع البيانات المخصصة
CREATE TYPE user_role AS ENUM (
    'super_admin', 'admin', 'doctor', 'assistant', 
    'secretary', 'patient', 'guest'
);

CREATE TYPE user_status AS ENUM (
    'active', 'inactive', 'suspended', 'pending_verification'
);

CREATE TYPE gender_type AS ENUM ('male', 'female', 'other');

CREATE TYPE appointment_type_enum AS ENUM (
    'consultation', 'follow_up', 'procedure', 'surgery', 
    'emergency', 'checkup', 'cleaning', 'orthodontic'
);

CREATE TYPE appointment_status AS ENUM (
    'scheduled', 'confirmed', 'in_progress', 'completed', 
    'cancelled', 'no_show', 'rescheduled'
);

CREATE TYPE appointment_priority AS ENUM (
    'low', 'normal', 'high', 'urgent', 'emergency'
);

-- فهارس للأداء
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_clinic_role ON users(clinic_id, role);
CREATE INDEX idx_appointments_doctor_date ON appointments(doctor_id, scheduled_at);
CREATE INDEX idx_appointments_patient_status ON appointments(patient_id, status);
CREATE INDEX idx_medical_records_patient ON medical_records(patient_id);
CREATE INDEX idx_audit_logs_user_action ON audit_logs(user_id, action);
CREATE INDEX idx_notifications_user_status ON notifications(user_id, status);

-- قواعد Row Level Security
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE patients ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE medical_records ENABLE ROW LEVEL SECURITY;

-- مثال على سياسة RLS للمرضى
CREATE POLICY patients_policy ON patients
    FOR ALL
    USING (
        clinic_id = auth.jwt() ->> 'clinic_id'::text
        AND (
            -- المريض يمكنه رؤية بياناته فقط
            (auth.jwt() ->> 'role' = 'patient' AND user_id = auth.uid())
            OR
            -- الطاقم الطبي يمكنه رؤية جميع المرضى في العيادة
            auth.jwt() ->> 'role' IN ('doctor', 'assistant', 'secretary', 'admin', 'super_admin')
        )
    );
```

---

## 🚀 الهيكل المحسن للتطبيق

### 1. بنية المجلدات المحسنة

```
udent/
├── 📁 apps/                           # التطبيقات
│   ├── 📁 web/                        # تطبيق الويب الرئيسي
│   │   ├── 📁 public/                 # الملفات العامة
│   │   ├── 📁 src/
│   │   │   ├── 📁 app/                # صفحات Next.js
│   │   │   ├── 📁 components/         # المكونات
│   │   │   │   ├── 📁 ui/             # مكونات UI الأساسية
│   │   │   │   ├── 📁 forms/          # مكونات النماذج
│   │   │   │   ├── 📁 layout/         # مكونات التخطيط
│   │   │   │   ├── 📁 medical/        # مكونات طبية
│   │   │   │   ├── 📁 dental/         # مكونات طب الأسنان
│   │   │   │   ├── 📁 financial/      # مكونات مالية
│   │   │   │   └── 📁 admin/          # مكونات إدارية
│   │   │   ├── 📁 hooks/              # React Hooks مخصصة
│   │   │   ├── 📁 lib/                # مكتبات مساعدة
│   │   │   ├── 📁 services/           # خدمات API
│   │   │   ├── 📁 stores/             # إدارة الحالة
│   │   │   ├── 📁 types/              # أنواع TypeScript
│   │   │   ├── 📁 utils/              # وظائف مساعدة
│   │   │   └── 📁 constants/          # الثوابت
│   │   ├── 📄 package.json
│   │   ├── 📄 next.config.js
│   │   └── 📄 tailwind.config.js
│   │
│   ├── 📁 api/                        # API الخلفي
│   │   ├── 📁 src/
│   │   │   ├── 📁 controllers/        # تحكم في المسارات
│   │   │   ├── 📁 services/           # منطق العمل
│   │   │   ├── 📁 repositories/       # طبقة الوصول للبيانات
│   │   │   ├── 📁 middleware/         # Middleware
│   │   │   ├── 📁 routes/             # مسارات API
│   │   │   ├── 📁 models/             # نماذج قاعدة البيانات
│   │   │   ├── 📁 validators/         # التحقق من المدخلات
│   │   │   ├── 📁 utils/              # وظائف مساعدة
│   │   │   └── 📁 types/              # أنواع TypeScript
│   │   └── 📄 package.json
│   │
│   └── 📁 mobile/                     # تطبيق الهاتف (مستقبلي)
│
├── 📁 packages/                       # الحزم المشتركة
│   ├── 📁 ui/                         # مكونات UI مشتركة
│   ├── 📁 config/                     # إعدادات مشتركة
│   ├── 📁 types/                      # أنواع مشتركة
│   ├── 📁 utils/                      # وظائف مساعدة مشتركة
│   ├── 📁 database/                   # قاعدة البيانات
│   └── 📁 eslint-config/              # إعدادات ESLint
│
├── 📁 tools/                          # أدوات التطوير
├── 📁 docs/                           # الوثائق
├── 📁 tests/                          # الاختبارات
├── 📄 package.json                    # Package.json الرئيسي
└── 📄 turbo.json                      # إعدادات Turborepo
```

### 2. تحسينات الأمان المقترحة

```typescript
// packages/auth/src/security.ts

export class SecurityManager {
  // تشفير البيانات الحساسة
  static encryptSensitiveData(data: string): string {
    // تشفير AES-256
    return encrypt(data, process.env.ENCRYPTION_KEY!);
  }

  // التحقق من قوة كلمة المرور
  static validatePasswordStrength(password: string): SecurityValidation {
    const requirements = {
      minLength: 8,
      hasUppercase: /[A-Z]/.test(password),
      hasLowercase: /[a-z]/.test(password),
      hasNumbers: /\d/.test(password),
      hasSpecialChars: /[!@#$%^&*]/.test(password),
      notCommon: !COMMON_PASSWORDS.includes(password.toLowerCase())
    };

    const score = Object.values(requirements).filter(Boolean).length;
    
    return {
      isValid: score >= 5,
      score,
      requirements,
      strength: score < 3 ? 'weak' : score < 5 ? 'medium' : 'strong'
    };
  }

  // Rate limiting
  static createRateLimiter(options: RateLimitOptions) {
    return rateLimit({
      windowMs: options.windowMs,
      max: options.max,
      message: options.message,
      standardHeaders: true,
      legacyHeaders: false,
      store: new RedisStore({
        client: redisClient,
        prefix: 'rate_limit:'
      })
    });
  }

  // التحقق من صحة JWT
  static async verifyToken(token: string): Promise<TokenPayload> {
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET!) as TokenPayload;
      
      // التحقق من انتهاء الصلاحية
      if (decoded.exp < Date.now() / 1000) {
        throw new Error('Token expired');
      }

      // التحقق من قائمة الرموز المرفوضة
      const isBlacklisted = await redis.get(`blacklist:${token}`);
      if (isBlacklisted) {
        throw new Error('Token blacklisted');
      }

      return decoded;
    } catch (error) {
      throw new UnauthorizedError('Invalid token');
    }
  }
}

// نظام Audit Trail محسن
export class AuditLogger {
  static async logAction(action: AuditAction): Promise<void> {
    const logEntry = {
      id: generateId(),
      userId: action.userId,
      clinicId: action.clinicId,
      action: action.type,
      resourceType: action.resourceType,
      resourceId: action.resourceId,
      oldValues: action.oldValues,
      newValues: action.newValues,
      ipAddress: action.ipAddress,
      userAgent: action.userAgent,
      timestamp: new Date(),
      severity: action.severity || 'info'
    };

    // حفظ في قاعدة البيانات
    await db.auditLogs.create(logEntry);

    // إرسال تنبيه للعمليات الحساسة
    if (action.severity === 'critical') {
      await NotificationService.sendSecurityAlert(logEntry);
    }
  }
}
```

### 3. نظام الصلاحيات المتقدم

```typescript
// packages/permissions/src/rbac.ts

export class PermissionManager {
  private static permissions = new Map<string, Permission[]>();

  // تحميل الصلاحيات من قاعدة البيانات
  static async loadPermissions(userId: string): Promise<void> {
    const user = await db.users.findById(userId);
    const role = await db.roles.findByName(user.role);
    
    const permissions = await this.resolvePermissions(role);
    this.permissions.set(userId, permissions);
  }

  // التحقق من الصلاحية
  static async hasPermission(
    userId: string, 
    resource: string, 
    action: string,
    context?: Record<string, any>
  ): Promise<boolean> {
    const userPermissions = this.permissions.get(userId);
    if (!userPermissions) {
      await this.loadPermissions(userId);
      return this.hasPermission(userId, resource, action, context);
    }

    return userPermissions.some(permission => {
      return permission.resource === resource &&
             permission.action === action &&
             this.evaluateConditions(permission.conditions, context);
    });
  }

  // تقييم الشروط
  private static evaluateConditions(
    conditions?: Record<string, any>,
    context?: Record<string, any>
  ): boolean {
    if (!conditions || !context) return true;

    return Object.entries(conditions).every(([key, expectedValue]) => {
      const actualValue = context[key];
      
      if (typeof expectedValue === 'object' && expectedValue.operator) {
        return this.evaluateOperator(actualValue, expectedValue);
      }
      
      return actualValue === expectedValue;
    });
  }

  // تقييم العمليات المنطقية
  private static evaluateOperator(
    actualValue: any, 
    condition: { operator: string; value: any }
  ): boolean {
    switch (condition.operator) {
      case 'eq': return actualValue === condition.value;
      case 'ne': return actualValue !== condition.value;
      case 'gt': return actualValue > condition.value;
      case 'gte': return actualValue >= condition.value;
      case 'lt': return actualValue < condition.value;
      case 'lte': return actualValue <= condition.value;
      case 'in': return condition.value.includes(actualValue);
      case 'nin': return !condition.value.includes(actualValue);
      default: return false;
    }
  }
}

// Middleware للتحقق من الصلاحيات
export const requirePermission = (
  resource: string, 
  action: string,
  contextExtractor?: (req: Request) => Record<string, any>
) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ error: 'Authentication required' });
      }

      const context = contextExtractor ? contextExtractor(req) : {};
      const hasPermission = await PermissionManager.hasPermission(
        userId, 
        resource, 
        action, 
        context
      );

      if (!hasPermission) {
        await AuditLogger.logAction({
          userId,
          type: 'access_denied',
          resourceType: resource,
          resourceId: req.params.id,
          ipAddress: req.ip,
          userAgent: req.get('User-Agent'),
          severity: 'warning'
        });

        return res.status(403).json({ error: 'Insufficient permissions' });
      }

      next();
    } catch (error) {
      next(error);
    }
  };
};
```

### 4. نظام الذكاء الاصطناعي المحسن

```typescript
// packages/ai/src/medical-ai.ts

export class MedicalAIService {
  // تحليل الأعراض وتقديم التشخيص الأولي
  static async analyzSymptoms(symptoms: Symptom[]): Promise<DiagnosisSuggestion[]> {
    const model = await loadModel('medical-diagnosis-v2');
    
    const input = this.preprocessSymptoms(symptoms);
    const prediction = await model.predict(input);
    
    return this.interpretDiagnosisResults(prediction);
  }

  // تحليل الصور الطبية
  static async analyzemedicalImage(
    imageUrl: string, 
    imageType: MedicalImageType
  ): Promise<ImageAnalysisResult> {
    const model = await loadVisionModel(imageType);
    const image = await loadImage(imageUrl);
    
    const analysis = await model.analyze(image);
    
    return {
      findings: analysis.findings,
      confidence: analysis.confidence,
      recommendations: analysis.recommendations,
      criticalFindings: analysis.criticalFindings,
      followUpRequired: analysis.confidence < 0.8 || analysis.criticalFindings.length > 0
    };
  }

  // توصيات العلاج بناءً على التشخيص
  static async generateTreatmentPlan(
    diagnosis: Diagnosis,
    patientHistory: PatientHistory
  ): Promise<TreatmentPlan> {
    const recommendations = await this.queryKnowledgeBase(diagnosis);
    const personalizedPlan = this.personalizeTreatment(recommendations, patientHistory);
    
    return {
      primaryTreatments: personalizedPlan.primary,
      alternativeTreatments: personalizedPlan.alternatives,
      contraindications: personalizedPlan.contraindications,
      monitoringRequirements: personalizedPlan.monitoring,
      expectedOutcome: personalizedPlan.outcome,
      confidence: personalizedPlan.confidence
    };
  }

  // تحليل تفاعلات الأدوية
  static async checkDrugInteractions(medications: Medication[]): Promise<DrugInteractionResult> {
    const interactions = [];
    
    for (let i = 0; i < medications.length; i++) {
      for (let j = i + 1; j < medications.length; j++) {
        const interaction = await this.checkPairwiseInteraction(
          medications[i], 
          medications[j]
        );
        if (interaction.severity !== 'none') {
          interactions.push(interaction);
        }
      }
    }

    return {
      interactions,
      overallRisk: this.calculateOverallRisk(interactions),
      recommendations: this.generateSafetyRecommendations(interactions)
    };
  }
}

// نظام التعلم التدريجي
export class LearningSystem {
  // تحسين النماذج بناءً على ملاحظات الأطباء
  static async updateModelWithFeedback(
    modelId: string,
    prediction: Prediction,
    actualOutcome: Outcome,
    doctorFeedback: DoctorFeedback
  ): Promise<void> {
    const trainingData = {
      input: prediction.input,
      predictedOutput: prediction.output,
      actualOutput: actualOutcome,
      feedback: doctorFeedback,
      timestamp: new Date()
    };

    await this.addToTrainingDataset(modelId, trainingData);
    
    // إعادة تدريب النموذج بشكل دوري
    if (await this.shouldRetrainModel(modelId)) {
      await this.scheduleModelRetraining(modelId);
    }
  }

  // تحليل دقة النماذج
  static async analyzeModelPerformance(modelId: string): Promise<PerformanceMetrics> {
    const predictions = await db.predictions.findByModel(modelId);
    const outcomes = await db.outcomes.findByPredictions(predictions.map(p => p.id));

    return {
      accuracy: this.calculateAccuracy(predictions, outcomes),
      precision: this.calculatePrecision(predictions, outcomes),
      recall: this.calculateRecall(predictions, outcomes),
      f1Score: this.calculateF1Score(predictions, outcomes),
      auc: this.calculateAUC(predictions, outcomes),
      confusionMatrix: this.generateConfusionMatrix(predictions, outcomes)
    };
  }
}
```

### 5. نظام التقارير المتقدم

```typescript
// packages/reports/src/report-generator.ts

export class ReportGenerator {
  // تقرير الأداء الطبي
  static async generateMedicalPerformanceReport(
    clinicId: string,
    dateRange: DateRange,
    filters: ReportFilters
  ): Promise<MedicalPerformanceReport> {
    const data = await this.gatherMedicalData(clinicId, dateRange, filters);
    
    return {
      summary: {
        totalPatients: data.patients.length,
        totalAppointments: data.appointments.length,
        averageWaitTime: this.calculateAverageWaitTime(data.appointments),
        patientSatisfaction: await this.calculatePatientSatisfaction(data.patients),
        treatmentSuccessRate: this.calculateTreatmentSuccessRate(data.treatments)
      },
      departmentMetrics: this.generateDepartmentMetrics(data),
      doctorMetrics: this.generateDoctorMetrics(data),
      financialMetrics: this.generateFinancialMetrics(data),
      charts: this.generateCharts(data),
      recommendations: await this.generateRecommendations(data)
    };
  }

  // تقرير مالي شامل
  static async generateFinancialReport(
    clinicId: string,
    period: ReportPeriod
  ): Promise<FinancialReport> {
    const [revenue, expenses, receivables] = await Promise.all([
      this.getRevenueData(clinicId, period),
      this.getExpenseData(clinicId, period),
      this.getReceivablesData(clinicId, period)
    ]);

    return {
      revenue: {
        total: revenue.total,
        breakdown: revenue.breakdown,
        trends: revenue.trends,
        projections: this.projectRevenue(revenue.historical)
      },
      expenses: {
        total: expenses.total,
        categories: expenses.categories,
        trends: expenses.trends
      },
      profitability: {
        grossProfit: revenue.total - expenses.directCosts,
        netProfit: revenue.total - expenses.total,
        margins: this.calculateMargins(revenue, expenses)
      },
      cashFlow: this.generateCashFlowAnalysis(revenue, expenses, receivables),
      kpis: this.calculateFinancialKPIs(revenue, expenses, receivables)
    };
  }

  // تقرير جودة الرعاية
  static async generateQualityReport(
    clinicId: string,
    dateRange: DateRange
  ): Promise<QualityReport> {
    const qualityMetrics = await this.gatherQualityMetrics(clinicId, dateRange);
    
    return {
      patientSafety: {
        incidentReports: qualityMetrics.incidents,
        infectionRates: qualityMetrics.infections,
        medicationErrors: qualityMetrics.medicationErrors,
        safetyScore: this.calculateSafetyScore(qualityMetrics)
      },
      clinicalOutcomes: {
        treatmentSuccessRates: qualityMetrics.successRates,
        readmissionRates: qualityMetrics.readmissions,
        complicationRates: qualityMetrics.complications,
        mortalityRates: qualityMetrics.mortality
      },
      patientExperience: {
        satisfactionScores: qualityMetrics.satisfaction,
        waitTimes: qualityMetrics.waitTimes,
        complaintResolution: qualityMetrics.complaints,
        recommendationRates: qualityMetrics.recommendations
      },
      staffPerformance: {
        productivityMetrics: qualityMetrics.productivity,
        competencyAssessments: qualityMetrics.competency,
        trainingCompletion: qualityMetrics.training
      },
      accreditationReadiness: this.assessAccreditationReadiness(qualityMetrics)
    };
  }
}

// خدمة التصدير المتقدمة
export class ExportService {
  // تصدير إلى Excel مع تنسيق متقدم
  static async exportToExcel(data: ReportData, template: ExcelTemplate): Promise<Buffer> {
    const workbook = new ExcelJS.Workbook();
    
    // إنشاء ورقات متعددة
    for (const sheet of template.sheets) {
      const worksheet = workbook.addWorksheet(sheet.name);
      
      // تطبيق التنسيق
      this.applyExcelFormatting(worksheet, sheet.formatting);
      
      // إضافة البيانات
      this.populateExcelData(worksheet, data[sheet.dataSource], sheet.mapping);
      
      // إضافة الرسوم البيانية
      if (sheet.charts) {
        await this.addExcelCharts(worksheet, sheet.charts);
      }
    }

    return await workbook.xlsx.writeBuffer();
  }

  // تصدير إلى PDF مع تنسيق طبي
  static async exportToPDF(data: ReportData, template: PDFTemplate): Promise<Buffer> {
    const doc = new PDFDocument({
      size: 'A4',
      margins: { top: 50, left: 50, right: 50, bottom: 50 }
    });

    // إضافة الرأسية الطبية
    this.addMedicalHeader(doc, data.clinic);
    
    // إضافة المحتوى
    for (const section of template.sections) {
      await this.addPDFSection(doc, data[section.dataSource], section);
    }

    // إضافة التوقيع الرقمي
    if (template.requiresSignature) {
      await this.addDigitalSignature(doc, data.signatory);
    }

    return doc;
  }
}
```

---

## 🎯 خطة التنفيذ المرحلية

### المرحلة 1: إعادة هيكلة المشروع (أسبوع 1-2)

```bash
# 1. إعداد Monorepo
npm install -g turbo
npm init

# 2. تكوين Turborepo
echo '{
  "pipeline": {
    "build": {
      "dependsOn": ["^build"],
      "outputs": ["dist/**", ".next/**"]
    },
    "dev": {
      "cache": false
    },
    "lint": {
      "outputs": []
    },
    "test": {
      "dependsOn": ["^build"],
      "outputs": ["coverage/**"]
    }
  }
}' > turbo.json

# 3. إعداد Workspace
echo 'packages:
  - "apps/*"
  - "packages/*"' > pnpm-workspace.yaml
```

### المرحلة 2: تحسين قاعدة البيانات (أسبوع 3)

```sql
-- تنفيذ schema الجديد
-- إضافة فهارس الأداء
-- تطبيق Row Level Security
-- إعداد النسخ الاحتياطي الآلي
```

### المرحلة 3: تطوير نظام الصلاحيات (أسبوع 4)

```typescript
// تطبيق RBAC المتقدم
// نظام Audit Trail
// تحسينات الأمان
```

### المرحلة 4: تحسين الواجهة (أسبوع 5-6)

```typescript
// إعادة تنظيم المكونات
// تحسين الأداء
// تطبيق التصميم الموحد
```

### المرحلة 5: الذكاء الاصطناعي (أسبوع 7-8)

```typescript
// تطوير نماذج التشخيص
// نظام توصيات العلاج
// تحليل الصور الطبية
```

---

## 📊 مؤشرات الأداء الرئيسية (KPIs)

### التقنية
- **وقت الاستجابة:** < 200ms للصفحات العادية
- **التوفر:** 99.9% uptime
- **الأمان:** صفر ثغرات عالية الخطورة
- **جودة الكود:** Grade A في SonarQube

### الطبية
- **دقة التشخيص:** > 90% للحالات البسيطة
- **رضا المرضى:** > 4.5/5
- **كفاءة المواعيد:** 95% punctuality rate
- **سلامة البيانات:** 100% compliance

### المالية
- **عائد الاستثمار:** تحسين 25% في الكفاءة
- **تقليل التكاليف:** 15% توفير في العمليات
- **زيادة الإيرادات:** 20% من خلال التحسينات

---

## 🔮 الرؤية المستقبلية

### السنة الأولى
- ✅ تطبيق النظام الحالي مع التحسينات
- 🎯 دمج الذكاء الاصطناعي الأساسي
- 📱 تطوير تطبيق الهاتف المحمول
- 🌐 دعم متعدد اللغات المتقدم

### السنة الثانية
- 🤖 ذكاء اصطناعي متقدم للتشخيص
- 🔗 تكامل مع الأنظمة الحكومية
- 📈 تحليلات متقدمة وتنبؤات
- 🏥 دعم المستشفيات الكبيرة

### السنة الثالثة
- 🌍 التوسع الإقليمي
- 🔬 دمج أجهزة IoT الطبية
- 🧬 تحليل الجينوم الأساسي
- 🎓 منصة التعليم الطبي المستمر

---

هذا التحليل الشامل يوفر خارطة طريق واضحة لتطوير وتحسين نظام Udent ليصبح من أحدث الأنظمة الطبية في المنطقة.
