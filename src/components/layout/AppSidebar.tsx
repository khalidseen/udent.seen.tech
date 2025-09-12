import React from "react";
import { useLocation, NavLink } from "react-router-dom";
import "./sidebar.css";
<<<<<<< HEAD
import { Calendar, Users, Activity, BarChart3, Settings, LogOut, Stethoscope, CalendarPlus, FileText, Bell, ClipboardList, UserCog, Receipt, DollarSign, Package, FolderOpen, ExternalLink, User, TrendingUp, Brain, Pill, ChevronLeft, ChevronRight, PackageCheck, Truck, FileSpreadsheet, Megaphone, Mail, Box, Briefcase, Activity as TreatmentIcon, Calculator, Shield, Crown, Building } from "lucide-react";
=======
import { Calendar, Users, Activity, BarChart3, Settings, LogOut, Stethoscope, CalendarPlus, FileText, Bell, Search, ClipboardList, UserCog, Receipt, DollarSign, Package, FolderOpen, ExternalLink, User, TrendingUp, Brain, Pill, ChevronLeft, ChevronRight, PackageCheck, Truck, FileSpreadsheet, Megaphone, Mail, Box, UserCheck, Briefcase, Activity as TreatmentIcon, Calculator, Shield, Crown, Building } from "lucide-react";
>>>>>>> cbd682d36e862741c55b9e7b5d144f8de65c694a
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
<<<<<<< HEAD
=======
  const [searchQuery, setSearchQuery] = React.useState("");
