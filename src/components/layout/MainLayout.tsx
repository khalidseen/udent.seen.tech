import React from "react";
import { Outlet } from "react-router-dom";
import { AppSidebar } from "./AppSidebar";
import { useLanguage } from "@/contexts/LanguageContext";
import { useSidebar } from "@/contexts/SidebarContext";
import { cn } from "@/lib/utils";
import TopNavbar from "./TopNavbar";

export function MainLayout() {
  const { isRTL } = useLanguage();
  const { isCollapsed } = useSidebar();

  return (
    <div className="min-h-screen bg-background flex" dir={isRTL ? "rtl" : "ltr"}>
      <AppSidebar />
      <main 
        className={cn(
          "flex-1 flex flex-col transition-all duration-300 min-h-screen",
          isRTL ? "mr-64" : "ml-64",
          isCollapsed && (isRTL ? "mr-[4.5rem]" : "ml-[4.5rem]")
        )}
      >
        <TopNavbar />
        <div className="flex-1 p-6 overflow-auto">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
