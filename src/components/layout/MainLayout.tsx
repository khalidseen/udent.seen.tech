import { ReactNode } from "react";
import { AppSidebar } from "./AppSidebar";
import { useSidebar } from "@/contexts/SidebarContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/hooks/useAuth";
import { NotificationCenter } from "@/components/notifications/NotificationCenter";
import { GlobalSearch } from "./GlobalSearch";
import { DateTime } from "./DateTime";
import { Button } from "@/components/ui/button";
import { Bell, Search } from "lucide-react";
import { cn } from "@/lib/utils";

interface MainLayoutProps {
  children: ReactNode;
}

export const MainLayout = ({ children }: MainLayoutProps) => {
  const { isCollapsed } = useSidebar();
  const { isRTL } = useLanguage();
  const { user } = useAuth();

  return (
    <>
      <AppSidebar />
      
      {/* الشريط العلوي */}
      <div 
        className={cn(
          "fixed top-0 z-40 h-16 bg-background border-b border-border flex items-center justify-between px-6 transition-all duration-300",
          isRTL 
            ? (isCollapsed ? "right-[4.5rem] left-0" : "right-64 left-0")
            : (isCollapsed ? "left-[4.5rem] right-0" : "left-64 right-0")
        )}
      >
        <div className="flex items-center gap-4">
          <GlobalSearch />
        </div>
        
        <div className="flex items-center gap-4">
          <DateTime />
          <NotificationCenter />
        </div>
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
