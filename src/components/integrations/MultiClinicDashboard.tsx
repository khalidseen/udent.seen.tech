import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Building2, Users, Calendar, DollarSign, Activity, RefreshCw } from 'lucide-react';
import { ClinicAnalytics } from '@/hooks/useMultiClinicAnalytics';
import { Skeleton } from '@/components/ui/skeleton';

interface MultiClinicDashboardProps {
  analytics: ClinicAnalytics[];
  aggregated: {
    totalPatients: number;
    totalAppointments: number;
    totalRevenue: number;
    thisMonthRevenue: number;
    totalUsers: number;
    activeClinics: number;
    totalClinics: number;
  };
  loading: boolean;
  onRefresh: () => void;
  onSelectClinic: (clinicId: string) => void;
}

const MultiClinicDashboard: React.FC<MultiClinicDashboardProps> = ({
  analytics,
  aggregated,
  loading,
  onRefresh,
  onSelectClinic,
}) => {
  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i}><CardContent className="p-6"><Skeleton className="h-16" /></CardContent></Card>
          ))}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i}><CardContent className="p-6"><Skeleton className="h-32" /></CardContent></Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold">نظرة عامة على جميع العيادات</h2>
        <Button variant="outline" size="sm" onClick={onRefresh}>
          <RefreshCw className="w-4 h-4 ml-2" />
          تحديث
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">إجمالي العيادات</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{aggregated.activeClinics}</div>
            <p className="text-xs text-muted-foreground">من {aggregated.totalClinics} عيادة</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">إجمالي المرضى</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{aggregated.totalPatients.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">عبر جميع العيادات</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">المواعيد (30 يوم)</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{aggregated.totalAppointments.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">آخر 30 يوم</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">إيرادات الشهر</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{aggregated.thisMonthRevenue.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">الإجمالي: {aggregated.totalRevenue.toLocaleString()}</p>
          </CardContent>
        </Card>
      </div>

      {/* Clinics List */}
      <Card>
        <CardHeader>
          <CardTitle>العيادات المربوطة</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {analytics.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">لا توجد عيادات متاحة</p>
            ) : (
              analytics.map((clinic) => (
                <div
                  key={clinic.clinic_id}
                  className="flex items-center justify-between p-4 rounded-lg border bg-card hover:bg-accent/50 transition-colors cursor-pointer"
                  onClick={() => onSelectClinic(clinic.clinic_id)}
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <Building2 className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-medium">{clinic.clinic_name}</h3>
                      <p className="text-sm text-muted-foreground">
                        {clinic.subscription_plan || 'بدون خطة'} • {clinic.user_count} مستخدم
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-6">
                    <div className="text-center">
                      <p className="text-sm font-medium">{clinic.patient_count}</p>
                      <p className="text-xs text-muted-foreground">مريض</p>
                    </div>
                    <div className="text-center">
                      <p className="text-sm font-medium">{clinic.appointment_count}</p>
                      <p className="text-xs text-muted-foreground">موعد</p>
                    </div>
                    <div className="text-center">
                      <p className="text-sm font-medium">{clinic.this_month_revenue.toLocaleString()}</p>
                      <p className="text-xs text-muted-foreground">إيراد الشهر</p>
                    </div>
                    <Badge variant={clinic.is_active ? 'default' : 'secondary'}>
                      {clinic.is_active ? 'نشطة' : 'غير نشطة'}
                    </Badge>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default MultiClinicDashboard;
