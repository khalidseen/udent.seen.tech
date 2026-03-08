import { PageContainer } from "@/components/layout/PageContainer";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, AreaChart, Area } from "recharts";
import { TrendingUp, Calendar, DollarSign, Users, Package, Download } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { CurrencyAmount } from "@/components/ui/currency-display";

export default function Reports() {
  const COLORS = ['hsl(var(--chart-1))', 'hsl(var(--chart-2))', 'hsl(var(--chart-3))', 'hsl(var(--chart-4))', 'hsl(var(--chart-5))'];

  const { data: stats, isLoading } = useQuery({
    queryKey: ['reports-stats'],
    queryFn: async () => {
      const { data: profile } = await supabase
        .from('profiles')
        .select('id')
        .eq('user_id', (await supabase.auth.getUser()).data.user?.id)
        .single();

      if (!profile) throw new Error('Profile not found');
      const clinicId = profile.id;

      const [invoicesRes, patientsRes, appointmentsRes, treatmentsRes, suppliesRes] = await Promise.all([
        supabase.from('invoices').select('total_amount, paid_amount, status, issue_date').eq('clinic_id', clinicId),
        supabase.from('patients').select('id, created_at').eq('clinic_id', clinicId),
        supabase.from('appointments').select('id, status, appointment_date').eq('clinic_id', clinicId),
        supabase.from('dental_treatments').select('id, diagnosis, status, treatment_date').eq('clinic_id', clinicId),
        supabase.from('medical_supplies').select('id, current_stock, minimum_stock').eq('clinic_id', clinicId),
      ]);

      const invoices = invoicesRes.data || [];
      const patients = patientsRes.data || [];
      const appointments = appointmentsRes.data || [];
      const treatments = treatmentsRes.data || [];
      const supplies = suppliesRes.data || [];

      const totalRevenue = invoices.reduce((s, i) => s + Number(i.total_amount || 0), 0);
      const totalPaid = invoices.reduce((s, i) => s + Number(i.paid_amount || 0), 0);
      const completedAppointments = appointments.filter(a => a.status === 'completed').length;
      const cancelledAppointments = appointments.filter(a => a.status === 'cancelled').length;
      const lowStock = supplies.filter(s => s.current_stock <= s.minimum_stock).length;

      // Group treatments by diagnosis for pie chart
      const diagnosisMap: Record<string, number> = {};
      treatments.forEach(t => {
        const key = t.diagnosis || 'أخرى';
        diagnosisMap[key] = (diagnosisMap[key] || 0) + 1;
      });
      const treatmentData = Object.entries(diagnosisMap)
        .map(([name, count]) => ({ name, count, percentage: Math.round((count / (treatments.length || 1)) * 100) }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 6);

      // Monthly revenue (last 6 months)
      const monthlyRevenue: Record<string, number> = {};
      const months = ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'];
      invoices.forEach(inv => {
        if (inv.issue_date) {
          const d = new Date(inv.issue_date);
          const key = months[d.getMonth()];
          monthlyRevenue[key] = (monthlyRevenue[key] || 0) + Number(inv.total_amount || 0);
        }
      });
      const revenueData = Object.entries(monthlyRevenue).map(([month, revenue]) => ({ month, revenue }));

      return {
        totalRevenue, totalPaid, totalPatients: patients.length,
        totalAppointments: appointments.length, completedAppointments, cancelledAppointments,
        lowStock, treatmentData, revenueData, totalTreatments: treatments.length,
        attendanceRate: appointments.length ? ((completedAppointments / appointments.length) * 100).toFixed(1) : '0',
      };
    },
  });

  if (isLoading) {
    return <PageContainer><div className="flex items-center justify-center h-96"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" /></div></PageContainer>;
  }

  return (
    <PageContainer>
      <PageHeader
        title="التقارير"
        description="تقارير شاملة عن أداء العيادة والإحصائيات المالية"
        action={
          <div className="flex gap-2">
            <Button variant="outline"><Download className="w-4 h-4 mr-2" />تصدير PDF</Button>
          </div>
        }
      />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">إجمالي الإيرادات</p>
                <p className="text-2xl font-bold"><CurrencyAmount amount={stats?.totalRevenue || 0} /></p>
              </div>
              <div className="h-12 w-12 rounded-lg bg-green-100 dark:bg-green-900/20 flex items-center justify-center">
                <DollarSign className="h-6 w-6 text-green-600 dark:text-green-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">عدد المرضى</p>
                <p className="text-2xl font-bold">{stats?.totalPatients || 0}</p>
              </div>
              <div className="h-12 w-12 rounded-lg bg-blue-100 dark:bg-blue-900/20 flex items-center justify-center">
                <Users className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">المواعيد المكتملة</p>
                <p className="text-2xl font-bold">{stats?.completedAppointments || 0}</p>
              </div>
              <div className="h-12 w-12 rounded-lg bg-purple-100 dark:bg-purple-900/20 flex items-center justify-center">
                <Calendar className="h-6 w-6 text-purple-600 dark:text-purple-400" />
              </div>
            </div>
            <div className="flex items-center mt-4 text-sm">
              <Badge variant="secondary">{stats?.attendanceRate}%</Badge>
              <span className="text-muted-foreground mr-2">معدل الحضور</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">مخزون منخفض</p>
                <p className="text-2xl font-bold">{stats?.lowStock || 0}</p>
              </div>
              <div className="h-12 w-12 rounded-lg bg-orange-100 dark:bg-orange-900/20 flex items-center justify-center">
                <Package className="h-6 w-6 text-orange-600 dark:text-orange-400" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="financial" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="financial">التقارير المالية</TabsTrigger>
          <TabsTrigger value="appointments">المواعيد</TabsTrigger>
          <TabsTrigger value="treatments">العلاجات</TabsTrigger>
        </TabsList>

        <TabsContent value="financial">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>الإيرادات الشهرية</CardTitle>
              </CardHeader>
              <CardContent>
                {(stats?.revenueData?.length || 0) > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={stats?.revenueData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" />
                      <YAxis />
                      <Tooltip formatter={(value) => [`${Number(value).toLocaleString()} ر.س`, 'الإيرادات']} />
                      <Bar dataKey="revenue" fill="hsl(var(--chart-1))" />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <p className="text-center text-muted-foreground py-12">لا توجد بيانات مالية بعد</p>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle>ملخص مالي</CardTitle></CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="bg-muted/50 p-4 rounded-lg">
                    <div className="text-sm text-muted-foreground">إجمالي الإيرادات</div>
                    <div className="text-2xl font-bold text-green-600"><CurrencyAmount amount={stats?.totalRevenue || 0} /></div>
                  </div>
                  <div className="bg-muted/50 p-4 rounded-lg">
                    <div className="text-sm text-muted-foreground">المدفوعات المستلمة</div>
                    <div className="text-2xl font-bold text-blue-600"><CurrencyAmount amount={stats?.totalPaid || 0} /></div>
                  </div>
                  <div className="bg-muted/50 p-4 rounded-lg">
                    <div className="text-sm text-muted-foreground">المبلغ المستحق</div>
                    <div className="text-2xl font-bold text-red-600"><CurrencyAmount amount={(stats?.totalRevenue || 0) - (stats?.totalPaid || 0)} /></div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="appointments">
          <Card>
            <CardHeader><CardTitle>إحصائيات المواعيد</CardTitle></CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between items-center p-3 bg-muted/50 rounded-lg">
                  <span>إجمالي المواعيد</span>
                  <Badge variant="secondary">{stats?.totalAppointments || 0}</Badge>
                </div>
                <div className="flex justify-between items-center p-3 bg-muted/50 rounded-lg">
                  <span>المواعيد المكتملة</span>
                  <Badge className="bg-green-100 text-green-700">{stats?.completedAppointments || 0}</Badge>
                </div>
                <div className="flex justify-between items-center p-3 bg-muted/50 rounded-lg">
                  <span>المواعيد الملغية</span>
                  <Badge variant="destructive">{stats?.cancelledAppointments || 0}</Badge>
                </div>
                <div className="flex justify-between items-center p-3 bg-muted/50 rounded-lg">
                  <span>معدل الحضور</span>
                  <Badge variant="secondary">{stats?.attendanceRate}%</Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="treatments">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>توزيع العلاجات</CardTitle>
              </CardHeader>
              <CardContent>
                {(stats?.treatmentData?.length || 0) > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie data={stats?.treatmentData} cx="50%" cy="50%" outerRadius={80} dataKey="count"
                        label={({ name, percentage }) => `${name} ${percentage}%`}>
                        {stats?.treatmentData?.map((_, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <p className="text-center text-muted-foreground py-12">لا توجد بيانات علاجات بعد</p>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle>إجمالي العلاجات</CardTitle></CardHeader>
              <CardContent>
                <div className="text-4xl font-bold text-center py-8">{stats?.totalTreatments || 0}</div>
                <p className="text-center text-muted-foreground">علاج مسجل</p>
                {(stats?.treatmentData?.length || 0) > 0 && (
                  <div className="space-y-3 mt-6">
                    {stats?.treatmentData?.map((t, i) => (
                      <div key={t.name} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                        <div className="flex items-center gap-3">
                          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                          <span>{t.name}</span>
                        </div>
                        <Badge variant="secondary">{t.count}</Badge>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </PageContainer>
  );
}
