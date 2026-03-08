import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Stethoscope } from "lucide-react";
import { Doctor } from "@/hooks/useDoctors";

interface DoctorSelectProps {
  doctors: Doctor[] | undefined;
  value: string;
  onValueChange: (value: string) => void;
  label?: string;
  required?: boolean;
  className?: string;
}

const DoctorSelect = ({ doctors, value, onValueChange, label = "الطبيب المعالج", required = false, className }: DoctorSelectProps) => {
  return (
    <div className={`space-y-2 ${className || ''}`}>
      {label && <Label className="flex items-center gap-1"><Stethoscope className="w-3 h-3" />{label}{required && ' *'}</Label>}
      <Select value={value} onValueChange={onValueChange}>
        <SelectTrigger>
          <SelectValue placeholder="اختر الطبيب" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="none">بدون طبيب محدد</SelectItem>
          {doctors?.map((doctor) => (
            <SelectItem key={doctor.id} value={doctor.id}>
              د. {doctor.full_name} {doctor.specialization ? `- ${doctor.specialization}` : ''}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
};

export default DoctorSelect;
