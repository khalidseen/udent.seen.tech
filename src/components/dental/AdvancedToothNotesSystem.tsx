import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { 
  Plus, Edit, Save, X, Calendar as CalendarIcon, FileText, 
  Stethoscope, AlertTriangle, Clock, User, Star, Search,
  Tag, Paperclip, History, CheckCircle
} from 'lucide-react';

interface AdvancedToothNotesSystemProps {
  patientId: string;
  toothNumber: string;
  onClose: () => void;
}

interface AdvancedToothNote {
  id: string;
  title: string;
  content: string;
  note_type: string;
  diagnosis?: string;
  treatment_plan?: string;
  differential_diagnosis?: string[];
  status: string;
  priority: string;
  severity: string;
  color_code: string;
  tags?: string[];
  examination_date: string;
  follow_up_date?: string;
  treatment_start_date?: string;
  treatment_completion_date?: string;
  next_appointment_date?: string;
  symptoms?: string[];
  clinical_findings?: string;
  radiographic_findings?: string;
  treatment_performed?: string;
  materials_used?: string[];
  treatment_outcome?: string;
  complications?: string;
  patient_response?: string;
  treating_doctor?: string;
  assisting_staff?: string[];
  quality_score?: number;
  created_at: string;
  updated_at: string;
}

interface NoteTemplate {
  id: string;
  name: string;
  description?: string;
  category: string;
  title_template: string;
  content_template: string;
  default_note_type: string;
  default_priority: string;
  default_status: string;
}

const noteTypes = [
  { value: 'general', label: 'عام', icon: FileText },
  { value: 'diagnosis', label: 'تشخيص', icon: Stethoscope },
  { value: 'treatment_plan', label: 'خطة العلاج', icon: FileText },
  { value: 'progress_note', label: 'ملاحظة تطور', icon: CheckCircle },
  { value: 'consultation', label: 'استشارة', icon: User },
  { value: 'emergency', label: 'طوارئ', icon: AlertTriangle },
  { value: 'follow_up', label: 'متابعة', icon: Clock },
  { value: 'referral', label: 'إحالة', icon: User },
  { value: 'surgical_note', label: 'ملاحظة جراحية', icon: Stethoscope },
  { value: 'endodontic', label: 'علاج عصب', icon: Stethoscope },
  { value: 'periodontal', label: 'علاج لثة', icon: Stethoscope },
  { value: 'prosthodontic', label: 'تركيبات', icon: Stethoscope },
  { value: 'orthodontic', label: 'تقويم', icon: Stethoscope },
  { value: 'pediatric', label: 'أطفال', icon: Stethoscope },
  { value: 'oral_surgery', label: 'جراحة الفم', icon: Stethoscope },
  { value: 'preventive', label: 'وقائي', icon: Stethoscope }
];

const priorities = [
  { value: 'critical', label: 'حرج', color: 'destructive' },
  { value: 'high', label: 'عالي', color: 'default' },
  { value: 'medium', label: 'متوسط', color: 'secondary' },
  { value: 'low', label: 'منخفض', color: 'outline' }
];

const statuses = [
  { value: 'active', label: 'نشط', color: 'default' },
  { value: 'completed', label: 'مكتمل', color: 'secondary' },
  { value: 'under_treatment', label: 'تحت العلاج', color: 'default' },
  { value: 'awaiting_results', label: 'في انتظار النتائج', color: 'outline' },
  { value: 'cancelled', label: 'ملغي', color: 'destructive' },
  { value: 'postponed', label: 'مؤجل', color: 'outline' },
  { value: 'referred', label: 'محال', color: 'secondary' }
];

const severities = [
  { value: 'mild', label: 'خفيف', color: 'secondary' },
  { value: 'moderate', label: 'متوسط', color: 'default' },
  { value: 'severe', label: 'شديد', color: 'destructive' },
  { value: 'critical', label: 'حرج', color: 'destructive' }
];

