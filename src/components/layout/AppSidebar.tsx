import { useState } from "react";
import { NavLink, useLocation } from "react-router-dom";
import { Calendar, Users, UserPlus, Activity, BarChart3, Settings, LogOut, Stethoscope, CalendarPlus, FileText, Bell, Search } from "lucide-react";
import { Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent, SidebarGroupLabel, SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarHeader, SidebarFooter, useSidebar } from "@/components/ui/sidebar";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
const mainMenuItems = [{
  title: "لوحة التحكم",
  url: "/",
  icon: BarChart3
}, {
  title: "المرضى",
  url: "/patients",
  icon: Users
}, {
  title: "إضافة مريض",
  url: "/add-patient",
  icon: UserPlus
}, {
  title: "المواعيد",
  url: "/appointments",
  icon: Calendar
}, {
  title: "موعد جديد",
  url: "/new-appointment",
  icon: CalendarPlus
}, {
  title: "العلاجات",
  url: "/treatments",
  icon: Activity
}];
const clinicMenuItems = [{
  title: "الإعدادات",
  url: "/settings",
  icon: Settings
}, {
  title: "التقارير",
  url: "/reports",
  icon: FileText
}, {
  title: "الإشعارات",
  url: "/notifications",
  icon: Bell
}];
export function AppSidebar() {
  const {
    state
  } = useSidebar();
  const collapsed = state === "collapsed";
  const location = useLocation();
  const currentPath = location.pathname;
  const [searchQuery, setSearchQuery] = useState("");
  const isActive = (path: string) => currentPath === path;
  const hasActiveInGroup = (items: typeof mainMenuItems) => items.some(item => isActive(item.url));
  const getNavClasses = (path: string) => {
    const baseClasses = "w-full justify-start transition-all duration-200 font-medium";
    if (isActive(path)) {
      return `${baseClasses} bg-sidebar-accent text-sidebar-primary border-r-4 border-sidebar-primary shadow-sm`;
    }
    return `${baseClasses} hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground`;
  };
  const filteredMainMenu = mainMenuItems.filter(item => item.title.toLowerCase().includes(searchQuery.toLowerCase()));
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

      <SidebarContent className="mx-[31px] my-0 py-[12px] px-[5px]">
        {/* Search */}
        {!collapsed && <div className="mb-4">
            <div className="relative">
              <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-sidebar-foreground/50" />
              <Input placeholder="البحث..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="pr-10 bg-sidebar-background/50 border-sidebar-border text-sidebar-foreground placeholder:text-sidebar-foreground/50" />
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

        {/* Clinic Management */}
        <SidebarGroup>
          {!collapsed && <SidebarGroupLabel className="text-sidebar-foreground/70 font-medium mb-2">
              إدارة العيادة
            </SidebarGroupLabel>}
          <SidebarGroupContent>
            <SidebarMenu className="space-y-1">
              {clinicMenuItems.map(item => {
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
            <Button variant="ghost" size="sm" className="w-full justify-start text-sidebar-foreground hover:bg-sidebar-background/50">
              <LogOut className="w-4 h-4 ml-2" />
              تسجيل الخروج
            </Button>
          </div>}
        {collapsed && <Button variant="ghost" size="sm" className="w-full p-2 hover:bg-sidebar-background/50">
            <LogOut className="w-4 h-4 text-sidebar-foreground" />
          </Button>}
      </SidebarFooter>
    </Sidebar>;
}