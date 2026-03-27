import { PageContainer } from "@/components/layout/PageContainer";
import { PageSkeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  Calendar, DollarSign, Stethoscope,
  Settings, BarChart3, Users, 
  Pill, Receipt, Bell,
  UserCheck, ClipboardList, Box, TrendingUp,
  Globe, Share2, MessageCircle, Smartphone,
  ArrowUpRight, AlertTriangle, FileText,
  ChevronLeft, Sparkles, AlertCircle
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useMemo } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import styles from "./Index.module.css";
import { useQuery } from "@tanstack/react-query";
import { TodayAppointmentsWidget } from "@/components/dashboard/TodayAppointmentsWidget";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { useSettings } from "@/hooks/useSettingsHook";

// ─── Stat items config ─────────────────────────────────────────
const statItems = [
  { key: "active_patients", label: "مرضى نشطون", icon: Users, color: "text-blue-600 dark:text-blue-400", bgColor: "bg-blue-500/10", borderColor: "border-blue-500/20", route: "/patients" },
  { key: "today_appointments", label: "مواعيد اليوم", icon: Calendar, color: "text-violet-600 dark:text-violet-400", bgColor: "bg-violet-500/10", borderColor: "border-violet-500/20", route: "/appointments" },
  { key: "this_month_revenue", label: "إيرادات الشهر", icon: TrendingUp, color: "text-emerald-600 dark:text-emerald-400", bgColor: "bg-emerald-500/10", borderColor: "border-emerald-500/20", route: "/financial-overview", format: true },
  { key: "pending_invoices", label: "فواتير معلقة", icon: Receipt, color: "text-amber-600 dark:text-amber-400", bgColor: "bg-amber-500/10", borderColor: "border-amber-500/20", route: "/invoice-management" },
  { key: "total_debt", label: "ديون مستحقة", icon: DollarSign, color: "text-rose-600 dark:text-rose-400", bgColor: "bg-rose-500/10", borderColor: "border-rose-500/20", route: "/financial-overview", format: true },
  { key: "low_stock_items", label: "مخزون منخفض", icon: AlertTriangle, color: "text-orange-600 dark:text-orange-400", bgColor: "bg-orange-500/10", borderColor: "border-orange-500/20", route: "/inventory" },
];

// ─── Grouped navigation cards ──────────────────────────────────
interface NavCard {
  id: string;
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  bgColor: string;
  route: string;
  badgeKey?: string;
}

interface CardGroup {
  id: string;
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  cards: NavCard[];
}

const cardGroups: CardGroup[] = [
  {
    id: "patients",
    title: "إدارة المرضى",
    icon: Users,
    cards: [
      { id: "patients-list", title: "قائمة المرضى", description: "عرض وإدارة جميع المرضى", icon: Users, color: "text-blue-600", bgColor: "bg-blue-500/10", route: "/patients", badgeKey: "active_patients" },
      { id: "appointments", title: "المواعيد", description: "عرض وإدارة المواعيد", icon: Calendar, color: "text-violet-600", bgColor: "bg-violet-500/10", route: "/appointments", badgeKey: "today_appointments" },
      { id: "new-appointment", title: "حجز موعد جديد", description: "حجز موعد جديد للمريض", icon: Calendar, color: "text-emerald-600", bgColor: "bg-emerald-500/10", route: "/appointments/new" },
      { id: "medical-records", title: "السجلات الطبية", description: "إدارة السجلات الطبية", icon: FileText, color: "text-purple-600", bgColor: "bg-purple-500/10", route: "/dental-treatments-management" },
      { id: "dental-treatments", title: "العلاجات السنية", description: "إدارة العلاجات والإجراءات", icon: Stethoscope, color: "text-rose-600", bgColor: "bg-rose-500/10", route: "/dental-treatments-management" },
      { id: "prescriptions", title: "الوصفات الطبية", description: "إنشاء وإدارة الوصفات", icon: ClipboardList, color: "text-teal-600", bgColor: "bg-teal-500/10", route: "/prescriptions" },
    ],
  },
  {
    id: "financial",
    title: "المالية",
    icon: DollarSign,
    cards: [
      { id: "invoices", title: "الفواتير", description: "إدارة الفواتير والمدفوعات", icon: Receipt, color: "text-amber-600", bgColor: "bg-amber-500/10", route: "/invoice-management", badgeKey: "pending_invoices" },
      { id: "financial-overview", title: "النظرة المالية", description: "ملخص الإيرادات والمصروفات", icon: TrendingUp, color: "text-emerald-600", bgColor: "bg-emerald-500/10", route: "/financial-overview" },
    ],
  },
  {
    id: "inventory",
    title: "المخزون والأدوية",
    icon: Box,
    cards: [
      { id: "inventory", title: "المخزون", description: "إدارة المخزون والإمدادات", icon: Box, color: "text-orange-600", bgColor: "bg-orange-500/10", route: "/inventory", badgeKey: "low_stock_items" },
      { id: "medications", title: "الأدوية", description: "إدارة قاعدة بيانات الأدوية", icon: Pill, color: "text-pink-600", bgColor: "bg-pink-500/10", route: "/medications" },
    ],
  },
  {
    id: "admin",
    title: "الإدارة والنظام",
    icon: Settings,
    cards: [
      { id: "doctors", title: "إدارة الأطباء", description: "إدارة بيانات الأطباء", icon: UserCheck, color: "text-blue-600", bgColor: "bg-blue-500/10", route: "/doctors" },
      { id: "reports", title: "التقارير", description: "تقارير شاملة وإحصائيات", icon: BarChart3, color: "text-teal-600", bgColor: "bg-teal-500/10", route: "/detailed-reports" },
      { id: "notifications", title: "الإشعارات", description: "إدارة الإشعارات والتنبيهات", icon: Bell, color: "text-amber-600", bgColor: "bg-amber-500/10", route: "/advanced-notification-management" },
      { id: "users", title: "إدارة المستخدمين", description: "إدارة المستخدمين والصلاحيات", icon: Users, color: "text-slate-600", bgColor: "bg-slate-500/10", route: "/advanced-user-management" },
      { id: "settings", title: "الإعدادات", description: "إعدادات النظام والتكوين", icon: Settings, color: "text-gray-600", bgColor: "bg-gray-500/10", route: "/settings" },
      { id: "public-booking", title: "رابط الحجز العام", description: "رابط مباشر للحجز عبر الإنترنت", icon: Globe, color: "text-lime-600", bgColor: "bg-lime-500/10", route: "/book" },
    ],
  },
];

