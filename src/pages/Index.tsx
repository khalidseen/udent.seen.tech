import { PageContainer } from "@/components/layout/PageContainer";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { 
  UserPlus, Calendar, FileText, DollarSign, Package, Stethoscope,
  Brain, Settings, BarChart3, Users, Activity, Edit, Save, X,
  GripVertical, Link as LinkIcon, Pill, Receipt, Bell, Shield,
  Crown, CreditCard, UserCheck, ClipboardList, Box, TrendingUp,
  Boxes, ShoppingCart, Archive, Calendar as CalendarIcon,
  FileTextIcon, Globe, Share2, Copy, MessageCircle, Smartphone,
  ArrowUpRight, AlertTriangle
} from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useSettings } from "@/hooks/useSettingsHook";
import styles from "./Index.module.css";
import { validateDashboardCards } from "@/utils/dashboardValidation";
import { TodayAppointmentsWidget } from "@/components/dashboard/TodayAppointmentsWidget";
import { cn } from "@/lib/utils";

interface ActionCard {
  id: string;
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  gradient: string;
  route: string;
  order_index?: number;
}

const defaultCards: ActionCard[] = [
  { id: "patients-list", title: "قائمة المرضى", description: "عرض وإدارة جميع المرضى", icon: Users, color: "text-emerald-600", gradient: "from-emerald-500/10 to-emerald-500/5", route: "/patients", order_index: 1 },
  { id: "appointments", title: "المواعيد", description: "عرض وإدارة مواعيد المرضى", icon: Calendar, color: "text-blue-600", gradient: "from-blue-500/10 to-blue-500/5", route: "/appointments", order_index: 2 },
  { id: "new-appointment", title: "حجز موعد جديد", description: "حجز موعد جديد للمريض", icon: CalendarIcon, color: "text-green-600", gradient: "from-green-500/10 to-green-500/5", route: "/appointments/new", order_index: 3 },
  { id: "public-booking", title: "رابط الحجز العام", description: "رابط مباشر للحجز عبر الإنترنت", icon: Globe, color: "text-lime-600", gradient: "from-lime-500/10 to-lime-500/5", route: "/book", order_index: 4 },
  { id: "medical-records", title: "السجلات الطبية", description: "إدارة السجلات الطبية للمرضى", icon: FileText, color: "text-purple-600", gradient: "from-purple-500/10 to-purple-500/5", route: "/advanced-medical-records", order_index: 5 },
  { id: "dental-treatments", title: "العلاجات السنية", description: "إدارة العلاجات والإجراءات السنية", icon: Stethoscope, color: "text-red-600", gradient: "from-red-500/10 to-red-500/5", route: "/dental-treatments-management", order_index: 6 },
  { id: "invoices", title: "الفواتير", description: "إدارة الفواتير والمدفوعات", icon: Receipt, color: "text-yellow-600", gradient: "from-yellow-500/10 to-yellow-500/5", route: "/invoice-management", order_index: 7 },
  { id: "inventory", title: "المخزون", description: "إدارة المخزون والإمدادات", icon: Box, color: "text-orange-600", gradient: "from-orange-500/10 to-orange-500/5", route: "/inventory", order_index: 8 },
  { id: "doctors", title: "إدارة الأطباء", description: "إدارة بيانات الأطباء", icon: UserCheck, color: "text-blue-700", gradient: "from-blue-600/10 to-blue-600/5", route: "/doctors", order_index: 9 },
  { id: "ai-insights", title: "التحليل الذكي", description: "تحليل ذكي بالذكاء الاصطناعي", icon: Brain, color: "text-indigo-600", gradient: "from-indigo-500/10 to-indigo-500/5", route: "/ai-insights-page", order_index: 10 },
  { id: "medications", title: "الأدوية", description: "إدارة قاعدة بيانات الأدوية", icon: Pill, color: "text-rose-600", gradient: "from-rose-500/10 to-rose-500/5", route: "/medications", order_index: 11 },
  { id: "prescriptions", title: "الوصفات الطبية", description: "إنشاء وإدارة الوصفات الطبية", icon: ClipboardList, color: "text-emerald-700", gradient: "from-emerald-600/10 to-emerald-600/5", route: "/prescriptions", order_index: 12 },
  { id: "reports", title: "التقارير", description: "تقارير شاملة وإحصائيات", icon: BarChart3, color: "text-teal-600", gradient: "from-teal-500/10 to-teal-500/5", route: "/detailed-reports", order_index: 13 },
  { id: "notifications", title: "الإشعارات", description: "إدارة الإشعارات والتنبيهات", icon: Bell, color: "text-amber-600", gradient: "from-amber-500/10 to-amber-500/5", route: "/advanced-notification-management", order_index: 14 },
  { id: "users", title: "إدارة المستخدمين", description: "إدارة المستخدمين والصلاحيات", icon: Users, color: "text-slate-600", gradient: "from-slate-500/10 to-slate-500/5", route: "/advanced-user-management", order_index: 15 },
  { id: "settings", title: "الإعدادات", description: "إعدادات النظام والتكوين", icon: Settings, color: "text-gray-600", gradient: "from-gray-500/10 to-gray-500/5", route: "/settings", order_index: 16 },
];

