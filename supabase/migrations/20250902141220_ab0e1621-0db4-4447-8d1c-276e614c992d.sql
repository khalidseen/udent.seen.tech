-- حذف جميع السياسات تماماً
DO $$
DECLARE
    policy_record RECORD;
BEGIN
    FOR policy_record IN
        SELECT policyname FROM pg_policies 
        WHERE schemaname = 'public' AND tablename = 'dental_3d_models'
    LOOP
        EXECUTE 'DROP POLICY IF EXISTS "' || policy_record.policyname || '" ON public.dental_3d_models';
    END LOOP;
END $$;

-- إنشاء سياسة واحدة بسيطة جداً للمديرين العامين
CREATE POLICY "dental_models_super_admin_access_2025"
  ON public.dental_3d_models
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE user_id = auth.uid() 
      AND role = 'super_admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE user_id = auth.uid() 
      AND role = 'super_admin'
    )
  );