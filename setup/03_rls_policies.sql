-- ============================================================
-- UDent Dental System - RLS Policies
-- Run after 02_functions.sql
-- ============================================================

-- Helper: check if user belongs to clinic
CREATE OR REPLACE FUNCTION public.user_belongs_to_clinic(check_clinic_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = 'public'
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles WHERE user_id = auth.uid() AND clinic_id = check_clinic_id
    UNION
    SELECT 1 FROM public.clinic_memberships WHERE user_id = auth.uid() AND clinic_id = check_clinic_id AND is_active = true
  );
$$;

-- ==================== PROFILES ====================
CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT TO authenticated
  USING (user_id = auth.uid());
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE TO authenticated
  USING (user_id = auth.uid());

-- ==================== CLINICS ====================
CREATE POLICY "Users can view their clinics" ON public.clinics FOR SELECT TO authenticated
  USING (id IN (SELECT clinic_id FROM public.get_user_accessible_clinics()));

-- ==================== CLINIC SETTINGS ====================
CREATE POLICY "View settings of accessible clinics" ON public.clinic_settings FOR SELECT TO authenticated
  USING (clinic_id IN (SELECT ac.clinic_id FROM public.get_user_accessible_clinics() ac));
CREATE POLICY "Admin update clinic settings" ON public.clinic_settings FOR UPDATE TO authenticated
  USING (clinic_id IN (SELECT ac.clinic_id FROM public.get_user_accessible_clinics() ac))
  WITH CHECK (clinic_id IN (SELECT ac.clinic_id FROM public.get_user_accessible_clinics() ac));
CREATE POLICY "Admin insert clinic settings" ON public.clinic_settings FOR INSERT TO authenticated
  WITH CHECK (clinic_id IN (SELECT ac.clinic_id FROM public.get_user_accessible_clinics() ac));

-- ==================== CLINIC MEMBERSHIPS ====================
CREATE POLICY "View clinic memberships" ON public.clinic_memberships FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.user_belongs_to_clinic(clinic_id));

-- ==================== PATIENTS ====================
CREATE POLICY "View clinic patients" ON public.patients FOR SELECT TO authenticated
  USING (clinic_id = (SELECT get_user_current_clinic()));
CREATE POLICY "Insert clinic patients" ON public.patients FOR INSERT TO authenticated
  WITH CHECK (clinic_id = (SELECT get_user_current_clinic()));
CREATE POLICY "Update clinic patients" ON public.patients FOR UPDATE TO authenticated
  USING (clinic_id = (SELECT get_user_current_clinic()));
CREATE POLICY "Delete clinic patients" ON public.patients FOR DELETE TO authenticated
  USING (clinic_id = (SELECT get_user_current_clinic()));

-- ==================== APPOINTMENTS ====================
CREATE POLICY "View clinic appointments" ON public.appointments FOR SELECT TO authenticated
  USING (clinic_id = (SELECT get_user_current_clinic()));
CREATE POLICY "Manage clinic appointments" ON public.appointments FOR ALL TO authenticated
  USING (clinic_id = (SELECT get_user_current_clinic()));

-- ==================== DENTAL TREATMENTS ====================
CREATE POLICY "View clinic treatments" ON public.dental_treatments FOR SELECT TO authenticated
  USING (clinic_id = (SELECT get_user_current_clinic()));
CREATE POLICY "Manage clinic treatments" ON public.dental_treatments FOR ALL TO authenticated
  USING (clinic_id = (SELECT get_user_current_clinic()));

-- ==================== INVOICES ====================
CREATE POLICY "View clinic invoices" ON public.invoices FOR SELECT TO authenticated
  USING (clinic_id = (SELECT get_user_current_clinic()));
CREATE POLICY "Manage clinic invoices" ON public.invoices FOR ALL TO authenticated
  USING (clinic_id = (SELECT get_user_current_clinic()));

-- ==================== PAYMENTS ====================
CREATE POLICY "View clinic payments" ON public.payments FOR SELECT TO authenticated
  USING (clinic_id = (SELECT get_user_current_clinic()));
