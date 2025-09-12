-- Create notifications table for patient and medication alerts
CREATE TABLE public.notifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  clinic_id UUID NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'general'::text, -- 'appointment', 'medication', 'followup', 'supply_alert'
  priority TEXT NOT NULL DEFAULT 'medium'::text, -- 'low', 'medium', 'high', 'urgent'
  status TEXT NOT NULL DEFAULT 'unread'::text, -- 'unread', 'read', 'dismissed'
  scheduled_for TIMESTAMP WITH TIME ZONE NOT NULL,
  patient_id UUID NULL, -- Reference to patient if notification is patient-specific
  related_id UUID NULL, -- Can reference appointment, medication, etc.
  related_type TEXT NULL, -- 'appointment', 'medication', 'supply', etc.
  auto_generated BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  dismissed_at TIMESTAMP WITH TIME ZONE NULL,
  reminded_count INTEGER NOT NULL DEFAULT 0,
  max_reminders INTEGER NOT NULL DEFAULT 3
);

-- Enable RLS
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Create policies for notifications
CREATE POLICY "Users can view their clinic notifications" 
ON public.notifications 
FOR SELECT 
USING (clinic_id = ( SELECT get_current_user_profile.id
FROM get_current_user_profile() get_current_user_profile(id, user_id, full_name, role, created_at, updated_at, status)));

CREATE POLICY "Users can create notifications for their clinic" 
ON public.notifications 
FOR INSERT 
WITH CHECK (clinic_id = ( SELECT get_current_user_profile.id
FROM get_current_user_profile() get_current_user_profile(id, user_id, full_name, role, created_at, updated_at, status)));

CREATE POLICY "Users can update their clinic notifications" 
ON public.notifications 
FOR UPDATE 
USING (clinic_id = ( SELECT get_current_user_profile.id
FROM get_current_user_profile() get_current_user_profile(id, user_id, full_name, role, created_at, updated_at, status)));

CREATE POLICY "Users can delete their clinic notifications" 
ON public.notifications 
FOR DELETE 
USING (clinic_id = ( SELECT get_current_user_profile.id
FROM get_current_user_profile() get_current_user_profile(id, user_id, full_name, role, created_at, updated_at, status)));

-- Create indexes for better performance
CREATE INDEX idx_notifications_clinic_scheduled ON public.notifications(clinic_id, scheduled_for);
CREATE INDEX idx_notifications_patient ON public.notifications(patient_id);
CREATE INDEX idx_notifications_status ON public.notifications(status);
CREATE INDEX idx_notifications_type ON public.notifications(type);

-- Add trigger for updated_at
CREATE TRIGGER update_notifications_updated_at
BEFORE UPDATE ON public.notifications
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create notification templates table
CREATE TABLE public.notification_templates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  clinic_id UUID NOT NULL,
  name TEXT NOT NULL,
  type TEXT NOT NULL,
  title_template TEXT NOT NULL,
  message_template TEXT NOT NULL,
  default_priority TEXT NOT NULL DEFAULT 'medium'::text,
  advance_days INTEGER NOT NULL DEFAULT 1, -- How many days before event to send notification
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS for templates
ALTER TABLE public.notification_templates ENABLE ROW LEVEL SECURITY;

-- Create policies for notification templates
CREATE POLICY "Users can manage their clinic notification templates" 
ON public.notification_templates 
FOR ALL 
USING (clinic_id = ( SELECT get_current_user_profile.id
FROM get_current_user_profile() get_current_user_profile(id, user_id, full_name, role, created_at, updated_at, status)));

-- Add trigger for updated_at
CREATE TRIGGER update_notification_templates_updated_at
BEFORE UPDATE ON public.notification_templates
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Function to generate automatic notifications
CREATE OR REPLACE FUNCTION public.generate_automatic_notifications()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $function$
DECLARE
  appointment_rec RECORD;
  supply_rec RECORD;
  notification_id UUID;
