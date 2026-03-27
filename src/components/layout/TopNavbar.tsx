import { useState, useEffect, memo, useMemo, useCallback } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useOptimizedDashboard } from "@/hooks/useOptimizedDashboard";
import { useOptimizedUpcomingAppointments } from "@/hooks/useOptimizedAppointments";
import {
  Bell, ChevronDown, Plus, Minus, RotateCcw,
  Search, BarChart3, UserPlus, AlertCircle, Shield, X
} from "lucide-react";
import { useTheme } from "@/contexts/ThemeContext";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { usePermissions } from "@/hooks/usePermissions";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { ar } from "date-fns/locale";
import { ClinicSwitcher } from "../clinic/ClinicSwitcher";

interface SearchResult {
  id: string;
  type: 'patient' | 'appointment' | 'treatment' | 'invoice' | 'medication' | 'user';
  title: string;
  subtitle?: string;
  description?: string;
  url: string;
  icon: string;
}

// ─── Isolated Clock component (re-renders only itself every second) ───
const Clock = memo(function Clock({ language: lang }: { language: string }) {
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const locale = lang === 'ar' ? ar : undefined;
  const dateStr = format(now, lang === 'ar' ? 'dd/MM/yyyy' : 'MM/dd/yyyy', { locale });
  const dayName = format(now, 'EEEE', { locale });
  const timeStr = format(now, 'HH:mm:ss');

  return (
    <div className="flex items-center gap-2 bg-white/60 dark:bg-white/5
                    rounded-lg px-3 py-1.5
                    border border-slate-200 dark:border-slate-700">
      <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">
        {dateStr}
      </span>
      <span className="text-xs text-slate-500 dark:text-slate-400 hidden sm:inline">
        {dayName}
      </span>
      <div className="w-px h-4 bg-slate-300 dark:bg-slate-600" />
      <span className="text-sm font-mono tabular-nums font-semibold text-emerald-600 dark:text-emerald-400">
        {timeStr}
      </span>
    </div>
  );
});

// ─── Sanitize search input for Supabase .ilike() ───
function sanitizeSearchTerm(raw: string): string {
  return raw.replace(/\\/g, '\\\\').replace(/%/g, '\\%').replace(/_/g, '\\_');
}

// ─── Role display helper (pure function) ───
const ROLE_LABELS: Record<string, string> = {
  super_admin: 'مدير عام',
  clinic_owner: 'مالك العيادة',
  doctor: 'طبيب',
  secretary: 'سكرتير',
  nurse: 'ممرض/ة',
  receptionist: 'موظف استقبال',
};

