import React, { useState } from 'react';
import { PageContainer } from '@/components/layout/PageContainer';
import { PageHeader } from '@/components/layout/PageHeader';
import { DentalModelsManager } from '@/components/dental/DentalModelsManager';
import { GLBModelUploader } from '@/components/dental/GLBModelUploader';
import Enhanced3DToothChart from '@/components/dental/Enhanced3DToothChart';
import { usePatientDentalModels } from '@/hooks/usePatientDentalModels';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Upload, Package, Eye, Settings } from 'lucide-react';
import { toast } from 'sonner';

const DentalModelsAdmin = () => {
  const [selectedPatientId, setSelectedPatientId] = useState<string>('');
  const [selectedTooth, setSelectedTooth] = useState<string>('');
  const [numberingSystem, setNumberingSystem] = useState<'universal' | 'palmer' | 'fdi'>('universal');

  const handleToothSelect = (toothNumber: string, system: string) => {
    setSelectedTooth(toothNumber);
    setNumberingSystem(system as 'universal' | 'palmer' | 'fdi');
  };

  const handleUploadComplete = (modelData: any) => {
    toast.success(`تم رفع النموذج للسن ${modelData.toothNumber} بنجاح`);
    // إعادة تحميل البيانات
    window.location.reload();
  };

  return (
    <PageContainer>
      <PageHeader
        title="إدارة النماذج ثلاثية الأبعاد"
        description="إدارة نماذج الأسنان الافتراضية والمخصصة للمرضى"
      />
      
      <div className="space-y-6">
        <Tabs defaultValue="upload" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="upload" className="flex items-center gap-2">
              <Upload className="h-4 w-4" />
              رفع النماذج
            </TabsTrigger>
            <TabsTrigger value="patient-models" className="flex items-center gap-2">
              <Eye className="h-4 w-4" />
              نماذج المرضى
            </TabsTrigger>
            <TabsTrigger value="default-models" className="flex items-center gap-2">
              <Package className="h-4 w-4" />
              النماذج الافتراضية
            </TabsTrigger>
            <TabsTrigger value="manager" className="flex items-center gap-2">
              <Settings className="h-4 w-4" />
              الإدارة المتقدمة
            </TabsTrigger>
          </TabsList>

          <TabsContent value="upload" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* رفع النماذج الافتراضية */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Package className="h-5 w-5" />
                    النماذج الافتراضية
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <GLBModelUploader
                    uploadType="default"
                    onUploadComplete={handleUploadComplete}
                  />
                </CardContent>
              </Card>

              {/* رفع النماذج المخصصة */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Upload className="h-5 w-5" />
                    نماذج المرضى
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="p-4 bg-muted rounded-lg">
                      <p className="text-sm text-muted-foreground">
                        اختر مريض أولاً من صفحة المرضى لرفع نماذج مخصصة
                      </p>
                    </div>
                    
                    {selectedPatientId && (
                      <GLBModelUploader
                        uploadType="patient"
                        patientId={selectedPatientId}
                        onUploadComplete={handleUploadComplete}
                      />
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="patient-models" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>نماذج المرضى المرفوعة</CardTitle>
              </CardHeader>
              <CardContent>
                {selectedPatientId ? (
                  <div className="space-y-4">
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary">
                        المريض: {selectedPatientId.slice(0, 8)}...
                      </Badge>
                      <Badge variant="outline">
                        نظام الترقيم: {numberingSystem}
                      </Badge>
                    </div>
                    
                    <Enhanced3DToothChart
                      patientId={selectedPatientId}
                      onToothSelect={handleToothSelect}
                      selectedTooth={selectedTooth}
                      numberingSystem={numberingSystem}
                    />
                  </div>
                ) : (
                  <div className="text-center p-8">
                    <p className="text-muted-foreground">
                      اختر مريض من صفحة المرضى لعرض نماذجه ثلاثية الأبعاد
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="default-models" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>النماذج الافتراضية</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center p-8">
                  <p className="text-muted-foreground">
                    عرض وإدارة النماذج الافتراضية لجميع أنواع الأسنان
                  </p>
                  <p className="text-sm text-muted-foreground mt-2">
                    قادم قريباً...
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="manager" className="space-y-6">
            <DentalModelsManager />
          </TabsContent>
        </Tabs>
      </div>
    </PageContainer>
  );
};

export default DentalModelsAdmin;