import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { Bell, BellOff, Clock, MessageSquare, Plus, Trash2, Loader2, CheckCircle, XCircle, AlertCircle } from "lucide-react";
import { format, subHours } from "date-fns";
import { ar } from "date-fns/locale";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

interface AppointmentReminderSchedulerProps {
  patientId: string;
  clinicId: string;
}

export function AppointmentReminderScheduler({ patientId, clinicId }: AppointmentReminderSchedulerProps) {
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState("");
  const [hoursBefore, setHoursBefore] = useState("24");
  const [templateName, setTemplateName] = useState("appointment_reminder");
  const [templateLang, setTemplateLang] = useState("ar");

  // Fetch upcoming appointments
  const { data: appointments } = useQuery({
    queryKey: ["patient-upcoming-appointments", patientId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("appointments")
        .select("*")
        .eq("patient_id", patientId)
        .gte("appointment_date", new Date().toISOString())
        .in("status", ["scheduled", "confirmed"])
        .order("appointment_date", { ascending: true });
      if (error) throw error;
      return data;
    },
  });

  // Fetch existing reminders
  const { data: reminders, isLoading } = useQuery({
    queryKey: ["appointment-reminders", patientId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("appointment_reminders")
        .select("*, appointments(appointment_date, treatment_type)")
        .eq("patient_id", patientId)
        .eq("is_active", true)
        .order("scheduled_at", { ascending: true });
      if (error) throw error;
      return data;
    },
  });

  // Create reminder
  const createMutation = useMutation({
    mutationFn: async () => {
      if (!selectedAppointment) throw new Error("اختر موعداً");
      const appointment = appointments?.find((a) => a.id === selectedAppointment);
      if (!appointment) throw new Error("الموعد غير موجود");

      const hours = parseInt(hoursBefore);
      const scheduledAt = subHours(new Date(appointment.appointment_date), hours);

      if (scheduledAt <= new Date()) {
        throw new Error("وقت التذكير يجب أن يكون في المستقبل");
      }

      const { error } = await supabase.from("appointment_reminders").insert({
        clinic_id: clinicId,
        appointment_id: selectedAppointment,
        patient_id: patientId,
        template_name: templateName,
        template_language: templateLang,
        scheduled_at: scheduledAt.toISOString(),
        reminder_hours_before: hours,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["appointment-reminders"] });
      toast.success("تم جدولة التذكير بنجاح");
      setDialogOpen(false);
      setSelectedAppointment("");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  // Delete reminder
  const deleteMutation = useMutation({
    mutationFn: async (reminderId: string) => {
      const { error } = await supabase
        .from("appointment_reminders")
        .update({ is_active: false, status: "cancelled" })
        .eq("id", reminderId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["appointment-reminders"] });
      toast.success("تم إلغاء التذكير");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  // Auto-schedule for all upcoming
  const autoScheduleMutation = useMutation({
    mutationFn: async () => {
      if (!appointments?.length) throw new Error("لا توجد مواعيد قادمة");
      
      const existingAppIds = new Set(reminders?.map((r) => r.appointment_id) || []);
      const newReminders = appointments
        .filter((a) => !existingAppIds.has(a.id))
        .map((a) => {
          const hours = parseInt(hoursBefore);
          const scheduledAt = subHours(new Date(a.appointment_date), hours);
          return {
            clinic_id: clinicId,
            appointment_id: a.id,
            patient_id: patientId,
            template_name: templateName,
            template_language: templateLang,
            scheduled_at: scheduledAt.toISOString(),
            reminder_hours_before: hours,
          };
        })
        .filter((r) => new Date(r.scheduled_at) > new Date());

      if (newReminders.length === 0) throw new Error("كل المواعيد مجدولة مسبقاً أو مضت");

      const { error } = await supabase.from("appointment_reminders").insert(newReminders);
      if (error) throw error;
      return newReminders.length;
    },
    onSuccess: (count) => {
      queryClient.invalidateQueries({ queryKey: ["appointment-reminders"] });
      toast.success(`تم جدولة ${count} تذكير تلقائياً`);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return <Badge variant="outline" className="gap-1"><Clock className="h-3 w-3" /> في الانتظار</Badge>;
      case "sent":
        return <Badge className="gap-1 bg-green-600"><CheckCircle className="h-3 w-3" /> تم الإرسال</Badge>;
      case "failed":
        return <Badge variant="destructive" className="gap-1"><XCircle className="h-3 w-3" /> فشل</Badge>;
      case "cancelled":
        return <Badge variant="secondary" className="gap-1"><BellOff className="h-3 w-3" /> ملغي</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <Bell className="h-5 w-5 text-primary" />
            تذكيرات المواعيد (واتساب)
          </CardTitle>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => autoScheduleMutation.mutate()}
              disabled={autoScheduleMutation.isPending || !appointments?.length}
              className="gap-1"
            >
              {autoScheduleMutation.isPending ? (
                <Loader2 className="h-3 w-3 animate-spin" />
              ) : (
                <MessageSquare className="h-3 w-3" />
              )}
              جدولة تلقائية
            </Button>
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button size="sm" className="gap-1">
                  <Plus className="h-3 w-3" />
                  إضافة تذكير
                </Button>
              </DialogTrigger>
              <DialogContent dir="rtl">
                <DialogHeader>
                  <DialogTitle>جدولة تذكير بالموعد</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 mt-4">
                  <div className="space-y-2">
                    <Label>الموعد</Label>
                    <Select value={selectedAppointment} onValueChange={setSelectedAppointment}>
                      <SelectTrigger>
                        <SelectValue placeholder="اختر موعداً" />
                      </SelectTrigger>
                      <SelectContent>
                        {appointments?.map((a) => (
                          <SelectItem key={a.id} value={a.id}>
                            {format(new Date(a.appointment_date), "PPP - HH:mm", { locale: ar })}
                            {a.treatment_type && ` (${a.treatment_type})`}
                          </SelectItem>
                        ))}
                        {(!appointments || appointments.length === 0) && (
                          <div className="p-2 text-sm text-muted-foreground text-center">لا توجد مواعيد قادمة</div>
                        )}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>التذكير قبل (ساعات)</Label>
                    <Select value={hoursBefore} onValueChange={setHoursBefore}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1">ساعة واحدة</SelectItem>
                        <SelectItem value="2">ساعتان</SelectItem>
                        <SelectItem value="4">4 ساعات</SelectItem>
                        <SelectItem value="12">12 ساعة</SelectItem>
                        <SelectItem value="24">يوم واحد (24 ساعة)</SelectItem>
                        <SelectItem value="48">يومان (48 ساعة)</SelectItem>
                        <SelectItem value="72">3 أيام (72 ساعة)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>اسم قالب Meta</Label>
                    <Input
                      value={templateName}
                      onChange={(e) => setTemplateName(e.target.value)}
                      placeholder="appointment_reminder"
                      dir="ltr"
                    />
                    <p className="text-xs text-muted-foreground">
                      يجب أن يكون القالب معتمداً مسبقاً في Meta Business Manager
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label>لغة القالب</Label>
                    <Select value={templateLang} onValueChange={setTemplateLang}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="ar">العربية</SelectItem>
                        <SelectItem value="en">English</SelectItem>
                        <SelectItem value="en_US">English (US)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <Button
                    onClick={() => createMutation.mutate()}
                    disabled={createMutation.isPending || !selectedAppointment}
                    className="w-full gap-2"
                  >
                    {createMutation.isPending ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Bell className="h-4 w-4" />
                    )}
                    جدولة التذكير
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="text-center py-4 text-muted-foreground">جاري التحميل...</div>
        ) : !reminders || reminders.length === 0 ? (
          <div className="text-center py-6 text-muted-foreground space-y-2">
            <BellOff className="h-8 w-8 mx-auto opacity-30" />
            <p className="text-sm">لا توجد تذكيرات مجدولة</p>
            <p className="text-xs">أضف تذكير أو استخدم الجدولة التلقائية</p>
          </div>
        ) : (
          <div className="space-y-2">
            {reminders.map((reminder) => (
              <div
                key={reminder.id}
                className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-center gap-3 flex-1">
                  <MessageSquare className="h-4 w-4 text-green-600 shrink-0" />
                  <div className="min-w-0">
                    <div className="text-sm font-medium">
                      موعد: {reminder.appointments?.appointment_date
                        ? format(new Date(reminder.appointments.appointment_date), "PPP - HH:mm", { locale: ar })
                        : "—"}
                    </div>
                    <div className="text-xs text-muted-foreground flex items-center gap-2">
                      <Clock className="h-3 w-3" />
                      تذكير: {format(new Date(reminder.scheduled_at), "PPP - HH:mm", { locale: ar })}
                      <span className="text-muted-foreground">• قبل {reminder.reminder_hours_before} ساعة</span>
                    </div>
                    {reminder.error_message && (
                      <div className="text-xs text-destructive flex items-center gap-1 mt-1">
                        <AlertCircle className="h-3 w-3" />
                        {reminder.error_message}
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {getStatusBadge(reminder.status)}
                  {reminder.status === "pending" && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-destructive"
                      onClick={() => deleteMutation.mutate(reminder.id)}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