export function TopNavbar() {
  const { language } = useLanguage();
  const { theme, setTheme } = useTheme();
  const { user, signOut } = useAuth();
  const { hasPermission, getPrimaryRole } = usePermissions();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [zoomLevel, setZoomLevel] = useState(100);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isSearchDialogOpen, setIsSearchDialogOpen] = useState(false);

  // ─── Clinic ID via React Query ───
  const { data: clinicId } = useQuery({
    queryKey: ['user-clinic-id', user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from('profiles')
        .select('clinic_id')
        .eq('user_id', user!.id)
        .single();
      return data?.clinic_id ?? null;
    },
    enabled: !!user?.id,
    staleTime: 10 * 60 * 1000,
  });

  // ─── User profile via React Query ───
  const { data: userProfile } = useQuery({
    queryKey: ['user-profile', user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from('profiles')
        .select('full_name, role')
        .eq('user_id', user!.id)
        .single();
      return data as { full_name: string; role: string } | null;
    },
    enabled: !!user?.id,
    staleTime: 5 * 60 * 1000,
  });

  // ─── Dashboard & appointments hooks ───
  const { data: dashboardStats } = useOptimizedDashboard(clinicId ?? null);
  const { data: upcomingApts } = useOptimizedUpcomingAppointments(clinicId ?? null, 24);

  const todayStats = useMemo(() => {
    if (!dashboardStats) return undefined;
    return {
      totalAppointments: dashboardStats.today_appointments + (dashboardStats.today_completed || 0) + (dashboardStats.today_cancelled || 0),
      completedAppointments: dashboardStats.today_completed || 0,
      cancelledAppointments: dashboardStats.today_cancelled || 0,
      pendingAppointments: dashboardStats.today_appointments,
      totalRevenue: dashboardStats.this_month_revenue,
    };
  }, [dashboardStats]);

  // Derive formatted appointments directly from hook data (no duplicate state)
  const upcomingAppointments = useMemo(() => {
    if (!upcomingApts) return [];
    return upcomingApts.map(apt => ({
      id: apt.id,
      patient_name: apt.patients?.full_name || 'غير محدد',
      appointment_date: apt.appointment_date,
      treatment_type: apt.treatment_type || 'فحص عام',
    }));
  }, [upcomingApts]);

  // ─── Online/Offline listener ───
  useEffect(() => {
    const on = () => setIsOnline(true);
    const off = () => setIsOnline(false);
    window.addEventListener('online', on);
    window.addEventListener('offline', off);
    return () => { window.removeEventListener('online', on); window.removeEventListener('offline', off); };
  }, []);

  // ─── Zoom (CSS transform for cross-browser compat) ───
  const handleZoomIn = useCallback(() => {
    setZoomLevel(prev => {
      const next = Math.min(prev + 10, 200);
      document.documentElement.style.setProperty('zoom', `${next}%`);
      return next;
    });
  }, []);

  const handleZoomOut = useCallback(() => {
    setZoomLevel(prev => {
      const next = Math.max(prev - 10, 50);
      document.documentElement.style.setProperty('zoom', `${next}%`);
      return next;
    });
  }, []);

  const handleZoomReset = useCallback(() => {
    setZoomLevel(100);
    document.documentElement.style.setProperty('zoom', '100%');
  }, []);

  const getZoomText = () => {
    if (zoomLevel < 90) return "صغير";
    if (zoomLevel > 110) return "كبير";
    return "عادي";
  };

  // ─── Refresh via React Query invalidation (no full page reload) ───
  const handleRefresh = useCallback(() => {
    queryClient.invalidateQueries();
  }, [queryClient]);

  // ─── Search with sanitized input ───
  const performGlobalSearch = useCallback(async (query: string) => {
    if (!query.trim() || query.length < 2) {
      setSearchResults([]);
      return;
    }

    setIsSearching(true);

    try {
      const results: SearchResult[] = [];
      const safe = sanitizeSearchTerm(query.toLowerCase());

      // Search patients
      const { data: patients } = await supabase
        .from('patients')
        .select('id, full_name, phone, email')
        .or(`full_name.ilike.%${safe}%, phone.ilike.%${safe}%, email.ilike.%${safe}%`)
        .limit(10);

      patients?.forEach(patient => {
        results.push({
          id: patient.id, type: 'patient',
          title: patient.full_name, subtitle: patient.phone, description: patient.email,
          url: `/patients/${patient.id}`, icon: '👤',
        });
      });

      // Search appointments
      const { data: appointments } = await supabase
        .from('appointments')
        .select('id, appointment_date, treatment_type, status, patients!inner(full_name, phone)')
        .or(`treatment_type.ilike.%${safe}%, patients.full_name.ilike.%${safe}%`)
        .limit(10);

      appointments?.forEach(appointment => {
        results.push({
          id: appointment.id, type: 'appointment',
          title: `موعد - ${(appointment.patients as { full_name: string })?.full_name}`,
          subtitle: appointment.treatment_type,
          description: `📅 ${format(new Date(appointment.appointment_date), 'PP', { locale: ar })}`,
          url: `/appointments/${appointment.id}`, icon: '📅',
        });
      });

      // Search invoices
      const { data: invoices } = await supabase
        .from('invoices')
        .select('id, invoice_number, total_amount, status, patients!inner(full_name)')
        .or(`invoice_number.ilike.%${safe}%, patients.full_name.ilike.%${safe}%`)
        .limit(10);

      invoices?.forEach(invoice => {
        const patientName = (invoice.patients as { full_name?: string })?.full_name || 'مريض';
        results.push({
          id: invoice.id, type: 'invoice',
          title: `فاتورة #${invoice.invoice_number}`,
          subtitle: patientName,
          description: `💰 ${invoice.total_amount} ريال`,
          url: `/invoice-management?invoice=${invoice.id}`, icon: '🧾',
        });
      });

      // Search doctors / staff
      const { data: doctors } = await supabase
        .from('profiles')
        .select('user_id, full_name, role')
        .ilike('full_name', `%${safe}%`)
        .in('role', ['doctor', 'nurse', 'secretary', 'receptionist'])
        .limit(10);

      doctors?.forEach(doc => {
        results.push({
          id: doc.user_id, type: 'user',
          title: doc.full_name || 'بدون اسم',
          subtitle: ROLE_LABELS[doc.role] || doc.role,
          url: `/profile/${doc.user_id}`, icon: '👨‍⚕️',
        });
      });

      setSearchResults(results);
    } catch (error) {
      console.error('خطأ في البحث:', error);
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  }, []);

  // Debounced search
  useEffect(() => {
    if (!searchQuery || !isSearchDialogOpen) return;
    const timer = setTimeout(() => performGlobalSearch(searchQuery), 300);
    return () => clearTimeout(timer);
  }, [searchQuery, isSearchDialogOpen, performGlobalSearch]);

  // Keyboard shortcuts: Ctrl+K
  useEffect(() => {
    const handleKeydown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setIsSearchDialogOpen(true);
      }
    };
    document.addEventListener('keydown', handleKeydown);
    return () => document.removeEventListener('keydown', handleKeydown);
  }, []);

  const handleLogout = async () => { await signOut(); };

  const formatAppointmentTime = (dateTimeString: string) => {
    try {
      return format(new Date(dateTimeString), language === 'ar' ? 'dd/MM/yyyy - HH:mm' : 'MM/dd/yyyy - HH:mm', {
        locale: language === 'ar' ? ar : undefined,
      });
    } catch { return dateTimeString; }
  };

  const getCurrentRoleDisplay = useCallback(() => {
    if (import.meta.env.DEV) {
      const overrideRole = localStorage.getItem('dev_override_role');
      if (overrideRole) return `${ROLE_LABELS[overrideRole] || 'غير محدد'} (تطوير)`;
    }
    const primaryRole = getPrimaryRole();
    const roleName = primaryRole?.role_name || userProfile?.role || 'مستخدم';
    return ROLE_LABELS[roleName] || roleName;
  }, [getPrimaryRole, userProfile?.role]);

  const handleRoleChange = useCallback((newRole: string) => {
    localStorage.setItem('dev_override_role', newRole);
    setTimeout(() => window.location.reload(), 500);
  }, []);

  const handleRoleReset = useCallback(() => {
    localStorage.removeItem('dev_override_role');
    setTimeout(() => window.location.reload(), 500);
  }, []);

  // ─── Type label helper for search results ───
  const getTypeLabel = (type: string) => {
    const map: Record<string, string> = {
      patient: 'مريض', appointment: 'موعد', invoice: 'فاتورة',
      user: 'موظف', treatment: 'علاج', medication: 'دواء',
    };
    return map[type] || type;
  };

  return (
    <>
      <div className="w-full h-14 px-3 sm:px-4 lg:px-6">
        <div className="h-full bg-white/80 dark:bg-slate-900/90
                       border-b border-slate-200 dark:border-slate-700
                       shadow-sm backdrop-blur-sm">
          <div className="h-full flex items-center justify-between gap-2">

            {/* ── Left Section ── */}
            <div className="flex items-center gap-2 min-w-0">
              <Clock language={language} />

              {/* Upcoming Appointments */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant={upcomingAppointments.length > 0 ? "default" : "outline"}
                    size="sm"
                    className={`relative gap-1.5 hidden sm:flex
                      ${upcomingAppointments.length > 0
                        ? 'bg-red-500 hover:bg-red-600 text-white'
                        : ''
                      }`}
                  >
                    <Bell className="h-4 w-4" />
                    <span className="text-sm font-medium">
                      {upcomingAppointments.length > 0
                        ? `${upcomingAppointments.length} موعد قادم`
                        : "لا مواعيد"}
                    </span>
                    {upcomingAppointments.length > 0 && (
                      <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-yellow-400 rounded-full" />
                    )}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-80">
                  <div className="flex items-center justify-between p-3 border-b">
                    <h3 className="text-sm font-bold">المواعيد القريبة (24 ساعة)</h3>
                    <Badge variant="secondary">{upcomingAppointments.length}</Badge>
                  </div>
                  {upcomingAppointments.length === 0 ? (
                    <div className="flex justify-center py-6">
                      <span className="text-sm text-muted-foreground">✅ لا توجد مواعيد قريبة</span>
                    </div>
                  ) : (
                    <>
                      {upcomingAppointments.slice(0, 5).map((apt) => (
                        <DropdownMenuItem key={apt.id} className="flex flex-col items-start py-3">
                          <div className="text-sm font-semibold">{apt.patient_name}</div>
                          <div className="text-sm text-muted-foreground">{apt.treatment_type}</div>
                          <div className="text-xs text-muted-foreground">
                            ⏰ {formatAppointmentTime(apt.appointment_date)}
                          </div>
                        </DropdownMenuItem>
                      ))}
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={() => navigate('/appointments')} className="justify-center text-primary font-medium">
                        عرض جميع المواعيد
                      </DropdownMenuItem>
                    </>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>

              {/* Today Stats */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-1.5 hidden md:flex border-green-200 dark:border-green-800"
                  >
                    <BarChart3 className="h-4 w-4 text-green-600 dark:text-green-400" />
                    <span className="text-sm font-semibold text-green-700 dark:text-green-300">
                      {todayStats?.totalAppointments || 0} مواعيد
                    </span>
                    <Badge variant="secondary" className="text-xs">
                      {todayStats?.completedAppointments || 0} مكتمل
                    </Badge>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-72">
                  <div className="p-4 space-y-4">
                    <h3 className="text-sm font-bold text-center border-b pb-3">📊 إحصائيات اليوم</h3>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="bg-blue-50 dark:bg-blue-950 rounded-xl p-3 text-center">
                        <div className="text-xl font-bold text-blue-600 dark:text-blue-400">{todayStats?.totalAppointments || 0}</div>
                        <div className="text-xs text-blue-500 dark:text-blue-300">إجمالي المواعيد</div>
                      </div>
                      <div className="bg-green-50 dark:bg-green-950 rounded-xl p-3 text-center">
                        <div className="text-xl font-bold text-green-600 dark:text-green-400">{todayStats?.completedAppointments || 0}</div>
                        <div className="text-xs text-green-500 dark:text-green-300">مكتملة</div>
                      </div>
                      <div className="bg-orange-50 dark:bg-orange-950 rounded-xl p-3 text-center">
                        <div className="text-xl font-bold text-orange-600 dark:text-orange-400">{todayStats?.pendingAppointments || 0}</div>
                        <div className="text-xs text-orange-500 dark:text-orange-300">في الانتظار</div>
                      </div>
                      <div className="bg-red-50 dark:bg-red-950 rounded-xl p-3 text-center">
                        <div className="text-xl font-bold text-red-600 dark:text-red-400">{todayStats?.cancelledAppointments || 0}</div>
                        <div className="text-xs text-red-500 dark:text-red-300">ملغية</div>
                      </div>
                      <div className="bg-purple-50 dark:bg-purple-950 rounded-xl p-3 text-center col-span-2">
                        <div className="text-xl font-bold text-purple-600 dark:text-purple-400">{todayStats?.totalRevenue || 0}</div>
                        <div className="text-xs text-purple-500 dark:text-purple-300">ر.س الإيرادات</div>
                      </div>
                    </div>
                  </div>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            {/* ── Middle Section ── */}
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsSearchDialogOpen(true)}
                className="gap-2 h-9 px-3"
              >
                <Search className="h-4 w-4" />
                <span className="text-sm hidden sm:inline">بحث شامل</span>
                <kbd className="hidden lg:inline text-[10px] bg-muted px-1.5 py-0.5 rounded font-mono">Ctrl+K</kbd>
              </Button>

              <div className="hidden sm:flex items-center gap-1 bg-muted/50 rounded-lg p-1">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => navigate('/appointments/new')}
                  className="gap-1.5 h-7 px-2.5 text-xs"
                >
                  <Plus className="h-3.5 w-3.5" />
                  <span className="hidden md:inline">موعد</span>
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => navigate('/patients')}
                  className="gap-1.5 h-7 px-2.5 text-xs"
                >
                  <UserPlus className="h-3.5 w-3.5" />
                  <span className="hidden md:inline">مريض</span>
                </Button>
              </div>
            </div>

            {/* ── Right Section ── */}
            <div className="flex items-center gap-1.5">
              {/* Connection + Refresh */}
              <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg border border-slate-200 dark:border-slate-700">
                {isOnline ? (
                  <div className="w-2 h-2 bg-green-500 rounded-full" title="متصل" />
                ) : (
                  <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" title="غير متصل" />
                )}
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleRefresh}
                  className="h-6 w-6"
                  title="تحديث البيانات"
                  aria-label="تحديث البيانات"
                >
                  <RotateCcw className="h-3 w-3" />
                </Button>
              </div>

              <ClinicSwitcher />

              {/* Developer Role Switcher — ONLY in dev mode */}
              {import.meta.env.DEV && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className={`h-8 w-8 ${localStorage.getItem('dev_override_role') ? 'bg-yellow-100 dark:bg-yellow-900' : ''}`}
                      title={`تبديل الصلاحيات (حالياً: ${getCurrentRoleDisplay()})`}
                      aria-label={`تبديل الصلاحيات (حالياً: ${getCurrentRoleDisplay()})`}
                    >
                      <Shield className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56">
                    <div className="p-2 text-xs text-muted-foreground border-b">
                      🛠️ الصلاحية الحالية: {getCurrentRoleDisplay()}
                    </div>
                    {Object.entries(ROLE_LABELS).map(([key, label]) => (
                      <DropdownMenuItem key={key} onClick={() => handleRoleChange(key)}>
                        {label}
                      </DropdownMenuItem>
                    ))}
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleRoleReset} className="text-red-600">
                      🔄 إعادة للصلاحية الأصلية
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}

              {/* User Profile */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    className="flex items-center gap-2 px-2 h-9"
                  >
                    <Avatar className="h-7 w-7">
                      <AvatarFallback className="text-xs font-bold">
                        {userProfile?.full_name?.charAt(0) || 'د'}
                      </AvatarFallback>
                    </Avatar>
                    <div className="hidden lg:flex flex-col items-start">
                      <span className="text-sm font-bold leading-tight">
                        {userProfile?.full_name?.split(' ')[0] || 'مستخدم'}
                      </span>
                      <span className="text-[10px] text-muted-foreground leading-tight">
                        {getCurrentRoleDisplay()}
                      </span>
                    </div>
                    <ChevronDown className="h-3 w-3" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <div className="flex flex-col p-3 gap-1">
                    <div className="font-bold text-sm">
                      {userProfile?.full_name || 'مستخدم'}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {getCurrentRoleDisplay()} • {user?.email}
                    </div>
                  </div>
                  <DropdownMenuSeparator />

                  {/* Font Size Control */}
                  <div className="p-3">
                    <div className="text-xs text-muted-foreground mb-2">حجم الخط</div>
                    <div className="flex items-center justify-between">
                      <Button variant="ghost" size="icon" onClick={handleZoomOut} className="h-7 w-7" aria-label="تصغير حجم الخط">
                        <Minus className="h-3 w-3" />
                      </Button>
                      <span className="text-xs">{getZoomText()}</span>
                      <Button variant="ghost" size="icon" onClick={handleZoomIn} className="h-7 w-7" aria-label="تكبير حجم الخط">
                        <Plus className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                  <DropdownMenuSeparator />

                  <DropdownMenuItem onClick={() => setTheme(theme === "dark" ? "light" : "dark")}>
                    {theme === "dark" ? "☀️" : "🌙"}
                    <span className="ml-2">{theme === "dark" ? "الوضع النهاري" : "الوضع الليلي"}</span>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />

                  <DropdownMenuItem onClick={() => navigate('/profile')}>
                    👤 الملف الشخصي
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate('/settings')}>
                    ⚙️ الإعدادات
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem className="text-red-600" onClick={handleLogout}>
                    🚪 تسجيل الخروج
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>
      </div>

      {/* ── Search Dialog ── */}
      <Dialog open={isSearchDialogOpen} onOpenChange={setIsSearchDialogOpen}>
        <DialogContent className="max-w-4xl h-[80vh] p-0 gap-0">
          <DialogHeader className="px-6 py-4 border-b">
            <div className="flex items-center justify-between">
              <DialogTitle className="text-xl font-bold">🔍 بحث شامل</DialogTitle>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsSearchDialogOpen(false)}
                className="h-8 w-8"
                aria-label="إغلاق نافذة البحث"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            <div className="relative mt-4">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input
                placeholder="ابحث عن مرضى، مواعيد، أطباء، فواتير..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-12 pr-4 h-12 text-lg"
                autoFocus
              />
              {searchQuery && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 h-8 w-8"
                  aria-label="مسح البحث"
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>

            <div className="flex items-center gap-4 mt-3 text-sm text-muted-foreground">
              <span>💡 نصائح:</span>
              <Badge variant="outline" className="text-xs">اسم المريض</Badge>
              <Badge variant="outline" className="text-xs">رقم الهاتف</Badge>
              <Badge variant="outline" className="text-xs">اسم الطبيب</Badge>
              <Badge variant="outline" className="text-xs">رقم الفاتورة</Badge>
            </div>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto p-6">
            {isSearching ? (
              <div className="flex flex-col items-center justify-center h-32">
                <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mb-4" />
                <span className="text-lg text-muted-foreground">🔍 جاري البحث...</span>
              </div>
            ) : searchQuery.length === 0 ? (
              <div className="text-center py-12">
                <Search className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-xl font-semibold mb-2">ابدأ بكتابة ما تبحث عنه</h3>
                <p className="text-muted-foreground">يمكنك البحث في جميع بيانات النظام</p>
              </div>
            ) : searchResults.length === 0 ? (
              <div className="text-center py-12">
                <AlertCircle className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-xl font-semibold mb-2">لم يتم العثور على نتائج</h3>
                <p className="text-muted-foreground">جرب كلمات مختلفة</p>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-semibold">📊 نتائج البحث</h3>
                  <Badge variant="secondary">{searchResults.length} نتيجة</Badge>
                </div>

                <div className="grid gap-3">
                  {searchResults.map((result) => (
                    <div
                      key={`${result.type}-${result.id}`}
                      className="p-4 border rounded-lg hover:bg-accent cursor-pointer transition-colors"
                      onClick={() => {
                        navigate(result.url);
                        setIsSearchDialogOpen(false);
                      }}
                    >
                      <div className="flex items-start gap-4">
                        <div className="text-3xl">{result.icon}</div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="font-semibold">{result.title}</h4>
                            <Badge variant="outline" className="text-xs">
                              {getTypeLabel(result.type)}
                            </Badge>
                          </div>
                          {result.subtitle && (
                            <p className="text-sm text-muted-foreground">{result.subtitle}</p>
                          )}
                          {result.description && (
                            <p className="text-xs text-muted-foreground">{result.description}</p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

export default TopNavbar;
