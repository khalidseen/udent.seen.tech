import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { Users, Calendar, CheckCircle, Clock } from "lucide-react";

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
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">لوحة التحكم</h1>
        <p className="text-muted-foreground mt-2">مرحباً بك في نظام إدارة العيادة</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((card, index) => {
          const Icon = card.icon;
          return (
            <Card key={index} className="hover:shadow-lg transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {card.title}
                </CardTitle>
                <Icon className={`h-4 w-4 ${card.color}`} />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-foreground">{card.value}</div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>مرحباً بك في نظام فوردنتست</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-muted-foreground">
              نظام إدارة العيادة المتطور الذي يساعدك في:
            </p>
            <ul className="space-y-2 text-sm">
              <li className="flex items-center">
                <CheckCircle className="w-4 h-4 text-green-600 ml-2" />
                إدارة بيانات المرضى
              </li>
              <li className="flex items-center">
                <CheckCircle className="w-4 h-4 text-green-600 ml-2" />
                جدولة المواعيد
              </li>
              <li className="flex items-center">
                <CheckCircle className="w-4 h-4 text-green-600 ml-2" />
                متابعة العلاجات
              </li>
              <li className="flex items-center">
                <CheckCircle className="w-4 h-4 text-green-600 ml-2" />
                إدارة الحسابات
              </li>
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>بدء سريع</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-muted-foreground text-sm">
              ابدأ باستخدام النظام:
            </p>
            <div className="space-y-2">
              <div className="p-3 bg-muted rounded-lg">
                <h4 className="font-medium text-sm">1. أضف مريض جديد</h4>
                <p className="text-xs text-muted-foreground">انقر على "إضافة مريض" من القائمة الجانبية</p>
              </div>
              <div className="p-3 bg-muted rounded-lg">
                <h4 className="font-medium text-sm">2. احجز موعد</h4>
                <p className="text-xs text-muted-foreground">اذهب إلى قسم الحجوزات لإضافة موعد جديد</p>
              </div>
              <div className="p-3 bg-muted rounded-lg">
                <h4 className="font-medium text-sm">3. تابع العلاجات</h4>
                <p className="text-xs text-muted-foreground">راجع وحدث بيانات المرضى والعلاجات</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Overview;