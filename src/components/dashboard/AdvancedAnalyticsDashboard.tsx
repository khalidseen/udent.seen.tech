import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  PieChart, 
  Pie, 
  Cell,
  LineChart,
  Line,
  Area,
  AreaChart
} from 'recharts';
import { 
  Users, 
  Calendar, 
  TrendingUp, 
  DollarSign, 
  Activity,
  PieChart as PieChartIcon,
  BarChart3,
  TrendingDown
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { usePermissions } from '@/hooks/usePermissions';

interface AnalyticsData {
  monthlyRevenue: Array<{ month: string; revenue: number; appointments: number; }>;
  patientGrowth: Array<{ month: string; newPatients: number; totalPatients: number; }>;
  treatmentStats: Array<{ name: string; count: number; revenue: number; }>;
  appointmentStats: Array<{ status: string; count: number; percentage: number; }>;
  weeklyActivity: Array<{ day: string; appointments: number; revenue: number; }>;
}

interface MetricCard {
  title: string;
  value: string;
  change: string;
  trend: 'up' | 'down' | 'neutral';
  icon: React.ReactNode;
}

export const AdvancedAnalyticsDashboard: React.FC = () => {
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null);
  const [metrics, setMetrics] = useState<MetricCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState('6months');
  const { toast } = useToast();
  const { hasPermission } = usePermissions();

  useEffect(() => {
    if (hasPermission('reports.view')) {
      fetchAnalyticsData();
    }
  }, [dateRange, hasPermission]);

  const fetchAnalyticsData = async () => {
    try {
      setLoading(true);
      
      // محاكاة بيانات التحليلات - في التطبيق الحقيقي ستأتي من قاعدة البيانات
      const mockData: AnalyticsData = {
        monthlyRevenue: [
          { month: 'يناير', revenue: 45000, appointments: 120 },
          { month: 'فبراير', revenue: 52000, appointments: 135 },
          { month: 'مارس', revenue: 48000, appointments: 128 },
          { month: 'أبريل', revenue: 61000, appointments: 152 },
          { month: 'مايو', revenue: 55000, appointments: 142 },
          { month: 'يونيو', revenue: 67000, appointments: 165 },
        ],
        patientGrowth: [
          { month: 'يناير', newPatients: 25, totalPatients: 250 },
          { month: 'فبراير', newPatients: 32, totalPatients: 282 },
          { month: 'مارس', newPatients: 28, totalPatients: 310 },
          { month: 'أبريل', newPatients: 35, totalPatients: 345 },
          { month: 'مايو', newPatients: 30, totalPatients: 375 },
          { month: 'يونيو', newPatients: 42, totalPatients: 417 },
        ],
        treatmentStats: [
          { name: 'تنظيف الأسنان', count: 145, revenue: 72500 },
          { name: 'حشوات', count: 89, revenue: 133500 },
          { name: 'تقويم الأسنان', count: 23, revenue: 115000 },
          { name: 'زراعة الأسنان', count: 12, revenue: 96000 },
          { name: 'تبييض الأسنان', count: 34, revenue: 34000 },
        ],
        appointmentStats: [
          { status: 'مكتمل', count: 145, percentage: 72.5 },
          { status: 'محجوز', count: 32, percentage: 16 },
          { status: 'ملغي', count: 15, percentage: 7.5 },
          { status: 'لم يحضر', count: 8, percentage: 4 },
        ],
        weeklyActivity: [
          { day: 'السبت', appointments: 25, revenue: 12500 },
          { day: 'الأحد', appointments: 32, revenue: 16000 },
          { day: 'الاثنين', appointments: 28, revenue: 14000 },
          { day: 'الثلاثاء', appointments: 35, revenue: 17500 },
          { day: 'الأربعاء', appointments: 30, revenue: 15000 },
          { day: 'الخميس', appointments: 27, revenue: 13500 },
          { day: 'الجمعة', appointments: 18, revenue: 9000 },
        ]
      };

      // حساب المقاييس الرئيسية
      const totalRevenue = mockData.monthlyRevenue.reduce((sum, item) => sum + item.revenue, 0);
      const totalAppointments = mockData.monthlyRevenue.reduce((sum, item) => sum + item.appointments, 0);
      const totalPatients = mockData.patientGrowth[mockData.patientGrowth.length - 1].totalPatients;
      const newPatientsThisMonth = mockData.patientGrowth[mockData.patientGrowth.length - 1].newPatients;

      const mockMetrics: MetricCard[] = [
        {
          title: 'إجمالي الإيرادات',
          value: `${totalRevenue.toLocaleString()} ر.س`,
          change: '+12.5%',
          trend: 'up',
          icon: <DollarSign className="w-4 h-4" />
        },
        {
          title: 'إجمالي المواعيد',
          value: totalAppointments.toString(),
          change: '+8.2%',
          trend: 'up',
          icon: <Calendar className="w-4 h-4" />
        },
        {
          title: 'إجمالي المرضى',
          value: totalPatients.toString(),
          change: '+15.3%',
          trend: 'up',
          icon: <Users className="w-4 h-4" />
        },
        {
          title: 'مرضى جدد هذا الشهر',
          value: newPatientsThisMonth.toString(),
          change: '+22.1%',
          trend: 'up',
          icon: <TrendingUp className="w-4 h-4" />
        }
      ];

      setAnalyticsData(mockData);
      setMetrics(mockMetrics);
    } catch (error) {
      console.error('Error fetching analytics:', error);
      toast({
        title: 'خطأ في جلب البيانات',
        description: 'حدث خطأ أثناء جلب بيانات التحليلات',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const COLORS = ['#8884d8', '#82ca9d', '#ffc658', '#ff7300', '#00ff00'];

  if (!hasPermission('reports.view')) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <p className="text-muted-foreground">ليس لديك صلاحية لعرض التحليلات المتقدمة</p>
        </CardContent>
      </Card>
    );
  }

  if (loading || !analyticsData) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>التحليلات المتقدمة</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* المقاييس الرئيسية */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {metrics.map((metric, index) => (
          <Card key={index}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {metric.title}
              </CardTitle>
              {metric.icon}
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metric.value}</div>
              <p className={`text-xs ${
                metric.trend === 'up' ? 'text-green-600' : 
                metric.trend === 'down' ? 'text-red-600' : 
                'text-muted-foreground'
              }`}>
                {metric.trend === 'up' && <TrendingUp className="inline w-3 h-3 mr-1" />}
                {metric.trend === 'down' && <TrendingDown className="inline w-3 h-3 mr-1" />}
                {metric.change} من الشهر الماضي
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* الرسوم البيانية */}
      <Tabs defaultValue="revenue" className="space-y-4">
        <TabsList>
          <TabsTrigger value="revenue">الإيرادات</TabsTrigger>
          <TabsTrigger value="patients">نمو المرضى</TabsTrigger>
          <TabsTrigger value="treatments">العلاجات</TabsTrigger>
          <TabsTrigger value="appointments">المواعيد</TabsTrigger>
        </TabsList>

        <TabsContent value="revenue" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>الإيرادات والمواعيد الشهرية</CardTitle>
              <CardDescription>
                تتبع الإيرادات وعدد المواعيد خلال الأشهر الماضية
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={analyticsData.monthlyRevenue}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis yAxisId="left" />
                  <YAxis yAxisId="right" orientation="right" />
                  <Tooltip />
                  <Legend />
                  <Area
                    yAxisId="left"
                    type="monotone"
                    dataKey="revenue"
                    stackId="1"
                    stroke="#8884d8"
                    fill="#8884d8"
                    fillOpacity={0.3}
                    name="الإيرادات (ر.س)"
                  />
                  <Line
                    yAxisId="right"
                    type="monotone"
                    dataKey="appointments"
                    stroke="#82ca9d"
                    strokeWidth={2}
                    name="المواعيد"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="patients" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>نمو قاعدة المرضى</CardTitle>
              <CardDescription>
                تطور عدد المرضى الجدد والإجمالي
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={analyticsData.patientGrowth}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="newPatients"
                    stroke="#8884d8"
                    strokeWidth={2}
                    name="مرضى جدد"
                  />
                  <Line
                    type="monotone"
                    dataKey="totalPatients"
                    stroke="#82ca9d"
                    strokeWidth={2}
                    name="إجمالي المرضى"
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="treatments" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>أداء العلاجات</CardTitle>
              <CardDescription>
                أكثر العلاجات طلباً والإيرادات المتولدة منها
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={analyticsData.treatmentStats}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis yAxisId="left" />
                  <YAxis yAxisId="right" orientation="right" />
                  <Tooltip />
                  <Legend />
                  <Bar yAxisId="left" dataKey="count" fill="#8884d8" name="عدد العلاجات" />
                  <Bar yAxisId="right" dataKey="revenue" fill="#82ca9d" name="الإيرادات (ر.س)" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="appointments" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>توزيع حالات المواعيد</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart>
                    <Pie
                      data={analyticsData.appointmentStats}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percentage }) => `${name} (${percentage}%)`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="count"
                    >
                      {analyticsData.appointmentStats.map((entry, index) => (
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
                <CardTitle>النشاط الأسبوعي</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={analyticsData.weeklyActivity}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="day" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="appointments" fill="#8884d8" name="المواعيد" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};