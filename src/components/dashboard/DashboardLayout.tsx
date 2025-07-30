import { useState } from "react";
import { Sidebar, SidebarContent, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { LogOut, Users, Calendar, LayoutDashboard, UserPlus } from "lucide-react";
import { cn } from "@/lib/utils";

interface DashboardLayoutProps {
  children: React.ReactNode;
  activeTab: string;
  onTabChange: (tab: string) => void;
}

const DashboardLayout = ({ children, activeTab, onTabChange }: DashboardLayoutProps) => {
  const { signOut } = useAuth();

  const navigation = [
    { id: 'overview', name: 'لوحة التحكم', icon: LayoutDashboard },
    { id: 'patients', name: 'إدارة المرضى', icon: Users },
    { id: 'appointments', name: 'الحجوزات', icon: Calendar },
    { id: 'add-patient', name: 'إضافة مريض', icon: UserPlus },
  ];

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        <Sidebar className="border-r border-border">
          <SidebarContent className="p-4">
            <div className="mb-8">
              <h2 className="text-2xl font-bold text-primary mb-2">فوردنتست</h2>
              <p className="text-sm text-muted-foreground">نظام إدارة العيادة</p>
            </div>
            
            <nav className="space-y-2">
              {navigation.map((item) => {
                const Icon = item.icon;
                return (
                  <Button
                    key={item.id}
                    variant={activeTab === item.id ? "default" : "ghost"}
                    className={cn(
                      "w-full justify-start text-right",
                      activeTab === item.id && "bg-primary text-primary-foreground"
                    )}
                    onClick={() => onTabChange(item.id)}
                  >
                    <Icon className="w-5 h-5 ml-2" />
                    {item.name}
                  </Button>
                );
              })}
            </nav>

            <div className="absolute bottom-4 left-4 right-4">
              <Button 
                variant="outline" 
                className="w-full justify-start text-right"
                onClick={signOut}
              >
                <LogOut className="w-4 h-4 ml-2" />
                تسجيل الخروج
              </Button>
            </div>
          </SidebarContent>
        </Sidebar>

        <div className="flex-1 flex flex-col">
          <header className="border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <div className="flex h-16 items-center px-6">
              <SidebarTrigger className="lg:hidden" />
              <div className="flex-1" />
            </div>
          </header>
          
          <main className="flex-1 p-6">
            {children}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
};

export default DashboardLayout;