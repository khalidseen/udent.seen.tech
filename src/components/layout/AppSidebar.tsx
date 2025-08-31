import React from "react";
import { useLocation, NavLink } from "react-router-dom";
import "./sidebar.css";
import { Calendar, Users, Activity, BarChart3, Settings, LogOut, Stethoscope, CalendarPlus, FileText, Bell, Search, ClipboardList, UserCog, Receipt, DollarSign, Package, FolderOpen, ExternalLink, User, TrendingUp, Brain, Pill, ChevronLeft, ChevronRight, PackageCheck, Truck, FileSpreadsheet, Megaphone, Mail, Box, UserCheck, Briefcase, Activity as TreatmentIcon, Calculator, Shield, Crown, Building } from "lucide-react";
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
  const [searchQuery, setSearchQuery] = React.useState("");
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
    }, {
      title: t('navigation.appointments'),
      url: "/appointments",
      icon: Calendar,
      permissions: []
    }, {
      title: t('appointments.appointmentRequests'),
      url: "/appointment-requests",
      icon: ClipboardList,
      permissions: []
    }, {
      title: t('actions.addAppointment'),
      url: "/appointments/new",
      icon: CalendarPlus,
      permissions: []
    }, {
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
      title: "طلبات الأطباء",
      url: "/doctor-applications",
      icon: UserCheck,
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
  ...((userRole === 'super_admin' || user?.email === 'eng.khalid.work@gmail.com') ? [{
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
      title: t('navigation.settings'),
      url: "/settings",
      icon: Settings,
      permissions: []
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
      title: "3D للأسنان المتقدم",
      url: "/advanced-3d-dental",
      icon: Box,
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
                </div>
              </div>;
        })}
        </div>
      </div>

      {/* Footer */}
      <div className="border-t p-4">
        
        <div className="space-y-2 mt-3">
          {!isCollapsed && <Button variant="ghost" size="default" className="w-full justify-start gap-2" onClick={() => window.location.href = '/profile'}>
              <User className="w-4 h-4" />
              الملف الشخصي
            </Button>}
          <Button variant="ghost" size={isCollapsed ? "icon" : "default"} className={cn("w-full", !isCollapsed && "justify-start gap-2")} onClick={signOut}>
            <LogOut className="w-4 h-4" />
            {!isCollapsed && t('common.logout')}
          </Button>
        </div>
      </div>
    </aside>;
}