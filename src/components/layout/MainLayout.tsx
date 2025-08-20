import { SidebarProvider, SidebarTrigger, SidebarInset } from "@/components/ui/sidebar";
import { AppSidebar } from "./AppSidebar";
import { NetworkStatusIndicator } from "@/components/ui/network-status";
import { NotificationCenter } from "@/components/notifications/NotificationCenter";
import { SmartNotificationSystem } from "@/components/notifications/SmartNotificationSystem";

interface MainLayoutProps {
  children: React.ReactNode;
}

export function MainLayout({ children }: MainLayoutProps) {
  return (
    <SidebarProvider defaultOpen={true}>
      <div className="flex min-h-screen w-full">
        <AppSidebar />
        <SidebarInset className="flex-1">
          {/* Top Header */}
          <header className="h-16 border-b border-border/60 bg-white/80 dark:bg-card/50 backdrop-blur-sm sticky top-0 z-40 shrink-0 shadow-sm">
            <div className="h-full px-6 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <SidebarTrigger className="hover:bg-accent hover:text-accent-foreground p-2 rounded-lg transition-all duration-200 shadow-sm border border-border/40" />
              </div>
              
              <div className="flex items-center gap-3">
                <NetworkStatusIndicator />
                <NotificationCenter />
              </div>
            </div>
          </header>
          
          <SmartNotificationSystem />
          
          {/* Page Content */}
          <main className="flex-1 px-6 py-6 overflow-auto bg-gradient-to-br from-background via-background to-muted/30">
            <div className="max-w-full mx-auto">
              {children}
            </div>
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}