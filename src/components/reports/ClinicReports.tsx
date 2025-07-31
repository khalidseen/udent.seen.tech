import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { 
  Users, 
  Calendar, 
  Activity, 
  TrendingUp, 
  BarChart3, 
  PieChart,
  FileText,
  ClipboardList
} from "lucide-react";
import { PageContainer } from "@/components/layout/PageContainer";
import { PageHeader } from "@/components/layout/PageHeader";
import { 
  ChartContainer, 
  ChartTooltip, 
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent
} from "@/components/ui/chart";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  ResponsiveContainer,
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  Area,
  AreaChart
} from "recharts";

interface ReportStats {
  totalPatients: number;
  totalAppointments: number;
  totalTreatments: number;
  totalRequests: number;
  appointmentsByStatus: { status: string; count: number; percentage: number }[];
  patientsByGender: { gender: string; count: number; percentage: number }[];
  appointmentsByMonth: { month: string; count: number }[];
  treatmentsByStatus: { status: string; count: number; percentage: number }[];
  requestsByStatus: { status: string; count: number; percentage: number }[];
  dailyAppointments: { date: string; count: number }[];
}

const COLORS = {
  primary: "hsl(var(--primary))",
  secondary: "hsl(var(--secondary))",
  accent: "hsl(var(--accent))",
  muted: "hsl(var(--muted))",
  destructive: "hsl(var(--destructive))",
  success: "#10b981",
  warning: "#f59e0b",
  info: "#3b82f6"
};

