import { useState, useEffect } from "react";
import { Plus, UserPlus, Calendar, FileText, CreditCard, X, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useNavigate } from "react-router-dom";
import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";
import { offlineSupabase } from "@/lib/offline-supabase";

interface FloatingActionMenuProps {
  className?: string;
}

export function FloatingActionMenu({ className }: FloatingActionMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isHidden, setIsHidden] = useState(false);
  const [upcomingCount, setUpcomingCount] = useState(0);
  const [invoicesCount, setInvoicesCount] = useState(0);
  const navigate = useNavigate();
  const isMobile = useIsMobile();

  // Load hidden state from localStorage
  useEffect(() => {
    const hidden = localStorage.getItem("floatingMenu:hidden");
    if (hidden === "true") {
      setIsHidden(true);
    }
  }, []);

  // Fetch upcoming appointments and pending invoices
  useEffect(() => {
    const fetchCounts = async () => {
      try {
        // Get today's appointments
        const today = new Date().toISOString().split('T')[0];
        const appointmentsResult = await offlineSupabase.select('appointments', {
          filter: { appointment_date: today }
        });
        
        // Filter by status locally
        const todayAppointments = appointmentsResult.data?.filter(
          (apt: any) => apt.status === 'scheduled' || apt.status === 'confirmed'
        ) || [];
        
        setUpcomingCount(todayAppointments.length);

        // Get pending invoices
        const invoicesResult = await offlineSupabase.select('invoices', {
          filter: { status: 'pending' }
        });
        
        setInvoicesCount(invoicesResult.data?.length || 0);
      } catch (error) {
        console.error("Error fetching counts:", error);
      }
    };

    fetchCounts();
    // Refresh counts every minute
    const interval = setInterval(fetchCounts, 60000);
    return () => clearInterval(interval);
  }, []);

  const toggleHidden = () => {
    const newHidden = !isHidden;
    setIsHidden(newHidden);
    localStorage.setItem("floatingMenu:hidden", newHidden.toString());
    if (newHidden) {
      setIsOpen(false);
    }
  };

  const handleNavigation = (path: string) => {
    setIsOpen(false);
    navigate(path);
  };

  if (isHidden) {
    return (
      <div className={cn(
        "fixed bottom-4 z-[9999] transition-all duration-300",
        isMobile ? "left-4" : "right-4",
        className
      )}>
        <Button
          onClick={toggleHidden}
          size="icon"
          className="h-12 w-12 rounded-full bg-primary/90 hover:bg-primary shadow-[var(--shadow-elegant)] backdrop-blur-sm"
        >
          <ChevronUp className="h-5 w-5" />
        </Button>
      </div>
    );
  }

  return (
    <div className={cn(
      "fixed bottom-4 z-[9999] transition-all duration-300",
      isMobile ? "left-4" : "right-4",
      className
    )}>
      {/* Menu Items */}
      <div className={cn(
        "flex flex-col gap-3 mb-4 transition-all duration-500 ease-out",
        isOpen 
          ? "opacity-100 transform translate-y-0 pointer-events-auto" 
          : "opacity-0 transform translate-y-8 pointer-events-none"
      )}>
        {/* Hide Button */}
        <div className="relative">
          <Button
            onClick={toggleHidden}
            size="icon"
            variant="outline"
            className="h-12 w-12 rounded-full bg-background/90 hover:bg-accent/90 shadow-[var(--shadow-card)] backdrop-blur-sm border-border/40"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Today's Appointments */}
        <div className="relative group">
          <Button
            onClick={() => handleNavigation('/appointments')}
            size="icon"
            variant="outline"
            className="h-12 w-12 rounded-full bg-background/90 hover:bg-accent/90 shadow-[var(--shadow-card)] backdrop-blur-sm border-border/40 transition-all duration-200 hover:scale-105"
          >
            <Calendar className="h-5 w-5" />
          </Button>
          {upcomingCount > 0 && (
            <Badge 
              variant="destructive" 
              className="absolute -top-2 -right-2 h-6 w-6 rounded-full p-0 flex items-center justify-center text-xs animate-pulse-subtle"
            >
              {upcomingCount}
            </Badge>
          )}
          <div className="absolute right-full mr-3 top-1/2 -translate-y-1/2 bg-foreground text-background px-3 py-2 rounded-lg text-sm opacity-0 group-hover:opacity-100 transition-all duration-200 whitespace-nowrap pointer-events-none z-[10000] shadow-lg">
            مواعيد اليوم ({upcomingCount})
          </div>
        </div>

        {/* Add Patient */}
        <div className="relative group">
          <Button
            onClick={() => handleNavigation('/patients')}
            size="icon"
            variant="outline"
            className="h-12 w-12 rounded-full bg-background/90 hover:bg-accent/90 shadow-[var(--shadow-card)] backdrop-blur-sm border-border/40 transition-all duration-200 hover:scale-105"
          >
            <UserPlus className="h-5 w-5" />
          </Button>
          <div className="absolute right-full mr-3 top-1/2 -translate-y-1/2 bg-foreground text-background px-3 py-2 rounded-lg text-sm opacity-0 group-hover:opacity-100 transition-all duration-200 whitespace-nowrap pointer-events-none z-[10000] shadow-lg">
            إضافة مريض
          </div>
        </div>

        {/* Add Appointment */}
        <div className="relative group">
          <Button
            onClick={() => handleNavigation('/new-appointment')}
            size="icon"
            variant="outline"
            className="h-12 w-12 rounded-full bg-background/90 hover:bg-accent/90 shadow-[var(--shadow-card)] backdrop-blur-sm border-border/40 transition-all duration-200 hover:scale-105"
          >
            <Calendar className="h-5 w-5" />
          </Button>
          <div className="absolute right-full mr-3 top-1/2 -translate-y-1/2 bg-foreground text-background px-3 py-2 rounded-lg text-sm opacity-0 group-hover:opacity-100 transition-all duration-200 whitespace-nowrap pointer-events-none z-[10000] shadow-lg">
            موعد جديد
          </div>
        </div>

        {/* Invoices */}
        <div className="relative group">
          <Button
            onClick={() => handleNavigation('/invoices')}
            size="icon"
            variant="outline"
            className="h-12 w-12 rounded-full bg-background/90 hover:bg-accent/90 shadow-[var(--shadow-card)] backdrop-blur-sm border-border/40 transition-all duration-200 hover:scale-105"
          >
            <FileText className="h-5 w-5" />
          </Button>
          {invoicesCount > 0 && (
            <Badge 
              variant="secondary" 
              className="absolute -top-2 -right-2 h-6 w-6 rounded-full p-0 flex items-center justify-center text-xs animate-pulse-subtle"
            >
              {invoicesCount}
            </Badge>
          )}
          <div className="absolute right-full mr-3 top-1/2 -translate-y-1/2 bg-foreground text-background px-3 py-2 rounded-lg text-sm opacity-0 group-hover:opacity-100 transition-all duration-200 whitespace-nowrap pointer-events-none z-[10000] shadow-lg">
            الفواتير ({invoicesCount})
          </div>
        </div>

        {/* Payments */}
        <div className="relative group">
          <Button
            onClick={() => handleNavigation('/payments')}
            size="icon"
            variant="outline"
            className="h-12 w-12 rounded-full bg-background/90 hover:bg-accent/90 shadow-[var(--shadow-card)] backdrop-blur-sm border-border/40 transition-all duration-200 hover:scale-105"
          >
            <CreditCard className="h-5 w-5" />
          </Button>
          <div className="absolute right-full mr-3 top-1/2 -translate-y-1/2 bg-foreground text-background px-3 py-2 rounded-lg text-sm opacity-0 group-hover:opacity-100 transition-all duration-200 whitespace-nowrap pointer-events-none z-[10000] shadow-lg">
            المدفوعات
          </div>
        </div>
      </div>

      {/* Main Toggle Button */}
      <Button
        onClick={() => setIsOpen(!isOpen)}
        size="icon"
        className={cn(
          "h-14 w-14 rounded-full transition-all duration-300 shadow-[var(--shadow-elegant)] backdrop-blur-sm",
          "bg-gradient-to-br from-primary via-primary to-primary/90",
          "hover:shadow-[var(--shadow-elegant)] hover:scale-110",
          isOpen && "rotate-45"
        )}
      >
        <Plus className="h-6 w-6 text-primary-foreground" />
      </Button>

      {/* Background overlay when open (mobile only) */}
      {isOpen && isMobile && (
        <div 
          className="fixed inset-0 bg-black/20 backdrop-blur-sm -z-10"
          onClick={() => setIsOpen(false)}
        />
      )}
    </div>
  );
}