import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "./AppSidebar";
import { Bell, Menu } from "lucide-react";
import { Button } from "@/components/ui/button";

interface MainLayoutProps {
  children: React.ReactNode;
}

export function MainLayout({ children }: MainLayoutProps) {
  return (
    <SidebarProvider defaultOpen={true}>
      <div className="sidebar-layout bg-background min-h-screen">
        {/* Sidebar - Fixed position on the right */}
        <AppSidebar />
        
        {/* Main Content Area with proper border and shadows */}
        <div className="flex-1 flex flex-col min-w-0 border-r border-border/60 bg-background">
          {/* Top Header with enhanced styling */}
          <header className="h-16 border-b border-border/60 bg-white/80 dark:bg-card/50 backdrop-blur-sm sticky top-0 z-40 shrink-0 shadow-sm">
            <div className="h-full px-6 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <SidebarTrigger className="hover:bg-accent hover:text-accent-foreground p-2 rounded-lg transition-all duration-200 shadow-sm border border-border/40" />
                <div>
                  <h2 className="text-lg font-semibold text-foreground tracking-tight">نظام فوردنتست</h2>
                  <p className="text-sm text-muted-foreground">نظام إدارة العيادة المتطور</p>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <Button variant="ghost" size="sm" className="relative hover:bg-accent/60 transition-all duration-200">
                  <Bell className="w-4 h-4" />
                  <span className="absolute -top-1 -right-1 w-3 h-3 bg-destructive rounded-full text-xs text-destructive-foreground flex items-center justify-center animate-pulse">
                    3
                  </span>
                </Button>
              </div>
            </div>
          </header>
          
          {/* Page Content with enhanced background and spacing */}
          <main className="flex-1 p-6 overflow-auto bg-gradient-to-br from-background via-background to-muted/30 min-h-0">
            <div className="max-w-full mx-auto">
              {children}
            </div>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}