-- إصلاح إنشاء العيادات وربطها مع قاعدة البيانات

-- تحديث CreateClinicDialog ليستخدم subscription_plan_id بدلاً من subscription_plan
-- سننشئ دالة لإنشاء العيادة مع جميع العلاقات المطلوبة
CREATE OR REPLACE FUNCTION public.create_clinic_with_owner(
  clinic_name TEXT,
  license_number TEXT DEFAULT NULL,
  phone TEXT DEFAULT NULL,
  email TEXT DEFAULT NULL,
  address TEXT DEFAULT NULL,
  city TEXT DEFAULT NULL,
  subscription_plan_name TEXT DEFAULT 'basic',
  max_users INTEGER DEFAULT 10,
  max_patients INTEGER DEFAULT 1000
) RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  current_user_id UUID;
  clinic_data RECORD;
  plan_id UUID;
  membership_created BOOLEAN := false;
  profile_updated BOOLEAN := false;
BEGIN
  -- التحقق من المستخدم المصادق عليه
  current_user_id := auth.uid();
  IF current_user_id IS NULL THEN
    RAISE EXCEPTION 'المستخدم غير مصادق عليه';
  END IF;

  -- الحصول على ID خطة الاشتراك
  SELECT id INTO plan_id 
  FROM public.subscription_plans 
  WHERE (name = subscription_plan_name OR name_ar = subscription_plan_name)
    AND is_active = true 
  LIMIT 1;
  
  IF plan_id IS NULL THEN
    -- استخدام الخطة الأساسية كافتراضية
    SELECT id INTO plan_id 
    FROM public.subscription_plans 
    WHERE name = 'Basic' AND is_active = true 
    LIMIT 1;
  END IF;

  -- إنشاء العيادة
  INSERT INTO public.clinics (
    name,
    license_number,
    phone,
    email,
    address,
    city,
    subscription_plan_id,
    subscription_plan,
    max_users,
    max_patients,
    is_active,
    subscription_status,
    subscription_start_date,
    subscription_end_date
  ) VALUES (
    clinic_name,
    license_number,
    phone,
    email,
    address,
    city,
    plan_id,
    subscription_plan_name,
    max_users,
    max_patients,
    true,
    'active',
    now(),
    now() + INTERVAL '1 month'
  ) RETURNING * INTO clinic_data;

  -- إضافة المنشئ كمالك للعيادة
  INSERT INTO public.clinic_memberships (
    clinic_id,
    user_id,
    role,
    is_active
  ) VALUES (
    clinic_data.id,
    current_user_id,
    'owner'::user_role_type,
    true
  );
  
  membership_created := true;

  -- تحديث الملف الشخصي للمستخدم
  UPDATE public.profiles 
  SET 
    clinic_id = clinic_data.id,
    current_clinic_role = 'owner'::user_role_type,
    updated_at = now()
  WHERE user_id = current_user_id;
  
  profile_updated := true;

  -- إرجاع بيانات العيادة المنشأة
  RETURN jsonb_build_object(
    'success', true,
    'clinic_id', clinic_data.id,
    'clinic_name', clinic_data.name,
    'subscription_plan_id', clinic_data.subscription_plan_id,
    'message', 'تم إنشاء العيادة بنجاح'
  );

EXCEPTION
  WHEN OTHERS THEN
    -- في حالة حدوث خطأ، نحاول التراجع عن العمليات
    IF clinic_data.id IS NOT NULL THEN
      DELETE FROM public.clinics WHERE id = clinic_data.id;
    END IF;
    
    RAISE EXCEPTION 'فشل في إنشاء العيادة: %', SQLERRM;
END;
$$;

-- منح الصلاحية للمستخدمين المصادق عليهم لاستخدام هذه الدالة
GRANT EXECUTE ON FUNCTION public.create_clinic_with_owner TO authenticated;

-- تحسين RLS policy لـ clinics لضمان أن المنشئ يمكنه رؤية العيادة فور إنشائها
DROP POLICY IF EXISTS "Users can create clinics" ON public.clinics;
CREATE POLICY "Users can create clinics" 
ON public.clinics 
FOR INSERT 
WITH CHECK (true); -- السماح بالإنشاء، والـ function سيتعامل مع الأمان

-- التأكد من وجود policy للقراءة
CREATE POLICY "Users can view their accessible clinics after creation" 
ON public.clinics 
FOR SELECT 
USING (
  -- Super Admin access
  EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.user_id = auth.uid() AND p.role = 'admin'
  ) 
  OR
  -- Regular user access to their clinics
  id IN (
    SELECT clinic_id FROM public.profiles WHERE user_id = auth.uid()
    UNION
    SELECT clinic_id FROM public.clinic_memberships 
    WHERE user_id = auth.uid() AND is_active = true
  )
);