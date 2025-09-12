import { useState, useEffect } from "react";
import { 
  Bell, Moon, Sun, User, ChevronDown, Plus, Calendar,
  Search, UserPlus, CalendarPlus
} from "lucide-react";
import { useTheme } from "@/contexts/ThemeContext";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/hooks/useAuth";
import { format } from "date-fns";
import { ar } from "date-fns/locale";
import AddPatientPopup from "@/components/patients/AddPatientPopup";
import AddAppointmentPopup from "@/components/appointments/AddAppointmentPopup";

const TopNavbar = () => {
  const { theme, setTheme } = useTheme();
  const { t } = useLanguage();
  const { user } = useAuth();
  const [currentTime, setCurrentTime] = useState(new Date());
  const [searchQuery, setSearchQuery] = useState("");
  const [notifications, setNotifications] = useState<any[]>([]);
  const [isAddPatientDialogOpen, setIsAddPatientDialogOpen] = useState(false);
  const [isAddAppointmentDialogOpen, setIsAddAppointmentDialogOpen] = useState(false);

  // تحديث الوقت كل ثانية
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const handlePatientAdded = () => {
    // يمكن إضافة logic لتحديث قائمة المرضى إذا لزم الأمر
  };

  const handleAppointmentAdded = () => {
    // يمكن إضافة logic لتحديث قائمة المواعيد إذا لزم الأمر
  };

  return (
    <div className="sticky top-0 z-40 w-full border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex h-16 items-center justify-between px-6">
        {/* القسم الأيسر - التاريخ والوقت */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 bg-muted/50 rounded-lg px-3 py-1.5 border border-border/50">
            <Calendar className="w-4 h-4 text-muted-foreground" />
            <div className="text-sm">
              <span className="font-medium text-foreground">
                {format(currentTime, 'PPPP', { locale: ar })}
              </span>
              <span className="text-muted-foreground mr-2">
                {format(currentTime, 'p', { locale: ar })}
              </span>
            </div>
          </div>
        </div>

        {/* القسم الأوسط - البحث */}
        <div className="flex-1 max-w-md mx-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <Input
              placeholder="البحث في النظام..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 pr-4"
            />
          </div>
        </div>

        {/* القسم الأيمن - الإجراءات والإعدادات */}
        <div className="flex items-center gap-2">
          {/* أزرار الإضافة السريعة */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsAddPatientDialogOpen(true)}
            className="gap-2"
          >
            <UserPlus className="w-4 h-4" />
            مريض جديد
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsAddAppointmentDialogOpen(true)}
            className="gap-2"
          >
            <CalendarPlus className="w-4 h-4" />
            موعد جديد
          </Button>

          {/* الإشعارات */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="relative">
                <Bell className="w-4 h-4" />
                {notifications.length > 0 && (
                  <Badge 
                    variant="destructive" 
                    className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs"
                  >
                    {notifications.length}
                  </Badge>
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-80">
              <div className="flex items-center justify-between p-3">
                <h3 className="font-semibold">الإشعارات</h3>
                <Badge variant="secondary">{notifications.length}</Badge>
              </div>
              <DropdownMenuSeparator />
              {notifications.length === 0 ? (
                <div className="p-3 text-center text-muted-foreground">
                  لا توجد إشعارات جديدة
                </div>
              ) : (
                notifications.map((notification, index) => (
                  <DropdownMenuItem key={index} className="flex flex-col items-start py-2">
                    <div className="font-medium">{notification.title}</div>
                    <div className="text-sm text-muted-foreground">{notification.message}</div>
                  </DropdownMenuItem>
                ))
              )}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* تبديل المظهر */}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setTheme(theme === "light" ? "dark" : "light")}
          >
            {theme === "light" ? (
              <Moon className="w-4 h-4" />
            ) : (
              <Sun className="w-4 h-4" />
            )}
          </Button>

          {/* قائمة المستخدم */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-9 w-9 rounded-full">
                <Avatar className="h-9 w-9">
                  <AvatarImage src="/placeholder-avatar.jpg" alt="User Avatar" />
                  <AvatarFallback>
                    {user?.email?.[0]?.toUpperCase() || 'U'}
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <div className="flex items-center justify-start gap-2 p-2">
                <div className="flex flex-col space-y-1 leading-none">
                  <p className="font-medium text-sm">{user?.email || 'مستخدم'}</p>
                  <p className="w-[200px] truncate text-xs text-muted-foreground">
                    {user?.email || 'user@example.com'}
                  </p>
                </div>
              </div>
              <DropdownMenuSeparator />
              <DropdownMenuItem>
                <User className="mr-2 h-4 w-4" />
                الملف الشخصي
              </DropdownMenuItem>
              <DropdownMenuItem>
                الإعدادات
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem>
                تسجيل الخروج
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* النوافذ المنبثقة */}
      <AddPatientPopup 
        open={isAddPatientDialogOpen}
        onOpenChange={setIsAddPatientDialogOpen}
        onPatientAdded={handlePatientAdded}
      />
      
      <AddAppointmentPopup 
        open={isAddAppointmentDialogOpen}
        onOpenChange={setIsAddAppointmentDialogOpen}
        onAppointmentAdded={handleAppointmentAdded}
      />
    </div>
  );
};

export default TopNavbar;
