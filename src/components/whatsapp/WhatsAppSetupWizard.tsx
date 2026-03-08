import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import {
  MessageSquare, Key, Phone, Globe, Shield, CheckCircle2,
  XCircle, Loader2, Copy, ExternalLink, RefreshCw, Eye, EyeOff,
  ArrowRight, ArrowLeft, Webhook
} from "lucide-react";

interface WhatsAppConfig {
  id: string;
  clinic_id: string;
  access_token: string;
  phone_number_id: string;
  business_account_id: string | null;
  webhook_verify_token: string;
  webhook_secret: string | null;
  display_phone_number: string | null;
  business_name: string | null;
  is_active: boolean;
  is_verified: boolean;
  last_verified_at: string | null;
}

export default function WhatsAppSetupWizard({ clinicId }: { clinicId: string | null }) {
  const [step, setStep] = useState(1);
  const [showToken, setShowToken] = useState(false);
  const [testPhone, setTestPhone] = useState("");
  const [testMessage, setTestMessage] = useState("مرحباً! هذه رسالة تجريبية من نظام العيادة 🦷");
  const [formData, setFormData] = useState({
    access_token: "",
    phone_number_id: "",
    business_account_id: "",
    display_phone_number: "",
    business_name: "",
    webhook_secret: "",
  });
  const queryClient = useQueryClient();

  const { data: config, isLoading } = useQuery({
    queryKey: ["whatsapp-config", clinicId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("whatsapp_config")
        .select("*")
        .eq("clinic_id", clinicId!)
        .maybeSingle();
      if (error) throw error;
      if (data) {
        setFormData({
          access_token: data.access_token || "",
          phone_number_id: data.phone_number_id || "",
          business_account_id: data.business_account_id || "",
          display_phone_number: data.display_phone_number || "",
          business_name: data.business_name || "",
          webhook_secret: data.webhook_secret || "",
        });
      }
      return data as WhatsAppConfig | null;
    },
    enabled: !!clinicId,
  });

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!clinicId) throw new Error("لا توجد عيادة محددة");
      const payload = {
        clinic_id: clinicId,
        access_token: formData.access_token,
        phone_number_id: formData.phone_number_id,
        business_account_id: formData.business_account_id || null,
        display_phone_number: formData.display_phone_number || null,
        business_name: formData.business_name || null,
        webhook_secret: formData.webhook_secret || null,
        is_active: true,
      };

      if (config?.id) {
        const { error } = await supabase
          .from("whatsapp_config")
          .update(payload)
          .eq("id", config.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("whatsapp_config")
          .insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["whatsapp-config"] });
      toast.success("تم حفظ إعدادات واتساب بنجاح");
      setStep(3);
    },
    onError: (e: Error) => toast.error("فشل الحفظ: " + e.message),
  });

  const verifyMutation = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.functions.invoke("send-whatsapp", {
        body: {
          action: "send",
          phone: testPhone,
          message: testMessage,
          clinic_id: clinicId,
        },
      });
      if (error) throw error;
      if (!data?.success) throw new Error(data?.error || "فشل الإرسال");
      return data;
    },
    onSuccess: () => {
      toast.success("تم إرسال الرسالة التجريبية بنجاح! ✅");
      // Mark as verified
      if (config?.id) {
        supabase
          .from("whatsapp_config")
          .update({ is_verified: true, last_verified_at: new Date().toISOString() })
          .eq("id", config.id)
          .then(() => queryClient.invalidateQueries({ queryKey: ["whatsapp-config"] }));
      }
    },
    onError: (e: Error) => toast.error("فشل الاختبار: " + e.message),
  });

  const webhookUrl = `https://${import.meta.env.VITE_SUPABASE_PROJECT_ID}.supabase.co/functions/v1/whatsapp-webhook`;

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`تم نسخ ${label}`);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const totalSteps = 4;

  return (
    <div className="space-y-6" dir="rtl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <MessageSquare className="h-6 w-6 text-green-600" />
            إعداد واتساب بزنس API
          </h2>
          <p className="text-muted-foreground mt-1">
            ربط عيادتك مع واتساب لإرسال الرسائل والتذكيرات تلقائياً
          </p>
        </div>
        {config && (
          <Badge variant={config.is_verified ? "default" : "secondary"} className="gap-1">
            {config.is_verified ? (
              <><CheckCircle2 className="h-3 w-3" /> متصل ومفعّل</>
            ) : (
              <><XCircle className="h-3 w-3" /> غير مُتحقق</>
            )}
          </Badge>
        )}
      </div>

      {/* Steps indicator */}
      <div className="flex items-center gap-2">
        {[1, 2, 3, 4].map((s) => (
          <div key={s} className="flex items-center gap-2">
            <button
              onClick={() => setStep(s)}
              className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-semibold transition-colors ${
                step === s
                  ? "bg-primary text-primary-foreground"
                  : step > s
                  ? "bg-green-600 text-white"
                  : "bg-muted text-muted-foreground"
              }`}
            >
              {step > s ? "✓" : s}
            </button>
            {s < totalSteps && (
              <div className={`h-0.5 w-8 ${step > s ? "bg-green-600" : "bg-muted"}`} />
            )}
          </div>
        ))}
        <span className="text-sm text-muted-foreground mr-2">
          {step === 1 && "بيانات API"}
          {step === 2 && "إعدادات Webhook"}
          {step === 3 && "اختبار الاتصال"}
          {step === 4 && "الحالة والإدارة"}
        </span>
      </div>

      {/* Step 1: API Credentials */}
      {step === 1 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Key className="h-5 w-5" />
              بيانات واتساب بزنس API
            </CardTitle>
            <CardDescription>
              أدخل بيانات حسابك من{" "}
              <a
                href="https://developers.facebook.com/apps/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary underline inline-flex items-center gap-1"
              >
                Meta Developer Portal <ExternalLink className="h-3 w-3" />
              </a>
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="space-y-2">
              <Label className="font-semibold">Access Token *</Label>
              <div className="relative">
                <Input
                  type={showToken ? "text" : "password"}
                  value={formData.access_token}
                  onChange={(e) => setFormData({ ...formData, access_token: e.target.value })}
                  placeholder="EAAxxxxxxx..."
                  className="pl-10"
                />
                <button
                  onClick={() => setShowToken(!showToken)}
                  className="absolute left-2 top-1/2 -translate-y-1/2 text-muted-foreground"
                >
                  {showToken ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              <p className="text-xs text-muted-foreground">
                يمكنك الحصول عليه من: WhatsApp → API Setup → Temporary/Permanent Access Token
              </p>
            </div>

            <div className="space-y-2">
              <Label className="font-semibold">Phone Number ID *</Label>
              <Input
                value={formData.phone_number_id}
                onChange={(e) => setFormData({ ...formData, phone_number_id: e.target.value })}
                placeholder="1234567890..."
              />
              <p className="text-xs text-muted-foreground">
                من: WhatsApp → API Setup → Phone number ID
              </p>
            </div>

            <Separator />

            <div className="space-y-2">
              <Label>Business Account ID (اختياري)</Label>
              <Input
                value={formData.business_account_id}
                onChange={(e) => setFormData({ ...formData, business_account_id: e.target.value })}
                placeholder="1234567890..."
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>اسم النشاط التجاري</Label>
                <Input
                  value={formData.business_name}
                  onChange={(e) => setFormData({ ...formData, business_name: e.target.value })}
                  placeholder="عيادة الأسنان"
                />
              </div>
              <div className="space-y-2">
                <Label>رقم الهاتف المعروض</Label>
                <Input
                  value={formData.display_phone_number}
                  onChange={(e) => setFormData({ ...formData, display_phone_number: e.target.value })}
                  placeholder="+964 7xx xxx xxxx"
                />
              </div>
            </div>

            <div className="flex justify-start">
              <Button
                onClick={() => setStep(2)}
                disabled={!formData.access_token || !formData.phone_number_id}
                className="gap-2"
              >
                التالي: إعدادات Webhook
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 2: Webhook */}
      {step === 2 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Webhook className="h-5 w-5" />
              إعدادات Webhook
            </CardTitle>
            <CardDescription>
              قم بإعداد الـ Webhook في Meta Developer Portal لاستقبال الرسائل والتحديثات
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            {/* Webhook URL */}
            <div className="space-y-2">
              <Label className="font-semibold">Webhook Callback URL</Label>
              <div className="flex gap-2">
                <Input value={webhookUrl} readOnly className="font-mono text-sm bg-muted" />
                <Button variant="outline" size="icon" onClick={() => copyToClipboard(webhookUrl, "Webhook URL")}>
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                انسخ هذا الرابط والصقه في حقل Callback URL في إعدادات Webhook
              </p>
            </div>

            {/* Verify Token */}
            <div className="space-y-2">
              <Label className="font-semibold">Verify Token</Label>
              <div className="flex gap-2">
                <Input
                  value={config?.webhook_verify_token || "سيتم توليده تلقائياً عند الحفظ"}
                  readOnly
                  className="font-mono text-sm bg-muted"
                />
                {config?.webhook_verify_token && (
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => copyToClipboard(config.webhook_verify_token, "Verify Token")}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                )}
              </div>
              <p className="text-xs text-muted-foreground">
                انسخ هذا الرمز والصقه في حقل Verify Token في إعدادات Webhook
              </p>
            </div>

            {/* App Secret (optional) */}
            <div className="space-y-2">
              <Label>App Secret (اختياري - للتحقق من التوقيع)</Label>
              <Input
                type="password"
                value={formData.webhook_secret}
                onChange={(e) => setFormData({ ...formData, webhook_secret: e.target.value })}
                placeholder="xxxxxxxxxx"
              />
              <p className="text-xs text-muted-foreground">
                من Settings → Basic → App Secret - يُستخدم للتحقق من صحة الرسائل الواردة
              </p>
            </div>

            <Separator />

            {/* Instructions */}
            <div className="bg-muted/50 rounded-lg p-4 space-y-3">
              <h4 className="font-semibold text-sm">📋 خطوات الإعداد في Meta:</h4>
              <ol className="text-sm space-y-2 list-decimal list-inside text-muted-foreground">
                <li>اذهب إلى <strong>Meta Developer Portal → App → WhatsApp → Configuration</strong></li>
                <li>في قسم <strong>Webhook</strong>، اضغط <strong>Edit</strong></li>
                <li>الصق <strong>Callback URL</strong> في الحقل المخصص</li>
                <li>الصق <strong>Verify Token</strong> في حقل التحقق</li>
                <li>اضغط <strong>Verify and Save</strong></li>
                <li>فعّل الاشتراك في: <code>messages</code>, <code>message_deliveries</code>, <code>message_reads</code></li>
              </ol>
            </div>

            <div className="flex justify-between">
              <Button variant="outline" onClick={() => setStep(1)} className="gap-2">
                <ArrowRight className="h-4 w-4" />
                السابق
              </Button>
              <Button
                onClick={() => saveMutation.mutate()}
                disabled={saveMutation.isPending || !formData.access_token || !formData.phone_number_id}
                className="gap-2"
              >
                {saveMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Shield className="h-4 w-4" />}
                حفظ والمتابعة
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 3: Test */}
      {step === 3 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Phone className="h-5 w-5" />
              اختبار الاتصال
            </CardTitle>
            <CardDescription>
              أرسل رسالة تجريبية للتأكد من صحة الإعدادات
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="space-y-2">
              <Label className="font-semibold">رقم الهاتف للاختبار</Label>
              <Input
                value={testPhone}
                onChange={(e) => setTestPhone(e.target.value)}
                placeholder="07xxxxxxxxx"
                dir="ltr"
              />
              <p className="text-xs text-muted-foreground">
                ⚠️ يجب أن يكون الرقم مسجل مسبقاً في واتساب ومضاف كـ Test Number في Meta
              </p>
            </div>

            <div className="space-y-2">
              <Label>نص الرسالة التجريبية</Label>
              <Input
                value={testMessage}
                onChange={(e) => setTestMessage(e.target.value)}
              />
            </div>

            <Button
              onClick={() => verifyMutation.mutate()}
              disabled={!testPhone || verifyMutation.isPending}
              className="gap-2 w-full"
              variant={config?.is_verified ? "outline" : "default"}
            >
              {verifyMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
              إرسال رسالة تجريبية
            </Button>

            {config?.is_verified && (
              <div className="bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 rounded-lg p-4 flex items-center gap-3">
                <CheckCircle2 className="h-6 w-6 text-green-600" />
                <div>
                  <p className="font-semibold text-green-800 dark:text-green-200">الاتصال ناجح!</p>
                  <p className="text-sm text-green-600 dark:text-green-400">
                    تم التحقق في {config.last_verified_at ? new Date(config.last_verified_at).toLocaleString("ar-IQ") : ""}
                  </p>
                </div>
              </div>
            )}

            <div className="flex justify-between">
              <Button variant="outline" onClick={() => setStep(2)} className="gap-2">
                <ArrowRight className="h-4 w-4" />
                السابق
              </Button>
              <Button onClick={() => setStep(4)} className="gap-2">
                الحالة والإدارة
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 4: Status */}
      {step === 4 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Globe className="h-5 w-5" />
              حالة الربط والإدارة
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <InfoRow label="حالة الاتصال" value={config?.is_active ? "مفعّل" : "غير مفعّل"} ok={!!config?.is_active} />
              <InfoRow label="حالة التحقق" value={config?.is_verified ? "تم التحقق" : "لم يتم التحقق"} ok={!!config?.is_verified} />
              <InfoRow label="Phone Number ID" value={config?.phone_number_id || "—"} />
              <InfoRow label="اسم النشاط" value={config?.business_name || "—"} />
              <InfoRow label="رقم الهاتف" value={config?.display_phone_number || "—"} />
              <InfoRow
                label="آخر تحقق"
                value={config?.last_verified_at ? new Date(config.last_verified_at).toLocaleString("ar-IQ") : "لم يتم"}
              />
            </div>

            <Separator />

            <div className="flex gap-3 flex-wrap">
              <Button variant="outline" onClick={() => setStep(1)} className="gap-2">
                <RefreshCw className="h-4 w-4" />
                تعديل الإعدادات
              </Button>
              <Button variant="outline" onClick={() => setStep(3)} className="gap-2">
                <Phone className="h-4 w-4" />
                إعادة الاختبار
              </Button>
              {config?.id && (
                <Button
                  variant={config.is_active ? "destructive" : "default"}
                  onClick={async () => {
                    await supabase
                      .from("whatsapp_config")
                      .update({ is_active: !config.is_active })
                      .eq("id", config.id);
                    queryClient.invalidateQueries({ queryKey: ["whatsapp-config"] });
                    toast.success(config.is_active ? "تم تعطيل واتساب" : "تم تفعيل واتساب");
                  }}
                >
                  {config.is_active ? "تعطيل الاتصال" : "تفعيل الاتصال"}
                </Button>
              )}
            </div>

            <div className="flex justify-between">
              <Button variant="outline" onClick={() => setStep(3)} className="gap-2">
                <ArrowRight className="h-4 w-4" />
                السابق
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function InfoRow({ label, value, ok }: { label: string; value: string; ok?: boolean }) {
  return (
    <div className="flex items-center justify-between bg-muted/50 rounded-lg px-4 py-3">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className="font-medium text-sm flex items-center gap-1.5">
        {ok !== undefined && (
          ok ? <CheckCircle2 className="h-4 w-4 text-green-600" /> : <XCircle className="h-4 w-4 text-destructive" />
        )}
        {value}
      </span>
    </div>
  );
}
