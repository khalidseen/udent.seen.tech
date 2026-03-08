import React from "react";
import { PageContainer } from "@/components/layout/PageContainer";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileSpreadsheet, Download, Calendar, BarChart3 } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

const DetailedReports = () => {
  const { data: counts } = useQuery({
    queryKey: ['detailed-reports-counts'],
    queryFn: async () => {
      const { data: profile } = await supabase
        .from('profiles')
        .select('id')
        .eq('user_id', (await supabase.auth.getUser()).data.user?.id)
        .single();

      if (!profile) return { patients: 0, appointments: 0, revenue: 0, treatments: 0 };
      const clinicId = profile.id;

      const [p, a, i, t] = await Promise.all([
        supabase.from('patients').select('id', { count: 'exact', head: true }).eq('clinic_id', clinicId),
        supabase.from('appointments').select('id', { count: 'exact', head: true }).eq('clinic_id', clinicId),
        supabase.from('invoices').select('total_amount').eq('clinic_id', clinicId),
        supabase.from('dental_treatments').select('id', { count: 'exact', head: true }).eq('clinic_id', clinicId),
      ]);

      const revenue = (i.data || []).reduce((s, inv) => s + Number(inv.total_amount || 0), 0);
      return { patients: p.count || 0, appointments: a.count || 0, revenue, treatments: t.count || 0 };
    },
  });

  const reports = [
    { name: "تقرير المرضى", icon: BarChart3, count: `${counts?.patients || 0} مريض` },
    { name: "تقرير المواعيد", icon: Calendar, count: `${counts?.appointments || 0} موعد` },
    { name: "تقرير الإيرادات", icon: FileSpreadsheet, count: `${(counts?.revenue || 0).toLocaleString()} ر.س` },
    { name: "تقرير العلاجات", icon: FileSpreadsheet, count: `${counts?.treatments || 0} علاج` }
  ];

  return (
    <PageContainer>
      <PageHeader title="التقارير التفصيلية" description="تقارير شاملة ومفصلة عن أداء العيادة" />
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {reports.map((report, index) => {
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
      </div>
    </PageContainer>
  );
};

export default DetailedReports;
