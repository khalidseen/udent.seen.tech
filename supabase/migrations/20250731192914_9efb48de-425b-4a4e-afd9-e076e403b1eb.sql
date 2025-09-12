-- Set current user as admin to view doctor applications
UPDATE public.profiles 
SET role = 'admin' 
WHERE user_id = '3466812f-6586-4186-87ef-72e8a3f36d54';

-- Insert some test doctor applications for testing
INSERT INTO public.doctor_applications (
  email, full_name, password, phone, specialization, 
  experience_years, license_number, clinic_name, 
  clinic_address, message, status
) VALUES 
(
  'doctor1@example.com', 
  'د. أحمد محمد', 
  'password123', 
  '+966501234567', 
  'general-dentistry', 
  5, 
  '12345', 
  'عيادة الأسنان المتطورة', 
  'الرياض، حي الملك فهد', 
  'أتطلع للانضمام إلى نظامكم المتطور', 
  'pending'
),
(
  'doctor2@example.com', 
  'د. فاطمة علي', 
  'password456', 
  '+966509876543', 
  'orthodontics', 
  8, 
  '67890', 
  'مركز تقويم الأسنان', 
  'جدة، حي الشاطئ', 
  'خبرة واسعة في تقويم الأسنان', 
  'approved'
),
(
  'doctor3@example.com', 
  'د. محمد السعيد', 
  'password789', 
  '+966501112233', 
  'oral-surgery', 
  3, 
  '11111', 
  'عيادة جراحة الفم', 
  'الدمام، حي الخبر', 
  'متخصص في جراحة الفم والوجه', 
  'rejected',
  'عذراً، نحتاج لمزيد من الخبرة في هذا التخصص'
);