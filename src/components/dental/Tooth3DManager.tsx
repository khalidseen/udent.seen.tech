import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { supabase } from '@/integrations/supabase/client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import Tooth3D, { ToothAnnotation } from './Tooth3D';
import { 
  Eye, 
  Edit, 
  Trash2, 
  Plus, 
  Save, 
  RotateCcw, 
  Download,
  Settings,
  Info
} from 'lucide-react';

interface Tooth3DManagerProps {
  patientId: string;
  toothNumber: string;
  numberingSystem?: string;
  onClose?: () => void;
}

interface AnnotationForm {
  title: string;
  description: string;
  annotationType: 'decay' | 'fracture' | 'filling' | 'crown' | 'note';
  severity: 'low' | 'medium' | 'high' | 'critical';
  color: string;
}

const Tooth3DManager = ({ 
  patientId, 
  toothNumber, 
  numberingSystem = 'universal', 
  onClose 
}: Tooth3DManagerProps) => {
  const [interactionMode, setInteractionMode] = useState<'view' | 'annotate'>('view');
  const [selectedAnnotation, setSelectedAnnotation] = useState<string | undefined>();
  const [pendingPosition, setPendingPosition] = useState<[number, number, number] | null>(null);
  const [annotationForm, setAnnotationForm] = useState<AnnotationForm>({
    title: '',
    description: '',
    annotationType: 'note',
    severity: 'medium',
    color: '#ff0000'
  });
  const [isAddingAnnotation, setIsAddingAnnotation] = useState(false);

  const queryClient = useQueryClient();

  // Fetch annotations for this tooth
  const { data: annotations = [], isLoading } = useQuery({
    queryKey: ['tooth-annotations', patientId, toothNumber],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('tooth_3d_annotations')
        .select('*')
        .eq('patient_id', patientId)
        .eq('tooth_number', toothNumber)
        .eq('numbering_system', numberingSystem)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      return data.map(annotation => ({
        id: annotation.id,
        position: [annotation.position_x, annotation.position_y, annotation.position_z] as [number, number, number],
        color: annotation.color,
        title: annotation.title,
        description: annotation.description,
        annotationType: annotation.annotation_type as 'decay' | 'fracture' | 'filling' | 'crown' | 'note',
        severity: annotation.severity as 'low' | 'medium' | 'high' | 'critical'
      }));
    }
  });

  // Add annotation mutation
  const addAnnotationMutation = useMutation({
    mutationFn: async (data: { position: [number, number, number]; form: AnnotationForm }) => {
      const { error } = await supabase
        .from('tooth_3d_annotations')
        .insert({
          patient_id: patientId,
          tooth_number: toothNumber,
          numbering_system: numberingSystem,
          annotation_type: data.form.annotationType,
          position_x: data.position[0],
          position_y: data.position[1],
          position_z: data.position[2],
          color: data.form.color,
          title: data.form.title,
          description: data.form.description,
          severity: data.form.severity
        });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tooth-annotations'] });
      toast.success('تم إضافة التعليق بنجاح');
      setIsAddingAnnotation(false);
      setPendingPosition(null);
      setAnnotationForm({
        title: '',
        description: '',
        annotationType: 'note',
        severity: 'medium',
        color: '#ff0000'
      });
    },
    onError: (error) => {
      console.error('Error adding annotation:', error);
      toast.error('حدث خطأ في إضافة التعليق');
    }
  });

  // Delete annotation mutation
  const deleteAnnotationMutation = useMutation({
    mutationFn: async (annotationId: string) => {
      const { error } = await supabase
        .from('tooth_3d_annotations')
        .delete()
        .eq('id', annotationId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tooth-annotations'] });
      toast.success('تم حذف التعليق');
      setSelectedAnnotation(undefined);
    },
    onError: (error) => {
      console.error('Error deleting annotation:', error);
      toast.error('حدث خطأ في حذف التعليق');
    }
  });

  const handleAddAnnotation = (position: [number, number, number]) => {
    setPendingPosition(position);
    setIsAddingAnnotation(true);
  };

  const handleSaveAnnotation = () => {
    if (!pendingPosition || !annotationForm.title.trim()) {
      toast.error('يرجى إدخال عنوان التعليق');
      return;
    }

    addAnnotationMutation.mutate({
      position: pendingPosition,
      form: annotationForm
    });
  };

  const handleAnnotationClick = (annotation: ToothAnnotation) => {
    setSelectedAnnotation(annotation.id);
  };

  const getSeverityBadgeVariant = (severity: string) => {
    switch (severity) {
      case 'critical': return 'destructive';
      case 'high': return 'destructive';
      case 'medium': return 'default';
      case 'low': return 'secondary';
      default: return 'outline';
    }
  };

  const getAnnotationTypeIcon = (type: string) => {
    switch (type) {
      case 'decay': return '🦷';
      case 'fracture': return '⚡';
      case 'filling': return '🔧';
      case 'crown': return '👑';
      case 'note': return '📝';
      default: return '📍';
    }
  };

  if (isLoading) {
    return <div>جاري التحميل...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Controls */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>نموذج السن ثلاثي الأبعاد - رقم {toothNumber}</span>
            <div className="flex gap-2">
              <Button
                variant={interactionMode === 'view' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setInteractionMode('view')}
              >
                <Eye className="w-4 h-4 mr-1" />
                عرض
              </Button>
              <Button
                variant={interactionMode === 'annotate' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setInteractionMode('annotate')}
              >
                <Edit className="w-4 h-4 mr-1" />
                تعليق
              </Button>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {/* 3D Tooth Model */}
          <Tooth3D
            toothNumber={toothNumber}
            annotations={annotations}
            onAnnotationClick={handleAnnotationClick}
            onAddAnnotation={handleAddAnnotation}
            selectedAnnotation={selectedAnnotation}
            interactionMode={interactionMode}
          />
        </CardContent>
      </Card>

      {/* Annotations Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Annotations List */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>التعليقات ({annotations.length})</span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setInteractionMode('annotate')}
              >
                <Plus className="w-4 h-4 mr-1" />
                إضافة
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-64">
              <div className="space-y-3">
                {annotations.map((annotation) => (
                  <div
                    key={annotation.id}
                    className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                      selectedAnnotation === annotation.id 
                        ? 'border-primary bg-primary/5' 
                        : 'hover:bg-muted/50'
                    }`}
                    onClick={() => setSelectedAnnotation(annotation.id)}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="text-lg">{getAnnotationTypeIcon(annotation.annotationType)}</span>
                        <span className="font-medium">{annotation.title}</span>
                      </div>
                      <Badge variant={getSeverityBadgeVariant(annotation.severity)}>
                        {annotation.severity}
                      </Badge>
                    </div>
                    {annotation.description && (
                      <p className="text-sm text-muted-foreground mb-2">
                        {annotation.description}
                      </p>
                    )}
                    <div className="flex justify-between items-center">
                      <Badge variant="outline" className="text-xs">
                        {annotation.annotationType}
                      </Badge>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteAnnotationMutation.mutate(annotation.id);
                        }}
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                ))}
                {annotations.length === 0 && (
                  <div className="text-center text-muted-foreground py-8">
                    لا توجد تعليقات
                    <br />
                    انقر على "تعليق" ثم على السن لإضافة تعليق
                  </div>
                )}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Selected Annotation Details or Add Form */}
        <Card>
          <CardHeader>
            <CardTitle>
              {isAddingAnnotation ? 'إضافة تعليق جديد' : 'تفاصيل التعليق'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isAddingAnnotation ? (
              <div className="space-y-4">
                <div>
                  <Label htmlFor="title">العنوان *</Label>
                  <Input
                    id="title"
                    value={annotationForm.title}
                    onChange={(e) => setAnnotationForm(prev => ({ ...prev, title: e.target.value }))}
                    placeholder="أدخل عنوان التعليق"
                  />
                </div>

                <div>
                  <Label htmlFor="description">الوصف</Label>
                  <Textarea
                    id="description"
                    value={annotationForm.description}
                    onChange={(e) => setAnnotationForm(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="أدخل وصف مفصل (اختياري)"
                    rows={3}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="type">النوع</Label>
                    <Select 
                      value={annotationForm.annotationType} 
                      onValueChange={(value: any) => setAnnotationForm(prev => ({ ...prev, annotationType: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="decay">تسوس 🦷</SelectItem>
                        <SelectItem value="fracture">كسر ⚡</SelectItem>
                        <SelectItem value="filling">حشوة 🔧</SelectItem>
                        <SelectItem value="crown">تاج 👑</SelectItem>
                        <SelectItem value="note">ملاحظة 📝</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="severity">الخطورة</Label>
                    <Select 
                      value={annotationForm.severity} 
                      onValueChange={(value: any) => setAnnotationForm(prev => ({ ...prev, severity: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="low">منخفضة</SelectItem>
                        <SelectItem value="medium">متوسطة</SelectItem>
                        <SelectItem value="high">عالية</SelectItem>
                        <SelectItem value="critical">حرجة</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div>
                  <Label htmlFor="color">اللون</Label>
                  <div className="flex gap-2 items-center">
                    <Input
                      id="color"
                      type="color"
                      value={annotationForm.color}
                      onChange={(e) => setAnnotationForm(prev => ({ ...prev, color: e.target.value }))}
                      className="w-16 h-10"
                    />
                    <Input
                      value={annotationForm.color}
                      onChange={(e) => setAnnotationForm(prev => ({ ...prev, color: e.target.value }))}
                      placeholder="#ff0000"
                      className="flex-1"
                    />
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button 
                    onClick={handleSaveAnnotation}
                    disabled={addAnnotationMutation.isPending}
                    className="flex-1"
                  >
                    <Save className="w-4 h-4 mr-1" />
                    حفظ التعليق
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={() => {
                      setIsAddingAnnotation(false);
                      setPendingPosition(null);
                    }}
                  >
                    إلغاء
                  </Button>
                </div>
              </div>
            ) : selectedAnnotation ? (
              <div className="space-y-4">
                {(() => {
                  const annotation = annotations.find(a => a.id === selectedAnnotation);
                  if (!annotation) return <div>التعليق غير موجود</div>;
                  
                  return (
                    <>
                      <div className="flex items-center gap-2 mb-4">
                        <span className="text-2xl">{getAnnotationTypeIcon(annotation.annotationType)}</span>
                        <h3 className="text-lg font-semibold">{annotation.title}</h3>
                      </div>
                      
                      {annotation.description && (
                        <div>
                          <Label>الوصف</Label>
                          <p className="text-sm text-muted-foreground mt-1">{annotation.description}</p>
                        </div>
                      )}
                      
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label>النوع</Label>
                          <Badge variant="outline" className="mt-1 block w-fit">
                            {annotation.annotationType}
                          </Badge>
                        </div>
                        <div>
                          <Label>الخطورة</Label>
                          <Badge variant={getSeverityBadgeVariant(annotation.severity)} className="mt-1 block w-fit">
                            {annotation.severity}
                          </Badge>
                        </div>
                      </div>
                      
                      <div>
                        <Label>اللون</Label>
                        <div className="flex items-center gap-2 mt-1">
                          <div 
                            className="w-6 h-6 rounded border"
                            style={{ backgroundColor: annotation.color }}
                          />
                          <span className="text-sm text-muted-foreground">{annotation.color}</span>
                        </div>
                      </div>
                      
                      <Separator />
                      
                      <Button
                        variant="destructive"
                        onClick={() => deleteAnnotationMutation.mutate(annotation.id)}
                        disabled={deleteAnnotationMutation.isPending}
                        className="w-full"
                      >
                        <Trash2 className="w-4 h-4 mr-1" />
                        حذف التعليق
                      </Button>
                    </>
                  );
                })()}
              </div>
            ) : (
              <div className="text-center text-muted-foreground py-8">
                اختر تعليقاً لعرض التفاصيل
                <br />
                أو انقر على "تعليق" لإضافة تعليق جديد
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Tooth3DManager;