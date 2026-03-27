import { ReactNode, useState } from "react";
import { AppSidebarOptimized as AppSidebar } from "./AppSidebarOptimized";
import { TopNavbarOptimized as TopNavbar } from "./TopNavbarOptimized";
import { MobileHeader } from "./MobileHeader";
import { MobileBottomNav } from "./MobileBottomNav";
import { MobileMoreMenu } from "./MobileMoreMenu";
import { useSidebar } from "@/contexts/SidebarContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { useIsMobile } from "@/hooks/use-mobile";
import { useMaintenanceMode } from "@/hooks/useMaintenanceMode";
import { cn } from "@/lib/utils";

interface MainLayoutProps {
  children: ReactNode;
}

export const MainLayout = ({ children }: MainLayoutProps) => {
  const { isCollapsed } = useSidebar();
  const { isRTL } = useLanguage();
  const isMobile = useIsMobile();
  const [moreMenuOpen, setMoreMenuOpen] = useState(false);
  const { isMaintenanceMode, isAdmin } = useMaintenanceMode();

  // Maintenance mode blocks non-admin users
  if (isMaintenanceMode && !isAdmin) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-6">
        <div className="text-center max-w-md space-y-4">
          <div className="mx-auto w-16 h-16 rounded-full bg-yellow-100 dark:bg-yellow-900/30 flex items-center justify-center">
            <svg className="w-8 h-8 text-yellow-600 dark:text-yellow-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold">النظام في وضع الصيانة</h1>
          <p className="text-muted-foreground">
            يقوم فريقنا حالياً بإجراء أعمال صيانة على النظام. يرجى المحاولة مرة أخرى لاحقاً.
          </p>
        </div>
      </div>
    );
  }

  // Mobile layout
  if (isMobile) {
    return (
      <>
        {isMaintenanceMode && isAdmin && (
          <div className="fixed top-0 left-0 right-0 z-[60] bg-yellow-500 text-yellow-950 text-center text-sm py-1 font-medium">
            ⚠ وضع الصيانة مفعّل — المستخدمون العاديون لا يمكنهم الوصول
          </div>
        )}
        <MobileHeader onMenuClick={() => setMoreMenuOpen(true)} />
        <div className={cn("min-h-screen bg-background pb-20", isMaintenanceMode && isAdmin ? "pt-20" : "pt-14")}>
          {children}
        </div>
        <MobileBottomNav />
        <MobileMoreMenu open={moreMenuOpen} onOpenChange={setMoreMenuOpen} />
      </>
    );
  }

  // Desktop layout
  return (
    <>
      {isMaintenanceMode && isAdmin && (
        <div className="fixed top-0 left-0 right-0 z-[60] bg-yellow-500 text-yellow-950 text-center text-sm py-1 font-medium">
          ⚠ وضع الصيانة مفعّل — المستخدمون العاديون لا يمكنهم الوصول
        </div>
      )}
      <AppSidebar />
      
      <div 
        className={cn(
          "fixed top-0 z-40 w-full transition-all duration-300",
          isRTL 
            ? (isCollapsed ? "right-[4.5rem]" : "right-64")
            : (isCollapsed ? "left-[4.5rem]" : "left-64")
        )}
        style={{
          width: isCollapsed ? "calc(100% - 4.5rem)" : "calc(100% - 16rem)"
        }}
      >
        <TopNavbar />
      </div>

      <div 
        className={cn(
          "min-h-screen bg-background pt-16 transition-all duration-300",
          isRTL 
            ? (isCollapsed ? "mr-[4.5rem]" : "mr-64")
            : (isCollapsed ? "ml-[4.5rem]" : "ml-64")
        )}
      >
        {children}
      </div>
    </>
  );
};