// ─── Greeting helper ───────────────────────────────────────────
function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "صباح الخير";
  if (hour < 17) return "مساء الخير";
  return "مساء النور";
}

// ─── Alert generation from stats ───────────────────────────────
interface DashboardAlert {
  id: string;
  message: string;
  severity: "warning" | "danger" | "info";
  route: string;
}

function getAlerts(stats: Record<string, number> | null | undefined): DashboardAlert[] {
  if (!stats) return [];
  const alerts: DashboardAlert[] = [];
  if (stats.pending_invoices > 0) {
    alerts.push({
      id: "pending-invoices",
      message: `لديك ${stats.pending_invoices} فاتورة معلقة تحتاج اهتمامك`,
      severity: stats.pending_invoices > 5 ? "danger" : "warning",
      route: "/invoice-management",
    });
  }
  if (stats.low_stock_items > 0) {
    alerts.push({
      id: "low-stock",
      message: `${stats.low_stock_items} عنصر في المخزون على وشك النفاد`,
      severity: "warning",
      route: "/inventory",
    });
  }
  if (stats.total_debt > 0) {
    alerts.push({
      id: "debt",
      message: `ديون مستحقة بقيمة ${stats.total_debt.toLocaleString()}`,
      severity: stats.total_debt > 10000 ? "danger" : "info",
      route: "/financial-overview",
    });
  }
  return alerts;
}

// ─── Stat Skeleton ─────────────────────────────────────────────
function StatCardSkeleton() {
  return (
    <Card className="border-border/30">
      <CardContent className="p-4">
        <div className="flex items-center gap-3 mb-3">
          <Skeleton className="h-10 w-10 rounded-xl" />
          <Skeleton className="h-3 w-3 rounded-full mr-auto" />
        </div>
        <Skeleton className="h-7 w-16 mb-2" />
        <Skeleton className="h-3 w-20" />
      </CardContent>
    </Card>
  );
}

