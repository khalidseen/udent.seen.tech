import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { Calendar, Save, Trash2, AlertCircle, FileText, Stethoscope, Pill, Eye } from "lucide-react";
import { format } from "date-fns";
import { ScrollArea } from "@/components/ui/scroll-area";

interface ToothNote {
  id: string;
  title: string;
  content: string;
  note_type: string;
  diagnosis?: string;
  treatment_plan?: string;
  status: string;
  priority: string;
  color_code: string;
  examination_date: string;
  follow_up_date?: string;
  created_at: string;
  updated_at: string;
}

interface ToothNoteDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  patientId: string;
  toothNumber: string;
  numberingSystem: string;
  onNoteUpdate?: () => void;
}

const ToothNoteDialog = ({
  isOpen,
  onOpenChange,
  patientId,
  toothNumber,
  numberingSystem,
  onNoteUpdate
}: ToothNoteDialogProps) => {
  const [notes, setNotes] = useState<ToothNote[]>([]);
  const [loading, setLoading] = useState(false);
  const [editingNote, setEditingNote] = useState<ToothNote | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    note_type: 'general',
    diagnosis: '',
    treatment_plan: '',
    status: 'active',
    priority: 'medium',
    color_code: '#3b82f6',
    examination_date: new Date().toISOString().split('T')[0],
    follow_up_date: ''
  });

  const noteTypes = [
    { value: 'general', label: 'ملاحظة عامة', icon: FileText },
    { value: 'diagnosis', label: 'تشخيص', icon: Stethoscope },
    { value: 'treatment', label: 'علاج', icon: Pill },
    { value: 'observation', label: 'مراقبة', icon: Eye }
  ];

  const priorities = [
    { value: 'low', label: 'منخفضة', color: '#22c55e' },
    { value: 'medium', label: 'متوسطة', color: '#3b82f6' },
    { value: 'high', label: 'عالية', color: '#f59e0b' },
    { value: 'urgent', label: 'عاجلة', color: '#ef4444' }
  ];

  const statusOptions = [
    { value: 'active', label: 'نشط' },
    { value: 'resolved', label: 'محلول' },
    { value: 'follow_up', label: 'متابعة' }
  ];

  const colorOptions = [
    { value: '#22c55e', label: 'أخضر (سليم)' },
    { value: '#3b82f6', label: 'أزرق (معلومات)' },
    { value: '#f59e0b', label: 'أصفر (تحذير)' },
    { value: '#ef4444', label: 'أحمر (عاجل)' },
    { value: '#8b5cf6', label: 'بنفسجي (علاج)' },
    { value: '#6b7280', label: 'رمادي (مراقبة)' }
  ];

  useEffect(() => {
    if (isOpen && patientId && toothNumber) {
      fetchNotes();
    }
  }, [isOpen, patientId, toothNumber]);

  useEffect(() => {
    if (editingNote) {
      setFormData({
        title: editingNote.title,
        content: editingNote.content,
        note_type: editingNote.note_type,
        diagnosis: editingNote.diagnosis || '',
        treatment_plan: editingNote.treatment_plan || '',
        status: editingNote.status,
        priority: editingNote.priority,
        color_code: editingNote.color_code,
        examination_date: editingNote.examination_date,
        follow_up_date: editingNote.follow_up_date || ''
      });
    } else {
      resetForm();
    }
  }, [editingNote]);

  const resetForm = () => {
    setFormData({
      title: '',
      content: '',
      note_type: 'general',
      diagnosis: '',
      treatment_plan: '',
      status: 'active',
      priority: 'medium',
      color_code: '#3b82f6',
      examination_date: new Date().toISOString().split('T')[0],
      follow_up_date: ''
    });
  };

  const fetchNotes = async () => {
    try {
      const { data, error } = await supabase
        .from('tooth_notes')
        .select('*')
        .eq('patient_id', patientId)
        .eq('tooth_number', toothNumber)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setNotes(data || []);
    } catch (error: any) {
      toast({
        title: 'خطأ',
        description: error.message,
        variant: 'destructive'
      });
    }
  };

  const handleSave = async () => {
    if (!formData.title.trim() || !formData.content.trim()) {
      toast({
        title: 'خطأ',
        description: 'يجب ملء العنوان والمحتوى',
        variant: 'destructive'
      });
      return;
    }

    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('يجب تسجيل الدخول أولاً');

      const { data: profile } = await supabase
        .from('profiles')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (!profile) throw new Error('لم يتم العثور على ملف المستخدم');

      const noteData = {
        clinic_id: profile.id,
        patient_id: patientId,
        tooth_number: toothNumber,
        numbering_system: numberingSystem,
        ...formData,
        follow_up_date: formData.follow_up_date || null
      };

      if (editingNote) {
        const { error } = await supabase
          .from('tooth_notes')
          .update(noteData)
          .eq('id', editingNote.id);

        if (error) throw error;
        
        toast({
          title: 'تم التحديث',
          description: 'تم تحديث الملاحظة بنجاح'
        });
      } else {
        const { error } = await supabase
          .from('tooth_notes')
          .insert(noteData);

        if (error) throw error;
        
        toast({
          title: 'تم الإضافة',
          description: 'تم إضافة الملاحظة بنجاح'
        });
      }

      await fetchNotes();
      setEditingNote(null);
      resetForm();
      onNoteUpdate?.();
    } catch (error: any) {
      toast({
        title: 'خطأ',
        description: error.message,
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (noteId: string) => {
    if (!confirm('هل أنت متأكد من حذف هذه الملاحظة؟')) return;

    try {
      const { error } = await supabase
        .from('tooth_notes')
        .delete()
        .eq('id', noteId);

      if (error) throw error;
      
      toast({
        title: 'تم الحذف',
        description: 'تم حذف الملاحظة بنجاح'
      });

      await fetchNotes();
      onNoteUpdate?.();
    } catch (error: any) {
      toast({
        title: 'خطأ',
        description: error.message,
        variant: 'destructive'
      });
    }
  };

  const getPriorityBadge = (priority: string) => {
    const priorityConfig = priorities.find(p => p.value === priority);
    return (
      <Badge 
        variant="outline" 
        style={{ borderColor: priorityConfig?.color, color: priorityConfig?.color }}
      >
        {priorityConfig?.label}
      </Badge>
    );
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            ملاحظات السن رقم {toothNumber}
          </DialogTitle>
          <DialogDescription>
            إدارة الملاحظات والتشخيصات الخاصة بالسن
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-6 overflow-hidden">
          {/* Existing Notes */}
          <div className="space-y-4">
            <h3 className="font-medium flex items-center gap-2">
              <Eye className="w-4 h-4" />
              الملاحظات الحالية ({notes.length})
            </h3>
            
            <ScrollArea className="h-[400px] pr-4">
              {notes.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <AlertCircle className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p>لا توجد ملاحظات لهذا السن</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {notes.map((note) => (
                    <Card key={note.id} className="relative">
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <div 
                              className="w-3 h-3 rounded-full" 
                              style={{ backgroundColor: note.color_code }}
                            />
                            <h4 className="font-medium text-sm">{note.title}</h4>
                          </div>
                          <div className="flex gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setEditingNote(note)}
                            >
                              تحرير
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDelete(note.id)}
                              className="text-destructive hover:text-destructive"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                        
                        <p className="text-sm text-muted-foreground mb-2">{note.content}</p>
                        
                        {note.diagnosis && (
                          <div className="mb-2">
                            <Badge variant="secondary" className="text-xs">التشخيص</Badge>
                            <p className="text-xs mt-1">{note.diagnosis}</p>
                          </div>
                        )}
                        
                        {note.treatment_plan && (
                          <div className="mb-2">
                            <Badge variant="secondary" className="text-xs">خطة العلاج</Badge>
                            <p className="text-xs mt-1">{note.treatment_plan}</p>
                          </div>
                        )}
                        
                        <div className="flex flex-wrap gap-2 mt-3">
                          {getPriorityBadge(note.priority)}
                          <Badge variant={note.status === 'active' ? 'default' : 'secondary'}>
                            {statusOptions.find(s => s.value === note.status)?.label}
                          </Badge>
                          <div className="flex items-center gap-1 text-xs text-muted-foreground">
                            <Calendar className="w-3 h-3" />
                            {format(new Date(note.examination_date), 'yyyy-MM-dd')}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </ScrollArea>
          </div>

          {/* Add/Edit Form */}
          <div className="space-y-4">
            <h3 className="font-medium flex items-center gap-2">
              <Save className="w-4 h-4" />
              {editingNote ? 'تحرير الملاحظة' : 'إضافة ملاحظة جديدة'}
            </h3>

            <ScrollArea className="h-[400px] pr-4">
              <div className="space-y-4">
                {/* Title */}
                <div className="space-y-2">
                  <Label>العنوان *</Label>
                  <Input
                    value={formData.title}
                    onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                    placeholder="عنوان الملاحظة"
                  />
                </div>

                {/* Note Type */}
                <div className="space-y-2">
                  <Label>نوع الملاحظة</Label>
                  <Select value={formData.note_type} onValueChange={(value) => setFormData(prev => ({ ...prev, note_type: value }))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {noteTypes.map((type) => (
                        <SelectItem key={type.value} value={type.value}>
                          <div className="flex items-center gap-2">
                            <type.icon className="w-4 h-4" />
                            {type.label}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Content */}
                <div className="space-y-2">
                  <Label>المحتوى *</Label>
                  <Textarea
                    value={formData.content}
                    onChange={(e) => setFormData(prev => ({ ...prev, content: e.target.value }))}
                    placeholder="محتوى الملاحظة..."
                    rows={3}
                  />
                </div>

                {/* Diagnosis */}
                <div className="space-y-2">
                  <Label>التشخيص</Label>
                  <Textarea
                    value={formData.diagnosis}
                    onChange={(e) => setFormData(prev => ({ ...prev, diagnosis: e.target.value }))}
                    placeholder="التشخيص..."
                    rows={2}
                  />
                </div>

                {/* Treatment Plan */}
                <div className="space-y-2">
                  <Label>خطة العلاج</Label>
                  <Textarea
                    value={formData.treatment_plan}
                    onChange={(e) => setFormData(prev => ({ ...prev, treatment_plan: e.target.value }))}
                    placeholder="خطة العلاج..."
                    rows={2}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  {/* Priority */}
                  <div className="space-y-2">
                    <Label>الأولوية</Label>
                    <Select value={formData.priority} onValueChange={(value) => setFormData(prev => ({ ...prev, priority: value }))}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {priorities.map((priority) => (
                          <SelectItem key={priority.value} value={priority.value}>
                            <div className="flex items-center gap-2">
                              <div 
                                className="w-3 h-3 rounded-full" 
                                style={{ backgroundColor: priority.color }}
                              />
                              {priority.label}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Status */}
                  <div className="space-y-2">
                    <Label>الحالة</Label>
                    <Select value={formData.status} onValueChange={(value) => setFormData(prev => ({ ...prev, status: value }))}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {statusOptions.map((status) => (
                          <SelectItem key={status.value} value={status.value}>
                            {status.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Color Code */}
                <div className="space-y-2">
                  <Label>لون المؤشر</Label>
                  <Select value={formData.color_code} onValueChange={(value) => setFormData(prev => ({ ...prev, color_code: value }))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {colorOptions.map((color) => (
                        <SelectItem key={color.value} value={color.value}>
                          <div className="flex items-center gap-2">
                            <div 
                              className="w-4 h-4 rounded-full border border-gray-300" 
                              style={{ backgroundColor: color.value }}
                            />
                            {color.label}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  {/* Examination Date */}
                  <div className="space-y-2">
                    <Label>تاريخ الفحص</Label>
                    <Input
                      type="date"
                      value={formData.examination_date}
                      onChange={(e) => setFormData(prev => ({ ...prev, examination_date: e.target.value }))}
                    />
                  </div>

                  {/* Follow-up Date */}
                  <div className="space-y-2">
                    <Label>تاريخ المتابعة</Label>
                    <Input
                      type="date"
                      value={formData.follow_up_date}
                      onChange={(e) => setFormData(prev => ({ ...prev, follow_up_date: e.target.value }))}
                    />
                  </div>
                </div>
              </div>
            </ScrollArea>
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            إغلاق
          </Button>
          {editingNote && (
            <Button variant="outline" onClick={() => {
              setEditingNote(null);
              resetForm();
            }}>
              إلغاء التحرير
            </Button>
          )}
          <Button onClick={handleSave} disabled={loading}>
            <Save className="w-4 h-4 ml-2" />
            {loading ? 'جاري الحفظ...' : editingNote ? 'تحديث' : 'حفظ'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ToothNoteDialog;
