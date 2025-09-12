import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Building2, Users, Activity, TrendingUp, Plus, Eye } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { ClinicsManagement } from '@/components/clinic/ClinicsManagement';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface DashboardStats {
  total_clinics: number;
  active_clinics: number;
  total_users: number;
  total_patients: number;
  recent_activities: any[];
  subscription_breakdown: {
    basic: number;
    professional: number;
    premium: number;
  };
}

export function SuperAdminDashboard() {
  const [stats, setStats] = useState<DashboardStats>({
    total_clinics: 0,
    active_clinics: 0,
    total_users: 0,
    total_patients: 0,
    recent_activities: [],
    subscription_breakdown: { basic: 0, professional: 0, premium: 0 }
  });
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchDashboardStats = async () => {
    try {
      // Fetch clinics data
      const { data: clinics, error: clinicsError } = await supabase
        .from('clinics')
        .select('subscription_plan, is_active');

      if (clinicsError) throw clinicsError;

      // Fetch users count
      const { count: usersCount, error: usersError } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true });

      if (usersError) throw usersError;

      // Fetch patients count
      const { count: patientsCount, error: patientsError } = await supabase
        .from('patients')
        .select('*', { count: 'exact', head: true });

      if (patientsError) throw patientsError;

      // Process clinics data
      const totalClinics = clinics?.length || 0;
      const activeClinics = clinics?.filter(c => c.is_active).length || 0;
      
      const subscriptionBreakdown = clinics?.reduce((acc, clinic) => {
        acc[clinic.subscription_plan as keyof typeof acc]++;
        return acc;
      }, { basic: 0, professional: 0, premium: 0 }) || { basic: 0, professional: 0, premium: 0 };

      setStats({
        total_clinics: totalClinics,
        active_clinics: activeClinics,
        total_users: usersCount || 0,
        total_patients: patientsCount || 0,
        recent_activities: [],
        subscription_breakdown: subscriptionBreakdown
      });

    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
      toast({
        title: "خطأ",
        description: "فشل في تحميل إحصائيات لوحة التحكم",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardStats();
  }, []);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader className="space-y-2">
                <div className="h-4 bg-muted rounded w-1/2"></div>
                <div className="h-8 bg-muted rounded w-3/4"></div>
              </CardHeader>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-foreground">لوحة تحكم مدير النظام</h1>
          <p className="text-muted-foreground">
            نظرة شاملة على جميع العيادات والمستخدمين في النظام
          </p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">إجمالي العيادات</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total_clinics}</div>
            <p className="text-xs text-muted-foreground">
              {stats.active_clinics} عيادة نشطة
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">إجمالي المستخدمين</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total_users}</div>
            <p className="text-xs text-muted-foreground">
              عبر جميع العيادات
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">إجمالي المرضى</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total_patients}</div>
            <p className="text-xs text-muted-foreground">
              في النظام
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">نمو النظام</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">+{stats.active_clinics}</div>
            <p className="text-xs text-muted-foreground">
              عيادات نشطة
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Subscription Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle>توزيع خطط الاشتراك</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-4 bg-blue-50 dark:bg-blue-950/20 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">{stats.subscription_breakdown.basic}</div>
              <Badge variant="outline" className="mt-2">أساسي</Badge>
            </div>
            <div className="text-center p-4 bg-green-50 dark:bg-green-950/20 rounded-lg">
              <div className="text-2xl font-bold text-green-600">{stats.subscription_breakdown.professional}</div>
              <Badge variant="secondary" className="mt-2">احترافي</Badge>
            </div>
            <div className="text-center p-4 bg-purple-50 dark:bg-purple-950/20 rounded-lg">
              <div className="text-2xl font-bold text-purple-600">{stats.subscription_breakdown.premium}</div>
              <Badge variant="default" className="mt-2">مميز</Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Main Content Tabs */}
      <Tabs defaultValue="clinics" className="space-y-4">
        <TabsList>
          <TabsTrigger value="clinics">إدارة العيادات</TabsTrigger>
          <TabsTrigger value="system">إدارة النظام</TabsTrigger>
        </TabsList>
        
        <TabsContent value="clinics">
          <ClinicsManagement />
        </TabsContent>
        
        <TabsContent value="system">
          <Card>
            <CardHeader>
              <CardTitle>إدارة النظام</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                إعدادات النظام العامة والمراقبة سيتم إضافتها في المرحلة التالية.
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}