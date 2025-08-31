import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { supabase } from '@/integrations/supabase/client';
import { Building2, Users, Calendar, CreditCard, AlertTriangle, CheckCircle } from 'lucide-react';

interface SubscriptionStats {
  totalClinics: number;
  activeSubscriptions: number;
  expiringSoon: number;
  trialSubscriptions: number;
  revenueThisMonth: number;
  planDistribution: Record<string, number>;
}

export const SubscriptionOverview = () => {
  const [stats, setStats] = useState<SubscriptionStats>({
    totalClinics: 0,
    activeSubscriptions: 0,
    expiringSoon: 0,
    trialSubscriptions: 0,
    revenueThisMonth: 0,
    planDistribution: {}
  });
  const [loading, setLoading] = useState(true);

  const fetchStats = async () => {
    try {
      // Get total clinics count
      const { count: totalClinics } = await supabase
        .from('clinics')
        .select('*', { count: 'exact', head: true });

      // Get active subscriptions
      const { count: activeSubscriptions } = await supabase
        .from('clinics')
        .select('*', { count: 'exact', head: true })
        .not('subscription_plan_id', 'is', null)
        .or('subscription_end_date.is.null,subscription_end_date.gt.now()');

      // Get subscriptions expiring in 30 days
      const thirtyDaysFromNow = new Date();
      thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
      
      const { count: expiringSoon } = await supabase
        .from('clinics')
        .select('*', { count: 'exact', head: true })
        .not('subscription_end_date', 'is', null)
        .lte('subscription_end_date', thirtyDaysFromNow.toISOString())
        .gt('subscription_end_date', new Date().toISOString());

      // Get trial subscriptions
      const { count: trialSubscriptions } = await supabase
        .from('clinics')
        .select('*', { count: 'exact', head: true })
        .not('trial_end_date', 'is', null)
        .gt('trial_end_date', new Date().toISOString());

      // Get plan distribution
      const { data: planData } = await supabase
        .from('clinics')
        .select(`
          subscription_plans (
            name_ar
          )
        `)
        .not('subscription_plan_id', 'is', null);

      const planDistribution: Record<string, number> = {};
      planData?.forEach(clinic => {
        if (clinic.subscription_plans) {
          const planName = (clinic.subscription_plans as any).name_ar;
          planDistribution[planName] = (planDistribution[planName] || 0) + 1;
        }
      });

      // Calculate revenue (this would typically come from a payments table)
      const { data: revenueData } = await supabase
        .from('clinics')
        .select(`
          subscription_plans (
            price,
            duration_months
          ),
          subscription_start_date
        `)
        .not('subscription_plan_id', 'is', null)
        .gte('subscription_start_date', new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString());

      let revenueThisMonth = 0;
      revenueData?.forEach(clinic => {
        if (clinic.subscription_plans) {
          const plan = clinic.subscription_plans as any;
          revenueThisMonth += plan.price || 0;
        }
      });

      setStats({
        totalClinics: totalClinics || 0,
        activeSubscriptions: activeSubscriptions || 0,
        expiringSoon: expiringSoon || 0,
        trialSubscriptions: trialSubscriptions || 0,
        revenueThisMonth,
        planDistribution
      });
    } catch (error) {
      console.error('Error fetching subscription stats:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {Array.from({ length: 8 }).map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader>
              <div className="h-4 bg-muted rounded w-2/3"></div>
              <div className="h-8 bg-muted rounded w-1/2"></div>
            </CardHeader>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">إجمالي العيادات</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalClinics}</div>
            <p className="text-xs text-muted-foreground">
              جميع العيادات المسجلة
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">الاشتراكات النشطة</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.activeSubscriptions}</div>
            <p className="text-xs text-muted-foreground">
              {((stats.activeSubscriptions / stats.totalClinics) * 100).toFixed(1)}% من العيادات
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">تنتهي قريباً</CardTitle>
            <AlertTriangle className="h-4 w-4 text-amber-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-600">{stats.expiringSoon}</div>
            <p className="text-xs text-muted-foreground">
              خلال 30 يوم القادمة
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">الاشتراكات التجريبية</CardTitle>
            <Users className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{stats.trialSubscriptions}</div>
            <p className="text-xs text-muted-foreground">
              في الفترة التجريبية
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Revenue and Plan Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              الإيرادات الشهرية
            </CardTitle>
            <CardDescription>
              إجمالي الإيرادات لهذا الشهر
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-primary">
              {stats.revenueThisMonth.toLocaleString()} ريال
            </div>
            <p className="text-sm text-muted-foreground mt-2">
              من {stats.activeSubscriptions} اشتراك نشط
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>توزيع الخطط</CardTitle>
            <CardDescription>
              نسبة استخدام كل خطة اشتراك
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {Object.entries(stats.planDistribution).map(([planName, count]) => {
              const percentage = (count / stats.activeSubscriptions) * 100;
              return (
                <div key={planName} className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">{planName}</span>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">{count}</Badge>
                      <span className="text-sm text-muted-foreground">
                        {percentage.toFixed(1)}%
                      </span>
                    </div>
                  </div>
                  <Progress value={percentage} className="h-2" />
                </div>
              );
            })}
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle>النشاط الأخير</CardTitle>
          <CardDescription>
            آخر التحديثات على الاشتراكات
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            سيتم إضافة سجل النشاط قريباً
          </div>
        </CardContent>
      </Card>
    </div>
  );
};