export const AdvancedToothNotesSystem = ({ 
  patientId, 
  toothNumber, 
  onClose 
}: AdvancedToothNotesSystemProps) => {
  const [activeTab, setActiveTab] = useState('notes');
  const [isAddingNote, setIsAddingNote] = useState(false);
  const [editingNote, setEditingNote] = useState<AdvancedToothNote | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterPriority, setFilterPriority] = useState('all');
  
  const [newNote, setNewNote] = useState<Partial<AdvancedToothNote>>({
    title: '',
    content: '',
    note_type: 'general',
    status: 'active',
    priority: 'medium',
    severity: 'mild',
    color_code: '#3b82f6',
    examination_date: new Date().toISOString().split('T')[0],
    tags: [],
    symptoms: [],
    materials_used: [],
    assisting_staff: []
  });

  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch existing notes
  const { data: notes = [], isLoading: notesLoading } = useQuery({
    queryKey: ['advanced-tooth-notes', patientId, toothNumber],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('advanced_tooth_notes')
        .select('*')
        .eq('patient_id', patientId)
        .eq('tooth_number', toothNumber)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as AdvancedToothNote[];
    },
    enabled: !!patientId && !!toothNumber
  });

  // Fetch note templates
  const { data: templates = [] } = useQuery({
    queryKey: ['note-templates'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('advanced_note_templates')
        .select('*')
        .eq('is_active', true)
        .order('name');

      if (error) throw error;
      return data as NoteTemplate[];
    }
  });

  // Add note mutation
  const addNoteMutation = useMutation({
    mutationFn: async (noteData: Partial<AdvancedToothNote>) => {
      const { data: profile } = await supabase
        .from('profiles')
        .select('id')
        .eq('user_id', (await supabase.auth.getUser()).data.user?.id)
        .single();

      if (!profile) throw new Error('Profile not found');

      const insertData = {
        patient_id: patientId,
        clinic_id: profile.id,
        tooth_number: toothNumber,
        numbering_system: 'universal',
        created_by: (await supabase.auth.getUser()).data.user?.id,
        title: noteData.title || '',
        content: noteData.content || '',
        note_type: noteData.note_type || 'general',
        diagnosis: noteData.diagnosis,
        treatment_plan: noteData.treatment_plan,
        status: noteData.status || 'active',
        priority: noteData.priority || 'medium',
        severity: noteData.severity || 'mild',
        color_code: noteData.color_code || '#3b82f6',
        examination_date: noteData.examination_date,
        follow_up_date: noteData.follow_up_date,
        clinical_findings: noteData.clinical_findings,
        radiographic_findings: noteData.radiographic_findings,
        treating_doctor: noteData.treating_doctor
      };

      const { data, error } = await supabase
        .from('advanced_tooth_notes')
        .insert(insertData)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['advanced-tooth-notes'] });
      setIsAddingNote(false);
      setNewNote({
        title: '',
        content: '',
        note_type: 'general',
        status: 'active',
        priority: 'medium',
        severity: 'mild',
        color_code: '#3b82f6',
        examination_date: new Date().toISOString().split('T')[0],
        tags: [],
        symptoms: [],
        materials_used: [],
        assisting_staff: []
      });
      toast({
        title: "تم بنجاح",
        description: "تم إضافة الملاحظة الطبية بنجاح"
      });
    },
    onError: (error) => {
      toast({
        title: "خطأ",
        description: "فشل في إضافة الملاحظة",
        variant: "destructive"
      });
    }
  });

  // Update note mutation
  const updateNoteMutation = useMutation({
    mutationFn: async ({ id, ...updateData }: Partial<AdvancedToothNote> & { id: string }) => {
      const { data, error } = await supabase
        .from('advanced_tooth_notes')
        .update({
          ...updateData,
          last_modified_by: (await supabase.auth.getUser()).data.user?.id
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['advanced-tooth-notes'] });
      setEditingNote(null);
      toast({
        title: "تم بنجاح",
        description: "تم تحديث الملاحظة بنجاح"
      });
    },
    onError: () => {
      toast({
        title: "خطأ",
        description: "فشل في تحديث الملاحظة",
        variant: "destructive"
      });
    }
  });

  // Delete note mutation
  const deleteNoteMutation = useMutation({
    mutationFn: async (noteId: string) => {
      const { error } = await supabase
        .from('advanced_tooth_notes')
        .delete()
        .eq('id', noteId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['advanced-tooth-notes'] });
      toast({
        title: "تم بنجاح",
        description: "تم حذف الملاحظة بنجاح"
      });
    }
  });

  // Apply template
  const applyTemplate = (template: NoteTemplate) => {
    setNewNote(prev => ({
      ...prev,
      title: template.title_template,
      content: template.content_template,
      note_type: template.default_note_type,
      priority: template.default_priority,
      status: template.default_status
    }));
  };

  // Filter notes
  const filteredNotes = notes.filter(note => {
    const matchesSearch = note.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         note.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         note.diagnosis?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = filterStatus === 'all' || note.status === filterStatus;
    const matchesPriority = filterPriority === 'all' || note.priority === filterPriority;
    
    return matchesSearch && matchesStatus && matchesPriority;
  });

  const handleSaveNote = () => {
    if (!newNote.title || !newNote.content) {
      toast({
        title: "خطأ",
        description: "يرجى ملء العنوان والمحتوى",
        variant: "destructive"
      });
      return;
    }

    addNoteMutation.mutate(newNote);
  };

  const handleUpdateNote = () => {
    if (!editingNote) return;
    
    updateNoteMutation.mutate(editingNote);
  };

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case 'critical': return <AlertTriangle className="h-4 w-4 text-red-500" />;
      case 'high': return <AlertTriangle className="h-4 w-4 text-orange-500" />;
      case 'medium': return <Clock className="h-4 w-4 text-yellow-500" />;
      default: return <Clock className="h-4 w-4 text-green-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    const statusObj = statuses.find(s => s.value === status);
    return statusObj?.color || 'secondary';
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Stethoscope className="h-5 w-5" />
            النظام المتقدم للملاحظات الطبية - السن {toothNumber}
          </DialogTitle>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="notes">الملاحظات الطبية</TabsTrigger>
            <TabsTrigger value="templates">القوالب المعيارية</TabsTrigger>
            <TabsTrigger value="history">تاريخ العلاجات</TabsTrigger>
          </TabsList>

          <TabsContent value="notes" className="flex-1 flex flex-col space-y-4">
            {/* Filters and Search */}
            <div className="flex gap-4 items-center">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="البحث في الملاحظات..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                />
              </div>
              
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="الحالة" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">جميع الحالات</SelectItem>
                  {statuses.map(status => (
                    <SelectItem key={status.value} value={status.value}>
                      {status.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={filterPriority} onValueChange={setFilterPriority}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="الأولوية" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">جميع الأولويات</SelectItem>
                  {priorities.map(priority => (
                    <SelectItem key={priority.value} value={priority.value}>
                      {priority.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Button onClick={() => setIsAddingNote(true)}>
                <Plus className="h-4 w-4 ml-2" />
                إضافة ملاحظة
              </Button>
            </div>

            {/* Notes List */}
            <ScrollArea className="flex-1 pr-4">
              <div className="space-y-4">
                {filteredNotes.map(note => (
                  <Card key={note.id} className="border-r-4" style={{ borderRightColor: note.color_code }}>
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            {getPriorityIcon(note.priority)}
                            <h4 className="font-semibold">{note.title}</h4>
                            <Badge variant={getStatusColor(note.status) as any}>
                              {statuses.find(s => s.value === note.status)?.label}
                            </Badge>
                          </div>
                          
                          <p className="text-sm text-muted-foreground mb-2">
                            {note.content.substring(0, 150)}
                            {note.content.length > 150 && '...'}
                          </p>
                          
                          <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                            <span>تاريخ الفحص: {format(new Date(note.examination_date), 'yyyy/MM/dd', { locale: ar })}</span>
                            {note.diagnosis && <span>• التشخيص: {note.diagnosis}</span>}
                            {note.treating_doctor && <span>• الطبيب: {note.treating_doctor}</span>}
                          </div>
                          
                          {note.tags && note.tags.length > 0 && (
                            <div className="flex gap-1 mt-2">
                              {note.tags.map(tag => (
                                <Badge key={tag} variant="outline" className="text-xs">
                                  <Tag className="h-3 w-3 ml-1" />
                                  {tag}
                                </Badge>
                              ))}
                            </div>
                          )}
                        </div>
                        
                        <div className="flex gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setEditingNote(note)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => deleteNoteMutation.mutate(note.id)}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </CardHeader>
                  </Card>
                ))}
                
                {filteredNotes.length === 0 && !notesLoading && (
                  <div className="text-center py-8 text-muted-foreground">
                    لا توجد ملاحظات طبية لهذا السن
                  </div>
                )}
              </div>
            </ScrollArea>
          </TabsContent>

          <TabsContent value="templates" className="flex-1">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {templates.map(template => (
                <Card key={template.id} className="cursor-pointer hover:shadow-md transition-shadow"
                      onClick={() => applyTemplate(template)}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <h4 className="font-semibold">{template.name}</h4>
                      <Badge variant="outline">{template.category}</Badge>
                    </div>
                    {template.description && (
                      <p className="text-sm text-muted-foreground">{template.description}</p>
                    )}
                  </CardHeader>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="history" className="flex-1">
            <div className="text-center py-8 text-muted-foreground">
              تاريخ العلاجات سيتم تطويره في المرحلة القادمة
            </div>
          </TabsContent>
        </Tabs>

        {/* Add/Edit Note Dialog */}
        <Dialog open={isAddingNote || !!editingNote} onOpenChange={(open) => {
          if (!open) {
            setIsAddingNote(false);
            setEditingNote(null);
          }
        }}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingNote ? 'تعديل الملاحظة الطبية' : 'إضافة ملاحظة طبية جديدة'}
              </DialogTitle>
            </DialogHeader>

            <div className="space-y-6">
              {/* Basic Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>العنوان *</Label>
                  <Input
                    value={editingNote?.title || newNote.title || ''}
                    onChange={(e) => editingNote 
                      ? setEditingNote({ ...editingNote, title: e.target.value })
                      : setNewNote({ ...newNote, title: e.target.value })
                    }
                    placeholder="عنوان الملاحظة"
                  />
                </div>

                <div>
                  <Label>نوع الملاحظة</Label>
                  <Select 
                    value={editingNote?.note_type || newNote.note_type} 
                    onValueChange={(value) => editingNote
                      ? setEditingNote({ ...editingNote, note_type: value })
                      : setNewNote({ ...newNote, note_type: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {noteTypes.map(type => (
                        <SelectItem key={type.value} value={type.value}>
                          {type.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>الأولوية</Label>
                  <Select 
                    value={editingNote?.priority || newNote.priority} 
                    onValueChange={(value) => editingNote
                      ? setEditingNote({ ...editingNote, priority: value })
                      : setNewNote({ ...newNote, priority: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {priorities.map(priority => (
                        <SelectItem key={priority.value} value={priority.value}>
                          {priority.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>الحالة</Label>
                  <Select 
                    value={editingNote?.status || newNote.status} 
                    onValueChange={(value) => editingNote
                      ? setEditingNote({ ...editingNote, status: value })
                      : setNewNote({ ...newNote, status: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {statuses.map(status => (
                        <SelectItem key={status.value} value={status.value}>
                          {status.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Content */}
              <div>
                <Label>المحتوى *</Label>
                <Textarea
                  value={editingNote?.content || newNote.content || ''}
                  onChange={(e) => editingNote
                    ? setEditingNote({ ...editingNote, content: e.target.value })
                    : setNewNote({ ...newNote, content: e.target.value })
                  }
                  placeholder="محتوى الملاحظة التفصيلي..."
                  rows={4}
                />
              </div>

              {/* Medical Details */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>التشخيص</Label>
                  <Input
                    value={editingNote?.diagnosis || newNote.diagnosis || ''}
                    onChange={(e) => editingNote
                      ? setEditingNote({ ...editingNote, diagnosis: e.target.value })
                      : setNewNote({ ...newNote, diagnosis: e.target.value })
                    }
                    placeholder="التشخيص الأولي أو النهائي"
                  />
                </div>

                <div>
                  <Label>الطبيب المعالج</Label>
                  <Input
                    value={editingNote?.treating_doctor || newNote.treating_doctor || ''}
                    onChange={(e) => editingNote
                      ? setEditingNote({ ...editingNote, treating_doctor: e.target.value })
                      : setNewNote({ ...newNote, treating_doctor: e.target.value })
                    }
                    placeholder="اسم الطبيب المعالج"
                  />
                </div>
              </div>

              <div>
                <Label>خطة العلاج</Label>
                <Textarea
                  value={editingNote?.treatment_plan || newNote.treatment_plan || ''}
                  onChange={(e) => editingNote
                    ? setEditingNote({ ...editingNote, treatment_plan: e.target.value })
                    : setNewNote({ ...newNote, treatment_plan: e.target.value })
                  }
                  placeholder="خطة العلاج المقترحة..."
                  rows={3}
                />
              </div>

              {/* Clinical Findings */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>الفحص السريري</Label>
                  <Textarea
                    value={editingNote?.clinical_findings || newNote.clinical_findings || ''}
                    onChange={(e) => editingNote
                      ? setEditingNote({ ...editingNote, clinical_findings: e.target.value })
                      : setNewNote({ ...newNote, clinical_findings: e.target.value })
                    }
                    placeholder="نتائج الفحص السريري..."
                    rows={3}
                  />
                </div>

                <div>
                  <Label>الفحص الإشعاعي</Label>
                  <Textarea
                    value={editingNote?.radiographic_findings || newNote.radiographic_findings || ''}
                    onChange={(e) => editingNote
                      ? setEditingNote({ ...editingNote, radiographic_findings: e.target.value })
                      : setNewNote({ ...newNote, radiographic_findings: e.target.value })
                    }
                    placeholder="نتائج الفحص الإشعاعي..."
                    rows={3}
                  />
                </div>
              </div>

              {/* Dates */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label>تاريخ الفحص *</Label>
                  <Input
                    type="date"
                    value={editingNote?.examination_date || newNote.examination_date || ''}
                    onChange={(e) => editingNote
                      ? setEditingNote({ ...editingNote, examination_date: e.target.value })
                      : setNewNote({ ...newNote, examination_date: e.target.value })
                    }
                  />
                </div>

                <div>
                  <Label>تاريخ المتابعة</Label>
                  <Input
                    type="date"
                    value={editingNote?.follow_up_date || newNote.follow_up_date || ''}
                    onChange={(e) => editingNote
                      ? setEditingNote({ ...editingNote, follow_up_date: e.target.value })
                      : setNewNote({ ...newNote, follow_up_date: e.target.value })
                    }
                  />
                </div>

                <div>
                  <Label>الموعد القادم</Label>
                  <Input
                    type="date"
                    value={editingNote?.next_appointment_date || newNote.next_appointment_date || ''}
                    onChange={(e) => editingNote
                      ? setEditingNote({ ...editingNote, next_appointment_date: e.target.value })
                      : setNewNote({ ...newNote, next_appointment_date: e.target.value })
                    }
                  />
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => {
                setIsAddingNote(false);
                setEditingNote(null);
              }}>
                إلغاء
              </Button>
              <Button onClick={editingNote ? handleUpdateNote : handleSaveNote}>
                <Save className="h-4 w-4 ml-2" />
                {editingNote ? 'تحديث' : 'حفظ'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            إغلاق
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};