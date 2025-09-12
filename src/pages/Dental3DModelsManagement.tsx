import React from "react";
import { PageContainer } from "@/components/layout/PageContainer";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Package, Plus, Eye, Edit, Download, Upload, Trash } from "lucide-react";

const Dental3DModelsManagement = () => {
  return (
    <PageContainer>
      <PageHeader 
        title="إدارة النماذج ثلاثية الأبعاد" 
        description="إدارة وتنظيم مكتبة النماذج ثلاثية الأبعاد"
      />
      
      <div className="space-y-6">
        <div className="flex gap-4">
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            نموذج جديد
          </Button>
          <Button variant="outline">
            <Upload className="h-4 w-4 mr-2" />
            رفع نماذج
          </Button>
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            تصدير المكتبة
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">إجمالي النماذج</p>
                  <p className="text-2xl font-bold">156</p>
                </div>
                <Package className="h-8 w-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">نماذج الأسنان</p>
                  <p className="text-2xl font-bold">89</p>
                </div>
                <Package className="h-8 w-8 text-green-600" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">أدوات التقويم</p>
                  <p className="text-2xl font-bold">34</p>
                </div>
                <Package className="h-8 w-8 text-purple-600" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">قوالب جاهزة</p>
                  <p className="text-2xl font-bold">33</p>
                </div>
                <Package className="h-8 w-8 text-yellow-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            { name: "ضرس علوي", category: "أسنان خلفية", size: "2.4 MB", downloads: 45 },
            { name: "قاطع أمامي", category: "أسنان أمامية", size: "1.8 MB", downloads: 67 },
            { name: "جسر أسنان", category: "جسور", size: "3.2 MB", downloads: 23 },
            { name: "تاج ذهبي", category: "تيجان", size: "2.1 MB", downloads: 34 },
            { name: "زراعة تيتانيوم", category: "زراعات", size: "2.8 MB", downloads: 56 },
            { name: "تقويم شفاف", category: "تقويم", size: "4.1 MB", downloads: 78 },
            { name: "جهاز تثبيت", category: "أجهزة", size: "1.5 MB", downloads: 29 },
            { name: "نموذج فك كامل", category: "فكوك", size: "8.3 MB", downloads: 12 }
          ].map((model, index) => (
            <Card key={index}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Package className="h-5 w-5" />
                  {model.name}
                </CardTitle>
                <CardDescription>{model.category}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">الحجم:</span>
                    <span className="text-sm">{model.size}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">التحميلات:</span>
                    <span className="text-sm">{model.downloads}</span>
                  </div>
                  <div className="flex gap-1">
                    <Button size="sm" variant="outline" className="flex-1">
                      <Eye className="h-3 w-3" />
                    </Button>
                    <Button size="sm" variant="outline" className="flex-1">
                      <Edit className="h-3 w-3" />
                    </Button>
                    <Button size="sm" variant="outline" className="flex-1">
                      <Download className="h-3 w-3" />
                    </Button>
                    <Button size="sm" variant="outline" className="flex-1">
                      <Trash className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>الفئات الأكثر استخداماً</CardTitle>
              <CardDescription>النماذج الأكثر تحميلاً</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[
                  { category: "أسنان أمامية", count: 23, usage: 85 },
                  { category: "تقويم", count: 18, usage: 72 },
                  { category: "زراعات", count: 15, usage: 65 },
                  { category: "تيجان", count: 12, usage: 58 }
                ].map((cat, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">{cat.category}</p>
                      <p className="text-sm text-muted-foreground">{cat.count} نموذج</p>
                    </div>
                    <div className="text-center">
                      <p className="font-bold">{cat.usage}%</p>
                      <p className="text-xs text-muted-foreground">معدل الاستخدام</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>إحصائيات المكتبة</CardTitle>
              <CardDescription>معلومات شاملة عن مكتبة النماذج</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span>إجمالي الحجم:</span>
                  <span className="font-bold">2.4 GB</span>
                </div>
                <div className="flex justify-between items-center">
                  <span>آخر تحديث:</span>
                  <span className="font-bold">منذ يومين</span>
                </div>
                <div className="flex justify-between items-center">
                  <span>النماذج المفضلة:</span>
                  <span className="font-bold">23</span>
                </div>
                <div className="flex justify-between items-center">
                  <span>النماذج المشتركة:</span>
                  <span className="font-bold">45</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </PageContainer>
  );
};

export default Dental3DModelsManagement;
