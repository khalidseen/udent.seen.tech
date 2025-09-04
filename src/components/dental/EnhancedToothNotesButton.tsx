import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AdvancedToothNotesSystem } from './AdvancedToothNotesSystem';
import { useAdvancedToothNotes } from '@/hooks/useAdvancedToothNotes';
import { FileText, AlertTriangle, Clock } from 'lucide-react';

interface EnhancedToothNotesButtonProps {
  patientId: string;
  toothNumber: string;
  className?: string;
}

export const EnhancedToothNotesButton = ({ 
  patientId, 
  toothNumber, 
  className 
}: EnhancedToothNotesButtonProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const { notes, getCriticalNotes, getFollowUpNotes } = useAdvancedToothNotes({ 
    patientId, 
    toothNumber 
  });

  const criticalCount = getCriticalNotes().filter(note => note.tooth_number === toothNumber).length;
  const followUpCount = getFollowUpNotes().filter(note => note.tooth_number === toothNumber).length;
  const totalNotes = notes.length;

  const getPriorityColor = () => {
    if (criticalCount > 0) return 'destructive';
    if (followUpCount > 0) return 'default';
    if (totalNotes > 0) return 'secondary';
    return 'outline';
  };

  const getIcon = () => {
    if (criticalCount > 0) return <AlertTriangle className="h-4 w-4" />;
    if (followUpCount > 0) return <Clock className="h-4 w-4" />;
    return <FileText className="h-4 w-4" />;
  };

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        onClick={() => setIsOpen(true)}
        className={className}
      >
        {getIcon()}
        <span className="ml-2">الملاحظات الطبية</span>
        {totalNotes > 0 && (
          <Badge variant={getPriorityColor() as any} className="ml-2">
            {totalNotes}
          </Badge>
        )}
      </Button>

      {isOpen && (
        <AdvancedToothNotesSystem
          patientId={patientId}
          toothNumber={toothNumber}
          onClose={() => setIsOpen(false)}
        />
      )}
    </>
  );
};