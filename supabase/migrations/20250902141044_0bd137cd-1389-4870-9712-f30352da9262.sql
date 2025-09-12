-- حذف جميع السياسات الحالية
DROP POLICY IF EXISTS "Super admins can do everything with dental models" ON public.dental_3d_models;
DROP POLICY IF EXISTS "Authenticated users can view default dental models" ON public.dental_3d_models;

-- إنشاء سياسة بسيطة جداً للسماح بكل شيء مؤقتاً
CREATE POLICY "Allow everything for authenticated users on dental models"
  ON public.dental_3d_models
  FOR ALL
  USING (auth.uid() IS NOT NULL)
  WITH CHECK (auth.uid() IS NOT NULL);