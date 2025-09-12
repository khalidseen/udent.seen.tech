import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Smile, 
  Heart, 
  Pill, 
  Camera, 
  Calendar, 
  DollarSign,
  X,
  Stethoscope 
} from "lucide-react";

// Import existing components
import Enhanced3DToothChart from "@/components/dental/Enhanced3DToothChart";
import { OralHealthDashboard } from "@/components/dental/OralHealthDashboard";
import { PatientImageGallery } from "@/components/medical-records/PatientImageGallery";
import { PatientAppointmentCalendar } from "@/components/patients/PatientAppointmentCalendar";
import PatientFinancialStatus from "@/components/patients/PatientFinancialStatus";

interface PatientMedicalSectionsPopupProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  patientId: string;
  patientName: string;
  initialSection?: 'dental' | 'overview' | 'treatments' | 'prescriptions' | 'images' | 'appointments' | 'financial';
}

export function PatientMedicalSectionsPopup({ 
  open, 
  onOpenChange, 
  patientId, 
  patientName,
  initialSection = 'overview'
}: PatientMedicalSectionsPopupProps) {
  const [selectedTooth, setSelectedTooth] = useState<string>('');
  const [selectedToothSystem, setSelectedToothSystem] = useState<'fdi' | 'universal' | 'palmer'>('fdi');

  const handleToothSelect = (toothNumber: string, system: 'fdi' | 'universal' | 'palmer') => {
    setSelectedTooth(toothNumber);
    setSelectedToothSystem(system);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent 
        className="max-w-7xl max-h-[95vh] p-0 overflow-hidden rounded-lg border-0"
        // منع فتح ملف المريض عند إغلاق النافذة
        onClick={(e) => e.stopPropagation()}
      >
        <DialogHeader className="px-6 py-4 border-b bg-gradient-to-r from-primary/5 to-secondary/5 flex-shrink-0">
          <div className="flex items-center justify-between">
            <DialogTitle className="text-xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
              الملف الطبي - {patientName}
            </DialogTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                onOpenChange(false);
              }}
              className="h-8 w-8 p-0 hover:bg-destructive/10 hover:text-destructive"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-hidden">
          <Tabs defaultValue={initialSection} className="h-full flex flex-col">
            <TabsList className="grid w-full grid-cols-6 mx-6 mt-4 mb-0 bg-muted/50 gap-1">
              <TabsTrigger value="overview" className="flex items-center gap-2 text-sm p-2">
                <Heart className="h-4 w-4" />
                نظرة عامة
              </TabsTrigger>
              <TabsTrigger value="dental" className="flex items-center gap-2 text-sm p-2">
                <Smile className="h-4 w-4" />
                مخطط الأسنان
              </TabsTrigger>
              <TabsTrigger value="treatments" className="flex items-center gap-2 text-sm p-2">
                <Stethoscope className="h-4 w-4" />
                العلاجات
              </TabsTrigger>
              <TabsTrigger value="prescriptions" className="flex items-center gap-2 text-sm p-2">
                <Pill className="h-4 w-4" />
                الوصفات
              </TabsTrigger>
              <TabsTrigger value="images" className="flex items-center gap-2 text-sm p-2">
                <Camera className="h-4 w-4" />
                الأشعة والصور
              </TabsTrigger>
              <TabsTrigger value="financial" className="flex items-center gap-2 text-sm p-2">
                <DollarSign className="h-4 w-4" />
                الحالة المالية
              </TabsTrigger>
            </TabsList>

            <div className="flex-1 overflow-auto p-6">
              <TabsContent value="overview" className="h-full m-0">
                <OralHealthDashboard patientId={patientId} />
              </TabsContent>

              <TabsContent value="dental" className="h-full m-0">
                <Enhanced3DToothChart
                  patientId={patientId}
                  selectedTooth={selectedTooth}
                  onToothSelect={handleToothSelect}
                />
              </TabsContent>

              <TabsContent value="treatments" className="h-full m-0">
                <div className="text-center p-8">
                  <Stethoscope className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
                  <h3 className="text-lg font-semibold mb-2">العلاجات</h3>
                  <p className="text-muted-foreground">سيتم إضافة قسم العلاجات قريباً</p>
                </div>
              </TabsContent>

              <TabsContent value="prescriptions" className="h-full m-0">
                <div className="text-center p-8">
                  <Pill className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
                  <h3 className="text-lg font-semibold mb-2">الوصفات الطبية</h3>
                  <p className="text-muted-foreground">سيتم إضافة قسم الوصفات الطبية قريباً</p>
                </div>
              </TabsContent>

              <TabsContent value="images" className="h-full m-0">
                <PatientImageGallery patientId={patientId} />
              </TabsContent>

              <TabsContent value="financial" className="h-full m-0">
                <PatientFinancialStatus 
                  patientId={patientId}
                  patientName={patientName}
                  patientPhone=""
                />
              </TabsContent>
            </div>
          </Tabs>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default PatientMedicalSectionsPopup;