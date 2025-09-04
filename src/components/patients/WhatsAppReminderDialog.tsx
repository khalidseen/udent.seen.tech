import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Send, Phone } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface WhatsAppReminderDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  patientName: string;
  patientPhone?: string;
  totalCost: number;
  totalPaid: number;
  remaining: number;
}

export const WhatsAppReminderDialog = ({
  open,
  onOpenChange,
  patientName,
  patientPhone,
  totalCost,
  totalPaid,
  remaining
}: WhatsAppReminderDialogProps) => {
  const { toast } = useToast();
  const [phoneNumber, setPhoneNumber] = useState(patientPhone || "");
  const [customMessage, setCustomMessage] = useState("");

  const generateMessage = () => {
    const baseMessage = `السلام عليكم ${patientName}،

هذا تذكير بالمبلغ المتبقي عليك:

💰 إجمالي التكلفة: ${totalCost.toLocaleString()} دينار عراقي
✅ المدفوع: ${totalPaid.toLocaleString()} دينار عراقي  
⏰ المتبقي: ${remaining.toLocaleString()} دينار عراقي

${customMessage ? `\n${customMessage}\n` : ''}

يرجى التواصل معنا لتحديد موعد الدفع.
شكراً لك 🙏`;

    return baseMessage;
  };

  const handleSendWhatsApp = () => {
    if (!phoneNumber) {
      toast({
        title: "خطأ",
        description: "يرجى إدخال رقم الهاتف",
        variant: "destructive"
      });
      return;
    }

    // Clean phone number (remove spaces, dashes, etc.)
    const cleanPhone = phoneNumber.replace(/[\s\-\(\)]/g, '');
    
    // Add country code if not present (assuming Iraq +964)
    let formattedPhone = cleanPhone;
    if (!cleanPhone.startsWith('+')) {
      if (cleanPhone.startsWith('964')) {
        formattedPhone = `+${cleanPhone}`;
      } else if (cleanPhone.startsWith('07')) {
        formattedPhone = `+964${cleanPhone.substring(1)}`;
      } else {
        formattedPhone = `+964${cleanPhone}`;
      }
    }

    const message = generateMessage();
    const whatsappUrl = `https://wa.me/${formattedPhone.replace('+', '')}?text=${encodeURIComponent(message)}`;
    
    window.open(whatsappUrl, '_blank');
    
    toast({
      title: "تم بنجاح",
      description: "تم فتح واتساب بالرسالة المُعدة"
    });
    
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Send className="h-5 w-5 text-green-600" />
            إرسال تذكير واتساب - {patientName}
          </DialogTitle>
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
              يمكنك إدخال الرقم بأي تنسيق (07xxxxxxxx أو +964xxxxxxxxx)
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

          {/* Action Buttons */}
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              إلغاء
            </Button>
            <Button onClick={handleSendWhatsApp} className="bg-green-600 hover:bg-green-700">
              <Send className="h-4 w-4 ml-2" />
              إرسال واتساب
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};