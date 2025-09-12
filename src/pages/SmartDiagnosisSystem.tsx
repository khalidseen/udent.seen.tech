import React from "react";
import { PageContainer } from "@/components/layout/PageContainer";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Activity, Brain, Zap, Target, Stethoscope, FileText } from "lucide-react";

const SmartDiagnosisSystem = () => {
  return (
    <PageContainer>
      <PageHeader 
        title="التشخيص الذكي" 
        description="نظام التشخيص المدعوم بالذكاء الاصطناعي للمساعدة في التشخيص الطبي"
      />
      
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">حالات مشخصة اليوم</p>
                  <p className="text-2xl font-bold">24</p>
                </div>
                <Activity className="h-8 w-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">دقة التشخيص</p>
                  <p className="text-2xl font-bold">94%</p>
                </div>
                <Target className="h-8 w-8 text-green-600" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">متوسط الوقت</p>
                  <p className="text-2xl font-bold">2.3 دقيقة</p>
                </div>
                <Zap className="h-8 w-8 text-yellow-600" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">حالات معقدة</p>
                  <p className="text-2xl font-bold">3</p>
                </div>
                <Brain className="h-8 w-8 text-purple-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>تشخيص جديد</CardTitle>
              <CardDescription>بدء عملية تشخيص جديدة بالذكاء الاصطناعي</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <Button className="w-full" size="lg">
                  <Stethoscope className="h-5 w-5 mr-2" />
                  بدء التشخيص الذكي
                </Button>
                <Button variant="outline" className="w-full">
                  <FileText className="h-5 w-5 mr-2" />
                  رفع صور أشعة
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>التشخيصات الأخيرة</CardTitle>
              <CardDescription>آخر التشخيصات المكتملة</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {[
                  { patient: "أحمد محمد", diagnosis: "تسوس متقدم", confidence: 94 },
                  { patient: "فاطمة علي", diagnosis: "التهاب اللثة", confidence: 89 },
                  { patient: "محمد خالد", diagnosis: "كسر في الضرس", confidence: 97 }
                ].map((item, index) => (
                  <div key={index} className="flex items-center justify-between p-3 border rounded">
                    <div>
                      <p className="font-medium">{item.patient}</p>
                      <p className="text-sm text-muted-foreground">{item.diagnosis}</p>
                    </div>
                    <Badge variant="default">{item.confidence}%</Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </PageContainer>
  );
};

export default SmartDiagnosisSystem;
