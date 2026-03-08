import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Send, Phone, Loader2, CheckCircle, XCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { sendWhatsAppMessage } from "@/lib/whatsapp";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface WhatsAppReminderDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  patientName: string;
  patientPhone?: string;
  patientId?: string;
  totalCost: number;
  totalPaid: number;
  remaining: number;
}

export const WhatsAppReminderDialog = ({
  open,
  onOpenChange,
  patientName,
  patientPhone,
  patientId,
  totalCost,
  totalPaid,
  remaining
}: WhatsAppReminderDialogProps) => {
  const { toast } = useToast();
  const [phoneNumber, setPhoneNumber] = useState(patientPhone || "");
  const [customMessage, setCustomMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState<'success' | 'error' | null>(null);

  const { data: profile } = useQuery({
    queryKey: ['profile-wa'],
    queryFn: async () => {
      const { data } = await supabase.rpc('get_current_user_profile');
      return data;
    }
  });

  const generateMessage = () => {
    return `السلام عليكم ${patientName}،

هذا تذكير بالمبلغ المتبقي عليك:

💰 إجمالي التكلفة: ${totalCost.toLocaleString()} دينار عراقي
✅ المدفوع: ${totalPaid.toLocaleString()} دينار عراقي  
⏰ المتبقي: ${remaining.toLocaleString()} دينار عراقي
${customMessage ? `\n${customMessage}\n` : ''}
يرجى التواصل معنا لتحديد موعد الدفع.
شكراً لك 🙏`;
  };

  const handleSendWhatsApp = async () => {
    if (!phoneNumber) {
      toast({ title: "خطأ", description: "يرجى إدخال رقم الهاتف", variant: "destructive" });
      return;
    }

    if (!profile?.id) {
      toast({ title: "خطأ", description: "لم يتم تحميل بيانات العيادة", variant: "destructive" });
      return;
    }

    setSending(true);
    setResult(null);

    try {
      const res = await sendWhatsAppMessage({
        phone: phoneNumber,
        message: generateMessage(),
        patient_id: patientId,
        clinic_id: profile.id,
      });

      if (res.success) {
        setResult('success');
        toast({ title: "تم بنجاح ✅", description: "تم إرسال رسالة الواتساب بنجاح" });
        setTimeout(() => onOpenChange(false), 1500);
      } else {
        setResult('error');
        toast({ title: "فشل الإرسال", description: res.error || "حدث خطأ أثناء الإرسال", variant: "destructive" });
      }
    } catch (err) {
      setResult('error');
      toast({ title: "خطأ", description: "فشل الاتصال بخدمة الواتساب", variant: "destructive" });
    } finally {
      setSending(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Send className="h-5 w-5 text-green-600" />
            إرسال تذكير واتساب - {patientName}
          </DialogTitle>
          <DialogDescription>إرسال تذكير بالمبالغ المستحقة عبر WhatsApp Business API</DialogDescription>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Financial Summary */}
          <Card className="bg-gradient-to-r from-green-50 to-blue-50 dark:from-green-950/20 dark:to-blue-950/20">
            <CardContent className="p-4">
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <p className="text-sm text-muted-foreground">إجمالي التكلفة</p>
                  <p className="text-lg font-bold text-orange-600">{totalCost.toLocaleString()} د.ع</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">المدفوع</p>
                  <p className="text-lg font-bold text-green-600">{totalPaid.toLocaleString()} د.ع</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">المتبقي</p>
                  <p className="text-lg font-bold text-red-600">{remaining.toLocaleString()} د.ع</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Phone Number */}
          <div className="space-y-2">
            <Label htmlFor="phone" className="flex items-center gap-2">
              <Phone className="h-4 w-4" />
              رقم الهاتف (واتساب)
            </Label>
            <Input
              id="phone"
              type="tel"
              placeholder="07xxxxxxxx أو +964xxxxxxxxx"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              dir="ltr"
            />
            <p className="text-xs text-muted-foreground">
              سيتم إرسال الرسالة مباشرة عبر WhatsApp Business API
            </p>
          </div>

          {/* Custom Message */}
          <div className="space-y-2">
            <Label htmlFor="customMessage">رسالة إضافية (اختيارية)</Label>
            <Textarea
              id="customMessage"
              placeholder="أضف أي رسالة إضافية تريد إرفاقها..."
              value={customMessage}
              onChange={(e) => setCustomMessage(e.target.value)}
              rows={3}
            />
          </div>

          {/* Message Preview */}
          <div className="space-y-2">
            <Label>معاينة الرسالة:</Label>
            <div className="bg-muted/50 p-4 rounded-lg text-sm border" dir="rtl">
              <pre className="whitespace-pre-wrap font-sans">{generateMessage()}</pre>
            </div>
          </div>

          {/* Result indicator */}
          {result && (
            <div className={`flex items-center gap-2 p-3 rounded-lg ${result === 'success' ? 'bg-green-50 text-green-700 dark:bg-green-950/30' : 'bg-red-50 text-red-700 dark:bg-red-950/30'}`}>
              {result === 'success' ? <CheckCircle className="w-5 h-5" /> : <XCircle className="w-5 h-5" />}
              {result === 'success' ? 'تم إرسال الرسالة بنجاح ✅' : 'فشل إرسال الرسالة'}
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              إلغاء
            </Button>
            <Button 
              onClick={handleSendWhatsApp} 
              className="bg-green-600 hover:bg-green-700"
              disabled={sending}
            >
              {sending ? <Loader2 className="h-4 w-4 ml-2 animate-spin" /> : <Send className="h-4 w-4 ml-2" />}
              {sending ? 'جاري الإرسال...' : 'إرسال واتساب'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
