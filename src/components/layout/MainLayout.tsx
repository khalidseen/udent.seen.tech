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
      <div className="min-h-screen flex w-full bg-background">
        {/* Main Content */}
        <main className="flex-1 flex flex-col">
          {/* Top Header */}
          <header className="h-16 border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-40">
            <div className="h-full px-6 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <SidebarTrigger className="hover:bg-accent hover:text-accent-foreground p-2 rounded-lg transition-colors" />
                <div>
                  <h2 className="text-lg font-semibold text-foreground">نظام فوردنتست</h2>
                  <p className="text-sm text-muted-foreground">نظام إدارة العيادة المتطور</p>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <Button variant="ghost" size="sm" className="relative">
                  <Bell className="w-4 h-4" />
                  <span className="absolute -top-1 -right-1 w-3 h-3 bg-destructive rounded-full text-xs text-destructive-foreground flex items-center justify-center">
                    3
                  </span>
                </Button>
              </div>
            </div>
          </header>
          
          {/* Page Content */}
          <div className="flex-1 p-6 overflow-auto">
            {children}
          </div>
        </main>

        {/* Sidebar - Positioned on the right */}
        <AppSidebar />
      </div>
    </SidebarProvider>
  );
}