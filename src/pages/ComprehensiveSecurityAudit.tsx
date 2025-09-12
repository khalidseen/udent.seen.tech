import React from "react";
import { PageContainer } from "@/components/layout/PageContainer";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Shield, AlertTriangle, CheckCircle, Eye, Download } from "lucide-react";

const ComprehensiveSecurityAudit = () => {
  return (
    <PageContainer>
      <PageHeader 
        title="التدقيق الأمني الشامل" 
        description="مراقبة وتدقيق جميع العمليات الأمنية في النظام"
      />
      
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">أحداث اليوم</p>
                  <p className="text-2xl font-bold">1,247</p>
                </div>
                <Shield className="h-8 w-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">تهديدات محتملة</p>
                  <p className="text-2xl font-bold">3</p>
                </div>
                <AlertTriangle className="h-8 w-8 text-red-600" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">أحداث آمنة</p>
                  <p className="text-2xl font-bold">1,244</p>
                </div>
                <CheckCircle className="h-8 w-8 text-green-600" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">معدل الأمان</p>
                  <p className="text-2xl font-bold">99.8%</p>
                </div>
                <Shield className="h-8 w-8 text-green-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>سجل الأحداث الأمنية</CardTitle>
            <CardDescription>آخر الأحداث الأمنية المسجلة</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[
                { 
                  event: "محاولة دخول فاشلة", 
                  user: "غير معروف", 
                  time: "منذ 5 دقائق", 
                  severity: "عالي",
                  ip: "192.168.1.100"
                },
                { 
                  event: "تسجيل دخول ناجح", 
                  user: "د. أحمد محمد", 
                  time: "منذ 15 دقيقة", 
                  severity: "منخفض",
                  ip: "192.168.1.101"
                },
                { 
                  event: "تغيير كلمة المرور", 
                  user: "فاطمة علي", 
                  time: "منذ 30 دقيقة", 
                  severity: "متوسط",
                  ip: "192.168.1.102"
                },
                { 
                  event: "وصول غير مصرح", 
                  user: "محمد خالد", 
                  time: "منذ ساعة", 
                  severity: "عالي",
                  ip: "192.168.1.103"
                }
              ].map((log, index) => (
                <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                      <Shield className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                      <p className="font-medium">{log.event}</p>
                      <p className="text-sm text-muted-foreground">{log.user} • {log.ip}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <Badge 
                      variant={log.severity === "عالي" ? "destructive" : log.severity === "متوسط" ? "default" : "secondary"}
                    >
                      {log.severity}
                    </Badge>
                    <span className="text-sm text-muted-foreground">{log.time}</span>
                    <Button size="sm" variant="outline">
                      <Eye className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
            
            <div className="flex justify-between items-center mt-6 pt-4 border-t">
              <Button variant="outline">
                <Download className="h-4 w-4 mr-2" />
                تصدير السجل
              </Button>
              <Button>
                عرض جميع الأحداث
              </Button>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>إعدادات الأمان</CardTitle>
              <CardDescription>التحكم في إعدادات الأمان العامة</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span>المصادقة الثنائية</span>
                  <Badge variant="default">مفعل</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span>تشفير البيانات</span>
                  <Badge variant="default">مفعل</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span>سجل العمليات</span>
                  <Badge variant="default">مفعل</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span>النسخ الاحتياطي التلقائي</span>
                  <Badge variant="default">يومي</Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>التنبيهات الأمنية</CardTitle>
              <CardDescription>إعدادات التنبيهات الأمنية</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span>تنبيهات الدخول المشبوه</span>
                  <Badge variant="default">مفعل</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span>تنبيهات تغيير البيانات</span>
                  <Badge variant="default">مفعل</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span>تنبيهات النسخ الاحتياطي</span>
                  <Badge variant="default">مفعل</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span>تقارير أسبوعية</span>
                  <Badge variant="default">مفعل</Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </PageContainer>
  );
};

export default ComprehensiveSecurityAudit;
