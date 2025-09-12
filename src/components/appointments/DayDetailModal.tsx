import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { 
  Calendar, 
  Clock, 
  User, 
  Phone, 
  FileText, 
  Edit, 
  CheckCircle,
  X,
  Plus
} from "lucide-react";
import { format } from "date-fns";
import { ar } from "date-fns/locale";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import EditAppointmentDialog from "./EditAppointmentDialog";
<<<<<<< HEAD
import AddAppointmentPopup from "./AddAppointmentPopup";
=======
>>>>>>> cbd682d36e862741c55b9e7b5d144f8de65c694a
import { Link } from "react-router-dom";

interface Appointment {
  id: string;
  patient_id: string;
  appointment_date: string;
  duration: number;
  status: string;
  treatment_type?: string;
  notes?: string;
  patients?: {
    id: string;
    full_name: string;
    phone?: string;
    email?: string;
  };
}

interface DayDetailModalProps {
  date: Date | null;
  appointments: Appointment[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAppointmentUpdate: () => void;
}

const DayDetailModal = ({
  date,
  appointments,
  open,
  onOpenChange,
  onAppointmentUpdate
}: DayDetailModalProps) => {
  const [editingAppointment, setEditingAppointment] = useState<Appointment | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
<<<<<<< HEAD
  const [isAddAppointmentDialogOpen, setIsAddAppointmentDialogOpen] = useState(false);
=======
>>>>>>> cbd682d36e862741c55b9e7b5d144f8de65c694a

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      scheduled: { label: 'مجدول', variant: 'default' as const, color: 'bg-primary' },
      completed: { label: 'مكتمل', variant: 'secondary' as const, color: 'bg-green-500' },
      cancelled: { label: 'ملغي', variant: 'destructive' as const, color: 'bg-red-500' },
      no_show: { label: 'لم يحضر', variant: 'outline' as const, color: 'bg-orange-500' }
    };
    
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.scheduled;
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const handleCompleteAppointment = async (appointmentId: string) => {
    try {
      const { error } = await supabase
        .from('appointments')
        .update({ status: 'completed' })
        .eq('id', appointmentId);

      if (error) throw error;

      toast({
        title: 'تم الإكمال',
        description: 'تم إكمال الموعد بنجاح'
      });

      onAppointmentUpdate();
<<<<<<< HEAD
    } catch (error: unknown) {
      toast({
        title: 'خطأ',
        description: error instanceof Error ? error.message : 'حدث خطأ غير متوقع',
=======
    } catch (error: any) {
      toast({
        title: 'خطأ',
        description: error.message,
>>>>>>> cbd682d36e862741c55b9e7b5d144f8de65c694a
        variant: 'destructive'
      });
    }
  };

  const handleCancelAppointment = async (appointmentId: string) => {
    try {
      const { error } = await supabase
        .from('appointments')
        .update({ status: 'cancelled' })
        .eq('id', appointmentId);

      if (error) throw error;

      toast({
        title: 'تم الإلغاء',
        description: 'تم إلغاء الموعد بنجاح'
      });

      onAppointmentUpdate();
<<<<<<< HEAD
    } catch (error: unknown) {
      toast({
        title: 'خطأ',
        description: error instanceof Error ? error.message : 'حدث خطأ غير متوقع',
=======
    } catch (error: any) {
      toast({
        title: 'خطأ',
        description: error.message,
>>>>>>> cbd682d36e862741c55b9e7b5d144f8de65c694a
        variant: 'destructive'
      });
    }
  };

  const formatTime = (dateString: string) => {
    try {
      return format(new Date(dateString), "HH:mm", { locale: ar });
    } catch {
      return dateString;
    }
  };

  // Sort appointments by time
  const sortedAppointments = [...appointments].sort((a, b) => 
    new Date(a.appointment_date).getTime() - new Date(b.appointment_date).getTime()
  );

  if (!date) return null;

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-2xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-xl">
              <Calendar className="w-5 h-5 text-primary" />
              مواعيد يوم {format(date, 'dd MMMM yyyy', { locale: ar })}
              <Badge variant="secondary" className="mr-2">
                {appointments.length} موعد
              </Badge>
            </DialogTitle>
          </DialogHeader>

          <ScrollArea className="max-h-[60vh]">
            <div className="space-y-4">
              {sortedAppointments.length === 0 ? (
                <Card>
                  <CardContent className="p-6">
                    <div className="text-center text-muted-foreground">
                      <Calendar className="w-12 h-12 mx-auto mb-4 opacity-50" />
                      <p>لا توجد مواعيد في هذا اليوم</p>
<<<<<<< HEAD
                      <Button 
                        className="mt-4" 
                        size="sm"
                        onClick={() => setIsAddAppointmentDialogOpen(true)}
                      >
                        <Plus className="w-4 h-4 ml-2" />
                        إضافة موعد جديد
                      </Button>
=======
                      <Link to="/appointments/new">
                        <Button className="mt-4" size="sm">
                          <Plus className="w-4 h-4 ml-2" />
                          إضافة موعد جديد
                        </Button>
                      </Link>
>>>>>>> cbd682d36e862741c55b9e7b5d144f8de65c694a
                    </div>
                  </CardContent>
                </Card>
              ) : (
                sortedAppointments.map((appointment, index) => (
                  <Card key={appointment.id} className="hover:shadow-md transition-shadow">
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="flex items-center gap-2">
                            <User className="w-4 h-4 text-primary" />
                            <CardTitle className="text-lg">
                              {appointment.patients?.full_name}
                            </CardTitle>
                          </div>
                          {getStatusBadge(appointment.status)}
                        </div>
                        
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Clock className="w-4 h-4" />
                          {formatTime(appointment.appointment_date)}
                        </div>
                      </div>
                    </CardHeader>
                    
                    <CardContent className="pt-0">
                      <div className="space-y-3">
                        {/* Appointment Details */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                          <div className="flex items-center gap-2">
                            <Clock className="w-4 h-4 text-muted-foreground" />
                            <span>المدة: {appointment.duration} دقيقة</span>
                          </div>
                          
                          {appointment.patients?.phone && (
                            <div className="flex items-center gap-2">
                              <Phone className="w-4 h-4 text-muted-foreground" />
                              <span>{appointment.patients.phone}</span>
                            </div>
                          )}
                        </div>
                        
                        {appointment.treatment_type && (
                          <div className="flex items-center gap-2 text-sm">
                            <FileText className="w-4 h-4 text-muted-foreground" />
                            <span>نوع العلاج: {appointment.treatment_type}</span>
                          </div>
                        )}
                        
                        {appointment.notes && (
                          <div className="p-3 bg-muted/50 rounded-md">
                            <p className="text-sm text-muted-foreground">
                              <span className="font-medium">ملاحظات: </span>
                              {appointment.notes}
                            </p>
                          </div>
                        )}
                        
                        {/* Action Buttons */}
                        <Separator />
                        <div className="flex flex-wrap gap-2 pt-2">
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => {
                              setEditingAppointment(appointment);
                              setEditDialogOpen(true);
                            }}
                          >
                            <Edit className="w-4 h-4 ml-1" />
                            تعديل
                          </Button>
                          
                          {appointment.status === 'scheduled' && (
                            <>
                              <Button 
                                size="sm"
                                onClick={() => handleCompleteAppointment(appointment.id)}
                                className="bg-green-600 hover:bg-green-700 text-white"
                              >
                                <CheckCircle className="w-4 h-4 ml-1" />
                                إكمال
                              </Button>
                              
                              <Button 
                                size="sm"
                                variant="destructive"
                                onClick={() => handleCancelAppointment(appointment.id)}
                              >
                                <X className="w-4 h-4 ml-1" />
                                إلغاء
                              </Button>
                            </>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </ScrollArea>
          
          <div className="flex justify-between items-center pt-4 border-t">
<<<<<<< HEAD
            <Button onClick={() => setIsAddAppointmentDialogOpen(true)}>
              <Plus className="w-4 h-4 ml-2" />
              إضافة موعد جديد
            </Button>
=======
            <Link to="/appointments/new">
              <Button>
                <Plus className="w-4 h-4 ml-2" />
                إضافة موعد جديد
              </Button>
            </Link>
>>>>>>> cbd682d36e862741c55b9e7b5d144f8de65c694a
            
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              إغلاق
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Appointment Dialog */}
      <EditAppointmentDialog
        appointment={editingAppointment}
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        onAppointmentUpdated={() => {
          onAppointmentUpdate();
          setEditDialogOpen(false);
        }}
      />
<<<<<<< HEAD

      {/* Add Appointment Dialog */}
      <AddAppointmentPopup
        open={isAddAppointmentDialogOpen}
        onOpenChange={setIsAddAppointmentDialogOpen}
        onAppointmentAdded={onAppointmentUpdate}
      />
=======
>>>>>>> cbd682d36e862741c55b9e7b5d144f8de65c694a
    </>
  );
};

export default DayDetailModal;