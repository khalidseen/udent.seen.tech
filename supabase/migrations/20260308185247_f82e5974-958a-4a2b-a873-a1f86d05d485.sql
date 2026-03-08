
-- Insurance Companies
CREATE TABLE public.insurance_companies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id UUID NOT NULL,
  name TEXT NOT NULL,
  name_ar TEXT,
  phone TEXT,
  email TEXT,
  address TEXT,
  contact_person TEXT,
  contract_number TEXT,
  contract_start_date DATE,
  contract_end_date DATE,
  default_coverage_percentage NUMERIC(5,2) DEFAULT 0,
  max_coverage_amount NUMERIC(12,2),
  notes TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Patient Insurance (linking patients to insurance companies)
CREATE TABLE public.patient_insurance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id UUID NOT NULL,
  patient_id UUID NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
  insurance_company_id UUID NOT NULL REFERENCES public.insurance_companies(id) ON DELETE CASCADE,
  policy_number TEXT NOT NULL,
  member_id TEXT,
  coverage_percentage NUMERIC(5,2) DEFAULT 0,
  max_annual_coverage NUMERIC(12,2),
  used_coverage NUMERIC(12,2) DEFAULT 0,
  coverage_start_date DATE,
  coverage_end_date DATE,
  is_primary BOOLEAN DEFAULT true,
  is_active BOOLEAN DEFAULT true,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Insurance Claims
CREATE TABLE public.insurance_claims (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id UUID NOT NULL,
  patient_id UUID NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
  patient_insurance_id UUID NOT NULL REFERENCES public.patient_insurance(id) ON DELETE CASCADE,
  invoice_id UUID REFERENCES public.invoices(id),
  claim_number TEXT NOT NULL,
  claim_date DATE DEFAULT CURRENT_DATE,
  service_date DATE,
  treatment_description TEXT,
  total_amount NUMERIC(12,2) NOT NULL DEFAULT 0,
  covered_amount NUMERIC(12,2) NOT NULL DEFAULT 0,
  patient_share NUMERIC(12,2) NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'submitted', 'approved', 'partially_approved', 'rejected', 'paid')),
  rejection_reason TEXT,
  approval_date DATE,
  payment_date DATE,
  payment_reference TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- RLS
ALTER TABLE public.insurance_companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.patient_insurance ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.insurance_claims ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their clinic insurance companies"
  ON public.insurance_companies FOR ALL TO authenticated
  USING (clinic_id = (SELECT id FROM public.profiles WHERE user_id = auth.uid() LIMIT 1))
  WITH CHECK (clinic_id = (SELECT id FROM public.profiles WHERE user_id = auth.uid() LIMIT 1));

CREATE POLICY "Users can manage their clinic patient insurance"
  ON public.patient_insurance FOR ALL TO authenticated
  USING (clinic_id = (SELECT id FROM public.profiles WHERE user_id = auth.uid() LIMIT 1))
  WITH CHECK (clinic_id = (SELECT id FROM public.profiles WHERE user_id = auth.uid() LIMIT 1));

CREATE POLICY "Users can manage their clinic insurance claims"
  ON public.insurance_claims FOR ALL TO authenticated
  USING (clinic_id = (SELECT id FROM public.profiles WHERE user_id = auth.uid() LIMIT 1))
  WITH CHECK (clinic_id = (SELECT id FROM public.profiles WHERE user_id = auth.uid() LIMIT 1));

-- Indexes
CREATE INDEX idx_insurance_companies_clinic ON public.insurance_companies(clinic_id);
CREATE INDEX idx_patient_insurance_patient ON public.patient_insurance(patient_id);
CREATE INDEX idx_patient_insurance_company ON public.patient_insurance(insurance_company_id);
CREATE INDEX idx_insurance_claims_patient ON public.insurance_claims(patient_id);
CREATE INDEX idx_insurance_claims_status ON public.insurance_claims(status);
CREATE INDEX idx_insurance_claims_clinic ON public.insurance_claims(clinic_id);
