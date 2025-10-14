import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { StickyNote, Plus } from "lucide-react";
import { format } from "date-fns";
import { ar } from "date-fns/locale";
import { useState } from "react";

interface PatientNotesProps {
  patientId: string;
}

export function PatientNotes({ patientId }: PatientNotesProps) {
  const [isAdding, setIsAdding] = useState(false);
  const [newNote, setNewNote] = useState('');

  const { data: notes, isLoading } = useQuery({
    queryKey: ['patient-notes', patientId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('advanced_tooth_notes')
        .select('*')
        .eq('patient_id', patientId)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data;
    },
  });

  if (isLoading) {
    return <div className="text-center py-8">جاري التحميل...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">الملاحظات</h3>
        <Button size="sm" onClick={() => setIsAdding(!isAdding)}>
          <Plus className="w-4 h-4 mr-2" />
          ملاحظة جديدة
        </Button>
      </div>

      {isAdding && (
        <Card>
          <CardContent className="pt-4">
            <Textarea
              placeholder="أضف ملاحظة جديدة..."
              value={newNote}
              onChange={(e) => setNewNote(e.target.value)}
              className="mb-3"
              rows={4}
            />
            <div className="flex gap-2">
              <Button size="sm">حفظ</Button>
              <Button size="sm" variant="outline" onClick={() => {
                setIsAdding(false);
                setNewNote('');
              }}>
                إلغاء
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {!notes || notes.length === 0 ? (
        <Card>
          <CardContent className="pt-6">
            <p className="text-center text-muted-foreground">لا توجد ملاحظات</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {notes.map((note) => (
            <Card key={note.id}>
              <CardContent className="pt-4">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <StickyNote className="h-4 w-4 text-primary" />
                    <span className="font-medium">{note.title}</span>
                  </div>
                  <div className="text-sm">{note.content}</div>
                  <div className="text-xs text-muted-foreground">
                    {format(new Date(note.created_at), 'PPP', { locale: ar })}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
