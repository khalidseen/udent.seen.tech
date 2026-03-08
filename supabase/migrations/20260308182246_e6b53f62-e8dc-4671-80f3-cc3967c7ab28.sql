
-- جدول إعدادات واتساب لكل عيادة
CREATE TABLE public.whatsapp_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id UUID NOT NULL REFERENCES public.clinics(id) ON DELETE CASCADE,
  access_token TEXT NOT NULL,
  phone_number_id TEXT NOT NULL,
  business_account_id TEXT,
  webhook_verify_token TEXT NOT NULL DEFAULT encode(gen_random_bytes(32), 'hex'),
  webhook_secret TEXT,
  display_phone_number TEXT,
  business_name TEXT,
  is_active BOOLEAN DEFAULT false,
  is_verified BOOLEAN DEFAULT false,
  last_verified_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(clinic_id)
);

-- Enable RLS
ALTER TABLE public.whatsapp_config ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Users can view their clinic whatsapp config"
  ON public.whatsapp_config FOR SELECT
  TO authenticated
  USING (clinic_id IN (SELECT clinic_id FROM public.profiles WHERE user_id = auth.uid()));

CREATE POLICY "Owners can manage whatsapp config"
  ON public.whatsapp_config FOR ALL
  TO authenticated
  USING (clinic_id IN (SELECT clinic_id FROM public.profiles WHERE user_id = auth.uid()))
  WITH CHECK (clinic_id IN (SELECT clinic_id FROM public.profiles WHERE user_id = auth.uid()));

-- Updated_at trigger
CREATE TRIGGER update_whatsapp_config_updated_at
  BEFORE UPDATE ON public.whatsapp_config
  FOR EACH ROW
  EXECUTE FUNCTION public.update_clinic_settings_updated_at();
