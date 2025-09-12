import { useState, useEffect } from "react";
import { Plus, UserPlus, Calendar, FileText, CreditCard, X, ChevronUp, ChevronDown } from "lucide-react";
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
      <Button
        onClick={toggleHidden}
        size="icon"
        className="fixed bottom-2 right-4 z-[9999] h-8 w-8 rounded-full bg-primary/90 hover:bg-primary shadow-[var(--shadow-elegant)] backdrop-blur-sm"
      >
        <ChevronUp className="h-4 w-4" />
      </Button>
    );
  }

  return (
    <>
      {/* Bottom Bar */}
      <div className={cn(
        "fixed bottom-0 left-0 right-0 z-[9999] bg-background/95 backdrop-blur-sm border-t border-border shadow-lg transition-all duration-300",
        className
      )}>
        {/* Hide/Show Toggle */}
        <Button
          onClick={toggleHidden}
          size="icon"
          variant="ghost"
          className="absolute -top-8 right-4 h-8 w-8 rounded-t-lg bg-background/90 border border-b-0 border-border hover:bg-accent"
        >
          <ChevronDown className="h-4 w-4" />
        </Button>

        {/* Scrollable Button Container */}
        <div className="overflow-x-auto scrollbar-hide">
          <div className="flex items-center gap-3 px-4 py-3 min-w-max">
            
            {/* Today's Appointments */}
            <div className="relative group">
              <Button
                onClick={() => handleNavigation('/appointments')}
                variant="outline"
                className="flex-shrink-0 flex flex-col items-center justify-center min-w-16 h-16 bg-muted/50 hover:bg-muted text-foreground rounded-xl transition-all duration-200 hover:scale-105 p-2"
              >
                <Calendar className="w-5 h-5 mb-1" />
                <span className="text-xs font-medium text-center leading-tight">
                  المواعيد
                </span>
                {upcomingCount > 0 && (
                  <Badge 
                    variant="destructive" 
                    className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs"
                  >
                    {upcomingCount}
                  </Badge>
                )}
              </Button>
              {/* Tooltip */}
              <div className="absolute bottom-full mb-2 left-1/2 transform -translate-x-1/2 bg-foreground text-background px-2 py-1 rounded text-xs opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap pointer-events-none">
                مواعيد اليوم ({upcomingCount})
              </div>
            </div>

            {/* Add Patient */}
            <div className="relative group">
              <Button
                onClick={() => handleNavigation('/patients')}
                variant="outline"
                className="flex-shrink-0 flex flex-col items-center justify-center min-w-16 h-16 bg-muted/50 hover:bg-muted text-foreground rounded-xl transition-all duration-200 hover:scale-105 p-2"
              >
                <UserPlus className="w-5 h-5 mb-1" />
                <span className="text-xs font-medium text-center leading-tight">
                  مريض جديد
                </span>
              </Button>
              <div className="absolute bottom-full mb-2 left-1/2 transform -translate-x-1/2 bg-foreground text-background px-2 py-1 rounded text-xs opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap pointer-events-none">
                إضافة مريض
              </div>
            </div>

            {/* Add Appointment */}
            <div className="relative group">
              <Button
                onClick={() => handleNavigation('/new-appointment')}
                variant="outline"
                className="flex-shrink-0 flex flex-col items-center justify-center min-w-16 h-16 bg-muted/50 hover:bg-muted text-foreground rounded-xl transition-all duration-200 hover:scale-105 p-2"
              >
                <Plus className="w-5 h-5 mb-1" />
                <span className="text-xs font-medium text-center leading-tight">
                  موعد جديد
                </span>
              </Button>
              <div className="absolute bottom-full mb-2 left-1/2 transform -translate-x-1/2 bg-foreground text-background px-2 py-1 rounded text-xs opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap pointer-events-none">
                حجز موعد جديد
              </div>
            </div>

            {/* Invoices */}
            <div className="relative group">
              <Button
                onClick={() => handleNavigation('/invoices')}
                variant="outline"
                className="flex-shrink-0 flex flex-col items-center justify-center min-w-16 h-16 bg-muted/50 hover:bg-muted text-foreground rounded-xl transition-all duration-200 hover:scale-105 p-2"
              >
                <FileText className="w-5 h-5 mb-1" />
                <span className="text-xs font-medium text-center leading-tight">
                  الفواتير
                </span>
                {invoicesCount > 0 && (
                  <Badge 
                    variant="secondary" 
                    className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs"
                  >
                    {invoicesCount}
                  </Badge>
                )}
              </Button>
              <div className="absolute bottom-full mb-2 left-1/2 transform -translate-x-1/2 bg-foreground text-background px-2 py-1 rounded text-xs opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap pointer-events-none">
                الفواتير ({invoicesCount})
              </div>
            </div>

            {/* Payments */}
            <div className="relative group">
              <Button
                onClick={() => handleNavigation('/payments')}
                variant="outline"
                className="flex-shrink-0 flex flex-col items-center justify-center min-w-16 h-16 bg-muted/50 hover:bg-muted text-foreground rounded-xl transition-all duration-200 hover:scale-105 p-2"
              >
                <CreditCard className="w-5 h-5 mb-1" />
                <span className="text-xs font-medium text-center leading-tight">
                  المدفوعات
                </span>
              </Button>
              <div className="absolute bottom-full mb-2 left-1/2 transform -translate-x-1/2 bg-foreground text-background px-2 py-1 rounded text-xs opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap pointer-events-none">
                المدفوعات
              </div>
            </div>

            {/* Scroll indicator */}
            <div className="flex-shrink-0 w-2 h-16 flex items-center justify-center">
              <div className="w-1 h-8 bg-gradient-to-b from-transparent via-border to-transparent rounded-full" />
            </div>
          </div>
        </div>
      </div>
    </>
  );
}