-- حذف جميع السياسات الموجودة حالياً
DROP POLICY IF EXISTS "Super admins can do everything with dental models" ON public.dental_3d_models;
DROP POLICY IF EXISTS "Authenticated users can view default dental models" ON public.dental_3d_models;
DROP POLICY IF EXISTS "Admins can manage default dental models" ON public.dental_3d_models;
DROP POLICY IF EXISTS "Everyone can view default dental models" ON public.dental_3d_models;

-- إنشاء سياسة جديدة مبسطة للمديرين
CREATE POLICY "Enable all operations for super admins"
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

-- سياسة عرض النماذج الافتراضية للجميع
CREATE POLICY "Enable select for all users on default models"
  ON public.dental_3d_models
  FOR SELECT
  USING (model_type = 'default');