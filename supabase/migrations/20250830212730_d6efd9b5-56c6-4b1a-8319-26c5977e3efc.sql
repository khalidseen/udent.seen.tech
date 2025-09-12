-- إصلاح مشاكل إنشاء المستخدمين

-- أولاً: إصلاح RLS policies لجدول profiles
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;

-- إنشاء سياسات RLS جديدة ومحسنة
CREATE POLICY "Allow user profile creation" 
ON public.profiles 
FOR INSERT 
WITH CHECK (true);  -- السماح بإنشاء الملفات الشخصية

CREATE POLICY "Users can view their own profile" 
ON public.profiles 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own profile" 
ON public.profiles 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all profiles" 
ON public.profiles 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.get_user_effective_permissions(auth.uid()) 
    WHERE permission_key = 'users.view_all'
  )
);

-- ثانياً: إصلاح مشكلة license_number في triggers
-- تعطيل أي trigger يسبب مشكلة license_number للمستخدمين العاديين
DROP TRIGGER IF EXISTS validate_doctor_application_trigger ON public.doctor_applications;
DROP FUNCTION IF EXISTS public.validate_doctor_application();

-- إعادة إنشاء trigger محسن للطلبات الطبية فقط
CREATE OR REPLACE FUNCTION public.validate_doctor_application()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  -- التحقق من الحقول المطلوبة للأطباء فقط
  IF LENGTH(NEW.full_name) < 2 OR LENGTH(NEW.full_name) > 100 THEN
    RAISE EXCEPTION 'Full name must be between 2 and 100 characters';
  END IF;
  
  IF NEW.email IS NULL OR NEW.email !~ '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$' THEN
    RAISE EXCEPTION 'Valid email address is required';
  END IF;
  
  IF NEW.phone IS NOT NULL AND LENGTH(NEW.phone) < 8 THEN
    RAISE EXCEPTION 'Phone number must be at least 8 characters';
  END IF;
  
  -- التحقق من license_number فقط إذا تم توفيره
  IF NEW.license_number IS NOT NULL AND LENGTH(NEW.license_number) < 3 THEN
    RAISE EXCEPTION 'License number must be at least 3 characters';
  END IF;
  
  IF NEW.specialization IS NOT NULL AND LENGTH(NEW.specialization) > 100 THEN
    RAISE EXCEPTION 'Specialization must not exceed 100 characters';
  END IF;
  
  IF NEW.clinic_name IS NOT NULL AND LENGTH(NEW.clinic_name) > 200 THEN
    RAISE EXCEPTION 'Clinic name must not exceed 200 characters';
  END IF;
  
  IF NEW.experience_years IS NOT NULL AND (NEW.experience_years < 0 OR NEW.experience_years > 70) THEN
    RAISE EXCEPTION 'Experience years must be between 0 and 70';
  END IF;
  
  -- توليد hash للطلب
  NEW.application_hash = encode(digest(
    COALESCE(NEW.full_name, '') || 
    COALESCE(NEW.email, '') || 
    COALESCE(NEW.phone, '') || 
    COALESCE(NEW.license_number, ''), 
    'sha256'
  ), 'hex');
  
  RETURN NEW;
END;
$function$;

-- إعادة إنشاء trigger للطلبات الطبية فقط
CREATE TRIGGER validate_doctor_application_trigger
  BEFORE INSERT OR UPDATE ON public.doctor_applications
  FOR EACH ROW
  EXECUTE FUNCTION public.validate_doctor_application();

-- ثالثاً: تحسين handle_new_user trigger
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  -- إنشاء ملف شخصي للمستخدم الجديد
  INSERT INTO public.profiles (user_id, full_name, role, status)
  VALUES (
    NEW.id, 
    COALESCE(
      NEW.raw_user_meta_data->>'full_name',
      NEW.email,
      'مستخدم جديد'
    ),
    COALESCE(
      NEW.raw_user_meta_data->>'role',
      'doctor'
    ),
    'approved'  -- اعتماد تلقائي للمستخدمين المنشأين من النظام
  )
  ON CONFLICT (user_id) DO UPDATE SET
    full_name = COALESCE(EXCLUDED.full_name, profiles.full_name),
    role = COALESCE(EXCLUDED.role, profiles.role),
    status = EXCLUDED.status;
  
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- في حالة حدوث خطأ، لا نمنع إنشاء المستخدم
    RAISE WARNING 'Failed to create profile for user %: %', NEW.id, SQLERRM;
    RETURN NEW;
END;
$function$;

-- التأكد من وجود trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();