import React, { useState, useMemo, memo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { OptimizedChart } from "@/components/ui/optimized-chart";
import { ErrorBoundary } from "@/components/ui/error-boundary";
import { supabase } from "@/integrations/supabase/client";
import { 
  TrendingUp, 
  TrendingDown, 
  Users, 
  Calendar, 
  DollarSign, 
  Package, 
  Activity,
  Clock,
  Target,
  Award
} from "lucide-react";
import { format, subDays, subMonths, startOfMonth, endOfMonth, isToday, isThisWeek, isThisMonth } from "date-fns";

// Optimized combined analytics query
const fetchAllAnalytics = async (dateRange: { start: Date; end: Date }) => {
  const startDate = dateRange.start.toISOString().split('T')[0];
  const endDate = dateRange.end.toISOString().split('T')[0];
  const startDateTime = dateRange.start.toISOString();
  const endDateTime = dateRange.end.toISOString();

  try {
    // Combined query to reduce database calls
    const [paymentsResult, appointmentsResult, patientsResult, inventoryResult, totalPatientsResult] = await Promise.all([
      supabase
        .from('payments')
        .select('amount, payment_date, status')
        .gte('payment_date', startDate)
        .lte('payment_date', endDate)
        .eq('status', 'completed'),
      
      supabase
        .from('appointments')
        .select('id, appointment_date, status, treatment_type')
        .gte('appointment_date', startDateTime)
        .lte('appointment_date', endDateTime),
      
      supabase
        .from('patients')
        .select('id, created_at')
        .gte('created_at', startDateTime)
        .lte('created_at', endDateTime),
      
      supabase
        .from('medical_supplies')
        .select('current_stock, minimum_stock, unit_cost')
        .eq('is_active', true),
      
      supabase
        .from('patients')
        .select('*', { count: 'exact', head: true })
    ]);

    // Check for errors
    if (paymentsResult.error) throw paymentsResult.error;
    if (appointmentsResult.error) throw appointmentsResult.error;
    if (patientsResult.error) throw patientsResult.error;
    if (inventoryResult.error) throw inventoryResult.error;
    if (totalPatientsResult.error) throw totalPatientsResult.error;

    const payments = paymentsResult.data || [];
    const appointments = appointmentsResult.data || [];
    const patients = patientsResult.data || [];
    const supplies = inventoryResult.data || [];

    // Process revenue data
    const totalRevenue = payments.reduce((sum, payment) => sum + Number(payment.amount), 0);
    const todayRevenue = payments
      .filter(p => isToday(new Date(p.payment_date)))
      .reduce((sum, payment) => sum + Number(payment.amount), 0);

    const dailyRevenue = payments.reduce((acc, payment) => {
      const date = payment.payment_date;
      acc[date] = (acc[date] || 0) + Number(payment.amount);
      return acc;
    }, {} as Record<string, number>);

    // Process appointments data
    const totalAppointments = appointments.length;
    const completedAppointments = appointments.filter(a => a.status === 'completed').length;
    const todayAppointments = appointments.filter(a => isToday(new Date(a.appointment_date))).length;
    const completionRate = totalAppointments > 0 ? (completedAppointments / totalAppointments) * 100 : 0;

    const dailyAppointments = appointments.reduce((acc, appointment) => {
      const date = appointment.appointment_date.split('T')[0];
      acc[date] = (acc[date] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // Process patients data
    const newPatients = patients.length;
    const todayNewPatients = patients.filter(p => isToday(new Date(p.created_at))).length;
    const totalPatients = totalPatientsResult.count || 0;

    // Process inventory data
    const totalItems = supplies.length;
    const lowStockItems = supplies.filter(s => s.current_stock <= s.minimum_stock).length;
    const outOfStockItems = supplies.filter(s => s.current_stock === 0).length;
    const totalValue = supplies.reduce((sum, s) => sum + (s.current_stock * Number(s.unit_cost)), 0);

    return {
      revenue: { totalRevenue, todayRevenue, dailyRevenue, payments },
      appointments: { totalAppointments, completedAppointments, todayAppointments, completionRate, dailyAppointments },
      patients: { newPatients, todayNewPatients, totalPatients },
      inventory: { totalItems, lowStockItems, outOfStockItems, totalValue }
    };
  } catch (error) {
    throw error;
  }
};

function AnalyticalDashboardComponent() {
  const [timeRange, setTimeRange] = useState("30days");
  const [chartType, setChartType] = useState<"revenue" | "appointments" | "patients">("revenue");

  // Get date range based on selection
  const getDateRange = () => {
    const now = new Date();
    switch (timeRange) {
      case "7days":
        return { start: subDays(now, 7), end: now };
      case "30days":
        return { start: subDays(now, 30), end: now };
      case "90days":
        return { start: subDays(now, 90), end: now };
      case "6months":
        return { start: subMonths(now, 6), end: now };
      default:
        return { start: subDays(now, 30), end: now };
    }
  };

  const dateRange = getDateRange();

  // Optimized single query for all analytics
  const { data: analyticsData, isLoading, error } = useQuery({
    queryKey: ['combined-analytics', timeRange],
    queryFn: () => fetchAllAnalytics(dateRange),
    staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 5 * 60 * 1000, // 5 minutes
    refetchInterval: 5 * 60 * 1000, // 5 minutes instead of 30 seconds
    retry: 1
  });

  // Extract data with fallbacks
  const revenueData = analyticsData?.revenue;
  const appointmentsData = analyticsData?.appointments;
  const patientsData = analyticsData?.patients;
  const inventoryData = analyticsData?.inventory;

  // Chart data based on selected type
  const chartData = useMemo(() => {
    if (chartType === 'revenue' && revenueData?.dailyRevenue) {
      return Object.entries(revenueData.dailyRevenue).map(([date, value]) => ({
        name: format(new Date(date), 'MM/dd'),
        value,
        label: `$${value.toFixed(2)}`
      }));
    }
    
    if (chartType === 'appointments' && appointmentsData?.dailyAppointments) {
      return Object.entries(appointmentsData.dailyAppointments).map(([date, value]) => ({
        name: format(new Date(date), 'MM/dd'),
        value,
        label: `${value} مواعيد`
      }));
    }
    
    return [];
  }, [chartType, revenueData, appointmentsData]);

  // Performance metrics
  const performanceMetrics = useMemo(() => {
    const metrics = [];
    
    if (revenueData && appointmentsData) {
      const avgRevenuePerAppointment = appointmentsData.completedAppointments > 0 
        ? revenueData.totalRevenue / appointmentsData.completedAppointments 
        : 0;
      
      metrics.push({
        title: "متوسط الإيرادات لكل موعد",
        value: `$${avgRevenuePerAppointment.toFixed(2)}`,
        icon: Target,
        color: "text-blue-600"
      });
    }
    
    if (appointmentsData) {
      metrics.push({
        title: "معدل إتمام المواعيد",
        value: `${appointmentsData.completionRate.toFixed(1)}%`,
        icon: Award,
        color: "text-green-600"
      });
    }
    
    if (inventoryData) {
      const stockHealthScore = inventoryData.totalItems > 0 
        ? ((inventoryData.totalItems - inventoryData.lowStockItems) / inventoryData.totalItems) * 100 
        : 0;
      
      metrics.push({
        title: "مؤشر صحة المخزون",
        value: `${stockHealthScore.toFixed(1)}%`,
        icon: Package,
        color: stockHealthScore > 80 ? "text-green-600" : stockHealthScore > 60 ? "text-yellow-600" : "text-red-600"
      });
    }
    
    return metrics;
  }, [revenueData, appointmentsData, inventoryData]);

  const todayStats = useMemo(() => [
    {
      title: "إيرادات اليوم",
      value: `$${revenueData?.todayRevenue?.toFixed(2) || '0.00'}`,
      icon: DollarSign,
      trend: revenueData?.todayRevenue ? 'up' : 'neutral'
    },
    {
      title: "مواعيد اليوم",
      value: appointmentsData?.todayAppointments || 0,
      icon: Calendar,
      trend: appointmentsData?.todayAppointments ? 'up' : 'neutral'
    },
    {
      title: "مرضى جدد اليوم",
      value: patientsData?.todayNewPatients || 0,
      icon: Users,
      trend: patientsData?.todayNewPatients ? 'up' : 'neutral'
    },
    {
      title: "أصناف منخفضة",
      value: inventoryData?.lowStockItems || 0,
      icon: Package,
      trend: inventoryData?.lowStockItems ? 'down' : 'neutral'
    }
  ], [revenueData, appointmentsData, patientsData, inventoryData]);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardHeader className="space-y-0 pb-2">
                <div className="h-4 bg-muted rounded animate-pulse" />
              </CardHeader>
              <CardContent>
                <div className="h-8 bg-muted rounded animate-pulse" />
              </CardContent>
            </Card>
          ))}
        </div>
        <Card>
          <CardHeader>
            <div className="h-6 bg-muted rounded animate-pulse w-48" />
          </CardHeader>
          <CardContent>
            <div className="h-[300px] bg-muted rounded animate-pulse" />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">حدث خطأ في تحميل البيانات التحليلية</p>
        <Button onClick={() => window.location.reload()} className="mt-4">
          إعادة المحاولة
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Controls */}
      <div className="flex flex-col sm:flex-row gap-4">
        <Select value={timeRange} onValueChange={setTimeRange}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="الفترة الزمنية" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="7days">آخر 7 أيام</SelectItem>
            <SelectItem value="30days">آخر 30 يوم</SelectItem>
            <SelectItem value="90days">آخر 90 يوم</SelectItem>
            <SelectItem value="6months">آخر 6 أشهر</SelectItem>
          </SelectContent>
        </Select>

        <Select value={chartType} onValueChange={(value: any) => setChartType(value)}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="نوع الرسم البياني" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="revenue">الإيرادات</SelectItem>
            <SelectItem value="appointments">المواعيد</SelectItem>
            <SelectItem value="patients">المرضى</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Today's Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {todayStats.map((stat, index) => (
          <Card key={index}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
              <stat.icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="text-2xl font-bold">{stat.value}</div>
                {stat.trend === 'up' && <TrendingUp className="h-4 w-4 text-green-600" />}
                {stat.trend === 'down' && <TrendingDown className="h-4 w-4 text-red-600" />}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Main Chart */}
      {chartData.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="w-5 h-5" />
              {chartType === 'revenue' && 'تطور الإيرادات'}
              {chartType === 'appointments' && 'تطور المواعيد'}
              {chartType === 'patients' && 'تطور المرضى'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <OptimizedChart
              data={chartData}
              type="bar"
              height={300}
              colors={['hsl(var(--primary))', 'hsl(var(--secondary))', 'hsl(var(--accent))']}
            />
          </CardContent>
        </Card>
      )}

      {/* Performance Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {performanceMetrics.map((metric, index) => (
          <Card key={index}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{metric.title}</CardTitle>
              <metric.icon className={`h-5 w-5 ${metric.color}`} />
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${metric.color}`}>{metric.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Detailed Analytics Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle>تفصيل الإيرادات</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center">
              <span>إجمالي الإيرادات</span>
              <span className="font-bold">${revenueData?.totalRevenue?.toFixed(2) || '0.00'}</span>
            </div>
            <div className="flex justify-between items-center">
              <span>متوسط يومي</span>
              <span className="font-bold">
                ${revenueData?.totalRevenue ? (revenueData.totalRevenue / parseInt(timeRange.replace('days', '') || '30')).toFixed(2) : '0.00'}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span>عدد المدفوعات</span>
              <span className="font-bold">{revenueData?.payments?.length || 0}</span>
            </div>
          </CardContent>
        </Card>

        {/* Appointments Summary */}
        <Card>
          <CardHeader>
            <CardTitle>ملخص المواعيد</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center">
              <span>إجمالي المواعيد</span>
              <span className="font-bold">{appointmentsData?.totalAppointments || 0}</span>
            </div>
            <div className="flex justify-between items-center">
              <span>المواعيد المكتملة</span>
              <span className="font-bold text-green-600">{appointmentsData?.completedAppointments || 0}</span>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span>معدل الإتمام</span>
                <span className="font-bold">{appointmentsData?.completionRate?.toFixed(1) || 0}%</span>
              </div>
              <Progress value={appointmentsData?.completionRate || 0} className="h-2" />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// Memoized component for better performance
export const AnalyticalDashboard = memo(AnalyticalDashboardComponent);

// Wrapped with Error Boundary
export default function AnalyticalDashboardWithErrorBoundary() {
  return (
    <ErrorBoundary>
      <AnalyticalDashboard />
    </ErrorBoundary>
  );
}