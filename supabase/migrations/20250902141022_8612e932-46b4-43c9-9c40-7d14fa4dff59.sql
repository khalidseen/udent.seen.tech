-- حذف السياسات الحالية لجدول dental_3d_models
DROP POLICY IF EXISTS "Admins can manage default dental models" ON public.dental_3d_models;
DROP POLICY IF EXISTS "Everyone can view default dental models" ON public.dental_3d_models;

-- إنشاء سياسات مبسطة للجدول
CREATE POLICY "Super admins can do everything with dental models"
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

-- السماح لجميع المستخدمين المصادق عليهم بعرض النماذج الافتراضية
CREATE POLICY "Authenticated users can view default dental models"
  ON public.dental_3d_models
  FOR SELECT
  USING (model_type = 'default');