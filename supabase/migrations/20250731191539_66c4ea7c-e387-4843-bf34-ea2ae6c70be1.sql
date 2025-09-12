-- Create admin role for existing profiles
UPDATE public.profiles 
SET role = 'admin' 
WHERE user_id = (
  SELECT id FROM auth.users 
  WHERE email = 'demo@clinic.com' 
  LIMIT 1
);