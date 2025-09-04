import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { 
  Plus, Edit, Trash2, Copy, FileText, Stethoscope,
  Search, Filter, X, Save
} from 'lucide-react';

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
  is_active: boolean;
  created_at: string;
}

interface AdvancedNoteTemplatesManagerProps {
  onTemplateSelect?: (template: NoteTemplate) => void;
  isDialog?: boolean;
  onClose?: () => void;
}

const templateCategories = [
  { value: 'general', label: 'عام' },
  { value: 'endodontic', label: 'علاج عصب' },
  { value: 'restorative', label: 'ترميم' },
  { value: 'oral_surgery', label: 'جراحة الفم' },
  { value: 'periodontal', label: 'علاج لثة' },
  { value: 'orthodontic', label: 'تقويم' },
  { value: 'pediatric', label: 'أطفال' },
  { value: 'preventive', label: 'وقائي' },
  { value: 'prosthodontic', label: 'تركيبات' },
  { value: 'emergency', label: 'طوارئ' }
];

const noteTypes = [
  { value: 'general', label: 'عام' },
  { value: 'diagnosis', label: 'تشخيص' },
  { value: 'treatment_plan', label: 'خطة العلاج' },
  { value: 'progress_note', label: 'ملاحظة تطور' },
  { value: 'consultation', label: 'استشارة' },
  { value: 'emergency', label: 'طوارئ' },
  { value: 'follow_up', label: 'متابعة' },
  { value: 'referral', label: 'إحالة' },
  { value: 'surgical_note', label: 'ملاحظة جراحية' },
  { value: 'endodontic', label: 'علاج عصب' },
  { value: 'periodontal', label: 'علاج لثة' },
  { value: 'prosthodontic', label: 'تركيبات' },
  { value: 'orthodontic', label: 'تقويم' },
  { value: 'pediatric', label: 'أطفال' },
  { value: 'oral_surgery', label: 'جراحة الفم' },
  { value: 'preventive', label: 'وقائي' }
];

const priorities = [
  { value: 'low', label: 'منخفض' },
  { value: 'medium', label: 'متوسط' },
  { value: 'high', label: 'عالي' },
  { value: 'critical', label: 'حرج' }
];

const statuses = [
  { value: 'active', label: 'نشط' },
  { value: 'completed', label: 'مكتمل' },
  { value: 'under_treatment', label: 'تحت العلاج' },
  { value: 'awaiting_results', label: 'في انتظار النتائج' },
  { value: 'cancelled', label: 'ملغي' },
  { value: 'postponed', label: 'مؤجل' },
  { value: 'referred', label: 'محال' }
];

