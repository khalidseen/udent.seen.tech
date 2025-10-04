import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Bell, Moon, Sun, User, ChevronDown, Plus, Minus, RotateCcw, Calendar,
  Search, BarChart3, Zap, UserPlus, FileText, AlertCircle, Wifi, WifiOff,
  Building2, Check, Shield, X
} from "lucide-react";
import { useTheme } from "@/contexts/ThemeContext";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/hooks/useAuth";
import { usePermissions } from "@/hooks/usePermissions";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { ar } from "date-fns/locale";
import { ClinicSwitcher } from "../clinic/ClinicSwitcher";

interface UpcomingAppointment {
  id: string;
  patient_name: string;
  appointment_date: string;
  treatment_type: string;
}

interface SearchResult {
  id: string;
  type: 'patient' | 'appointment' | 'treatment' | 'invoice' | 'medication' | 'user';
  title: string;
  subtitle?: string;
  description?: string;
  url: string;
  icon: string;
}

interface UserProfile {
  full_name: string;
  role: string;
}

export function TopNavbar() {
  const { t, language } = useLanguage();
  const { theme, setTheme } = useTheme();
  const { user, signOut } = useAuth();
  const { hasPermission, getPrimaryRole } = usePermissions();
  const [upcomingAppointments, setUpcomingAppointments] = useState<UpcomingAppointment[]>([]);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [zoomLevel, setZoomLevel] = useState(100);
  const [currentDate, setCurrentDate] = useState(new Date());
  
  // New state additions
  const [currentTime, setCurrentTime] = useState(new Date());
  const [connectionStatus, setConnectionStatus] = useState({
    online: navigator.onLine,
    dbConnected: true,
    lastSync: new Date()
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isSearchDialogOpen, setIsSearchDialogOpen] = useState(false);
  
  // Get clinic ID from user profile
  const [clinicId, setClinicId] = useState<string | null>(null);
  
  // Fetch clinic ID
  useEffect(() => {
    const fetchClinicId = async () => {
      if (user) {
        const { data } = await supabase
          .from('profiles')
          .select('clinic_id')
          .eq('user_id', user.id)
          .single();
        setClinicId(data?.clinic_id || null);
      }
    };
    fetchClinicId();
  }, [user]);

  // Update current date every minute
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentDate(new Date());
    }, 60000);

    return () => clearInterval(timer);
  }, []);

  // Update current time every second
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Monitor connection status
  useEffect(() => {
    const handleOnline = () => setConnectionStatus(prev => ({ ...prev, online: true }));
    const handleOffline = () => setConnectionStatus(prev => ({ ...prev, online: false }));
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Fetch today's statistics
  // Optimized: Fetch today's statistics using useQuery with minimal data
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const { data: todayStats } = useQuery({
    queryKey: ['today-stats', clinicId],
    queryFn: async () => {
      const todayStr = today.toISOString().split('T')[0];
      
      try {
        const { data: appointments } = await supabase
          .from('appointments')
          .select('status')
          .gte('appointment_date', `${todayStr}T00:00:00`)
          .lt('appointment_date', `${todayStr}T23:59:59`);
        
        if (appointments) {
          return {
            totalAppointments: appointments.length,
            completedAppointments: appointments.filter(apt => apt.status === 'completed').length,
            pendingAppointments: appointments.filter(apt => apt.status === 'scheduled').length,
            totalRevenue: 0
          };
        }
        return {
          totalAppointments: 0,
          completedAppointments: 0,
          pendingAppointments: 0,
          totalRevenue: 0
        };
      } catch (error) {
        console.error('Error fetching today stats:', error);
        return {
          totalAppointments: 0,
          completedAppointments: 0,
          pendingAppointments: 0,
          totalRevenue: 0
        };
      }
    },
    enabled: !!clinicId,
    staleTime: 3 * 60 * 1000, // 3 minutes
    refetchInterval: 5 * 60 * 1000, // Refetch every 5 minutes
  });

  // Zoom control functions
  const handleZoomIn = () => {
    const newZoom = Math.min(zoomLevel + 10, 200);
    setZoomLevel(newZoom);
    document.body.style.zoom = `${newZoom}%`;
  };

  const handleZoomOut = () => {
    const newZoom = Math.max(zoomLevel - 10, 50);
    setZoomLevel(newZoom);
    document.body.style.zoom = `${newZoom}%`;
  };

  const handleZoomReset = () => {
    setZoomLevel(100);
    document.body.style.zoom = "100%";
  };

  const getZoomText = () => {
    if (zoomLevel < 90) return "صغير";
    if (zoomLevel > 110) return "كبير";
    return "عادي";
  };

  const handleRefresh = () => {
    window.location.reload();
  };

  // Global search across all data
  const performGlobalSearch = async (query: string) => {
    if (!query.trim() || query.length < 2) {
      setSearchResults([]);
      return;
    }

    setIsSearching(true);
    
    try {
      const results: SearchResult[] = [];
      const searchTerm = query.toLowerCase();

      // Search patients
      const { data: patients } = await supabase
        .from('patients')
        .select('id, full_name, phone, email')
        .or(`full_name.ilike.%${searchTerm}%, phone.ilike.%${searchTerm}%, email.ilike.%${searchTerm}%`)
        .limit(10);

      patients?.forEach(patient => {
        results.push({
          id: patient.id,
          type: 'patient',
          title: patient.full_name,
          subtitle: patient.phone,
          description: patient.email,
          url: `/patients/${patient.id}`,
          icon: '👤'
        });
      });

      // Search appointments
      const { data: appointments } = await supabase
        .from('appointments')
        .select(`
          id, 
          appointment_date, 
          treatment_type, 
          status,
          patients!inner(full_name, phone)
        `)
        .or(`treatment_type.ilike.%${searchTerm}%, patients.full_name.ilike.%${searchTerm}%`)
        .limit(10);

      appointments?.forEach(appointment => {
        results.push({
          id: appointment.id,
          type: 'appointment',
          title: `موعد - ${(appointment.patients as { full_name: string })?.full_name}`,
          subtitle: appointment.treatment_type,
          description: `📅 ${format(new Date(appointment.appointment_date), 'PP', { locale: ar })}`,
          url: `/appointments/${appointment.id}`,
          icon: '📅'
        });
      });

      // Search invoices
      const { data: invoices } = await supabase
        .from('invoices')
        .select(`
          id, 
          invoice_number, 
          total_amount,
          status,
          patients!inner(full_name)
        `)
        .or(`invoice_number.ilike.%${searchTerm}%, patients.full_name.ilike.%${searchTerm}%`)
        .limit(10);

      invoices?.forEach(invoice => {
        let patientName = 'مريض';
        try {
          if (invoice.patients && typeof invoice.patients === 'object') {
            patientName = (invoice.patients as any).full_name || 'مريض';
          }
        } catch (e) {
          patientName = 'مريض';
        }
        
        results.push({
          id: invoice.id,
          type: 'invoice',
          title: `فاتورة #${invoice.invoice_number}`,
          subtitle: patientName,
          description: `💰 ${invoice.total_amount} ريال`,
          url: `/invoices/${invoice.id}`,
          icon: '🧾'
        });
      });

      setSearchResults(results);
    } catch (error) {
      console.error('خطأ في البحث:', error);
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchQuery && isSearchDialogOpen) {
        performGlobalSearch(searchQuery);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery, isSearchDialogOpen]);

  // Keyboard shortcuts for search
  useEffect(() => {
    const handleKeydown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setIsSearchDialogOpen(true);
      }
      if (e.key === 'Escape' && isSearchDialogOpen) {
        setIsSearchDialogOpen(false);
      }
    };

    document.addEventListener('keydown', handleKeydown);
    return () => document.removeEventListener('keydown', handleKeydown);
  }, [isSearchDialogOpen]);

  // Fetch user profile
  useEffect(() => {
    const fetchUserProfile = async () => {
      if (user?.id) {
        const { data } = await supabase
          .from('profiles')
          .select('full_name, role')
          .eq('user_id', user.id)
          .single();
        
        setUserProfile(data);
      }
    };

    fetchUserProfile();
  }, [user?.id]);

  // Fetch upcoming appointments within 24 hours
  useEffect(() => {
    const fetchUpcomingAppointments = async () => {
      const now = new Date();
      const next24Hours = new Date(now.getTime() + 24 * 60 * 60 * 1000);

      const { data, error } = await supabase
        .from('appointments')
        .select(`
          id,
          appointment_date,
          treatment_type,
          patients!inner(full_name)
        `)
        .gte('appointment_date', now.toISOString())
        .lte('appointment_date', next24Hours.toISOString())
        .eq('status', 'scheduled')
        .order('appointment_date', { ascending: true });

      if (!error && data) {
        const formattedAppointments: UpcomingAppointment[] = data.map(apt => ({
          id: apt.id,
          patient_name: (apt.patients as { full_name?: string })?.full_name || 'غير محدد',
          appointment_date: apt.appointment_date,
          treatment_type: apt.treatment_type || 'فحص عام'
        }));
        setUpcomingAppointments(formattedAppointments);
      }
    };

    fetchUpcomingAppointments();
    
    const channel = supabase
      .channel('upcoming-appointments')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'appointments' },
        () => fetchUpcomingAppointments()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const handleLogout = async () => {
    await signOut();
  };

  const formatAppointmentTime = (dateTimeString: string) => {
    try {
      const appointmentDateTime = new Date(dateTimeString);
      return format(appointmentDateTime, language === 'ar' ? 'dd/MM/yyyy - HH:mm' : 'MM/dd/yyyy - HH:mm', {
        locale: language === 'ar' ? ar : undefined
      });
    } catch {
      return dateTimeString;
    }
  };

  const getCurrentRoleDisplay = () => {
    const overrideRole = localStorage.getItem('dev_override_role');
    if (overrideRole) {
      switch (overrideRole) {
        case 'super_admin': return 'مدير عام (تطوير)';
        case 'clinic_owner': return 'مالك العيادة (تطوير)';
        case 'doctor': return 'طبيب (تطوير)';
        case 'secretary': return 'سكرتير (تطوير)';
        case 'nurse': return 'ممرض/ة (تطوير)';
        case 'receptionist': return 'موظف استقبال (تطوير)';
        default: return 'غير محدد (تطوير)';
      }
    }
    
    const primaryRole = getPrimaryRole();
    const roleName = primaryRole?.role_name || userProfile?.role || 'مستخدم';
    
    switch (roleName) {
      case 'super_admin': return 'مدير عام';
      case 'clinic_owner': return 'مالك العيادة';
      case 'doctor': return 'طبيب';
      case 'secretary': return 'سكرتير';
      case 'nurse': return 'ممرض/ة';
      case 'receptionist': return 'موظف استقبال';
      default: return roleName;
    }
  };

  const handleRoleChange = (newRole: string) => {
    localStorage.setItem('dev_override_role', newRole);
    const roleNames: { [key: string]: string } = {
      'super_admin': 'مدير عام',
      'clinic_owner': 'مالك العيادة',
      'doctor': 'طبيب',
      'secretary': 'سكرتير',
      'nurse': 'ممرض/ة',
      'receptionist': 'موظف استقبال'
    };
    
    console.log(`تم تبديل الصلاحية إلى: ${roleNames[newRole]}`);
    
    setTimeout(() => {
      window.location.reload();
    }, 500);
  };

  const handleRoleReset = () => {
    localStorage.removeItem('dev_override_role');
    console.log('تم إعادة تعيين الصلاحية الأصلية');
    setTimeout(() => {
      window.location.reload();
    }, 500);
  };

  return (
    <>
      <div className="w-full h-16 px-4 sm:px-6 lg:px-8 max-w-full overflow-hidden">
        <div className="h-full bg-gradient-to-r from-slate-50 via-blue-50 to-indigo-50 
                       dark:from-slate-900 dark:via-slate-800 dark:to-slate-900
                       border-b-2 border-slate-200 dark:border-slate-700
                       shadow-lg shadow-blue-100/50 dark:shadow-blue-900/30
                       backdrop-blur-sm relative overflow-hidden">
          
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent 
                         dark:via-white/5 opacity-60 animate-pulse"></div>
          
          <div className="relative z-10 h-full flex items-center justify-between">
            {/* Left Section */}
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="flex items-center gap-2 bg-gradient-to-r from-blue-500/10 to-purple-500/10 
                             backdrop-blur-sm rounded-xl px-3 py-2.5 
                             border border-blue-200/50 dark:border-blue-700/50
                             shadow-inner shadow-white/20 dark:shadow-white/5
                             hover:shadow-md hover:scale-[1.02] transition-all duration-300">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold bg-gradient-to-r from-blue-600 to-purple-600 
                                 dark:from-blue-400 dark:to-purple-400 bg-clip-text text-transparent">
                    {format(currentDate, language === 'ar' ? 'dd/MM/yyyy' : 'MM/dd/yyyy', {
                      locale: language === 'ar' ? ar : undefined
                    })}
                  </span>
                  <span className="text-xs text-slate-600 dark:text-slate-400 font-medium">
                    {format(currentDate, 'EEEE', {
                      locale: language === 'ar' ? ar : undefined
                    })}
                  </span>
                </div>
                <div className="w-px h-4 bg-gradient-to-b from-blue-300 to-purple-300 dark:from-blue-600 dark:to-purple-600"></div>
                <span className="text-sm font-mono bg-gradient-to-r from-emerald-600 to-teal-600 
                               dark:from-emerald-400 dark:to-teal-400 bg-clip-text text-transparent 
                               tabular-nums font-bold">
                  {format(currentTime, 'HH:mm:ss')}
                </span>
              </div>

              {/* Upcoming Appointments */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button 
                    variant={upcomingAppointments.length > 0 ? "default" : "outline"} 
                    size="sm" 
                    className={`relative gap-2 transition-all duration-300 hover:scale-105 shadow-md
                      ${upcomingAppointments.length > 0 
                        ? 'bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-600 hover:to-pink-600 text-white border-red-300 shadow-red-200' 
                        : 'bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-700 border-gray-200 dark:border-gray-600'
                      }`}
                  >
                    <Bell className="h-4 w-4" />
                    <span className="text-sm font-medium">
                      {upcomingAppointments.length > 0 
                        ? `${upcomingAppointments.length} موعد قادم`
                        : "لا توجد مواعيد"
                      }
                    </span>
                    {upcomingAppointments.length > 0 && (
                      <div className="absolute -top-1 -right-1 w-3 h-3 bg-gradient-to-r from-yellow-400 to-orange-400 rounded-full animate-pulse shadow-lg"></div>
                    )}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-80">
                  <div className="flex items-center justify-between p-3 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950 dark:to-purple-950 rounded-t-lg">
                    <h3 className="text-sm font-bold">المواعيد القريبة (24 ساعة)</h3>
                    <Badge variant="secondary">{upcomingAppointments.length}</Badge>
                  </div>
                  <DropdownMenuSeparator />
                  {upcomingAppointments.length === 0 ? (
                    <div className="flex justify-center py-6">
                      <span className="text-sm text-muted-foreground">✅ لا توجد مواعيد قريبة</span>
                    </div>
                  ) : (
                    upcomingAppointments.slice(0, 5).map((appointment) => (
                      <DropdownMenuItem key={appointment.id} className="flex flex-col items-start py-3">
                        <div className="text-sm font-semibold">{appointment.patient_name}</div>
                        <div className="text-sm text-muted-foreground">{appointment.treatment_type}</div>
                        <div className="text-xs text-muted-foreground">
                          ⏰ {formatAppointmentTime(appointment.appointment_date)}
                        </div>
                      </DropdownMenuItem>
                    ))
                  )}
                </DropdownMenuContent>
              </DropdownMenu>

              {/* Today Stats */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="gap-2 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950 dark:to-emerald-950 
                               border-2 border-green-200 dark:border-green-800"
                  >
                    <BarChart3 className="h-4 w-4 text-green-600 dark:text-green-400" />
                    <span className="text-sm font-semibold text-green-700 dark:text-green-300">
                      {todayStats?.totalAppointments || 0} مواعيد
                    </span>
                    <Badge variant="secondary" className="text-xs">
                      {todayStats?.completedAppointments || 0} مكتمل
                    </Badge>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-72">
                  <div className="p-4 space-y-4">
                    <h3 className="text-sm font-bold text-center border-b pb-3">📊 إحصائيات اليوم</h3>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950 dark:to-blue-900 rounded-xl p-3 text-center">
                        <div className="text-xl font-bold text-blue-600 dark:text-blue-400">{todayStats?.totalAppointments || 0}</div>
                        <div className="text-xs text-blue-500 dark:text-blue-300">إجمالي المواعيد</div>
                      </div>
                      <div className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950 dark:to-green-900 rounded-xl p-3 text-center">
                        <div className="text-xl font-bold text-green-600 dark:text-green-400">{todayStats?.completedAppointments || 0}</div>
                        <div className="text-xs text-green-500 dark:text-green-300">مكتملة</div>
                      </div>
                      <div className="bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-950 dark:to-orange-900 rounded-xl p-3 text-center">
                        <div className="text-xl font-bold text-orange-600 dark:text-orange-400">{todayStats?.pendingAppointments || 0}</div>
                        <div className="text-xs text-orange-500 dark:text-orange-300">في الانتظار</div>
                      </div>
                      <div className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-950 dark:to-purple-900 rounded-xl p-3 text-center">
                        <div className="text-xl font-bold text-purple-600 dark:text-purple-400">{todayStats?.totalRevenue || 0}</div>
                        <div className="text-xs text-purple-500 dark:text-purple-300">ر.س الإيرادات</div>
                      </div>
                    </div>
                  </div>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            {/* Middle Section */}
            <div className="flex items-center gap-3">
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => setIsSearchDialogOpen(true)}
                className="gap-2 h-10 px-4 bg-gradient-to-r from-indigo-50 to-blue-50 dark:from-indigo-950 dark:to-blue-950"
              >
                <Search className="h-4 w-4" />
                <span className="text-sm font-medium hidden sm:inline">بحث شامل</span>
              </Button>

              <div className="flex items-center gap-1 bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-700 
                             rounded-xl p-1.5">
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => window.location.href = '/appointments/new'}
                  className="gap-2 h-8 px-3"
                >
                  <Plus className="h-4 w-4" />
                  <span className="text-sm font-medium hidden sm:inline">موعد</span>
                </Button>
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => window.location.href = '/patients/new'}
                  className="gap-2 h-8 px-3"
                >
                  <UserPlus className="h-4 w-4" />
                  <span className="text-sm font-medium hidden sm:inline">مريض</span>
                </Button>
              </div>
            </div>

            {/* Right Section */}
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-2 px-3 py-1 bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-700 
                             rounded-lg border border-gray-200 dark:border-gray-600">
                {connectionStatus.online ? (
                  <div className="w-2.5 h-2.5 bg-gradient-to-r from-green-400 to-emerald-500 rounded-full" title="متصل" />
                ) : (
                  <div className="w-2.5 h-2.5 bg-gradient-to-r from-red-400 to-red-500 rounded-full animate-pulse" title="غير متصل" />
                )}
                <Button 
                  variant="ghost" 
                  size="icon" 
                  onClick={handleRefresh} 
                  className="h-7 w-7" 
                  title="تحديث"
                >
                  <RotateCcw className="h-3 w-3" />
                </Button>
              </div>

              <ClinicSwitcher />

              {/* Developer Role Switcher */}
              {(hasPermission('system.manage') || getPrimaryRole()?.role_name === 'super_admin' || process.env.NODE_ENV === 'development') && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className={`h-8 w-8 ${localStorage.getItem('dev_override_role') ? 'bg-yellow-100 dark:bg-yellow-900' : ''}`}
                      title={`تبديل الصلاحيات (حالياً: ${getCurrentRoleDisplay()})`}
                    >
                      <Shield className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56">
                    <div className="p-2 text-xs text-muted-foreground border-b">
                      🛠️ الصلاحية الحالية: {getCurrentRoleDisplay()}
                    </div>
                    <DropdownMenuItem onClick={() => handleRoleChange('super_admin')}>
                      🔧 مدير عام
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleRoleChange('clinic_owner')}>
                      👑 مالك العيادة
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleRoleChange('doctor')}>
                      👨‍⚕️ طبيب
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleRoleChange('secretary')}>
                      📋 سكرتير
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleRoleChange('nurse')}>
                      👩‍⚕️ ممرض/ة
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleRoleChange('receptionist')}>
                      🏥 موظف استقبال
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleRoleReset} className="text-red-600">
                      🔄 إعادة للصلاحية الأصلية
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}

              {/* User Profile */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button 
                    variant="ghost" 
                    className="flex items-center gap-2 px-3 h-10"
                  >
                    <Avatar className="h-8 w-8">
                      <AvatarFallback className="text-sm font-bold">
                        {userProfile?.full_name?.charAt(0) || 'د'}
                      </AvatarFallback>
                    </Avatar>
                    <div className="hidden lg:flex flex-col items-start">
                      <span className="text-sm font-bold">
                        د. {userProfile?.full_name?.split(' ')[0] || 'الطبيب'}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {userProfile?.role || 'طبيب'}
                      </span>
                    </div>
                    <ChevronDown className="h-3 w-3" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <div className="flex flex-col p-3 gap-2">
                    <div className="font-bold text-sm">
                      د. {userProfile?.full_name || 'الطبيب'}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {userProfile?.role || 'طبيب'} • {user?.email}
                    </div>
                  </div>
                  <DropdownMenuSeparator />
                  
                  {/* Font Size Control */}
                  <div className="p-3">
                    <div className="text-xs text-muted-foreground mb-2">حجم الخط</div>
                    <div className="flex items-center justify-between">
                      <Button variant="ghost" size="icon" onClick={handleZoomOut} className="h-7 w-7">
                        <Minus className="h-3 w-3" />
                      </Button>
                      <span className="text-xs">{getZoomText()}</span>
                      <Button variant="ghost" size="icon" onClick={handleZoomIn} className="h-7 w-7">
                        <Plus className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                  <DropdownMenuSeparator />
                  
                  <DropdownMenuItem onClick={() => setTheme(theme === "dark" ? "light" : "dark")}>
                    {theme === "dark" ? "☀️" : "🌙"} 
                    <span className="ml-2">{theme === "dark" ? "الوضع النهاري" : "الوضع الليلي"}</span>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  
                  <DropdownMenuItem onClick={() => window.location.href = '/profile'}>
                    👤 الملف الشخصي
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => window.location.href = '/settings'}>
                    ⚙️ الإعدادات
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem className="text-red-600" onClick={handleLogout}>
                    🚪 تسجيل الخروج
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>
      </div>

      {/* Search Dialog */}
      <Dialog open={isSearchDialogOpen} onOpenChange={setIsSearchDialogOpen}>
        <DialogContent className="max-w-4xl h-[80vh] p-0 gap-0">
          <DialogHeader className="px-6 py-4 border-b">
            <div className="flex items-center justify-between">
              <DialogTitle className="text-xl font-bold">🔍 بحث شامل</DialogTitle>
              <Button 
                variant="ghost" 
                size="icon"
                onClick={() => setIsSearchDialogOpen(false)}
                className="h-8 w-8"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            
            <div className="relative mt-4">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input
                placeholder="ابحث عن مرضى، مواعيد، علاجات، فواتير..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-12 pr-4 h-12 text-lg"
                autoFocus
              />
              {searchQuery && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 h-8 w-8"
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
            
            <div className="flex items-center gap-4 mt-3 text-sm text-muted-foreground">
              <span>💡 نصائح:</span>
              <Badge variant="outline" className="text-xs">اسم المريض</Badge>
              <Badge variant="outline" className="text-xs">رقم الهاتف</Badge>
              <Badge variant="outline" className="text-xs">رقم الفاتورة</Badge>
            </div>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto p-6">
            {isSearching ? (
              <div className="flex flex-col items-center justify-center h-32">
                <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mb-4"></div>
                <span className="text-lg text-muted-foreground">🔍 جاري البحث...</span>
              </div>
            ) : searchQuery.length === 0 ? (
              <div className="text-center py-12">
                <Search className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-xl font-semibold mb-2">ابدأ بكتابة ما تبحث عنه</h3>
                <p className="text-muted-foreground">يمكنك البحث في جميع بيانات النظام</p>
              </div>
            ) : searchResults.length === 0 ? (
              <div className="text-center py-12">
                <AlertCircle className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-xl font-semibold mb-2">لم يتم العثور على نتائج</h3>
                <p className="text-muted-foreground">جرب كلمات مختلفة</p>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-semibold">📊 نتائج البحث</h3>
                  <Badge variant="secondary">{searchResults.length} نتيجة</Badge>
                </div>
                
                <div className="grid gap-3">
                  {searchResults.map((result) => (
                    <div
                      key={`${result.type}-${result.id}`}
                      className="p-4 border rounded-lg hover:bg-accent cursor-pointer transition-all"
                      onClick={() => {
                        window.location.href = result.url;
                        setIsSearchDialogOpen(false);
                      }}
                    >
                      <div className="flex items-start gap-4">
                        <div className="text-3xl">{result.icon}</div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="font-semibold">{result.title}</h4>
                            <Badge variant="outline" className="text-xs">
                              {result.type === 'patient' && 'مريض'}
                              {result.type === 'appointment' && 'موعد'}
                              {result.type === 'invoice' && 'فاتورة'}
                            </Badge>
                          </div>
                          {result.subtitle && (
                            <p className="text-sm text-muted-foreground">{result.subtitle}</p>
                          )}
                          {result.description && (
                            <p className="text-xs text-muted-foreground">{result.description}</p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

export default TopNavbar;