const statItems = [
  { key: "active_patients", label: "مرضى نشطون", icon: Users, color: "text-primary", bgColor: "bg-primary/10", route: "/patients" },
  { key: "today_appointments", label: "مواعيد اليوم", icon: Calendar, color: "text-blue-600", bgColor: "bg-blue-500/10", route: "/appointments" },
  { key: "this_month_revenue", label: "إيرادات الشهر", icon: TrendingUp, color: "text-green-600", bgColor: "bg-green-500/10", route: "/financial-overview", format: true },
  { key: "pending_invoices", label: "فواتير معلقة", icon: Receipt, color: "text-yellow-600", bgColor: "bg-yellow-500/10", route: "/invoice-management" },
  { key: "total_debt", label: "ديون مستحقة", icon: DollarSign, color: "text-red-600", bgColor: "bg-red-500/10", route: "/financial-overview", format: true },
  { key: "low_stock_items", label: "مخزون منخفض", icon: AlertTriangle, color: "text-orange-600", bgColor: "bg-orange-500/10", route: "/inventory" },
];

function Index() {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const { toast } = useToast();
  const settings = useSettings();
  const { user } = useAuth();
  const [actionCards, setActionCards] = useState<ActionCard[]>(defaultCards);
  const [editingCard, setEditingCard] = useState<string | null>(null);
  const [editData, setEditData] = useState({ title: "", description: "", route: "" });
  const [draggedCard, setDraggedCard] = useState<ActionCard | null>(null);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<Record<string, number> | null>(null);

  useEffect(() => {
    const fetchStats = async () => {
      if (!user) return;
      try {
        const { data: profile } = await supabase.from('profiles').select('id').eq('user_id', user.id).maybeSingle();
        if (profile) {
          const { data, error } = await supabase.rpc('get_dashboard_stats_optimized', { clinic_id_param: profile.id });
          if (!error && data) setStats(data as any);
        }
      } catch (err) {
        console.error('Failed to load dashboard stats:', err);
      }
    };
    fetchStats();
  }, [user]);

  useEffect(() => {
    setActionCards(defaultCards);
    setLoading(false);
  }, []);

  const handleDragStart = (e: React.DragEvent, card: ActionCard) => {
    setDraggedCard(card);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  };

  const handleDrop = async (e: React.DragEvent, targetCard: ActionCard) => {
    e.preventDefault();
    if (!draggedCard || draggedCard.id === targetCard.id) return;
    const draggedIndex = actionCards.findIndex(c => c.id === draggedCard.id);
    const targetIndex = actionCards.findIndex(c => c.id === targetCard.id);
    const newCards = [...actionCards];
    newCards.splice(draggedIndex, 1);
    newCards.splice(targetIndex, 0, draggedCard);
    const updatedCards = newCards.map((card, i) => ({ ...card, order_index: i + 1 }));
    setActionCards(updatedCards);
    setDraggedCard(null);
    localStorage.setItem('dashboard_cards', JSON.stringify(updatedCards));
    toast({ title: "تم الحفظ بنجاح", description: "تم حفظ ترتيب المربعات الجديد" });
  };

  const startEditing = (card: ActionCard) => {
    setEditingCard(card.id);
    setEditData({ title: card.title, description: card.description, route: card.route });
  };

  const saveEdit = () => {
    if (!editingCard) return;
    const updatedCards = actionCards.map(c => c.id === editingCard ? { ...c, title: editData.title, description: editData.description, route: editData.route } : c);
    setActionCards(updatedCards);
    localStorage.setItem('dashboard_cards', JSON.stringify(updatedCards));
    setEditingCard(null);
    setEditData({ title: "", description: "", route: "" });
    toast({ title: "تم الحفظ بنجاح", description: "تم حفظ تغييرات المربع" });
  };

  const cancelEdit = () => {
    setEditingCard(null);
    setEditData({ title: "", description: "", route: "" });
  };

  const shareBookingLink = () => {
    const bookingUrl = `${window.location.origin}/book`;
    if (navigator.share) {
      navigator.share({ title: 'رابط حجز المواعيد', text: 'احجز موعدك في العيادة', url: bookingUrl }).catch(() => copyToClipboard(bookingUrl));
    } else {
      copyToClipboard(bookingUrl);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text).then(() => {
      toast({ title: "تم النسخ", description: "تم نسخ رابط الحجز إلى الحافظة" });
    });
  };

  const shareViaWhatsApp = () => {
    const bookingUrl = `${window.location.origin}/book`;
    window.open(`https://wa.me/?text=${encodeURIComponent(`مرحباً! 🦷\nيمكنك حجز موعدك عبر:\n${bookingUrl}`)}`, '_blank');
  };

  const shareViaSMS = () => {
    const bookingUrl = `${window.location.origin}/book`;
    window.location.href = `sms:?body=${encodeURIComponent(`احجز موعدك: ${bookingUrl}`)}`;
  };

  if (loading) {
    return (
      <PageContainer>
        <div className="flex items-center justify-center h-64">
          <div className="animate-pulse text-muted-foreground">جاري تحميل البيانات...</div>
        </div>
      </PageContainer>
    );
  }

  const navigateToCard = (card: ActionCard) => {
    if (editingCard === card.id) return;
    const validation = validateDashboardCards([card as any]);
    if (validation.valid.length > 0) {
      navigate(card.route);
    } else {
      toast({ title: "رابط خاطئ", description: `الرابط ${card.route} غير متاح`, variant: "destructive" });
    }
  };

  return (
    <PageContainer>
      <div className="space-y-5 md:space-y-6">
        
        {/* Stats Section */}
        {stats && (
          <div className={styles.statsGrid}>
            {statItems.map((item) => {
              const value = stats[item.key];
              return (
                <Card
                  key={item.key}
                  className="cursor-pointer border-border/40 hover:border-border hover:shadow-md transition-all duration-200 overflow-hidden group"
                  onClick={() => navigate(item.route)}
                >
                  <CardContent className="p-3 md:p-4">
                    <div className="flex items-center gap-2.5 mb-2">
                      <div className={cn("p-1.5 md:p-2 rounded-lg", item.bgColor)}>
                        <item.icon className={cn("w-3.5 h-3.5 md:w-4 md:h-4", item.color)} />
                      </div>
                      <ArrowUpRight className="w-3 h-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity mr-auto" />
                    </div>
                    <p className="text-lg md:text-2xl font-bold text-foreground leading-none mb-1">
                      {item.format ? value?.toLocaleString() : value}
                    </p>
                    <p className="text-[10px] md:text-xs text-muted-foreground leading-tight">{item.label}</p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        {/* Today's Appointments */}
        <TodayAppointmentsWidget />

        {/* Action Cards Grid */}
        {settings.showDashboardBoxes && (
          <div className={cn(styles.dashboardGrid, `dashboard-grid-${settings.boxesPerRow}`)}>
            {actionCards.map((card) => (
              <Card
                key={card.id}
                draggable={editingCard !== card.id}
                onDragStart={(e) => handleDragStart(e, card)}
                onDragOver={handleDragOver}
                onDrop={(e) => handleDrop(e, card)}
                onClick={() => navigateToCard(card)}
                className={cn(
                  "relative overflow-hidden transition-all duration-200 group",
                  editingCard === card.id
                    ? "ring-2 ring-primary shadow-lg"
                    : "cursor-pointer hover:shadow-md hover:border-border active:scale-[0.98]",
                  draggedCard?.id === card.id && "opacity-50 rotate-1 scale-105",
                  "border-border/40"
                )}
              >
                {/* Gradient overlay */}
                <div className={cn("absolute inset-0 bg-gradient-to-br opacity-60", card.gradient)} />

                {/* Booking share buttons */}
                {card.id === 'public-booking' && editingCard !== card.id && (
                  <div className="absolute top-2 left-2 flex gap-1 z-10">
                    {[
                      { fn: shareViaWhatsApp, icon: MessageCircle, cls: "text-green-600 hover:bg-green-50" },
                      { fn: shareViaSMS, icon: Smartphone, cls: "text-orange-600 hover:bg-orange-50" },
                      { fn: shareBookingLink, icon: Share2, cls: "text-blue-600 hover:bg-blue-50" },
                    ].map((action, i) => (
                      <Button key={i} variant="ghost" size="sm"
                        onClick={(e) => { e.stopPropagation(); action.fn(); }}
                        className={cn("p-1.5 h-7 w-7 rounded-md", action.cls)}
                      >
                        <action.icon className="w-3.5 h-3.5" />
                      </Button>
                    ))}
                  </div>
                )}

                <div className="relative z-[1]">
                  <CardHeader className="p-3 md:p-4 pb-1.5 md:pb-2">
                    <div className="flex items-center gap-2.5">
                      <div className={cn("p-2 md:p-2.5 rounded-xl bg-background/80 shadow-sm border border-border/30")}>
                        <card.icon className={cn("w-4 h-4 md:w-5 md:h-5", card.color)} />
                      </div>
                      {editingCard !== card.id && (
                        <ArrowUpRight className="w-3.5 h-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity mr-auto" />
                      )}
                    </div>

                    {editingCard === card.id ? (
                      <div className="mt-2 space-y-2">
                        <Input value={editData.title} onChange={(e) => setEditData(p => ({ ...p, title: e.target.value }))}
                          className="text-sm font-semibold" placeholder="عنوان المربع" onClick={(e) => e.stopPropagation()} />
                      </div>
                    ) : (
                      <CardTitle className="text-xs md:text-sm font-semibold mt-2 leading-tight text-foreground">
                        {card.title}
                      </CardTitle>
                    )}
                  </CardHeader>

                  <CardContent className="p-3 md:p-4 pt-0">
                    {editingCard === card.id ? (
                      <div className="space-y-2">
                        <Textarea value={editData.description} onChange={(e) => setEditData(p => ({ ...p, description: e.target.value }))}
                          className="text-xs resize-none" rows={2} placeholder="وصف المربع" onClick={(e) => e.stopPropagation()} />
                        <div className="flex items-center gap-1">
                          <LinkIcon className="w-3 h-3 text-muted-foreground flex-shrink-0" />
                          <Input value={editData.route} onChange={(e) => setEditData(p => ({ ...p, route: e.target.value }))}
                            className="text-xs" placeholder="/route" onClick={(e) => e.stopPropagation()} />
                        </div>
                        <div className="flex items-center justify-end gap-1 mt-1">
                          <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); saveEdit(); }}
                            className="text-green-600 hover:text-green-700 p-1 h-7 w-7">
                            <Save className="w-3.5 h-3.5" />
                          </Button>
                          <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); cancelEdit(); }}
                            className="text-destructive hover:text-destructive p-1 h-7 w-7">
                            <X className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <p className="text-[10px] md:text-xs text-muted-foreground leading-relaxed line-clamp-2">
                          {card.description}
                        </p>
                        <div className="flex items-center justify-end gap-1 mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <div className="cursor-grab hover:cursor-grabbing text-muted-foreground hover:text-foreground p-1 rounded transition-colors"
                            title="اسحب لإعادة الترتيب">
                            <GripVertical className="w-3.5 h-3.5" />
                          </div>
                          <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); startEditing(card); }}
                            className="text-muted-foreground hover:text-foreground p-1 h-7 w-7" title="تحرير">
                            <Edit className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                      </>
                    )}
                  </CardContent>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </PageContainer>
  );
}

export default Index;
