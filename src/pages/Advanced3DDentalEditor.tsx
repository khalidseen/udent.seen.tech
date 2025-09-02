import React from 'react';
import { useParams } from 'react-router-dom';
import { PageContainer } from '@/components/layout/PageContainer';
import { PageHeader } from '@/components/layout/PageHeader';
import { Advanced3DToothEditor } from '@/components/dental/Advanced3DToothEditor';
import { Card, CardContent } from '@/components/ui/card';
import { toast } from 'sonner';

export default function Advanced3DDentalEditor() {
  const { patientId, toothNumber } = useParams<{ 
    patientId: string; 
    toothNumber: string; 
  }>();

  if (!patientId || !toothNumber) {
    return (
      <PageContainer>
        <Card>
          <CardContent className="flex items-center justify-center h-64">
            <div className="text-center">
              <h3 className="text-lg font-semibold mb-2">معلومات غير مكتملة</h3>
              <p className="text-muted-foreground">
                يرجى التأكد من اختيار المريض ورقم السن
              </p>
            </div>
          </CardContent>
        </Card>
      </PageContainer>
    );
  }

  const handleSave = (modelData: any) => {
    console.log('Saving model data:', modelData);
    // هنا يمكن إضافة منطق حفظ البيانات في قاعدة البيانات
    toast.success('تم حفظ النموذج بنجاح');
  };

  const handleExport = (imageData: string) => {
    console.log('Exporting image:', imageData.substring(0, 50) + '...');
    // هنا يمكن إضافة منطق حفظ الصورة
    toast.success('تم تصدير الصورة بنجاح');
  };

  return (
    <PageContainer>
      <PageHeader
        title="محرر الأسنان ثلاثي الأبعاد المتطور"
        description={`تحرير ومعاينة السن رقم ${toothNumber} للمريض`}
      />
      
      <div className="space-y-6">
        <Advanced3DToothEditor
          toothNumber={toothNumber}
          patientId={patientId}
          onSave={handleSave}
          onExport={handleExport}
        />
      </div>
    </PageContainer>
  );
}