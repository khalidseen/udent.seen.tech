import { SidebarProvider, SidebarTrigger, SidebarInset } from "@/components/ui/sidebar";
import { AppSidebar } from "./AppSidebar";
import { NetworkStatusIndicator } from "@/components/ui/network-status";
import { NotificationCenter } from "@/components/notifications/NotificationCenter";
import { SmartNotificationSystem } from "@/components/notifications/SmartNotificationSystem";
import { GlobalSearch } from "./GlobalSearch";
import { DateTime } from "./DateTime";
import { UserProfile } from "./UserProfile";
import { FloatingActionMenu } from "./FloatingActionMenu";
import { LanguageToggle } from "@/components/ui/language-toggle";
import { useLanguage } from "@/contexts/LanguageContext";
import { Bell } from "lucide-react";
import { Button } from "@/components/ui/button";

interface MainLayoutProps {
  children: React.ReactNode;
}

export function MainLayout({ children }: MainLayoutProps) {
  const { isLTR } = useLanguage();
  
  return (
    <SidebarProvider defaultOpen={true}>
      <div className={`flex min-h-screen w-full ${isLTR ? 'flex-row' : 'flex-row-reverse'}`}>
        <AppSidebar />
        <SidebarInset className="flex-1">
          {/* Top Header */}
          <header className="h-16 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-40 w-full">
            <div className="container flex h-full items-center justify-between px-4">
              <div className={`flex items-center gap-4 ${isLTR ? '' : 'flex-row-reverse'}`}>
                <SidebarTrigger className={isLTR ? "mr-2" : "ml-2"} />
                <GlobalSearch />
              </div>
              
                <div className={`flex items-center gap-4 ${isLTR ? '' : 'flex-row-reverse'}`}>
                  <LanguageToggle />
                  <UserProfile />
                  <DateTime />
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
        
        {/* Floating Action Menu */}
        <FloatingActionMenu />
      </div>
    </SidebarProvider>
  );
}