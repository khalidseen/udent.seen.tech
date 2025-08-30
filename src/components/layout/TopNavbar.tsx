import { useState, useEffect } from "react";
import { Bell, Moon, Sun, User, ChevronDown } from "lucide-react";
import { useTheme } from "@/contexts/ThemeContext";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { ar } from "date-fns/locale";

interface UpcomingAppointment {
  id: string;
  patient_name: string;
  appointment_date: string;
  treatment_type: string;
}

interface UserProfile {
  full_name: string;
  role: string;
}

export function TopNavbar() {
  const { t, language } = useLanguage();
  const { theme, setTheme } = useTheme();
  const { user, signOut } = useAuth();
  const [upcomingAppointments, setUpcomingAppointments] = useState<UpcomingAppointment[]>([]);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [fontSize, setFontSize] = useState("medium");

  // Fetch user profile
  useEffect(() => {
    const fetchUserProfile = async () => {
      if (user?.id) {
        const { data } = await supabase
          .from('profiles')
          .select('full_name, role')
          .eq('user_id', user.id)
          .single();
        
        setUserProfile(data);
      }
    };

    fetchUserProfile();
  }, [user?.id]);

  // Fetch upcoming appointments within 24 hours
  useEffect(() => {
    const fetchUpcomingAppointments = async () => {
      const now = new Date();
      const next24Hours = new Date(now.getTime() + 24 * 60 * 60 * 1000);

      const { data, error } = await supabase
        .from('appointments')
        .select(`
          id,
          appointment_date,
          treatment_type,
          patients!inner(full_name)
        `)
        .gte('appointment_date', now.toISOString())
        .lte('appointment_date', next24Hours.toISOString())
        .eq('status', 'scheduled')
        .order('appointment_date', { ascending: true });

      if (!error && data) {
        const formattedAppointments: UpcomingAppointment[] = data.map(apt => ({
          id: apt.id,
          patient_name: (apt.patients as any)?.full_name || 'غير محدد',
          appointment_date: apt.appointment_date,
          treatment_type: apt.treatment_type || 'فحص عام'
        }));
        setUpcomingAppointments(formattedAppointments);
      }
    };

    fetchUpcomingAppointments();
    
    // Set up real-time subscription for appointments
    const channel = supabase
      .channel('upcoming-appointments')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'appointments' },
        () => fetchUpcomingAppointments()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const handleLogout = async () => {
    await signOut();
  };

  const formatAppointmentTime = (dateTimeString: string) => {
    try {
      const appointmentDateTime = new Date(dateTimeString);
      return format(appointmentDateTime, language === 'ar' ? 'dd/MM/yyyy - HH:mm' : 'MM/dd/yyyy - HH:mm', {
        locale: language === 'ar' ? ar : undefined
      });
    } catch {
      return dateTimeString;
    }
  };

  return (
    <div className="w-full bg-background border-b border-border h-16 px-4 flex items-center justify-between">
      {/* Empty space for potential logo or breadcrumbs */}
      <div className="flex-1" />

      {/* Right side actions */}
      <div className="flex items-center gap-2">
        {/* Upcoming Appointments Notifications */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="relative">
              <Bell className="h-5 w-5" />
              {upcomingAppointments.length > 0 && (
                <Badge variant="destructive" className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs">
                  {upcomingAppointments.length}
                </Badge>
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-80">
            <div className="flex items-center justify-between p-2">
              <h3 className="font-semibold">المواعيد القريبة (24 ساعة)</h3>
            </div>
            <DropdownMenuSeparator />
            {upcomingAppointments.length === 0 ? (
              <DropdownMenuItem className="flex justify-center py-4">
                <span className="text-muted-foreground">لا توجد مواعيد قريبة</span>
              </DropdownMenuItem>
            ) : (
              upcomingAppointments.slice(0, 5).map((appointment) => (
                <DropdownMenuItem key={appointment.id} className="flex flex-col items-start py-2">
                  <div className="font-medium">{appointment.patient_name}</div>
                  <div className="text-sm text-muted-foreground">
                    {appointment.treatment_type}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {formatAppointmentTime(appointment.appointment_date)}
                  </div>
                </DropdownMenuItem>
              ))
            )}
            {upcomingAppointments.length > 5 && (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="flex justify-center">
                  <span className="text-sm text-muted-foreground">
                    و {upcomingAppointments.length - 5} مواعيد أخرى
                  </span>
                </DropdownMenuItem>
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Theme Toggle */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon">
              {theme === "dark" ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => setTheme("light")}>
              <Sun className="mr-2 h-4 w-4" />
              <span>{t("lightTheme")}</span>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setTheme("dark")}>
              <Moon className="mr-2 h-4 w-4" />
              <span>{t("darkTheme")}</span>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <div className="p-2">
              <h3 className="font-semibold text-sm mb-1">{t("fontSize")}</h3>
              <DropdownMenuRadioGroup value={fontSize} onValueChange={setFontSize}>
                <DropdownMenuRadioItem value="small">{t("small")}</DropdownMenuRadioItem>
                <DropdownMenuRadioItem value="medium">{t("medium")}</DropdownMenuRadioItem>
                <DropdownMenuRadioItem value="large">{t("large")}</DropdownMenuRadioItem>
              </DropdownMenuRadioGroup>
            </div>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* User Profile */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="flex items-center gap-2 px-2">
              <div className="flex flex-col items-end text-right">
                <span className="text-sm font-medium">
                  {userProfile?.full_name || user?.email?.split('@')[0] || 'المستخدم'}
                </span>
                <span className="text-xs text-muted-foreground">
                  {userProfile?.role || 'مستخدم'}
                </span>
              </div>
              <Avatar className="h-8 w-8">
                <AvatarImage src={undefined} />
                <AvatarFallback>
                  {userProfile?.full_name?.charAt(0) || user?.email?.charAt(0) || 'م'}
                </AvatarFallback>
              </Avatar>
              <ChevronDown className="h-4 w-4 text-muted-foreground" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <div className="flex flex-col p-2 gap-2">
              <div className="font-medium">
                {userProfile?.full_name || user?.email?.split('@')[0] || 'المستخدم'}
              </div>
              <div className="text-sm text-muted-foreground">
                {userProfile?.role || 'مستخدم'}
              </div>
              {user?.email && (
                <div className="text-xs text-muted-foreground break-all">
                  {user.email}
                </div>
              )}
            </div>
            <DropdownMenuSeparator />
            <DropdownMenuSeparator />
            <DropdownMenuItem 
              className="text-red-500 focus:text-red-500 focus:bg-red-50 dark:focus:bg-red-950"
              onClick={handleLogout}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="mr-2 h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"></path>
                <polyline points="16 17 21 12 16 7"></polyline>
                <line x1="21" y1="12" x2="9" y2="12"></line>
              </svg>
              <span>{t("logout")}</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}

export default TopNavbar;