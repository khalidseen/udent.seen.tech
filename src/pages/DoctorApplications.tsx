import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { CheckCircle, XCircle, Clock, Mail, Phone, User, GraduationCap, Building, MapPin, Calendar, MessageSquare } from "lucide-react";
import { PageContainer } from "@/components/layout/PageContainer";
import { PageHeader } from "@/components/layout/PageHeader";
import { format } from "date-fns";
import { ar } from "date-fns/locale";

interface DoctorApplication {
  id: string;
  email: string;
  full_name: string;
  phone?: string;
  specialization: string;
  experience_years?: number;
  license_number?: string;
  clinic_name?: string;
  clinic_address?: string;
  message?: string;
  status: 'pending' | 'approved' | 'rejected';
  admin_message?: string;
  created_at: string;
  updated_at: string;
  reviewed_at?: string;
}

export default function DoctorApplications() {
  const [applications, setApplications] = useState<DoctorApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [selectedApplication, setSelectedApplication] = useState<DoctorApplication | null>(null);
  const [adminMessage, setAdminMessage] = useState("");
  const [actionType, setActionType] = useState<'approve' | 'reject' | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    fetchApplications();
  }, []);

  const fetchApplications = async () => {
    try {
      const { data, error } = await supabase
        .from('doctor_applications')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        toast({
          title: "خطأ في تحميل الطلبات",
          description: error.message,
          variant: "destructive"
        });
      } else {
        setApplications((data || []) as DoctorApplication[]);
      }
    } catch (error) {
      toast({
        title: "خطأ",
        description: "حدث خطأ أثناء تحميل الطلبات",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleApplicationAction = async (applicationId: string, status: 'approved' | 'rejected', message: string) => {
    setProcessingId(applicationId);
    
    try {
      const { error } = await supabase
        .from('doctor_applications')
        .update({
          status,
          admin_message: message,
          reviewed_at: new Date().toISOString()
        })
        .eq('id', applicationId);

      if (error) {
        toast({
          title: "خطأ في معالجة الطلب",
          description: error.message,
          variant: "destructive"
        });
      } else {
        toast({
          title: status === 'approved' ? "تم قبول الطلب" : "تم رفض الطلب",
          description: status === 'approved' 
            ? "تم قبول طلب الطبيب بنجاح. يمكنه الآن تسجيل الدخول للنظام."
            : "تم رفض طلب الطبيب مع إرسال رسالة توضيحية."
        });
        
        // Refresh applications
        await fetchApplications();
        setSelectedApplication(null);
        setAdminMessage("");
        setActionType(null);
      }
    } catch (error) {
      toast({
        title: "خطأ",
        description: "حدث خطأ أثناء معالجة الطلب",
        variant: "destructive"
      });
    } finally {
      setProcessingId(null);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
          <Clock className="w-3 h-3 mr-1" />
          قيد المراجعة
        </Badge>;
      case 'approved':
        return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
          <CheckCircle className="w-3 h-3 mr-1" />
          مقبول
        </Badge>;
      case 'rejected':
        return <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
          <XCircle className="w-3 h-3 mr-1" />
          مرفوض
        </Badge>;
      default:
        return null;
    }
  };

  const getSpecializationName = (specialization: string) => {
    const specializations: Record<string, string> = {
      'general-dentistry': 'طب الأسنان العام',
      'orthodontics': 'تقويم الأسنان',
      'oral-surgery': 'جراحة الفم والأسنان',
      'endodontics': 'علاج العصب',
      'periodontics': 'أمراض اللثة',
      'prosthodontics': 'تركيبات الأسنان',
      'pediatric-dentistry': 'طب أسنان الأطفال',
      'oral-pathology': 'أمراض الفم'
    };
    return specializations[specialization] || specialization;
  };

  if (loading) {
    return (
      <PageContainer>
        <PageHeader 
          title="طلبات انضمام الأطباء" 
          description="إدارة طلبات انضمام الأطباء الجدد للنظام"
        />
        <div className="flex items-center justify-center h-64">
          <div className="text-muted-foreground">جاري التحميل...</div>
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <PageHeader 
        title="طلبات انضمام الأطباء" 
        description="إدارة طلبات انضمام الأطباء الجدد للنظام"
      />

      <div className="grid gap-6">
        {applications.length === 0 ? (
          <Card>
            <CardContent className="flex items-center justify-center h-64">
              <div className="text-center">
                <User className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">لا توجد طلبات</h3>
                <p className="text-muted-foreground">لم يتم تقديم أي طلبات انضمام حتى الآن</p>
              </div>
            </CardContent>
          </Card>
        ) : (
          applications.map((application) => (
            <Card key={application.id} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <User className="w-5 h-5" />
                      {application.full_name}
                    </CardTitle>
                    <CardDescription className="mt-1">
                      {getSpecializationName(application.specialization)}
                      {application.experience_years && ` • ${application.experience_years} سنوات خبرة`}
                    </CardDescription>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    {getStatusBadge(application.status)}
                    <span className="text-xs text-muted-foreground">
                      {format(new Date(application.created_at), 'dd MMM yyyy', { locale: ar })}
                    </span>
                  </div>
                </div>
              </CardHeader>
              
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div className="flex items-center gap-2 text-sm">
                    <Mail className="w-4 h-4 text-muted-foreground" />
                    <span>{application.email}</span>
                  </div>
                  
                  {application.phone && (
                    <div className="flex items-center gap-2 text-sm">
                      <Phone className="w-4 h-4 text-muted-foreground" />
                      <span>{application.phone}</span>
                    </div>
                  )}
                  
                  {application.license_number && (
                    <div className="flex items-center gap-2 text-sm">
                      <GraduationCap className="w-4 h-4 text-muted-foreground" />
                      <span>رقم الترخيص: {application.license_number}</span>
                    </div>
                  )}
                  
                  {application.clinic_name && (
                    <div className="flex items-center gap-2 text-sm">
                      <Building className="w-4 h-4 text-muted-foreground" />
                      <span>{application.clinic_name}</span>
                    </div>
                  )}
                </div>

                {application.clinic_address && (
                  <div className="flex items-start gap-2 text-sm mb-4">
                    <MapPin className="w-4 h-4 text-muted-foreground mt-0.5" />
                    <span>{application.clinic_address}</span>
                  </div>
                )}

                {application.message && (
                  <div className="mb-4 p-3 bg-muted/50 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <MessageSquare className="w-4 h-4 text-muted-foreground" />
                      <span className="text-sm font-medium">رسالة إضافية</span>
                    </div>
                    <p className="text-sm text-muted-foreground">{application.message}</p>
                  </div>
                )}

                {application.admin_message && (
                  <div className="mb-4 p-3 bg-primary/5 rounded-lg border border-primary/20">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-sm font-medium text-primary">رد الإدارة</span>
                      {application.reviewed_at && (
                        <span className="text-xs text-muted-foreground">
                          • {format(new Date(application.reviewed_at), 'dd MMM yyyy', { locale: ar })}
                        </span>
                      )}
                    </div>
                    <p className="text-sm">{application.admin_message}</p>
                  </div>
                )}

                {application.status === 'pending' && (
                  <div className="flex gap-2">
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button 
                          variant="default" 
                          size="sm"
                          onClick={() => {
                            setSelectedApplication(application);
                            setActionType('approve');
                            setAdminMessage("");
                          }}
                          disabled={processingId === application.id}
                        >
                          <CheckCircle className="w-4 h-4 mr-2" />
                          قبول
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>قبول طلب الانضمام</DialogTitle>
                          <DialogDescription>
                            هل أنت متأكد من قبول طلب انضمام د. {selectedApplication?.full_name}؟
                          </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4">
                          <div>
                            <Label htmlFor="approveMessage">رسالة القبول (اختيارية)</Label>
                            <Textarea
                              id="approveMessage"
                              placeholder="مرحباً بك في النظام..."
                              value={adminMessage}
                              onChange={(e) => setAdminMessage(e.target.value)}
                              rows={3}
                            />
                          </div>
                        </div>
                        <DialogFooter>
                          <Button
                            variant="outline"
                            onClick={() => {
                              setSelectedApplication(null);
                              setAdminMessage("");
                              setActionType(null);
                            }}
                          >
                            إلغاء
                          </Button>
                          <Button
                            onClick={() => selectedApplication && handleApplicationAction(selectedApplication.id, 'approved', adminMessage)}
                            disabled={processingId === selectedApplication?.id}
                          >
                            {processingId === selectedApplication?.id ? "جاري المعالجة..." : "تأكيد القبول"}
                          </Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>

                    <Dialog>
                      <DialogTrigger asChild>
                        <Button 
                          variant="destructive" 
                          size="sm"
                          onClick={() => {
                            setSelectedApplication(application);
                            setActionType('reject');
                            setAdminMessage("");
                          }}
                          disabled={processingId === application.id}
                        >
                          <XCircle className="w-4 h-4 mr-2" />
                          رفض
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>رفض طلب الانضمام</DialogTitle>
                          <DialogDescription>
                            هل أنت متأكد من رفض طلب انضمام د. {selectedApplication?.full_name}؟
                          </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4">
                          <div>
                            <Label htmlFor="rejectMessage">سبب الرفض *</Label>
                            <Textarea
                              id="rejectMessage"
                              placeholder="يرجى توضيح سبب الرفض..."
                              value={adminMessage}
                              onChange={(e) => setAdminMessage(e.target.value)}
                              rows={3}
                              required
                            />
                          </div>
                        </div>
                        <DialogFooter>
                          <Button
                            variant="outline"
                            onClick={() => {
                              setSelectedApplication(null);
                              setAdminMessage("");
                              setActionType(null);
                            }}
                          >
                            إلغاء
                          </Button>
                          <Button
                            variant="destructive"
                            onClick={() => selectedApplication && handleApplicationAction(selectedApplication.id, 'rejected', adminMessage)}
                            disabled={processingId === selectedApplication?.id || !adminMessage.trim()}
                          >
                            {processingId === selectedApplication?.id ? "جاري المعالجة..." : "تأكيد الرفض"}
                          </Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                  </div>
                )}
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </PageContainer>
  );
}