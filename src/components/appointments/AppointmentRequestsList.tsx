import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { format } from "date-fns";
import { ar } from "date-fns/locale";
import { Clock, User, Phone, Mail, MapPin, FileText, Check, X } from "lucide-react";

interface AppointmentRequest {
  id: string;
  patient_name: string;
  patient_phone: string;
  patient_email: string;
  patient_address: string;
  condition_description: string;
  preferred_date: string;
  preferred_time: string;
  status: string;
  created_at: string;
  rejection_reason: string;
}

const AppointmentRequestsList = () => {
  const [requests, setRequests] = useState<AppointmentRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [rejectionReason, setRejectionReason] = useState("");
  const [processingRequest, setProcessingRequest] = useState<string | null>(null);

  const fetchRequests = async () => {
    try {
      setIsLoading(true);
      // Get current user's clinic ID
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        console.log('No user found');
        return;
      }

      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (profileError) {
        console.error('Profile error:', profileError);
        return;
      }
      
      if (!profile) {
        console.log('No profile found');
        return;
      }

      console.log('Profile ID:', profile.id);

      const { data, error } = await supabase
        .from('appointment_requests')
        .select('*')
        .eq('clinic_id', profile.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Appointment requests error:', error);
        throw error;
      }
      
      console.log('Fetched requests:', data);
      setRequests(data || []);
    } catch (error) {
      console.error('Error fetching appointment requests:', error);
      toast.error("حدث خطأ في تحميل طلبات المواعيد");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  const handleApprove = async (request: AppointmentRequest) => {
    setProcessingRequest(request.id);
    try {
      // Get current user's clinic ID
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profile } = await supabase
        .from('profiles')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (!profile) return;

      // Create the actual appointment
      const { data: appointment, error: appointmentError } = await supabase
        .from('appointments')
        .insert({
          clinic_id: profile.id,
          patient_id: null, // Will need to create patient first or link later
          appointment_date: `${request.preferred_date}T${request.preferred_time}+00:00`,
          duration: 30,
          treatment_type: "استشارة",
          status: "scheduled",
          notes: `طلب من الموقع - ${request.condition_description}`
        })
        .select()
        .single();

      if (appointmentError) throw appointmentError;

      // Update the request status
      const { error: updateError } = await supabase
        .from('appointment_requests')
        .update({ 
          status: 'approved',
          approved_appointment_id: appointment.id 
        })
        .eq('id', request.id);

      if (updateError) throw updateError;

      toast.success("تم قبول طلب الموعد بنجاح");
      fetchRequests();
    } catch (error) {
      console.error('Error approving request:', error);
      toast.error("حدث خطأ في قبول الطلب");
    } finally {
      setProcessingRequest(null);
    }
  };

  const handleReject = async (requestId: string) => {
    if (!rejectionReason.trim()) {
      toast.error("يرجى إدخال سبب الرفض");
      return;
    }

    setProcessingRequest(requestId);
    try {
      const { error } = await supabase
        .from('appointment_requests')
        .update({ 
          status: 'rejected',
          rejection_reason: rejectionReason
        })
        .eq('id', requestId);

      if (error) throw error;

      toast.success("تم رفض طلب الموعد");
      setRejectionReason("");
      fetchRequests();
    } catch (error) {
      console.error('Error rejecting request:', error);
      toast.error("حدث خطأ في رفض الطلب");
    } finally {
      setProcessingRequest(null);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="secondary">في الانتظار</Badge>;
      case 'approved':
        return <Badge variant="default">تم القبول</Badge>;
      case 'rejected':
        return <Badge variant="destructive">تم الرفض</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  if (isLoading) {
    return <div className="p-6">جاري التحميل...</div>;
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">طلبات المواعيد</h2>
        <Badge variant="outline">{requests.length} طلب</Badge>
      </div>

      {requests.length === 0 ? (
        <Card>
          <CardContent className="p-6 text-center">
            <p className="text-muted-foreground">لا توجد طلبات مواعيد حالياً</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {requests.map((request) => (
            <Card key={request.id}>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <User className="w-5 h-5" />
                      {request.patient_name}
                    </CardTitle>
                    <CardDescription>
                      تم الإرسال في {format(new Date(request.created_at), 'dd/MM/yyyy HH:mm', { locale: ar })}
                    </CardDescription>
                  </div>
                  {getStatusBadge(request.status)}
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm">
                      <Clock className="w-4 h-4" />
                      <span>
                        {format(new Date(request.preferred_date), 'dd/MM/yyyy', { locale: ar })} - {request.preferred_time}
                      </span>
                    </div>
                    {request.patient_phone && (
                      <div className="flex items-center gap-2 text-sm">
                        <Phone className="w-4 h-4" />
                        <span>{request.patient_phone}</span>
                      </div>
                    )}
                    {request.patient_email && (
                      <div className="flex items-center gap-2 text-sm">
                        <Mail className="w-4 h-4" />
                        <span>{request.patient_email}</span>
                      </div>
                    )}
                    {request.patient_address && (
                      <div className="flex items-center gap-2 text-sm">
                        <MapPin className="w-4 h-4" />
                        <span>{request.patient_address}</span>
                      </div>
                    )}
                  </div>
                  <div>
                    <div className="flex items-start gap-2 text-sm">
                      <FileText className="w-4 h-4 mt-0.5" />
                      <div>
                        <span className="font-medium">وصف الحالة:</span>
                        <p className="mt-1 text-muted-foreground">{request.condition_description}</p>
                      </div>
                    </div>
                  </div>
                </div>

                {request.status === 'pending' && (
                  <div className="flex gap-2 pt-4 border-t">
                    <Button
                      onClick={() => handleApprove(request)}
                      disabled={processingRequest === request.id}
                      className="flex items-center gap-1"
                    >
                      <Check className="w-4 h-4" />
                      قبول الطلب
                    </Button>
                    
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button variant="outline" className="flex items-center gap-1">
                          <X className="w-4 h-4" />
                          رفض الطلب
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>رفض طلب الموعد</DialogTitle>
                          <DialogDescription>
                            يرجى إدخال سبب رفض طلب الموعد لإبلاغ المريض
                          </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4">
                          <div>
                            <Label htmlFor="rejection_reason">سبب الرفض</Label>
                            <Textarea
                              id="rejection_reason"
                              value={rejectionReason}
                              onChange={(e) => setRejectionReason(e.target.value)}
                              placeholder="أدخل سبب رفض الطلب..."
                              rows={3}
                            />
                          </div>
                          <div className="flex gap-2">
                            <Button
                              onClick={() => handleReject(request.id)}
                              disabled={processingRequest === request.id}
                              variant="destructive"
                            >
                              تأكيد الرفض
                            </Button>
                          </div>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </div>
                )}

                {request.status === 'rejected' && request.rejection_reason && (
                  <div className="p-3 bg-destructive/10 rounded-md">
                    <p className="text-sm text-destructive">
                      <strong>سبب الرفض:</strong> {request.rejection_reason}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default AppointmentRequestsList;