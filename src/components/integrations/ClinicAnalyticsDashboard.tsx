import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useClinicAnalytics } from '@/hooks/useClinicAnalytics';
import { Activity, Calendar, DollarSign, Package, TrendingUp, Users } from 'lucide-react';
import { Bar, BarChart, CartesianGrid, Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';

interface ClinicAnalyticsDashboardProps {
  clinicId: string | null;
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

export default function ClinicAnalyticsDashboard({ clinicId }: ClinicAnalyticsDashboardProps) {
  const { analytics, loading } = useClinicAnalytics(clinicId);

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map(i => (
            <Card key={i}>
              <CardHeader className="animate-pulse">
                <div className="h-4 bg-muted rounded w-1/2"></div>
              </CardHeader>
              <CardContent className="animate-pulse">
                <div className="h-8 bg-muted rounded w-3/4"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (!analytics) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>التحليلات</CardTitle>
          <CardDescription>لا توجد بيانات متاحة</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  const treatmentChartData = Object.entries(analytics.treatments.by_type).map(([type, count]) => ({
    name: type,
    value: count,
  }));

  const appointmentChartData = [
    { name: 'مجدولة', value: analytics.appointments.scheduled },
    { name: 'منتهية', value: analytics.appointments.completed },
    { name: 'ملغاة', value: analytics.appointments.cancelled },
  ];

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">إجمالي المرضى</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.patients.total}</div>
            <p className="text-xs text-muted-foreground">
              +{analytics.patients.new_this_month} هذا الشهر
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">المواعيد</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.appointments.total}</div>
            <p className="text-xs text-muted-foreground">
              {analytics.appointments.scheduled} مجدولة
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">الإيرادات</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {analytics.financials.total_revenue.toLocaleString()} ر.س
            </div>
            <p className="text-xs text-muted-foreground">
              {analytics.financials.this_month_revenue.toLocaleString()} ر.س هذا الشهر
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">المخزون</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.inventory.total_supplies}</div>
            <p className="text-xs text-muted-foreground">
              {analytics.inventory.low_stock_items} منخفضة المخزون
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              توزيع المواعيد
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={appointmentChartData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {appointmentChartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              أنواع العلاجات
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={treatmentChartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="value" fill="#8884d8" name="العدد" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Additional Info */}
      <Card>
        <CardHeader>
          <CardTitle>معلومات إضافية</CardTitle>
          <CardDescription>نظرة عامة على حالة العيادة</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-1">
              <p className="text-sm font-medium text-muted-foreground">معدل الحضور</p>
              <p className="text-2xl font-bold">
                {analytics.appointments.total > 0
                  ? ((analytics.appointments.completed / analytics.appointments.total) * 100).toFixed(1)
                  : 0}%
              </p>
            </div>
            <div className="space-y-1">
              <p className="text-sm font-medium text-muted-foreground">الفواتير المعلقة</p>
              <p className="text-2xl font-bold">{analytics.financials.pending_invoices}</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm font-medium text-muted-foreground">المرضى النشطون</p>
              <p className="text-2xl font-bold">{analytics.patients.active}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
