-- Fix search path for generate_api_key function
DROP FUNCTION IF EXISTS generate_api_key();

CREATE OR REPLACE FUNCTION generate_api_key()
RETURNS TEXT AS $$
DECLARE
  prefix TEXT := 'udent_live_';
  random_part TEXT;
BEGIN
  -- Generate a random string using encode and gen_random_uuid
  random_part := REPLACE(gen_random_uuid()::TEXT, '-', '');
  RETURN prefix || random_part;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;