import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  MessageSquare, Mail, Phone, Globe, CheckCircle2, XCircle,
  ArrowLeft, Settings, Activity, Send, Shield, Webhook, Bell
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import WhatsAppSetupWizard from "@/components/whatsapp/WhatsAppSetupWizard";

export default function CommunicationChannels() {
  const navigate = useNavigate();

  const { data: profile } = useQuery({
    queryKey: ["current-profile"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;
      const { data } = await supabase
        .from("profiles")
        .select("id, clinic_id")
        .eq("user_id", user.id)
        .single();
      return data;
    },
  });

  const clinicId = profile?.clinic_id || profile?.id;

  const { data: waConfig } = useQuery({
    queryKey: ["whatsapp-config", clinicId],
    queryFn: async () => {
      const { data } = await supabase
        .from("whatsapp_config")
        .select("*")
        .eq("clinic_id", clinicId!)
        .maybeSingle();
      return data;
    },
    enabled: !!clinicId,
  });

  const { data: messageStats } = useQuery({
    queryKey: ["communication-stats", clinicId],
    queryFn: async () => {
      const { count: totalMessages } = await supabase
        .from("communication_logs")
        .select("*", { count: "exact", head: true })
        .eq("clinic_id", clinicId!);

      const { count: whatsappMessages } = await supabase
        .from("communication_logs")
        .select("*", { count: "exact", head: true })
        .eq("clinic_id", clinicId!)
        .eq("channel", "whatsapp_api");

      const { count: deliveredMessages } = await supabase
        .from("communication_logs")
        .select("*", { count: "exact", head: true })
        .eq("clinic_id", clinicId!)
        .eq("status", "delivered");

      const { count: failedMessages } = await supabase
        .from("communication_logs")
        .select("*", { count: "exact", head: true })
        .eq("clinic_id", clinicId!)
        .eq("status", "failed");

      return {
        total: totalMessages || 0,
        whatsapp: whatsappMessages || 0,
        delivered: deliveredMessages || 0,
        failed: failedMessages || 0,
      };
    },
    enabled: !!clinicId,
  });

  const channels = [
    {
      id: "whatsapp",
      name: "واتساب بزنس API",
      icon: MessageSquare,
      description: "إرسال رسائل وتذكيرات تلقائية عبر واتساب",
      connected: !!waConfig?.is_active,
      verified: !!waConfig?.is_verified,
      color: "text-green-600",
      bgColor: "bg-green-50",
      stats: messageStats?.whatsapp || 0,
    },
    {
      id: "sms",
      name: "الرسائل النصية SMS",
      icon: Phone,
      description: "إرسال تذكيرات عبر الرسائل النصية القصيرة",
      connected: false,
      verified: false,
      color: "text-blue-600",
      bgColor: "bg-blue-50",
      stats: 0,
      comingSoon: true,
    },
    {
      id: "email",
      name: "البريد الإلكتروني",
      icon: Mail,
      description: "إرسال إشعارات وتقارير عبر البريد الإلكتروني",
      connected: false,
      verified: false,
      color: "text-purple-600",
      bgColor: "bg-purple-50",
      stats: 0,
      comingSoon: true,
    },
  ];

  return (
    <div className="container mx-auto p-6 space-y-6" dir="rtl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-3">
              <Globe className="h-8 w-8 text-primary" />
              قنوات الاتصال
            </h1>
            <p className="text-muted-foreground mt-1">
              إدارة وربط قنوات التواصل مع المرضى
            </p>
          </div>
        </div>
        <Button variant="outline" onClick={() => navigate("/communication-center")} className="gap-2">
          <Send className="h-4 w-4" />
          مركز الرسائل
        </Button>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">إجمالي الرسائل</p>
                <p className="text-2xl font-bold">{messageStats?.total || 0}</p>
              </div>
              <Activity className="h-8 w-8 text-primary/30" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">عبر واتساب</p>
                <p className="text-2xl font-bold text-green-600">{messageStats?.whatsapp || 0}</p>
              </div>
              <MessageSquare className="h-8 w-8 text-green-600/30" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">تم التوصيل</p>
                <p className="text-2xl font-bold text-blue-600">{messageStats?.delivered || 0}</p>
              </div>
              <CheckCircle2 className="h-8 w-8 text-blue-600/30" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">فشل الإرسال</p>
                <p className="text-2xl font-bold text-red-600">{messageStats?.failed || 0}</p>
              </div>
              <XCircle className="h-8 w-8 text-red-600/30" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Channels Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {channels.map((channel) => (
          <Card key={channel.id} className={`relative overflow-hidden ${channel.comingSoon ? 'opacity-60' : ''}`}>
            {channel.comingSoon && (
              <div className="absolute top-3 left-3 z-10">
                <Badge variant="secondary" className="text-xs">قريباً</Badge>
              </div>
            )}
            <CardHeader className="pb-3">
              <div className="flex items-center gap-3">
                <div className={`p-3 rounded-xl ${channel.bgColor}`}>
                  <channel.icon className={`h-6 w-6 ${channel.color}`} />
                </div>
                <div className="flex-1">
                  <CardTitle className="text-base">{channel.name}</CardTitle>
                  <CardDescription className="text-xs mt-0.5">{channel.description}</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {channel.connected ? (
                    <Badge variant="default" className="gap-1 bg-green-600">
                      <CheckCircle2 className="h-3 w-3" />
                      {channel.verified ? "متصل ومُتحقق" : "متصل"}
                    </Badge>
                  ) : (
                    <Badge variant="secondary" className="gap-1">
                      <XCircle className="h-3 w-3" />
                      غير متصل
                    </Badge>
                  )}
                </div>
                {channel.connected && (
                  <span className="text-xs text-muted-foreground">{channel.stats} رسالة</span>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Detailed Setup Tabs */}
      <Tabs defaultValue="whatsapp" className="space-y-4">
        <TabsList className="grid grid-cols-3 w-full max-w-lg">
          <TabsTrigger value="whatsapp" className="gap-2">
            <MessageSquare className="h-4 w-4" />
            واتساب
          </TabsTrigger>
          <TabsTrigger value="sms" disabled className="gap-2">
            <Phone className="h-4 w-4" />
            SMS
          </TabsTrigger>
          <TabsTrigger value="email" disabled className="gap-2">
            <Mail className="h-4 w-4" />
            بريد
          </TabsTrigger>
        </TabsList>

        <TabsContent value="whatsapp">
          <WhatsAppSetupWizard clinicId={clinicId || null} />
        </TabsContent>

        <TabsContent value="sms">
          <Card>
            <CardContent className="pt-6 text-center text-muted-foreground">
              <Phone className="h-12 w-12 mx-auto mb-4 opacity-30" />
              <p className="text-lg font-medium">خدمة الرسائل النصية قريباً</p>
              <p className="text-sm">سيتم إضافة دعم SMS في تحديث قادم</p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="email">
          <Card>
            <CardContent className="pt-6 text-center text-muted-foreground">
              <Mail className="h-12 w-12 mx-auto mb-4 opacity-30" />
              <p className="text-lg font-medium">خدمة البريد الإلكتروني قريباً</p>
              <p className="text-sm">سيتم إضافة دعم Email في تحديث قادم</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Webhook Info Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Webhook className="h-5 w-5" />
            معلومات الـ Webhook
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-muted/50 rounded-lg p-4 space-y-2">
              <p className="text-sm font-medium flex items-center gap-2">
                <Globe className="h-4 w-4" />
                Webhook URL
              </p>
              <code className="text-xs block bg-background p-2 rounded border font-mono break-all" dir="ltr">
                {`https://${import.meta.env.VITE_SUPABASE_PROJECT_ID}.supabase.co/functions/v1/whatsapp-webhook`}
              </code>
            </div>
            <div className="bg-muted/50 rounded-lg p-4 space-y-2">
              <p className="text-sm font-medium flex items-center gap-2">
                <Shield className="h-4 w-4" />
                Verify Token
              </p>
              <code className="text-xs block bg-background p-2 rounded border font-mono break-all" dir="ltr">
                {waConfig?.webhook_verify_token || "لم يتم الإعداد بعد"}
              </code>
            </div>
          </div>
          <div className="bg-muted/50 rounded-lg p-4 space-y-2">
            <p className="text-sm font-medium flex items-center gap-2">
              <Bell className="h-4 w-4" />
              الاشتراكات المطلوبة في Meta
            </p>
            <div className="flex flex-wrap gap-2">
              {["messages", "message_deliveries", "message_reads", "message_template_status_update"].map((sub) => (
                <Badge key={sub} variant="outline" className="font-mono text-xs">
                  {sub}
                </Badge>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
