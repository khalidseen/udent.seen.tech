import { useState } from "react";
import { NavLink, useLocation } from "react-router-dom";
import { Calendar, Users, Activity, BarChart3, Settings, LogOut, Stethoscope, CalendarPlus, FileText, Bell, Search, ClipboardList, UserCheck, Receipt, DollarSign, Package, FolderOpen, ExternalLink, User, ShoppingCart, TrendingUp, UserPlus, MessageSquare, Wallet, Brain, Pill, Construction, Lock } from "lucide-react";
import { Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent, SidebarGroupLabel, SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarHeader, SidebarFooter, useSidebar } from "@/components/ui/sidebar";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/useAuth";
import { usePermissions } from "@/hooks/usePermissions";
import { PermissionGate } from "@/components/auth/PermissionGate";

const mainMenuItems = [{
  title: "لوحة التحكم",
  url: "/",
  icon: BarChart3,
  permissions: ["dashboard.view"]
}, {
  title: "المرضى",
  url: "/patients",
  icon: Users,
  permissions: ["patients.view"]
}, {
  title: "المواعيد",
  url: "/appointments",
  icon: Calendar,
  permissions: ["appointments.view"]
}, {
  title: "طلبات المواعيد",
  url: "/appointment-requests",
  icon: ClipboardList,
  permissions: ["appointments.requests"]
}, {
  title: "موعد جديد",
  url: "/appointments/new",
  icon: CalendarPlus,
  permissions: ["appointments.create"]
}, {
  title: "علاجات الأسنان",
  url: "/dental-treatments",
  icon: Stethoscope,
  permissions: ["dental.view"]
}, {
  title: "الملفات الطبية",
  url: "/medical-records",
  icon: FolderOpen,
  permissions: ["medical_records.view"]
}];

const aiMenuItems = [{
  title: "التشخيص الذكي",
  url: "/smart-diagnosis",
  icon: Brain,
  permissions: ["ai.diagnosis"]
}, {
  title: "الذكاء الاصطناعي",
  url: "/ai-insights",
  icon: TrendingUp,
  permissions: ["ai.analysis"]
}];

const managementMenuItems = [{
  title: "الأطباء",
  url: "/doctors",
  icon: Stethoscope,
  permissions: ["doctors.view"]
}, {
  title: "مساعدو الأطباء", 
  url: "/doctor-assistants",
  icon: UserCheck,
  permissions: ["assistants.view"]
}, {
  title: "طلبات الأطباء",
  url: "/doctor-applications",
  icon: ClipboardList,
  permissions: ["doctors.view"]
}];

const financialMenuItems = [{
  title: "الفواتير",
  url: "/invoices",
  icon: Receipt,
  permissions: ["invoices.view"]
}, {
  title: "المدفوعات",
  url: "/payments",
  icon: DollarSign,
  permissions: ["payments.view"]
}];

const inventoryMenuItems = [{
  title: "المخزون",
  url: "/inventory",
  icon: Package,
  permissions: ["inventory.view"]
}, {
  title: "الأدوية",
  url: "/medications",
  icon: Pill,
  permissions: ["inventory.view"]
}, {
  title: "الوصفات الطبية",
  url: "/prescriptions", 
  icon: FileText,
  permissions: ["prescriptions.view"]
}, {
  title: "أوامر الشراء",
  url: "/purchase-orders",
  icon: ShoppingCart,
  permissions: ["inventory.orders"]
}];

const systemMenuItems = [{
  title: "الإشعارات",
  url: "/notifications",
  icon: Bell,
  permissions: ["notifications.manage"]
}, {
  title: "قوالب الإشعارات",
  url: "/notification-templates",
  icon: MessageSquare,
  permissions: ["notifications.manage"]
}, {
  title: "التقارير",
  url: "/reports",
  icon: FileText,
  permissions: ["reports.view"]
}, {
  title: "الإعدادات",
  url: "/settings",
  icon: Settings,
  permissions: ["settings.general"]
}, {
  title: "رابط حجز المرضى",
  url: "/book?clinic=default",
  icon: ExternalLink,
  external: true
}];

// صفحات تحت التطوير
const developmentMenuItems = [{
  title: "العلاجات",
  url: "/treatments",
  icon: Activity,
  permissions: ["medical_records.view"]
}, {
  title: "السكرتيرات",
  url: "/secretaries",
  icon: User,
  permissions: ["assistants.view"]
}, {
  title: "أسعار الخدمات",
  url: "/service-prices",
  icon: DollarSign,
  permissions: ["settings.general"]
}, {
  title: "حركة المخزون",
  url: "/stock-movements",
  icon: TrendingUp,
  permissions: ["inventory.view"]
}, {
  title: "3D للأسنان المتقدم",
  url: "/advanced-3d-dental",
  icon: Stethoscope,
  permissions: ["dental.view"]
}];