const ClinicReports = () => {
  const [stats, setStats] = useState<ReportStats>({
    totalPatients: 0,
    totalAppointments: 0,
    totalTreatments: 0,
    totalRequests: 0,
    appointmentsByStatus: [],
    patientsByGender: [],
    appointmentsByMonth: [],
    treatmentsByStatus: [],
    requestsByStatus: [],
    dailyAppointments: []
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchReportData();
  }, []);

  const fetchReportData = async () => {
    try {
      setLoading(true);

      // Get current user's clinic_id
      const { data: profile } = await supabase
        .from('profiles')
        .select('id')
        .eq('user_id', (await supabase.auth.getUser()).data.user?.id)
        .single();

      if (!profile) return;
      const clinicId = profile.id;

      // Fetch all data in parallel
      const [
        patientsResult,
        appointmentsResult,
        treatmentsResult,
        requestsResult
      ] = await Promise.all([
        supabase.from('patients').select('*').eq('clinic_id', clinicId),
        supabase.from('appointments').select('*').eq('clinic_id', clinicId),
        supabase.from('dental_treatments').select('*').eq('clinic_id', clinicId),
        supabase.from('appointment_requests').select('*').eq('clinic_id', clinicId)
      ]);

      const patients = patientsResult.data || [];
      const appointments = appointmentsResult.data || [];
      const treatments = treatmentsResult.data || [];
      const requests = requestsResult.data || [];

      // Calculate appointment status distribution
      const appointmentStatusCounts = appointments.reduce((acc, apt) => {
        acc[apt.status] = (acc[apt.status] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      const appointmentsByStatus = Object.entries(appointmentStatusCounts).map(([status, count]) => ({
        status: getStatusName(status),
        count,
        percentage: Math.round((count / appointments.length) * 100) || 0
      }));

      // Calculate patient gender distribution
      const genderCounts = patients.reduce((acc, patient) => {
        const gender = patient.gender || 'غير محدد';
        acc[gender] = (acc[gender] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      const patientsByGender = Object.entries(genderCounts).map(([gender, count]) => ({
        gender: getGenderName(gender),
        count,
        percentage: Math.round((count / patients.length) * 100) || 0
      }));

      // Calculate appointments by month
      const monthCounts = appointments.reduce((acc, apt) => {
        const date = new Date(apt.appointment_date);
        const month = date.toLocaleDateString('ar', { month: 'long' });
        acc[month] = (acc[month] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      const appointmentsByMonth = Object.entries(monthCounts).map(([month, count]) => ({
        month,
        count
      }));

      // Calculate treatment status distribution
      const treatmentStatusCounts = treatments.reduce((acc, treatment) => {
        acc[treatment.status] = (acc[treatment.status] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      const treatmentsByStatus = Object.entries(treatmentStatusCounts).map(([status, count]) => ({
        status: getTreatmentStatusName(status),
        count,
        percentage: Math.round((count / treatments.length) * 100) || 0
      }));

      // Calculate request status distribution
      const requestStatusCounts = requests.reduce((acc, request) => {
        acc[request.status] = (acc[request.status] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      const requestsByStatus = Object.entries(requestStatusCounts).map(([status, count]) => ({
        status: getRequestStatusName(status),
        count,
        percentage: Math.round((count / requests.length) * 100) || 0
      }));

      // Calculate daily appointments for the last 7 days
      const last7Days = Array.from({ length: 7 }, (_, i) => {
        const date = new Date();
        date.setDate(date.getDate() - i);
        return date.toISOString().split('T')[0];
      }).reverse();

      const dailyAppointments = last7Days.map(date => {
        const count = appointments.filter(apt => 
          apt.appointment_date.split('T')[0] === date
        ).length;
        return {
          date: new Date(date).toLocaleDateString('ar', { weekday: 'short' }),
          count
        };
      });

      setStats({
        totalPatients: patients.length,
        totalAppointments: appointments.length,
        totalTreatments: treatments.length,
        totalRequests: requests.length,
        appointmentsByStatus,
        patientsByGender,
        appointmentsByMonth,
        treatmentsByStatus,
        requestsByStatus,
        dailyAppointments
      });
    } catch (error) {
      console.error('Error fetching report data:', error);
      // Set default empty stats on error
      setStats({
        totalPatients: 0,
        totalAppointments: 0,
        totalTreatments: 0,
        totalRequests: 0,
        appointmentsByStatus: [],
        patientsByGender: [],
        appointmentsByMonth: [],
        treatmentsByStatus: [],
        requestsByStatus: [],
        dailyAppointments: []
      });
    } finally {
      setLoading(false);
    }
  };

  const getStatusName = (status: string) => {
    const statusMap = {
      'scheduled': 'مجدول',
      'completed': 'مكتمل',
      'cancelled': 'ملغي',
      'no-show': 'لم يحضر'
    };
    return statusMap[status as keyof typeof statusMap] || status;
  };

  const getGenderName = (gender: string) => {
    const genderMap = {
      'male': 'ذكر',
      'female': 'أنثى',
      'غير محدد': 'غير محدد'
    };
    return genderMap[gender as keyof typeof genderMap] || gender;
  };

  const getTreatmentStatusName = (status: string) => {
    const statusMap = {
      'planned': 'مخطط',
      'in_progress': 'قيد التنفيذ',
      'completed': 'مكتمل',
      'cancelled': 'ملغي'
    };
    return statusMap[status as keyof typeof statusMap] || status;
  };

  const getRequestStatusName = (status: string) => {
    const statusMap = {
      'pending': 'معلق',
      'approved': 'موافق عليه',
      'rejected': 'مرفوض'
    };
    return statusMap[status as keyof typeof statusMap] || status;
  };

  if (loading) {
    return (
      <PageContainer>
        <PageHeader 
          title="تقارير العيادة" 
          description="تحليلات شاملة لأداء العيادة" 
        />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="h-20 bg-muted rounded"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </PageContainer>
    );
  }

  const statCards = [
    {
      title: "إجمالي المرضى",
      value: stats.totalPatients,
      icon: Users,
      color: "text-blue-600",
      bgColor: "bg-blue-50 dark:bg-blue-900/20"
    },
    {
      title: "إجمالي المواعيد",
      value: stats.totalAppointments,
      icon: Calendar,
      color: "text-green-600",
      bgColor: "bg-green-50 dark:bg-green-900/20"
    },
    {
      title: "إجمالي العلاجات",
      value: stats.totalTreatments,
      icon: Activity,
      color: "text-purple-600",
      bgColor: "bg-purple-50 dark:bg-purple-900/20"
    },
    {
      title: "طلبات المواعيد",
      value: stats.totalRequests,
      icon: ClipboardList,
      color: "text-orange-600",
      bgColor: "bg-orange-50 dark:bg-orange-900/20"
    }
  ];

  return (
    <PageContainer>
      <PageHeader 
        title="تقارير العيادة" 
        description="تحليلات شاملة ومفصلة لأداء العيادة" 
      />

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 w-full mb-8">
        {statCards.map((card, index) => {
          const Icon = card.icon;
          return (
            <Card key={index} className="hover:shadow-xl transition-all duration-300">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {card.title}
                </CardTitle>
                <div className={`p-3 rounded-lg ${card.bgColor}`}>
                  <Icon className={`h-6 w-6 ${card.color}`} />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-foreground tracking-tight mb-2">
                  {card.value.toLocaleString()}
                </div>
                <div className="flex items-center text-sm text-muted-foreground">
                  <TrendingUp className="h-4 w-4 text-green-600 ml-1" />
                  إجمالي في النظام
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Charts Tabs */}
      <Tabs defaultValue="appointments" className="w-full">
        <TabsList className="grid w-full grid-cols-4 mb-6">
          <TabsTrigger value="appointments" className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            المواعيد
          </TabsTrigger>
          <TabsTrigger value="patients" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            المرضى
          </TabsTrigger>
          <TabsTrigger value="treatments" className="flex items-center gap-2">
            <Activity className="h-4 w-4" />
            العلاجات
          </TabsTrigger>
          <TabsTrigger value="requests" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            الطلبات
          </TabsTrigger>
        </TabsList>

        <TabsContent value="appointments" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Appointments by Status */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <PieChart className="h-5 w-5" />
                  توزيع المواعيد حسب الحالة
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ChartContainer config={{}} className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <RechartsPieChart>
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <Pie
                        data={stats.appointmentsByStatus}
                        dataKey="count"
                        nameKey="status"
                        cx="50%"
                        cy="50%"
                        outerRadius={80}
                      >
                        {stats.appointmentsByStatus.map((item, index) => (
                          <Cell 
                            key={`cell-${index}`} 
                            fill={Object.values(COLORS)[index % Object.values(COLORS).length]} 
                          />
                        ))}
                      </Pie>
                    </RechartsPieChart>
                  </ResponsiveContainer>
                </ChartContainer>
                <div className="grid grid-cols-2 gap-2 mt-4">
                  {stats.appointmentsByStatus.map((item, index) => (
                    <div key={item.status} className="flex items-center gap-2 text-sm">
                      <div 
                        className="w-3 h-3 rounded-full" 
                        style={{ backgroundColor: Object.values(COLORS)[index % Object.values(COLORS).length] }}
                      />
                      <span>{item.status}: {item.count} ({item.percentage}%)</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Daily Appointments Trend */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  المواعيد في آخر 7 أيام
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ChartContainer config={{}} className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={stats.dailyAppointments}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis />
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <Area 
                        type="monotone" 
                        dataKey="count" 
                        stroke={COLORS.primary}
                        fill={COLORS.primary}
                        fillOpacity={0.3}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </ChartContainer>
              </CardContent>
            </Card>
          </div>

          {/* Monthly Appointments */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                المواعيد الشهرية
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ChartContainer config={{}} className="h-[400px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={stats.appointmentsByMonth}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Bar dataKey="count" fill={COLORS.primary} radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </ChartContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="patients" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                توزيع المرضى حسب الجنس
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ChartContainer config={{}} className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <RechartsPieChart>
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Pie
                      data={stats.patientsByGender}
                      dataKey="count"
                      nameKey="gender"
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                    >
                      {stats.patientsByGender.map((item, index) => (
                        <Cell 
                          key={`cell-${index}`} 
                          fill={Object.values(COLORS)[index % Object.values(COLORS).length]} 
                        />
                      ))}
                    </Pie>
                  </RechartsPieChart>
                </ResponsiveContainer>
              </ChartContainer>
              <div className="grid grid-cols-2 gap-2 mt-4">
                {stats.patientsByGender.map((item, index) => (
                  <div key={item.gender} className="flex items-center gap-2 text-sm">
                    <div 
                      className="w-3 h-3 rounded-full" 
                      style={{ backgroundColor: Object.values(COLORS)[index % Object.values(COLORS).length] }}
                    />
                    <span>{item.gender}: {item.count} ({item.percentage}%)</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="treatments" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5" />
                توزيع العلاجات حسب الحالة
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ChartContainer config={{}} className="h-[400px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={stats.treatmentsByStatus} layout="horizontal">
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" />
                    <YAxis dataKey="status" type="category" width={100} />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Bar dataKey="count" fill={COLORS.success} radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </ChartContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="requests" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                توزيع طلبات المواعيد حسب الحالة
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ChartContainer config={{}} className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <RechartsPieChart>
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Pie
                      data={stats.requestsByStatus}
                      dataKey="count"
                      nameKey="status"
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                    >
                      {stats.requestsByStatus.map((item, index) => (
                        <Cell 
                          key={`cell-${index}`} 
                          fill={Object.values(COLORS)[index % Object.values(COLORS).length]} 
                        />
                      ))}
                    </Pie>
                  </RechartsPieChart>
                </ResponsiveContainer>
              </ChartContainer>
              <div className="grid grid-cols-2 gap-2 mt-4">
                {stats.requestsByStatus.map((item, index) => (
                  <div key={item.status} className="flex items-center gap-2 text-sm">
                    <div 
                      className="w-3 h-3 rounded-full" 
                      style={{ backgroundColor: Object.values(COLORS)[index % Object.values(COLORS).length] }}
                    />
                    <span>{item.status}: {item.count} ({item.percentage}%)</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </PageContainer>
  );
};

export default ClinicReports;