import React from "react";
import { PageContainer } from "@/components/layout/PageContainer";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Brain, 
  Zap, 
  Target, 
  Cpu,
  BarChart3,
  Settings,
  Play,
  Pause,
  RefreshCw
} from "lucide-react";

const AIManagementDashboard = () => {
  const aiModules = [
    { 
      name: "التشخيص الذكي", 
      status: "نشط", 
      accuracy: "94%", 
      icon: Target,
      color: "bg-green-50 border-green-200"
    },
    { 
      name: "تحليل الأشعة", 
      status: "نشط", 
      accuracy: "91%", 
      icon: Brain,
      color: "bg-blue-50 border-blue-200"
    },
    { 
      name: "التنبؤ بالعلاج", 
      status: "قيد التطوير", 
      accuracy: "87%", 
      icon: Zap,
      color: "bg-yellow-50 border-yellow-200"
    },
    { 
      name: "معالجة اللغة", 
      status: "نشط", 
      accuracy: "96%", 
      icon: Cpu,
      color: "bg-purple-50 border-purple-200"
    }
  ];

  const recentAnalyses = [
    { patient: "أحمد محمد", analysis: "تحليل أشعة", result: "طبيعي", confidence: 94, time: "منذ 5 دقائق" },
    { patient: "فاطمة علي", analysis: "تشخيص ذكي", result: "يتطلب متابعة", confidence: 87, time: "منذ 15 دقيقة" },
    { patient: "محمد خالد", analysis: "تحليل نص", result: "تحليل مكتمل", confidence: 92, time: "منذ 30 دقيقة" }
  ];

  return (
    <PageContainer>
      <PageHeader 
        title="قائمة الذكاء الاصطناعي" 
        description="إدارة ومراقبة أنظمة الذكاء الاصطناعي والتعلم الآلي"
      />
      
      <div className="space-y-6">
        {/* System Status */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">الوحدات النشطة</p>
                  <p className="text-2xl font-bold">3</p>
                </div>
                <Brain className="h-8 w-8 text-green-600" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">معدل الدقة</p>
                  <p className="text-2xl font-bold">92%</p>
                </div>
                <Target className="h-8 w-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">التحليلات اليوم</p>
                  <p className="text-2xl font-bold">847</p>
                </div>
                <BarChart3 className="h-8 w-8 text-purple-600" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">وقت الاستجابة</p>
                  <p className="text-2xl font-bold">1.2ث</p>
                </div>
                <Zap className="h-8 w-8 text-yellow-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="modules" className="space-y-4">
          <TabsList>
            <TabsTrigger value="modules">الوحدات</TabsTrigger>
            <TabsTrigger value="analytics">التحليلات</TabsTrigger>
            <TabsTrigger value="training">التدريب</TabsTrigger>
            <TabsTrigger value="settings">الإعدادات</TabsTrigger>
          </TabsList>

          <TabsContent value="modules">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {aiModules.map((module, index) => {
                const IconComponent = module.icon;
                return (
                  <Card key={index} className={module.color}>
                    <CardHeader>
                      <CardTitle className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <IconComponent className="h-5 w-5" />
                          {module.name}
                        </div>
                        <Badge variant={module.status === "نشط" ? "default" : "secondary"}>
                          {module.status}
                        </Badge>
                      </CardTitle>
                      <CardDescription>
                        دقة النظام: {module.accuracy}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline">
                          <Play className="h-3 w-3 mr-2" />
                          تشغيل
                        </Button>
                        <Button size="sm" variant="outline">
                          <Pause className="h-3 w-3 mr-2" />
                          إيقاف
                        </Button>
                        <Button size="sm" variant="outline">
                          <Settings className="h-3 w-3 mr-2" />
                          إعدادات
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </TabsContent>

          <TabsContent value="analytics">
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>التحليلات الأخيرة</CardTitle>
                  <CardDescription>آخر التحليلات التي تم إجراؤها بواسطة الذكاء الاصطناعي</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {recentAnalyses.map((analysis, index) => (
                      <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                            <Brain className="h-5 w-5 text-blue-600" />
                          </div>
                          <div>
                            <p className="font-medium">{analysis.patient}</p>
                            <p className="text-sm text-muted-foreground">{analysis.analysis}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="text-center">
                            <p className="font-medium">{analysis.result}</p>
                            <p className="text-xs text-muted-foreground">ثقة: {analysis.confidence}%</p>
                          </div>
                          <span className="text-sm text-muted-foreground">{analysis.time}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>الأداء اليومي</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="h-64 flex items-center justify-center text-muted-foreground">
                      [مخطط الأداء اليومي]
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>معدل الدقة</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="h-64 flex items-center justify-center text-muted-foreground">
                      [مخطط معدل الدقة]
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="training">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>نماذج التدريب</CardTitle>
                  <CardDescription>النماذج المتاحة للتدريب والتحسين</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {[
                      { name: "نموذج تشخيص التسوس", version: "v2.1", status: "مدرب" },
                      { name: "نموذج تحليل الأشعة", version: "v1.8", status: "قيد التدريب" },
                      { name: "نموذج التنبؤ بالعلاج", version: "v1.3", status: "جديد" }
                    ].map((model, index) => (
                      <div key={index} className="flex items-center justify-between p-3 border rounded">
                        <div>
                          <p className="font-medium">{model.name}</p>
                          <p className="text-sm text-muted-foreground">{model.version}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant={model.status === "مدرب" ? "default" : "secondary"}>
                            {model.status}
                          </Badge>
                          <Button size="sm" variant="outline">
                            <RefreshCw className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>بيانات التدريب</CardTitle>
                  <CardDescription>إحصائيات بيانات التدريب المتاحة</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span>صور أشعة</span>
                      <span className="font-bold">12,456</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>تقارير طبية</span>
                      <span className="font-bold">8,923</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>تشخيصات مؤكدة</span>
                      <span className="font-bold">15,678</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>حالات متابعة</span>
                      <span className="font-bold">6,789</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="settings">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>إعدادات عامة</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span>تشغيل تلقائي</span>
                      <Button size="sm" variant="outline">تفعيل</Button>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>الحد الأدنى للثقة</span>
                      <span className="font-bold">85%</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>فترة إعادة التدريب</span>
                      <span className="font-bold">30 يوم</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>إعدادات الأمان</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span>تشفير البيانات</span>
                      <Badge variant="default">مفعل</Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>سجل العمليات</span>
                      <Badge variant="default">مفعل</Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>النسخ الاحتياطي</span>
                      <Badge variant="default">يومي</Badge>
                    </div>
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

export default AIManagementDashboard;
