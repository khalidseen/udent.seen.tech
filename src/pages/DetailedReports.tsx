import React from "react";
import { PageContainer } from "@/components/layout/PageContainer";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileSpreadsheet, Download, Calendar, BarChart3 } from "lucide-react";

const DetailedReports = () => {
  return (
    <PageContainer>
      <PageHeader 
        title="التقارير التفصيلية" 
        description="تقارير شاملة ومفصلة عن أداء العيادة"
      />
      
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            { name: "تقرير المرضى", icon: BarChart3, count: "1,247 مريض" },
            { name: "تقرير المواعيد", icon: Calendar, count: "2,345 موعد" },
            { name: "تقرير الإيرادات", icon: FileSpreadsheet, count: "125,000 ر.س" },
            { name: "تقرير العلاجات", icon: FileSpreadsheet, count: "567 علاج" }
          ].map((report, index) => {
            const IconComponent = report.icon;
            return (
              <Card key={index}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <IconComponent className="h-5 w-5" />
                    {report.name}
                  </CardTitle>
                  <CardDescription>{report.count}</CardDescription>
                </CardHeader>
                <CardContent>
                  <Button size="sm" className="w-full">
                    <Download className="h-3 w-3 mr-2" />
                    تصدير
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>

        <Card>
          <CardHeader>
            <CardTitle>إنشاء تقرير مخصص</CardTitle>
            <CardDescription>أنشئ تقريراً مخصصاً حسب احتياجاتك</CardDescription>
          </CardHeader>
          <CardContent>
            <Button>إنشاء تقرير جديد</Button>
          </CardContent>
        </Card>
      </div>
    </PageContainer>
  );
};

export default DetailedReports;
