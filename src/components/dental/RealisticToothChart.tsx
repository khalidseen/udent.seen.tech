import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import ToothNoteDialog from "./ToothNoteDialog";

interface RealisticToothChartProps {
  patientId?: string;
  onToothSelect?: (toothNumber: string, numberingSystem: string) => void;
  selectedTooth?: string;
  numberingSystem?: 'universal' | 'palmer' | 'fdi';
}

interface ToothCondition {
  tooth_number: string;
  condition_type: string;
  condition_color: string;
  notes?: string;
}

interface ToothNote {
  id: string;
  tooth_number: string;
  title: string;
  status: string;
  priority: string;
  color_code: string;
}

const RealisticToothChart = ({
  patientId,
  onToothSelect,
  selectedTooth,
  numberingSystem = 'fdi'
}: RealisticToothChartProps) => {
  const [activeSystem, setActiveSystem] = useState<'universal' | 'palmer' | 'fdi'>(numberingSystem);
  const [toothConditions, setToothConditions] = useState<ToothCondition[]>([]);
  const [toothNotes, setToothNotes] = useState<ToothNote[]>([]);
  const [selectedToothForNote, setSelectedToothForNote] = useState<string>('');
  const [isNoteDialogOpen, setIsNoteDialogOpen] = useState(false);

  // FDI numbering system (most commonly used internationally)
  const fdiNumbers = {
    upper: ['18', '17', '16', '15', '14', '13', '12', '11', '21', '22', '23', '24', '25', '26', '27', '28'],
    lower: ['48', '47', '46', '45', '44', '43', '42', '41', '31', '32', '33', '34', '35', '36', '37', '38']
  };

  const universalNumbers = {
    upper: ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12', '13', '14', '15', '16'],
    lower: ['32', '31', '30', '29', '28', '27', '26', '25', '24', '23', '22', '21', '20', '19', '18', '17']
  };

  const palmerNumbers = {
    upper: ['8', '7', '6', '5', '4', '3', '2', '1', '1', '2', '3', '4', '5', '6', '7', '8'],
    lower: ['8', '7', '6', '5', '4', '3', '2', '1', '1', '2', '3', '4', '5', '6', '7', '8']
  };

  const getToothNumbers = () => {
    switch (activeSystem) {
      case 'palmer':
        return palmerNumbers;
      case 'universal':
        return universalNumbers;
      default:
        return fdiNumbers;
    }
  };

  useEffect(() => {
    if (patientId) {
      fetchToothData();
    }
  }, [patientId]);

  const fetchToothData = async () => {
    if (!patientId) return;

    try {
      // Fetch tooth conditions
      const { data: conditions } = await supabase
        .from('tooth_conditions')
        .select('tooth_number, condition_type, condition_color, notes')
        .eq('patient_id', patientId);

      // Fetch tooth notes
      const { data: notes } = await supabase
        .from('tooth_notes')
        .select('id, tooth_number, title, status, priority, color_code')
        .eq('patient_id', patientId);

      setToothConditions(conditions || []);
      setToothNotes(notes || []);
    } catch (error) {
      console.error('Error fetching tooth data:', error);
    }
  };

  const getToothColor = (toothNumber: string) => {
    const condition = toothConditions.find(c => c.tooth_number === toothNumber);
    const note = toothNotes.find(n => n.tooth_number === toothNumber);
    
    if (condition) {
      return condition.condition_color;
    }
    if (note && note.status === 'active') {
      return note.color_code;
    }
    return '#ffffff'; // Default white/healthy
  };

  const hasNote = (toothNumber: string) => {
    return toothNotes.some(n => n.tooth_number === toothNumber);
  };

  const hasUrgentTreatment = (toothNumber: string) => {
    const note = toothNotes.find(n => n.tooth_number === toothNumber);
    return note && (note.priority === 'urgent' || note.priority === 'high');
  };

  const handleToothClick = (toothNumber: string) => {
    if (onToothSelect) {
      onToothSelect(toothNumber, activeSystem);
    } else {
      // Open note dialog
      setSelectedToothForNote(toothNumber);
      setIsNoteDialogOpen(true);
    }
  };

  const toothNumbers = getToothNumbers();

  // Realistic SVG tooth component
  const RealisticTooth = ({ 
    toothNumber, 
    isUpper, 
    index, 
    toothType 
  }: { 
    toothNumber: string; 
    isUpper: boolean; 
    index: number;
    toothType: 'molar' | 'premolar' | 'canine' | 'incisor';
  }) => {
    const isSelected = selectedTooth === toothNumber;
    const toothColor = getToothColor(toothNumber);
    const hasNoteIndicator = hasNote(toothNumber);
    const isUrgent = hasUrgentTreatment(toothNumber);

    const getToothPath = () => {
      switch (toothType) {
        case 'molar':
          return isUpper 
            ? "M10 2 C14 2 18 4 18 8 L18 14 C18 18 14 20 10 20 C6 20 2 18 2 14 L2 8 C2 4 6 2 10 2 Z M6 22 L6 26 M14 22 L14 26" // Upper molar with roots
            : "M10 0 C14 0 18 2 18 6 L18 12 C18 16 14 18 10 18 C6 18 2 16 2 12 L2 6 C2 2 6 0 10 0 Z M6 18 L6 22 M14 18 L14 22"; // Lower molar with roots
        case 'premolar':
          return isUpper
            ? "M10 2 C13 2 16 4 16 7 L16 13 C16 16 13 18 10 18 C7 18 4 16 4 13 L4 7 C4 4 7 2 10 2 Z M10 18 L10 24" // Upper premolar with single root
            : "M10 0 C13 0 16 2 16 5 L16 11 C16 14 13 16 10 16 C7 16 4 14 4 11 L4 5 C4 2 7 0 10 0 Z M10 16 L10 20"; // Lower premolar with single root
        case 'canine':
          return isUpper
            ? "M10 2 C12 2 14 3 14 6 L14 12 C14 15 12 17 10 17 C8 17 6 15 6 12 L6 6 C6 3 8 2 10 2 Z M10 17 L10 26" // Upper canine with long root
            : "M10 0 C12 0 14 1 14 4 L14 10 C14 13 12 15 10 15 C8 15 6 13 6 10 L6 4 C6 1 8 0 10 0 Z M10 15 L10 22"; // Lower canine with long root
        case 'incisor':
          return isUpper
            ? "M10 2 C12 2 14 3 14 6 L14 11 C14 14 12 16 10 16 C8 16 6 14 6 11 L6 6 C6 3 8 2 10 2 Z M10 16 L10 24" // Upper incisor
            : "M10 0 C12 0 14 1 14 4 L14 9 C14 12 12 14 10 14 C8 14 6 12 6 9 L6 4 C6 1 8 0 10 0 Z M10 14 L10 20"; // Lower incisor
      }
    };

    return (
      <button
        key={`${isUpper ? 'upper' : 'lower'}-${toothNumber}`}
        onClick={() => handleToothClick(toothNumber)}
        className={cn(
          "relative transition-all duration-200 hover:scale-110 p-2 group",
          isSelected && "ring-2 ring-primary ring-offset-2"
        )}
        title={`السن رقم ${toothNumber} (${activeSystem.toUpperCase()})`}
      >
        <svg 
          width="24" 
          height={isUpper ? "32" : "28"} 
          viewBox={isUpper ? "0 0 20 28" : "0 0 20 24"}
          className="drop-shadow-sm"
        >
          {/* Tooth body */}
          <path
            d={getToothPath()}
            fill={toothColor}
            stroke="#d1d5db"
            strokeWidth="0.5"
            className="transition-colors duration-200"
          />
          
          {/* Tooth number label */}
          <text
            x="10"
            y={isUpper ? "10" : "8"}
            textAnchor="middle"
            className="text-[4px] font-bold fill-gray-700"
          >
            {toothNumber}
          </text>
        </svg>

        {/* Note indicator */}
        {hasNoteIndicator && (
          <div className="absolute -top-1 -right-1 w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
        )}

        {/* Urgent treatment indicator */}
        {isUrgent && (
          <div className="absolute -top-1 -left-1 w-2 h-2 bg-red-500 rounded-full animate-pulse" />
        )}
      </button>
    );
  };

  const getToothType = (index: number): 'molar' | 'premolar' | 'canine' | 'incisor' => {
    if (index <= 2 || index >= 13) return 'molar'; // First 3 and last 3 are molars
    if (index <= 4 || index >= 11) return 'premolar'; // Next 2 on each side are premolars  
    if (index === 5 || index === 10) return 'canine'; // 6th and 11th positions are canines
    return 'incisor'; // Middle 4 are incisors
  };

  return (
    <>
      <Card className="w-full max-w-5xl mx-auto">
        <CardHeader>
          <CardTitle className="text-center">مخطط الأسنان الواقعي</CardTitle>
          
          <div className="flex justify-center gap-2">
            <Button 
              variant={activeSystem === 'fdi' ? 'default' : 'outline'} 
              size="sm" 
              onClick={() => setActiveSystem('fdi')}
            >
              FDI
            </Button>
            <Button 
              variant={activeSystem === 'universal' ? 'default' : 'outline'} 
              size="sm" 
              onClick={() => setActiveSystem('universal')}
            >
              Universal
            </Button>
            <Button 
              variant={activeSystem === 'palmer' ? 'default' : 'outline'} 
              size="sm" 
              onClick={() => setActiveSystem('palmer')}
            >
              Palmer
            </Button>
          </div>

          {selectedTooth && (
            <div className="text-center">
              <Badge variant="secondary">السن المحدد: {selectedTooth}</Badge>
            </div>
          )}
        </CardHeader>

        <CardContent className="space-y-8">
          {/* Upper Teeth */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium text-center text-muted-foreground">الفك العلوي</h3>
            <div className="flex justify-center items-end gap-1 bg-gradient-to-b from-pink-50 to-pink-100 dark:from-pink-950 dark:to-pink-900 p-4 rounded-lg">
              {toothNumbers.upper.map((tooth, index) => (
                <RealisticTooth
                  key={`upper-${tooth}`}
                  toothNumber={tooth}
                  isUpper={true}
                  index={index}
                  toothType={getToothType(index)}
                />
              ))}
            </div>
          </div>

          {/* Midline - Bite line */}
          <div className="relative">
            <div className="border-t-2 border-dashed border-border"></div>
            <div className="absolute inset-x-0 -top-2 text-center">
              <span className="bg-background px-2 text-xs text-muted-foreground">خط الإطباق</span>
            </div>
          </div>

          {/* Lower Teeth */}
          <div className="space-y-4">
            <div className="flex justify-center items-start gap-1 bg-gradient-to-t from-pink-50 to-pink-100 dark:from-pink-950 dark:to-pink-900 p-4 rounded-lg">
              {toothNumbers.lower.map((tooth, index) => (
                <RealisticTooth
                  key={`lower-${tooth}`}
                  toothNumber={tooth}
                  isUpper={false}
                  index={index}
                  toothType={getToothType(index)}
                />
              ))}
            </div>
            <h3 className="text-sm font-medium text-center text-muted-foreground">الفك السفلي</h3>
          </div>

          {/* Legend */}
          <div className="bg-muted/50 p-4 rounded-lg">
            <h4 className="text-sm font-medium mb-3">مفتاح الألوان:</h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-white border border-gray-300 rounded"></div>
                <span>سليم</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-yellow-400 rounded"></div>
                <span>يحتاج فحص</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-red-500 rounded"></div>
                <span>يحتاج علاج عاجل</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-blue-500 rounded"></div>
                <span>معالج</span>
              </div>
            </div>
            
            <div className="mt-3 pt-3 border-t border-border">
              <h5 className="text-sm font-medium mb-2">المؤشرات:</h5>
              <div className="flex flex-wrap gap-4 text-xs">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-blue-500 rounded-full animate-pulse"></div>
                  <span>يوجد ملاحظات</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
                  <span>علاج طارئ</span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tooth Note Dialog */}
      <ToothNoteDialog
        isOpen={isNoteDialogOpen}
        onOpenChange={setIsNoteDialogOpen}
        patientId={patientId || ''}
        toothNumber={selectedToothForNote}
        numberingSystem={activeSystem}
        onNoteUpdate={fetchToothData}
      />
    </>
  );
};

export default RealisticToothChart;