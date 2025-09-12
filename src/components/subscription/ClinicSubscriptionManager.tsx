import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Calendar, Users, CreditCard, AlertTriangle, ArrowUp, Clock } from 'lucide-react';
import { useSubscriptionPlans } from '@/hooks/useSubscriptionPlans';

interface ClinicSubscriptionManagerProps {
  clinicId: string;
}

interface ClinicSubscription {
  id: string;
  name: string;
  subscription_plan_id: string;
  subscription_start_date: string;
  subscription_end_date: string;
  trial_end_date: string;
  subscription_plan: {
    name_ar: string;
    price: number;
    currency: string;
    max_users: number;
    max_patients: number;
    max_monthly_appointments: number;
    max_storage_gb: number;
  };
}

interface UsageData {
  users: number;
  patients: number;
  appointments: number;
  storage: number;
}

export const ClinicSubscriptionManager = ({ clinicId }: ClinicSubscriptionManagerProps) => {
  const { plans } = useSubscriptionPlans();
  const { toast } = useToast();
  const [clinic, setClinic] = useState<ClinicSubscription | null>(null);
  const [usage, setUsage] = useState<UsageData>({ users: 0, patients: 0, appointments: 0, storage: 0 });
  const [loading, setLoading] = useState(true);
  const [upgradeDialogOpen, setUpgradeDialogOpen] = useState(false);
  const [selectedPlanId, setSelectedPlanId] = useState('');

  const fetchClinicData = async () => {
    try {
      const { data: clinicData, error } = await supabase
        .from('clinics')
        .select(`
          *,
          subscription_plan:subscription_plans (
            name_ar,
            price,
            currency,
            max_users,
            max_patients,
            max_monthly_appointments,
            max_storage_gb
          )
        `)
        .eq('id', clinicId)
        .single();

      if (error) throw error;
      setClinic(clinicData);

      // Fetch usage data
      const { data: usageData } = await supabase
        .from('usage_tracking')
        .select('*')
        .eq('clinic_id', clinicId);

      const usageMap = usageData?.reduce((acc, item) => {
        acc[item.metric_type] = item.current_count;
        return acc;
      }, {} as Record<string, number>) || {};

      setUsage({
        users: usageMap.users || 0,
        patients: usageMap.patients || 0,
        appointments: usageMap.appointments || 0,
        storage: usageMap.storage || 0
      });
    } catch (error) {
      console.error('Error fetching clinic data:', error);
      toast({
        title: "خطأ",
        description: "فشل في تحميل بيانات الاشتراك",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handlePlanUpgrade = async () => {
    if (!selectedPlanId) return;

    try {
      const { error } = await supabase
        .from('clinics')
        .update({
          subscription_plan_id: selectedPlanId,
          subscription_start_date: new Date().toISOString(),
          subscription_end_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() // 30 days from now
        })
        .eq('id', clinicId);

      if (error) throw error;

      toast({
        title: "تم بنجاح",
        description: "تم ترقية الخطة بنجاح"
      });

      setUpgradeDialogOpen(false);
      fetchClinicData();
    } catch (error) {
      console.error('Error upgrading plan:', error);
      toast({
        title: "خطأ",
        description: "فشل في ترقية الخطة",
        variant: "destructive"
      });
    }
  };

  const getUsagePercentage = (current: number, max: number) => {
    return max === 0 ? 0 : Math.min((current / max) * 100, 100);
  };

  const getUsageColor = (percentage: number) => {
    if (percentage >= 90) return 'text-red-600';
    if (percentage >= 75) return 'text-amber-600';
    return 'text-green-600';
  };

  const getDaysUntilExpiry = () => {
    if (!clinic?.subscription_end_date) return null;
    const endDate = new Date(clinic.subscription_end_date);
    const today = new Date();
    const diffTime = endDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const isTrialActive = () => {
    if (!clinic?.trial_end_date) return false;
    const trialEnd = new Date(clinic.trial_end_date);
    return trialEnd > new Date();
  };

  useEffect(() => {
    fetchClinicData();
  }, [clinicId]);

  if (loading) {
    return (
      <div className="space-y-4">
        <Card className="animate-pulse">
          <CardHeader>
            <div className="h-6 bg-muted rounded w-1/3"></div>
            <div className="h-4 bg-muted rounded w-2/3"></div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="h-4 bg-muted rounded"></div>
              <div className="h-4 bg-muted rounded w-3/4"></div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!clinic) {
    return (
      <Card>
        <CardContent className="text-center py-8">
          <p className="text-muted-foreground">لم يتم العثور على بيانات الاشتراك</p>
        </CardContent>
      </Card>
    );
  }

  const daysUntilExpiry = getDaysUntilExpiry();
  const trialActive = isTrialActive();

  return (
    <div className="space-y-6">
      {/* Current Plan */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-start">
            <div>
              <CardTitle className="flex items-center gap-2">
                الخطة الحالية: {clinic.subscription_plan?.name_ar}
                {trialActive && <Badge variant="outline">تجريبي</Badge>}
              </CardTitle>
              <CardDescription>
                {clinic.subscription_plan?.price === 0 
                  ? 'مجاني' 
                  : `${clinic.subscription_plan?.price} ${clinic.subscription_plan?.currency} شهرياً`
                }
              </CardDescription>
            </div>
            <Dialog open={upgradeDialogOpen} onOpenChange={setUpgradeDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <ArrowUp className="h-4 w-4 mr-2" />
                  ترقية الخطة
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>ترقية خطة الاشتراك</DialogTitle>
                  <DialogDescription>
                    اختر الخطة الجديدة للعيادة
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <Select onValueChange={setSelectedPlanId}>
                    <SelectTrigger>
                      <SelectValue placeholder="اختر الخطة" />
                    </SelectTrigger>
                    <SelectContent>
                      {plans.filter(plan => plan.id !== clinic.subscription_plan_id).map(plan => (
                        <SelectItem key={plan.id} value={plan.id}>
                          {plan.name_ar} - {plan.price === 0 ? 'مجاني' : `${plan.price} ${plan.currency}`}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <div className="flex justify-end gap-2">
                    <Button variant="outline" onClick={() => setUpgradeDialogOpen(false)}>
                      إلغاء
                    </Button>
                    <Button onClick={handlePlanUpgrade} disabled={!selectedPlanId}>
                      تأكيد الترقية
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {daysUntilExpiry !== null && (
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <span className={daysUntilExpiry <= 7 ? 'text-red-600' : 'text-muted-foreground'}>
                  {daysUntilExpiry > 0 
                    ? `ينتهي خلال ${daysUntilExpiry} يوم`
                    : 'انتهت صلاحية الاشتراك'
                  }
                </span>
              </div>
            )}
            {trialActive && (
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-blue-600" />
                <span className="text-blue-600">في الفترة التجريبية</span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Usage Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">المستخدمون</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {usage.users}/{clinic.subscription_plan?.max_users}
            </div>
            <Progress 
              value={getUsagePercentage(usage.users, clinic.subscription_plan?.max_users || 0)} 
              className="mt-2"
            />
            <p className={`text-xs mt-1 ${getUsageColor(getUsagePercentage(usage.users, clinic.subscription_plan?.max_users || 0))}`}>
              {getUsagePercentage(usage.users, clinic.subscription_plan?.max_users || 0).toFixed(1)}% مستخدم
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">المرضى</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {usage.patients}/{clinic.subscription_plan?.max_patients}
            </div>
            <Progress 
              value={getUsagePercentage(usage.patients, clinic.subscription_plan?.max_patients || 0)} 
              className="mt-2"
            />
            <p className={`text-xs mt-1 ${getUsageColor(getUsagePercentage(usage.patients, clinic.subscription_plan?.max_patients || 0))}`}>
              {getUsagePercentage(usage.patients, clinic.subscription_plan?.max_patients || 0).toFixed(1)}% مريض
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">المواعيد الشهرية</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {usage.appointments}/{clinic.subscription_plan?.max_monthly_appointments}
            </div>
            <Progress 
              value={getUsagePercentage(usage.appointments, clinic.subscription_plan?.max_monthly_appointments || 0)} 
              className="mt-2"
            />
            <p className={`text-xs mt-1 ${getUsageColor(getUsagePercentage(usage.appointments, clinic.subscription_plan?.max_monthly_appointments || 0))}`}>
              {getUsagePercentage(usage.appointments, clinic.subscription_plan?.max_monthly_appointments || 0).toFixed(1)}% موعد
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">التخزين</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {usage.storage}/{clinic.subscription_plan?.max_storage_gb} GB
            </div>
            <Progress 
              value={getUsagePercentage(usage.storage, clinic.subscription_plan?.max_storage_gb || 0)} 
              className="mt-2"
            />
            <p className={`text-xs mt-1 ${getUsageColor(getUsagePercentage(usage.storage, clinic.subscription_plan?.max_storage_gb || 0))}`}>
              {getUsagePercentage(usage.storage, clinic.subscription_plan?.max_storage_gb || 0).toFixed(1)}% مستخدم
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Warnings */}
      {(daysUntilExpiry !== null && daysUntilExpiry <= 7) && (
        <Card className="border-amber-200 bg-amber-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-amber-800">
              <AlertTriangle className="h-5 w-5" />
              تنبيه: انتهاء الاشتراك قريباً
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-amber-700">
              سينتهي اشتراك العيادة خلال {daysUntilExpiry} يوم. يرجى تجديد الاشتراك لتجنب انقطاع الخدمة.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};