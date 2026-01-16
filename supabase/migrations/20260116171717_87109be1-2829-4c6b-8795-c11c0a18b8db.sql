-- جدول لتتبع نشاط قاعدة البيانات
CREATE TABLE IF NOT EXISTS public.system_health_pings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ping_type TEXT NOT NULL DEFAULT 'keep_alive',
  source TEXT DEFAULT 'client',
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- فهرس للبحث السريع
CREATE INDEX IF NOT EXISTS idx_system_health_pings_created_at ON public.system_health_pings(created_at DESC);

-- تمكين RLS
ALTER TABLE public.system_health_pings ENABLE ROW LEVEL SECURITY;

-- سياسة للسماح بالإدراج من أي مصدر (بما في ذلك Edge Functions)
CREATE POLICY "Allow insert from any source" ON public.system_health_pings
  FOR INSERT WITH CHECK (true);

-- سياسة للقراءة للمستخدمين المسجلين فقط
CREATE POLICY "Allow read for authenticated users" ON public.system_health_pings
  FOR SELECT USING (auth.role() = 'authenticated');

-- حذف السجلات القديمة تلقائياً (أكثر من 30 يوم)
CREATE OR REPLACE FUNCTION public.cleanup_old_health_pings()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  DELETE FROM public.system_health_pings
  WHERE created_at < now() - INTERVAL '30 days';
END;
$$;