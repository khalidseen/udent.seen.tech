-- Create API Keys table
CREATE TABLE IF NOT EXISTS public.api_keys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id UUID REFERENCES public.clinics(id) ON DELETE CASCADE NOT NULL,
  key_name TEXT NOT NULL,
  api_key TEXT UNIQUE NOT NULL,
  is_active BOOLEAN DEFAULT true NOT NULL,
  permissions JSONB DEFAULT '["read"]'::jsonb,
  last_used_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  expires_at TIMESTAMPTZ,
  created_by UUID REFERENCES auth.users(id)
);

-- Create API Logs table
CREATE TABLE IF NOT EXISTS public.api_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id UUID REFERENCES public.clinics(id) ON DELETE CASCADE NOT NULL,
  api_key_id UUID REFERENCES public.api_keys(id) ON DELETE SET NULL,
  endpoint TEXT NOT NULL,
  method TEXT NOT NULL,
  status_code INTEGER,
  response_time_ms INTEGER,
  ip_address INET,
  user_agent TEXT,
  request_params JSONB,
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Enable RLS
ALTER TABLE public.api_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.api_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies for api_keys
CREATE POLICY "Users can view their clinic API keys"
  ON public.api_keys FOR SELECT
  USING (clinic_id = (SELECT get_current_user_profile()).id);

CREATE POLICY "Users can create API keys for their clinic"
  ON public.api_keys FOR INSERT
  WITH CHECK (
    clinic_id = (SELECT get_current_user_profile()).id
    AND has_clinic_permission('api.manage')
  );

CREATE POLICY "Users can update their clinic API keys"
  ON public.api_keys FOR UPDATE
  USING (
    clinic_id = (SELECT get_current_user_profile()).id
    AND has_clinic_permission('api.manage')
  );

CREATE POLICY "Users can delete their clinic API keys"
  ON public.api_keys FOR DELETE
  USING (
    clinic_id = (SELECT get_current_user_profile()).id
    AND has_clinic_permission('api.manage')
  );

-- RLS Policies for api_logs
CREATE POLICY "Users can view their clinic API logs"
  ON public.api_logs FOR SELECT
  USING (
    clinic_id = (SELECT get_current_user_profile()).id
    AND has_clinic_permission('api.view_logs')
  );

CREATE POLICY "System can insert API logs"
  ON public.api_logs FOR INSERT
  WITH CHECK (true);

-- Create indexes for performance
CREATE INDEX idx_api_keys_clinic_id ON public.api_keys(clinic_id);
CREATE INDEX idx_api_keys_api_key ON public.api_keys(api_key) WHERE is_active = true;
CREATE INDEX idx_api_logs_clinic_id ON public.api_logs(clinic_id);
CREATE INDEX idx_api_logs_created_at ON public.api_logs(created_at DESC);
CREATE INDEX idx_api_logs_api_key_id ON public.api_logs(api_key_id);

-- Function to generate secure API key
CREATE OR REPLACE FUNCTION public.generate_api_key()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  key_prefix TEXT := 'sk_live_';
  random_part TEXT;
BEGIN
  random_part := encode(gen_random_bytes(32), 'base64');
  random_part := replace(random_part, '/', '_');
  random_part := replace(random_part, '+', '-');
  random_part := replace(random_part, '=', '');
  RETURN key_prefix || random_part;
END;
$$;

-- Function to validate API key and log usage
CREATE OR REPLACE FUNCTION public.validate_api_key(key TEXT)
RETURNS TABLE(
  is_valid BOOLEAN,
  clinic_id UUID,
  api_key_id UUID,
  permissions JSONB
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  key_record RECORD;
BEGIN
  SELECT 
    ak.id,
    ak.clinic_id,
    ak.permissions,
    ak.is_active,
    ak.expires_at
  INTO key_record
  FROM public.api_keys ak
  WHERE ak.api_key = key;

  IF NOT FOUND THEN
    RETURN QUERY SELECT false, NULL::UUID, NULL::UUID, NULL::JSONB;
    RETURN;
  END IF;

  IF NOT key_record.is_active THEN
    RETURN QUERY SELECT false, NULL::UUID, NULL::UUID, NULL::JSONB;
    RETURN;
  END IF;

  IF key_record.expires_at IS NOT NULL AND key_record.expires_at < now() THEN
    RETURN QUERY SELECT false, NULL::UUID, NULL::UUID, NULL::JSONB;
    RETURN;
  END IF;

  -- Update last used timestamp
  UPDATE public.api_keys 
  SET last_used_at = now() 
  WHERE id = key_record.id;

  RETURN QUERY SELECT 
    true, 
    key_record.clinic_id, 
    key_record.id, 
    key_record.permissions;
END;
$$;