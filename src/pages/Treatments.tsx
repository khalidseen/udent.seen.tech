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
import { Zap, FileText, Activity, BarChart3, Maximize } from "lucide-react";

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
        <TabsList className="grid w-full grid-cols-4 mb-6">
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
                  <div>
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
            numberingSystem={numberingSystem}
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
      </Tabs>
    </PageContainer>
  );
};

// Realistic dental chart with individual tooth notes system
export default Treatments;