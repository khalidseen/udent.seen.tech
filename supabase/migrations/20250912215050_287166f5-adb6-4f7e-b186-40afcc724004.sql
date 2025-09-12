-- إضافة القيم الجديدة إلى enum user_role_type فقط
ALTER TYPE public.user_role_type ADD VALUE IF NOT EXISTS 'receptionist';
ALTER TYPE public.user_role_type ADD VALUE IF NOT EXISTS 'secretary';