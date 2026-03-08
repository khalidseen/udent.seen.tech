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
import { Clock, User, Phone, Mail, MapPin, FileText, Check, X, MessageCircle, Calendar, Star, AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import ApproveRequestDialog, { ApprovalData } from "./ApproveRequestDialog";
import { useDoctors } from "@/hooks/useDoctors";
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
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [clinicId, setClinicId] = useState<string | undefined>(undefined);
  const [approveDialogOpen, setApproveDialogOpen] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<AppointmentRequest | null>(null);
  
  const { data: doctors } = useDoctors(clinicId);

  // WhatsApp message sending function
  const sendWhatsAppMessage = (phone: string, message: string) => {
    // Clean phone number (remove any non-numeric characters except +)
    const cleanPhone = phone.replace(/[^\d+]/g, '');
    const encodedMessage = encodeURIComponent(message);
    const whatsappUrl = `https://wa.me/${cleanPhone}?text=${encodedMessage}`;
    window.open(whatsappUrl, '_blank');
  };

  // Generate WhatsApp messages for different scenarios
  const generateWhatsAppMessage = (request: AppointmentRequest, type: 'approval' | 'rejection' | 'inquiry') => {
    const clinicName = "عيادة الأسنان"; // يمكن جعلها متغيرة حسب العيادة
    
    switch (type) {
      case 'approval':
        return `مرحباً ${request.patient_name} 👋

تم قبول طلب موعدك في ${clinicName} بنجاح! ✅

📅 تاريخ الموعد: ${format(new Date(request.preferred_date), 'dd/MM/yyyy', { locale: ar })}
🕐 الوقت: ${request.preferred_time}
🦷 نوع الزيارة: استشارة

يرجى الحضور قبل 15 دقيقة من موعدك المحدد.

لأي استفسارات إضافية، لا تترددوا في التواصل معنا.

شكراً لثقتكم بنا 🙏`;

      case 'rejection':
        return `مرحباً ${request.patient_name} 👋

نأسف لإبلاغكم بأنه لا يمكننا تلبية طلب الموعد في التاريخ المطلوب.

📅 التاريخ المطلوب: ${format(new Date(request.preferred_date), 'dd/MM/yyyy', { locale: ar })}

${rejectionReason ? `السبب: ${rejectionReason}` : ''}

يرجى اختيار تاريخ آخر أو التواصل معنا لترتيب موعد بديل.

نتطلع لخدمتكم قريباً 🙏`;

      case 'inquiry':
        return `مرحباً ${request.patient_name} 👋

شكراً لكم على طلب موعد في ${clinicName} 🦷

تلقينا طلبكم بتاريخ ${format(new Date(request.preferred_date), 'dd/MM/yyyy', { locale: ar })} وسنقوم بمراجعته والرد عليكم قريباً.

لأي استفسارات عاجلة، يرجى التواصل معنا مباشرة.

شكراً لثقتكم بنا 🙏`;

      default:
        return `مرحباً ${request.patient_name} 👋\n\nشكراً لتواصلكم مع ${clinicName}`;
    }
  };
  const fetchRequests = async () => {
    try {
      setIsLoading(true);
      // Get current user's clinic ID
      const {
        data: {
          user
        }
      } = await supabase.auth.getUser();
      if (!user) {
        console.log('No user found');
        return;
      }
      const {
        data: profile,
        error: profileError
      } = await supabase.from('profiles').select('id').eq('user_id', user.id).single();
      if (profileError) {
        console.error('Profile error:', profileError);
        return;
      }
      if (!profile) {
        console.log('No profile found');
        return;
      }
      console.log('Profile ID:', profile.id);
      setClinicId(profile.id);
      const {
        data,
        error
      } = await supabase.from('appointment_requests').select('*').eq('clinic_id', profile.id).order('created_at', {
        ascending: false
      });
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
  const openApproveDialog = (request: AppointmentRequest) => {
    setSelectedRequest(request);
    setApproveDialogOpen(true);
  };

  const handleApproveConfirm = async (approvalData: ApprovalData) => {
    if (!selectedRequest) return;
    const request = selectedRequest;
    setProcessingRequest(request.id);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data: profile } = await supabase.from('profiles').select('id').eq('user_id', user.id).single();
      if (!profile) return;

      // Check if patient exists
      let patientId = null;
      if (request.patient_phone) {
        const { data: existingPatient } = await supabase
          .from('patients').select('id')
          .eq('clinic_id', profile.id).eq('phone', request.patient_phone).single();
        if (existingPatient) patientId = existingPatient.id;
      }

      // Create patient if not found
      if (!patientId) {
        const { data: newPatient, error: patientError } = await supabase
          .from('patients').insert({
            clinic_id: profile.id,
            full_name: request.patient_name,
            phone: request.patient_phone,
            email: request.patient_email,
            address: request.patient_address,
            medical_history: `طلب موعد: ${request.condition_description}`
          }).select('id').single();
        if (patientError) throw new Error('فشل في إنشاء بيانات المريض');
        patientId = newPatient.id;
      }

      // Create appointment with approval data
      const { data: appointment, error: appointmentError } = await supabase
        .from('appointments').insert({
          clinic_id: profile.id,
          patient_id: patientId,
          doctor_id: approvalData.doctorId,
          appointment_date: `${approvalData.date}T${approvalData.time}+00:00`,
          duration: approvalData.duration,
          treatment_type: approvalData.treatmentType,
          status: "scheduled",
          notes: `طلب من الموقع - ${request.condition_description}`
        }).select().single();
      if (appointmentError) throw appointmentError;

      // Update request status
      const { error: updateError } = await supabase
        .from('appointment_requests')
        .update({ status: 'approved', approved_appointment_id: appointment.id })
        .eq('id', request.id);
      if (updateError) throw updateError;

      // Send WhatsApp
      if (request.patient_phone) {
        const message = generateWhatsAppMessage(request, 'approval');
        sendWhatsAppMessage(request.patient_phone, message);
      }

      toast.success("تم قبول طلب الموعد وإنشاء موعد بالبيانات المحددة");
      setApproveDialogOpen(false);
      setSelectedRequest(null);
      fetchRequests();
    } catch (error) {
      console.error('Error approving request:', error);
      toast.error("حدث خطأ في قبول الطلب");
    } finally {
      setProcessingRequest(null);
    }
  };
  const handleReject = async (requestId: string, request: AppointmentRequest) => {
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

      // Send WhatsApp rejection message
      if (request.patient_phone) {
        const message = generateWhatsAppMessage(request, 'rejection');
        sendWhatsAppMessage(request.patient_phone, message);
      }

      toast.success("تم رفض طلب الموعد وإرسال رسالة واتساب للمريض");
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
        return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">
          <Clock className="w-3 h-3 mr-1" />
          في الانتظار
        </Badge>;
      case 'approved':
        return <Badge variant="default" className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
          <Check className="w-3 h-3 mr-1" />
          تم القبول
        </Badge>;
      case 'rejected':
        return <Badge variant="destructive" className="bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200">
          <X className="w-3 h-3 mr-1" />
          تم الرفض
        </Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const getPriorityLevel = (createdAt: string) => {
    const now = new Date();
    const created = new Date(createdAt);
    const hoursDiff = (now.getTime() - created.getTime()) / (1000 * 3600);
    
    if (hoursDiff > 24) return { level: 'urgent', color: 'text-red-600', icon: AlertCircle };
    if (hoursDiff > 12) return { level: 'high', color: 'text-orange-600', icon: Clock };
    return { level: 'normal', color: 'text-green-600', icon: Star };
  };

  const filteredRequests = requests.filter(request => {
    if (filterStatus === "all") return true;
    return request.status === filterStatus;
  });
  if (isLoading) {
    return (
      <div className="p-6 space-y-4">
        <div className="animate-pulse space-y-4">
          {[1, 2, 3].map((i) => (
            <Card key={i}>
              <CardHeader>
                <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2"></div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="h-3 bg-gray-200 rounded"></div>
                  <div className="h-3 bg-gray-200 rounded w-3/4"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header with Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card className="bg-gradient-to-r from-blue-500 to-blue-600 text-white">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm opacity-90">إجمالي الطلبات</p>
                <p className="text-2xl font-bold">{requests.length}</p>
              </div>
              <Calendar className="w-8 h-8 opacity-80" />
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-r from-yellow-500 to-yellow-600 text-white">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm opacity-90">في الانتظار</p>
                <p className="text-2xl font-bold">{requests.filter(r => r.status === 'pending').length}</p>
              </div>
              <Clock className="w-8 h-8 opacity-80" />
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-r from-green-500 to-green-600 text-white">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm opacity-90">تم القبول</p>
                <p className="text-2xl font-bold">{requests.filter(r => r.status === 'approved').length}</p>
              </div>
              <Check className="w-8 h-8 opacity-80" />
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-r from-red-500 to-red-600 text-white">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm opacity-90">تم الرفض</p>
                <p className="text-2xl font-bold">{requests.filter(r => r.status === 'rejected').length}</p>
              </div>
              <X className="w-8 h-8 opacity-80" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filter Buttons */}
      <div className="flex gap-2 flex-wrap">
        <Button 
          variant={filterStatus === "all" ? "default" : "outline"} 
          size="sm"
          onClick={() => setFilterStatus("all")}
        >
          جميع الطلبات ({requests.length})
        </Button>
        <Button 
          variant={filterStatus === "pending" ? "default" : "outline"} 
          size="sm"
          onClick={() => setFilterStatus("pending")}
        >
          في الانتظار ({requests.filter(r => r.status === 'pending').length})
        </Button>
        <Button 
          variant={filterStatus === "approved" ? "default" : "outline"} 
          size="sm"
          onClick={() => setFilterStatus("approved")}
        >
          تم القبول ({requests.filter(r => r.status === 'approved').length})
        </Button>
        <Button 
          variant={filterStatus === "rejected" ? "default" : "outline"} 
          size="sm"
          onClick={() => setFilterStatus("rejected")}
        >
          تم الرفض ({requests.filter(r => r.status === 'rejected').length})
        </Button>
      </div>

      {/* Requests List */}
      {filteredRequests.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <div className="space-y-4">
              <div className="w-16 h-16 mx-auto bg-gray-100 rounded-full flex items-center justify-center">
                <Calendar className="w-8 h-8 text-gray-400" />
              </div>
              <div>
                <p className="text-lg font-medium text-gray-900 dark:text-gray-100">
                  {filterStatus === "all" ? "لا توجد طلبات مواعيد" : `لا توجد طلبات ${filterStatus === "pending" ? "في الانتظار" : filterStatus === "approved" ? "مقبولة" : "مرفوضة"}`}
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  ستظهر طلبات المواعيد الجديدة هنا عند وصولها
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6">
          {filteredRequests.map((request) => {
            const priority = getPriorityLevel(request.created_at);
            const PriorityIcon = priority.icon;
            
            return (
              <Card key={request.id} className="hover:shadow-lg transition-all duration-300 border-l-4 border-l-blue-500">
                <CardHeader className="pb-4">
                  <div className="flex justify-between items-start">
                    <div className="space-y-2">
                      <CardTitle className="flex items-center gap-3 text-xl">
                        <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold">
                          {request.patient_name.charAt(0)}
                        </div>
                        <span>{request.patient_name}</span>
                        <PriorityIcon className={`w-5 h-5 ${priority.color}`} />
                      </CardTitle>
                      <CardDescription className="flex items-center gap-2">
                        <Clock className="w-4 h-4" />
                        تم الإرسال في {format(new Date(request.created_at), 'dd/MM/yyyy HH:mm', { locale: ar })}
                      </CardDescription>
                    </div>
                    <div className="flex items-center gap-2">
                      {getStatusBadge(request.status)}
                    </div>
                  </div>
                </CardHeader>
                
                <CardContent className="space-y-6">
                  {/* Patient Information */}
                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <h4 className="font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                        <User className="w-4 h-4" />
                        معلومات المريض
                      </h4>
                      <div className="space-y-3 bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
                        <div className="flex items-center gap-2 text-sm">
                          <Clock className="w-4 h-4 text-blue-600" />
                          <span className="font-medium">التاريخ المطلوب:</span>
                          <span className="bg-blue-100 dark:bg-blue-900 px-2 py-1 rounded text-blue-800 dark:text-blue-200">
                            {format(new Date(request.preferred_date), 'dd/MM/yyyy', { locale: ar })} - {request.preferred_time}
                          </span>
                        </div>
                        
                        {request.patient_phone && (
                          <div className="flex items-center gap-2 text-sm">
                            <Phone className="w-4 h-4 text-green-600" />
                            <span className="font-medium">الهاتف:</span>
                            <span className="direction-ltr">{request.patient_phone}</span>
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => sendWhatsAppMessage(request.patient_phone, generateWhatsAppMessage(request, 'inquiry'))}
                              className="mr-auto bg-green-50 border-green-200 text-green-700 hover:bg-green-100"
                            >
                              <MessageCircle className="w-3 h-3 mr-1" />
                              واتساب
                            </Button>
                          </div>
                        )}
                        
                        {request.patient_email && (
                          <div className="flex items-center gap-2 text-sm">
                            <Mail className="w-4 h-4 text-purple-600" />
                            <span className="font-medium">البريد:</span>
                            <span className="direction-ltr text-purple-700">{request.patient_email}</span>
                          </div>
                        )}
                        
                        {request.patient_address && (
                          <div className="flex items-center gap-2 text-sm">
                            <MapPin className="w-4 h-4 text-red-600" />
                            <span className="font-medium">العنوان:</span>
                            <span>{request.patient_address}</span>
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <div className="space-y-4">
                      <h4 className="font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                        <FileText className="w-4 h-4" />
                        وصف الحالة
                      </h4>
                      <div className="bg-orange-50 dark:bg-orange-900/20 p-4 rounded-lg border border-orange-200 dark:border-orange-800">
                        <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                          {request.condition_description}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  {request.status === 'pending' && (
                    <div className="flex flex-wrap gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
                      <Button 
                        onClick={() => openApproveDialog(request)} 
                        disabled={processingRequest === request.id}
                        className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white shadow-lg"
                      >
                        <Check className="w-4 h-4 mr-2" />
                        قبول وإنشاء موعد
                      </Button>
                      
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button 
                            variant="outline" 
                            className="border-red-200 text-red-700 hover:bg-red-50 dark:border-red-800 dark:text-red-400 dark:hover:bg-red-900/20"
                          >
                            <X className="w-4 h-4 mr-2" />
                            رفض الطلب
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-md">
                          <DialogHeader>
                            <DialogTitle className="text-red-600">رفض طلب الموعد</DialogTitle>
                            <DialogDescription>
                              يرجى إدخال سبب رفض طلب الموعد. سيتم إرسال رسالة واتساب للمريض تتضمن السبب.
                            </DialogDescription>
                          </DialogHeader>
                          <div className="space-y-4">
                            <div>
                              <Label htmlFor="rejection_reason">سبب الرفض</Label>
                              <Textarea 
                                id="rejection_reason" 
                                value={rejectionReason} 
                                onChange={(e) => setRejectionReason(e.target.value)} 
                                placeholder="مثل: المواعيد ممتلئة في هذا التاريخ، يرجى اختيار تاريخ آخر..." 
                                rows={4}
                                className="mt-2"
                              />
                            </div>
                            <div className="flex gap-2">
                              <Button 
                                onClick={() => handleReject(request.id, request)} 
                                disabled={processingRequest === request.id || !rejectionReason.trim()}
                                variant="destructive"
                                className="flex-1"
                              >
                                تأكيد الرفض وإرسال رسالة
                              </Button>
                            </div>
                          </div>
                        </DialogContent>
                      </Dialog>
                      
                      {request.patient_phone && (
                        <Button 
                          variant="outline"
                          onClick={() => sendWhatsAppMessage(request.patient_phone, generateWhatsAppMessage(request, 'inquiry'))}
                          className="bg-green-50 border-green-200 text-green-700 hover:bg-green-100 dark:bg-green-900/20 dark:border-green-800 dark:text-green-400"
                        >
                          <MessageCircle className="w-4 h-4 mr-2" />
                          إرسال رسالة استفسار
                        </Button>
                      )}
                    </div>
                  )}

                  {/* Status-specific information */}
                  {request.status === 'approved' && (
                    <Alert className="bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-800">
                      <Check className="h-4 w-4 text-green-600" />
                      <AlertDescription className="text-green-800 dark:text-green-200">
                        تم قبول الطلب وإنشاء موعد للمريض. تم إرسال رسالة تأكيد عبر الواتساب.
                      </AlertDescription>
                    </Alert>
                  )}

                  {request.status === 'rejected' && request.rejection_reason && (
                    <Alert className="bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-800">
                      <AlertCircle className="h-4 w-4 text-red-600" />
                      <AlertDescription className="text-red-800 dark:text-red-200">
                        <strong>سبب الرفض:</strong> {request.rejection_reason}
                        <br />
                        <span className="text-sm opacity-75">تم إرسال رسالة للمريض تتضمن سبب الرفض.</span>
                      </AlertDescription>
                    </Alert>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Approve Request Dialog */}
      {selectedRequest && (
        <ApproveRequestDialog
          open={approveDialogOpen}
          onOpenChange={setApproveDialogOpen}
          patientName={selectedRequest.patient_name}
          preferredDate={selectedRequest.preferred_date}
          preferredTime={selectedRequest.preferred_time}
          doctors={doctors}
          onConfirm={handleApproveConfirm}
          loading={processingRequest === selectedRequest.id}
        />
      )}
    </div>
  );
};
export default AppointmentRequestsList;