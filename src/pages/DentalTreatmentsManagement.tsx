import React from "react";
import { PageContainer } from "@/components/layout/PageContainer";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Activity as TreatmentIcon, 
  Plus, 
  Search, 
  Filter,
  FileText,
  Clock,
  DollarSign,
  Users
} from "lucide-react";

const DentalTreatmentsManagement = () => {
  const treatmentCategories = [
    {
      name: "العلاج التحفظي",
      treatments: ["حشو أسنان", "تنظيف الأسنان", "معالجة العصب"],
      color: "bg-blue-50 border-blue-200"
    },
    {
      name: "جراحة الفم",
      treatments: ["خلع أسنان", "زراعة أسنان", "جراحة اللثة"],
      color: "bg-red-50 border-red-200"
    },
    {
      name: "التقويم",
      treatments: ["تقويم ثابت", "تقويم شفاف", "أجهزة متحركة"],
      color: "bg-green-50 border-green-200"
    },
    {
      name: "التجميل",
      treatments: ["تبييض الأسنان", "فينير", "تيجان"],
      color: "bg-purple-50 border-purple-200"
    }
  ];

  return (
    <PageContainer>
      <PageHeader 
        title="العلاجات السنية" 
        description="إدارة شاملة لجميع أنواع العلاجات السنية والخدمات المقدمة"
      />
      
      <div className="space-y-6">
        {/* Actions Bar */}
        <div className="flex justify-between items-center">
          <div className="flex gap-2">
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              إضافة علاج جديد
            </Button>
            <Button variant="outline">
              <Search className="h-4 w-4 mr-2" />
              بحث
            </Button>
            <Button variant="outline">
              <Filter className="h-4 w-4 mr-2" />
              تصنيف
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">إجمالي العلاجات</p>
                  <p className="text-2xl font-bold">124</p>
                </div>
                <TreatmentIcon className="h-8 w-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">العلاجات النشطة</p>
                  <p className="text-2xl font-bold">89</p>
                </div>
                <Clock className="h-8 w-8 text-green-600" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">متوسط السعر</p>
                  <p className="text-2xl font-bold">450 ر.س</p>
                </div>
                <DollarSign className="h-8 w-8 text-yellow-600" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">المرضى المستفيدين</p>
                  <p className="text-2xl font-bold">1,247</p>
                </div>
                <Users className="h-8 w-8 text-purple-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Treatment Categories */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {treatmentCategories.map((category, index) => (
            <Card key={index} className={category.color}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TreatmentIcon className="h-5 w-5" />
                  {category.name}
                </CardTitle>
                <CardDescription>
                  {category.treatments.length} علاج متاح
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {category.treatments.map((treatment, idx) => (
                    <div key={idx} className="flex items-center justify-between p-2 bg-white rounded border">
                      <span className="font-medium">{treatment}</span>
                      <div className="flex gap-2">
                        <Badge variant="outline">نشط</Badge>
                        <Button size="sm" variant="ghost">
                          <FileText className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
                <Button variant="outline" className="w-full mt-4">
                  عرض جميع العلاجات
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle>النشاطات الأخيرة</CardTitle>
            <CardDescription>آخر العلاجات المضافة والمحدثة</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[
                { action: "تم إضافة علاج جديد", treatment: "تنظيف عميق للأسنان", time: "منذ 2 ساعة" },
                { action: "تم تحديث السعر", treatment: "حشو أسنان أمامية", time: "منذ 4 ساعات" },
                { action: "تم إنجاز علاج", treatment: "زراعة سن واحد", time: "منذ 6 ساعات" }
              ].map((activity, index) => (
                <div key={index} className="flex items-center justify-between p-3 border rounded">
                  <div>
                    <p className="font-medium">{activity.action}</p>
                    <p className="text-sm text-muted-foreground">{activity.treatment}</p>
                  </div>
                  <span className="text-xs text-muted-foreground">{activity.time}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </PageContainer>
  );
};

export default DentalTreatmentsManagement;
