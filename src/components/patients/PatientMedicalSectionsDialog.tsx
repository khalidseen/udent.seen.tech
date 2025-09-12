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

interface PatientMedicalSectionsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  patientId: string;
  patientName: string;
  initialSection?: 'dental' | 'overview' | 'treatments' | 'prescriptions' | 'images' | 'appointments' | 'financial';
}

export function PatientMedicalSectionsDialog({ 
  open, 
  onOpenChange, 
  patientId, 
  patientName,
  initialSection = 'overview'
}: PatientMedicalSectionsDialogProps) {
  const [selectedTooth, setSelectedTooth] = useState<string>('');
  const [selectedToothSystem, setSelectedToothSystem] = useState<'fdi' | 'universal' | 'palmer'>('fdi');

  const handleToothSelect = (toothNumber: string, system: 'fdi' | 'universal' | 'palmer') => {
    setSelectedTooth(toothNumber);
    setSelectedToothSystem(system);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[100vw] h-[100vh] max-w-none max-h-none p-0 overflow-hidden rounded-none border-0 m-0">
        <DialogHeader className="px-4 sm:px-6 py-3 sm:py-4 border-b bg-gradient-to-r from-primary/5 to-secondary/5 flex-shrink-0">
          <div className="flex items-center justify-between">
            <DialogTitle className="text-lg sm:text-xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
              الملف الطبي - {patientName}
            </DialogTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onOpenChange(false)}
              className="h-8 w-8 p-0 hover:bg-destructive/10 hover:text-destructive"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-hidden">
          <Tabs defaultValue={initialSection} className="h-full flex flex-col">
            <TabsList className="grid w-full grid-cols-3 sm:grid-cols-7 mx-2 sm:mx-6 mt-2 sm:mt-4 mb-0 bg-muted/50 gap-1">
              <TabsTrigger value="overview" className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm p-2">
                <Heart className="h-3 w-3 sm:h-4 sm:w-4" />
                <span className="hidden sm:inline">نظرة عامة</span>
                <span className="sm:hidden">نظرة</span>
              </TabsTrigger>
              <TabsTrigger value="dental" className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm p-2">
                <Smile className="h-3 w-3 sm:h-4 sm:w-4" />
                <span className="hidden sm:inline">مخطط الأسنان</span>
                <span className="sm:hidden">أسنان</span>
              </TabsTrigger>
              <TabsTrigger value="treatments" className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm p-2">
                <Stethoscope className="h-3 w-3 sm:h-4 sm:w-4" />
                <span className="hidden sm:inline">العلاجات</span>
                <span className="sm:hidden">علاج</span>
              </TabsTrigger>
              <TabsTrigger value="prescriptions" className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm p-2">
                <Pill className="h-3 w-3 sm:h-4 sm:w-4" />
                <span className="hidden sm:inline">الوصفات</span>
                <span className="sm:hidden">وصفات</span>
              </TabsTrigger>
              <TabsTrigger value="images" className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm p-2">
                <Camera className="h-3 w-3 sm:h-4 sm:w-4" />
                <span className="hidden sm:inline">الأشعة والصور</span>
                <span className="sm:hidden">أشعة</span>
              </TabsTrigger>
              <TabsTrigger value="appointments" className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm p-2">
                <Calendar className="h-3 w-3 sm:h-4 sm:w-4" />
                <span className="hidden sm:inline">المواعيد</span>
                <span className="sm:hidden">مواعيد</span>
              </TabsTrigger>
              <TabsTrigger value="financial" className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm p-2">
                <DollarSign className="h-3 w-3 sm:h-4 sm:w-4" />
                <span className="hidden sm:inline">الحالة المالية</span>
                <span className="sm:hidden">مالية</span>
              </TabsTrigger>
            </TabsList>

            <div className="flex-1 overflow-auto p-2 sm:p-4 lg:p-6">
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

              <TabsContent value="appointments" className="h-full m-0">
                <PatientAppointmentCalendar 
                  patientId={patientId}
                  patientName={patientName}
                />
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

export default PatientMedicalSectionsDialog;