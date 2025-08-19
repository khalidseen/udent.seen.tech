import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { OptimizedChart } from "@/components/ui/optimized-chart";
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

export function AnalyticalDashboard() {
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

  // Revenue Analytics
  const { data: revenueData } = useQuery({
    queryKey: ['revenue-analytics', timeRange],
    queryFn: async () => {
      const { data: payments, error } = await supabase
        .from('payments')
        .select('amount, payment_date, status')
        .gte('payment_date', dateRange.start.toISOString().split('T')[0])
        .lte('payment_date', dateRange.end.toISOString().split('T')[0])
        .eq('status', 'completed');

      if (error) throw error;

      const totalRevenue = payments.reduce((sum, payment) => sum + Number(payment.amount), 0);
      const todayRevenue = payments
        .filter(p => isToday(new Date(p.payment_date)))
        .reduce((sum, payment) => sum + Number(payment.amount), 0);

      // Group by date for chart
      const dailyRevenue = payments.reduce((acc, payment) => {
        const date = payment.payment_date;
        acc[date] = (acc[date] || 0) + Number(payment.amount);
        return acc;
      }, {} as Record<string, number>);

      return { totalRevenue, todayRevenue, dailyRevenue, payments };
    }
  });

  // Appointments Analytics
  const { data: appointmentsData } = useQuery({
    queryKey: ['appointments-analytics', timeRange],
    queryFn: async () => {
      const { data: appointments, error } = await supabase
        .from('appointments')
        .select('id, appointment_date, status, treatment_type')
        .gte('appointment_date', dateRange.start.toISOString())
        .lte('appointment_date', dateRange.end.toISOString());

      if (error) throw error;

      const totalAppointments = appointments.length;
      const completedAppointments = appointments.filter(a => a.status === 'completed').length;
      const todayAppointments = appointments.filter(a => isToday(new Date(a.appointment_date))).length;
      const completionRate = totalAppointments > 0 ? (completedAppointments / totalAppointments) * 100 : 0;

      // Group by date for chart
      const dailyAppointments = appointments.reduce((acc, appointment) => {
        const date = appointment.appointment_date.split('T')[0];
        acc[date] = (acc[date] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      return { 
        totalAppointments, 
        completedAppointments, 
        todayAppointments, 
        completionRate,
        dailyAppointments 
      };
    }
  });

  // Patients Analytics
  const { data: patientsData } = useQuery({
    queryKey: ['patients-analytics', timeRange],
    queryFn: async () => {
      const { data: patients, error } = await supabase
        .from('patients')
        .select('id, created_at')
        .gte('created_at', dateRange.start.toISOString())
        .lte('created_at', dateRange.end.toISOString());

      if (error) throw error;

      const newPatients = patients.length;
      const todayNewPatients = patients.filter(p => isToday(new Date(p.created_at))).length;

      // Get total patients count
      const { count: totalPatients } = await supabase
        .from('patients')
        .select('*', { count: 'exact', head: true });

      return { newPatients, todayNewPatients, totalPatients: totalPatients || 0 };
    }
  });

  // Inventory Analytics
  const { data: inventoryData } = useQuery({
    queryKey: ['inventory-analytics'],
    queryFn: async () => {
      const { data: supplies, error } = await supabase
        .from('medical_supplies')
        .select('current_stock, minimum_stock, unit_cost')
        .eq('is_active', true);

      if (error) throw error;

      const totalItems = supplies.length;
      const lowStockItems = supplies.filter(s => s.current_stock <= s.minimum_stock).length;
      const outOfStockItems = supplies.filter(s => s.current_stock === 0).length;
      const totalValue = supplies.reduce((sum, s) => sum + (s.current_stock * Number(s.unit_cost)), 0);

      return { totalItems, lowStockItems, outOfStockItems, totalValue };
    }
  });

  // Chart data based on selected type
  const chartData = React.useMemo(() => {
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
  const performanceMetrics = React.useMemo(() => {
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

  const todayStats = [
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
  ];

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