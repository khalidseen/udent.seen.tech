import { ReactNode } from "react";
import { AppSidebarOptimized as AppSidebar } from "./AppSidebarOptimized";
import { TopNavbarOptimized as TopNavbar } from "./TopNavbarOptimized";
import { useSidebar } from "@/contexts/SidebarContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { cn } from "@/lib/utils";

interface MainLayoutProps {
  children: ReactNode;
}

export const MainLayout = ({ children }: MainLayoutProps) => {
  const { isCollapsed } = useSidebar();
  const { isRTL } = useLanguage();

  return (
    <>
      <AppSidebar />
      
      {/* الشريط العلوي */}
      <div 
        className={cn(
          "fixed top-0 z-40 w-full transition-all duration-300",
          isRTL 
            ? (isCollapsed ? "right-[4.5rem]" : "right-64")
            : (isCollapsed ? "left-[4.5rem]" : "left-64")
        )}
        style={{
          width: isRTL 
            ? (isCollapsed ? "calc(100% - 4.5rem)" : "calc(100% - 16rem)")
            : (isCollapsed ? "calc(100% - 4.5rem)" : "calc(100% - 16rem)")
        }}
      >
        <TopNavbar />
      </div>

      {/* المحتوى الرئيسي */}
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
