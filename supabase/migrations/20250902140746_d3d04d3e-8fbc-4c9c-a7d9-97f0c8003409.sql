-- حذف جميع السياسات الحالية وإنشاء سياسة بسيطة جداً
DROP POLICY IF EXISTS "Admins and authenticated users can upload default models" ON storage.objects;
DROP POLICY IF EXISTS "Admins and authenticated users can update default models" ON storage.objects;
DROP POLICY IF EXISTS "Admins and authenticated users can delete default models" ON storage.objects;
DROP POLICY IF EXISTS "Super admins have full storage access" ON storage.objects;
DROP POLICY IF EXISTS "Allow all authenticated users for dental models" ON storage.objects;
DROP POLICY IF EXISTS "Users can manage patient dental models" ON storage.objects;
DROP POLICY IF EXISTS "Users can view patient dental models" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can view default dental models" ON storage.objects;

-- إنشاء سياسة واحدة بسيطة للغاية
CREATE POLICY "Allow everything for dental models bucket"
  ON storage.objects
  FOR ALL
  USING (bucket_id = 'dental-3d-models');