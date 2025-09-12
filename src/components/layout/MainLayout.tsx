import React from "react";
import { Outlet } from "react-router-dom";
import { AppSidebar } from "./AppSidebar";
import { useLanguage } from "@/contexts/LanguageContext";
<<<<<<< HEAD
import { useSidebar } from "@/contexts/SidebarContext";
=======
>>>>>>> cbd682d36e862741c55b9e7b5d144f8de65c694a
import { cn } from "@/lib/utils";
import TopNavbar from "./TopNavbar";

export function MainLayout() {
  const { isRTL } = useLanguage();
<<<<<<< HEAD
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
=======

  return (
    <div className="min-h-screen bg-background flex">
      <AppSidebar />
      <main 
        className={cn(
          "flex-1 flex flex-col transition-all duration-300",
          isRTL ? "mr-[var(--sidebar-width)]" : "ml-[var(--sidebar-width)]"
        )}
      >
        <TopNavbar />
        <div className="flex-1 container py-6 px-4">
>>>>>>> cbd682d36e862741c55b9e7b5d144f8de65c694a
          <Outlet />
        </div>
      </main>
    </div>
  );
}