CREATE POLICY "Manage clinic payments" ON public.payments FOR ALL TO authenticated
  USING (clinic_id = (SELECT get_user_current_clinic()));

-- ==================== MEDICAL SUPPLIES ====================
CREATE POLICY "View clinic supplies" ON public.medical_supplies FOR SELECT TO authenticated
  USING (clinic_id = (SELECT get_user_current_clinic()));
CREATE POLICY "Manage clinic supplies" ON public.medical_supplies FOR ALL TO authenticated
  USING (clinic_id = (SELECT get_user_current_clinic()));

-- ==================== MEDICATIONS ====================
CREATE POLICY "View clinic medications" ON public.medications FOR SELECT TO authenticated
  USING (clinic_id = (SELECT get_user_current_clinic()));
CREATE POLICY "Manage clinic medications" ON public.medications FOR ALL TO authenticated
  USING (clinic_id = (SELECT get_user_current_clinic()));

-- ==================== NOTIFICATIONS ====================
CREATE POLICY "View clinic notifications" ON public.notifications FOR SELECT TO authenticated
  USING (clinic_id = (SELECT get_user_current_clinic()));
CREATE POLICY "Manage clinic notifications" ON public.notifications FOR ALL TO authenticated
  USING (clinic_id = (SELECT get_user_current_clinic()));

-- ==================== MEDICAL RECORDS ====================
CREATE POLICY "View clinic records" ON public.medical_records FOR SELECT TO authenticated
  USING (clinic_id = (SELECT get_user_current_clinic()));
CREATE POLICY "Manage clinic records" ON public.medical_records FOR ALL TO authenticated
  USING (clinic_id = (SELECT get_user_current_clinic()));

-- ==================== MEDICAL IMAGES ====================
CREATE POLICY "View clinic images" ON public.medical_images FOR SELECT TO authenticated
  USING (clinic_id = (SELECT get_user_current_clinic()));
CREATE POLICY "Manage clinic images" ON public.medical_images FOR ALL TO authenticated
  USING (clinic_id = (SELECT get_user_current_clinic()));

-- ==================== API KEYS ====================
CREATE POLICY "View clinic API keys" ON public.api_keys FOR SELECT TO authenticated
  USING (clinic_id IN (SELECT ac.clinic_id FROM public.get_user_accessible_clinics() ac));
CREATE POLICY "Manage clinic API keys" ON public.api_keys FOR ALL TO authenticated
  USING (clinic_id IN (SELECT ac.clinic_id FROM public.get_user_accessible_clinics() ac));

-- ==================== DOCTORS ====================
CREATE POLICY "View clinic doctors" ON public.doctors FOR SELECT TO authenticated
  USING (clinic_id = (SELECT get_user_current_clinic())::TEXT OR clinic_id::TEXT = (SELECT get_user_current_clinic())::TEXT);
CREATE POLICY "Manage clinic doctors" ON public.doctors FOR ALL TO authenticated
  USING (true);

-- ==================== PUBLIC TABLES (no auth required) ====================
CREATE POLICY "Anyone can insert doctor applications" ON public.doctor_applications FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can view own applications" ON public.doctor_applications FOR SELECT USING (true);

CREATE POLICY "Anyone can insert appointment requests" ON public.appointment_requests FOR INSERT WITH CHECK (true);
CREATE POLICY "Clinic can view requests" ON public.appointment_requests FOR SELECT TO authenticated
  USING (clinic_id IN (SELECT ac.clinic_id FROM public.get_user_accessible_clinics() ac));

-- ==================== PERMISSIONS TABLES ====================
CREATE POLICY "Authenticated can view roles" ON public.user_roles FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated can view permissions" ON public.permissions FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated can view role_permissions" ON public.role_permissions FOR SELECT TO authenticated USING (true);

DO $$ BEGIN RAISE NOTICE '✅ RLS Policies created successfully!'; END $$;
