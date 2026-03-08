import React from "react";
import { PageContainer } from "@/components/layout/PageContainer";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileSpreadsheet, Download, Calendar, BarChart3 } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const DetailedReports = () => {
  const { data: reportData } = useQuery({
    queryKey: ['detailed-reports-data'],
    queryFn: async () => {
      const { data: profile } = await supabase
        .from('profiles')
        .select('id')
        .eq('user_id', (await supabase.auth.getUser()).data.user?.id)
        .single();

      if (!profile) return { patients: [], appointments: [], invoices: [], treatments: [], clinicId: '' };
      const clinicId = profile.id;

      const [p, a, i, t] = await Promise.all([
        supabase.from('patients').select('id, full_name, phone, created_at, patient_status').eq('clinic_id', clinicId),
        supabase.from('appointments').select('id, appointment_date, status, treatment_type, duration').eq('clinic_id', clinicId),
        supabase.from('invoices').select('id, invoice_number, total_amount, paid_amount, balance_due, status, issue_date').eq('clinic_id', clinicId),
        supabase.from('dental_treatments').select('id, diagnosis, treatment_plan, status, treatment_date, tooth_number').eq('clinic_id', clinicId),
      ]);

      return {
        patients: p.data || [],
        appointments: a.data || [],
        invoices: i.data || [],
        treatments: t.data || [],
        clinicId,
      };
    },
  });

  const counts = {
    patients: reportData?.patients?.length || 0,
    appointments: reportData?.appointments?.length || 0,
    revenue: (reportData?.invoices || []).reduce((s, inv) => s + Number(inv.total_amount || 0), 0),
    treatments: reportData?.treatments?.length || 0,
  };

  const exportCSV = (type: string) => {
    let csv = '';
    let filename = '';

    switch (type) {
      case 'patients':
        csv = 'الاسم,الهاتف,الحالة,تاريخ التسجيل\n' +
          (reportData?.patients || []).map(p => 
            `${p.full_name},${p.phone || ''},${p.patient_status || ''},${p.created_at}`
          ).join('\n');
        filename = 'تقرير_المرضى';
        break;
      case 'appointments':
        csv = 'التاريخ,الحالة,نوع العلاج,المدة\n' +
          (reportData?.appointments || []).map(a => 
            `${a.appointment_date},${a.status},${a.treatment_type || ''},${a.duration}`
          ).join('\n');
        filename = 'تقرير_المواعيد';
        break;
      case 'revenue':
        csv = 'رقم الفاتورة,المبلغ الإجمالي,المدفوع,المتبقي,الحالة,التاريخ\n' +
          (reportData?.invoices || []).map(i => 
            `${i.invoice_number},${i.total_amount},${i.paid_amount},${i.balance_due},${i.status},${i.issue_date}`
          ).join('\n');
        filename = 'تقرير_الإيرادات';
        break;
      case 'treatments':
        csv = 'التشخيص,خطة العلاج,الحالة,التاريخ,رقم السن\n' +
          (reportData?.treatments || []).map(t => 
            `${t.diagnosis},${t.treatment_plan},${t.status},${t.treatment_date},${t.tooth_number}`
          ).join('\n');
        filename = 'تقرير_العلاجات';
        break;
    }

    const BOM = '\uFEFF';
    const blob = new Blob([BOM + csv], { type: 'text/csv;charset=utf-8;' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${filename}_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
    toast.success('تم تصدير التقرير بنجاح');
  };

  const reports = [
    { name: "تقرير المرضى", icon: BarChart3, count: `${counts.patients} مريض`, type: 'patients' },
    { name: "تقرير المواعيد", icon: Calendar, count: `${counts.appointments} موعد`, type: 'appointments' },
    { name: "تقرير الإيرادات", icon: FileSpreadsheet, count: `${counts.revenue.toLocaleString()} د.ع`, type: 'revenue' },
    { name: "تقرير العلاجات", icon: FileSpreadsheet, count: `${counts.treatments} علاج`, type: 'treatments' }
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
                  <Button size="sm" className="w-full" onClick={() => exportCSV(report.type)}>
                    <Download className="h-3 w-3 mr-2" />
                    تصدير CSV
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
