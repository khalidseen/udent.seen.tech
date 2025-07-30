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
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const location = useLocation();
  const currentPath = location.pathname;
  const [searchQuery, setSearchQuery] = useState("");

  const isActive = (path: string) => currentPath === path;

  const getNavClasses = (path: string) => {
    const baseClasses = "w-full justify-start transition-all duration-300 font-medium text-sm rounded-lg mx-1 my-0.5";
    if (isActive(path)) {
      return `${baseClasses} bg-primary/90 text-primary-foreground shadow-md border border-primary/20`;
    }
    return `${baseClasses} hover:bg-accent/80 hover:text-accent-foreground text-muted-foreground hover:shadow-sm`;
  };

  const filteredMainMenu = mainMenuItems.filter(item => 
    item.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <Sidebar 
      side="right" 
      className="w-80 border-l bg-white dark:bg-gray-950"
      collapsible="icon"
    >
      {/* Sidebar Header */}
      <SidebarHeader className="p-6 border-b border-border/40 bg-gradient-to-r from-primary/5 to-primary/10">
        {!collapsed ? (
          <div className="flex items-center space-x-4 space-x-reverse">
            <div className="w-12 h-12 bg-gradient-to-br from-primary to-primary/80 rounded-xl flex items-center justify-center shadow-lg">
              <Stethoscope className="w-6 h-6 text-primary-foreground" />
            </div>
            <div className="flex-1">
              <h1 className="text-xl font-bold text-foreground bg-gradient-to-r from-primary to-primary/80 bg-clip-text text-transparent">
                فوردنتست
              </h1>
              <p className="text-sm text-muted-foreground">نظام إدارة العيادة المتطور</p>
            </div>
          </div>
        ) : (
          <div className="w-12 h-12 bg-gradient-to-br from-primary to-primary/80 rounded-xl flex items-center justify-center mx-auto shadow-lg">
            <Stethoscope className="w-6 h-6 text-primary-foreground" />
          </div>
        )}
      </SidebarHeader>

      <SidebarContent className="px-4 py-6">
        {/* Search */}
        {!collapsed && (
          <div className="mb-6">
            <div className="relative">
              <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input 
                placeholder="البحث..." 
                value={searchQuery} 
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pr-10 bg-background/50 border-border/60 focus:border-primary/50 transition-all duration-200 rounded-lg"
              />
            </div>
          </div>
        )}

        {/* Main Menu */}
        <SidebarGroup className="mb-8">
          {!collapsed && (
            <SidebarGroupLabel className="text-muted-foreground font-semibold mb-4 text-xs uppercase tracking-wider px-2">
              القائمة الرئيسية
            </SidebarGroupLabel>
          )}
          <SidebarGroupContent>
            <SidebarMenu className="space-y-1">
              {filteredMainMenu.map((item) => {
                const Icon = item.icon;
                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild>
                      <NavLink to={item.url} className={getNavClasses(item.url)}>
                        <Icon className={`${collapsed ? "w-5 h-5" : "w-5 h-5 ml-3"} transition-all duration-200`} />
                        {!collapsed && <span className="font-medium">{item.title}</span>}
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Clinic Management */}
        <SidebarGroup>
          {!collapsed && (
            <SidebarGroupLabel className="text-muted-foreground font-semibold mb-4 text-xs uppercase tracking-wider px-2">
              إدارة العيادة
            </SidebarGroupLabel>
          )}
          <SidebarGroupContent>
            <SidebarMenu className="space-y-1">
              {clinicMenuItems.map((item) => {
                const Icon = item.icon;
                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild>
                      <NavLink to={item.url} className={getNavClasses(item.url)}>
                        <Icon className={`${collapsed ? "w-5 h-5" : "w-5 h-5 ml-3"} transition-all duration-200`} />
                        {!collapsed && <span className="font-medium">{item.title}</span>}
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      {/* Sidebar Footer */}
      <SidebarFooter className="p-4 border-t border-border/40 bg-gradient-to-r from-muted/30 to-muted/50">
        {!collapsed ? (
          <div className="space-y-4">
            <div className="flex items-center space-x-3 space-x-reverse p-3 bg-background/60 rounded-xl border border-border/40 shadow-sm">
              <Avatar className="w-10 h-10 ring-2 ring-primary/20">
                <AvatarFallback className="bg-gradient-to-br from-primary to-primary/80 text-primary-foreground font-semibold">
                  د.ك
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-foreground truncate">
                  د. كريم أحمد
                </p>
                <p className="text-xs text-muted-foreground truncate">
                  طبيب أسنان - مدير العيادة
                </p>
              </div>
            </div>
            <Button 
              variant="ghost" 
              size="sm" 
              className="w-full justify-start text-muted-foreground hover:text-foreground hover:bg-destructive/10 hover:text-destructive transition-all duration-200 rounded-lg"
            >
              <LogOut className="w-4 h-4 ml-2" />
              تسجيل الخروج
            </Button>
          </div>
        ) : (
          <Button 
            variant="ghost" 
            size="sm" 
            className="w-full p-3 hover:bg-destructive/10 hover:text-destructive transition-all duration-200 rounded-lg"
          >
            <LogOut className="w-5 h-5" />
          </Button>
        )}
      </SidebarFooter>
    </Sidebar>
  );
}