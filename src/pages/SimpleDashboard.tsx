import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { 
  UserPlus, 
  Calendar, 
  FileText, 
  DollarSign,
  Stethoscope,
  Settings,
  Users
} from "lucide-react";

export default function SimpleDashboard() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  const quickActions = [
    {
      title: "المرضى",
      description: "إدارة المرضى",
      icon: Users,
      onClick: () => navigate("/patients"),
      color: "bg-blue-500"
    },
    {
      title: "المواعيد",
      description: "جدول المواعيد",
      icon: Calendar,
      onClick: () => navigate("/appointments"),
      color: "bg-green-500"
    },
    {
      title: "العلاجات",
      description: "إدارة العلاجات",
      icon: Stethoscope,
      onClick: () => navigate("/treatments"),
      color: "bg-purple-500"
    },
    {
      title: "الفواتير",
      description: "إدارة الفواتير",
      icon: DollarSign,
      onClick: () => navigate("/invoices"),
      color: "bg-yellow-500"
    },
    {
      title: "السجلات الطبية",
      description: "السجلات الطبية",
      icon: FileText,
      onClick: () => navigate("/medical-records"),
      color: "bg-red-500"
    },
    {
      title: "الإعدادات",
      description: "إعدادات النظام",
      icon: Settings,
      onClick: () => navigate("/settings"),
      color: "bg-gray-500"
    }
  ];

  return (
    <div className="min-h-screen bg-background p-6">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-3xl font-bold">مرحباً بك! 👋</h1>
            <p className="text-muted-foreground mt-1">
              {user?.email}
            </p>
          </div>
          <Button variant="outline" onClick={() => signOut()}>
            تسجيل الخروج
          </Button>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-4">الإجراءات السريعة</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {quickActions.map((action, index) => (
            <Card 
              key={index}
              className="cursor-pointer hover:shadow-lg transition-shadow"
              onClick={action.onClick}
            >
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className={`${action.color} text-white p-3 rounded-lg`}>
                    <action.icon className="w-6 h-6" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">{action.title}</CardTitle>
                    <CardDescription>{action.description}</CardDescription>
                  </div>
                </div>
              </CardHeader>
            </Card>
          ))}
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              إجمالي المرضى
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">---</div>
            <p className="text-xs text-muted-foreground mt-1">
              جارٍ التحميل...
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              مواعيد اليوم
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">---</div>
            <p className="text-xs text-muted-foreground mt-1">
              جارٍ التحميل...
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              الإيرادات الشهرية
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">---</div>
            <p className="text-xs text-muted-foreground mt-1">
              جارٍ التحميل...
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              العلاجات المكتملة
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">---</div>
            <p className="text-xs text-muted-foreground mt-1">
              جارٍ التحميل...
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Welcome Message */}
      <Card className="mt-8 border-2 border-primary/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Stethoscope className="w-5 h-5" />
            نظام إدارة العيادة - Udent
          </CardTitle>
          <CardDescription>
            نظام متكامل لإدارة العيادات الطبية
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            مرحباً بك في نظام Udent لإدارة العيادات. هذه نسخة مبسطة وسريعة من لوحة التحكم.
            استخدم القوائم أعلاه للوصول إلى جميع الميزات.
          </p>
          <div className="mt-4 flex gap-2">
            <Button onClick={() => navigate("/patients")}>
              <UserPlus className="w-4 h-4 mr-2" />
              إضافة مريض جديد
            </Button>
            <Button variant="outline" onClick={() => navigate("/appointments/new")}>
              <Calendar className="w-4 h-4 mr-2" />
              حجز موعد
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
