-- إنشاء سياسة شاملة للمدراء
CREATE POLICY "Super admins have full storage access"
  ON storage.objects
  FOR ALL
  USING (
    bucket_id = 'dental-3d-models'
    AND EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.user_id = auth.uid() 
      AND profiles.role = 'admin'
    )
  );

-- إنشاء سياسة بديلة للمصادقة العامة
CREATE POLICY "Allow all authenticated users for dental models"
  ON storage.objects
  FOR ALL
  USING (
    bucket_id = 'dental-3d-models'
    AND auth.uid() IS NOT NULL
  );