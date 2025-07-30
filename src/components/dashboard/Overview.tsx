import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { Users, Calendar, CheckCircle, Clock } from "lucide-react";
import { PageContainer } from "@/components/layout/PageContainer";
import { PageHeader } from "@/components/layout/PageHeader";

interface Stats {
  totalPatients: number;
  todayAppointments: number;
  completedAppointments: number;
  pendingAppointments: number;
}

const Overview = () => {
  const [stats, setStats] = useState<Stats>({
    totalPatients: 0,
    todayAppointments: 0,
    completedAppointments: 0,
    pendingAppointments: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      // Get total patients
      const { count: patientsCount } = await supabase
        .from('patients')
        .select('*', { count: 'exact', head: true });

      // Get today's appointments
      const today = new Date().toISOString().split('T')[0];
      const { count: todayCount } = await supabase
        .from('appointments')
        .select('*', { count: 'exact', head: true })
        .gte('appointment_date', `${today}T00:00:00`)
        .lt('appointment_date', `${today}T23:59:59`);

      // Get completed appointments
      const { count: completedCount } = await supabase
        .from('appointments')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'completed');

      // Get pending appointments
      const { count: pendingCount } = await supabase
        .from('appointments')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'scheduled');

      setStats({
        totalPatients: patientsCount || 0,
        todayAppointments: todayCount || 0,
        completedAppointments: completedCount || 0,
        pendingAppointments: pendingCount || 0
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const statCards = [
    {
      title: "إجمالي المرضى",
      value: stats.totalPatients,
      icon: Users,
      color: "text-blue-600"
    },
    {
      title: "مواعيد اليوم",
      value: stats.todayAppointments,
      icon: Calendar,
      color: "text-green-600"
    },
    {
      title: "المواعيد المكتملة",
      value: stats.completedAppointments,
      icon: CheckCircle,
      color: "text-purple-600"
    },
    {
      title: "المواعيد المعلقة",
      value: stats.pendingAppointments,
      icon: Clock,
      color: "text-orange-600"
    }
  ];

  if (loading) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold">لوحة التحكم</h1>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="h-20 bg-muted rounded"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <PageContainer>
      <PageHeader 
        title="لوحة التحكم" 
        description="مرحباً بك في نظام إدارة العيادة" 
      />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 w-full">
        {statCards.map((card, index) => {
          const Icon = card.icon;
          return (
            <Card key={index} className="hover:shadow-xl transition-all duration-300 border border-border/60 bg-white/90 dark:bg-card/90 backdrop-blur-sm">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {card.title}
                </CardTitle>
                <div className="p-2 bg-gradient-to-br from-primary/10 to-primary/5 rounded-lg">
                  <Icon className={`h-5 w-5 ${card.color}`} />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-foreground tracking-tight">{card.value}</div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 w-full">
        <Card className="border border-border/60 bg-white/90 dark:bg-card/90 backdrop-blur-sm">
          <CardHeader className="pb-4">
            <CardTitle className="text-xl font-semibold">مرحباً بك في نظام فوردنتست</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground text-base">
              نظام إدارة العيادة المتطور الذي يساعدك في:
            </p>
            <ul className="space-y-3">
              <li className="flex items-center p-2 rounded-lg bg-green-50 dark:bg-green-900/10 border border-green-200 dark:border-green-800">
                <CheckCircle className="w-5 h-5 text-green-600 ml-3" />
                <span className="font-medium">إدارة بيانات المرضى</span>
              </li>
              <li className="flex items-center p-2 rounded-lg bg-blue-50 dark:bg-blue-900/10 border border-blue-200 dark:border-blue-800">
                <CheckCircle className="w-5 h-5 text-blue-600 ml-3" />
                <span className="font-medium">جدولة المواعيد</span>
              </li>
              <li className="flex items-center p-2 rounded-lg bg-purple-50 dark:bg-purple-900/10 border border-purple-200 dark:border-purple-800">
                <CheckCircle className="w-5 h-5 text-purple-600 ml-3" />
                <span className="font-medium">متابعة العلاجات</span>
              </li>
              <li className="flex items-center p-2 rounded-lg bg-orange-50 dark:bg-orange-900/10 border border-orange-200 dark:border-orange-800">
                <CheckCircle className="w-5 h-5 text-orange-600 ml-3" />
                <span className="font-medium">إدارة الحسابات</span>
              </li>
            </ul>
          </CardContent>
        </Card>

        <Card className="border border-border/60 bg-white/90 dark:bg-card/90 backdrop-blur-sm">
          <CardHeader className="pb-4">
            <CardTitle className="text-xl font-semibold">بدء سريع</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground">
              ابدأ باستخدام النظام:
            </p>
            <div className="space-y-3">
              <div className="p-4 bg-gradient-to-r from-primary/5 to-primary/10 rounded-xl border border-primary/20">
                <h4 className="font-semibold text-base text-foreground">1. أضف مريض جديد</h4>
                <p className="text-sm text-muted-foreground mt-1">انقر على "إضافة مريض" من القائمة الجانبية</p>
              </div>
              <div className="p-4 bg-gradient-to-r from-green-500/5 to-green-500/10 rounded-xl border border-green-500/20">
                <h4 className="font-semibold text-base text-foreground">2. احجز موعد</h4>
                <p className="text-sm text-muted-foreground mt-1">اذهب إلى قسم الحجوزات لإضافة موعد جديد</p>
              </div>
              <div className="p-4 bg-gradient-to-r from-blue-500/5 to-blue-500/10 rounded-xl border border-blue-500/20">
                <h4 className="font-semibold text-base text-foreground">3. تابع العلاجات</h4>
                <p className="text-sm text-muted-foreground mt-1">راجع وحدث بيانات المرضى والعلاجات</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </PageContainer>
  );
};

export default Overview;