-- الحل الصحيح: استخدام profile.id بدلاً من clinic_id
-- لأن foreign key يشير إلى profiles.id

-- تحديث المرضى لاستخدام profile_id المستخدم الحالي
UPDATE patients 
SET clinic_id = '83654c18-260c-4c93-81ea-d125ac9f507c'
WHERE clinic_id = 'b4d26a9b-43b5-4dc0-94ec-2e44478a4a2f';

-- تحديث المواعيد
UPDATE appointments 
SET clinic_id = '83654c18-260c-4c93-81ea-d125ac9f507c'
WHERE clinic_id = 'b4d26a9b-43b5-4dc0-94ec-2e44478a4a2f';

-- تحديث السجلات الطبية  
UPDATE medical_records 
SET clinic_id = '83654c18-260c-4c93-81ea-d125ac9f507c'
WHERE clinic_id = 'b4d26a9b-43b5-4dc0-94ec-2e44478a4a2f';

-- تحديث العلاجات السنية
UPDATE dental_treatments 
SET clinic_id = '83654c18-260c-4c93-81ea-d125ac9f507c'
WHERE clinic_id = 'b4d26a9b-43b5-4dc0-94ec-2e44478a4a2f';

-- تحديث الصور الطبية
UPDATE medical_images 
SET clinic_id = '83654c18-260c-4c93-81ea-d125ac9f507c'
WHERE clinic_id = 'b4d26a9b-43b5-4dc0-94ec-2e44478a4a2f';

-- تحديث الفواتير
UPDATE invoices 
SET clinic_id = '83654c18-260c-4c93-81ea-d125ac9f507c'
WHERE clinic_id = 'b4d26a9b-43b5-4dc0-94ec-2e44478a4a2f';