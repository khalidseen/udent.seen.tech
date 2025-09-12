import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  Settings, 
  Upload, 
  Download, 
  Trash2, 
  Eye, 
  Edit,
  FolderOpen,
  Package,
  Users,
  AlertTriangle,
  CheckCircle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { supabase } from '@/integrations/supabase/client';
import { GLBModelUploader } from './GLBModelUploader';
import { Enhanced3DToothViewer } from './Enhanced3DToothViewer';
import { toast } from 'sonner';

interface DentalModel {
  id: string;
  tooth_number: string;
  numbering_system: string;
  model_path: string;
  model_name: string;
  model_type: string;
  file_size: number;
  is_active: boolean;
  created_at: string;
}

interface PatientModel {
  id: string;
  patient_id: string;
  tooth_number: string;
  numbering_system: string;
  model_path: string;
  annotations: any[];
  created_at: string;
}

export const DentalModelsManager: React.FC = () => {
  const [activeTab, setActiveTab] = useState('default-models');
  const [previewModel, setPreviewModel] = useState<string | null>(null);
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const queryClient = useQueryClient();

  // جلب النماذج الافتراضية
  const { data: defaultModels, isLoading: loadingDefault } = useQuery({
    queryKey: ['dental-3d-models'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('dental_3d_models')
        .select('*')
        .eq('is_active', true)
        .order('tooth_number');
      
      if (error) throw error;
      return data as DentalModel[];
    }
  });

  // جلب النماذج المخصصة للمرضى
  const { data: patientModels, isLoading: loadingPatient } = useQuery({
    queryKey: ['patient-dental-models'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('patient_dental_models')
        .select(`
          *,
          patients!inner(full_name, clinic_id)
        `)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as any[];
    }
  });

  // حذف النموذج
  const deleteModelMutation = useMutation({
    mutationFn: async ({ id, type, modelPath }: { id: string; type: 'default' | 'patient'; modelPath: string }) => {
      // حذف الملف من Storage
      const { error: storageError } = await supabase.storage
        .from('dental-3d-models')
        .remove([modelPath]);
      
      if (storageError) throw storageError;

      // حذف البيانات من قاعدة البيانات
      const table = type === 'default' ? 'dental_3d_models' : 'patient_dental_models';
      const { error } = await supabase
        .from(table)
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dental-3d-models'] });
      queryClient.invalidateQueries({ queryKey: ['patient-dental-models'] });
      toast.success('تم حذف النموذج بنجاح');
    },
    onError: (error: any) => {
      toast.error(`خطأ في حذف النموذج: ${error.message}`);
    }
  });

  const getModelPreviewUrl = (modelPath: string) => {
    const { data } = supabase.storage
      .from('dental-3d-models')
      .getPublicUrl(modelPath);
    return data.publicUrl;
  };

  const getNumberingSystemLabel = (system: string) => {
    switch (system) {
      case 'universal': return 'عالمي (1-32)';
      case 'palmer': return 'بالمر (UR1-LL8)';
      case 'fdi': return 'FDI (11-48)';
      default: return system;
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">إدارة النماذج ثلاثية الأبعاد</h2>
          <p className="text-muted-foreground">
            إدارة نماذج الأسنان الافتراضية والمخصصة للمرضى
          </p>
        </div>
        
        <Dialog open={uploadDialogOpen} onOpenChange={setUploadDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Upload className="h-4 w-4 ml-2" />
              رفع نموذج جديد
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl">
            <DialogHeader>
              <DialogTitle>رفع نموذج ثلاثي الأبعاد</DialogTitle>
              <DialogDescription>
                اختر نوع النموذج ثم ارفع ملف GLB/GLTF
              </DialogDescription>
            </DialogHeader>
            <GLBModelUploader
              uploadType="default"
              onUploadComplete={() => {
                setUploadDialogOpen(false);
                queryClient.invalidateQueries({ queryKey: ['dental-3d-models'] });
              }}
            />
          </DialogContent>
        </Dialog>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="default-models" className="flex items-center gap-2">
            <Package className="h-4 w-4" />
            النماذج الافتراضية
          </TabsTrigger>
          <TabsTrigger value="patient-models" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            نماذج المرضى
          </TabsTrigger>
          <TabsTrigger value="statistics" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            الإحصائيات
          </TabsTrigger>
        </TabsList>

        <TabsContent value="default-models" className="space-y-4">
          <div className="grid gap-4">
            <Alert>
              <FolderOpen className="h-4 w-4" />
              <AlertDescription>
                النماذج الافتراضية متاحة لجميع المرضى. يمكن تخصيص نموذج لمريض محدد.
              </AlertDescription>
            </Alert>

            {loadingDefault ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {[...Array(6)].map((_, i) => (
                  <Card key={i} className="animate-pulse">
                    <CardHeader>
                      <div className="h-4 bg-muted rounded w-3/4"></div>
                      <div className="h-3 bg-muted rounded w-1/2"></div>
                    </CardHeader>
                    <CardContent>
                      <div className="h-32 bg-muted rounded"></div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {defaultModels?.map((model) => (
                  <Card key={model.id} className="group hover:shadow-lg transition-shadow">
                    <CardHeader>
                      <CardTitle className="flex items-center justify-between">
                        <span>السن {model.tooth_number}</span>
                        <Badge variant="outline">
                          {getNumberingSystemLabel(model.numbering_system)}
                        </Badge>
                      </CardTitle>
                      <CardDescription>
                        {model.model_name}
                      </CardDescription>
                    </CardHeader>
                    
                    <CardContent className="space-y-4">
                      <div className="aspect-square bg-muted/20 rounded-lg flex items-center justify-center">
                        <Package className="h-8 w-8 text-muted-foreground" />
                      </div>
                      
                      <div className="flex items-center justify-between text-sm text-muted-foreground">
                        <span>{formatFileSize(model.file_size || 0)}</span>
                        <span>{new Date(model.created_at).toLocaleDateString('ar-SA')}</span>
                      </div>
                      
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setPreviewModel(getModelPreviewUrl(model.model_path))}
                          className="flex-1"
                        >
                          <Eye className="h-4 w-4 ml-1" />
                          معاينة
                        </Button>
                        
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => deleteModelMutation.mutate({
                            id: model.id,
                            type: 'default',
                            modelPath: model.model_path
                          })}
                          disabled={deleteModelMutation.isPending}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="patient-models" className="space-y-4">
          <Alert>
            <Users className="h-4 w-4" />
            <AlertDescription>
              النماذج المخصصة للمرضى مع التعليقات والتعديلات الخاصة بكل مريض.
            </AlertDescription>
          </Alert>

          {loadingPatient ? (
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <Card key={i} className="animate-pulse">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="space-y-2">
                        <div className="h-4 bg-muted rounded w-48"></div>
                        <div className="h-3 bg-muted rounded w-32"></div>
                      </div>
                      <div className="h-8 bg-muted rounded w-20"></div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="space-y-4">
              {patientModels?.map((model: any) => (
                <Card key={model.id}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="space-y-1">
                        <h4 className="font-medium">
                          {model.patients?.full_name || 'مريض غير محدد'} - السن {model.tooth_number}
                        </h4>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Badge variant="secondary">
                            {getNumberingSystemLabel(model.numbering_system)}
                          </Badge>
                          <span>•</span>
                          <span>{model.annotations?.length || 0} تعليق</span>
                          <span>•</span>
                          <span>{new Date(model.created_at).toLocaleDateString('ar-SA')}</span>
                        </div>
                      </div>
                      
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setPreviewModel(getModelPreviewUrl(model.model_path))}
                        >
                          <Eye className="h-4 w-4 ml-1" />
                          عرض
                        </Button>
                        
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => deleteModelMutation.mutate({
                            id: model.id,
                            type: 'patient',
                            modelPath: model.model_path
                          })}
                          disabled={deleteModelMutation.isPending}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="statistics" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  النماذج الافتراضية
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{defaultModels?.length || 0}</div>
                <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                  <CheckCircle className="h-3 w-3" />
                  متاح للجميع
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  نماذج المرضى
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{patientModels?.length || 0}</div>
                <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                  <Users className="h-3 w-3" />
                  مخصص
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  إجمالي التعليقات
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {patientModels?.reduce((sum, model) => sum + (model.annotations?.length || 0), 0) || 0}
                </div>
                <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                  <Edit className="h-3 w-3" />
                  تفاعلي
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* معاينة النموذج */}
      <Dialog open={!!previewModel} onOpenChange={() => setPreviewModel(null)}>
        <DialogContent className="max-w-5xl h-[80vh]">
          <DialogHeader>
            <DialogTitle>معاينة النموذج ثلاثي الأبعاد</DialogTitle>
          </DialogHeader>
          {previewModel && (
            <Enhanced3DToothViewer
              toothNumber="معاينة"
              patientId="preview"
              modelUrl={previewModel}
              editable={false}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};