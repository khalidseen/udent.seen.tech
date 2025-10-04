import React from "react";
import { useLocation, NavLink } from "react-router-dom";
import "./sidebar.css";
import { Calendar, Users, Activity, BarChart3, Settings, LogOut, Stethoscope, CalendarPlus, FileText, Bell, ClipboardList, UserCog, Receipt, DollarSign, Package, FolderOpen, ExternalLink, User, TrendingUp, Brain, Pill, ChevronLeft, ChevronRight, PackageCheck, Truck, FileSpreadsheet, Megaphone, Mail, Box, Briefcase, Activity as TreatmentIcon, Calculator, Shield, Crown, Building, Plug } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/hooks/useAuth";
import { usePermissions } from "@/hooks/usePermissions";
import { useLanguage } from "@/contexts/LanguageContext";
import { useSettings } from "@/hooks/useSettingsHook";
import { useSidebar } from "@/contexts/SidebarContext";
import { cn } from "@/lib/utils";
export function AppSidebar() {
  const {
    isCollapsed,
    setIsCollapsed
  } = useSidebar();
  const {
    t,
    isRTL
  } = useLanguage();
  const location = useLocation();
  const currentPath = location.pathname;
  const {
    signOut,
    user
  } = useAuth();
  const {
    hasAnyPermission,
    getPrimaryRole,
    loading: permissionsLoading
  } = usePermissions();
  const {
    sidebarIconSize
  } = useSettings();
  const getIconSize = () => {
    switch (sidebarIconSize) {
      case 'small':
        return 'w-4 h-4';
      case 'large':
        return 'w-6 h-6';
      default:
        return 'w-5 h-5';
    }
  };
  const isActive = (path: string) => currentPath === path;
  const canAccessMenuItem = (item: MenuItem): boolean => {
    // إعطاء صلاحيات كاملة لمدير النظام
    if (user?.email === 'eng.khalid.work@gmail.com') {
      return true;
    }
    if (!item.permissions || item.permissions.length === 0) return true;
    return hasAnyPermission(item.permissions);
  };
  const primaryRole = getPrimaryRole();

  // Get current user role for role-based menu
  const userRole = primaryRole?.role_name;
  const menuConfig = [{
    groupTitle: t('sidebar.mainMenu'),
    items: [{
      title: t('navigation.dashboard'),
      url: "/",
      icon: BarChart3,
      permissions: []
    }, {
      title: t('navigation.patients'),
      url: "/patients",
      icon: Users,
      permissions: []
    }]
  }, {
    groupTitle: "إدارة المواعيد",
    items: [{
      title: t('navigation.appointments'),
      url: "/appointments",
      icon: Calendar,
      permissions: []
    }, {
      title: t('actions.addAppointment'),
      url: "/appointments/new",
      icon: CalendarPlus,
      permissions: []
    }, {
      title: "حجز موعد (للمرضى)",
      url: "/book",
      icon: ExternalLink,
      permissions: [],
      external: true
    }, {
      title: t('appointments.appointmentRequests'),
      url: "/appointment-requests",
      icon: ClipboardList,
      permissions: []
    }, {
      title: "طلبات الأطباء",
      url: "/doctor-applications",
      icon: Briefcase,
      permissions: ['system.manage_all_clinics']
    }]
  }, {
    groupTitle: t('sidebar.staffManagement'),
    items: [{
      title: t('navigation.doctors'),
      url: "/doctors",
      icon: Stethoscope,
      permissions: []
    }, {
      title: t('sidebar.doctorAssistants'),
      url: "/doctor-assistants",
      icon: UserCog,
      permissions: []
    }, {
      title: t('sidebar.secretaries'),
      url: "/secretaries",
      icon: User,
      permissions: []
    }]
  }, {
    groupTitle: t('sidebar.financialManagement'),
    items: [{
      title: t('navigation.invoices'),
      url: "/invoices",
      icon: Receipt,
      permissions: []
    }, {
      title: t('payments.title'),
      url: "/payments",
      icon: DollarSign,
      permissions: []
    }]
  }, {
    groupTitle: "إدارة المخزون",
    items: [{
      title: "المخزون",
      url: "/inventory",
      icon: Package,
      permissions: []
    }, {
      title: "الأدوية",
      url: "/medications",
      icon: Pill,
      permissions: []
    }, {
      title: "الوصفات الطبية",
      url: "/prescriptions",
      icon: FileText,
      permissions: []
    }, {
      title: "حركة المخزون",
      url: "/stock-movements",
      icon: Truck,
      permissions: []
    }, {
      title: "أوامر الشراء",
      url: "/purchase-orders",
      icon: PackageCheck,
      permissions: []
    }]
  },
  // Super Admin section - visible to super admins and system admin
  ...((userRole === 'super_admin' || 
       user?.email === 'eng.khalid.work@gmail.com' || 
       user?.user_metadata?.role === 'super_admin') ? [{
    groupTitle: "إدارة النظام الشامل",
    items: [{
      title: "لوحة تحكم مدير النظام",
      url: "/super-admin",
      icon: Crown,
      permissions: ['system.manage_all_clinics']
    }, {
      title: "إدارة العيادات",
      url: "/super-admin",
      icon: Building,
      permissions: ['system.manage_all_clinics']
    }, {
      title: "خطط الاشتراك",
      url: "/subscription-plans",
      icon: Package,
      permissions: ['system.manage_all_clinics']
    }]
  }] : []), 
  // Subscription Management - Only for owners
  ...((userRole === 'owner' || user?.email === 'eng.khalid.work@gmail.com') ? [{
    groupTitle: "إدارة الاشتراك",
    items: [{
      title: "تفاصيل الاشتراك",
      url: "/subscription",
      icon: Crown,
      permissions: []
    }]
  }] : []), {
    groupTitle: t('sidebar.systemManagement'),
    items: [{
      title: t('navigation.settings'),
      url: "/settings",
      icon: Settings,
      permissions: []
    }, {
      title: t('navigation.integrations'),
      url: "/integrations",
      icon: Plug,
      permissions: []
    }]
  }, {
    groupTitle: "� الإحصائيات والتقارير",
    items: [{
      title: "العلاجات السنية",
      url: "/dental-treatments-management",
      icon: TreatmentIcon,
      permissions: []
    }, {
      title: "التقارير التفصيلية",
      url: "/detailed-reports",
      icon: FileSpreadsheet,
      permissions: []
    }]
  }, {
    groupTitle: "🗂️ السجلات والملفات",
    items: [{
      title: "السجلات الطبية المتقدمة",
      url: "/advanced-medical-records",
      icon: FolderOpen,
      permissions: []
    }]
  }, {
    groupTitle: "🤖 الذكاء الاصطناعي",
    items: [{
      title: "قائمة الذكاء الاصطناعي",
      url: "/ai-management-dashboard",
      icon: Brain,
      permissions: []
    }, {
      title: "التشخيص الذكي",
      url: "/smart-diagnosis-system",
      icon: Activity,
      permissions: []
    }, {
      title: "رؤى الذكاء الاصطناعي",
      url: "/ai-insights-page",
      icon: TrendingUp,
      permissions: []
    }]
  }, {
    groupTitle: "🔔 الإشعارات والاتصالات",
    items: [{
      title: "إدارة الإشعارات المتقدمة",
      url: "/advanced-notification-management",
      icon: Bell,
      permissions: []
    }, {
      title: "قوالب الإشعارات المخصصة",
      url: "/custom-notification-templates",
      icon: Mail,
      permissions: []
    }]
  }, {
    groupTitle: "👥 إدارة المستخدمين والصلاحيات",
    items: [{
      title: "إدارة الصلاحيات المتقدمة",
      url: "/advanced-permissions-management",
      icon: UserCog,
      permissions: []
    }, {
      title: "إدارة المستخدمين المتقدمة",
      url: "/advanced-user-management",
      icon: Users,
      permissions: []
    }]
  }, {
    groupTitle: "🔒 الأمان والحماية",
    items: [{
      title: "التدقيق الأمني الشامل",
      url: "/comprehensive-security-audit",
      icon: Shield,
      permissions: []
    }]
  }, {
    groupTitle: "🦷 النماذج ثلاثية الأبعاد",
    items: [{
      title: "3D للأسنان المتقدم",
      url: "/advanced-3d-dental",
      icon: Box,
      permissions: []
    }, {
      title: "إدارة النماذج ثلاثية الأبعاد",
      url: "/dental-3d-models-management",
      icon: Package,
      permissions: []
    }]
  }];
  interface MenuItem {
    title: string;
    url: string;
    icon: React.ComponentType;
    permissions?: string[];
    external?: boolean;
  }
  function SidebarMenuItem({
    icon: Icon,
    title,
    url,
    collapsed,
    iconSize = 'w-5 h-5',
    isActive,
    external
  }: {
    icon: React.ComponentType<{
      className?: string;
    }>;
    title: string;
    url: string;
    collapsed?: boolean;
    iconSize?: string;
    isActive?: boolean;
    external?: boolean;
  }) {
    const content = <>
        <Icon className={iconSize} />
        {!collapsed && <span>{title}</span>}
      </>;
    const className = cn("flex items-center gap-3 px-3 py-2 rounded-md transition-colors", "hover:bg-accent hover:text-accent-foreground", isActive && "bg-accent text-accent-foreground", !collapsed && "justify-start w-full", collapsed && "justify-center");
    if (external) {
      return <a href={url} className={className} target="_blank" rel="noopener noreferrer">
          {content}
        </a>;
    }
    return <NavLink to={url} className={className}>
        {content}
      </NavLink>;
  }

  // إضافة متغير CSS لمشاركة حالة القائمة مع المكونات الأخرى
  React.useEffect(() => {
    document.documentElement.style.setProperty('--sidebar-width', isCollapsed ? '4.5rem' : '16rem');
  }, [isCollapsed]);
  if (permissionsLoading) {
    return <aside className={cn("fixed inset-y-0 z-40 bg-background border shadow-sm flex items-center justify-center", isRTL ? "right-0 border-l" : "left-0 border-r", isCollapsed ? "w-[4.5rem]" : "w-64")}>
         <div className="text-muted-foreground">جاري تحميل القائمة...</div>
       </aside>;
  }
  return <aside className={cn(
    "fixed inset-y-0 z-50 bg-background border-r border-border flex flex-col shadow-lg",
    isRTL ? "right-0" : "left-0",
    isCollapsed ? "w-[4.5rem]" : "w-64",
    "transition-all duration-300 ease-in-out"
  )} data-state={isCollapsed ? "collapsed" : "expanded"}>
      {/* Header */}
      <div className="h-16 flex items-center justify-between px-4 border-b border-border bg-background/95 backdrop-blur">
        <div className={cn("flex items-center gap-3", isRTL && "flex-row-reverse")}>
          <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center shrink-0 shadow-sm">
            <Stethoscope className="w-6 h-6 text-primary-foreground" />
          </div>
          {!isCollapsed && (
            <div className="flex flex-col">
              <h1 className="text-lg font-bold text-primary truncate leading-tight">
                {t('sidebar.systemName')}
              </h1>
              <p className="text-xs text-muted-foreground truncate">
                نظام إدارة العيادات
              </p>
            </div>
          )}
        </div>
        <Button 
          variant="ghost" 
          size="icon" 
          className="h-8 w-8 shrink-0 hover:bg-accent" 
          onClick={() => setIsCollapsed(!isCollapsed)}
        >
          {isCollapsed ? (
            <ChevronRight className="h-4 w-4" />
          ) : (
            <ChevronLeft className="h-4 w-4" />
          )}
        </Button>
      </div>

      {/* Menu */}
      <div className="flex-1 overflow-y-auto py-4">
        <div className={cn("space-y-2", isCollapsed ? "px-2" : "px-3")}>
          {menuConfig.map(group => {
          const filteredItems = group.items.filter(item => canAccessMenuItem(item));
          if (filteredItems.length === 0) return null;
          return <div key={group.groupTitle} className="mb-6">
                {!isCollapsed && (
                  <h2 className={cn(
                    "text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3 px-2",
                    isRTL && "text-right"
                  )}>
                    {group.groupTitle}
                  </h2>
                )}
                <div className="space-y-1">
                  {filteredItems.map(item => 
                    <SidebarMenuItem 
                      key={item.title} 
                      icon={item.icon} 
                      title={item.title} 
                      url={item.url} 
                      collapsed={isCollapsed} 
                      iconSize={getIconSize()} 
                      isActive={isActive(item.url)} 
                      external={'external' in item ? item.external : undefined} 
                    />
                  )}
                </div>
              </div>;
        })}
        </div>
      </div>

      {/* Footer */}
      <div className="border-t border-border p-4 bg-background/50">
        <div className="space-y-2">
          {!isCollapsed && (
            <Button 
              variant="ghost" 
              size="sm" 
              className="w-full justify-start gap-2 h-10 text-sm" 
              onClick={() => window.location.href = '/profile'}
            >
              <User className="w-4 h-4" />
              الملف الشخصي
            </Button>
          )}
          <Button 
            variant="ghost" 
            size={isCollapsed ? "icon" : "sm"} 
            className={cn(
              "w-full h-10",
              !isCollapsed && "justify-start gap-2 text-sm"
            )} 
            onClick={signOut}
          >
            <LogOut className="w-4 h-4" />
            {!isCollapsed && t('common.logout')}
          </Button>
        </div>
      </div>
    </aside>;
}