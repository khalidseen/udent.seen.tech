import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
interface ToothChartProps {
  onToothSelect: (toothNumber: string, numberingSystem: string) => void;
  selectedTooth?: string;
  numberingSystem?: 'universal' | 'palmer' | 'fdi';
}
const ToothChart = ({
  onToothSelect,
  selectedTooth,
  numberingSystem = 'universal'
}: ToothChartProps) => {
  const [activeSystem, setActiveSystem] = useState<'universal' | 'palmer' | 'fdi'>(numberingSystem);

  // Define tooth mappings for different numbering systems
  const universalNumbers = {
    upper: ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12', '13', '14', '15', '16'],
    lower: ['32', '31', '30', '29', '28', '27', '26', '25', '24', '23', '22', '21', '20', '19', '18', '17']
  };
  const palmerNumbers = {
    upper: ['8', '7', '6', '5', '4', '3', '2', '1', '1', '2', '3', '4', '5', '6', '7', '8'],
    lower: ['8', '7', '6', '5', '4', '3', '2', '1', '1', '2', '3', '4', '5', '6', '7', '8']
  };
  const fdiNumbers = {
    upper: ['18', '17', '16', '15', '14', '13', '12', '11', '21', '22', '23', '24', '25', '26', '27', '28'],
    lower: ['48', '47', '46', '45', '44', '43', '42', '41', '31', '32', '33', '34', '35', '36', '37', '38']
  };
  const getToothNumbers = () => {
    switch (activeSystem) {
      case 'palmer':
        return palmerNumbers;
      case 'fdi':
        return fdiNumbers;
      default:
        return universalNumbers;
    }
  };
  const toothNumbers = getToothNumbers();
  const handleToothClick = (toothNumber: string) => {
    onToothSelect(toothNumber, activeSystem);
  };
  const renderTooth = (toothNumber: string, isUpper: boolean, index: number) => {
    const isSelected = selectedTooth === toothNumber;
    const isMolar = index < 3 || index > 12; // Molars are typically at the ends
    const isPremolar = index >= 3 && index <= 5 || index >= 10 && index <= 12;
    const isCanine = index === 6 || index === 9;
    const isIncisor = index === 7 || index === 8;
    let toothShape = "rounded-md h-8 w-6";
    if (isMolar) toothShape = "rounded-lg h-10 w-8";
    if (isPremolar) toothShape = "rounded-md h-9 w-7";
    if (isCanine) toothShape = "rounded-full h-10 w-6";
    if (isIncisor) toothShape = "rounded-sm h-8 w-5";
    return <button key={`${isUpper ? 'upper' : 'lower'}-${toothNumber}`} onClick={() => handleToothClick(toothNumber)} className={cn(toothShape, "border-2 transition-all duration-200 hover:scale-110 flex items-center justify-center text-xs font-bold", isSelected ? "bg-primary text-primary-foreground border-primary shadow-lg" : "bg-background border-border hover:bg-accent hover:text-accent-foreground")} title={`السن رقم ${toothNumber} (${activeSystem.toUpperCase()})`}>
        {toothNumber}
      </button>;
  };
  return <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        
        <div className="flex justify-center gap-2">
          <Button variant={activeSystem === 'universal' ? 'default' : 'outline'} size="sm" onClick={() => setActiveSystem('universal')}>
            Universal
          </Button>
          <Button variant={activeSystem === 'palmer' ? 'default' : 'outline'} size="sm" onClick={() => setActiveSystem('palmer')}>
            Palmer
          </Button>
          <Button variant={activeSystem === 'fdi' ? 'default' : 'outline'} size="sm" onClick={() => setActiveSystem('fdi')}>
            FDI
          </Button>
        </div>
        {selectedTooth && <div className="text-center">
            <Badge variant="secondary">السن المحدد: {selectedTooth}</Badge>
          </div>}
      </CardHeader>
      <CardContent className="space-y-8">
        {/* Upper Teeth */}
        <div className="space-y-2">
          <h3 className="text-sm font-medium text-center text-muted-foreground">الفك العلوي</h3>
          <div className="flex justify-center gap-1">
            {toothNumbers.upper.map((tooth, index) => renderTooth(tooth, true, index))}
          </div>
        </div>

        {/* Midline */}
        <div className="border-t border-dashed border-border"></div>

        {/* Lower Teeth */}
        <div className="space-y-2">
          <div className="flex justify-center gap-1">
            {toothNumbers.lower.map((tooth, index) => renderTooth(tooth, false, index))}
          </div>
          <h3 className="text-sm font-medium text-center text-muted-foreground">الفك السفلي</h3>
        </div>

        {/* Legend */}
        <div className="bg-muted p-4 rounded-lg">
          <h4 className="text-sm font-medium mb-2">تصنيف الأسنان:</h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-blue-500 rounded-lg"></div>
              <span>أضراس (Molars)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-green-500 rounded-md"></div>
              <span>ضواحك (Premolars)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-yellow-500 rounded-full"></div>
              <span>أنياب (Canines)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-red-500 rounded-sm"></div>
              <span>قواطع (Incisors)</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>;
};
export default ToothChart;