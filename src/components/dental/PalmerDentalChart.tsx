import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import ToothConditionDialog from "./ToothConditionDialog";

interface ToothCondition {
  id: string;
  tooth_number: string;
  condition_type: string | null;
  condition_color: string | null;
  notes: string | null;
  treatment_date: string | null;
}

interface PalmerDentalChartProps {
  patientId: string;
  patientAge: number;
}

const PalmerDentalChart = ({ patientId, patientAge }: PalmerDentalChartProps) => {
  const [toothConditions, setToothConditions] = useState<ToothCondition[]>([]);
  const [selectedTooth, setSelectedTooth] = useState<string | null>(null);
  const [conditionDialogOpen, setConditionDialogOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const { user } = useAuth();

  // Determine if patient uses primary or permanent teeth based on age
  const isPrimaryTeeth = patientAge < 12;

  // Palmer notation for primary teeth (children)
  const primaryTeeth = {
    upper: {
      right: ['E', 'D', 'C', 'B', 'A'],
      left: ['A', 'B', 'C', 'D', 'E']
    },
    lower: {
      right: ['E', 'D', 'C', 'B', 'A'],
      left: ['A', 'B', 'C', 'D', 'E']
    }
  };

  // Palmer notation for permanent teeth (adults)
  const permanentTeeth = {
    upper: {
      right: ['8', '7', '6', '5', '4', '3', '2', '1'],
      left: ['1', '2', '3', '4', '5', '6', '7', '8']
    },
    lower: {
      right: ['8', '7', '6', '5', '4', '3', '2', '1'],
      left: ['1', '2', '3', '4', '5', '6', '7', '8']
    }
  };

  const currentTeethData = isPrimaryTeeth ? primaryTeeth : permanentTeeth;

  useEffect(() => {
    fetchToothConditions();
  }, [patientId]);

  const fetchToothConditions = async () => {
    console.log('PalmerDentalChart: fetchToothConditions called', { patientId, user: user?.id });
    
    if (!user) {
      console.log('PalmerDentalChart: No user found');
      setLoading(false);
      return;
    }

    try {
      console.log('PalmerDentalChart: Getting user profile...');
      // Get the clinic_id from user profile first
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('id')
        .eq('user_id', user.id)
        .single();

      console.log('PalmerDentalChart: Profile result', { profile, profileError });

      if (profileError) {
        console.error('PalmerDentalChart: Profile error', profileError);
        setLoading(false);
        return;
      }

      if (!profile) {
        console.log('PalmerDentalChart: No profile found');
        setLoading(false);
        return;
      }

      console.log('PalmerDentalChart: Fetching tooth conditions...', { patientId, clinicId: profile.id });
      
      const { data, error } = await supabase
        .from('tooth_conditions')
        .select('*')
        .eq('patient_id', patientId)
        .eq('clinic_id', profile.id)  
        .eq('numbering_system', 'palmer');

      console.log('PalmerDentalChart: Tooth conditions result', { data, error });

      if (error) {
        console.error('PalmerDentalChart: Query error', error);
        throw error;
      }
      
      setToothConditions(data || []);
    } catch (error) {
      console.error('Error fetching tooth conditions:', error);
      toast({
        title: "خطأ",
        description: "حدث خطأ في تحميل مخطط الأسنان",
        variant: "destructive",
      });
    } finally {
      console.log('PalmerDentalChart: Setting loading to false');
      setLoading(false);
    }
  };

  const getToothCondition = (toothNumber: string, quadrant: string) => {
    const fullToothId = `${quadrant}${toothNumber}`;
    return toothConditions.find(tc => tc.tooth_number === fullToothId);
  };

  const handleToothClick = (toothNumber: string, quadrant: string) => {
    const fullToothId = `${quadrant}${toothNumber}`;
    setSelectedTooth(fullToothId);
    setConditionDialogOpen(true);
  };

  const renderTooth = (toothNumber: string, quadrant: string, isUpper: boolean) => {
    const condition = getToothCondition(toothNumber, quadrant);
    const backgroundColor = condition?.condition_color || '#ffffff';
    const hasCondition = condition?.condition_type;

    return (
      <button
        key={`${quadrant}-${toothNumber}`}
        onClick={() => handleToothClick(toothNumber, quadrant)}
        className={cn(
          "w-12 h-12 border-2 border-border rounded-lg transition-all duration-200 hover:scale-105 flex items-center justify-center text-sm font-bold hover:border-primary",
          hasCondition ? "shadow-md" : "hover:bg-accent"
        )}
        style={{ backgroundColor }}
        title={`${quadrant}${toothNumber} ${condition?.condition_type ? `- ${condition.condition_type}` : ''}`}
      >
        {toothNumber}
      </button>
    );
  };

  const renderQuadrant = (teeth: string[], quadrant: string, isUpper: boolean, isRight: boolean) => {
    return (
      <div className="flex flex-col items-center space-y-2">
        <div className={cn(
          "flex gap-1",
          isUpper ? "flex-row" : "flex-row-reverse"
        )}>
          {teeth.map(tooth => renderTooth(tooth, quadrant, isUpper))}
        </div>
        <Badge variant="outline" className="text-xs">
          {quadrant === 'UR' && 'الربع العلوي الأيمن'}
          {quadrant === 'UL' && 'الربع العلوي الأيسر'}
          {quadrant === 'LR' && 'الربع السفلي الأيمن'}
          {quadrant === 'LL' && 'الربع السفلي الأيسر'}
        </Badge>
      </div>
    );
  };

  if (loading) {
    return <div className="text-center p-4">جاري تحميل مخطط الأسنان...</div>;
  }

  return (
    <>
      <Card className="w-full max-w-6xl mx-auto">
        <CardHeader>
          <CardTitle className="text-center flex items-center justify-center gap-2">
            <span>مخطط الأسنان - نظام Palmer</span>
            <Badge variant={isPrimaryTeeth ? "secondary" : "default"}>
              {isPrimaryTeeth ? "أسنان أولية (طفل)" : "أسنان دائمة (بالغ)"}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-8">
          {/* Upper Teeth */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-center text-muted-foreground">الفك العلوي (Maxillary)</h3>
            <div className="flex justify-center gap-8">
              {/* Upper Right Quadrant */}
              {renderQuadrant(currentTeethData.upper.right, 'UR', true, true)}
              
              {/* Upper Left Quadrant */}
              {renderQuadrant(currentTeethData.upper.left, 'UL', true, false)}
            </div>
          </div>

          {/* Divider */}
          <div className="border-t-2 border-dashed border-border mx-auto w-3/4"></div>

          {/* Lower Teeth */}
          <div className="space-y-4">
            <div className="flex justify-center gap-8">
              {/* Lower Right Quadrant */}
              {renderQuadrant(currentTeethData.lower.right, 'LR', false, true)}
              
              {/* Lower Left Quadrant */}
              {renderQuadrant(currentTeethData.lower.left, 'LL', false, false)}
            </div>
            <h3 className="text-lg font-medium text-center text-muted-foreground">الفك السفلي (Mandibular)</h3>
          </div>

          {/* Legend */}
          <div className="bg-muted p-4 rounded-lg">
            <h4 className="text-sm font-medium mb-3">الرموز والألوان:</h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-white border-2 border-gray-300 rounded"></div>
                <span>سن صحي</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-red-500 rounded"></div>
                <span>تسوس</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-blue-500 rounded"></div>
                <span>حشوة</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-yellow-500 rounded"></div>
                <span>تاج</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-gray-500 rounded"></div>
                <span>مفقود</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-green-500 rounded"></div>
                <span>سليم معالج</span>
              </div>
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              اضغط على أي سن لتحديث حالته وإضافة ملاحظات
            </p>
          </div>
        </CardContent>
      </Card>

      <ToothConditionDialog
        isOpen={conditionDialogOpen}
        onOpenChange={setConditionDialogOpen}
        patientId={patientId}
        toothNumber={selectedTooth || ''}
        numberingSystem="palmer"
        onConditionUpdate={fetchToothConditions}
      />
    </>
  );
};

export default PalmerDentalChart;