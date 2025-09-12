-- إزالة جميع السياسات الموجودة من clinic_memberships
DROP POLICY IF EXISTS "Enhanced clinic membership management" ON public.clinic_memberships;
DROP POLICY IF EXISTS "Users can manage clinic members based on hierarchy" ON public.clinic_memberships;
DROP POLICY IF EXISTS "Users can view clinic memberships" ON public.clinic_memberships;

-- إزالة جميع السياسات الموجودة من clinics
DROP POLICY IF EXISTS "Super admins can manage all clinics" ON public.clinics;
DROP POLICY IF EXISTS "Super admins have full access to all clinics" ON public.clinics;
DROP POLICY IF EXISTS "Users can create clinics" ON public.clinics;
DROP POLICY IF EXISTS "Users can view accessible clinics" ON public.clinics;
DROP POLICY IF EXISTS "Users can view their accessible clinics after creation" ON public.clinics;
DROP POLICY IF EXISTS "Users can view their clinic" ON public.clinics;

-- إنشاء سياسات بسيطة لجدول clinics بدون تداخل أو recursion
CREATE POLICY "Super admins full access" 
ON public.clinics 
FOR ALL 
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles p
    WHERE p.user_id = auth.uid() 
    AND p.role = 'admin'
  )
);

CREATE POLICY "Users can manage own clinics" 
ON public.clinics 
FOR ALL 
TO authenticated
USING (
  id = (SELECT clinic_id FROM profiles WHERE user_id = auth.uid())
);

CREATE POLICY "Allow users to create clinics" 
ON public.clinics 
FOR INSERT 
TO authenticated
WITH CHECK (true);

-- إنشاء سياسات بسيطة لجدول clinic_memberships بدون recursion
CREATE POLICY "Super admins manage all memberships" 
ON public.clinic_memberships 
FOR ALL 
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles p
    WHERE p.user_id = auth.uid() 
    AND p.role = 'admin'
  )
);

CREATE POLICY "Users manage own clinic memberships" 
ON public.clinic_memberships 
FOR ALL 
TO authenticated
USING (
  clinic_id = (SELECT clinic_id FROM profiles WHERE user_id = auth.uid())
  OR user_id = auth.uid()
);