// ─── Main Dashboard ────────────────────────────────────────────
function Index() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  const { navFontSize } = useSettings();

  const { data: stats, isLoading: loading, isError } = useQuery({
    queryKey: ['dashboard-stats', user?.id],
    queryFn: async () => {
      if (!user) return null;
      const { data: profile } = await supabase.from('profiles').select('id').eq('user_id', user.id).maybeSingle();
      if (!profile) return null;
      const { data, error } = await supabase.rpc('get_dashboard_stats_optimized', { clinic_id_param: profile.id });
      if (error) throw error;
      return data as Record<string, number>;
    },
    enabled: !!user,
    staleTime: 60_000,
  });

  const { data: profile } = useQuery({
    queryKey: ['user-profile-name', user?.id],
    queryFn: async () => {
      if (!user) return null;
      const { data } = await supabase.from('profiles').select('full_name').eq('user_id', user.id).maybeSingle();
      return data;
    },
    enabled: !!user,
    staleTime: 300_000,
  });

  const alerts = useMemo(() => getAlerts(stats), [stats]);
  const greeting = useMemo(() => getGreeting(), []);
  const displayName = profile?.full_name?.split(' ')[0] || '';

  const tileTitleClass = navFontSize === 'large' ? 'text-base' : navFontSize === 'small' ? 'text-xs' : 'text-sm';
  const tileDescClass = navFontSize === 'large' ? 'text-sm' : navFontSize === 'small' ? 'text-[10px]' : 'text-xs';

  const shareBookingLink = () => {
    const bookingUrl = `${window.location.origin}/book`;
    if (navigator.share) {
      navigator.share({ title: 'رابط حجز المواعيد', text: 'احجز موعدك في العيادة', url: bookingUrl }).catch(() => {
        navigator.clipboard.writeText(bookingUrl);
        toast({ title: "تم النسخ", description: "تم نسخ رابط الحجز إلى الحافظة" });
      });
    } else {
      navigator.clipboard.writeText(bookingUrl);
      toast({ title: "تم النسخ", description: "تم نسخ رابط الحجز إلى الحافظة" });
    }
  };

  const shareViaWhatsApp = () => {
    const bookingUrl = `${window.location.origin}/book`;
    window.open(`https://wa.me/?text=${encodeURIComponent(`مرحباً! 🦷\nيمكنك حجز موعدك عبر:\n${bookingUrl}`)}`, '_blank');
  };

  const shareViaSMS = () => {
    const bookingUrl = `${window.location.origin}/book`;
    window.location.href = `sms:?body=${encodeURIComponent(`احجز موعدك: ${bookingUrl}`)}`;
  };

  if (isError) {
    return (
      <PageContainer>
        <div className="flex flex-col items-center justify-center h-64 gap-4">
          <AlertCircle className="w-12 h-12 text-destructive/60" />
          <p className="text-destructive font-medium">حدث خطأ في تحميل البيانات</p>
          <Button variant="outline" onClick={() => window.location.reload()}>إعادة المحاولة</Button>
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <div className="space-y-6 md:space-y-8">
        
        {/* ── Greeting section ─────────────────────────────── */}
        <motion.div 
          className="flex flex-col gap-1"
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
        >
          <h1 className="text-xl md:text-2xl font-bold text-foreground">
            {greeting}{displayName ? `، ${displayName}` : ''} 👋
          </h1>
          <p className="text-sm text-muted-foreground">
            إليك ملخص اليوم لعيادتك
          </p>
        </motion.div>

        {/* ── Smart Alerts ─────────────────────────────────── */}
        {alerts.length > 0 && (
          <motion.div 
            className="space-y-2"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.15 }}
          >
            {alerts.map((alert) => (
              <div
                key={alert.id}
                onClick={() => navigate(alert.route)}
                className={cn(
                  "flex items-center gap-3 px-4 py-3 rounded-xl cursor-pointer transition-all duration-200 hover:shadow-sm border",
                  alert.severity === "danger" && "bg-rose-50 dark:bg-rose-500/10 border-rose-200 dark:border-rose-500/20 text-rose-700 dark:text-rose-300",
                  alert.severity === "warning" && "bg-amber-50 dark:bg-amber-500/10 border-amber-200 dark:border-amber-500/20 text-amber-700 dark:text-amber-300",
                  alert.severity === "info" && "bg-blue-50 dark:bg-blue-500/10 border-blue-200 dark:border-blue-500/20 text-blue-700 dark:text-blue-300",
                )}
              >
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span className="text-sm font-medium flex-1">{alert.message}</span>
                <ChevronLeft className="w-4 h-4 shrink-0 opacity-60" />
              </div>
            ))}
          </motion.div>
        )}

        {/* ── Stats Section ────────────────────────────────── */}
        <div className={styles.statsGrid}>
          {loading
            ? statItems.map((item) => <StatCardSkeleton key={item.key} />)
            : statItems.map((item, i) => {
                const value = stats?.[item.key] ?? 0;
                return (
                  <motion.div
                    key={item.key}
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.35, delay: 0.05 * i }}
                  >
                    <Card
                      className={cn(
                        "cursor-pointer border hover:shadow-lg transition-all duration-300 overflow-hidden group",
                        item.borderColor,
                        "hover:scale-[1.02]"
                      )}
                      onClick={() => navigate(item.route)}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-center gap-3 mb-3">
                          <div className={cn("p-2.5 rounded-xl", item.bgColor)}>
                            <item.icon className={cn("w-4 h-4", item.color)} />
                          </div>
                          <ArrowUpRight className="w-3.5 h-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity mr-auto" />
                        </div>
                        <p className="text-2xl md:text-3xl font-bold text-foreground leading-none mb-1.5 tabular-nums">
                          {item.format ? value?.toLocaleString() : value}
                        </p>
                        <p className="text-xs text-muted-foreground font-medium">{item.label}</p>
                      </CardContent>
                    </Card>
                  </motion.div>
                );
              })
          }
        </div>

        {/* ── Two-column: Appointments + Booking share ─────── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">
          <div className="lg:col-span-2">
            <TodayAppointmentsWidget />
          </div>
          
          {/* Booking Share Card */}
          <Card className="border-border/40 overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent pointer-events-none" />
            <CardHeader className="pb-3 relative">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <div className="p-2 rounded-xl bg-primary/10">
                  <Globe className="w-4 h-4 text-primary" />
                </div>
                رابط الحجز العام
              </CardTitle>
            </CardHeader>
            <CardContent className="relative space-y-3 pt-0">
              <p className="text-xs text-muted-foreground leading-relaxed">
                شارك رابط الحجز مع مرضاك ليتمكنوا من حجز مواعيدهم مباشرة عبر الإنترنت
              </p>
              <div className="flex flex-col gap-2">
                <Button variant="default" size="sm" className="w-full gap-2" onClick={shareBookingLink}>
                  <Share2 className="w-3.5 h-3.5" />
                  نسخ الرابط
                </Button>
                <div className="grid grid-cols-2 gap-2">
                  <Button variant="outline" size="sm" className="gap-2 text-green-600 border-green-200 hover:bg-green-50 dark:border-green-800 dark:hover:bg-green-500/10" onClick={shareViaWhatsApp}>
                    <MessageCircle className="w-3.5 h-3.5" />
                    واتساب
                  </Button>
                  <Button variant="outline" size="sm" className="gap-2 text-orange-600 border-orange-200 hover:bg-orange-50 dark:border-orange-800 dark:hover:bg-orange-500/10" onClick={shareViaSMS}>
                    <Smartphone className="w-3.5 h-3.5" />
                    رسالة
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* ── Grouped Navigation Cards ─────────────────────── */}
        <div className="space-y-6">
          {cardGroups.map((group, gi) => (
            <motion.section
              key={group.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.1 + gi * 0.08 }}
            >
              <div className="flex items-center gap-2 mb-3">
                <group.icon className="w-4 h-4 text-muted-foreground" />
                <h2 className="text-sm font-semibold text-foreground">{group.title}</h2>
                <div className="flex-1 h-px bg-border/60 mr-2" />
              </div>
              <div className={styles.groupGrid}>
                {group.cards.map((card) => {
                  const badgeValue = card.badgeKey && stats ? stats[card.badgeKey] : undefined;
                  const isBooking = card.id === 'public-booking';
                  return (
                    <Card
                      key={card.id}
                      onClick={() => navigate(card.route)}
                      className={cn(
                        "cursor-pointer border-border/40 hover:border-border/80 hover:shadow-md transition-all duration-200 group overflow-hidden",
                        "active:scale-[0.98] aspect-square"
                      )}
                    >
                      <CardContent className="p-3 md:p-4 h-full flex flex-col items-center justify-center text-center gap-2 relative">
                        {badgeValue !== undefined && badgeValue > 0 && (
                          <Badge variant="secondary" className="absolute top-2 left-2 text-[10px] px-1.5 py-0 h-5">
                            {badgeValue}
                          </Badge>
                        )}
                        <div className={cn("p-2.5 rounded-xl", card.bgColor)}>
                          <card.icon className={cn("w-5 h-5", card.color)} />
                        </div>
                        <p className={cn("font-semibold text-foreground leading-tight", tileTitleClass)}>{card.title}</p>
                        <p className={cn("text-muted-foreground leading-tight line-clamp-2 hidden sm:block", tileDescClass)}>{card.description}</p>
                        <ArrowUpRight className="w-3.5 h-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity absolute top-2 right-2" />
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </motion.section>
          ))}
        </div>

      </div>
    </PageContainer>
  );
}

export default Index;
