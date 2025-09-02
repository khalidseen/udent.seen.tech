-- إصلاح سياسات التخزين للنماذج ثلاثية الأبعاد

-- حذف السياسات الحالية
DROP POLICY IF EXISTS "Public access to default models" ON storage.objects;
DROP POLICY IF EXISTS "Admins can upload default models" ON storage.objects;
DROP POLICY IF EXISTS "Users can manage patient models for their clinic" ON storage.objects;

-- إنشاء سياسات جديدة أكثر مرونة

-- سياسة للقراءة العامة للنماذج الافتراضية
CREATE POLICY "Anyone can view default dental models"
  ON storage.objects
  FOR SELECT
  USING (bucket_id = 'dental-3d-models' AND (storage.foldername(name))[1] = 'default-models');

-- سياسة للمستخدمين المصادق عليهم لرفع النماذج الافتراضية
CREATE POLICY "Authenticated users can upload default models"
  ON storage.objects
  FOR INSERT
  WITH CHECK (
    bucket_id = 'dental-3d-models' 
    AND (storage.foldername(name))[1] = 'default-models'
    AND auth.uid() IS NOT NULL
  );

-- سياسة للمستخدمين المصادق عليهم لتحديث النماذج الافتراضية
CREATE POLICY "Authenticated users can update default models"
  ON storage.objects
  FOR UPDATE
  USING (
    bucket_id = 'dental-3d-models' 
    AND (storage.foldername(name))[1] = 'default-models'
    AND auth.uid() IS NOT NULL
  );

-- سياسة للمستخدمين المصادق عليهم لحذف النماذج الافتراضية
CREATE POLICY "Authenticated users can delete default models"
  ON storage.objects
  FOR DELETE
  USING (
    bucket_id = 'dental-3d-models' 
    AND (storage.foldername(name))[1] = 'default-models'
    AND auth.uid() IS NOT NULL
  );

-- سياسة للمستخدمين لإدارة نماذج المرضى
CREATE POLICY "Users can manage patient dental models"
  ON storage.objects
  FOR ALL
  USING (
    bucket_id = 'dental-3d-models' 
    AND (storage.foldername(name))[1] = 'patient-models'
    AND auth.uid() IS NOT NULL
  );

-- سياسة لقراءة نماذج المرضى
CREATE POLICY "Users can view patient dental models"
  ON storage.objects
  FOR SELECT
  USING (
    bucket_id = 'dental-3d-models' 
    AND (storage.foldername(name))[1] = 'patient-models'
    AND auth.uid() IS NOT NULL
  );