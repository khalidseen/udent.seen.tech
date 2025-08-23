import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Plus, X, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { supabase } from "@/integrations/supabase/client";
import AddMedicationDialog from "./AddMedicationDialog";

interface Medication {
  id: string;
  trade_name: string;
  generic_name?: string;
  strength: string;
  form: string;
  frequency: string;
  duration?: string;
  instructions?: string;
}

interface SelectedMedication extends Medication {
  custom_dosage?: string;
  custom_duration?: string;
  custom_instructions?: string;
}

interface MedicationSelectorProps {
  selectedMedications: SelectedMedication[];
  onMedicationsChange: (medications: SelectedMedication[]) => void;
  className?: string;
}

const MedicationSelector = ({ 
  selectedMedications, 
  onMedicationsChange, 
  className 
}: MedicationSelectorProps) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [showAddDialog, setShowAddDialog] = useState(false);

  const { data: medications = [], refetch } = useQuery({
    queryKey: ['medications', 'active'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('medications')
        .select('*')
        .eq('is_active', true)
        .order('trade_name');
      
      if (error) {
        console.error('Error fetching medications:', error);
        throw error;
      }
      
      return data as Medication[];
    }
  });

  const filteredMedications = medications.filter(med => {
    const isAlreadySelected = selectedMedications.some(selected => selected.id === med.id);
    if (isAlreadySelected) return false;

    const matchesSearch = 
      med.trade_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (med.generic_name && med.generic_name.toLowerCase().includes(searchTerm.toLowerCase()));
    
    return matchesSearch;
  });

  const handleSelectMedication = (medication: Medication) => {
    const newSelection: SelectedMedication = {
      ...medication,
      custom_dosage: medication.frequency,
      custom_duration: medication.duration || "",
      custom_instructions: medication.instructions || "",
    };
    
    onMedicationsChange([...selectedMedications, newSelection]);
    setSearchTerm("");
  };

  const handleRemoveMedication = (medicationId: string) => {
    onMedicationsChange(selectedMedications.filter(med => med.id !== medicationId));
  };

  const handleUpdateCustomValue = (medicationId: string, field: string, value: string) => {
    const updated = selectedMedications.map(med => 
      med.id === medicationId ? { ...med, [field]: value } : med
    );
    onMedicationsChange(updated);
  };

  return (
    <div className={className}>
      <div className="space-y-4">
        {/* Add Medication Section */}
        <div className="flex gap-2">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="البحث عن دواء للإضافة..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <Button
            type="button"
            variant="outline"
            onClick={() => setShowAddDialog(true)}
            className="flex items-center gap-2 shrink-0"
          >
            <Plus className="h-4 w-4" />
            دواء جديد
          </Button>
        </div>

        {/* Search Results */}
        {searchTerm && (
          <Card className="max-h-48 overflow-y-auto">
            <CardContent className="p-2">
              {filteredMedications.length === 0 ? (
                <div className="p-4 text-center text-muted-foreground text-sm">
                  لا توجد أدوية تطابق البحث
                </div>
              ) : (
                <div className="space-y-1">
                  {filteredMedications.map((medication) => (
                    <button
                      key={medication.id}
                      type="button"
                      onClick={() => handleSelectMedication(medication)}
                      className="w-full text-left p-3 rounded-md hover:bg-muted transition-colors"
                    >
                      <div className="font-medium">{medication.trade_name}</div>
                      <div className="text-sm text-muted-foreground">
                        {medication.generic_name} | {medication.strength} | {medication.form}
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Selected Medications */}
        {selectedMedications.length > 0 && (
          <div className="space-y-3">
            <Separator />
            <h4 className="font-medium text-sm">الأدوية الموصوفة ({selectedMedications.length})</h4>
            
            <div className="space-y-3">
              {selectedMedications.map((medication) => (
                <Card key={medication.id} className="p-4">
                  <div className="space-y-3">
                    {/* Medication Header */}
                    <div className="flex items-start justify-between">
                      <div>
                        <h5 className="font-medium">{medication.trade_name}</h5>
                        {medication.generic_name && (
                          <p className="text-sm text-muted-foreground">
                            {medication.generic_name}
                          </p>
                        )}
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant="secondary">{medication.strength}</Badge>
                          <Badge variant="outline">{medication.form}</Badge>
                        </div>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemoveMedication(medication.id)}
                        className="text-muted-foreground hover:text-destructive"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>

                    {/* Custom Dosage Fields */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div>
                        <label className="text-sm font-medium mb-1 block">الجرعة</label>
                        <Input
                          placeholder="مثال: 3 مرات يومياً"
                          value={medication.custom_dosage || ""}
                          onChange={(e) => handleUpdateCustomValue(medication.id, 'custom_dosage', e.target.value)}
                        />
                      </div>
                      <div>
                        <label className="text-sm font-medium mb-1 block">المدة</label>
                        <Input
                          placeholder="مثال: 7 أيام"
                          value={medication.custom_duration || ""}
                          onChange={(e) => handleUpdateCustomValue(medication.id, 'custom_duration', e.target.value)}
                        />
                      </div>
                    </div>

                    <div>
                      <label className="text-sm font-medium mb-1 block">تعليمات خاصة</label>
                      <Input
                        placeholder="تعليمات إضافية للمريض"
                        value={medication.custom_instructions || ""}
                        onChange={(e) => handleUpdateCustomValue(medication.id, 'custom_instructions', e.target.value)}
                      />
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Add Medication Dialog */}
      <AddMedicationDialog 
        open={showAddDialog} 
        onOpenChange={setShowAddDialog}
        onSuccess={() => {
          refetch();
          setShowAddDialog(false);
        }}
      />
    </div>
  );
};

export default MedicationSelector;