-- Ensure consistent super admin detection via a SECURITY DEFINER function
CREATE OR REPLACE FUNCTION public.is_super_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT (
    -- Primary role on profile
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.user_id = auth.uid() AND p.role = 'super_admin'
    )
    OR
    -- Additional roles via assignments (bypass RLS via SECURITY DEFINER)
    EXISTS (
      SELECT 1
      FROM public.user_role_assignments ura
      JOIN public.user_roles ur ON ura.role_id = ur.id
      WHERE ura.user_id = auth.uid()
        AND ura.is_active = true
        AND (ura.expires_at IS NULL OR ura.expires_at > now())
        AND ur.is_active = true
        AND ur.role_name = 'super_admin'
    )
  );
$$;

-- Align patients policies with super admin role and avoid mismatches
-- Drop previously created policies that referenced 'admin' as super admin
DROP POLICY IF EXISTS "Super admins can view all patients" ON public.patients;
DROP POLICY IF EXISTS "Super admins can create patients for any clinic" ON public.patients;
DROP POLICY IF EXISTS "Super admins can update all patients" ON public.patients;
DROP POLICY IF EXISTS "Super admins can delete all patients" ON public.patients;
DROP POLICY IF EXISTS "Users can view their clinic patients" ON public.patients;
DROP POLICY IF EXISTS "Users can create patients for their clinic" ON public.patients;
DROP POLICY IF EXISTS "Users can update their clinic patients" ON public.patients;
DROP POLICY IF EXISTS "Users can delete their clinic patients" ON public.patients;

-- Recreate correct patients policies
CREATE POLICY "Users can view their clinic patients"
ON public.patients
FOR SELECT
USING (
  clinic_id = (
    SELECT clinic_id FROM public.profiles WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Super admins can view all patients"
ON public.patients
FOR SELECT
USING (public.is_super_admin());

CREATE POLICY "Users can create patients for their clinic"
ON public.patients
FOR INSERT
WITH CHECK (
  clinic_id = (
    SELECT clinic_id FROM public.profiles WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Super admins can create patients for any clinic"
ON public.patients
FOR INSERT
WITH CHECK (public.is_super_admin());

CREATE POLICY "Users can update their clinic patients"
ON public.patients
FOR UPDATE
USING (
  clinic_id = (
    SELECT clinic_id FROM public.profiles WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Super admins can update all patients"
ON public.patients
FOR UPDATE
USING (public.is_super_admin());

CREATE POLICY "Users can delete their clinic patients"
ON public.patients
FOR DELETE
USING (
  clinic_id = (
    SELECT clinic_id FROM public.profiles WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Super admins can delete all patients"
ON public.patients
FOR DELETE
USING (public.is_super_admin());

-- Ensure super admins can view all profiles (users)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Keep existing self-access; add if missing (id here is clinic id; user_id is the auth mapping)
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'profiles' AND policyname = 'Users can view their own profile'
  ) THEN
    CREATE POLICY "Users can view their own profile"
    ON public.profiles
    FOR SELECT
    USING (user_id = auth.uid());
  END IF;
END $$;

-- Add super admin full read access to profiles
DROP POLICY IF EXISTS "Super admins can view all profiles" ON public.profiles;
CREATE POLICY "Super admins can view all profiles"
ON public.profiles
FOR SELECT
USING (public.is_super_admin());