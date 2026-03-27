import { memo, useState, useCallback } from "react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import { Home, Calendar, Users, DollarSign, Plus, UserPlus, CalendarPlus, X, Receipt } from "lucide-react";
import { cn } from "@/lib/utils";
import { prefetchRoute } from "@/App";
import { triggerHaptic } from "@/lib/haptics";
import { motion, AnimatePresence } from "framer-motion";

const leftItems = [
  { title: "الرئيسية", url: "/", icon: Home },
  { title: "المواعيد", url: "/appointments", icon: Calendar },
];

const rightItems = [
  { title: "المرضى", url: "/patients", icon: Users },
  { title: "المالية", url: "/financial-overview", icon: DollarSign },
];

const fabActions = [
  { title: "موعد جديد", path: "/appointments/new", icon: CalendarPlus, variant: "bg-primary text-primary-foreground" },
  { title: "مريض جديد", path: "/patients?new=true", icon: UserPlus, variant: "bg-accent text-accent-foreground" },
  { title: "فاتورة جديدة", path: "/invoice-management?new=true", icon: Receipt, variant: "bg-emerald-600 text-white dark:bg-emerald-500" },
];

export const MobileBottomNav = memo(() => {
  const location = useLocation();
  const navigate = useNavigate();
  const [fabOpen, setFabOpen] = useState(false);

  const toggleFab = useCallback(() => {
    triggerHaptic('medium');
    setFabOpen(prev => !prev);
  }, []);

  const handleAction = useCallback((path: string) => {
    triggerHaptic('light');
    setFabOpen(false);
    navigate(path);
  }, [navigate]);

  const renderNavItem = (item: typeof leftItems[0]) => {
    const active = location.pathname === item.url;
    return (
      <NavLink
        key={item.url}
        to={item.url}
        onClick={() => { !active && triggerHaptic('light'); setFabOpen(false); }}
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
  };

  return (
    <>
      {/* Backdrop */}
      <AnimatePresence>
        {fabOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm md:hidden"
            onClick={() => setFabOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* FAB Actions */}
      <AnimatePresence>
        {fabOpen && (
          <div className="fixed bottom-20 left-1/2 -translate-x-1/2 z-50 flex flex-col items-center gap-3 md:hidden">
            {fabActions.map((action, i) => (
              <motion.button
                key={action.path}
                initial={{ opacity: 0, y: 30, scale: 0.5 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 20, scale: 0.5 }}
                transition={{ duration: 0.2, delay: i * 0.05 }}
                onClick={() => handleAction(action.path)}
                className={cn("flex items-center gap-2.5 rounded-full px-5 py-3 shadow-lg", action.variant)}
              >
                <action.icon className="h-5 w-5" />
                <span className="text-sm font-medium">{action.title}</span>
              </motion.button>
            ))}
          </div>
        )}
      </AnimatePresence>

      {/* Bottom Nav */}
      <nav className="fixed bottom-0 inset-x-0 z-50 bg-background border-t border-border md:hidden"
        style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}
      >
        <div className="flex items-center justify-around h-16 relative">
          {leftItems.map(renderNavItem)}

          {/* Center FAB */}
          <div className="flex-1 flex items-center justify-center">
            <button
              onClick={toggleFab}
              className={cn(
                "absolute -top-6 w-14 h-14 rounded-full flex items-center justify-center shadow-lg transition-all duration-200",
                fabOpen
                  ? "bg-destructive text-destructive-foreground rotate-45"
                  : "bg-primary text-primary-foreground"
              )}
            >
              {fabOpen ? <X className="h-6 w-6 -rotate-45" /> : <Plus className="h-7 w-7" />}
            </button>
          </div>

          {rightItems.map(renderNavItem)}
        </div>
      </nav>
    </>
  );
});

MobileBottomNav.displayName = "MobileBottomNav";
