-- إصلاح سياسات التخزين لإعطاء صلاحيات كاملة للمدراء

-- حذف السياسات الحالية للتحديث
DROP POLICY IF EXISTS "Authenticated users can upload default models" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can update default models" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can delete default models" ON storage.objects;

-- إنشاء سياسات جديدة تعطي صلاحيات كاملة للمدراء
CREATE POLICY "Admins and authenticated users can upload default models"
  ON storage.objects
  FOR INSERT
  WITH CHECK (
    bucket_id = 'dental-3d-models' 
    AND (storage.foldername(name))[1] = 'default-models'
    AND (
      auth.uid() IS NOT NULL
      OR EXISTS (
        SELECT 1 FROM profiles 
        WHERE profiles.user_id = auth.uid() 
        AND profiles.role = 'admin'
      )
    )
  );

CREATE POLICY "Admins and authenticated users can update default models"
  ON storage.objects
  FOR UPDATE
  USING (
    bucket_id = 'dental-3d-models' 
    AND (storage.foldername(name))[1] = 'default-models'
    AND (
      auth.uid() IS NOT NULL
      OR EXISTS (
        SELECT 1 FROM profiles 
        WHERE profiles.user_id = auth.uid() 
        AND profiles.role = 'admin'
      )
    )
  );

CREATE POLICY "Admins and authenticated users can delete default models"
  ON storage.objects
  FOR DELETE
  USING (
    bucket_id = 'dental-3d-models' 
    AND (storage.foldername(name))[1] = 'default-models'
    AND (
      auth.uid() IS NOT NULL
      OR EXISTS (
        SELECT 1 FROM profiles 
        WHERE profiles.user_id = auth.uid() 
        AND profiles.role = 'admin'
      )
    )
  );