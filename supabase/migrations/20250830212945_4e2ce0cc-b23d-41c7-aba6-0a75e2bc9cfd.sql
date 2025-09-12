-- حذف جميع السياسات الموجودة أولاً
DO $$
DECLARE
    policy_record RECORD;
BEGIN
    FOR policy_record IN 
        SELECT schemaname, tablename, policyname 
        FROM pg_policies 
        WHERE schemaname = 'public' AND tablename = 'profiles'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON %I.%I', 
                      policy_record.policyname, 
                      policy_record.schemaname, 
                      policy_record.tablename);
    END LOOP;
END $$;

-- إنشاء السياسات الجديدة
CREATE POLICY "Enable all operations for system" 
ON public.profiles 
FOR ALL 
USING (true)
WITH CHECK (true);

-- سياسة للمستخدمين لعرض ملفهم الشخصي
CREATE POLICY "Users can view own profile" 
ON public.profiles 
FOR SELECT 
USING (auth.uid() = user_id);

-- سياسة للمستخدمين لتعديل ملفهم الشخصي  
CREATE POLICY "Users can update own profile" 
ON public.profiles 
FOR UPDATE 
USING (auth.uid() = user_id);

-- سياسة للإدارة لعرض جميع الملفات
CREATE POLICY "Admins view all profiles" 
ON public.profiles 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.get_user_effective_permissions(auth.uid()) 
    WHERE permission_key IN ('users.view_all', 'permissions.manage')
  )
);