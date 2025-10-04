import { ReactNode } from "react";
import { AppSidebar } from "./AppSidebar";
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
      <div 
        className={cn(
          "min-h-screen bg-background transition-all duration-300",
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
