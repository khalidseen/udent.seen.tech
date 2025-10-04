-- Fix API key generation function
-- Drop the old function if it exists
DROP FUNCTION IF EXISTS generate_api_key();

-- Create the API key generation function using pgcrypto extension
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
$$ LANGUAGE plpgsql SECURITY DEFINER;