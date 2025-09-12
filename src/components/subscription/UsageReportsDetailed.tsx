import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts';
import { TrendingUp, TrendingDown, Users, Database, Calendar, HardDrive, AlertTriangle, CheckCircle } from 'lucide-react';
import { format, subDays, startOfMonth, endOfMonth } from 'date-fns';
import { ar } from 'date-fns/locale';

interface UsageData {
  clinic_id: string;
  clinic_name: string;
  metric_type: string;
  current_count: number;
  max_count: number;
  last_updated: string;
  usage_percentage: number;
}

interface ClinicUsageSummary {
  clinic_id: string;
  clinic_name: string;
  subscription_plan: string;
  total_users: number;
  total_patients: number;
  monthly_appointments: number;
  storage_used: number;
  subscription_status: string;
  last_activity: string;
}

export const UsageReportsDetailed = () => {
  const [selectedPeriod, setSelectedPeriod] = useState('30');
  const [selectedClinic, setSelectedClinic] = useState('all');
  const [reportType, setReportType] = useState('overview');

  // الحصول على بيانات الاستخدام
  const { data: usageData = [], isLoading: usageLoading } = useQuery({
    queryKey: ['usage-reports', selectedPeriod, selectedClinic],
    queryFn: async () => {
      let query = supabase
        .from('usage_tracking')
        .select(`
          *,
          clinics!inner(name, subscription_plan, subscription_status)
        `);
      
      if (selectedClinic !== 'all') {
        query = query.eq('clinic_id', selectedClinic);
      }
      
      const { data, error } = await query;
      if (error) throw error;
      
      return (data || []).map(item => ({
        clinic_id: item.clinic_id,
        clinic_name: (item.clinics as any)?.name || 'عيادة غير معروفة',
        metric_type: item.metric_type,
        current_count: item.current_count,
        max_count: item.max_count,
        last_updated: item.last_updated,
        usage_percentage: item.max_count > 0 ? (item.current_count / item.max_count) * 100 : 0
      })) as UsageData[];
    }
  });

  // الحصول على ملخص العيادات
  const { data: clinicsSummary = [], isLoading: clinicsLoading } = useQuery({
    queryKey: ['clinics-summary'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('clinics')
        .select(`
          id,
          name,
          subscription_plan,
          subscription_status,
          updated_at,
          usage_metrics
        `)
        .eq('is_active', true);
      
      if (error) throw error;
      
      return (data || []).map(clinic => {
        const metrics = clinic.usage_metrics as any || {};
        return {
          clinic_id: clinic.id,
          clinic_name: clinic.name,
          subscription_plan: clinic.subscription_plan || 'أساسي',
          total_users: metrics.users || 0,
          total_patients: metrics.patients || 0,
          monthly_appointments: metrics.appointments || 0,
          storage_used: metrics.storage || 0,
          subscription_status: clinic.subscription_status || 'نشط',
          last_activity: clinic.updated_at
        };
      }) as ClinicUsageSummary[];
    }
  });

  // الحصول على العيادات للفلتر
  const { data: clinics = [] } = useQuery({
    queryKey: ['clinics-list'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('clinics')
        .select('id, name')
        .eq('is_active', true);
      
      if (error) throw error;
      return data || [];
    }
  });

  // تحضير بيانات الرسوم البيانية
  const chartData = usageData.reduce((acc, item) => {
    const existing = acc.find(d => d.clinic_name === item.clinic_name);
    if (existing) {
      existing[item.metric_type] = item.usage_percentage;
    } else {
      acc.push({
        clinic_name: item.clinic_name,
        [item.metric_type]: item.usage_percentage
      });
    }
    return acc;
  }, [] as any[]);

  // بيانات التوزيع حسب خطة الاشتراك
  const planDistribution = clinicsSummary.reduce((acc, clinic) => {
    acc[clinic.subscription_plan] = (acc[clinic.subscription_plan] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const pieData = Object.entries(planDistribution).map(([plan, count]) => ({
    name: plan,
    value: count
  }));

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

  const getUsageStatusColor = (percentage: number) => {
    if (percentage >= 90) return 'text-red-500';
    if (percentage >= 75) return 'text-yellow-500';
    return 'text-green-500';
  };

  const getUsageStatusIcon = (percentage: number) => {
    if (percentage >= 90) return <AlertTriangle className="h-4 w-4 text-red-500" />;
    if (percentage >= 75) return <TrendingUp className="h-4 w-4 text-yellow-500" />;
    return <CheckCircle className="h-4 w-4 text-green-500" />;
  };

  if (usageLoading || clinicsLoading) {
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
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">تقارير الاستخدام التفصيلية</h2>
          <p className="text-muted-foreground">مراقبة وتحليل استخدام العيادات للنظام</p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">آخر 7 أيام</SelectItem>
              <SelectItem value="30">آخر 30 يوم</SelectItem>
              <SelectItem value="90">آخر 3 أشهر</SelectItem>
            </SelectContent>
          </Select>
          
          <Select value={selectedClinic} onValueChange={setSelectedClinic}>
            <SelectTrigger className="w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">جميع العيادات</SelectItem>
              {clinics.map(clinic => (
                <SelectItem key={clinic.id} value={clinic.id}>
                  {clinic.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <Tabs value={reportType} onValueChange={setReportType} className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="overview">نظرة عامة</TabsTrigger>
          <TabsTrigger value="detailed">تفصيلي</TabsTrigger>
          <TabsTrigger value="analytics">التحليلات</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* بطاقات الملخص */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">إجمالي العيادات</CardTitle>
                <Database className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{clinicsSummary.length}</div>
                <p className="text-xs text-muted-foreground">العيادات النشطة</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">إجمالي المستخدمين</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {clinicsSummary.reduce((sum, clinic) => sum + clinic.total_users, 0)}
                </div>
                <p className="text-xs text-muted-foreground">في جميع العيادات</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">إجمالي المرضى</CardTitle>
                <Database className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {clinicsSummary.reduce((sum, clinic) => sum + clinic.total_patients, 0)}
                </div>
                <p className="text-xs text-muted-foreground">المرضى المسجلين</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">المواعيد الشهرية</CardTitle>
                <Calendar className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {clinicsSummary.reduce((sum, clinic) => sum + clinic.monthly_appointments, 0)}
                </div>
                <p className="text-xs text-muted-foreground">هذا الشهر</p>
              </CardContent>
            </Card>
          </div>

          {/* الرسم البياني للاستخدام */}
          <Card>
            <CardHeader>
              <CardTitle>استخدام الموارد حسب العيادة</CardTitle>
              <CardDescription>نسبة استخدام الموارد المختلفة في كل عيادة</CardDescription>
            </CardHeader>
            <CardContent>
              <div style={{ width: '100%', height: 300 }}>
                <ResponsiveContainer>
                  <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="clinic_name" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="users" fill="#8884d8" name="المستخدمين" />
                    <Bar dataKey="patients" fill="#82ca9d" name="المرضى" />
                    <Bar dataKey="appointments" fill="#ffc658" name="المواعيد" />
                    <Bar dataKey="storage" fill="#ff7300" name="التخزين" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* توزيع خطط الاشتراك */}
          <Card>
            <CardHeader>
              <CardTitle>توزيع خطط الاشتراك</CardTitle>
              <CardDescription>عدد العيادات في كل خطة اشتراك</CardDescription>
            </CardHeader>
            <CardContent>
              <div style={{ width: '100%', height: 300 }}>
                <ResponsiveContainer>
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {pieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="detailed" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>تفاصيل استخدام العيادات</CardTitle>
              <CardDescription>معلومات مفصلة عن استخدام كل عيادة للموارد</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>العيادة</TableHead>
                    <TableHead>النوع</TableHead>
                    <TableHead>الاستخدام الحالي</TableHead>
                    <TableHead>الحد الأقصى</TableHead>
                    <TableHead>النسبة</TableHead>
                    <TableHead>الحالة</TableHead>
                    <TableHead>آخر تحديث</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {usageData.map((item, index) => (
                    <TableRow key={index}>
                      <TableCell className="font-medium">{item.clinic_name}</TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {item.metric_type === 'users' ? 'مستخدمين' :
                           item.metric_type === 'patients' ? 'مرضى' :
                           item.metric_type === 'appointments' ? 'مواعيد' :
                           item.metric_type === 'storage' ? 'تخزين' : item.metric_type}
                        </Badge>
                      </TableCell>
                      <TableCell>{item.current_count.toLocaleString()}</TableCell>
                      <TableCell>{item.max_count.toLocaleString()}</TableCell>
                      <TableCell className={getUsageStatusColor(item.usage_percentage)}>
                        {item.usage_percentage.toFixed(1)}%
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {getUsageStatusIcon(item.usage_percentage)}
                          <span className={getUsageStatusColor(item.usage_percentage)}>
                            {item.usage_percentage >= 90 ? 'تحذير' :
                             item.usage_percentage >= 75 ? 'انتباه' : 'طبيعي'}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        {item.last_updated ? 
                          format(new Date(item.last_updated), 'dd/MM/yyyy', { locale: ar }) : 
                          'غير محدد'}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>تحليلات متقدمة</CardTitle>
              <CardDescription>تحليل اتجاهات الاستخدام والأداء</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <BarChart className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">قريباً: تحليلات متقدمة</h3>
                <p className="text-muted-foreground">
                  سيتم إضافة تحليلات متقدمة تشمل اتجاهات الاستخدام والتنبؤات والمقارنات التاريخية
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};