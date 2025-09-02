import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';
import ToothChart from './ToothChart';
import { Enhanced3DToothViewer } from './Enhanced3DToothViewer';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface Enhanced3DToothChartProps {
  patientId?: string;
  onToothSelect: (toothNumber: string, numberingSystem: string) => void;
  selectedTooth?: string;
  numberingSystem?: 'universal' | 'palmer' | 'fdi';
}

const Enhanced3DToothChart = ({
  patientId,
  onToothSelect,
  selectedTooth,
  numberingSystem = 'universal'
}: Enhanced3DToothChartProps) => {
  const [viewMode, setViewMode] = useState<'2d' | '3d'>('2d');
  const [selected3DTooth, setSelected3DTooth] = useState<string | null>(null);
  const [is3DDialogOpen, setIs3DDialogOpen] = useState(false);

  // Fetch annotations count for each tooth
  const { data: annotationsCounts } = useQuery({
    queryKey: ['tooth-annotations-counts', patientId],
    queryFn: async () => {
      if (!patientId) return {};
      
      const { data, error } = await supabase
        .from('tooth_3d_annotations')
        .select('tooth_number, annotation_type, severity')
        .eq('patient_id', patientId);

      if (error) throw error;
      
      // Group by tooth number and count annotations
      const counts: Record<string, { total: number; critical: number; high: number }> = {};
      
      data.forEach(annotation => {
        if (!counts[annotation.tooth_number]) {
          counts[annotation.tooth_number] = { total: 0, critical: 0, high: 0 };
        }
        counts[annotation.tooth_number].total++;
        if (annotation.severity === 'critical') {
          counts[annotation.tooth_number].critical++;
        } else if (annotation.severity === 'high') {
          counts[annotation.tooth_number].high++;
        }
      });
      
      return counts;
    },
    enabled: !!patientId
  });

  // Fetch uploaded 3D models for each tooth
  const { data: uploadedModels } = useQuery({
    queryKey: ['uploaded-models', patientId, numberingSystem],
    queryFn: async () => {
      if (!patientId) return {};
      
      const { data, error } = await supabase
        .from('patient_dental_models')
        .select('tooth_number, model_path')
        .eq('patient_id', patientId)
        .eq('numbering_system', numberingSystem);

      if (error) throw error;
      
      const models: Record<string, boolean> = {};
      data.forEach(model => {
        models[model.tooth_number] = true;
      });
      
      return models;
    },
    enabled: !!patientId
  });

  const handleToothClick = (toothNumber: string, system: string) => {
    onToothSelect(toothNumber, system);
    if (viewMode === '3d' && patientId) {
      setSelected3DTooth(toothNumber);
      setIs3DDialogOpen(true);
    }
  };

  const renderEnhancedTooth = (toothNumber: string, isUpper: boolean, index: number) => {
    const isSelected = selectedTooth === toothNumber;
    const annotationData = annotationsCounts?.[toothNumber];
    const hasAnnotations = annotationData && annotationData.total > 0;
    const hasCritical = annotationData && annotationData.critical > 0;
    const hasHigh = annotationData && annotationData.high > 0;
    const hasUploadedModel = uploadedModels?.[toothNumber] || false;
    
    // Determine tooth shape based on position
    const isMolar = index < 3 || index > 12;
    const isPremolar = (index >= 3 && index <= 5) || (index >= 10 && index <= 12);
    const isCanine = index === 6 || index === 9;
    const isIncisor = index === 7 || index === 8;
    
    let toothShape = "rounded-md h-8 w-6";
    if (isMolar) toothShape = "rounded-lg h-10 w-8";
    if (isPremolar) toothShape = "rounded-md h-9 w-7";
    if (isCanine) toothShape = "rounded-full h-10 w-6";
    if (isIncisor) toothShape = "rounded-sm h-8 w-5";

    return (
      <div key={`${isUpper ? 'upper' : 'lower'}-${toothNumber}`} className="relative">
        <button
          onClick={() => handleToothClick(toothNumber, numberingSystem)}
          className={cn(
            toothShape,
            "border-2 transition-all duration-200 hover:scale-110 flex items-center justify-center text-xs font-bold relative",
            isSelected 
              ? "bg-primary text-primary-foreground border-primary shadow-lg" 
              : hasAnnotations
                ? hasCritical
                  ? "bg-red-100 border-red-500 text-red-800 hover:bg-red-200"
                  : hasHigh
                    ? "bg-orange-100 border-orange-500 text-orange-800 hover:bg-orange-200"
                    : "bg-yellow-100 border-yellow-500 text-yellow-800 hover:bg-yellow-200"
                : "bg-background border-border hover:bg-accent hover:text-accent-foreground"
          )}
          title={`السن رقم ${toothNumber}${hasAnnotations ? ` - ${annotationData.total} تعليق` : ''}${hasUploadedModel ? ' - نموذج مرفوع' : ''}`}
        >
          {toothNumber}
          
          {/* 3D Mode Indicator */}
          {viewMode === '3d' && (
            <div className="absolute -top-1 -right-1">
              <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
            </div>
          )}
          
          {/* Uploaded Model Indicator */}
          {hasUploadedModel && (
            <div className="absolute -top-1 -left-1">
              <div className="w-2 h-2 bg-green-500 rounded-full" title="نموذج مرفوع" />
            </div>
          )}
        </button>
        
        {/* Annotation Badge */}
        {hasAnnotations && (
          <div className="absolute -top-2 -right-2">
            <Badge 
              variant={hasCritical ? "destructive" : hasHigh ? "default" : "secondary"}
              className="text-xs h-5 w-5 p-0 flex items-center justify-center rounded-full"
            >
              {annotationData.total}
            </Badge>
          </div>
        )}
      </div>
    );
  };

  // Get tooth numbers based on numbering system
  const getToothNumbers = () => {
    switch (numberingSystem) {
      case 'palmer':
        return {
          upper: ['8', '7', '6', '5', '4', '3', '2', '1', '1', '2', '3', '4', '5', '6', '7', '8'],
          lower: ['8', '7', '6', '5', '4', '3', '2', '1', '1', '2', '3', '4', '5', '6', '7', '8']
        };
      case 'fdi':
        return {
          upper: ['18', '17', '16', '15', '14', '13', '12', '11', '21', '22', '23', '24', '25', '26', '27', '28'],
          lower: ['48', '47', '46', '45', '44', '43', '42', '41', '31', '32', '33', '34', '35', '36', '37', '38']
        };
      default:
        return {
          upper: ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12', '13', '14', '15', '16'],
          lower: ['32', '31', '30', '29', '28', '27', '26', '25', '24', '23', '22', '21', '20', '19', '18', '17']
        };
    }
  };

  const toothNumbers = getToothNumbers();

  return (
    <div className="space-y-4">
      {/* Mode Toggle */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>مخطط الأسنان التفاعلي</span>
            <div className="flex gap-2">
              <Button
                variant={viewMode === '2d' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('2d')}
              >
                2D تقليدي
              </Button>
              <Button
                variant={viewMode === '3d' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('3d')}
                disabled={!patientId}
              >
                3D تفاعلي
              </Button>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {viewMode === '2d' ? (
            <ToothChart
              onToothSelect={onToothSelect}
              selectedTooth={selectedTooth}
              numberingSystem={numberingSystem}
            />
          ) : (
            <div className="space-y-6">
              {/* Enhanced 3D Chart */}
              <div className="space-y-4">
                {/* Upper Teeth */}
                <div className="space-y-2">
                  <h3 className="text-sm font-medium text-center text-muted-foreground">
                    الفك العلوي
                  </h3>
                  <div className="flex justify-center gap-1 flex-wrap">
                    {toothNumbers.upper.map((tooth, index) => 
                      renderEnhancedTooth(tooth, true, index)
                    )}
                  </div>
                </div>

                {/* Midline */}
                <div className="border-t border-dashed border-border my-4"></div>

                {/* Lower Teeth */}
                <div className="space-y-2">
                  <div className="flex justify-center gap-1 flex-wrap">
                    {toothNumbers.lower.map((tooth, index) => 
                      renderEnhancedTooth(tooth, false, index)
                    )}
                  </div>
                  <h3 className="text-sm font-medium text-center text-muted-foreground">
                    الفك السفلي
                  </h3>
                </div>
              </div>

              {/* Instructions */}
              <div className="bg-muted p-4 rounded-lg text-center">
                <p className="text-sm text-muted-foreground">
                  {patientId 
                    ? "انقر على أي سن لفتح النموذج ثلاثي الأبعاد والتعليقات"
                    : "يرجى اختيار مريض أولاً لاستخدام الوضع ثلاثي الأبعاد"
                  }
                </p>
              </div>

              {/* Legend with 3D annotations */}
              <div className="bg-muted p-4 rounded-lg">
                <h4 className="text-sm font-medium mb-3">مفتاح الألوان:</h4>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-xs">
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-background border border-border rounded"></div>
                    <span>طبيعي</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-yellow-100 border border-yellow-500 rounded"></div>
                    <span>ملاحظات عادية</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-orange-100 border border-orange-500 rounded"></div>
                    <span>مشاكل متوسطة</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-red-100 border border-red-500 rounded"></div>
                    <span>مشاكل حرجة</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-primary rounded"></div>
                    <span>محدد حالياً</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                    <span>نشط ثلاثي الأبعاد</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span>نموذج مرفوع</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Selected Tooth Info */}
          {selectedTooth && (
            <div className="mt-4 text-center">
              <Badge variant="secondary" className="text-sm">
                السن المحدد: {selectedTooth}
                {annotationsCounts?.[selectedTooth] && (
                  <span className="ml-2">
                    ({annotationsCounts[selectedTooth].total} تعليق)
                  </span>
                )}
              </Badge>
            </div>
          )}
        </CardContent>
      </Card>

      {/* 3D Tooth Dialog */}
      <Dialog open={is3DDialogOpen} onOpenChange={setIs3DDialogOpen}>
        <DialogContent className="max-w-6xl h-[90vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>عارض السن ثلاثي الأبعاد - السن {selected3DTooth}</DialogTitle>
            <DialogDescription>
              عرض وتحرير النموذج ثلاثي الأبعاد للسن مع إمكانية إضافة التعليقات والملاحظات
            </DialogDescription>
          </DialogHeader>
          
          <div className="flex-1 overflow-hidden">
            {selected3DTooth && patientId && (
              <Enhanced3DToothViewer
                toothNumber={selected3DTooth}
                patientId={patientId}
                numberingSystem={numberingSystem}
                onSave={(data) => {
                  console.log('Saving tooth data:', data);
                  // يمكن إضافة منطق الحفظ هنا
                }}
              />
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Enhanced3DToothChart;