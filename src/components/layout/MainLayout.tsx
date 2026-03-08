import { ReactNode, useState } from "react";
import { AppSidebarOptimized as AppSidebar } from "./AppSidebarOptimized";
import { TopNavbarOptimized as TopNavbar } from "./TopNavbarOptimized";
import { MobileHeader } from "./MobileHeader";
import { MobileBottomNav } from "./MobileBottomNav";
import { MobileMoreMenu } from "./MobileMoreMenu";
import { useSidebar } from "@/contexts/SidebarContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";

interface MainLayoutProps {
  children: ReactNode;
}

export const MainLayout = ({ children }: MainLayoutProps) => {
  const { isCollapsed } = useSidebar();
  const { isRTL } = useLanguage();
  const isMobile = useIsMobile();
  const [moreMenuOpen, setMoreMenuOpen] = useState(false);

  // Mobile layout
  if (isMobile) {
    return (
      <>
        <MobileHeader />
        <div className="min-h-screen bg-background pt-14 pb-20">
          {children}
        </div>
        <MobileBottomNav onMoreClick={() => setMoreMenuOpen(true)} />
        <MobileMoreMenu open={moreMenuOpen} onOpenChange={setMoreMenuOpen} />
      </>
    );
  }

  // Desktop layout
  return (
    <>
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
