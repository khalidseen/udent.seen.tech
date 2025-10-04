-- Create api_keys table with RLS and indexes
CREATE TABLE IF NOT EXISTS public.api_keys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id UUID NOT NULL,
  key_name TEXT NOT NULL,
  api_key TEXT NOT NULL UNIQUE,
  is_active BOOLEAN NOT NULL DEFAULT true,
  permissions JSONB NOT NULL DEFAULT '["read"]'::jsonb,
  last_used_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at TIMESTAMPTZ,
  created_by UUID
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_api_keys_clinic_id ON public.api_keys (clinic_id);
CREATE INDEX IF NOT EXISTS idx_api_keys_active ON public.api_keys (is_active);

-- Enable RLS
ALTER TABLE public.api_keys ENABLE ROW LEVEL SECURITY;

-- Policies consistent with other clinic-scoped tables
DROP POLICY IF EXISTS "Users can view their clinic api keys" ON public.api_keys;
CREATE POLICY "Users can view their clinic api keys"
ON public.api_keys
FOR SELECT
USING (clinic_id = (SELECT id FROM public.get_current_user_profile() LIMIT 1));

DROP POLICY IF EXISTS "Users can create api keys for their clinic" ON public.api_keys;
CREATE POLICY "Users can create api keys for their clinic"
ON public.api_keys
FOR INSERT
WITH CHECK (clinic_id = (SELECT id FROM public.get_current_user_profile() LIMIT 1));

DROP POLICY IF EXISTS "Users can update their clinic api keys" ON public.api_keys;
CREATE POLICY "Users can update their clinic api keys"
ON public.api_keys
FOR UPDATE
USING (clinic_id = (SELECT id FROM public.get_current_user_profile() LIMIT 1));

DROP POLICY IF EXISTS "Users can delete their clinic api keys" ON public.api_keys;
CREATE POLICY "Users can delete their clinic api keys"
ON public.api_keys
FOR DELETE
USING (clinic_id = (SELECT id FROM public.get_current_user_profile() LIMIT 1));