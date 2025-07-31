import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { CheckCircle, XCircle, Clock, Mail, Phone, User, GraduationCap, Building, MapPin, Calendar, MessageSquare, Trash2, Send } from "lucide-react";
import { PageContainer } from "@/components/layout/PageContainer";
import { PageHeader } from "@/components/layout/PageHeader";
import { format } from "date-fns";
import { ar } from "date-fns/locale";

interface DoctorApplication {
  id: string;
  email: string;
  full_name: string;
  password?: string;
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
  const [showProfileDialog, setShowProfileDialog] = useState(false);
  const [showActionDialog, setShowActionDialog] = useState(false);
  const [adminMessage, setAdminMessage] = useState("");
  const [actionType, setActionType] = useState<'approve' | 'reject' | 'delete' | 'message' | null>(null);
  const [showMessageDialog, setShowMessageDialog] = useState(false);
  const [messageToSend, setMessageToSend] = useState("");
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
      // If approving, create user account first
      if (status === 'approved') {
        const application = applications.find(app => app.id === applicationId);
        if (application && application.password) {
          // Create user account in Supabase Auth
          const { data: authData, error: authError } = await supabase.auth.admin.createUser({
            email: application.email,
            password: application.password,
            email_confirm: true,
            user_metadata: {
              full_name: application.full_name
            }
          });

          if (authError) {
            toast({
              title: "خطأ في إنشاء الحساب",
              description: authError.message,
              variant: "destructive"
            });
            return;
          }
        }
      }

