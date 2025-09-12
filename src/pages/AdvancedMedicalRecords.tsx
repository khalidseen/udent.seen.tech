import React from "react";
import { PageContainer } from "@/components/layout/PageContainer";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  FolderOpen, 
  Plus, 
  Search, 
  FileText,
  Image,
  Video,
  Mic,
  Download,
  Upload,
  Eye,
  Edit
} from "lucide-react";

const AdvancedMedicalRecords = () => {
  const recordTypes = [
    { name: "التاريخ الطبي", count: 234, icon: FileText, color: "text-blue-600" },
    { name: "الصور الطبية", count: 156, icon: Image, color: "text-green-600" },
    { name: "التسجيلات الصوتية", count: 89, icon: Mic, color: "text-purple-600" },
    { name: "مقاطع الفيديو", count: 45, icon: Video, color: "text-red-600" }
  ];

  const recentRecords = [
    { patient: "أحمد محمد", type: "فحص شامل", date: "2025-01-15", status: "مكتمل" },
    { patient: "فاطمة علي", type: "تصوير أشعة", date: "2025-01-14", status: "قيد المراجعة" },
    { patient: "محمد خالد", type: "استشارة", date: "2025-01-14", status: "مكتمل" },
    { patient: "نورا أحمد", type: "متابعة علاج", date: "2025-01-13", status: "مكتمل" }
  ];

  return (
    <PageContainer>
      <PageHeader 
        title="السجلات الطبية المتقدمة" 
        description="نظام شامل لإدارة وتنظيم السجلات الطبية الرقمية"
      />
      
      <div className="space-y-6">
        {/* Quick Actions */}
        <div className="flex gap-4 flex-wrap">
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            سجل طبي جديد
          </Button>
          <Button variant="outline">
            <Upload className="h-4 w-4 mr-2" />
            رفع ملفات
          </Button>
          <Button variant="outline">
            <Search className="h-4 w-4 mr-2" />
            البحث المتقدم
          </Button>
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            تصدير السجلات
          </Button>
        </div>

        {/* Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {recordTypes.map((type, index) => {
            const IconComponent = type.icon;
            return (
              <Card key={index}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">{type.name}</p>
                      <p className="text-2xl font-bold">{type.count}</p>
                    </div>
                    <IconComponent className={`h-8 w-8 ${type.color}`} />
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Main Content */}
        <Tabs defaultValue="overview" className="space-y-4">
          <TabsList>
            <TabsTrigger value="overview">نظرة عامة</TabsTrigger>
            <TabsTrigger value="recent">السجلات الأخيرة</TabsTrigger>
            <TabsTrigger value="templates">القوالب</TabsTrigger>
            <TabsTrigger value="analytics">التحليلات</TabsTrigger>
          </TabsList>

          <TabsContent value="overview">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>إحصائيات السجلات</CardTitle>
                  <CardDescription>توزيع السجلات حسب النوع</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {recordTypes.map((type, index) => (
                      <div key={index} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <type.icon className={`h-4 w-4 ${type.color}`} />
                          <span>{type.name}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold">{type.count}</span>
                          <div className="w-20 bg-gray-200 rounded-full h-2">
                            <div 
                              className="bg-blue-600 h-2 rounded-full" 
                              style={{ width: `${(type.count / 234) * 100}%` }}
                            ></div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>الملفات الأخيرة</CardTitle>
                  <CardDescription>آخر الملفات المضافة</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {[
                      { name: "تقرير أشعة - أحمد محمد", size: "2.4 MB", time: "منذ 10 دقائق" },
                      { name: "صورة أسنان - فاطمة علي", size: "1.8 MB", time: "منذ 30 دقيقة" },
                      { name: "تسجيل استشارة - محمد خالد", size: "5.2 MB", time: "منذ ساعة" }
                    ].map((file, index) => (
                      <div key={index} className="flex items-center justify-between p-2 border rounded">
                        <div>
                          <p className="font-medium text-sm">{file.name}</p>
                          <p className="text-xs text-muted-foreground">{file.size} • {file.time}</p>
                        </div>
                        <div className="flex gap-1">
                          <Button size="sm" variant="ghost">
                            <Eye className="h-3 w-3" />
                          </Button>
                          <Button size="sm" variant="ghost">
                            <Download className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="recent">
            <Card>
              <CardHeader>
                <CardTitle>السجلات الأخيرة</CardTitle>
                <CardDescription>آخر السجلات الطبية المدخلة</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {recentRecords.map((record, index) => (
                    <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                          <FileText className="h-5 w-5 text-blue-600" />
                        </div>
                        <div>
                          <p className="font-medium">{record.patient}</p>
                          <p className="text-sm text-muted-foreground">{record.type}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <span className="text-sm text-muted-foreground">{record.date}</span>
                        <Badge variant={record.status === "مكتمل" ? "default" : "secondary"}>
                          {record.status}
                        </Badge>
                        <div className="flex gap-1">
                          <Button size="sm" variant="ghost">
                            <Eye className="h-3 w-3" />
                          </Button>
                          <Button size="sm" variant="ghost">
                            <Edit className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="templates">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[
                "قالب الفحص الشامل",
                "قالب استشارة التقويم", 
                "قالب زراعة الأسنان",
                "قالب تنظيف الأسنان",
                "قالب معالجة العصب",
                "قالب الجراحة"
              ].map((template, index) => (
                <Card key={index}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">{template}</p>
                        <p className="text-sm text-muted-foreground">قالب جاهز</p>
                      </div>
                      <Button size="sm">استخدام</Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="analytics">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>تحليل النشاط</CardTitle>
                  <CardDescription>معدل إنشاء السجلات الطبية</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-64 flex items-center justify-center text-muted-foreground">
                    [مخطط بياني لمعدل إنشاء السجلات]
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>أكثر الأطباء نشاطاً</CardTitle>
                  <CardDescription>الأطباء الذين أنشؤوا أكثر السجلات</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {[
                      { name: "د. أحمد محمد", records: 45, percentage: 85 },
                      { name: "د. فاطمة علي", records: 38, percentage: 70 },
                      { name: "د. محمد خالد", records: 32, percentage: 60 }
                    ].map((doctor, index) => (
                      <div key={index} className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">{doctor.name}</p>
                          <p className="text-sm text-muted-foreground">{doctor.records} سجل</p>
                        </div>
                        <div className="w-20 bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-green-600 h-2 rounded-full" 
                            style={{ width: `${doctor.percentage}%` }}
                          ></div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </PageContainer>
  );
};

export default AdvancedMedicalRecords;
