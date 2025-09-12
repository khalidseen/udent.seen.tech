import React from "react";
import { PageContainer } from "@/components/layout/PageContainer";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Mail, Plus, Edit, Copy } from "lucide-react";

const CustomNotificationTemplates = () => {
  return (
    <PageContainer>
      <PageHeader 
        title="قوالب الإشعارات المخصصة" 
        description="إنشاء وإدارة قوالب الإشعارات المخصصة"
      />
      
      <div className="space-y-6">
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          قالب جديد
        </Button>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[
            { name: "تذكير بالموعد", category: "مواعيد", usage: 45 },
            { name: "تأكيد الحجز", category: "حجوزات", usage: 32 },
            { name: "تذكير بالدفع", category: "مدفوعات", usage: 28 },
            { name: "نتائج الفحص", category: "نتائج", usage: 19 },
            { name: "تعليمات ما بعد العلاج", category: "علاج", usage: 15 },
            { name: "ترحيب بمريض جديد", category: "ترحيب", usage: 12 }
          ].map((template, index) => (
            <Card key={index}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Mail className="h-5 w-5" />
                  {template.name}
                </CardTitle>
                <CardDescription>{template.category}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <p className="text-sm text-muted-foreground">
                    استخدم {template.usage} مرة هذا الشهر
                  </p>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline">
                      <Edit className="h-3 w-3 mr-1" />
                      تعديل
                    </Button>
                    <Button size="sm" variant="outline">
                      <Copy className="h-3 w-3 mr-1" />
                      نسخ
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </PageContainer>
  );
};

export default CustomNotificationTemplates;
