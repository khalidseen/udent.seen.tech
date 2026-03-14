
-- جدول تذكيرات المواعيد
CREATE TABLE public.appointment_reminders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id UUID NOT NULL REFERENCES public.clinics(id) ON DELETE CASCADE,
  appointment_id UUID NOT NULL REFERENCES public.appointments(id) ON DELETE CASCADE,
  patient_id UUID NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
  reminder_type TEXT NOT NULL DEFAULT 'whatsapp_template',
  template_name TEXT NOT NULL DEFAULT 'appointment_reminder',
  template_language TEXT NOT NULL DEFAULT 'ar',
  scheduled_at TIMESTAMPTZ NOT NULL,
  sent_at TIMESTAMPTZ,
  status TEXT NOT NULL DEFAULT 'pending',
  error_message TEXT,
  reminder_hours_before INTEGER NOT NULL DEFAULT 24,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  CONSTRAINT valid_status CHECK (status IN ('pending', 'sent', 'failed', 'cancelled'))
);

-- فهرس للبحث عن التذكيرات المعلقة
CREATE INDEX idx_reminders_pending ON public.appointment_reminders(scheduled_at, status) WHERE status = 'pending' AND is_active = true;
CREATE INDEX idx_reminders_appointment ON public.appointment_reminders(appointment_id);
CREATE INDEX idx_reminders_patient ON public.appointment_reminders(patient_id);

-- تفعيل RLS
ALTER TABLE public.appointment_reminders ENABLE ROW LEVEL SECURITY;

-- سياسة RLS
CREATE POLICY "Users can manage reminders in their clinic"
  ON public.appointment_reminders
  FOR ALL
  TO authenticated
  USING (clinic_id IN (SELECT id FROM public.clinics WHERE id = (SELECT clinic_id FROM public.profiles WHERE user_id = auth.uid() LIMIT 1)))
  WITH CHECK (clinic_id IN (SELECT id FROM public.clinics WHERE id = (SELECT clinic_id FROM public.profiles WHERE user_id = auth.uid() LIMIT 1)));
