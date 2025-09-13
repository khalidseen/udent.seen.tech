-- Enable managing clinic_role_hierarchy by super admins (and admins)
ALTER TABLE public.clinic_role_hierarchy ENABLE ROW LEVEL SECURITY;

-- Allow SELECT already exists; add manage policies
DROP POLICY IF EXISTS "Super admins manage role hierarchy" ON public.clinic_role_hierarchy;
CREATE POLICY "Super admins manage role hierarchy"
ON public.clinic_role_hierarchy
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.user_id = auth.uid() AND p.role = 'admin'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.user_id = auth.uid() AND p.role = 'admin'
  )
);

-- Keep public read policy if not present
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'clinic_role_hierarchy' AND policyname = 'Everyone can view role hierarchy'
  ) THEN
    CREATE POLICY "Everyone can view role hierarchy"
    ON public.clinic_role_hierarchy
    FOR SELECT
    USING (true);
  END IF;
END $$;
