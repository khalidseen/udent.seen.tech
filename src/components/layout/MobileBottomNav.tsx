import { memo } from "react";
import { NavLink, useLocation } from "react-router-dom";
import { Home, Calendar, Users, DollarSign, MoreHorizontal } from "lucide-react";
import { cn } from "@/lib/utils";
import { prefetchRoute } from "@/App";
import { triggerHaptic } from "@/lib/haptics";

interface MobileBottomNavProps {
  onMoreClick: () => void;
}

const navItems = [
  { title: "الرئيسية", url: "/", icon: Home },
  { title: "المواعيد", url: "/appointments", icon: Calendar },
  { title: "المرضى", url: "/patients", icon: Users },
  { title: "المالية", url: "/financial-overview", icon: DollarSign },
];

export const MobileBottomNav = memo<MobileBottomNavProps>(({ onMoreClick }) => {
  const location = useLocation();

  return (
    <nav className="fixed bottom-0 inset-x-0 z-50 bg-background border-t border-border md:hidden"
      style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}
    >
      <div className="flex items-center justify-around h-16">
        {navItems.map((item) => {
          const active = location.pathname === item.url;
          return (
            <NavLink
              key={item.url}
              to={item.url}
              onClick={() => !active && triggerHaptic('light')}
              onMouseEnter={() => prefetchRoute(item.url)}
              className={cn(
                "flex flex-col items-center justify-center gap-0.5 flex-1 h-full text-[10px] font-medium transition-colors",
                active ? "text-primary" : "text-muted-foreground"
              )}
            >
              <item.icon className={cn("h-5 w-5", active && "text-primary")} />
              <span>{item.title}</span>
              {active && (
                <div className="absolute top-0 h-0.5 w-8 bg-primary rounded-b-full" />
              )}
            </NavLink>
          );
        })}
        <button
          onClick={() => { triggerHaptic('medium'); onMoreClick(); }}
          className="flex flex-col items-center justify-center gap-0.5 flex-1 h-full text-[10px] font-medium text-muted-foreground transition-colors"
        >
          <MoreHorizontal className="h-5 w-5" />
          <span>المزيد</span>
        </button>
      </div>
    </nav>
  );
});

MobileBottomNav.displayName = "MobileBottomNav";
