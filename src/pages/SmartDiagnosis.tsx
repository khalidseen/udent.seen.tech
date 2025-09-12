import { PageContainer } from "@/components/layout/PageContainer";
import { PageHeader } from "@/components/layout/PageHeader";
import { SmartDiagnosisEngine } from "@/components/ai-analysis/SmartDiagnosisEngine";
import { Brain, Stethoscope, Target } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function SmartDiagnosis() {
  return (
    <PageContainer>
      <PageHeader
        title="التشخيص الذكي المتطور"
        description="نظام تشخيص طبي متقدم يستخدم الذكاء الاصطناعي لتحليل الأعراض وتقديم تشخيص دقيق ومخصص"
      />

      {/* مقدمة النظام */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Brain className="h-5 w-5 text-primary" />
              تحليل ذكي
            </CardTitle>
            <CardDescription>
              تحليل شامل للأعراض والتاريخ الطبي باستخدام الذكاء الاصطناعي
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="text-sm space-y-1 text-muted-foreground">
              <li>• تحليل الأعراض المتقدم</li>
              <li>• ربط العلامات الحيوية</li>
              <li>• تقييم عوامل الخطر</li>
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Stethoscope className="h-5 w-5 text-primary" />
              تشخيص دقيق
            </CardTitle>
            <CardDescription>
              تشخيص أساسي وتفريقي مع نسب دقة عالية
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="text-sm space-y-1 text-muted-foreground">
              <li>• تشخيص متعدد المستويات</li>
              <li>• تقييم الأولوية والعجالة</li>
              <li>• نسب الثقة المتقدمة</li>
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Target className="h-5 w-5 text-primary" />
              خطة علاجية
            </CardTitle>
            <CardDescription>
              توصيات علاجية مخصصة مع تقدير التكلفة
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="text-sm space-y-1 text-muted-foreground">
              <li>• خطط علاج متنوعة</li>
              <li>• تقدير التكلفة والمدة</li>
              <li>• متابعة وتقييم النتائج</li>
            </ul>
          </CardContent>
        </Card>
      </div>

      {/* محرك التشخيص الذكي */}
      <SmartDiagnosisEngine />
    </PageContainer>
  );
}