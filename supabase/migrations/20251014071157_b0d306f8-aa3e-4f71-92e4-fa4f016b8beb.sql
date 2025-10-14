-- تحديث أو إنشاء profile للمستخدم klidmorre@gmail.com بصلاحيات super admin
DO $$
DECLARE
  v_user_id UUID;
  v_clinic_id UUID;
BEGIN
  -- الحصول على user_id من جدول auth.users
  SELECT id INTO v_user_id
  FROM auth.users
  WHERE email = 'klidmorre@gmail.com';
  
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'المستخدم klidmorre@gmail.com غير موجود في auth.users';
  END IF;
  
  -- الحصول على أول عيادة نشطة
  SELECT id INTO v_clinic_id
  FROM public.clinics
  WHERE is_active = true
  ORDER BY created_at ASC
  LIMIT 1;
  
  -- إنشاء عيادة إذا لم توجد
  IF v_clinic_id IS NULL THEN
    INSERT INTO public.clinics (name, is_active)
    VALUES ('عيادة النظام الرئيسية', true)
    RETURNING id INTO v_clinic_id;
  END IF;
  
  -- تحديث أو إنشاء profile
  IF EXISTS (SELECT 1 FROM public.profiles WHERE user_id = v_user_id) THEN
    UPDATE public.profiles
    SET 
      role = 'super_admin',
      clinic_id = v_clinic_id,
      current_clinic_role = 'owner',
      full_name = COALESCE(full_name, 'Super Admin'),
      updated_at = now()
    WHERE user_id = v_user_id;
  ELSE
    INSERT INTO public.profiles (
      id,
      user_id,
      full_name,
      role,
      clinic_id,
      current_clinic_role
    ) VALUES (
      gen_random_uuid(),
      v_user_id,
      'Super Admin',
      'super_admin',
      v_clinic_id,
      'owner'
    );
  END IF;
  
  -- تحديث أو إنشاء clinic membership
  IF EXISTS (
    SELECT 1 FROM public.clinic_memberships 
    WHERE user_id = v_user_id AND clinic_id = v_clinic_id
  ) THEN
    UPDATE public.clinic_memberships
    SET role = 'owner', is_active = true
    WHERE user_id = v_user_id AND clinic_id = v_clinic_id;
  ELSE
    INSERT INTO public.clinic_memberships (
      clinic_id, user_id, role, is_active
    ) VALUES (
      v_clinic_id, v_user_id, 'owner', true
    );
  END IF;
  
  RAISE NOTICE 'تم تكوين الصلاحيات بنجاح للمستخدم klidmorre@gmail.com';
END $$;