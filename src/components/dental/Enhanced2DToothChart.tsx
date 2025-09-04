import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Heart, AlertTriangle, Plus, Edit, FileText, Calendar, Trash2, Save, X } from 'lucide-react';
import { EnhancedToothNotesButton } from './EnhancedToothNotesButton';
interface Enhanced2DToothChartProps {
  patientId?: string;
  onToothSelect: (toothNumber: string) => void;
  selectedTooth?: string;
}
interface ToothCondition {
  id: string;
  tooth_number: string;
  condition_type: string;
  condition_color: string;
  notes: string;
  numbering_system: string;
  patient_id: string;
  clinic_id: string;
  treatment_date: string;
  created_at: string;
  updated_at: string;
}
interface ToothNote {
  id: string;
  tooth_number: string;
  title: string;
  content: string;
  note_type: string;
  priority: string;
  created_at: string;
}
const Enhanced2DToothChart = ({
  patientId,
  onToothSelect,
  selectedTooth
}: Enhanced2DToothChartProps) => {
  const [noteDialogOpen, setNoteDialogOpen] = useState(false);
  const [conditionDialogOpen, setConditionDialogOpen] = useState(false);
  const [newNote, setNewNote] = useState({
    title: '',
    content: '',
    note_type: 'general',
    priority: 'medium'
  });
  const [newCondition, setNewCondition] = useState({
    condition_type: 'healthy',
    condition_color: '#10b981',
    notes: ''
  });
  const {
    toast
  } = useToast();
  const queryClient = useQueryClient();

  // Universal numbering system only
  const toothNumbers = {
    upper: ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12', '13', '14', '15', '16'],
    lower: ['32', '31', '30', '29', '28', '27', '26', '25', '24', '23', '22', '21', '20', '19', '18', '17']
  };

  // Fetch teeth conditions
  const {
    data: toothConditions
  } = useQuery({
    queryKey: ['tooth-conditions', patientId],
    queryFn: async () => {
      if (!patientId) return [];
      const {
        data,
        error
      } = await supabase.from('tooth_conditions').select('*').eq('patient_id', patientId).eq('numbering_system', 'universal');
      if (error) throw error;
      return data as ToothCondition[];
    },
    enabled: !!patientId
  });

  // Fetch teeth notes
  const {
    data: toothNotes
  } = useQuery({
    queryKey: ['advanced-tooth-notes', patientId],
    queryFn: async () => {
      if (!patientId) return [];
      const {
        data,
        error
      } = await supabase.from('advanced_tooth_notes').select('*').eq('patient_id', patientId).eq('numbering_system', 'universal');
      if (error) throw error;
      return data as ToothNote[];
    },
    enabled: !!patientId
  });

  // Add note mutation
  const addNoteMutation = useMutation({
    mutationFn: async (noteData: any) => {
      const {
        data: profile
      } = await supabase.from('profiles').select('id').eq('user_id', (await supabase.auth.getUser()).data.user?.id).single();
      const {
        data,
        error
      } = await supabase.from('tooth_notes').insert({
        ...noteData,
        patient_id: patientId,
        clinic_id: profile?.id,
        tooth_number: selectedTooth,
        numbering_system: 'universal'
      }).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['tooth-notes']
      });
      setNoteDialogOpen(false);
      setNewNote({
        title: '',
        content: '',
        note_type: 'general',
        priority: 'medium'
      });
      toast({
        title: "تم بنجاح",
        description: "تم إضافة الملاحظة بنجاح"
      });
    }
  });

  // Add condition mutation
  const addConditionMutation = useMutation({
    mutationFn: async (conditionData: any) => {
      const {
        data: profile
      } = await supabase.from('profiles').select('id').eq('user_id', (await supabase.auth.getUser()).data.user?.id).single();
      const {
        data,
        error
      } = await supabase.from('tooth_conditions').insert({
        ...conditionData,
        patient_id: patientId,
        clinic_id: profile?.id,
        tooth_number: selectedTooth,
        numbering_system: 'universal',
        treatment_date: new Date().toISOString().split('T')[0]
      }).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['tooth-conditions']
      });
      setConditionDialogOpen(false);
      setNewCondition({
        condition_type: 'healthy',
        condition_color: '#10b981',
        notes: ''
      });
      toast({
        title: "تم بنجاح",
        description: "تم إضافة حالة السن بنجاح"
      });
    }
  });
  const handleToothClick = (toothNumber: string) => {
    onToothSelect(toothNumber);
  };
  const getToothCondition = (toothNumber: string) => {
    return toothConditions?.find(c => c.tooth_number === toothNumber);
  };
  const getToothNotes = (toothNumber: string) => {
    return toothNotes?.filter(n => n.tooth_number === toothNumber) || [];
  };
  const getToothColor = (toothNumber: string) => {
    const condition = getToothCondition(toothNumber);
    const notes = getToothNotes(toothNumber);
    const hasHighPriorityNotes = notes.some(n => n.priority === 'high');
    if (!condition && notes.length === 0) return 'default';
    if (hasHighPriorityNotes) return 'warning';
    switch (condition?.condition_type) {
      case 'decay':
        return 'decay';
      case 'filled':
        return 'filled';
      case 'crown':
        return 'crown';
      case 'missing':
        return 'missing';
      case 'root_canal':
        return 'root_canal';
      case 'implant':
        return 'implant';
      default:
        return notes.length > 0 ? 'has_notes' : 'healthy';
    }
  };
  const getToothColorClasses = (colorType: string, isSelected: boolean) => {
    if (isSelected) {
      return "bg-primary text-primary-foreground border-primary shadow-lg";
    }
    switch (colorType) {
      case 'critical':
        return "bg-red-100 border-red-500 text-red-800 hover:bg-red-150";
      case 'decay':
        return "bg-orange-100 border-orange-500 text-orange-800 hover:bg-orange-150";
      case 'filled':
        return "bg-blue-100 border-blue-500 text-blue-800 hover:bg-blue-150";
      case 'crown':
        return "bg-purple-100 border-purple-500 text-purple-800 hover:bg-purple-150";
      case 'missing':
        return "bg-gray-200 border-gray-500 text-gray-800 hover:bg-gray-250";
      case 'root_canal':
        return "bg-pink-100 border-pink-500 text-pink-800 hover:bg-pink-150";
      case 'implant':
        return "bg-green-100 border-green-500 text-green-800 hover:bg-green-150";
      case 'warning':
        return "bg-yellow-100 border-yellow-500 text-yellow-800 hover:bg-yellow-150";
      case 'has_notes':
        return "bg-cyan-100 border-cyan-500 text-cyan-800 hover:bg-cyan-150";
      case 'healthy':
        return "bg-emerald-100 border-emerald-500 text-emerald-800 hover:bg-emerald-150";
      default:
        return "bg-background border-border hover:bg-accent hover:text-accent-foreground";
    }
  };
  const renderTooth = (toothNumber: string, isUpper: boolean, index: number) => {
    const isSelected = selectedTooth === toothNumber;
    const condition = getToothCondition(toothNumber);
    const notes = getToothNotes(toothNumber);
    const colorType = getToothColor(toothNumber);

    // Determine tooth shape based on position
    const isMolar = index < 3 || index > 12;
    const isPremolar = index >= 3 && index <= 5 || index >= 10 && index <= 12;
    const isCanine = index === 6 || index === 9;
    const isIncisor = index === 7 || index === 8;
    let toothShape = "rounded-md h-8 w-6";
    if (isMolar) toothShape = "rounded-lg h-10 w-8";
    if (isPremolar) toothShape = "rounded-md h-9 w-7";
    if (isCanine) toothShape = "rounded-full h-10 w-6";
    if (isIncisor) toothShape = "rounded-sm h-8 w-5";
    return (
      <div key={`${isUpper ? 'upper' : 'lower'}-${toothNumber}`} className="relative flex flex-col items-center gap-1">
        <button
          onClick={() => handleToothClick(toothNumber)}
          className={cn(
            toothShape,
            "border-2 transition-all duration-200 hover:scale-110 flex items-center justify-center text-xs font-bold relative",
            getToothColorClasses(colorType, isSelected)
          )}
          title={`السن رقم ${toothNumber} (Universal)${condition ? ` - ${condition.condition_type}` : ''}${notes.length > 0 ? ` - ${notes.length} ملاحظة` : ''}`}
        >
          {toothNumber}
          
          {/* Notes indicator */}
          {notes.length > 0 && (
            <div className="absolute -top-1 -right-1">
              <Badge
                variant={notes.some(n => n.priority === 'high') ? "destructive" : "secondary"}
                className="text-xs h-4 w-4 p-0 flex items-center justify-center rounded-full"
              >
                {notes.length}
              </Badge>
            </div>
          )}
          
          {/* Condition indicator */}
          {condition && condition.condition_type === 'decay' && (
            <div className="absolute -top-1 -left-1">
              <AlertTriangle className="h-3 w-3 text-red-600" />
            </div>
          )}
        </button>
        
        {/* Enhanced Notes Button */}
        {patientId && (
          <EnhancedToothNotesButton
            patientId={patientId}
            toothNumber={toothNumber}
            className="scale-75"
          />
        )}
      </div>
    );
  };
  
  return <div className="space-y-4">
      <Card className="w-full max-w-6xl mx-auto">
        <CardHeader>
          <CardTitle className="text-center">مخطط الأسنان ثنائي الأبعاد المحسن (Universal System)</CardTitle>

          {selectedTooth && <div className="text-center space-y-2">
              <Badge variant="secondary" className="text-sm">
                السن المحدد: {selectedTooth}
                {getToothNotes(selectedTooth).length > 0 && <span className="ml-2">
                    ({getToothNotes(selectedTooth).length} ملاحظة)
                  </span>}
              </Badge>
              
              {patientId && <div className="flex justify-center gap-2">
                  <Button variant="outline" size="sm" onClick={() => setNoteDialogOpen(true)}>
                    <Plus className="h-4 w-4 ml-2" />
                    إضافة ملاحظة
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => setConditionDialogOpen(true)}>
                    <Edit className="h-4 w-4 ml-2" />
                    تحديث الحالة
                  </Button>
                </div>}
            </div>}
        </CardHeader>

        <CardContent className="space-y-8">
          {/* Upper Teeth */}
          <div className="space-y-2">
            <h3 className="text-sm font-medium text-center text-muted-foreground">الفك العلوي</h3>
            <div className="flex justify-center gap-2 flex-wrap">
              {toothNumbers.upper.map((tooth, index) => renderTooth(tooth, true, index))}
            </div>
          </div>

          {/* Midline */}
          <div className="border-t border-dashed border-border"></div>

          {/* Lower Teeth */}
          <div className="space-y-2">
            <div className="flex justify-center gap-2 flex-wrap">
              {toothNumbers.lower.map((tooth, index) => renderTooth(tooth, false, index))}
            </div>
            <h3 className="text-sm font-medium text-center text-muted-foreground">الفك السفلي</h3>
          </div>

          {/* Enhanced Legend */}
          <div className="bg-muted p-4 rounded-lg">
            <h4 className="text-sm font-medium mb-3 text-center">مفتاح الألوان والحالات:</h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-emerald-100 border border-emerald-500 rounded"></div>
                <span>سليم</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-orange-100 border border-orange-500 rounded"></div>
                <span>تسوس</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-blue-100 border border-blue-500 rounded"></div>
                <span>محشو</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-purple-100 border border-purple-500 rounded"></div>
                <span>تاج</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-pink-100 border border-pink-500 rounded"></div>
                <span>علاج عصب</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-green-100 border border-green-500 rounded"></div>
                <span>زراعة</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-gray-200 border border-gray-500 rounded"></div>
                <span>مفقود</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-cyan-100 border border-cyan-500 rounded"></div>
                <span>له ملاحظات</span>
              </div>
            </div>
          </div>

          {/* Selected Tooth Details */}
          {selectedTooth && <div className="bg-muted/50 p-4 rounded-lg space-y-4">
              <h4 className="font-medium text-center">تفاصيل السن {selectedTooth}</h4>
              
              {/* Current Condition */}
              {getToothCondition(selectedTooth) && <div className="space-y-2">
                  <h5 className="text-sm font-medium">الحالة الحالية:</h5>
                  <Badge variant="outline" className="text-xs">
                    {getToothCondition(selectedTooth)?.condition_type}
                  </Badge>
                </div>}
              
              {/* Recent Notes */}
              {getToothNotes(selectedTooth).length > 0 && <div className="space-y-2">
                  <h5 className="text-sm font-medium">الملاحظات الحديثة:</h5>
                  <div className="space-y-1 max-h-32 overflow-y-auto">
                    {getToothNotes(selectedTooth).slice(0, 3).map(note => <div key={note.id} className="text-xs bg-background p-2 rounded border">
                        <div className="font-medium">{note.title}</div>
                        <div className="text-muted-foreground truncate">{note.content}</div>
                      </div>)}
                  </div>
                </div>}
            </div>}
        </CardContent>
      </Card>

      {/* Add Note Dialog */}
      <Dialog open={noteDialogOpen} onOpenChange={setNoteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>إضافة ملاحظة للسن {selectedTooth}</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <Label htmlFor="note-title">عنوان الملاحظة</Label>
              <Input id="note-title" value={newNote.title} onChange={e => setNewNote({
              ...newNote,
              title: e.target.value
            })} placeholder="أدخل عنوان الملاحظة" />
            </div>
            
            <div>
              <Label htmlFor="note-content">محتوى الملاحظة</Label>
              <Textarea id="note-content" value={newNote.content} onChange={e => setNewNote({
              ...newNote,
              content: e.target.value
            })} placeholder="أدخل تفاصيل الملاحظة" rows={4} />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="note-type">نوع الملاحظة</Label>
                <Select value={newNote.note_type} onValueChange={value => setNewNote({
                ...newNote,
                note_type: value
              })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="general">عام</SelectItem>
                    <SelectItem value="treatment">علاج</SelectItem>
                    <SelectItem value="diagnosis">تشخيص</SelectItem>
                    <SelectItem value="follow_up">متابعة</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label htmlFor="note-priority">الأولوية</Label>
                <Select value={newNote.priority} onValueChange={value => setNewNote({
                ...newNote,
                priority: value
              })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">منخفضة</SelectItem>
                    <SelectItem value="medium">متوسطة</SelectItem>
                    <SelectItem value="high">عالية</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setNoteDialogOpen(false)}>
                <X className="h-4 w-4 ml-2" />
                إلغاء
              </Button>
              <Button onClick={() => addNoteMutation.mutate(newNote)} disabled={!newNote.title || !newNote.content}>
                <Save className="h-4 w-4 ml-2" />
                حفظ
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Add Condition Dialog */}
      <Dialog open={conditionDialogOpen} onOpenChange={setConditionDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>تحديث حالة السن {selectedTooth}</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <Label htmlFor="condition-type">نوع الحالة</Label>
              <Select value={newCondition.condition_type} onValueChange={value => setNewCondition({
              ...newCondition,
              condition_type: value
            })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="healthy">سليم</SelectItem>
                  <SelectItem value="decay">تسوس</SelectItem>
                  <SelectItem value="filled">محشو</SelectItem>
                  <SelectItem value="crown">تاج</SelectItem>
                  <SelectItem value="root_canal">علاج عصب</SelectItem>
                  <SelectItem value="implant">زراعة</SelectItem>
                  <SelectItem value="missing">مفقود</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label htmlFor="condition-color">لون الحالة</Label>
              <Select value={newCondition.condition_color} onValueChange={value => setNewCondition({
              ...newCondition,
              condition_color: value
            })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="#10b981">أخضر (سليم)</SelectItem>
                  <SelectItem value="#f59e0b">برتقالي (تسوس)</SelectItem>
                  <SelectItem value="#3b82f6">أزرق (محشو)</SelectItem>
                  <SelectItem value="#8b5cf6">بنفسجي (تاج)</SelectItem>
                  <SelectItem value="#ef4444">أحمر (مشكلة)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label htmlFor="condition-notes">ملاحظات إضافية</Label>
              <Textarea id="condition-notes" value={newCondition.notes} onChange={e => setNewCondition({
              ...newCondition,
              notes: e.target.value
            })} placeholder="أدخل ملاحظات إضافية عن حالة السن" rows={3} />
            </div>
            
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setConditionDialogOpen(false)}>
                <X className="h-4 w-4 ml-2" />
                إلغاء
              </Button>
              <Button onClick={() => addConditionMutation.mutate(newCondition)}>
                <Save className="h-4 w-4 ml-2" />
                حفظ
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>;
};
export default Enhanced2DToothChart;