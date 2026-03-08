
-- Migration 1: Add whatsapp_number to profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS whatsapp_number text;

-- Migration 2: Create otp_codes table
CREATE TABLE public.otp_codes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  code text NOT NULL,
  expires_at timestamptz NOT NULL,
  verified boolean DEFAULT false,
  attempts integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX idx_otp_codes_user_id ON public.otp_codes(user_id);
CREATE INDEX idx_otp_codes_expires_at ON public.otp_codes(expires_at);

ALTER TABLE public.otp_codes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own OTP codes" ON public.otp_codes
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert own OTP codes" ON public.otp_codes
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Service role full access to otp_codes" ON public.otp_codes
  FOR ALL TO service_role
  USING (true) WITH CHECK (true);

-- Migration 3: Create trusted_devices table
CREATE TABLE public.trusted_devices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  device_hash text NOT NULL,
  expires_at timestamptz NOT NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, device_hash)
);

CREATE INDEX idx_trusted_devices_user_id ON public.trusted_devices(user_id);
CREATE INDEX idx_trusted_devices_lookup ON public.trusted_devices(user_id, device_hash);

ALTER TABLE public.trusted_devices ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own trusted devices" ON public.trusted_devices
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can delete own trusted devices" ON public.trusted_devices
  FOR DELETE TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert own trusted devices" ON public.trusted_devices
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Service role full access to trusted_devices" ON public.trusted_devices
  FOR ALL TO service_role
  USING (true) WITH CHECK (true);

-- Cleanup function for expired OTP codes
CREATE OR REPLACE FUNCTION public.cleanup_expired_otp_codes()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  DELETE FROM public.otp_codes WHERE expires_at < now();
  DELETE FROM public.trusted_devices WHERE expires_at < now();
END;
$$;
