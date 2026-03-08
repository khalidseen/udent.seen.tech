import React from "react";
import { PageContainer } from "@/components/layout/PageContainer";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Brain, Target, BarChart3, Zap, Image, FileText, Stethoscope } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";

const AIManagementDashboard = () => {
  const { data: stats, isLoading } = useQuery({
    queryKey: ['ai-dashboard-stats'],
    queryFn: async () => {
      const { data: profile } = await supabase
        .from('profiles')
        .select('id')
        .eq('user_id', (await supabase.auth.getUser()).data.user?.id)
        .single();

      if (!profile) return { analyses: 0, images: 0, treatments: 0, records: 0, recentAnalyses: [] };
      const clinicId = profile.id;

      const [analyses, images, treatments, records] = await Promise.all([
        supabase.from('ai_analysis_results').select('id', { count: 'exact', head: true }).eq('clinic_id', clinicId),
        supabase.from('medical_images').select('id', { count: 'exact', head: true }).eq('clinic_id', clinicId),
        supabase.from('dental_treatments').select('id', { count: 'exact', head: true }).eq('clinic_id', clinicId),
        supabase.from('medical_records').select('id', { count: 'exact', head: true }).eq('clinic_id', clinicId),
      ]);

      const { data: recentAnalyses } = await supabase
        .from('ai_analysis_results')
        .select('*, medical_images(title, patient_id)')
        .eq('clinic_id', clinicId)
        .order('created_at', { ascending: false })
        .limit(10);

      return {
        analyses: analyses.count || 0,
        images: images.count || 0,
        treatments: treatments.count || 0,
        records: records.count || 0,
        recentAnalyses: recentAnalyses || [],
      };
    },
  });

  const StatCard = ({ label, value, icon: Icon, color }: { label: string; value: number; icon: any; color: string }) => (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground">{label}</p>
            {isLoading ? <Skeleton className="h-8 w-16" /> : <p className="text-2xl font-bold">{value}</p>}
          </div>
          <Icon className={`h-8 w-8 ${color}`} />
        </div>
      </CardContent>
    </Card>
  );

  return (
    <PageContainer>
      <PageHeader 
        title="قائمة الذكاء الاصطناعي" 
        description="إحصائيات استخدام الذكاء الاصطناعي والتحليلات في النظام"
      />
      
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <StatCard label="تحليلات AI" value={stats?.analyses || 0} icon={Brain} color="text-primary" />
          <StatCard label="الصور الطبية" value={stats?.images || 0} icon={Image} color="text-blue-600" />
          <StatCard label="العلاجات" value={stats?.treatments || 0} icon={Stethoscope} color="text-green-600" />
          <StatCard label="السجلات الطبية" value={stats?.records || 0} icon={FileText} color="text-purple-600" />
        </div>

        <Tabs defaultValue="analyses" className="space-y-4">
          <TabsList>
            <TabsTrigger value="analyses">التحليلات الأخيرة</TabsTrigger>
            <TabsTrigger value="capabilities">قدرات النظام</TabsTrigger>
          </TabsList>

          <TabsContent value="analyses">
            <Card>
              <CardHeader>
                <CardTitle>آخر تحليلات الذكاء الاصطناعي</CardTitle>
                <CardDescription>التحليلات التي أجراها النظام من قاعدة البيانات</CardDescription>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="space-y-3">{[...Array(3)].map((_, i) => <Skeleton key={i} className="h-16 w-full" />)}</div>
                ) : (stats?.recentAnalyses?.length || 0) === 0 ? (
                  <div className="text-center py-12">
                    <Brain className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                    <h3 className="text-lg font-semibold mb-2">لا توجد تحليلات بعد</h3>
                    <p className="text-sm text-muted-foreground">لم يتم إجراء أي تحليلات AI في النظام</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {stats?.recentAnalyses?.map((analysis: any) => (
                      <div key={analysis.id} className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                            <Brain className="h-5 w-5 text-primary" />
                          </div>
                          <div>
                            <p className="font-medium">{analysis.analysis_type}</p>
                            <p className="text-sm text-muted-foreground">نموذج: {analysis.ai_model}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          {analysis.confidence_score && (
                            <Badge variant="outline">ثقة: {Math.round(analysis.confidence_score * 100)}%</Badge>
                          )}
                          <span className="text-sm text-muted-foreground">
                            {new Date(analysis.created_at).toLocaleDateString('ar-IQ')}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="capabilities">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {[
                { name: "التشخيص الذكي", desc: "تحليل الأعراض واقتراح التشخيصات", icon: Target, status: "متاح", active: true },
                { name: "تحليل الصور الطبية", desc: "تحليل الأشعة والصور السنية بالذكاء الاصطناعي", icon: Image, status: "متاح", active: true },
                { name: "التنبؤ بالعلاج", desc: "اقتراح خطط علاجية بناءً على البيانات", icon: Zap, status: "قيد التطوير", active: false },
                { name: "تحليل البيانات", desc: "تحليل إحصائي للبيانات السريرية", icon: BarChart3, status: "متاح", active: true },
              ].map((mod, i) => (
                <Card key={i}>
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <mod.icon className="h-5 w-5" />
                        {mod.name}
                      </div>
                      <Badge variant={mod.active ? "default" : "secondary"}>{mod.status}</Badge>
                    </CardTitle>
                    <CardDescription>{mod.desc}</CardDescription>
                  </CardHeader>
                </Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </PageContainer>
  );
};

export default AIManagementDashboard;
