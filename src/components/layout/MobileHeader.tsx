import { memo, useState } from "react";
import { Search, Bell, Moon, Sun } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useTheme } from "@/contexts/ThemeContext";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";

export const MobileHeader = memo(() => {
  const { theme, setTheme } = useTheme();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [showSearch, setShowSearch] = useState(false);

  const initials = user?.email?.charAt(0).toUpperCase() || "U";

  return (
    <header className="fixed top-0 inset-x-0 z-50 bg-background border-b border-border md:hidden">
      <div className="flex items-center justify-between h-14 px-4">
        {showSearch ? (
          <div className="flex-1 flex items-center gap-2">
            <Input
              autoFocus
              placeholder="بحث..."
              className="h-9 text-sm"
              onBlur={() => setShowSearch(false)}
            />
            <Button variant="ghost" size="icon" className="shrink-0 h-9 w-9" onClick={() => setShowSearch(false)}>
              <span className="text-xs">✕</span>
            </Button>
          </div>
        ) : (
          <>
            <h1 className="text-base font-bold text-foreground">🦷 DentaCare</h1>
            <div className="flex items-center gap-1">
              <Button variant="ghost" size="icon" className="h-9 w-9" onClick={() => setShowSearch(true)}>
                <Search className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="icon" className="h-9 w-9" onClick={() => setTheme(theme === "dark" ? "light" : "dark")}>
                {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
              </Button>
              <Button variant="ghost" size="icon" className="h-9 w-9" onClick={() => navigate("/advanced-notification-management")}>
                <Bell className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="icon" className="h-9 w-9" onClick={() => navigate("/settings")}>
                <Avatar className="h-7 w-7">
                  <AvatarFallback className="text-xs bg-primary text-primary-foreground">{initials}</AvatarFallback>
                </Avatar>
              </Button>
            </div>
          </>
        )}
      </div>
    </header>
  );
});

MobileHeader.displayName = "MobileHeader";
