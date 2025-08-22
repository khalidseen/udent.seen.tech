import { SidebarProvider, SidebarTrigger, SidebarInset } from "@/components/ui/sidebar";
import { AppSidebar } from "./AppSidebar";
import { NetworkStatusIndicator } from "@/components/ui/network-status";
import { NotificationCenter } from "@/components/notifications/NotificationCenter";
import { SmartNotificationSystem } from "@/components/notifications/SmartNotificationSystem";
import { GlobalSearch } from "./GlobalSearch";

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
          <header className="h-16 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-40 w-full">
            <div className="container flex h-full items-center justify-between px-4">
              <div className="flex items-center gap-4">
                <SidebarTrigger className="mr-2" />
                <GlobalSearch />
              </div>
              
              <div className="flex items-center gap-2">
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