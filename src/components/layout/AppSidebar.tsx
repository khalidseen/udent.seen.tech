import { useState } from "react";
import { NavLink, useLocation } from "react-router-dom";
import { Calendar, Users, Activity, BarChart3, Settings, LogOut, Stethoscope, CalendarPlus, FileText, Bell, Search, ClipboardList, UserCheck, Receipt, DollarSign, Package, FolderOpen, ExternalLink, User, ShoppingCart, TrendingUp, UserPlus, MessageSquare, Wallet } from "lucide-react";
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
  url: "/new-appointment",
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
  const hasActiveInGroup = (items: typeof mainMenuItems) => items.some(item => isActive(item.url));
  const getNavClasses = (path: string) => {
    const baseClasses = "w-full justify-start transition-all duration-200 font-medium";
    if (isActive(path)) {
      return `${baseClasses} bg-sidebar-accent text-sidebar-primary border-r-4 border-sidebar-primary shadow-sm`;
    }
    return `${baseClasses} hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground`;
  };
  const filteredMainMenu = mainMenuItems.filter(item => 
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

  return <Sidebar side="right" className={`${collapsed ? "w-16" : "w-72"} transition-all duration-300 shadow-sidebar border-l border-sidebar-border shrink-0`} style={{
    background: 'var(--gradient-sidebar)'
  }} collapsible="icon">
      {/* Sidebar Header */}
      <SidebarHeader className="p-4 border-b border-sidebar-border/50">
        {!collapsed && <div className="flex items-center space-x-3 space-x-reverse">
            <div className="w-10 h-10 bg-sidebar-primary rounded-lg flex items-center justify-center">
              <Stethoscope className="w-5 h-5 text-sidebar-primary-foreground" />
            </div>
            <div className="flex-1">
              <h1 className="text-lg font-bold text-sidebar-foreground">فوردنتست</h1>
              <p className="text-xs text-sidebar-foreground/70">نظام إدارة العيادة</p>
            </div>
          </div>}
        {collapsed && <div className="w-10 h-10 bg-sidebar-primary rounded-lg flex items-center justify-center mx-auto">
            <Stethoscope className="w-5 h-5 text-sidebar-primary-foreground" />
          </div>}
      </SidebarHeader>

      <SidebarContent className="px-3 py-4">
        {/* Search */}
        {!collapsed && <div className="mb-4">
            <div className="relative">
              <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-sidebar-foreground/50" />
              <Input 
                placeholder="البحث في القائمة..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pr-10 bg-sidebar-background/50 border-sidebar-border/50 text-sidebar-foreground placeholder:text-sidebar-foreground/50"
              />
            </div>
          </div>}

        {/* Main Menu */}
        <SidebarGroup className="mb-4">
          {!collapsed && <SidebarGroupLabel className="text-sidebar-foreground/70 font-medium mb-2">
              القائمة الرئيسية
            </SidebarGroupLabel>}
          <SidebarGroupContent>
            <SidebarMenu className="space-y-1">
              {filteredMainMenu.map(item => {
              const Icon = item.icon;
              return <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild>
                      <NavLink to={item.url} className={getNavClasses(item.url)}>
                        <Icon className={`${collapsed ? "w-5 h-5" : "w-4 h-4 ml-3"}`} />
                        {!collapsed && <span>{item.title}</span>}
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>;
            })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Staff Management */}
        <SidebarGroup className="mb-4">
          {!collapsed && <SidebarGroupLabel className="text-sidebar-foreground/70 font-medium mb-2">
              إدارة الموظفين
            </SidebarGroupLabel>}
          <SidebarGroupContent>
            <SidebarMenu className="space-y-1">
              {filteredManagementMenu.map(item => {
              const Icon = item.icon;
              return <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild>
                      <NavLink to={item.url} className={getNavClasses(item.url)}>
                        <Icon className={`${collapsed ? "w-5 h-5" : "w-4 h-4 ml-3"}`} />
                        {!collapsed && <span>{item.title}</span>}
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>;
            })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Financial Management */}
        <SidebarGroup className="mb-4">
          {!collapsed && <SidebarGroupLabel className="text-sidebar-foreground/70 font-medium mb-2">
              الإدارة المالية
            </SidebarGroupLabel>}
          <SidebarGroupContent>
            <SidebarMenu className="space-y-1">
              {filteredFinancialMenu.map(item => {
              const Icon = item.icon;
              return <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild>
                      <NavLink to={item.url} className={getNavClasses(item.url)}>
                        <Icon className={`${collapsed ? "w-5 h-5" : "w-4 h-4 ml-3"}`} />
                        {!collapsed && <span>{item.title}</span>}
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>;
            })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Inventory Management */}
        <SidebarGroup className="mb-4">
          {!collapsed && <SidebarGroupLabel className="text-sidebar-foreground/70 font-medium mb-2">
              إدارة المخزون
            </SidebarGroupLabel>}
          <SidebarGroupContent>
            <SidebarMenu className="space-y-1">
              {filteredInventoryMenu.map(item => {
              const Icon = item.icon;
              return <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild>
                      <NavLink to={item.url} className={getNavClasses(item.url)}>
                        <Icon className={`${collapsed ? "w-5 h-5" : "w-4 h-4 ml-3"}`} />
                        {!collapsed && <span>{item.title}</span>}
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>;
            })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* System Management */}
        <SidebarGroup>
          {!collapsed && <SidebarGroupLabel className="text-sidebar-foreground/70 font-medium mb-2">
              إدارة النظام
            </SidebarGroupLabel>}
          <SidebarGroupContent>
            <SidebarMenu className="space-y-1">
              {filteredSystemMenu.map(item => {
              const Icon = item.icon;
              return <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild>
                      {item.external ? (
                        <a 
                          href={item.url} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className={`${getNavClasses(item.url)} text-blue-600 hover:text-blue-700`}
                        >
                          <Icon className={`${collapsed ? "w-5 h-5" : "w-4 h-4 ml-3"}`} />
                          {!collapsed && <span className="flex items-center gap-1">{item.title} <ExternalLink className="w-3 h-3" /></span>}
                        </a>
                      ) : (
                        <NavLink to={item.url} className={getNavClasses(item.url)}>
                          <Icon className={`${collapsed ? "w-5 h-5" : "w-4 h-4 ml-3"}`} />
                          {!collapsed && <span>{item.title}</span>}
                        </NavLink>
                      )}
                    </SidebarMenuButton>
                  </SidebarMenuItem>;
            })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      {/* Sidebar Footer */}
      <SidebarFooter className="p-4 border-t border-sidebar-border/50">
        {!collapsed && <div className="space-y-3">
            <div className="flex items-center space-x-3 space-x-reverse p-2 bg-sidebar-background/50 rounded-lg">
              <Avatar className="w-8 h-8">
                <AvatarFallback className="bg-sidebar-primary text-sidebar-primary-foreground text-sm">
                  د.ك
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-sidebar-foreground truncate">
                  د. كريم أحمد
                </p>
                <p className="text-xs text-sidebar-foreground/70 truncate">
                  طبيب أسنان
                </p>
              </div>
            </div>
            <Button 
              variant="ghost" 
              size="sm" 
              className="w-full justify-start text-sidebar-foreground hover:bg-sidebar-background/50"
              onClick={signOut}
            >
              <LogOut className="w-4 h-4 ml-2" />
              تسجيل الخروج
            </Button>
          </div>}
        {collapsed && <Button 
            variant="ghost" 
            size="sm" 
            className="w-full p-2 hover:bg-sidebar-background/50"
            onClick={signOut}
          >
            <LogOut className="w-4 h-4 text-sidebar-foreground" />
          </Button>}
      </SidebarFooter>
    </Sidebar>;
}
