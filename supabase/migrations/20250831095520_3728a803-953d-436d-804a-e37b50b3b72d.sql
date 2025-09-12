-- المرحلة الأولى: إضافة دور owner إلى enum فقط
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type t JOIN pg_enum e ON t.oid = e.enumtypid WHERE t.typname = 'user_role_type' AND e.enumlabel = 'owner') THEN
        ALTER TYPE user_role_type ADD VALUE 'owner';
    END IF;
END $$;