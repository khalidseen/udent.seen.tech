import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Check, Loader2 } from "lucide-react";
import DoctorSelect from "./DoctorSelect";
import { Doctor } from "@/hooks/useDoctors";

interface ApproveRequestDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  patientName: string;
  preferredDate: string;
  preferredTime: string;
  doctors: Doctor[] | undefined;
  onConfirm: (data: ApprovalData) => void;
  loading: boolean;
}

export interface ApprovalData {
  doctorId: string;
  duration: number;
  treatmentType: string;
  date: string;
  time: string;
}

const treatmentTypes = [
  "استشارة",
  "فحص دوري",
  "تنظيف",
  "حشو",
  "خلع",
  "علاج عصب",
  "تاج أو جسر",
  "تقويم",
  "زراعة",
  "أخرى"
];

const ApproveRequestDialog = ({
  open,
  onOpenChange,
  patientName,
  preferredDate,
  preferredTime,
  doctors,
  onConfirm,
  loading
}: ApproveRequestDialogProps) => {
  const [data, setData] = useState<ApprovalData>({
    doctorId: 'none',
    duration: 30,
    treatmentType: 'استشارة',
    date: preferredDate,
    time: preferredTime
  });

  const handleConfirm = () => {
    onConfirm(data);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>تأكيد قبول الموعد - {patientName}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <DoctorSelect
            doctors={doctors}
            value={data.doctorId}
            onValueChange={(v) => setData(prev => ({ ...prev, doctorId: v }))}
          />

          <div className="space-y-2">
            <Label>نوع العلاج</Label>
            <Select value={data.treatmentType} onValueChange={(v) => setData(prev => ({ ...prev, treatmentType: v }))}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {treatmentTypes.map(t => (
                  <SelectItem key={t} value={t}>{t}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>التاريخ</Label>
              <Input
                type="date"
                value={data.date}
                onChange={(e) => setData(prev => ({ ...prev, date: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label>الوقت</Label>
              <Input
                type="time"
                value={data.time}
                onChange={(e) => setData(prev => ({ ...prev, time: e.target.value }))}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>المدة (دقيقة)</Label>
            <Select value={String(data.duration)} onValueChange={(v) => setData(prev => ({ ...prev, duration: Number(v) }))}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="15">15 دقيقة</SelectItem>
                <SelectItem value="30">30 دقيقة</SelectItem>
                <SelectItem value="45">45 دقيقة</SelectItem>
                <SelectItem value="60">60 دقيقة</SelectItem>
                <SelectItem value="90">90 دقيقة</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Button onClick={handleConfirm} disabled={loading} className="w-full">
            {loading ? (
              <Loader2 className="w-4 h-4 ml-2 animate-spin" />
            ) : (
              <Check className="w-4 h-4 ml-2" />
            )}
            {loading ? 'جاري الإنشاء...' : 'تأكيد وإنشاء الموعد'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ApproveRequestDialog;