BEGIN
  -- Generate appointment reminders (1 day before)
  FOR appointment_rec IN
    SELECT a.*, p.full_name as patient_name, pr.id as clinic_id
    FROM public.appointments a
    JOIN public.patients p ON a.patient_id = p.id
    JOIN public.profiles pr ON p.clinic_id = pr.id
    WHERE a.appointment_date::date = CURRENT_DATE + INTERVAL '1 day'
    AND a.status = 'scheduled'
    AND NOT EXISTS (
      SELECT 1 FROM public.notifications n 
      WHERE n.related_id = a.id 
      AND n.related_type = 'appointment' 
      AND n.type = 'appointment'
      AND n.scheduled_for::date = CURRENT_DATE + INTERVAL '1 day'
    )
  LOOP
    INSERT INTO public.notifications (
      clinic_id, title, message, type, priority, scheduled_for,
      patient_id, related_id, related_type, auto_generated
    ) VALUES (
      appointment_rec.clinic_id,
      'تذكير موعد غداً',
      'موعد المريض ' || appointment_rec.patient_name || ' غداً في ' || TO_CHAR(appointment_rec.appointment_date, 'HH24:MI'),
      'appointment',
      'medium',
      appointment_rec.appointment_date - INTERVAL '1 day',
      appointment_rec.patient_id,
      appointment_rec.id,
      'appointment',
      true
    );
  END LOOP;

  -- Generate supply alerts for low stock (current stock <= minimum stock)
  FOR supply_rec IN
    SELECT s.*, pr.id as clinic_id
    FROM public.medical_supplies s
    JOIN public.profiles pr ON s.clinic_id = pr.id
    WHERE s.current_stock <= s.minimum_stock
    AND s.is_active = true
    AND NOT EXISTS (
      SELECT 1 FROM public.notifications n 
      WHERE n.related_id = s.id 
      AND n.related_type = 'supply' 
      AND n.type = 'supply_alert'
      AND n.scheduled_for::date = CURRENT_DATE
    )
  LOOP
    INSERT INTO public.notifications (
      clinic_id, title, message, type, priority, scheduled_for,
      related_id, related_type, auto_generated
    ) VALUES (
      supply_rec.clinic_id,
      'تنبيه نقص مخزون',
      'المادة ' || supply_rec.name || ' وصلت للحد الأدنى من المخزون (' || supply_rec.current_stock || '/' || supply_rec.minimum_stock || ')',
      'supply_alert',
      'high',
      CURRENT_TIMESTAMP,
      supply_rec.id,
      'supply',
      true
    );
  END LOOP;

  -- Generate expiry alerts (30 days before expiry)
  FOR supply_rec IN
    SELECT s.*, pr.id as clinic_id
    FROM public.medical_supplies s
    JOIN public.profiles pr ON s.clinic_id = pr.id
    WHERE s.expiry_date IS NOT NULL
    AND s.expiry_date <= CURRENT_DATE + INTERVAL '30 days'
    AND s.expiry_date > CURRENT_DATE
    AND s.is_active = true
    AND NOT EXISTS (
      SELECT 1 FROM public.notifications n 
      WHERE n.related_id = s.id 
      AND n.related_type = 'supply_expiry' 
      AND n.type = 'supply_alert'
      AND n.scheduled_for::date >= CURRENT_DATE - INTERVAL '1 day'
    )
  LOOP
    INSERT INTO public.notifications (
      clinic_id, title, message, type, priority, scheduled_for,
      related_id, related_type, auto_generated
    ) VALUES (
      supply_rec.clinic_id,
      'تنبيه انتهاء صلاحية',
      'المادة ' || supply_rec.name || ' ستنتهي صلاحيتها في ' || TO_CHAR(supply_rec.expiry_date, 'YYYY-MM-DD'),
      'supply_alert',
      CASE 
        WHEN supply_rec.expiry_date <= CURRENT_DATE + INTERVAL '7 days' THEN 'urgent'
        WHEN supply_rec.expiry_date <= CURRENT_DATE + INTERVAL '15 days' THEN 'high'
        ELSE 'medium'
      END,
      CURRENT_TIMESTAMP,
      supply_rec.id,
      'supply_expiry',
      true
    );
  END LOOP;
END;
$function$;

-- Insert default notification templates
INSERT INTO public.notification_templates (clinic_id, name, type, title_template, message_template, default_priority, advance_days) 
SELECT 
  id as clinic_id,
  'تذكير موعد',
  'appointment',
  'تذكير موعد غداً',
  'موعد المريض {{patient_name}} غداً في {{appointment_time}}',
  'medium',
  1
FROM public.profiles WHERE role = 'doctor'
ON CONFLICT DO NOTHING;