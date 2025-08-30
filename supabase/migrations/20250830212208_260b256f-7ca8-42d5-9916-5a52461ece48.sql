-- إنشاء جدول الصلاحيات المؤقتة إذا لم يكن موجوداً
CREATE TABLE IF NOT EXISTS public.temporary_permissions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  permission_key TEXT NOT NULL,
  granted_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  granted_by UUID REFERENCES auth.users(id),
  reason TEXT NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- تمكين RLS
ALTER TABLE public.temporary_permissions ENABLE ROW LEVEL SECURITY;

-- إنشاء سياسات RLS للصلاحيات المؤقتة
CREATE POLICY "Users can view their temporary permissions" 
ON public.temporary_permissions 
FOR SELECT 
USING (user_id = auth.uid() OR granted_by = auth.uid());

CREATE POLICY "Admins can manage temporary permissions" 
ON public.temporary_permissions 
FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM public.get_user_effective_permissions(auth.uid()) 
    WHERE permission_key = 'permissions.manage'
  )
);

-- إنشاء فهارس للأداء
CREATE INDEX IF NOT EXISTS idx_temporary_permissions_user_id ON public.temporary_permissions(user_id);
CREATE INDEX IF NOT EXISTS idx_temporary_permissions_expires_at ON public.temporary_permissions(expires_at);
CREATE INDEX IF NOT EXISTS idx_temporary_permissions_is_active ON public.temporary_permissions(is_active);

-- إنشاء trigger لتحديث updated_at
CREATE OR REPLACE FUNCTION public.update_temporary_permissions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_temporary_permissions_updated_at
    BEFORE UPDATE ON public.temporary_permissions
    FOR EACH ROW
    EXECUTE FUNCTION public.update_temporary_permissions_updated_at();