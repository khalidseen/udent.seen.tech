import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Edit3, MessageSquare, Plus } from 'lucide-react';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';
import type { DentalTreatmentRecord } from '@/types/dental-enhanced';

interface DentalChartNotesPanelProps {
  chartNote: string;
  onChartNoteChange: (value: string) => void;
  onSave: () => void;
  isSaving: boolean;
  editingNoteId: string | null;
  onCancelEdit: () => void;
  notes: DentalTreatmentRecord[];
  onEditNote: (note: DentalTreatmentRecord) => void;
}

export const DentalChartNotesPanel: React.FC<DentalChartNotesPanelProps> = ({
  chartNote,
  onChartNoteChange,
  onSave,
  isSaving,
  editingNoteId,
  onCancelEdit,
  notes,
  onEditNote,
}) => {
  return (
    <Card className="border bg-muted/20">
      <CardContent className="p-4 space-y-3">
        <div className="flex items-center gap-2 mb-1">
          <MessageSquare className="w-4 h-4 text-primary" />
          <Label className="text-sm font-semibold">ملاحظات على المخطط</Label>
        </div>
        <div className="flex gap-2">
          <Textarea
            value={chartNote}
            onChange={(event) => onChartNoteChange(event.target.value)}
            placeholder="اكتب ملاحظة عامة على المخطط السني..."
            rows={2}
            className="resize-none text-sm flex-1"
          />
          <div className="flex flex-col gap-1">
            <Button size="sm" onClick={onSave} disabled={!chartNote.trim() || isSaving} className="h-8">
              <Plus className="w-3.5 h-3.5 ml-1" />
              {editingNoteId ? 'تحديث' : 'حفظ'}
            </Button>
            {editingNoteId && (
              <Button size="sm" variant="ghost" onClick={onCancelEdit} className="h-8 text-xs">
                إلغاء
              </Button>
            )}
          </div>
        </div>

        {notes.length > 0 && (
          <div className="space-y-2 pt-2 border-t">
            {notes.map((note) => (
              <div key={note.id} className="flex items-start gap-2 p-2 rounded-lg border bg-background text-sm">
                <div className="flex-1">
                  <p className="text-foreground">{note.notes}</p>
                  <p className="text-[10px] text-muted-foreground mt-1">
                    {note.treatment_date && format(new Date(note.treatment_date), 'PPP', { locale: ar })}
                  </p>
                </div>
                <Button variant="ghost" size="icon" className="h-6 w-6 shrink-0" onClick={() => onEditNote(note)}>
                  <Edit3 className="w-3 h-3" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};