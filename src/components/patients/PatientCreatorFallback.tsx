import React from 'react';
import { Badge } from '@/components/ui/badge';
import { UserCheck, AlertCircle } from 'lucide-react';
import { Patient } from '@/hooks/usePatients';

interface PatientCreatorFallbackProps {
  patient: Patient;
}

const PatientCreatorFallback: React.FC<PatientCreatorFallbackProps> = ({ patient }) => {
  
  // البحث عن معلومات المنشئ الحقيقية في الملاحظات
  const extractCreatorFromNotes = (notes?: string) => {
    if (!notes) return null;
    
    // البحث عن النمط الجديد للمنشئ
    const creatorMatch = notes.match(/\[المنشئ: (.+?) - (.+?) - (.+?)\]/);
    if (creatorMatch) {
      return {
        name: creatorMatch[1],
        role: creatorMatch[2],
        date: creatorMatch[3]
      };
    }
    
    // البحث عن النمط القديم للتوافق
    const oldCreatorMatch = notes.match(/\[تم الإنشاء بواسطة: (.+?) - (.+?)\]/);
    if (oldCreatorMatch) {
      return {
        name: oldCreatorMatch[1],
        role: oldCreatorMatch[2],
        date: 'غير محدد'
      };
    }
    
    return null;
  };

  const creatorInfo = extractCreatorFromNotes(patient.notes);
  
  // عرض معلومات المنشئ الحقيقية إذا كانت موجودة
  if (creatorInfo) {
    return (
      <div className="space-y-1">
        <p className="text-xs text-muted-foreground">أنشأ بواسطة</p>
        <div className="flex items-center gap-2">
          <UserCheck className="w-3.5 h-3.5 text-green-600" />
          <span className="text-sm font-medium text-foreground line-clamp-1">
            {creatorInfo.name}
          </span>
          <Badge variant="outline" className="text-xs border-green-200 text-green-700">
            {creatorInfo.role}
          </Badge>
        </div>
        {creatorInfo.date !== 'غير محدد' && (
          <p className="text-xs text-muted-foreground">
            تاريخ الإنشاء: {creatorInfo.date}
          </p>
        )}
      </div>
    );
  }

  // عرض رسالة تحتاج ربط إذا لم تكن هناك معلومات منشئ
  return (
    <div className="space-y-1">
      <p className="text-xs text-muted-foreground">أنشأ بواسطة</p>
      <div className="flex items-center gap-2">
        <AlertCircle className="w-3.5 h-3.5 text-amber-500" />
        <span className="text-sm font-medium text-amber-600">
          يحتاج ربط
        </span>
        <Badge variant="outline" className="text-xs text-amber-600 border-amber-300">
          استخدم زر "ربط المرضى"
        </Badge>
      </div>
      <p className="text-xs text-amber-600">
        يرجى الضغط على زر "ربط المرضى" أعلى الصفحة
      </p>
    </div>
  );
};

export default PatientCreatorFallback;