>>>>>>> cbd682d36e862741c55b9e7b5d144f8de65c694a
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
<<<<<<< HEAD
    }]
  }, {
    groupTitle: "إدارة المواعيد",
    items: [{
=======
    }, {
>>>>>>> cbd682d36e862741c55b9e7b5d144f8de65c694a
      title: t('navigation.appointments'),
      url: "/appointments",
      icon: Calendar,
      permissions: []
    }, {
<<<<<<< HEAD
=======
      title: t('appointments.appointmentRequests'),
      url: "/appointment-requests",
      icon: ClipboardList,
      permissions: []
    }, {
>>>>>>> cbd682d36e862741c55b9e7b5d144f8de65c694a
      title: t('actions.addAppointment'),
      url: "/appointments/new",
      icon: CalendarPlus,
      permissions: []
    }, {
<<<<<<< HEAD
      title: "حجز موعد (للمرضى)",
      url: "/book",
      icon: ExternalLink,
      permissions: [],
      external: true
    }, {
      title: t('appointments.appointmentRequests'),
      url: "/appointment-requests",
      icon: ClipboardList,
=======
      title: t('navigation.dentalTreatments'),
      url: "/dental-treatments",
      icon: Stethoscope,
      permissions: []
    }, {
      title: t('navigation.medicalRecords'),
      url: "/medical-records",
      icon: FolderOpen,
      permissions: []
    }]
  }, {
    groupTitle: t('sidebar.aiMenu'),
    items: [{
      title: t('sidebar.smartDiagnosis'),
      url: "/smart-diagnosis",
      icon: Brain,
      permissions: []
    }, {
      title: t('navigation.aiInsights'),
      url: "/ai-insights",
      icon: TrendingUp,
>>>>>>> cbd682d36e862741c55b9e7b5d144f8de65c694a
      permissions: []
    }]
  }, {
    groupTitle: t('sidebar.staffManagement'),
    items: [{
      title: t('navigation.doctors'),
      url: "/doctors",
      icon: Stethoscope,
      permissions: []
    }, {
<<<<<<< HEAD
=======
      title: "طلبات الأطباء",
      url: "/doctor-applications",
      icon: UserCheck,
      permissions: []
    }, {
>>>>>>> cbd682d36e862741c55b9e7b5d144f8de65c694a
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
<<<<<<< HEAD
  ...((userRole === 'super_admin' || 
       user?.email === 'eng.khalid.work@gmail.com' || 
       user?.user_metadata?.role === 'super_admin') ? [{
=======
  ...((userRole === 'super_admin' || user?.email === 'eng.khalid.work@gmail.com') ? [{
>>>>>>> cbd682d36e862741c55b9e7b5d144f8de65c694a
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
<<<<<<< HEAD
=======
      title: "الإشعارات",
      url: "/notifications",
      icon: Bell,
      permissions: []
    }, {
      title: "قوالب الإشعارات",
      url: "/notification-templates",
      icon: Mail,
      permissions: []
    }, {
      title: "التقارير",
      url: "/reports",
      icon: FileSpreadsheet,
      permissions: []
    },
    // Role-based system management items - always show for system admin
    ...(userRole === 'super_admin' || userRole === 'clinic_manager' || user?.email === 'eng.khalid.work@gmail.com' ? [{
      title: "إدارة الصلاحيات",
      url: "/permissions",
      icon: UserCog,
      permissions: ['permissions.manage']
    }, {
      title: "إدارة المستخدمين",
      url: "/users",
      icon: Users,
      permissions: ['users.view_all']
    }, {
      title: "التدقيق الأمني",
      url: "/security-audit",
      icon: Shield,
      permissions: ['audit.view']
    }] : []), {
>>>>>>> cbd682d36e862741c55b9e7b5d144f8de65c694a
      title: t('navigation.settings'),
      url: "/settings",
      icon: Settings,
      permissions: []
<<<<<<< HEAD
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
=======
    }, {
      title: "رابط حجز المرضى",
      url: "/book",
      icon: ExternalLink,
      permissions: [],
      external: true
    }]
  }, {
    groupTitle: "الميزات المتقدمة",
    items: [{
      title: "العلاجات",
      url: "/treatments",
      icon: TreatmentIcon,
      permissions: []
    }, {
      title: "أسعار الخدمات",
      url: "/service-prices",
      icon: Calculator,
      permissions: []
    }, {
>>>>>>> cbd682d36e862741c55b9e7b5d144f8de65c694a
      title: "3D للأسنان المتقدم",
      url: "/advanced-3d-dental",
      icon: Box,
      permissions: []
    }, {
      title: "إدارة النماذج ثلاثية الأبعاد",
<<<<<<< HEAD
      url: "/dental-3d-models-management",
=======
      url: "/dental-models-admin",
>>>>>>> cbd682d36e862741c55b9e7b5d144f8de65c694a
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
<<<<<<< HEAD
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
                      external={item.external} 
                    />
                  )}
=======
  return <aside className={cn("fixed inset-y-0 z-40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 shadow-sm flex flex-col", isRTL ? "right-0 border-l" : "left-0 border-r", isCollapsed ? "w-[4.5rem]" : "w-64", "transition-all duration-300")} data-state={isCollapsed ? "collapsed" : "expanded"}>
      {/* Header */}
      <div className="h-16 flex items-center px-4 border-b">
        <div className={cn("flex items-center gap-3 flex-1", isRTL && "flex-row-reverse")}>
          <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center shrink-0">
            <Stethoscope className="w-5 h-5 text-primary-foreground" />
          </div>
          {!isCollapsed && <h1 className="text-lg font-bold text-primary truncate">
              {t('sidebar.systemName')}
            </h1>}
        </div>
        <Button variant="ghost" size="icon" className={cn("absolute -right-3 top-3", isRTL && "-left-3 right-auto")} onClick={() => setIsCollapsed(!isCollapsed)}>
          {isCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
        </Button>
      </div>

      {/* Search */}
      {!isCollapsed && <div className="p-4 border-b">
          <div className="relative">
            <Search className={cn("w-4 h-4 absolute top-1/2 -translate-y-1/2 text-muted-foreground", isRTL ? "right-3" : "left-3")} />
            <Input type="search" placeholder={t('common.search')} value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className={cn("w-full h-9", isRTL ? "pr-9" : "pl-9")} />
          </div>
        </div>}

      {/* Menu */}
      <div className="flex-1 overflow-y-auto">
        <div className={cn("py-2", isCollapsed ? "px-2" : "px-3")}>
          {menuConfig.map(group => {
          const filteredItems = group.items.filter(item => item.title.toLowerCase().includes(searchQuery.toLowerCase()) && canAccessMenuItem(item));
          if (filteredItems.length === 0) return null;
          return <div key={group.groupTitle} className="mb-4">
                {!isCollapsed && <h2 className={cn("text-xs font-medium text-muted-foreground px-2 mb-2", isRTL && "text-right")}>
                    {group.groupTitle}
                  </h2>}
                <div className="space-y-1">
                  {filteredItems.map(item => <SidebarMenuItem key={item.title} icon={item.icon} title={item.title} url={item.url} collapsed={isCollapsed} iconSize={getIconSize()} isActive={isActive(item.url)} external={item.external || false} />)}
>>>>>>> cbd682d36e862741c55b9e7b5d144f8de65c694a
                </div>
              </div>;
        })}
        </div>
      </div>

      {/* Footer */}
<<<<<<< HEAD
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
=======
      <div className="border-t p-4">
        
        <div className="space-y-2 mt-3">
          {!isCollapsed && <Button variant="ghost" size="default" className="w-full justify-start gap-2" onClick={() => window.location.href = '/profile'}>
              <User className="w-4 h-4" />
              الملف الشخصي
            </Button>}
          <Button variant="ghost" size={isCollapsed ? "icon" : "default"} className={cn("w-full", !isCollapsed && "justify-start gap-2")} onClick={signOut}>
>>>>>>> cbd682d36e862741c55b9e7b5d144f8de65c694a
            <LogOut className="w-4 h-4" />
            {!isCollapsed && t('common.logout')}
          </Button>
        </div>
      </div>
    </aside>;
}