export function AppSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  
  let currentPath = "/";
  try {
    const location = useLocation();
    currentPath = location.pathname;
  } catch (error) {
    console.warn("Router context not available, using default path");
  }
  
  const [searchQuery, setSearchQuery] = useState("");
  const { signOut, user } = useAuth();
  const { hasAnyPermission, getPrimaryRole } = usePermissions();
  const isActive = (path: string) => currentPath === path;
  
  // دالة لفحص إذا كان المستخدم يملك صلاحية الوصول لعنصر القائمة
  const canAccessMenuItem = (item: any) => {
    if (!item.permissions || item.permissions.length === 0) return true;
    return hasAnyPermission(item.permissions);
  };
  
  const getNavClasses = (path: string) => {
    const baseClasses = "w-full justify-start gap-2 text-sm font-medium transition-colors";
    if (isActive(path)) {
      return `${baseClasses} bg-accent text-accent-foreground`;
    }
    return `${baseClasses} hover:bg-accent hover:text-accent-foreground`;
  };

  const filteredMainMenu = mainMenuItems.filter(item => 
    item.title.toLowerCase().includes(searchQuery.toLowerCase()) && canAccessMenuItem(item)
  );
  const filteredAIMenu = aiMenuItems.filter(item => 
    item.title.toLowerCase().includes(searchQuery.toLowerCase()) && canAccessMenuItem(item)
  );
  const filteredManagementMenu = managementMenuItems.filter(item => 
    item.title.toLowerCase().includes(searchQuery.toLowerCase()) && canAccessMenuItem(item)
  );
  const filteredFinancialMenu = financialMenuItems.filter(item => 
    item.title.toLowerCase().includes(searchQuery.toLowerCase()) && canAccessMenuItem(item)
  );
  const filteredInventoryMenu = inventoryMenuItems.filter(item => 
    item.title.toLowerCase().includes(searchQuery.toLowerCase()) && canAccessMenuItem(item)
  );
  const filteredSystemMenu = systemMenuItems.filter(item => 
    item.title.toLowerCase().includes(searchQuery.toLowerCase()) && canAccessMenuItem(item)
  );
  const filteredDevelopmentMenu = developmentMenuItems.filter(item => 
    item.title.toLowerCase().includes(searchQuery.toLowerCase()) && canAccessMenuItem(item)
  );
  
  const primaryRole = getPrimaryRole();

  return (
    <Sidebar side="right" className={`${collapsed ? "w-16" : "w-72"} transition-all duration-300 border-l`} collapsible="icon">
      {/* Header */}
      <SidebarHeader className="p-4 border-b">
        {!collapsed ? (
          <div className="flex items-center space-x-3 space-x-reverse">
            <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
              <Stethoscope className="w-5 h-5 text-primary-foreground" />
            </div>
            <div className="flex-1">
              <h1 className="text-lg font-bold">فوردنتست</h1>
              <p className="text-xs text-muted-foreground">نظام إدارة العيادة</p>
            </div>
          </div>
        ) : (
          <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center mx-auto">
            <Stethoscope className="w-5 h-5 text-primary-foreground" />
          </div>
        )}
      </SidebarHeader>

      <SidebarContent className="p-3">

        {/* Main Menu */}
        <SidebarGroup className="mb-4">
          {!collapsed && (
            <SidebarGroupLabel className="text-xs font-semibold text-muted-foreground mb-2">
              القائمة الرئيسية
            </SidebarGroupLabel>
          )}
          <SidebarGroupContent>
            <SidebarMenu className="space-y-1">
              {filteredMainMenu.map(item => {
                const Icon = item.icon;
                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild className="h-9">
                      <NavLink to={item.url} className={getNavClasses(item.url)}>
                        <Icon className="w-4 h-4 shrink-0" />
                        {!collapsed && <span>{item.title}</span>}
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* AI & Smart Diagnosis */}
        <SidebarGroup className="mb-4">
          {!collapsed && (
            <SidebarGroupLabel className="text-xs font-semibold text-muted-foreground mb-2">
              الذكاء الاصطناعي
            </SidebarGroupLabel>
          )}
          <SidebarGroupContent>
            <SidebarMenu className="space-y-1">
              {filteredAIMenu.map(item => {
                const Icon = item.icon;
                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild className="h-9">
                      <NavLink to={item.url} className={getNavClasses(item.url)}>
                        <Icon className="w-4 h-4 shrink-0" />
                        {!collapsed && <span>{item.title}</span>}
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Staff Management */}
        <SidebarGroup className="mb-4">
          {!collapsed && (
            <SidebarGroupLabel className="text-xs font-semibold text-muted-foreground mb-2">
              إدارة الموظفين
            </SidebarGroupLabel>
          )}
          <SidebarGroupContent>
            <SidebarMenu className="space-y-1">
              {filteredManagementMenu.map(item => {
                const Icon = item.icon;
                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild className="h-9">
                      <NavLink to={item.url} className={getNavClasses(item.url)}>
                        <Icon className="w-4 h-4 shrink-0" />
                        {!collapsed && <span>{item.title}</span>}
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Financial Management */}
        <SidebarGroup className="mb-4">
          {!collapsed && (
            <SidebarGroupLabel className="text-xs font-semibold text-muted-foreground mb-2">
              الإدارة المالية
            </SidebarGroupLabel>
          )}
          <SidebarGroupContent>
            <SidebarMenu className="space-y-1">
              {filteredFinancialMenu.map(item => {
                const Icon = item.icon;
                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild className="h-9">
                      <NavLink to={item.url} className={getNavClasses(item.url)}>
                        <Icon className="w-4 h-4 shrink-0" />
                        {!collapsed && <span>{item.title}</span>}
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Inventory Management */}
        <SidebarGroup className="mb-4">
          {!collapsed && (
            <SidebarGroupLabel className="text-xs font-semibold text-muted-foreground mb-2">
              إدارة المخزون
            </SidebarGroupLabel>
          )}
          <SidebarGroupContent>
            <SidebarMenu className="space-y-1">
              {filteredInventoryMenu.map(item => {
                const Icon = item.icon;
                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild className="h-9">
                      <NavLink to={item.url} className={getNavClasses(item.url)}>
                        <Icon className="w-4 h-4 shrink-0" />
                        {!collapsed && <span>{item.title}</span>}
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* System Management */}
        <SidebarGroup className="mb-4">
          {!collapsed && (
            <SidebarGroupLabel className="text-xs font-semibold text-muted-foreground mb-2">
              إدارة النظام
            </SidebarGroupLabel>
          )}
          <SidebarGroupContent>
            <SidebarMenu className="space-y-1">
              {filteredSystemMenu.map(item => {
                const Icon = item.icon;
                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild className="h-9">
                      {item.external ? (
                        <a 
                          href={item.url} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className={`${getNavClasses(item.url)} text-blue-600 hover:text-blue-700`}
                        >
                          <Icon className="w-4 h-4 shrink-0" />
                          {!collapsed && (
                            <span className="flex items-center gap-1">
                              {item.title} 
                              <ExternalLink className="w-3 h-3" />
                            </span>
                          )}
                        </a>
                      ) : (
                        <NavLink to={item.url} className={getNavClasses(item.url)}>
                          <Icon className="w-4 h-4 shrink-0" />
                          {!collapsed && <span>{item.title}</span>}
                        </NavLink>
                      )}
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* تحت التطوير */}
        {filteredDevelopmentMenu.length > 0 && (
          <SidebarGroup>
            {!collapsed && (
              <SidebarGroupLabel className="text-xs font-semibold text-muted-foreground mb-2 flex items-center gap-2">
                <Construction className="w-3 h-3" />
                تحت التطوير
              </SidebarGroupLabel>
            )}
            <SidebarGroupContent>
              <SidebarMenu className="space-y-1">
                {filteredDevelopmentMenu.map(item => {
                  const Icon = item.icon;
                  return (
                    <SidebarMenuItem key={item.title}>
                      <SidebarMenuButton asChild className="h-9">
                        <NavLink 
                          to={item.url} 
                          className={`${getNavClasses(item.url)} opacity-60 pointer-events-none`}
                        >
                          <Icon className="w-4 h-4 shrink-0" />
                          {!collapsed && (
                            <span className="flex items-center gap-2">
                              {item.title}
                              <Badge variant="secondary" className="text-[10px] px-1">
                                قريباً
                              </Badge>
                            </span>
                          )}
                        </NavLink>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  );
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}
      </SidebarContent>

      {/* Footer */}
      <SidebarFooter className="p-4 border-t">
        {!collapsed ? (
          <div className="space-y-3">
            {primaryRole && (
              <div className="text-xs text-muted-foreground">
                <span className="flex items-center gap-2">
                  <User className="w-3 h-3" />
                  {primaryRole.role_name_ar}
                </span>
              </div>
            )}
            <Button 
              variant="ghost" 
              size="sm" 
              className="w-full justify-start gap-2"
              onClick={signOut}
            >
              <LogOut className="w-4 h-4" />
              تسجيل الخروج
            </Button>
          </div>
        ) : (
          <Button 
            variant="ghost" 
            size="sm" 
            className="w-full p-2"
            onClick={signOut}
          >
            <LogOut className="w-4 h-4" />
          </Button>
        )}
      </SidebarFooter>
    </Sidebar>
  );
}
