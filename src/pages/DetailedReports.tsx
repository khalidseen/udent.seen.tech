import React, { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { PageContainer } from "@/components/layout/PageContainer";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DatePickerWithRange } from "@/components/ui/date-range-picker";
import { FileSpreadsheet, Download, Calendar, BarChart3, Users, Activity, DollarSign, TrendingUp } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { DateRange } from "react-day-picker";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, AreaChart, Area
} from "recharts";

const COLORS = ['hsl(var(--primary))', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82ca9d'];

const DetailedReports = () => {
  const navigate = useNavigate();
  const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined);

  const { data: reportData, isLoading, isError } = useQuery({
    queryKey: ['detailed-reports-data', dateRange?.from?.toISOString(), dateRange?.to?.toISOString()],
    queryFn: async () => {
      const { data: profile } = await supabase.rpc('get_current_user_profile');
      if (!profile) return { patients: [], appointments: [], invoices: [], treatments: [], clinicId: '' };
      const clinicId = profile.id;

      let pQuery = supabase.from('patients').select('id, full_name, phone, created_at, patient_status, gender').eq('clinic_id', clinicId);
      let aQuery = supabase.from('appointments').select('id, appointment_date, status, treatment_type, duration, doctor_id, doctors(full_name)').eq('clinic_id', clinicId);
      let iQuery = supabase.from('invoices').select('id, invoice_number, total_amount, paid_amount, balance_due, status, issue_date').eq('clinic_id', clinicId);
      let tQuery = supabase.from('dental_treatments').select('id, diagnosis, treatment_plan, status, treatment_date, tooth_number').eq('clinic_id', clinicId);

      if (dateRange?.from) {
        const fromStr = dateRange.from.toISOString();
        pQuery = pQuery.gte('created_at', fromStr);
        aQuery = aQuery.gte('appointment_date', fromStr);
        iQuery = iQuery.gte('issue_date', fromStr);
        tQuery = tQuery.gte('treatment_date', fromStr);
      }
      if (dateRange?.to) {
        const toStr = new Date(dateRange.to.getTime() + 86400000).toISOString();
        pQuery = pQuery.lte('created_at', toStr);
        aQuery = aQuery.lte('appointment_date', toStr);
        iQuery = iQuery.lte('issue_date', toStr);
        tQuery = tQuery.lte('treatment_date', toStr);
      }

      const [p, a, i, t] = await Promise.all([pQuery, aQuery, iQuery, tQuery]);

      return {
        patients: p.data || [],
        appointments: a.data || [],
        invoices: i.data || [],
        treatments: t.data || [],
        clinicId,
      };
    },
  });

  const counts = useMemo(() => ({
    patients: reportData?.patients?.length || 0,
    appointments: reportData?.appointments?.length || 0,
    revenue: (reportData?.invoices || []).reduce((s, inv) => s + Number(inv.total_amount || 0), 0),
    paid: (reportData?.invoices || []).reduce((s, inv) => s + Number(inv.paid_amount || 0), 0),
    pending: (reportData?.invoices || []).reduce((s, inv) => s + Number(inv.balance_due || 0), 0),
    treatments: reportData?.treatments?.length || 0,
  }), [reportData]);

  // Chart data computations
  const appointmentStatusData = useMemo(() => {
    const statusMap: Record<string, number> = {};
    (reportData?.appointments || []).forEach(a => {
      const label = { scheduled: 'مجدول', completed: 'مكتمل', cancelled: 'ملغي', confirmed: 'مؤكد', no_show: 'لم يحضر' }[a.status] || a.status;
      statusMap[label] = (statusMap[label] || 0) + 1;
    });
    return Object.entries(statusMap).map(([name, value]) => ({ name, value }));
  }, [reportData?.appointments]);

  const monthlyAppointmentsData = useMemo(() => {
    const monthMap: Record<string, number> = {};
    (reportData?.appointments || []).forEach(a => {
      const month = a.appointment_date?.substring(0, 7);
      if (month) monthMap[month] = (monthMap[month] || 0) + 1;
    });
    return Object.entries(monthMap).sort(([a], [b]) => a.localeCompare(b)).map(([name, count]) => ({ name, count }));
  }, [reportData?.appointments]);

  const monthlyRevenueData = useMemo(() => {
    const monthMap: Record<string, { revenue: number; paid: number }> = {};
    (reportData?.invoices || []).forEach(inv => {
      const month = inv.issue_date?.substring(0, 7);
      if (month) {
        if (!monthMap[month]) monthMap[month] = { revenue: 0, paid: 0 };
        monthMap[month].revenue += Number(inv.total_amount || 0);
        monthMap[month].paid += Number(inv.paid_amount || 0);
      }
    });
    return Object.entries(monthMap).sort(([a], [b]) => a.localeCompare(b)).map(([name, vals]) => ({ name, ...vals }));
  }, [reportData?.invoices]);

  const treatmentStatusData = useMemo(() => {
    const statusMap: Record<string, number> = {};
    (reportData?.treatments || []).forEach(t => {
      const label = { completed: 'مكتمل', planned: 'مخطط', in_progress: 'قيد التنفيذ' }[t.status] || t.status;
      statusMap[label] = (statusMap[label] || 0) + 1;
    });
    return Object.entries(statusMap).map(([name, value]) => ({ name, value }));
  }, [reportData?.treatments]);

  const patientGrowthData = useMemo(() => {
    const monthMap: Record<string, number> = {};
    (reportData?.patients || []).forEach(p => {
      const month = p.created_at?.substring(0, 7);
      if (month) monthMap[month] = (monthMap[month] || 0) + 1;
    });
    let cumulative = 0;
    return Object.entries(monthMap).sort(([a], [b]) => a.localeCompare(b)).map(([name, newPatients]) => {
      cumulative += newPatients;
      return { name, newPatients, total: cumulative };
    });
  }, [reportData?.patients]);

  const invoiceStatusData = useMemo(() => {
    const statusMap: Record<string, number> = {};
    (reportData?.invoices || []).forEach(i => {
      const label = { paid: 'مدفوعة', pending: 'معلقة', partial: 'مدفوعة جزئياً', overdue: 'متأخرة' }[i.status] || i.status;
      statusMap[label] = (statusMap[label] || 0) + 1;
    });
    return Object.entries(statusMap).map(([name, value]) => ({ name, value }));
  }, [reportData?.invoices]);

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
    const link = document.createElement('a');
    link.href = url;
    link.download = `${filename}_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    window.URL.revokeObjectURL(url);
    toast.success('تم تصدير التقرير بنجاح');
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload?.length) {
      return (
        <div className="bg-background/95 backdrop-blur-sm border rounded-lg p-3 shadow-lg">
          <p className="text-sm font-medium">{label}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} className="text-sm" style={{ color: entry.color }}>
              {entry.name}: {typeof entry.value === 'number' ? entry.value.toLocaleString() : entry.value}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  if (isError) {
    return (
      <PageContainer>
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <BarChart3 className="w-12 h-12 text-destructive mb-4" />
          <h2 className="text-xl font-bold mb-2">حدث خطأ في تحميل التقارير</h2>
          <p className="text-muted-foreground mb-4">تعذر جلب بيانات التقارير. تحقق من الاتصال وحاول مرة أخرى.</p>
          <Button onClick={() => window.location.reload()}>إعادة المحاولة</Button>
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <div className="flex items-center justify-between mb-2">
        <PageHeader title="التقارير التفصيلية" description="تقارير شاملة ومفصلة عن أداء العيادة" />
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => navigate('/patients')}>
            <Users className="w-4 h-4 ml-1" />
            المرضى
          </Button>
          <Button variant="outline" size="sm" onClick={() => navigate('/appointments')}>
            <Calendar className="w-4 h-4 ml-1" />
            المواعيد
          </Button>
          <Button variant="outline" size="sm" onClick={() => navigate('/financial-overview')}>
            <DollarSign className="w-4 h-4 ml-1" />
            المالية
          </Button>
        </div>
      </div>

      <div className="space-y-6">
        {/* Date Range Filter */}
        <div className="flex flex-wrap items-center gap-4">
          <DatePickerWithRange date={dateRange} onDateChange={setDateRange} />
          {dateRange?.from && (
            <Button variant="ghost" size="sm" onClick={() => setDateRange(undefined)}>
              مسح الفلتر
            </Button>
          )}
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">المرضى</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{counts.patients}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">المواعيد</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{counts.appointments}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">العلاجات</CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{counts.treatments}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">الإيرادات</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{counts.revenue.toLocaleString()}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">المحصّل</CardTitle>
              <TrendingUp className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{counts.paid.toLocaleString()}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">المستحق</CardTitle>
              <DollarSign className="h-4 w-4 text-orange-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">{counts.pending.toLocaleString()}</div>
            </CardContent>
          </Card>
        </div>

        {/* Tabbed Reports */}
        <Tabs defaultValue="overview" dir="rtl" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview" className="gap-2">
              <BarChart3 className="w-4 h-4" />
              نظرة عامة
            </TabsTrigger>
            <TabsTrigger value="patients" className="gap-2">
              <Users className="w-4 h-4" />
              المرضى
            </TabsTrigger>
            <TabsTrigger value="financial" className="gap-2">
              <DollarSign className="w-4 h-4" />
              المالية
            </TabsTrigger>
            <TabsTrigger value="treatments" className="gap-2">
              <Activity className="w-4 h-4" />
              العلاجات
            </TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Monthly Appointments Trend */}
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <div>
                    <CardTitle>اتجاه المواعيد الشهرية</CardTitle>
                    <CardDescription>عدد المواعيد لكل شهر</CardDescription>
                  </div>
                  <Button size="sm" variant="outline" onClick={() => exportCSV('appointments')}>
                    <Download className="h-3 w-3 ml-1" /> تصدير
                  </Button>
                </CardHeader>
                <CardContent>
                  {monthlyAppointmentsData.length > 0 ? (
                    <ResponsiveContainer width="100%" height={300}>
                      <AreaChart data={monthlyAppointmentsData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                        <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                        <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
                        <Tooltip content={<CustomTooltip />} />
                        <Area type="monotone" dataKey="count" name="المواعيد" stroke="hsl(var(--primary))" fill="hsl(var(--primary))" fillOpacity={0.2} />
                      </AreaChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="flex items-center justify-center h-[300px] text-muted-foreground">لا توجد بيانات</div>
                  )}
                </CardContent>
              </Card>

              {/* Appointment Status Distribution */}
              <Card>
                <CardHeader>
                  <CardTitle>توزيع حالات المواعيد</CardTitle>
                  <CardDescription>نسبة كل حالة من إجمالي المواعيد</CardDescription>
                </CardHeader>
                <CardContent>
                  {appointmentStatusData.length > 0 ? (
                    <ResponsiveContainer width="100%" height={300}>
                      <PieChart>
                        <Pie data={appointmentStatusData} cx="50%" cy="50%" outerRadius={100} dataKey="value" nameKey="name" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                          {appointmentStatusData.map((_, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip content={<CustomTooltip />} />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="flex items-center justify-center h-[300px] text-muted-foreground">لا توجد بيانات</div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Patients Tab */}
          <TabsContent value="patients" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Patient Growth */}
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <div>
                    <CardTitle>نمو المرضى</CardTitle>
                    <CardDescription>المرضى الجدد والإجمالي التراكمي</CardDescription>
                  </div>
                  <Button size="sm" variant="outline" onClick={() => exportCSV('patients')}>
                    <Download className="h-3 w-3 ml-1" /> تصدير
                  </Button>
                </CardHeader>
                <CardContent>
                  {patientGrowthData.length > 0 ? (
                    <ResponsiveContainer width="100%" height={300}>
                      <LineChart data={patientGrowthData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                        <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                        <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
                        <Tooltip content={<CustomTooltip />} />
                        <Legend />
                        <Line type="monotone" dataKey="newPatients" name="جدد" stroke="#00C49F" strokeWidth={2} />
                        <Line type="monotone" dataKey="total" name="الإجمالي" stroke="hsl(var(--primary))" strokeWidth={2} />
                      </LineChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="flex items-center justify-center h-[300px] text-muted-foreground">لا توجد بيانات</div>
                  )}
                </CardContent>
              </Card>

              {/* Patient Status Distribution */}
              <Card>
                <CardHeader>
                  <CardTitle>حالات المرضى</CardTitle>
                  <CardDescription>توزيع المرضى حسب الحالة</CardDescription>
                </CardHeader>
                <CardContent>
                  {(() => {
                    const statusMap: Record<string, number> = {};
                    (reportData?.patients || []).forEach(p => {
                      const label = { active: 'نشط', inactive: 'غير نشط', archived: 'مؤرشف' }[p.patient_status] || p.patient_status || 'غير محدد';
                      statusMap[label] = (statusMap[label] || 0) + 1;
                    });
                    const data = Object.entries(statusMap).map(([name, value]) => ({ name, value }));
                    return data.length > 0 ? (
                      <ResponsiveContainer width="100%" height={300}>
                        <PieChart>
                          <Pie data={data} cx="50%" cy="50%" outerRadius={100} dataKey="value" nameKey="name" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                            {data.map((_, index) => (
                              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip content={<CustomTooltip />} />
                          <Legend />
                        </PieChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="flex items-center justify-center h-[300px] text-muted-foreground">لا توجد بيانات</div>
                    );
                  })()}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Financial Tab */}
          <TabsContent value="financial" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Monthly Revenue */}
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <div>
                    <CardTitle>الإيرادات الشهرية</CardTitle>
                    <CardDescription>إجمالي الإيرادات مقابل المحصّل</CardDescription>
                  </div>
                  <Button size="sm" variant="outline" onClick={() => exportCSV('revenue')}>
                    <Download className="h-3 w-3 ml-1" /> تصدير
                  </Button>
                </CardHeader>
                <CardContent>
                  {monthlyRevenueData.length > 0 ? (
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={monthlyRevenueData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                        <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                        <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
                        <Tooltip content={<CustomTooltip />} />
                        <Legend />
                        <Bar dataKey="revenue" name="الإيرادات" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                        <Bar dataKey="paid" name="المحصّل" fill="#00C49F" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="flex items-center justify-center h-[300px] text-muted-foreground">لا توجد بيانات</div>
                  )}
                </CardContent>
              </Card>

              {/* Invoice Status */}
              <Card>
                <CardHeader>
                  <CardTitle>حالات الفواتير</CardTitle>
                  <CardDescription>توزيع الفواتير حسب الحالة</CardDescription>
                </CardHeader>
                <CardContent>
                  {invoiceStatusData.length > 0 ? (
                    <ResponsiveContainer width="100%" height={300}>
                      <PieChart>
                        <Pie data={invoiceStatusData} cx="50%" cy="50%" outerRadius={100} dataKey="value" nameKey="name" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                          {invoiceStatusData.map((_, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip content={<CustomTooltip />} />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="flex items-center justify-center h-[300px] text-muted-foreground">لا توجد بيانات</div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Treatments Tab */}
          <TabsContent value="treatments" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Treatment Status */}
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <div>
                    <CardTitle>حالات العلاجات</CardTitle>
                    <CardDescription>توزيع العلاجات حسب الحالة</CardDescription>
                  </div>
                  <Button size="sm" variant="outline" onClick={() => exportCSV('treatments')}>
                    <Download className="h-3 w-3 ml-1" /> تصدير
                  </Button>
                </CardHeader>
                <CardContent>
                  {treatmentStatusData.length > 0 ? (
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={treatmentStatusData} layout="vertical">
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                        <XAxis type="number" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                        <YAxis type="category" dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={12} width={80} />
                        <Tooltip content={<CustomTooltip />} />
                        <Bar dataKey="value" name="العدد" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="flex items-center justify-center h-[300px] text-muted-foreground">لا توجد بيانات</div>
                  )}
                </CardContent>
              </Card>

              {/* Top Tooth Numbers */}
              <Card>
                <CardHeader>
                  <CardTitle>الأسنان الأكثر علاجاً</CardTitle>
                  <CardDescription>أرقام الأسنان الأكثر تكراراً في العلاجات</CardDescription>
                </CardHeader>
                <CardContent>
                  {(() => {
                    const toothMap: Record<string, number> = {};
                    (reportData?.treatments || []).forEach(t => {
                      if (t.tooth_number) {
                        const key = `سن ${t.tooth_number}`;
                        toothMap[key] = (toothMap[key] || 0) + 1;
                      }
                    });
                    const data = Object.entries(toothMap)
                      .sort(([, a], [, b]) => b - a)
                      .slice(0, 10)
                      .map(([name, value]) => ({ name, value }));
                    return data.length > 0 ? (
                      <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={data}>
                          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                          <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={11} />
                          <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
                          <Tooltip content={<CustomTooltip />} />
                          <Bar dataKey="value" name="العلاجات" fill="#FFBB28" radius={[4, 4, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="flex items-center justify-center h-[300px] text-muted-foreground">لا توجد بيانات</div>
                    );
                  })()}
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </PageContainer>
  );
};

export default DetailedReports;
