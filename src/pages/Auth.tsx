import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/hooks/useAuth";
import { Navigate } from "react-router-dom";
import { Stethoscope, Eye, EyeOff, Clock, CheckCircle, XCircle, User, Mail, Phone, GraduationCap, Building, MapPin } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

export default function Auth() {
  const { user, loading, signIn, signInDemo } = useAuth();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("login");
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Login form state
  const [loginForm, setLoginForm] = useState({
    email: "",
    password: ""
  });

  // Application form state
  const [applicationForm, setApplicationForm] = useState({
    email: "",
    fullName: "",
    phone: "",
    specialization: "",
    experienceYears: "",
    licenseNumber: "",
    clinicName: "",
    clinicAddress: "",
    message: ""
  });

  // Redirect if user is already logged in
  if (user && !loading) {
    return <Navigate to="/" replace />;
  }

  const validatePassword = (password: string): string | null => {
    if (password.length < 8) {
      return "كلمة المرور يجب أن تكون على الأقل 8 أحرف";
    }
    if (!/(?=.*[a-z])/.test(password)) {
      return "كلمة المرور يجب أن تحتوي على حرف صغير على الأقل";
    }
    if (!/(?=.*[A-Z])/.test(password)) {
      return "كلمة المرور يجب أن تحتوي على حرف كبير على الأقل";
    }
    if (!/(?=.*\d)/.test(password)) {
      return "كلمة المرور يجب أن تحتوي على رقم على الأقل";
    }
    return null;
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!loginForm.email || !loginForm.password) {
      toast({
        title: "خطأ في البيانات",
        description: "يرجى ملء جميع الحقول المطلوبة",
        variant: "destructive"
      });
      return;
    }

    const passwordError = validatePassword(loginForm.password);
    if (passwordError) {
      toast({
        title: "كلمة مرور ضعيفة",
        description: passwordError,
        variant: "destructive"
      });
      return;
    }

    setIsSubmitting(true);
    await signIn(loginForm.email, loginForm.password);
    setIsSubmitting(false);
  };

  const handleApplicationSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!applicationForm.email || !applicationForm.fullName || !applicationForm.specialization) {
      toast({
        title: "خطأ في البيانات",
        description: "يرجى ملء جميع الحقول المطلوبة (الاسم، البريد، التخصص)",
        variant: "destructive"
      });
      return;
    }

    // Client-side validation before submission
    if (applicationForm.fullName.length < 2 || applicationForm.fullName.length > 100) {
      toast({
        title: "خطأ في البيانات",
        description: "يجب أن يكون الاسم الكامل بين 2 و 100 حرف",
        variant: "destructive"
      });
      return;
    }

    if (!/^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/.test(applicationForm.email)) {
      toast({
        title: "خطأ في البيانات",
        description: "صيغة البريد الإلكتروني غير صحيحة",
        variant: "destructive"
      });
      return;
    }

    if (applicationForm.phone && applicationForm.phone.length < 8) {
      toast({
        title: "خطأ في البيانات",
        description: "رقم الهاتف يجب أن يكون على الأقل 8 أرقام",
        variant: "destructive"
      });
      return;
    }

    if (applicationForm.licenseNumber && applicationForm.licenseNumber.length < 3) {
      toast({
        title: "خطأ في البيانات",
        description: "رقم الترخيص يجب أن يكون على الأقل 3 أحرف",
        variant: "destructive"
      });
      return;
    }

    if (applicationForm.experienceYears) {
      const years = parseInt(applicationForm.experienceYears);
      if (years < 0 || years > 70) {
        toast({
          title: "خطأ في البيانات",
          description: "سنوات الخبرة يجب أن تكون بين 0 و 70 سنة",
          variant: "destructive"
        });
        return;
      }
    }

    setIsSubmitting(true);
    
    try {
      // Get client IP and user agent for security tracking
      const { data: clientInfo } = await supabase.functions.invoke('get-client-info');
      
      const { error } = await supabase
        .from('doctor_applications')
        .insert({
          email: applicationForm.email.trim(),
          full_name: applicationForm.fullName.trim(),
          phone: applicationForm.phone?.trim() || null,
          specialization: applicationForm.specialization,
          experience_years: applicationForm.experienceYears ? parseInt(applicationForm.experienceYears) : null,
          license_number: applicationForm.licenseNumber?.trim() || null,
          clinic_name: applicationForm.clinicName?.trim() || null,
          clinic_address: applicationForm.clinicAddress?.trim() || null,
          message: applicationForm.message?.trim() || null,
          request_ip: clientInfo?.ip || null,
          request_user_agent: clientInfo?.userAgent || null
        });

      if (error) {
        // Handle specific validation errors from the database
        if (error.message.includes('Full name must be')) {
          toast({
            title: "خطأ في البيانات",
            description: "الاسم الكامل يجب أن يكون بين 2 و 100 حرف",
            variant: "destructive"
          });
        } else if (error.message.includes('Valid email address')) {
          toast({
            title: "خطأ في البيانات",
            description: "يرجى إدخال بريد إلكتروني صحيح",
            variant: "destructive"
          });
        } else if (error.message.includes('Phone number must be')) {
          toast({
            title: "خطأ في البيانات",
            description: "رقم الهاتف يجب أن يكون على الأقل 8 أرقام",
            variant: "destructive"
          });
        } else if (error.message.includes('License number must be')) {
          toast({
            title: "خطأ في البيانات",
            description: "رقم الترخيص يجب أن يكون على الأقل 3 أحرف",
            variant: "destructive"
          });
        } else if (error.message.includes('Experience years must be')) {
          toast({
            title: "خطأ في البيانات",
            description: "سنوات الخبرة يجب أن تكون بين 0 و 70 سنة",
            variant: "destructive"
          });
        } else if (error.message.includes('similar application')) {
          toast({
            title: "طلب مكرر",
            description: "تم تقديم طلب مشابه مؤخراً. يرجى المحاولة مرة أخرى لاحقاً",
            variant: "destructive"
          });
        } else if (error.message.includes('rate_limit')) {
          toast({
            title: "تجاوز الحد الأقصى",
            description: "تم تجاوز الحد الأقصى للطلبات. يرجى المحاولة مرة أخرى غداً",
            variant: "destructive"
          });
        } else {
          toast({
            title: "خطأ في إرسال الطلب",
            description: "حدث خطأ غير متوقع. يرجى المحاولة مرة أخرى",
            variant: "destructive"
          });
        }
      } else {
        toast({
          title: "تم إرسال الطلب بنجاح",
          description: "سيتم مراجعة طلبك والرد عليك خلال 24-48 ساعة"
        });
        setApplicationForm({
          email: "",
          fullName: "",
          phone: "",
          specialization: "",
          experienceYears: "",
          licenseNumber: "",
          clinicName: "",
          clinicAddress: "",
          message: ""
        });
        setActiveTab("login");
      }
    } catch (error: any) {
      console.error('Error submitting doctor application:', error);
      toast({
        title: "خطأ في الشبكة",
        description: "تحقق من اتصالك بالإنترنت وحاول مرة أخرى",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-secondary/5 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="mx-auto w-16 h-16 bg-primary rounded-2xl flex items-center justify-center mb-4 shadow-lg">
            <Stethoscope className="w-8 h-8 text-primary-foreground" />
          </div>
          <h1 className="text-3xl font-bold text-foreground mb-2">فوردنتست</h1>
          <p className="text-muted-foreground">نظام إدارة العيادة المتطور</p>
        </div>

        <Card className="shadow-xl border-0 bg-card/80 backdrop-blur-sm">
          <Tabs value={activeTab} onValueChange={setActiveTab} dir="rtl">
            <TabsList className="grid w-full grid-cols-2 mb-6">
              <TabsTrigger value="login" className="font-medium">
                تسجيل الدخول
              </TabsTrigger>
              <TabsTrigger value="register" className="font-medium">
                طلب انضمام
              </TabsTrigger>
            </TabsList>

            <TabsContent value="login">
              <CardHeader className="text-center pb-4">
                <CardTitle className="text-xl">مرحباً بعودتك</CardTitle>
                <CardDescription>
                  قم بتسجيل الدخول للوصول إلى نظام إدارة العيادة
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleLogin} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">البريد الإلكتروني</Label>
                    <div className="relative">
                      <Mail className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                      <Input
                        id="email"
                        type="email"
                        placeholder="doctor@example.com"
                        value={loginForm.email}
                        onChange={(e) => setLoginForm(prev => ({ ...prev, email: e.target.value }))}
                        className="pr-10"
                        required
                        disabled={isSubmitting}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="password">كلمة المرور</Label>
                    <div className="relative">
                      <Input
                        id="password"
                        type={showPassword ? "text" : "password"}
                        placeholder="••••••••"
                        value={loginForm.password}
                        onChange={(e) => setLoginForm(prev => ({ ...prev, password: e.target.value }))}
                        className="pl-10"
                        required
                        disabled={isSubmitting}
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute left-0 top-0 h-full px-3 hover:bg-transparent"
                        onClick={() => setShowPassword(!showPassword)}
                        disabled={isSubmitting}
                      >
                        {showPassword ? (
                          <EyeOff className="h-4 w-4 text-muted-foreground" />
                        ) : (
                          <Eye className="h-4 w-4 text-muted-foreground" />
                        )}
                      </Button>
                    </div>
                  </div>

                  <Button 
                    type="submit" 
                    className="w-full" 
                    disabled={isSubmitting || loading}
                  >
                    {isSubmitting ? "جاري تسجيل الدخول..." : "تسجيل الدخول"}
                  </Button>
                </form>

                {/* Demo Login Button */}
                <div className="mt-4">
                  <Button 
                    type="button"
                    variant="outline" 
                    className="w-full" 
                    disabled={isSubmitting || loading}
                    onClick={async () => {
                      setIsSubmitting(true);
                      await signInDemo();
                      setIsSubmitting(false);
                    }}
                  >
                    {isSubmitting ? "جاري الدخول..." : "🎮 دخول تجريبي (للمطورين)"}
                  </Button>
                </div>

                <div className="mt-6 p-4 bg-muted/50 rounded-lg border border-border/50">
                  <div className="flex items-center gap-2 mb-2">
                    <Clock className="w-4 h-4 text-primary" />
                    <span className="text-sm font-medium">ملاحظة هامة</span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    يتطلب تسجيل الدخول موافقة مسبقة من إدارة النظام. إذا لم يكن لديك حساب، يرجى تقديم طلب انضمام أولاً.
                  </p>
                </div>
              </CardContent>
            </TabsContent>

            <TabsContent value="register">
              <CardHeader className="text-center pb-4">
                <CardTitle className="text-xl">طلب انضمام للنظام</CardTitle>
                <CardDescription>
                  املأ البيانات أدناه لتقديم طلب انضمام كطبيب في النظام
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleApplicationSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="fullName">الاسم الكامل *</Label>
                      <div className="relative">
                        <User className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                        <Input
                          id="fullName"
                          type="text"
                          placeholder="د. أحمد محمد"
                          value={applicationForm.fullName}
                          onChange={(e) => setApplicationForm(prev => ({ ...prev, fullName: e.target.value }))}
                          className="pr-10"
                          required
                          disabled={isSubmitting}
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="applicationEmail">البريد الإلكتروني *</Label>
                      <div className="relative">
                        <Mail className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                        <Input
                          id="applicationEmail"
                          type="email"
                          placeholder="doctor@example.com"
                          value={applicationForm.email}
                          onChange={(e) => setApplicationForm(prev => ({ ...prev, email: e.target.value }))}
                          className="pr-10"
                          required
                          disabled={isSubmitting}
                        />
                      </div>
                    </div>


                    <div className="space-y-2">
                      <Label htmlFor="phone">رقم الهاتف</Label>
                      <div className="relative">
                        <Phone className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                        <Input
                          id="phone"
                          type="tel"
                          placeholder="+966501234567"
                          value={applicationForm.phone}
                          onChange={(e) => setApplicationForm(prev => ({ ...prev, phone: e.target.value }))}
                          className="pr-10"
                          disabled={isSubmitting}
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="specialization">التخصص *</Label>
                      <Select 
                        value={applicationForm.specialization} 
                        onValueChange={(value) => setApplicationForm(prev => ({ ...prev, specialization: value }))}
                        disabled={isSubmitting}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="اختر التخصص" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="general-dentistry">طب الأسنان العام</SelectItem>
                          <SelectItem value="orthodontics">تقويم الأسنان</SelectItem>
                          <SelectItem value="oral-surgery">جراحة الفم والأسنان</SelectItem>
                          <SelectItem value="endodontics">علاج العصب</SelectItem>
                          <SelectItem value="periodontics">أمراض اللثة</SelectItem>
                          <SelectItem value="prosthodontics">تركيبات الأسنان</SelectItem>
                          <SelectItem value="pediatric-dentistry">طب أسنان الأطفال</SelectItem>
                          <SelectItem value="oral-pathology">أمراض الفم</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="experienceYears">سنوات الخبرة</Label>
                      <div className="relative">
                        <GraduationCap className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                        <Input
                          id="experienceYears"
                          type="number"
                          placeholder="5"
                          min="0"
                          max="50"
                          value={applicationForm.experienceYears}
                          onChange={(e) => setApplicationForm(prev => ({ ...prev, experienceYears: e.target.value }))}
                          className="pr-10"
                          disabled={isSubmitting}
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="licenseNumber">رقم الترخيص</Label>
                      <Input
                        id="licenseNumber"
                        type="text"
                        placeholder="12345"
                        value={applicationForm.licenseNumber}
                        onChange={(e) => setApplicationForm(prev => ({ ...prev, licenseNumber: e.target.value }))}
                        disabled={isSubmitting}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="clinicName">اسم العيادة</Label>
                      <div className="relative">
                        <Building className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                        <Input
                          id="clinicName"
                          type="text"
                          placeholder="عيادة الأسنان المتخصصة"
                          value={applicationForm.clinicName}
                          onChange={(e) => setApplicationForm(prev => ({ ...prev, clinicName: e.target.value }))}
                          className="pr-10"
                          disabled={isSubmitting}
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="clinicAddress">عنوان العيادة</Label>
                      <div className="relative">
                        <MapPin className="absolute right-3 top-3 text-muted-foreground w-4 h-4" />
                        <Textarea
                          id="clinicAddress"
                          placeholder="الرياض، حي الملك فهد، شارع العليا"
                          value={applicationForm.clinicAddress}
                          onChange={(e) => setApplicationForm(prev => ({ ...prev, clinicAddress: e.target.value }))}
                          className="pr-10 resize-none"
                          rows={2}
                          disabled={isSubmitting}
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="message">رسالة إضافية</Label>
                      <Textarea
                        id="message"
                        placeholder="أضف أي معلومات إضافية تود مشاركتها..."
                        value={applicationForm.message}
                        onChange={(e) => setApplicationForm(prev => ({ ...prev, message: e.target.value }))}
                        className="resize-none"
                        rows={3}
                        disabled={isSubmitting}
                      />
                    </div>
                  </div>

                  <Button 
                    type="submit" 
                    className="w-full" 
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? "جاري إرسال الطلب..." : "إرسال طلب الانضمام"}
                  </Button>
                </form>

                <div className="mt-6 p-4 bg-primary/5 rounded-lg border border-primary/20">
                  <div className="flex items-center gap-2 mb-2">
                    <CheckCircle className="w-4 h-4 text-primary" />
                    <span className="text-sm font-medium text-primary">عملية المراجعة</span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    سيتم مراجعة طلبك من قبل إدارة النظام خلال 24-48 ساعة. ستتلقى رداً عبر البريد الإلكتروني بشأن حالة طلبك.
                  </p>
                </div>
              </CardContent>
            </TabsContent>
          </Tabs>
        </Card>

        <p className="text-center text-xs text-muted-foreground mt-6">
          © 2024 فوردنتست. جميع الحقوق محفوظة.
        </p>
      </div>
    </div>
  );
}