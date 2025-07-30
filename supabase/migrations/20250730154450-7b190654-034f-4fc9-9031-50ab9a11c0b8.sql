-- Insert demo profile for current user if not exists
INSERT INTO public.profiles (user_id, full_name, role, phone, specialization)
SELECT 
  'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'::uuid,
  'د. أحمد محمد - تجريبي',
  'doctor'::user_role,
  '+201234567890',
  'طب الأسنان العام'
WHERE NOT EXISTS (
  SELECT 1 FROM public.profiles 
  WHERE user_id = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'::uuid
);

-- Also create a general fallback profile for any authenticated user
INSERT INTO public.profiles (user_id, full_name, role)
VALUES 
  (gen_random_uuid(), 'مستخدم عام', 'doctor'::user_role)
ON CONFLICT DO NOTHING;