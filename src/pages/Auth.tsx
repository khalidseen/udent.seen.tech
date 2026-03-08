import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { useAuth } from "@/hooks/useAuth";
import { Navigate } from "react-router-dom";
import { Stethoscope, Eye, EyeOff, Clock, Mail, ShieldCheck, ArrowRight } from "lucide-react";
import { useRateLimiter } from "@/middleware/rateLimiter";
import { RateLimitError } from "@/components/system/RateLimitStatus";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";

export default function Auth() {
  const {
    user, loading, initialized, signIn,
    needsOtp, otpMaskedPhone, verifyOtp, resendOtp, cancelOtp,
  } = useAuth();
  const { toast } = useToast();
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const [rateLimitBlocked, setRateLimitBlocked] = useState<{ blocked: boolean; waitTime?: number }>({ blocked: false });

  const { consume } = useRateLimiter('auth');

  const [loginForm, setLoginForm] = useState({ email: "", password: "" });

  // OTP state
  const [otpCode, setOtpCode] = useState("");
  const [rememberDevice, setRememberDevice] = useState(false);
  const [otpCountdown, setOtpCountdown] = useState(300); // 5 min
  const [resendCooldown, setResendCooldown] = useState(0);

  // OTP countdown timer
  useEffect(() => {
    if (!needsOtp) return;
    setOtpCountdown(300);
    const timer = setInterval(() => {
      setOtpCountdown(prev => {
        if (prev <= 1) { clearInterval(timer); return 0; }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [needsOtp]);

  // Resend cooldown timer
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setInterval(() => {
      setResendCooldown(prev => Math.max(0, prev - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, [resendCooldown]);

  if (!initialized || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-primary/5 via-background to-secondary/5">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="text-muted-foreground">جارٍ التحميل...</p>
        </div>
      </div>
    );
  }

  if (user) {
    return <Navigate to="/" replace />;
  }

  if (rateLimitBlocked.blocked && rateLimitBlocked.waitTime) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-secondary/5 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <Card className="shadow-xl border-0 bg-card/80 backdrop-blur-sm">
            <CardContent className="pt-6">
              <RateLimitError
                waitTime={rateLimitBlocked.waitTime}
                message="لقد تجاوزت عدد محاولات تسجيل الدخول المسموح بها. هذا الإجراء لحماية حسابك."
              />
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const rateLimitResult = await consume();
    if (!rateLimitResult.success) {
      setRateLimitBlocked({ blocked: true, waitTime: rateLimitResult.waitTime });
      toast({ title: "تم تجاوز الحد المسموح", description: rateLimitResult.message || "حاول مرة أخرى لاحقاً", variant: "destructive" });
      return;
    }
    setIsSubmitting(true);
    try {
      if (isSignUp) {
        const { error } = await signUp(loginForm.email, loginForm.password);
        if (error) {
          toast({ title: "فشل التسجيل", description: error.message, variant: "destructive" });
        } else {
          toast({ title: "تم التسجيل بنجاح", description: "يرجى التحقق من بريدك الإلكتروني لتأكيد حسابك" });
        }
      } else {
        await signIn(loginForm.email, loginForm.password);
      }
    } catch (error) {
      console.error('Auth error:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const signUp = async (email: string, password: string) => {
    const redirectUrl = `${window.location.origin}/`;
    const { error } = await supabase.auth.signUp({ email, password, options: { emailRedirectTo: redirectUrl } });
    return { error };
  };

  const handleVerifyOtp = async () => {
    if (otpCode.length !== 6) return;
    setIsSubmitting(true);
    try {
      const result = await verifyOtp(otpCode, rememberDevice);
      if (!result.success) {
        toast({ title: "خطأ", description: result.error || "رمز غير صحيح", variant: "destructive" });
        setOtpCode("");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResendOtp = async () => {
    if (resendCooldown > 0) return;
    setIsSubmitting(true);
    try {
      const result = await resendOtp();
      if (result.success) {
        setResendCooldown(60);
        setOtpCountdown(300);
        setOtpCode("");
      } else {
        toast({ title: "خطأ", description: result.error || "فشل إعادة الإرسال", variant: "destructive" });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  // OTP Screen
  if (needsOtp) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-secondary/5 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <div className="mx-auto w-16 h-16 bg-primary rounded-2xl flex items-center justify-center mb-4 shadow-lg">
              <ShieldCheck className="w-8 h-8 text-primary-foreground" />
            </div>
            <h1 className="text-3xl font-bold text-foreground mb-2">التحقق الثنائي</h1>
            <p className="text-muted-foreground">أدخل رمز التحقق المرسل عبر واتساب</p>
          </div>

          <Card className="shadow-xl border-0 bg-card/80 backdrop-blur-sm">
            <CardHeader className="text-center pb-4">
              <CardTitle className="text-xl">رمز التحقق</CardTitle>
              <CardDescription>
                {otpMaskedPhone
                  ? `تم إرسال الرمز إلى ${otpMaskedPhone}`
                  : "تم إرسال رمز التحقق إلى رقم واتساب المسجل"}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex justify-center" dir="ltr">
                <InputOTP
                  maxLength={6}
                  value={otpCode}
                  onChange={setOtpCode}
                  disabled={isSubmitting || otpCountdown === 0}
                >
                  <InputOTPGroup>
                    <InputOTPSlot index={0} />
                    <InputOTPSlot index={1} />
                    <InputOTPSlot index={2} />
                    <InputOTPSlot index={3} />
                    <InputOTPSlot index={4} />
                    <InputOTPSlot index={5} />
                  </InputOTPGroup>
                </InputOTP>
              </div>

              {/* Countdown */}
              <div className="text-center">
                {otpCountdown > 0 ? (
                  <p className="text-sm text-muted-foreground">
                    صلاحية الرمز: <span className="font-mono font-bold text-foreground">{formatTime(otpCountdown)}</span>
                  </p>
                ) : (
                  <p className="text-sm text-destructive font-medium">انتهت صلاحية الرمز. أعد الإرسال.</p>
                )}
              </div>

              {/* Remember device */}
              <div className="flex items-center gap-2 justify-end">
                <Label htmlFor="remember" className="text-sm cursor-pointer">
                  تذكر هذا الجهاز لمدة 30 يوم
                </Label>
                <Checkbox
                  id="remember"
                  checked={rememberDevice}
                  onCheckedChange={(checked) => setRememberDevice(checked === true)}
                />
              </div>

              <Button
                className="w-full"
                onClick={handleVerifyOtp}
                disabled={otpCode.length !== 6 || isSubmitting || otpCountdown === 0}
              >
                {isSubmitting ? "جاري التحقق..." : "تأكيد الرمز"}
                {!isSubmitting && <ArrowRight className="w-4 h-4 mr-2" />}
              </Button>

              <div className="flex items-center justify-between">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={cancelOtp}
                  disabled={isSubmitting}
                  className="text-muted-foreground"
                >
                  العودة لتسجيل الدخول
                </Button>
                <Button
                  variant="link"
                  size="sm"
                  onClick={handleResendOtp}
                  disabled={isSubmitting || resendCooldown > 0}
                >
                  {resendCooldown > 0
                    ? `إعادة الإرسال (${resendCooldown}ث)`
                    : "إعادة إرسال الرمز"}
                </Button>
              </div>
            </CardContent>
          </Card>

          <p className="text-center text-xs text-muted-foreground mt-6">
            © 2024 فوردنتست. جميع الحقوق محفوظة.
          </p>
        </div>
      </div>
    );
  }

  // Login Screen
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
          <CardHeader className="text-center pb-4">
            <CardTitle className="text-xl">
              {isSignUp ? "إنشاء حساب جديد" : "مرحباً بعودتك"}
            </CardTitle>
            <CardDescription>
              {isSignUp
                ? "أنشئ حساباً جديداً للوصول إلى نظام إدارة العيادة"
                : "قم بتسجيل الدخول للوصول إلى نظام إدارة العيادة"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">البريد الإلكتروني</Label>
                <div className="relative">
                  <Mail className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                  <Input
                    id="email" type="email" placeholder="doctor@example.com"
                    value={loginForm.email}
                    onChange={(e) => setLoginForm(prev => ({ ...prev, email: e.target.value }))}
                    className="pr-10" required disabled={isSubmitting} autoComplete="email"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">كلمة المرور</Label>
                <div className="relative">
                  <Input
                    id="password" type={showPassword ? "text" : "password"} placeholder="••••••••"
                    value={loginForm.password}
                    onChange={(e) => setLoginForm(prev => ({ ...prev, password: e.target.value }))}
                    className="pl-10" required disabled={isSubmitting} autoComplete="current-password"
                  />
                  <Button
                    type="button" variant="ghost" size="sm"
                    className="absolute left-0 top-0 h-full px-3 hover:bg-transparent"
                    onClick={() => setShowPassword(!showPassword)}
                    disabled={isSubmitting}
                    aria-label={showPassword ? "إخفاء كلمة المرور" : "إظهار كلمة المرور"}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4 text-muted-foreground" /> : <Eye className="h-4 w-4 text-muted-foreground" />}
                  </Button>
                </div>
              </div>

              <Button type="submit" className="w-full" disabled={isSubmitting || loading}>
                {isSubmitting
                  ? (isSignUp ? "جاري التسجيل..." : "جاري تسجيل الدخول...")
                  : (isSignUp ? "إنشاء حساب" : "تسجيل الدخول")}
              </Button>
            </form>

            <div className="mt-4 text-center">
              <Button
                type="button" variant="link"
                onClick={() => setIsSignUp(!isSignUp)}
                disabled={isSubmitting}
                className="text-sm text-muted-foreground hover:text-primary"
              >
                {isSignUp ? "لديك حساب بالفعل؟ تسجيل الدخول" : "ليس لديك حساب؟ إنشاء حساب جديد"}
              </Button>
            </div>

            <div className="mt-6 p-4 bg-muted/50 rounded-lg border border-border/50">
              <div className="flex items-center gap-2 mb-2">
                <Clock className="w-4 h-4 text-primary" />
                <span className="text-sm font-medium">ملاحظة هامة</span>
              </div>
              <p className="text-xs text-muted-foreground">
                يتطلب تسجيل الدخول موافقة مسبقة من إدارة النظام.
              </p>
            </div>
          </CardContent>
        </Card>

        <p className="text-center text-xs text-muted-foreground mt-6">
          © 2024 فوردنتست. جميع الحقوق محفوظة.
        </p>
      </div>
    </div>
  );
}
