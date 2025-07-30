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
      <div className="flex w-full min-h-screen bg-background">
        {/* Main Content Area - takes all space and adjusts margins */}
        <div className="w-full flex flex-col min-h-screen">
          {/* Top Header - fixed height, spans available width */}
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
          
          {/* Content Area - adjusts based on sidebar state */}
          <div className="flex-1 flex">
            {/* Main Content */}
            <main className="flex-1 overflow-auto bg-gradient-to-br from-background via-background to-muted/30 min-h-0">
              {children}
            </main>
            
            {/* Sidebar - positioned in layout flow */}
            <AppSidebar />
          </div>
        </div>
      </div>
    </SidebarProvider>
  );
}