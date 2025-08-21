import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Brain } from "lucide-react";
import { SmartDiagnosisDialog } from "@/components/ai-analysis/SmartDiagnosisDialog";

interface AISmartDiagnosisButtonProps {
  patientId?: string;
  medicalHistory?: string;
  symptoms?: string;
  onDiagnosisComplete?: (diagnosis: any) => void;
}

export function AISmartDiagnosisButton({
  patientId,
  medicalHistory,
  symptoms,
  onDiagnosisComplete
}: AISmartDiagnosisButtonProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  return (
    <>
      <Button
        onClick={() => setIsDialogOpen(true)}
        variant="outline"
        className="flex items-center gap-2"
      >
        <Brain className="w-4 h-4" />
        تشخيص ذكي
      </Button>

      <SmartDiagnosisDialog
        isOpen={isDialogOpen}
        onClose={() => setIsDialogOpen(false)}
        patientId={patientId}
        medicalHistory={medicalHistory}
        symptoms={symptoms}
        onDiagnosisComplete={(diagnosis) => {
          onDiagnosisComplete?.(diagnosis);
          setIsDialogOpen(false);
        }}
      />
    </>
  );
}