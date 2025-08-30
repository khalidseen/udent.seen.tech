import React from "react";
import { Outlet } from "react-router-dom";
import { AppSidebar } from "./AppSidebar";
import { useLanguage } from "@/contexts/LanguageContext";
import { cn } from "@/lib/utils";
import TopNavbar from "./TopNavbar";

export function MainLayout() {
  const { isRTL } = useLanguage();

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
          <Outlet />
        </div>
      </main>
    </div>
  );
}
