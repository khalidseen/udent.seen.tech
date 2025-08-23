import { useState } from "react";
import { NavLink, useLocation } from "react-router-dom";
import { Calendar, Users, Activity, BarChart3, Settings, LogOut, Stethoscope, CalendarPlus, FileText, Bell, Search, ClipboardList, UserCheck, Receipt, DollarSign, Package, FolderOpen, ExternalLink, User, ShoppingCart, TrendingUp, UserPlus, MessageSquare, Wallet, Brain, Pill } from "lucide-react";
import { Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent, SidebarGroupLabel, SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarHeader, SidebarFooter, useSidebar } from "@/components/ui/sidebar";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/hooks/useAuth";

const mainMenuItems = [{
  title: "لوحة التحكم",
  url: "/",
  icon: BarChart3
}, {
  title: "المرضى",
  url: "/patients",
  icon: Users
}, {
  title: "المواعيد",
  url: "/appointments",
  icon: Calendar
}, {
  title: "طلبات المواعيد",
  url: "/appointment-requests",
  icon: ClipboardList
}, {
  title: "موعد جديد",
  url: "/appointments/new",
  icon: CalendarPlus
}, {
  title: "العلاجات",
  url: "/treatments",
  icon: Activity
}, {
  title: "علاجات الأسنان",
  url: "/dental-treatments",
  icon: Stethoscope
}, {
  title: "الملفات الطبية",
  url: "/medical-records",
  icon: FolderOpen
}];

const aiMenuItems = [{
  title: "التشخيص الذكي",
  url: "/smart-diagnosis",
  icon: Brain
}, {
  title: "الذكاء الاصطناعي",
  url: "/ai-insights",
  icon: TrendingUp
}];

const managementMenuItems = [{
  title: "الأطباء",
  url: "/doctors",
  icon: Stethoscope
}, {
  title: "مساعدو الأطباء", 
  url: "/doctor-assistants",
  icon: UserCheck
}, {
  title: "السكرتيرات",
  url: "/secretaries",
  icon: User
}, {
  title: "طلبات الأطباء",
  url: "/doctor-applications",
  icon: ClipboardList
}];

const financialMenuItems = [{
  title: "الفواتير",
  url: "/invoices",
  icon: Receipt
}, {
  title: "المدفوعات",
  url: "/payments",
  icon: DollarSign
}, {
  title: "أسعار الخدمات",
  url: "/service-prices",
  icon: DollarSign
}];

const inventoryMenuItems = [{
  title: "المخزون",
  url: "/inventory",
  icon: Package
}, {
  title: "الأدوية",
  url: "/medications",
  icon: Pill
}, {
  title: "أوامر الشراء",
  url: "/purchase-orders",
  icon: ShoppingCart
}, {
  title: "حركة المخزون",
  url: "/stock-movements",
  icon: TrendingUp
}];

const systemMenuItems = [{
  title: "الإشعارات",
  url: "/notifications",
  icon: Bell
}, {
  title: "قوالب الإشعارات",
  url: "/notification-templates",
  icon: MessageSquare
}, {
  title: "التقارير",
  url: "/reports",
  icon: FileText
}, {
  title: "الإعدادات",
  url: "/settings",
  icon: Settings
}, {
  title: "رابط حجز المرضى",
  url: "/book?clinic=default",
  icon: ExternalLink,
  external: true
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
  const isActive = (path: string) => currentPath === path;
  
  const getNavClasses = (path: string) => {
    const baseClasses = "w-full justify-start gap-2 text-sm font-medium transition-colors";
    if (isActive(path)) {
      return `${baseClasses} bg-accent text-accent-foreground`;
    }
    return `${baseClasses} hover:bg-accent hover:text-accent-foreground`;
  };

  const filteredMainMenu = mainMenuItems.filter(item => 
    item.title.toLowerCase().includes(searchQuery.toLowerCase())
  );
  const filteredAIMenu = aiMenuItems.filter(item => 
    item.title.toLowerCase().includes(searchQuery.toLowerCase())
  );
  const filteredManagementMenu = managementMenuItems.filter(item => 
    item.title.toLowerCase().includes(searchQuery.toLowerCase())
  );
  const filteredFinancialMenu = financialMenuItems.filter(item => 
    item.title.toLowerCase().includes(searchQuery.toLowerCase())
  );
  const filteredInventoryMenu = inventoryMenuItems.filter(item => 
    item.title.toLowerCase().includes(searchQuery.toLowerCase())
  );
  const filteredSystemMenu = systemMenuItems.filter(item => 
    item.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

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
        <SidebarGroup>
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
      </SidebarContent>

      {/* Footer */}
      <SidebarFooter className="p-4 border-t">
        {!collapsed ? (
          <div className="space-y-3">
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
