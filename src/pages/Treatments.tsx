import { useLocation } from "react-router-dom";
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PageContainer } from "@/components/layout/PageContainer";
import { PageHeader } from "@/components/layout/PageHeader";
import RealisticToothChart from "@/components/dental/RealisticToothChart";
import ZoomableToothChart from "@/components/dental/ZoomableToothChart";
import OralHealthStatistics from "@/components/dental/OralHealthStatistics";
import DentalTreatmentForm from "@/components/dental/DentalTreatmentForm";
<<<<<<< HEAD
import TreatmentsList from "@/components/treatments/TreatmentsList";
import { Zap, FileText, Activity, BarChart3, Maximize, List } from "lucide-react";
=======
import { Zap, FileText, Activity, BarChart3, Maximize } from "lucide-react";
>>>>>>> cbd682d36e862741c55b9e7b5d144f8de65c694a

const Treatments = () => {
  const location = useLocation();
  const patientId = location.state?.patientId;
  const [selectedTooth, setSelectedTooth] = useState<string>('');
  const [numberingSystem, setNumberingSystem] = useState<'universal' | 'palmer' | 'fdi'>('fdi');

  const handleToothSelect = (toothNumber: string, system: 'universal' | 'palmer' | 'fdi') => {
    setSelectedTooth(toothNumber);
    setNumberingSystem(system);
  };

  return (
    <PageContainer>
      <PageHeader 
        title="العلاجات السنية المتقدمة" 
        description="مخطط الأسنان الواقعي وإدارة العلاجات والملاحظات" 
      />

      <Tabs defaultValue="chart" className="w-full">
<<<<<<< HEAD
        <TabsList className="grid w-full grid-cols-5 mb-6">
=======
        <TabsList className="grid w-full grid-cols-4 mb-6">
>>>>>>> cbd682d36e862741c55b9e7b5d144f8de65c694a
          <TabsTrigger value="chart" className="flex items-center gap-2">
            <Zap className="w-4 h-4" />
            مخطط الأسنان
          </TabsTrigger>
          <TabsTrigger value="interactive" className="flex items-center gap-2">
            <Maximize className="w-4 h-4" />
            المخطط التفاعلي
          </TabsTrigger>
          <TabsTrigger value="statistics" className="flex items-center gap-2">
            <BarChart3 className="w-4 h-4" />
            الإحصائيات
          </TabsTrigger>
          <TabsTrigger value="treatments" className="flex items-center gap-2">
            <Activity className="w-4 h-4" />
            إضافة علاج
          </TabsTrigger>
<<<<<<< HEAD
          <TabsTrigger value="list" className="flex items-center gap-2">
            <List className="w-4 h-4" />
            قائمة العلاجات
          </TabsTrigger>
=======
>>>>>>> cbd682d36e862741c55b9e7b5d144f8de65c694a
        </TabsList>

        <TabsContent value="chart" className="space-y-6">
          <RealisticToothChart
            patientId={patientId}
            selectedTooth={selectedTooth}
            onToothSelect={(toothNumber) => handleToothSelect(toothNumber, 'universal')}
          />
          
          {selectedTooth && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="w-5 h-5" />
                  معلومات السن المحدد
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                  <div>
                    <span className="font-medium">رقم السن:</span> {selectedTooth}
                  </div>
                  <div>
                    <span className="font-medium">نظام الترقيم:</span> {numberingSystem.toUpperCase()}
                  </div>
<<<<<<< HEAD
                  <div className="flex gap-2">
=======
                  <div>
>>>>>>> cbd682d36e862741c55b9e7b5d144f8de65c694a
                    <Button 
                      size="sm" 
                      onClick={() => {
                        // Switch to treatments tab with selected tooth
                        const treatmentsTab = document.querySelector('[value="treatments"]') as HTMLElement;
                        treatmentsTab?.click();
                      }}
                    >
                      إضافة علاج لهذا السن
                    </Button>
<<<<<<< HEAD
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => {
                        // Switch to treatments list
                        const listTab = document.querySelector('[value="list"]') as HTMLElement;
                        listTab?.click();
                      }}
                    >
                      عرض العلاجات
                    </Button>
=======
>>>>>>> cbd682d36e862741c55b9e7b5d144f8de65c694a
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="interactive" className="space-y-6">
          <ZoomableToothChart
            patientId={patientId}
            onToothSelect={(toothNumber) => handleToothSelect(toothNumber, 'universal')}
            selectedTooth={selectedTooth}
          />
        </TabsContent>

        <TabsContent value="statistics" className="space-y-6">
          <OralHealthStatistics 
            patientId={patientId}
          />
        </TabsContent>

        <TabsContent value="treatments">
          <DentalTreatmentForm 
            patientId={patientId}
            preSelectedTooth={selectedTooth}
            preSelectedSystem={numberingSystem}
          />
        </TabsContent>
<<<<<<< HEAD

        <TabsContent value="list">
          <TreatmentsList patientId={patientId} />
        </TabsContent>
=======
>>>>>>> cbd682d36e862741c55b9e7b5d144f8de65c694a
      </Tabs>
    </PageContainer>
  );
};

// Realistic dental chart with individual tooth notes system
export default Treatments;