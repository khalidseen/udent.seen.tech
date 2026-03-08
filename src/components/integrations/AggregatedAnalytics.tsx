import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import { ClinicAnalytics } from '@/hooks/useMultiClinicAnalytics';
import { Skeleton } from '@/components/ui/skeleton';

interface AggregatedAnalyticsProps {
  analytics: ClinicAnalytics[];
  loading: boolean;
}

const COLORS = [
  'hsl(var(--primary))',
  'hsl(var(--chart-2, 160 60% 45%))',
  'hsl(var(--chart-3, 30 80% 55%))',
  'hsl(var(--chart-4, 280 65% 60%))',
  'hsl(var(--chart-5, 340 75% 55%))',
];

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload?.length) {
    return (
      <div className="bg-background/95 backdrop-blur-sm border rounded-lg p-3 shadow-lg">
        <p className="text-sm font-medium mb-1">{label}</p>
        {payload.map((entry: any, i: number) => (
          <p key={i} className="text-sm" style={{ color: entry.color }}>
            {entry.name}: {Number(entry.value).toLocaleString()}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

const AggregatedAnalytics: React.FC<AggregatedAnalyticsProps> = ({ analytics, loading }) => {
  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {[...Array(4)].map((_, i) => (
          <Card key={i}><CardContent className="p-6"><Skeleton className="h-64" /></CardContent></Card>
        ))}
      </div>
    );
  }

  if (analytics.length === 0) {
    return (
      <Card>
        <CardContent className="p-12 text-center text-muted-foreground">
          لا توجد بيانات كافية للتحليلات
        </CardContent>
      </Card>
    );
  }

  const patientData = analytics.map(c => ({
    name: c.clinic_name,
    المرضى: c.patient_count,
  }));

  const revenueData = analytics.map(c => ({
    name: c.clinic_name,
    'إيراد الشهر': c.this_month_revenue,
    'الإيراد الكلي': c.total_revenue,
  }));

  const appointmentData = analytics.map(c => ({
    name: c.clinic_name,
    المواعيد: c.appointment_count,
    المكتملة: c.completed_appointments,
  }));

  const pieData = analytics.map(c => ({
    name: c.clinic_name,
    value: c.patient_count,
  }));

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold">تحليلات مجمّعة عبر العيادات</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Patients per Clinic */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">المرضى حسب العيادة</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={patientData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="name" fontSize={12} stroke="hsl(var(--muted-foreground))" />
                <YAxis fontSize={12} stroke="hsl(var(--muted-foreground))" />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="المرضى" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Revenue per Clinic */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">الإيرادات حسب العيادة</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={revenueData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="name" fontSize={12} stroke="hsl(var(--muted-foreground))" />
                <YAxis fontSize={12} stroke="hsl(var(--muted-foreground))" />
                <Tooltip content={<CustomTooltip />} />
                <Legend />
                <Bar dataKey="إيراد الشهر" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                <Bar dataKey="الإيراد الكلي" fill="hsl(var(--muted-foreground))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Appointments per Clinic */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">المواعيد حسب العيادة</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={appointmentData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="name" fontSize={12} stroke="hsl(var(--muted-foreground))" />
                <YAxis fontSize={12} stroke="hsl(var(--muted-foreground))" />
                <Tooltip content={<CustomTooltip />} />
                <Legend />
                <Bar dataKey="المواعيد" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                <Bar dataKey="المكتملة" fill="hsl(var(--chart-2, 160 60% 45%))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Patients Distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">توزيع المرضى</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                  dataKey="value"
                  label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                >
                  {pieData.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AggregatedAnalytics;
