import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Bell, MessageCircle, Clock, Check, User } from "lucide-react";
import { format, differenceInHours } from "date-fns";
import { ar } from "date-fns/locale";
import { toast } from "sonner";

interface UpcomingAppointment {
  id: string;
  appointment_date: string;
  treatment_type: string | null;
  status: string;
  patients: {
    full_name: string;
    phone: string | null;
  } | null;
  doctors: {
    full_name: string;
  } | null;
}

const AppointmentReminders = () => {
  const [appointments, setAppointments] = useState<UpcomingAppointment[]>([]);
  const [sentReminders, setSentReminders] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUpcomingAppointments();
    // Load sent reminders from localStorage
    const saved = localStorage.getItem('sent_reminders');
    if (saved) {
      const parsed = JSON.parse(saved);
      // Clean old entries (older than 2 days)
      const now = Date.now();
      const filtered = Object.entries(parsed).filter(
        ([, timestamp]) => now - (timestamp as number) < 172800000
      );
      setSentReminders(new Set(filtered.map(([key]) => key)));
    }
  }, []);

  const fetchUpcomingAppointments = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profile } = await supabase
        .from('profiles')
        .select('id')
        .eq('user_id', user.id)
        .single();
      if (!profile) return;

      // Get appointments in next 24 hours
      const now = new Date();
      const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);

      const { data, error } = await supabase
        .from('appointments')
        .select('id, appointment_date, treatment_type, status, patients(full_name, phone), doctors(full_name)')
        .eq('clinic_id', profile.id)
        .in('status', ['scheduled', 'confirmed'])
        .gte('appointment_date', now.toISOString())
        .lte('appointment_date', tomorrow.toISOString())
        .order('appointment_date', { ascending: true });

      if (error) throw error;
      setAppointments(data || []);
    } catch (error) {
      console.error('Error fetching reminders:', error);
    } finally {
      setLoading(false);
    }
  };

  const generateReminderMessage = (apt: UpcomingAppointment) => {
    const date = format(new Date(apt.appointment_date), 'dd/MM/yyyy', { locale: ar });
    const time = format(new Date(apt.appointment_date), 'HH:mm');
    const patientName = apt.patients?.full_name || 'المريض';
    const doctorName = apt.doctors?.full_name;

    return `مرحباً ${patientName} 👋

هذا تذكير بموعدكم في عيادة الأسنان 🦷

📅 التاريخ: ${date}
🕐 الوقت: ${time}
${apt.treatment_type ? `🏥 نوع الزيارة: ${apt.treatment_type}` : ''}
${doctorName ? `👨‍⚕️ الطبيب: د. ${doctorName}` : ''}

يرجى الحضور قبل 15 دقيقة من موعدكم.

لتأكيد أو إلغاء الموعد يرجى التواصل معنا.

شكراً لثقتكم بنا 🙏`;
  };

  const sendWhatsAppReminder = (apt: UpcomingAppointment) => {
    const phone = apt.patients?.phone;
    if (!phone) {
      toast.error('لا يوجد رقم هاتف لهذا المريض');
      return;
    }

    const cleanPhone = phone.replace(/[^\d+]/g, '');
    const message = generateReminderMessage(apt);
    const url = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`;
    window.open(url, '_blank');

    // Mark as sent
    const newSent = new Set(sentReminders);
    newSent.add(apt.id);
    setSentReminders(newSent);

    // Persist to localStorage
    const stored = JSON.parse(localStorage.getItem('sent_reminders') || '{}');
    stored[apt.id] = Date.now();
    localStorage.setItem('sent_reminders', JSON.stringify(stored));

    toast.success(`تم فتح واتساب لإرسال التذكير لـ ${apt.patients?.full_name}`);
  };

  const sendAllReminders = () => {
    const unsent = appointments.filter(
      apt => apt.patients?.phone && !sentReminders.has(apt.id)
    );
    if (unsent.length === 0) {
      toast.info('تم إرسال جميع التذكيرات بالفعل');
      return;
    }
    unsent.forEach((apt, i) => {
      setTimeout(() => sendWhatsAppReminder(apt), i * 1500);
    });
  };

  const getTimeUntil = (dateStr: string) => {
    const hours = differenceInHours(new Date(dateStr), new Date());
    if (hours < 1) return 'أقل من ساعة';
    if (hours === 1) return 'ساعة واحدة';
    if (hours <= 10) return `${hours} ساعات`;
    return `${hours} ساعة`;
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="animate-pulse space-y-3">
            <div className="h-4 bg-muted rounded w-1/3" />
            <div className="h-10 bg-muted rounded" />
            <div className="h-10 bg-muted rounded" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (appointments.length === 0) return null;

  const unsentCount = appointments.filter(
    apt => apt.patients?.phone && !sentReminders.has(apt.id)
  ).length;

  return (
    <Card className="border-amber-200 dark:border-amber-800 bg-amber-50/50 dark:bg-amber-950/20">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center justify-between text-base">
          <div className="flex items-center gap-2 text-amber-800 dark:text-amber-200">
            <Bell className="w-5 h-5" />
            تذكيرات المواعيد القادمة ({appointments.length})
          </div>
          {unsentCount > 0 && (
            <Button
              size="sm"
              variant="outline"
              onClick={sendAllReminders}
              className="gap-1 border-green-300 text-green-700 hover:bg-green-50 dark:border-green-700 dark:text-green-400"
            >
              <MessageCircle className="w-3.5 h-3.5" />
              إرسال الكل ({unsentCount})
            </Button>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {appointments.map((apt) => {
          const isSent = sentReminders.has(apt.id);
          const hasPhone = !!apt.patients?.phone;

          return (
            <div
              key={apt.id}
              className={`flex items-center justify-between p-3 rounded-lg border transition-colors ${
                isSent
                  ? 'bg-green-50 border-green-200 dark:bg-green-950/20 dark:border-green-800'
                  : 'bg-background border-border'
              }`}
            >
              <div className="flex items-center gap-3 min-w-0 flex-1">
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                  <User className="w-4 h-4 text-primary" />
                </div>
                <div className="min-w-0">
                  <p className="font-medium text-sm truncate">
                    {apt.patients?.full_name || 'مريض'}
                  </p>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Clock className="w-3 h-3" />
                    <span>{format(new Date(apt.appointment_date), 'HH:mm')}</span>
                    <span>•</span>
                    <span>بعد {getTimeUntil(apt.appointment_date)}</span>
                    {apt.treatment_type && (
                      <>
                        <span>•</span>
                        <span>{apt.treatment_type}</span>
                      </>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                {isSent ? (
                  <Badge variant="outline" className="gap-1 border-green-300 text-green-700 dark:border-green-700 dark:text-green-400">
                    <Check className="w-3 h-3" />
                    تم الإرسال
                  </Badge>
                ) : hasPhone ? (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => sendWhatsAppReminder(apt)}
                    className="gap-1 border-green-300 text-green-700 hover:bg-green-50 dark:border-green-700 dark:text-green-400"
                  >
                    <MessageCircle className="w-3.5 h-3.5" />
                    تذكير
                  </Button>
                ) : (
                  <Badge variant="secondary" className="text-xs">
                    بدون رقم
                  </Badge>
                )}
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
};

export default AppointmentReminders;
