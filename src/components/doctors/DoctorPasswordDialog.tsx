import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface DoctorPasswordDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  doctorEmail: string;
  doctorName?: string;
  onSuccess?: () => void;
}

export default function DoctorPasswordDialog({ open, onOpenChange, doctorEmail, doctorName, onSuccess }: DoctorPasswordDialogProps) {
  const { toast } = useToast();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!doctorEmail) {
      toast({ title: "بريد الطبيب غير متوفر", variant: "destructive" });
      return;
    }
    if (password.length < 6) {
      toast({ title: "كلمة المرور قصيرة", description: "يجب أن تكون 6 أحرف على الأقل", variant: "destructive" });
      return;
    }
    if (password !== confirm) {
      toast({ title: "عدم تطابق", description: "تأكيد كلمة المرور غير مطابق", variant: "destructive" });
      return;
    }

    try {
      setLoading(true);
      const { data, error } = await supabase.functions.invoke('admin-set-doctor-password', {
        body: { email: doctorEmail, password }
      });

      if (error) throw error;

      toast({ title: "تم الحفظ", description: `تم تعيين كلمة المرور ${doctorName ? 'لـ ' + doctorName : ''} بنجاح` });
      onSuccess?.();
      onOpenChange(false);
      setPassword("");
      setConfirm("");
    } catch (e: any) {
      toast({ title: "خطأ", description: e?.message || "تعذر تعيين كلمة المرور", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>تعيين/تغيير كلمة المرور للطبيب</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div>
            <label className="text-sm text-muted-foreground">بريد الطبيب</label>
            <Input value={doctorEmail} disabled />
          </div>
          <div>
            <label className="text-sm">كلمة المرور الجديدة</label>
            <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••" />
          </div>
          <div>
            <label className="text-sm">تأكيد كلمة المرور</label>
            <Input type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} placeholder="••••••" />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>إلغاء</Button>
          <Button onClick={handleSubmit} disabled={loading || !doctorEmail}>حفظ</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
