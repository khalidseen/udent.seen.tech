import React from "react";
import { PageContainer } from "@/components/layout/PageContainer";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { TrendingUp, BarChart3, PieChart, LineChart } from "lucide-react";

const AIInsightsPage = () => {
  return (
    <PageContainer>
      <PageHeader 
        title="رؤى الذكاء الاصطناعي" 
        description="تحليلات ورؤى ذكية مستخرجة من بيانات العيادة"
      />
      
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">توقعات الإيرادات</p>
                  <p className="text-2xl font-bold">+15%</p>
                </div>
                <TrendingUp className="h-8 w-8 text-green-600" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">رضا المرضى</p>
                  <p className="text-2xl font-bold">4.8/5</p>
                </div>
                <BarChart3 className="h-8 w-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">كفاءة العمليات</p>
                  <p className="text-2xl font-bold">92%</p>
                </div>
                <PieChart className="h-8 w-8 text-purple-600" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">نمو العملاء</p>
                  <p className="text-2xl font-bold">+8%</p>
                </div>
                <LineChart className="h-8 w-8 text-yellow-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>التوصيات الذكية</CardTitle>
              <CardDescription>توصيات مبنية على تحليل البيانات</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[
                  "زيادة مواعيد التنظيف في فترة الصباح",
                  "تقديم خصومات لعلاجات التقويم",
                  "تحسين وقت انتظار المرضى",
                  "إضافة خدمات تجميلية جديدة"
                ].map((recommendation, index) => (
                  <div key={index} className="p-3 bg-blue-50 rounded border border-blue-200">
                    <p className="text-sm">{recommendation}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>التحليل التنبؤي</CardTitle>
              <CardDescription>توقعات الأشهر القادمة</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-64 flex items-center justify-center text-muted-foreground">
                [مخطط التوقعات]
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </PageContainer>
  );
};

export default AIInsightsPage;