export const AdvancedNoteTemplatesManager = ({ 
  onTemplateSelect, 
  isDialog = false, 
  onClose 
}: AdvancedNoteTemplatesManagerProps) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');
  const [isAddingTemplate, setIsAddingTemplate] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<NoteTemplate | null>(null);
  
  const [newTemplate, setNewTemplate] = useState({
    name: '',
    description: '',
    category: 'general',
    title_template: '',
    content_template: '',
    default_note_type: 'general',
    default_priority: 'medium',
    default_status: 'active'
  });

  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch templates
  const { data: templates = [], isLoading } = useQuery({
    queryKey: ['note-templates'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('advanced_note_templates')
        .select(`
          id,
          name,
          description,
          category,
          title_template,
          content_template,
          default_note_type,
          default_priority,
          default_status,
          is_active,
          created_at
        `)
        .eq('is_active', true)
        .order('name');

      if (error) throw error;
      return data as NoteTemplate[];
    }
  });

  // Add template mutation
  const addTemplateMutation = useMutation({
    mutationFn: async (templateData: typeof newTemplate) => {
      const { data: profile } = await supabase
        .from('profiles')
        .select('id')
        .eq('user_id', (await supabase.auth.getUser()).data.user?.id)
        .single();

      if (!profile) throw new Error('Profile not found');

      const { data, error } = await supabase
        .from('advanced_note_templates')
        .insert({
          ...templateData,
          clinic_id: profile.id,
          created_by: (await supabase.auth.getUser()).data.user?.id
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['note-templates'] });
      setIsAddingTemplate(false);
      setNewTemplate({
        name: '',
        description: '',
        category: 'general',
        title_template: '',
        content_template: '',
        default_note_type: 'general',
        default_priority: 'medium',
        default_status: 'active'
      });
      toast({
        title: "تم بنجاح",
        description: "تم إضافة القالب بنجاح"
      });
    },
    onError: () => {
      toast({
        title: "خطأ",
        description: "فشل في إضافة القالب",
        variant: "destructive"
      });
    }
  });

  // Update template mutation
  const updateTemplateMutation = useMutation({
    mutationFn: async ({ id, ...updateData }: Partial<NoteTemplate> & { id: string }) => {
      const { data, error } = await supabase
        .from('advanced_note_templates')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['note-templates'] });
      setEditingTemplate(null);
      toast({
        title: "تم بنجاح",
        description: "تم تحديث القالب بنجاح"
      });
    },
    onError: () => {
      toast({
        title: "خطأ",
        description: "فشل في تحديث القالب",
        variant: "destructive"
      });
    }
  });

  // Delete template mutation
  const deleteTemplateMutation = useMutation({
    mutationFn: async (templateId: string) => {
      const { error } = await supabase
        .from('advanced_note_templates')
        .update({ is_active: false })
        .eq('id', templateId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['note-templates'] });
      toast({
        title: "تم بنجاح",
        description: "تم حذف القالب بنجاح"
      });
    }
  });

  // Filter templates
  const filteredTemplates = templates.filter(template => {
    const matchesSearch = 
      template.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      template.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      template.content_template.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesCategory = filterCategory === 'all' || template.category === filterCategory;
    
    return matchesSearch && matchesCategory;
  });

  const handleSaveTemplate = () => {
    if (!newTemplate.name || !newTemplate.title_template || !newTemplate.content_template) {
      toast({
        title: "خطأ",
        description: "يرجى ملء جميع الحقول المطلوبة",
        variant: "destructive"
      });
      return;
    }

    addTemplateMutation.mutate(newTemplate);
  };

  const handleUpdateTemplate = () => {
    if (!editingTemplate) return;
    
    updateTemplateMutation.mutate(editingTemplate);
  };

  const handleCopyTemplate = (template: NoteTemplate) => {
    setNewTemplate({
      name: `نسخة من ${template.name}`,
      description: template.description || '',
      category: template.category,
      title_template: template.title_template,
      content_template: template.content_template,
      default_note_type: template.default_note_type,
      default_priority: template.default_priority,
      default_status: template.default_status
    });
    setIsAddingTemplate(true);
  };

  const getCategoryLabel = (category: string) => {
    return templateCategories.find(c => c.value === category)?.label || category;
  };

  const renderTemplateCard = (template: NoteTemplate) => (
    <Card key={template.id} className="border-r-4 border-r-primary">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <FileText className="h-4 w-4" />
              <h4 className="font-semibold">{template.name}</h4>
              <Badge variant="secondary" className="text-xs">
                {getCategoryLabel(template.category)}
              </Badge>
            </div>
            
            {template.description && (
              <p className="text-sm text-muted-foreground mb-2">
                {template.description}
              </p>
            )}
            
            <div className="text-xs text-muted-foreground">
              <span>النوع: {noteTypes.find(t => t.value === template.default_note_type)?.label}</span>
              <span className="mx-2">•</span>
              <span>الأولوية: {priorities.find(p => p.value === template.default_priority)?.label}</span>
            </div>
          </div>
          
          <div className="flex gap-2">
            {onTemplateSelect && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onTemplateSelect(template)}
              >
                اختيار
              </Button>
            )}
            
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleCopyTemplate(template)}
            >
              <Copy className="h-4 w-4" />
            </Button>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setEditingTemplate(template)}
            >
              <Edit className="h-4 w-4" />
            </Button>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={() => deleteTemplateMutation.mutate(template.id)}
            >
              <Trash2 className="h-4 w-4 text-destructive" />
            </Button>
          </div>
        </div>
      </CardHeader>
    </Card>
  );

  const content = (
    <div className="space-y-4">
      {/* Filters and Search */}
      <div className="flex gap-4 items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="البحث في القوالب..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9"
          />
        </div>
        
        <Select value={filterCategory} onValueChange={setFilterCategory}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="التصنيف" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">جميع التصنيفات</SelectItem>
            {templateCategories.map(category => (
              <SelectItem key={category.value} value={category.value}>
                {category.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Button onClick={() => setIsAddingTemplate(true)}>
          <Plus className="h-4 w-4 ml-2" />
          إضافة قالب
        </Button>
      </div>

      {/* Templates List */}
      <ScrollArea className="h-96">
        <div className="space-y-4">
          {filteredTemplates.map(renderTemplateCard)}
        </div>
      </ScrollArea>

      {/* Add Template Dialog */}
      <Dialog open={isAddingTemplate} onOpenChange={setIsAddingTemplate}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>إضافة قالب جديد</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="template-name">اسم القالب</Label>
                <Input
                  id="template-name"
                  value={newTemplate.name}
                  onChange={(e) => setNewTemplate(prev => ({ ...prev, name: e.target.value }))}
                />
              </div>
              
              <div>
                <Label htmlFor="template-category">التصنيف</Label>
                <Select 
                  value={newTemplate.category} 
                  onValueChange={(value) => setNewTemplate(prev => ({ ...prev, category: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {templateCategories.map(category => (
                      <SelectItem key={category.value} value={category.value}>
                        {category.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div>
              <Label htmlFor="template-description">الوصف</Label>
              <Input
                id="template-description"
                value={newTemplate.description}
                onChange={(e) => setNewTemplate(prev => ({ ...prev, description: e.target.value }))}
              />
            </div>
            
            <div>
              <Label htmlFor="template-title">قالب العنوان</Label>
              <Input
                id="template-title"
                value={newTemplate.title_template}
                onChange={(e) => setNewTemplate(prev => ({ ...prev, title_template: e.target.value }))}
                placeholder="مثال: فحص السن {tooth_number}"
              />
            </div>
            
            <div>
              <Label htmlFor="template-content">قالب المحتوى</Label>
              <Textarea
                id="template-content"
                value={newTemplate.content_template}
                onChange={(e) => setNewTemplate(prev => ({ ...prev, content_template: e.target.value }))}
                rows={6}
                placeholder="محتوى القالب..."
              />
            </div>
            
            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label htmlFor="template-type">نوع الملاحظة</Label>
                <Select 
                  value={newTemplate.default_note_type} 
                  onValueChange={(value) => setNewTemplate(prev => ({ ...prev, default_note_type: value }))}
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
                <Label htmlFor="template-priority">الأولوية</Label>
                <Select 
                  value={newTemplate.default_priority} 
                  onValueChange={(value) => setNewTemplate(prev => ({ ...prev, default_priority: value }))}
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
                <Label htmlFor="template-status">الحالة</Label>
                <Select 
                  value={newTemplate.default_status} 
                  onValueChange={(value) => setNewTemplate(prev => ({ ...prev, default_status: value }))}
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
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddingTemplate(false)}>
              إلغاء
            </Button>
            <Button onClick={handleSaveTemplate} disabled={addTemplateMutation.isPending}>
              <Save className="h-4 w-4 ml-2" />
              حفظ
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Template Dialog */}
      <Dialog open={!!editingTemplate} onOpenChange={() => setEditingTemplate(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>تعديل القالب</DialogTitle>
          </DialogHeader>
          
          {editingTemplate && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="edit-template-name">اسم القالب</Label>
                  <Input
                    id="edit-template-name"
                    value={editingTemplate.name}
                    onChange={(e) => setEditingTemplate(prev => prev ? ({ ...prev, name: e.target.value }) : null)}
                  />
                </div>
                
                <div>
                  <Label htmlFor="edit-template-category">التصنيف</Label>
                  <Select 
                    value={editingTemplate.category} 
                    onValueChange={(value) => setEditingTemplate(prev => prev ? ({ ...prev, category: value }) : null)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {templateCategories.map(category => (
                        <SelectItem key={category.value} value={category.value}>
                          {category.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div>
                <Label htmlFor="edit-template-description">الوصف</Label>
                <Input
                  id="edit-template-description"
                  value={editingTemplate.description || ''}
                  onChange={(e) => setEditingTemplate(prev => prev ? ({ ...prev, description: e.target.value }) : null)}
                />
              </div>
              
              <div>
                <Label htmlFor="edit-template-title">قالب العنوان</Label>
                <Input
                  id="edit-template-title"
                  value={editingTemplate.title_template}
                  onChange={(e) => setEditingTemplate(prev => prev ? ({ ...prev, title_template: e.target.value }) : null)}
                />
              </div>
              
              <div>
                <Label htmlFor="edit-template-content">قالب المحتوى</Label>
                <Textarea
                  id="edit-template-content"
                  value={editingTemplate.content_template}
                  onChange={(e) => setEditingTemplate(prev => prev ? ({ ...prev, content_template: e.target.value }) : null)}
                  rows={6}
                />
              </div>
              
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="edit-template-type">نوع الملاحظة</Label>
                  <Select 
                    value={editingTemplate.default_note_type} 
                    onValueChange={(value) => setEditingTemplate(prev => prev ? ({ ...prev, default_note_type: value }) : null)}
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
                  <Label htmlFor="edit-template-priority">الأولوية</Label>
                  <Select 
                    value={editingTemplate.default_priority} 
                    onValueChange={(value) => setEditingTemplate(prev => prev ? ({ ...prev, default_priority: value }) : null)}
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
                  <Label htmlFor="edit-template-status">الحالة</Label>
                  <Select 
                    value={editingTemplate.default_status} 
                    onValueChange={(value) => setEditingTemplate(prev => prev ? ({ ...prev, default_status: value }) : null)}
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
            </div>
          )}
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingTemplate(null)}>
              إلغاء
            </Button>
            <Button onClick={handleUpdateTemplate} disabled={updateTemplateMutation.isPending}>
              <Save className="h-4 w-4 ml-2" />
              حفظ التغييرات
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );

  if (isDialog) {
    return (
      <Dialog open onOpenChange={onClose}>
        <DialogContent className="max-w-4xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Stethoscope className="h-5 w-5" />
              إدارة قوالب الملاحظات الطبية
            </DialogTitle>
          </DialogHeader>
          {content}
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Stethoscope className="h-5 w-5" />
          قوالب الملاحظات الطبية
        </CardTitle>
      </CardHeader>
      <CardContent>
        {content}
      </CardContent>
    </Card>
  );
};