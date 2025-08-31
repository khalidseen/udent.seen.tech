import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { Clock, Users, Calendar, HardDrive, AlertTriangle, CheckCircle } from 'lucide-react';
import { SubscriptionNotifications } from './SubscriptionNotifications';

interface SubscriptionCardProps {
  showNotifications?: boolean;
  compact?: boolean;
}

interface CurrentSubscription {
  plan_name: string;
  plan_name_ar: string;
  price: number;
  currency: string;
  subscription_end_date: string;
  trial_end_date: string;
  limits: {
    max_users: number;
    max_patients: number;
    max_monthly_appointments: number;
    max_storage_gb: number;
  };
  usage: {
    users: number;
    patients: number;
    appointments: number;
    storage: number;
  };
}

export const SubscriptionCard = ({ showNotifications = false, compact = false }: SubscriptionCardProps) => {
  const [subscription, setSubscription] = useState<CurrentSubscription | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchSubscription = async () => {
    try {
      // Get current user's clinic subscription
      const { data: profile } = await supabase
        .from('profiles')
        .select('clinic_id')
        .eq('user_id', (await supabase.auth.getUser()).data.user?.id)
        .single();

      if (!profile?.clinic_id) return;

      // Get clinic with subscription details
      const { data: clinic } = await supabase
        .from('clinics')
        .select(`
          subscription_end_date,
          trial_end_date,
          subscription_plan:subscription_plans (
            name,
            name_ar,
            price,
            currency,
            max_users,
            max_patients,
            max_monthly_appointments,
            max_storage_gb
          )
        `)
        .eq('id', profile.clinic_id)
        .single();

      // Get usage data
      const { data: usage } = await supabase
        .from('usage_tracking')
        .select('*')
        .eq('clinic_id', profile.clinic_id);

      if (clinic?.subscription_plan) {
        const plan = clinic.subscription_plan as any;
        const usageMap = usage?.reduce((acc, item) => {
          acc[item.metric_type] = item.current_count;
          return acc;
        }, {} as Record<string, number>) || {};

        setSubscription({
          plan_name: plan.name,
          plan_name_ar: plan.name_ar,
          price: plan.price,
          currency: plan.currency,
          subscription_end_date: clinic.subscription_end_date,
          trial_end_date: clinic.trial_end_date,
          limits: {
            max_users: plan.max_users,
            max_patients: plan.max_patients,
            max_monthly_appointments: plan.max_monthly_appointments,
            max_storage_gb: plan.max_storage_gb
          },
          usage: {
            users: usageMap.users || 0,
            patients: usageMap.patients || 0,
            appointments: usageMap.appointments || 0,
            storage: usageMap.storage || 0
          }
        });
      }
    } catch (error) {
      console.error('Error fetching subscription:', error);
    } finally {
      setLoading(false);
    }
  };

  const getUsagePercentage = (current: number, max: number) => {
    return max === 0 ? 0 : Math.min((current / max) * 100, 100);
  };

  const getStatusColor = (percentage: number) => {
    if (percentage >= 90) return 'text-red-600';
    if (percentage >= 75) return 'text-amber-600';
    return 'text-green-600';
  };

  const getDaysUntilExpiry = () => {
    if (!subscription?.subscription_end_date) return null;
    const endDate = new Date(subscription.subscription_end_date);
    const today = new Date();
    const diffTime = endDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const isTrialActive = () => {
    if (!subscription?.trial_end_date) return false;
    const trialEnd = new Date(subscription.trial_end_date);
    return trialEnd > new Date();
  };

  useEffect(() => {
    fetchSubscription();
  }, []);

  if (loading) {
    return (
      <Card className="animate-pulse">
        <CardHeader>
          <div className="h-6 bg-muted rounded w-1/3"></div>
          <div className="h-4 bg-muted rounded w-1/2"></div>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="h-4 bg-muted rounded"></div>
            <div className="h-2 bg-muted rounded"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!subscription) {
    return (
      <Card>
        <CardContent className="text-center py-8">
          <AlertTriangle className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
          <p className="text-muted-foreground">لم يتم العثور على معلومات الاشتراك</p>
        </CardContent>
      </Card>
    );
  }

  const daysUntilExpiry = getDaysUntilExpiry();
  const trialActive = isTrialActive();

  if (compact) {
    return (
      <Card className="w-full">
        <CardHeader className="pb-3">
          <div className="flex justify-between items-start">
            <div>
              <CardTitle className="text-lg flex items-center gap-2">
                {subscription.plan_name_ar}
                {trialActive && <Badge variant="outline">تجريبي</Badge>}
              </CardTitle>
              <CardDescription>
                {subscription.price === 0 ? 'مجاني' : `${subscription.price} ${subscription.currency}`}
              </CardDescription>
            </div>
            {daysUntilExpiry !== null && (
              <Badge variant={daysUntilExpiry <= 7 ? 'destructive' : daysUntilExpiry <= 30 ? 'secondary' : 'outline'}>
                {daysUntilExpiry > 0 ? `${daysUntilExpiry} يوم متبقي` : 'منتهي الصلاحية'}
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="grid grid-cols-2 gap-3 text-sm">
            {/* Usage indicators */}
            <div className="space-y-1">
              <div className="flex justify-between">
                <span>المستخدمون</span>
                <span>{subscription.usage.users}/{subscription.limits.max_users}</span>
              </div>
              <Progress value={getUsagePercentage(subscription.usage.users, subscription.limits.max_users)} className="h-1" />
            </div>
            <div className="space-y-1">
              <div className="flex justify-between">
                <span>المرضى</span>
                <span>{subscription.usage.patients}/{subscription.limits.max_patients}</span>
              </div>
              <Progress value={getUsagePercentage(subscription.usage.patients, subscription.limits.max_patients)} className="h-1" />
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {showNotifications && <SubscriptionNotifications />}
      
      <Card>
        <CardHeader>
          <div className="flex justify-between items-start">
            <div>
              <CardTitle className="flex items-center gap-2">
                الخطة الحالية: {subscription.plan_name_ar}
                {trialActive && <Badge variant="outline">تجريبي</Badge>}
              </CardTitle>
              <CardDescription>
                {subscription.price === 0 ? 'مجاني' : `${subscription.price} ${subscription.currency} شهرياً`}
              </CardDescription>
            </div>
            {daysUntilExpiry !== null && (
              <div className="text-right">
                <Badge variant={daysUntilExpiry <= 7 ? 'destructive' : daysUntilExpiry <= 30 ? 'secondary' : 'outline'}>
                  <Clock className="h-3 w-3 mr-1" />
                  {daysUntilExpiry > 0 ? `${daysUntilExpiry} يوم متبقي` : 'منتهي الصلاحية'}
                </Badge>
              </div>
            )}
          </div>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {/* Usage Statistics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium">المستخدمون</span>
                </div>
                <span className="text-sm">{subscription.usage.users}/{subscription.limits.max_users}</span>
              </div>
              <Progress value={getUsagePercentage(subscription.usage.users, subscription.limits.max_users)} />
              <p className={`text-xs ${getStatusColor(getUsagePercentage(subscription.usage.users, subscription.limits.max_users))}`}>
                {getUsagePercentage(subscription.usage.users, subscription.limits.max_users).toFixed(1)}% مستخدم
              </p>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium">المرضى</span>
                </div>
                <span className="text-sm">{subscription.usage.patients}/{subscription.limits.max_patients}</span>
              </div>
              <Progress value={getUsagePercentage(subscription.usage.patients, subscription.limits.max_patients)} />
              <p className={`text-xs ${getStatusColor(getUsagePercentage(subscription.usage.patients, subscription.limits.max_patients))}`}>
                {getUsagePercentage(subscription.usage.patients, subscription.limits.max_patients).toFixed(1)}% مريض
              </p>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium">المواعيد</span>
                </div>
                <span className="text-sm">{subscription.usage.appointments}/{subscription.limits.max_monthly_appointments}</span>
              </div>
              <Progress value={getUsagePercentage(subscription.usage.appointments, subscription.limits.max_monthly_appointments)} />
              <p className={`text-xs ${getStatusColor(getUsagePercentage(subscription.usage.appointments, subscription.limits.max_monthly_appointments))}`}>
                {getUsagePercentage(subscription.usage.appointments, subscription.limits.max_monthly_appointments).toFixed(1)}% شهرياً
              </p>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <HardDrive className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium">التخزين</span>
                </div>
                <span className="text-sm">{subscription.usage.storage}/{subscription.limits.max_storage_gb} GB</span>
              </div>
              <Progress value={getUsagePercentage(subscription.usage.storage, subscription.limits.max_storage_gb)} />
              <p className={`text-xs ${getStatusColor(getUsagePercentage(subscription.usage.storage, subscription.limits.max_storage_gb))}`}>
                {getUsagePercentage(subscription.usage.storage, subscription.limits.max_storage_gb).toFixed(1)}% مستخدم
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2">
            <Button variant="outline" size="sm">
              عرض تفاصيل الخطة
            </Button>
            <Button size="sm">
              ترقية الخطة
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};