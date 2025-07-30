import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "./AppSidebar";
import { Bell } from "lucide-react";
import { Button } from "@/components/ui/button";

interface MainLayoutProps {
  children: React.ReactNode;
}

export function MainLayout({ children }: MainLayoutProps) {
  return (
    <SidebarProvider defaultOpen={true}>
      <div className="min-h-screen flex w-full">
        {/* Main Content - takes available space */}
        <div className="flex-1 flex flex-col">
          {/* Header Bar */}
          <header className="sticky top-0 z-40 h-16 bg-white/95 dark:bg-gray-950/95 backdrop-blur supports-[backdrop-filter]:bg-white/60 dark:supports-[backdrop-filter]:bg-gray-950/60 border-b border-gray-200 dark:border-gray-800">
            <div className="container flex h-16 max-w-screen-2xl items-center justify-between px-4">
              <div className="flex items-center gap-4">
                <SidebarTrigger className="h-9 w-9" />
                <div className="flex flex-col">
                  <h1 className="text-lg font-semibold">نظام فوردنتست</h1>
                  <p className="text-sm text-muted-foreground">نظام إدارة العيادة المتطور</p>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="sm" className="relative">
                  <Bell className="h-4 w-4" />
                  <span className="absolute -top-1 -right-1 h-3 w-3 rounded-full bg-red-600 text-[10px] font-medium text-white flex items-center justify-center">
                    3
                  </span>
                </Button>
              </div>
            </div>
          </header>

          {/* Main Content Area */}
          <main className="flex-1 bg-gray-50/50 dark:bg-gray-950/50">
            <div className="container max-w-screen-2xl p-4 pb-8">
              {children}
            </div>
          </main>
        </div>

        {/* Sidebar */}
        <AppSidebar />
      </div>
    </SidebarProvider>
  );
}