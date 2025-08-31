-- إزالة السياسات المتداخلة التي تسبب infinite recursion
DROP POLICY IF EXISTS "Enhanced clinic membership management" ON public.clinic_memberships;
DROP POLICY IF EXISTS "Users can manage clinic members based on hierarchy" ON public.clinic_memberships;
DROP POLICY IF EXISTS "Users can view clinic memberships" ON public.clinic_memberships;

-- إنشاء سياسات جديدة بسيطة وآمنة لتجنب infinite recursion
CREATE POLICY "Super admins can manage all clinic memberships" 
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

CREATE POLICY "Clinic owners can manage memberships in their clinics" 
ON public.clinic_memberships 
FOR ALL 
TO authenticated
USING (
  clinic_id IN (
    SELECT c.id FROM clinics c
    JOIN profiles p ON p.clinic_id = c.id
    WHERE p.user_id = auth.uid()
  )
  OR
  user_id = auth.uid()
);

-- إزالة السياسات المعقدة في جدول clinics أيضاً
DROP POLICY IF EXISTS "Super admins have full access to all clinics" ON public.clinics;
DROP POLICY IF EXISTS "Users can view accessible clinics" ON public.clinics;
DROP POLICY IF EXISTS "Users can view their accessible clinics after creation" ON public.clinics;
DROP POLICY IF EXISTS "Users can view their clinic" ON public.clinics;

-- إنشاء سياسات بسيطة لجدول clinics
CREATE POLICY "Super admins can manage all clinics" 
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

CREATE POLICY "Users can view and manage their clinics" 
ON public.clinics 
FOR ALL 
TO authenticated
USING (
  id IN (
    SELECT p.clinic_id FROM profiles p
    WHERE p.user_id = auth.uid()
    AND p.clinic_id IS NOT NULL
  )
);