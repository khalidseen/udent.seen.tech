import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { PageContainer } from "@/components/layout/PageContainer";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { ClinicSubscriptionManager } from "@/components/subscription/ClinicSubscriptionManager";
import { 
  Calendar, 
  Crown, 
  Package, 
  Users, 
  FileText, 
  TrendingUp, 
  AlertCircle,
  CheckCircle,
  Clock
} from "lucide-react";
import { format } from "date-fns";
import { ar } from "date-fns/locale";

interface ClinicData {
  id: string;
  name: string;
  subscription_plan: string;
  subscription_status: string;
  subscription_start_date: string;
  subscription_end_date: string;
  max_users: number;
  max_patients: number;
  usage_metrics: {
    users_count?: number;
    patients_count?: number;
    appointments_count?: number;
    storage_used?: number;
  };
}

export default function SubscriptionManagement() {
  const { user } = useAuth();
  const [refreshing, setRefreshing] = useState(false);

  // Fetch current clinic data and subscription details
  const { data: clinicData, isLoading, refetch } = useQuery({
    queryKey: ['clinic-subscription', user?.id],
    queryFn: async () => {
      if (!user?.id) throw new Error('User not authenticated');

      // Get current user's clinic
      const { data: profile } = await supabase
        .from('profiles')
        .select('clinic_id')
        .eq('user_id', user.id)
        .single();

      if (!profile?.clinic_id) throw new Error('No clinic found for user');

      // Get clinic details with subscription info
      const { data: clinic, error: clinicError } = await supabase
        .from('clinics')
        .select('*')
        .eq('id', profile.clinic_id)
        .single();

      if (clinicError) throw clinicError;

      // Get usage metrics
      const [usersCount, patientsCount, appointmentsCount] = await Promise.all([
        supabase
          .from('profiles')
          .select('*', { count: 'exact', head: true })
          .eq('clinic_id', profile.clinic_id),
        supabase
          .from('patients')
          .select('*', { count: 'exact', head: true })
          .eq('clinic_id', profile.clinic_id),
        supabase
          .from('appointments')
          .select('*', { count: 'exact', head: true })
          .eq('clinic_id', profile.clinic_id)
      ]);

      const usage_metrics = {
        users_count: usersCount.count || 0,
        patients_count: patientsCount.count || 0,
        appointments_count: appointmentsCount.count || 0,
        storage_used: 0 // This would need to be calculated from file storage
      };

      return { ...clinic, usage_metrics } as ClinicData;
    },
    enabled: !!user?.id
  });

  const handleRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  };

  const getSubscriptionStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'trial': return 'bg-blue-100 text-blue-800';
      case 'expired': return 'bg-red-100 text-red-800';
      case 'cancelled': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getSubscriptionStatusIcon = (status: string) => {
    switch (status) {
      case 'active': return CheckCircle;
      case 'trial': return Clock;
      case 'expired': return AlertCircle;
      case 'cancelled': return AlertCircle;
      default: return AlertCircle;
    }
  };

  const getPlanIcon = (plan: string) => {
    switch (plan?.toLowerCase()) {
      case 'premium': return Crown;
      case 'enterprise': return Package;
      case 'basic':
      default: return Package;
    }
  };

  const getDaysUntilExpiry = (endDate: string) => {
    const end = new Date(endDate);
    const now = new Date();
    const diffTime = end.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  if (isLoading) {
    return (
      <PageContainer>
        <PageHeader title="إدارة الاشتراك" description="عرض وإدارة تفاصيل اشتراك العيادة" />
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-48" />
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[...Array(4)].map((_, i) => (
                  <Skeleton key={i} className="h-4 w-full" />
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </PageContainer>
    );
  }

  if (!clinicData) {
    return (
      <PageContainer>
        <PageHeader title="إدارة الاشتراك" description="عرض وإدارة تفاصيل اشتراك العيادة" />
        <Card>
          <CardContent className="text-center py-8">
            <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-lg font-medium mb-2">لم يتم العثور على بيانات العيادة</p>
            <p className="text-muted-foreground">تأكد من أنك مسجل في عيادة</p>
          </CardContent>
        </Card>
      </PageContainer>
    );
  }

  const daysUntilExpiry = getDaysUntilExpiry(clinicData.subscription_end_date);
  const isExpiringSoon = daysUntilExpiry <= 7 && daysUntilExpiry > 0;
  const isExpired = daysUntilExpiry <= 0;
  const StatusIcon = getSubscriptionStatusIcon(clinicData.subscription_status);
  const PlanIcon = getPlanIcon(clinicData.subscription_plan);

  return (
    <PageContainer>
      <PageHeader 
        title="إدارة الاشتراك" 
        description="عرض وإدارة تفاصيل اشتراك العيادة"
        action={
          <Button 
            onClick={handleRefresh} 
            disabled={refreshing}
            variant="outline"
          >
            {refreshing ? "جاري التحديث..." : "تحديث البيانات"}
          </Button>
        }
      />

      <div className="space-y-6">
        {/* Subscription Status Alert */}
        {(isExpiringSoon || isExpired) && (
          <Card className="border-yellow-200 bg-yellow-50">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <AlertCircle className="h-5 w-5 text-yellow-600" />
                <div>
                  <p className="font-medium text-yellow-800">
                    {isExpired ? "انتهت صلاحية الاشتراك" : "ينتهي الاشتراك قريباً"}
                  </p>
                  <p className="text-sm text-yellow-700">
                    {isExpired 
                      ? `انتهى الاشتراك منذ ${Math.abs(daysUntilExpiry)} يوم`
                      : `يتبقى ${daysUntilExpiry} يوم على انتهاء الاشتراك`
                    }
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Current Subscription Overview */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <StatusIcon className="h-5 w-5" />
              معلومات الاشتراك الحالي
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">نوع الخطة</span>
                  <div className="flex items-center gap-2">
                    <PlanIcon className="h-4 w-4" />
                    <span className="font-medium">{clinicData.subscription_plan}</span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">حالة الاشتراك</span>
                  <Badge className={getSubscriptionStatusColor(clinicData.subscription_status)}>
                    {clinicData.subscription_status === 'active' ? 'نشط' :
                     clinicData.subscription_status === 'trial' ? 'تجريبي' :
                     clinicData.subscription_status === 'expired' ? 'منتهي' : 'ملغي'}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">تاريخ البداية</span>
                  <span className="font-medium">
                    {format(new Date(clinicData.subscription_start_date), 'dd MMMM yyyy', { locale: ar })}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">تاريخ الانتهاء</span>
                  <span className="font-medium">
                    {format(new Date(clinicData.subscription_end_date), 'dd MMMM yyyy', { locale: ar })}
                  </span>
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="font-medium">حدود الخطة</h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">الحد الأقصى للمستخدمين</span>
                    <span className="text-sm font-medium">{clinicData.max_users}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">الحد الأقصى للمرضى</span>
                    <span className="text-sm font-medium">{clinicData.max_patients}</span>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Usage Statistics */}
        <div className="grid md:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">المستخدمين</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {clinicData.usage_metrics.users_count} / {clinicData.max_users}
              </div>
              <Progress 
                value={(clinicData.usage_metrics.users_count! / clinicData.max_users) * 100} 
                className="mt-2" 
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">المرضى</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {clinicData.usage_metrics.patients_count} / {clinicData.max_patients}
              </div>
              <Progress 
                value={(clinicData.usage_metrics.patients_count! / clinicData.max_patients) * 100} 
                className="mt-2" 
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">المواعيد الإجمالية</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{clinicData.usage_metrics.appointments_count}</div>
              <p className="text-xs text-muted-foreground mt-2">منذ بداية الاشتراك</p>
            </CardContent>
          </Card>
        </div>

        {/* Subscription Management Component */}
        <ClinicSubscriptionManager clinicId={clinicData.id} />
      </div>
    </PageContainer>
  );
}