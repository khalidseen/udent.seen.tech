import React from "react";
import { PageContainer } from "@/components/layout/PageContainer";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Package, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";

const Dental3DModelsManagement = () => {
  const { data: models, isLoading } = useQuery({
    queryKey: ['dental-3d-models'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('dental_3d_models')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data || [];
    },
  });

  const totalModels = models?.length || 0;
  const modelTypes = models?.reduce((acc, m) => {
    acc[m.model_type] = (acc[m.model_type] || 0) + 1;
    return acc;
  }, {} as Record<string, number>) || {};

  const totalSize = models?.reduce((s, m) => s + (m.file_size || 0), 0) || 0;
  const formatSize = (bytes: number) => {
    if (bytes >= 1073741824) return `${(bytes / 1073741824).toFixed(1)} GB`;
    if (bytes >= 1048576) return `${(bytes / 1048576).toFixed(1)} MB`;
    if (bytes >= 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${bytes} B`;
  };

  const typeLabels: Record<string, string> = {
    tooth: 'أسنان',
    implant: 'زراعات',
    crown: 'تيجان',
    bridge: 'جسور',
    orthodontic: 'تقويم',
    default: 'عام',
  };

  return (
    <PageContainer>
      <PageHeader 
        title="إدارة النماذج ثلاثية الأبعاد" 
        description="عرض مكتبة النماذج ثلاثية الأبعاد المتاحة في النظام"
      />
      
      <div className="space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">إجمالي النماذج</p>
                  {isLoading ? <Skeleton className="h-8 w-16" /> : <p className="text-2xl font-bold">{totalModels}</p>}
                </div>
                <Package className="h-8 w-8 text-primary" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">أنواع النماذج</p>
                  {isLoading ? <Skeleton className="h-8 w-16" /> : <p className="text-2xl font-bold">{Object.keys(modelTypes).length}</p>}
                </div>
                <Package className="h-8 w-8 text-accent-foreground" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">إجمالي الحجم</p>
                  {isLoading ? <Skeleton className="h-8 w-16" /> : <p className="text-2xl font-bold">{formatSize(totalSize)}</p>}
                </div>
                <Package className="h-8 w-8 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Models Grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[...Array(4)].map((_, i) => (
              <Card key={i}><CardContent className="p-6"><Skeleton className="h-24 w-full" /></CardContent></Card>
            ))}
          </div>
        ) : totalModels === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <Package className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">لا توجد نماذج ثلاثية الأبعاد</h3>
              <p className="text-sm text-muted-foreground">لم يتم إضافة أي نماذج بعد في قاعدة البيانات</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {models?.map((model) => (
              <Card key={model.id}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Package className="h-5 w-5" />
                    {model.model_name}
                  </CardTitle>
                  <CardDescription>
                    {typeLabels[model.model_type] || model.model_type} • سن {model.tooth_number}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">الحجم:</span>
                      <span>{model.file_size ? formatSize(model.file_size) : 'غير محدد'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">نظام الترقيم:</span>
                      <span>{model.numbering_system}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </PageContainer>
  );
};

export default Dental3DModelsManagement;