      // Update application status
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
            ? "تم قبول طلب الطبيب بنجاح وإنشاء حساب له. يمكنه الآن تسجيل الدخول للنظام."
            : "تم رفض طلب الطبيب مع إرسال رسالة توضيحية."
        });
        
        // Refresh applications
        await fetchApplications();
        setSelectedApplication(null);
        setAdminMessage("");
        setActionType(null);
        setShowActionDialog(false);
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

  const openProfileDialog = (application: DoctorApplication) => {
    setSelectedApplication(application);
    setShowProfileDialog(true);
  };

  const openActionDialog = (application: DoctorApplication, action: 'approve' | 'reject' | 'delete') => {
    setSelectedApplication(application);
    setActionType(action);
    setAdminMessage("");
    setShowActionDialog(true);
  };

  const openMessageDialog = (application: DoctorApplication) => {
    setSelectedApplication(application);
    setMessageToSend("");
    setShowMessageDialog(true);
  };

  const handleDeleteApplication = async (applicationId: string) => {
    setProcessingId(applicationId);
    
    try {
      const { error } = await supabase
        .from('doctor_applications')
        .delete()
        .eq('id', applicationId);

      if (error) {
        toast({
          title: "خطأ في حذف الطلب",
          description: error.message,
          variant: "destructive"
        });
      } else {
        toast({
          title: "تم حذف الطلب",
          description: "تم حذف طلب الطبيب بنجاح"
        });
        
        await fetchApplications();
        setShowActionDialog(false);
      }
    } catch (error) {
      toast({
        title: "خطأ",
        description: "حدث خطأ أثناء حذف الطلب",
        variant: "destructive"
      });
    } finally {
      setProcessingId(null);
    }
  };

  const handleSendMessage = async (applicationId: string, message: string) => {
    setProcessingId(applicationId);
    
    try {
      const { error } = await supabase
        .from('doctor_applications')
        .update({
          admin_message: message,
          updated_at: new Date().toISOString()
        })
        .eq('id', applicationId);

      if (error) {
        toast({
          title: "خطأ في إرسال الرسالة",
          description: error.message,
          variant: "destructive"
        });
      } else {
        toast({
          title: "تم إرسال الرسالة",
          description: "تم إرسال الرسالة للطبيب بنجاح"
        });
        
        await fetchApplications();
        setShowMessageDialog(false);
        setMessageToSend("");
      }
    } catch (error) {
      toast({
        title: "خطأ",
        description: "حدث خطأ أثناء إرسال الرسالة",
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

      <div className="grid gap-6 lg:grid-cols-2">
        {applications.length === 0 ? (
          <div className="lg:col-span-2">
            <Card>
              <CardContent className="flex items-center justify-center h-64">
                <div className="text-center">
                  <User className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-medium mb-2">لا توجد طلبات</h3>
                  <p className="text-muted-foreground">لم يتم تقديم أي طلبات انضمام حتى الآن</p>
                </div>
              </CardContent>
            </Card>
          </div>
        ) : (
          applications.map((application) => (
            <Card key={application.id} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        className="p-0 h-auto font-semibold text-lg hover:text-primary"
                        onClick={() => openProfileDialog(application)}
                      >
                        <User className="w-5 h-5 mr-2" />
                        {application.full_name}
                      </Button>
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
                <div className="grid grid-cols-1 gap-2 mb-4">
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
                    <span className="line-clamp-2">{application.clinic_address}</span>
                  </div>
                )}

                {application.message && (
                  <div className="mb-4 p-3 bg-muted/50 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <MessageSquare className="w-4 h-4 text-muted-foreground" />
                      <span className="text-sm font-medium">رسالة إضافية</span>
                    </div>
                    <p className="text-sm text-muted-foreground line-clamp-3">{application.message}</p>
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
                    <p className="text-sm line-clamp-3">{application.admin_message}</p>
                  </div>
                )}

                <div className="flex flex-wrap gap-2">
                  <Button 
                    variant="default" 
                    size="sm"
                    onClick={() => openActionDialog(application, 'approve')}
                    disabled={processingId === application.id}
                  >
                    <CheckCircle className="w-4 h-4 mr-2" />
                    قبول
                  </Button>

                  <Button 
                    variant="destructive" 
                    size="sm"
                    onClick={() => openActionDialog(application, 'reject')}
                    disabled={processingId === application.id}
                  >
                    <XCircle className="w-4 h-4 mr-2" />
                    رفض
                  </Button>

                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => handleDeleteApplication(application.id)}
                    disabled={processingId === application.id}
                    className="text-destructive hover:text-destructive"
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    حذف
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Profile Dialog */}
      <Dialog open={showProfileDialog} onOpenChange={setShowProfileDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <User className="w-5 h-5" />
              ملف الطبيب: {selectedApplication?.full_name}
            </DialogTitle>
            <DialogDescription>
              معلومات تفصيلية عن طلب الانضمام
            </DialogDescription>
          </DialogHeader>
          
          {selectedApplication && (
            <div className="space-y-6">
              {/* Personal Information */}
              <div>
                <h3 className="text-lg font-semibold mb-3 text-primary">المعلومات الشخصية</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-center gap-2">
                    <User className="w-4 h-4 text-muted-foreground" />
                    <span className="font-medium">الاسم:</span>
                    <span>{selectedApplication.full_name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Mail className="w-4 h-4 text-muted-foreground" />
                    <span className="font-medium">البريد:</span>
                    <span>{selectedApplication.email}</span>
                  </div>
                  {selectedApplication.phone && (
                    <div className="flex items-center gap-2">
                      <Phone className="w-4 h-4 text-muted-foreground" />
                      <span className="font-medium">الهاتف:</span>
                      <span>{selectedApplication.phone}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-2">
                    <GraduationCap className="w-4 h-4 text-muted-foreground" />
                    <span className="font-medium">التخصص:</span>
                    <span>{getSpecializationName(selectedApplication.specialization)}</span>
                  </div>
                </div>
              </div>

              {/* Professional Information */}
              <div>
                <h3 className="text-lg font-semibold mb-3 text-primary">المعلومات المهنية</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {selectedApplication.experience_years && (
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-muted-foreground" />
                      <span className="font-medium">سنوات الخبرة:</span>
                      <span>{selectedApplication.experience_years} سنة</span>
                    </div>
                  )}
                  {selectedApplication.license_number && (
                    <div className="flex items-center gap-2">
                      <GraduationCap className="w-4 h-4 text-muted-foreground" />
                      <span className="font-medium">رقم الترخيص:</span>
                      <span>{selectedApplication.license_number}</span>
                    </div>
                  )}
                  {selectedApplication.clinic_name && (
                    <div className="flex items-center gap-2">
                      <Building className="w-4 h-4 text-muted-foreground" />
                      <span className="font-medium">اسم العيادة:</span>
                      <span>{selectedApplication.clinic_name}</span>
                    </div>
                  )}
                </div>
                {selectedApplication.clinic_address && (
                  <div className="mt-4 flex items-start gap-2">
                    <MapPin className="w-4 h-4 text-muted-foreground mt-0.5" />
                    <span className="font-medium">عنوان العيادة:</span>
                    <span>{selectedApplication.clinic_address}</span>
                  </div>
                )}
              </div>

              {/* Application Details */}
              <div>
                <h3 className="text-lg font-semibold mb-3 text-primary">تفاصيل الطلب</h3>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">حالة الطلب:</span>
                    {getStatusBadge(selectedApplication.status)}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-medium">تاريخ التقديم:</span>
                    <span>{format(new Date(selectedApplication.created_at), 'dd MMM yyyy', { locale: ar })}</span>
                  </div>
                  {selectedApplication.reviewed_at && (
                    <div className="flex items-center gap-2">
                      <span className="font-medium">تاريخ المراجعة:</span>
                      <span>{format(new Date(selectedApplication.reviewed_at), 'dd MMM yyyy', { locale: ar })}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Messages */}
              {selectedApplication.message && (
                <div>
                  <h3 className="text-lg font-semibold mb-3 text-primary">رسالة الطبيب</h3>
                  <div className="p-3 bg-muted/50 rounded-lg">
                    <p className="text-sm">{selectedApplication.message}</p>
                  </div>
                </div>
              )}

              {selectedApplication.admin_message && (
                <div>
                  <h3 className="text-lg font-semibold mb-3 text-primary">رد الإدارة</h3>
                  <div className="p-3 bg-primary/5 rounded-lg border border-primary/20">
                    <p className="text-sm">{selectedApplication.admin_message}</p>
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              {selectedApplication.status === 'pending' && (
                <div className="flex gap-2 pt-4 border-t">
                  <Button 
                    variant="default" 
                    onClick={() => {
                      setShowProfileDialog(false);
                      openActionDialog(selectedApplication, 'approve');
                    }}
                    disabled={processingId === selectedApplication.id}
                  >
                    <CheckCircle className="w-4 h-4 mr-2" />
                    قبول الطلب
                  </Button>
                  <Button 
                    variant="destructive" 
                    onClick={() => {
                      setShowProfileDialog(false);
                      openActionDialog(selectedApplication, 'reject');
                    }}
                    disabled={processingId === selectedApplication.id}
                  >
                    <XCircle className="w-4 h-4 mr-2" />
                    رفض الطلب
                  </Button>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Action Dialog */}
      <Dialog open={showActionDialog} onOpenChange={setShowActionDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {actionType === 'approve' && 'قبول طلب الطبيب'}
              {actionType === 'reject' && 'رفض طلب الطبيب'}
              {actionType === 'delete' && 'حذف طلب الطبيب'}
            </DialogTitle>
            <DialogDescription>
              {actionType === 'approve' && 'هل أنت متأكد من قبول هذا الطلب؟ سيتم إنشاء حساب للطبيب وإرسال بيانات الدخول إليه.'}
              {actionType === 'reject' && 'هل أنت متأكد من رفض هذا الطلب؟ يرجى إدخال سبب الرفض ليتم إرساله للطبيب.'}
              {actionType === 'delete' && 'هل أنت متأكد من حذف هذا الطلب؟ لا يمكن التراجع عن هذا الإجراء.'}
            </DialogDescription>
          </DialogHeader>
          
          {actionType !== 'delete' && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="adminMessage">
                  {actionType === 'approve' ? 'رسالة ترحيبية (اختيارية)' : 'سبب الرفض *'}
                </Label>
                <Textarea
                  id="adminMessage"
                  placeholder={actionType === 'approve' 
                    ? "مرحباً بك في نظامنا..."
                    : "يرجى توضيح سبب الرفض..."
                  }
                  value={adminMessage}
                  onChange={(e) => setAdminMessage(e.target.value)}
                  rows={3}
                />
              </div>
            </div>
          )}

          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setShowActionDialog(false)}
              disabled={processingId === selectedApplication?.id}
            >
              إلغاء
            </Button>
            <Button 
              variant={actionType === 'delete' ? 'destructive' : actionType === 'approve' ? 'default' : 'destructive'}
              onClick={() => {
                if (selectedApplication) {
                  if (actionType === 'delete') {
                    handleDeleteApplication(selectedApplication.id);
                  } else {
                    handleApplicationAction(
                      selectedApplication.id, 
                      actionType as 'approved' | 'rejected', 
                      adminMessage
                    );
                  }
                }
              }}
              disabled={
                processingId === selectedApplication?.id ||
                (actionType === 'reject' && !adminMessage.trim())
              }
            >
              {processingId === selectedApplication?.id ? 'جاري المعالجة...' : 
               actionType === 'approve' ? 'قبول الطلب' : 
               actionType === 'reject' ? 'رفض الطلب' : 'حذف الطلب'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Message Dialog */}
      <Dialog open={showMessageDialog} onOpenChange={setShowMessageDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>إرسال رسالة للطبيب</DialogTitle>
            <DialogDescription>
              أرسل رسالة إضافية للطبيب {selectedApplication?.full_name}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="messageToSend">الرسالة *</Label>
              <Textarea
                id="messageToSend"
                placeholder="اكتب رسالتك هنا..."
                value={messageToSend}
                onChange={(e) => setMessageToSend(e.target.value)}
                rows={4}
              />
            </div>
          </div>

          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setShowMessageDialog(false)}
              disabled={processingId === selectedApplication?.id}
            >
              إلغاء
            </Button>
            <Button 
              onClick={() => selectedApplication && handleSendMessage(selectedApplication.id, messageToSend)}
              disabled={
                processingId === selectedApplication?.id ||
                !messageToSend.trim()
              }
            >
              {processingId === selectedApplication?.id ? 'جاري الإرسال...' : 'إرسال الرسالة'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PageContainer>
  );
}