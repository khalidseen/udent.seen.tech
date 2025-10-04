import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Users, Activity, Calendar, HardDrive, TrendingUp, AlertTriangle, Download, RefreshCw } from 'lucide-react';
import { useSubscriptionPermissions } from '@/hooks/useSubscriptionPermissions';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell } from 'recharts';

interface ClinicUsageData {
  clinic_id: string;
  clinic_name: string;
  subscription_plan: string;
  users: {
    current: number;
    max: number;
    percentage: number;
  };
  patients: {
    current: number;
    max: number;
    percentage: number;
  };
  appointments: {
    current: number;
    max: number;
    percentage: number;
  };
  storage: {
    current: number;
    max: number;
    percentage: number;
  };
  last_updated: string;
}

interface UsageOverTime {
  date: string;
  users: number;
  patients: number;
  appointments: number;
}

export const ComprehensiveUsageReports = () => {
  const [timeRange, setTimeRange] = useState('7d');
  const [selectedMetric, setSelectedMetric] = useState('all');
  const { planLimits, getUsagePercentage, shouldShowUpgradeAlert } = useSubscriptionPermissions();

  // بيانات الاستخدام لجميع العيادات
  const { data: allClinicsUsage = [], isLoading: clinicsLoading, refetch: refetchClinics } = useQuery({
    queryKey: ['all-clinics-usage'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('clinics')
        .select(`
          id,
          name,
          subscription_plan,
          max_users,
          max_patients,
          subscription_plans!inner(
            max_users,
            max_patients,
            max_monthly_appointments,
            max_storage_gb
          )
        `);

      if (error) throw error;

      // الحصول على الاستخدام الحالي لكل عيادة
      const usageData = await Promise.all(
        data.map(async (clinic) => {
          const [usersCount, patientsCount, appointmentsCount] = await Promise.all([
            supabase.from('profiles').select('id', { count: 'exact' }).eq('clinic_id', clinic.id),
            supabase.from('patients').select('id', { count: 'exact' }).eq('clinic_id', clinic.id),
            supabase.from('appointments').select('id', { count: 'exact' }).eq('clinic_id', clinic.id)
              .gte('appointment_date', new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString())
          ]);

          const plan = clinic.subscription_plans as any;
          const users = { current: usersCount.count || 0, max: plan?.max_users || 0 };
          const patients = { current: patientsCount.count || 0, max: plan?.max_patients || 0 };
          const appointments = { current: appointmentsCount.count || 0, max: plan?.max_monthly_appointments || 0 };

          return {
            clinic_id: clinic.id,
            clinic_name: clinic.name,
            subscription_plan: clinic.subscription_plan,
            users: { ...users, percentage: Math.round((users.current / users.max) * 100) },
            patients: { ...patients, percentage: Math.round((patients.current / patients.max) * 100) },
            appointments: { ...appointments, percentage: Math.round((appointments.current / appointments.max) * 100) },
            storage: { current: 0, max: plan?.max_storage_gb || 0, percentage: 0 },
            last_updated: new Date().toISOString()
          } as ClinicUsageData;
        })
      );

      return usageData;
    }
  });

  // بيانات الاستخدام عبر الوقت
  const { data: usageOverTime = [] } = useQuery({
    queryKey: ['usage-over-time', timeRange],
    queryFn: async () => {
      const days = timeRange === '7d' ? 7 : timeRange === '30d' ? 30 : 90;
      const data: UsageOverTime[] = [];
      
      for (let i = days - 1; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        
        // محاكاة البيانات - يمكن استبدالها ببيانات حقيقية
        data.push({
          date: date.toISOString().split('T')[0],
          users: Math.floor(Math.random() * 100) + 50,
          patients: Math.floor(Math.random() * 500) + 200,
          appointments: Math.floor(Math.random() * 200) + 100
        });
      }
      
      return data;
    }
  });

  const getClinicsAtRisk = () => {
    return allClinicsUsage.filter(clinic => 
      clinic.users.percentage >= 90 || 
      clinic.patients.percentage >= 90 || 
      clinic.appointments.percentage >= 90
    );
  };

  const getClinicsNearLimit = () => {
    return allClinicsUsage.filter(clinic => 
      (clinic.users.percentage >= 80 && clinic.users.percentage < 90) ||
      (clinic.patients.percentage >= 80 && clinic.patients.percentage < 90) ||
      (clinic.appointments.percentage >= 80 && clinic.appointments.percentage < 90)
    );
  };

  const getUsageStatusColor = (percentage: number) => {
    if (percentage >= 90) return 'text-red-600 bg-red-50';
    if (percentage >= 80) return 'text-orange-600 bg-orange-50';
    if (percentage >= 60) return 'text-yellow-600 bg-yellow-50';
    return 'text-green-600 bg-green-50';
  };

  const getUsageStatusText = (percentage: number) => {
    if (percentage >= 90) return 'حرج';
    if (percentage >= 80) return 'تحذير';
    if (percentage >= 60) return 'متوسط';
    return 'آمن';
  };

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

  if (clinicsLoading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="text-muted-foreground">جاري تحميل تقارير الاستخدام...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* شريط التحكم */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">تقارير الاستخدام التفصيلية</h2>
          <p className="text-muted-foreground">مراقبة شاملة لاستخدام الموارد وحدود الخطط</p>
        </div>
        
        <div className="flex items-center gap-2">
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">آخر 7 أيام</SelectItem>
              <SelectItem value="30d">آخر 30 يوم</SelectItem>
              <SelectItem value="90d">آخر 3 أشهر</SelectItem>
            </SelectContent>
          </Select>
          
          <Button variant="outline" size="sm" onClick={() => refetchClinics()}>
            <RefreshCw className="h-4 w-4 mr-2" />
            تحديث
          </Button>
          
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            تصدير
          </Button>
        </div>
      </div>

      {/* ملخص سريع */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">إجمالي العيادات</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{allClinicsUsage.length}</div>
            <p className="text-xs text-muted-foreground">عيادة نشطة</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">عيادات في خطر</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{getClinicsAtRisk().length}</div>
            <p className="text-xs text-muted-foreground">تجاوزت 90% من الحد</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">تحتاج مراقبة</CardTitle>
            <TrendingUp className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{getClinicsNearLimit().length}</div>
            <p className="text-xs text-muted-foreground">بين 80-90% من الحد</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">معدل الاستخدام العام</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {Math.round(allClinicsUsage.reduce((acc, clinic) => 
                acc + (clinic.users.percentage + clinic.patients.percentage + clinic.appointments.percentage) / 3, 0
              ) / allClinicsUsage.length) || 0}%
            </div>
            <p className="text-xs text-muted-foreground">متوسط الاستخدام</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">نظرة عامة</TabsTrigger>
          <TabsTrigger value="clinics">العيادات</TabsTrigger>
          <TabsTrigger value="trends">الاتجاهات</TabsTrigger>
          <TabsTrigger value="alerts">التنبيهات</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>توزيع الاستخدام</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={[
                        { name: 'المستخدمين', value: allClinicsUsage.reduce((acc, c) => acc + c.users.current, 0) },
                        { name: 'المرضى', value: allClinicsUsage.reduce((acc, c) => acc + c.patients.current, 0) },
                        { name: 'المواعيد', value: allClinicsUsage.reduce((acc, c) => acc + c.appointments.current, 0) }
                      ]}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    >
                      {COLORS.map((color, index) => (
                        <Cell key={`cell-${index}`} fill={color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>مقارنة الخطط</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart
                    data={Object.entries(
                      allClinicsUsage.reduce((acc, clinic) => {
                        const plan = clinic.subscription_plan || 'غير محدد';
                        if (!acc[plan]) acc[plan] = { name: plan, count: 0, avgUsage: 0 };
                        acc[plan].count++;
                        acc[plan].avgUsage += (clinic.users.percentage + clinic.patients.percentage + clinic.appointments.percentage) / 3;
                        return acc;
                      }, {} as Record<string, { name: string; count: number; avgUsage: number }>)
                    ).map(([_, data]) => ({
                      ...data,
                      avgUsage: Math.round(data.avgUsage / data.count)
                    }))}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="count" fill="#8884d8" name="عدد العيادات" />
                    <Bar dataKey="avgUsage" fill="#82ca9d" name="متوسط الاستخدام %" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="clinics" className="space-y-4">
          <div className="space-y-4">
            {allClinicsUsage.map((clinic) => (
              <Card key={clinic.clinic_id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>{clinic.clinic_name}</CardTitle>
                      <CardDescription>خطة {clinic.subscription_plan}</CardDescription>
                    </div>
                    <Badge className={getUsageStatusColor(
                      Math.max(clinic.users.percentage, clinic.patients.percentage, clinic.appointments.percentage)
                    )}>
                      {getUsageStatusText(
                        Math.max(clinic.users.percentage, clinic.patients.percentage, clinic.appointments.percentage)
                      )}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium flex items-center gap-2">
                          <Users className="h-4 w-4" />
                          المستخدمين
                        </span>
                        <span className="text-sm text-muted-foreground">
                          {clinic.users.current} / {clinic.users.max}
                        </span>
                      </div>
                      <Progress value={clinic.users.percentage} className="h-2" />
                      <span className="text-xs text-muted-foreground">{clinic.users.percentage}%</span>
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium flex items-center gap-2">
                          <Activity className="h-4 w-4" />
                          المرضى
                        </span>
                        <span className="text-sm text-muted-foreground">
                          {clinic.patients.current} / {clinic.patients.max}
                        </span>
                      </div>
                      <Progress value={clinic.patients.percentage} className="h-2" />
                      <span className="text-xs text-muted-foreground">{clinic.patients.percentage}%</span>
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium flex items-center gap-2">
                          <Calendar className="h-4 w-4" />
                          المواعيد الشهرية
                        </span>
                        <span className="text-sm text-muted-foreground">
                          {clinic.appointments.current} / {clinic.appointments.max}
                        </span>
                      </div>
                      <Progress value={clinic.appointments.percentage} className="h-2" />
                      <span className="text-xs text-muted-foreground">{clinic.appointments.percentage}%</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="trends" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>اتجاهات الاستخدام عبر الوقت</CardTitle>
              <CardDescription>
                تطور استخدام الموارد خلال الفترة المحددة
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <LineChart data={usageOverTime}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Line type="monotone" dataKey="users" stroke="#8884d8" name="المستخدمين" />
                  <Line type="monotone" dataKey="patients" stroke="#82ca9d" name="المرضى" />
                  <Line type="monotone" dataKey="appointments" stroke="#ffc658" name="المواعيد" />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="alerts" className="space-y-4">
          {getClinicsAtRisk().length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-red-600">
                  <AlertTriangle className="h-5 w-5" />
                  عيادات تحتاج تدخل فوري
                </CardTitle>
                <CardDescription>
                  عيادات تجاوزت 90% من حدود خططها
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {getClinicsAtRisk().map((clinic) => (
                    <div key={clinic.clinic_id} className="p-3 border border-red-200 rounded-lg bg-red-50">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-medium">{clinic.clinic_name}</h4>
                          <p className="text-sm text-muted-foreground">خطة {clinic.subscription_plan}</p>
                        </div>
                        <Button size="sm" variant="destructive">
                          اقتراح ترقية
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {getClinicsNearLimit().length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-orange-600">
                  <TrendingUp className="h-5 w-5" />
                  عيادات تحتاج مراقبة
                </CardTitle>
                <CardDescription>
                  عيادات بين 80-90% من حدود خططها
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {getClinicsNearLimit().map((clinic) => (
                    <div key={clinic.clinic_id} className="p-3 border border-orange-200 rounded-lg bg-orange-50">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-medium">{clinic.clinic_name}</h4>
                          <p className="text-sm text-muted-foreground">خطة {clinic.subscription_plan}</p>
                        </div>
                        <Button size="sm" variant="outline">
                          مراقبة
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};