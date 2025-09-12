import { useState, useEffect } from "react";
<<<<<<< HEAD
import { 
  Bell, Moon, Sun, User, ChevronDown, Plus, Minus, RotateCcw,
  Search, UserPlus, CalendarPlus, FileText, AlertCircle, Wifi, WifiOff,
  Building2, Check, Shield, X
} from "lucide-react";
import { useTheme } from "@/contexts/ThemeContext";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
=======
import { Bell, Moon, Sun, User, ChevronDown, Plus, Minus, RotateCcw } from "lucide-react";
import { useTheme } from "@/contexts/ThemeContext";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
>>>>>>> cbd682d36e862741c55b9e7b5d144f8de65c694a
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
<<<<<<< HEAD
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
=======
import { Badge } from "@/components/ui/badge";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/hooks/useAuth";
>>>>>>> cbd682d36e862741c55b9e7b5d144f8de65c694a
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { ar } from "date-fns/locale";
import { ClinicSwitcher } from "../clinic/ClinicSwitcher";
<<<<<<< HEAD
import AddPatientPopup from "@/components/patients/AddPatientPopup";
import AddAppointmentPopup from "@/components/appointments/AddAppointmentPopup";
=======
>>>>>>> cbd682d36e862741c55b9e7b5d144f8de65c694a

interface UpcomingAppointment {
  id: string;
  patient_name: string;
  appointment_date: string;
  treatment_type: string;
}

<<<<<<< HEAD
interface SearchResult {
  id: string;
  type: 'patient' | 'appointment' | 'treatment' | 'invoice' | 'medication' | 'user';
  title: string;
  subtitle?: string;
  description?: string;
  url: string;
  icon: string;
}

=======
>>>>>>> cbd682d36e862741c55b9e7b5d144f8de65c694a
interface UserProfile {
  full_name: string;
  role: string;
}

export function TopNavbar() {
  const { t, language } = useLanguage();
  const { theme, setTheme } = useTheme();
  const { user, signOut } = useAuth();
<<<<<<< HEAD
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
  const [isAddPatientDialogOpen, setIsAddPatientDialogOpen] = useState(false);
  const [isAddAppointmentDialogOpen, setIsAddAppointmentDialogOpen] = useState(false);

  // Update current date every minute
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentDate(new Date());
    }, 60000); // Update every minute

    return () => clearInterval(timer);
  }, []);

  // Fetch user profile data
  useEffect(() => {
    const fetchUserProfile = async () => {
      if (!user?.id) return;
      
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('full_name, role')
          .eq('user_id', user.id)
          .single();

        if (error) throw error;
        if (data) {
          setUserProfile(data);
        }
      } catch (error) {
        console.error('Error fetching user profile:', error);
      }
    };

    fetchUserProfile();
  }, [user?.id]);

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
=======
  const [upcomingAppointments, setUpcomingAppointments] = useState<UpcomingAppointment[]>([]);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [zoomLevel, setZoomLevel] = useState(100);
>>>>>>> cbd682d36e862741c55b9e7b5d144f8de65c694a

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

<<<<<<< HEAD
  // Search functionality
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

      setSearchResults(results);
    } catch (error) {
      console.error('Search error:', error);
    } finally {
      setIsSearching(false);
    }
  };

  const formatAppointmentTime = (dateStr: string) => {
    return format(new Date(dateStr), 'HH:mm', { locale: ar });
  };

  const handleLogout = () => {
    signOut();
  };

  const getCurrentRoleDisplay = () => {
    const overrideRole = localStorage.getItem('dev_override_role');
    if (overrideRole) return overrideRole;
    return getPrimaryRole()?.role_name || 'user';
  };

  const handleRoleChange = (role: string) => {
    localStorage.setItem('dev_override_role', role);
    window.location.reload();
  };

  const handleRoleReset = () => {
    localStorage.removeItem('dev_override_role');
    window.location.reload();
  };

  return (
    <>
      {/* الخلفية المتدرجة الرئيسية */}
      <div className="sticky top-0 z-50 w-full bg-gradient-to-r from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 border-b border-gray-200 dark:border-gray-700 shadow-xl shadow-blue-100/50 dark:shadow-gray-900/50">
        
        {/* المحتوى الرئيسي */}
        <div className="flex items-center justify-between h-16 px-6 backdrop-blur-sm">
          
          {/* القسم الأيسر - البحث والتحديث */}
          <div className="flex items-center space-x-4 rtl:space-x-reverse">
            <Button
              onClick={() => setIsSearchDialogOpen(true)}
              variant="ghost"
              size="icon"
              className="relative group bg-gradient-to-r from-white to-blue-50 dark:from-gray-800 dark:to-blue-950 
                         border border-blue-200 dark:border-blue-700 rounded-xl
                         hover:border-purple-400 dark:hover:border-purple-500 hover:shadow-lg hover:scale-105
                         transition-all duration-300"
              title="البحث الشامل في النظام (Ctrl+K)"
            >
              <Search className="h-4 w-4 text-blue-500 dark:text-blue-400 group-hover:text-purple-500 transition-colors duration-300" />
            </Button>
            
            <Button 
              onClick={handleRefresh}
              variant="ghost" 
              size="icon" 
              className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950 dark:to-emerald-950 
                         border border-green-200 dark:border-green-800 
                         hover:from-green-100 hover:to-emerald-100 dark:hover:from-green-900 dark:hover:to-emerald-900
                         shadow-lg shadow-green-100/50 dark:shadow-green-900/30
                         transition-all duration-300 hover:scale-105"
              title="تحديث الصفحة"
            >
              <RotateCcw className="h-4 w-4 text-green-600 dark:text-green-400" />
            </Button>
            
            {/* أزرار الإضافة السريعة */}
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsAddPatientDialogOpen(true)}
              className="gap-2 bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-blue-950 dark:to-cyan-950 
                         border border-blue-200 dark:border-blue-800 
                         hover:from-blue-100 hover:to-cyan-100 dark:hover:from-blue-900 dark:hover:to-cyan-900
                         shadow-lg shadow-blue-100/50 dark:shadow-blue-900/30
                         transition-all duration-300 hover:scale-105"
            >
              <UserPlus className="h-4 w-4 text-blue-600 dark:text-blue-400" />
              <span className="hidden sm:inline text-blue-700 dark:text-blue-300 font-medium">مريض جديد</span>
            </Button>
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsAddAppointmentDialogOpen(true)}
              className="gap-2 bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-950 dark:to-pink-950 
                         border border-purple-200 dark:border-purple-800 
                         hover:from-purple-100 hover:to-pink-100 dark:hover:from-purple-900 dark:hover:to-pink-900
                         shadow-lg shadow-purple-100/50 dark:shadow-purple-900/30
                         transition-all duration-300 hover:scale-105"
            >
              <CalendarPlus className="h-4 w-4 text-purple-600 dark:text-purple-400" />
              <span className="hidden sm:inline text-purple-700 dark:text-purple-300 font-medium">موعد جديد</span>
            </Button>
          </div>

          {/* القسم الأوسط - التاريخ والوقت وحالة الاتصال */}
          <div className="flex items-center space-x-6 rtl:space-x-reverse">
            
            {/* حالة الاتصال - أيقونة فقط */}
            <div className="flex items-center">
              <Button
                variant="ghost"
                size="icon"
                className={`transition-all duration-300 hover:scale-105 ${
                  connectionStatus.online 
                    ? 'bg-gradient-to-r from-green-100 to-emerald-100 dark:from-green-900 dark:to-emerald-900 text-green-700 dark:text-green-300 border border-green-200 dark:border-green-700 hover:from-green-200 hover:to-emerald-200 dark:hover:from-green-800 dark:hover:to-emerald-800' 
                    : 'bg-gradient-to-r from-red-100 to-pink-100 dark:from-red-900 dark:to-pink-900 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-700 hover:from-red-200 hover:to-pink-200 dark:hover:from-red-800 dark:hover:to-pink-800'
                }`}
                title={connectionStatus.online ? 'متصل بالإنترنت' : 'غير متصل بالإنترنت'}
              >
                {connectionStatus.online ? <Wifi className="h-4 w-4" /> : <WifiOff className="h-4 w-4" />}
              </Button>
            </div>
            
            {/* التاريخ والوقت المباشر */}
            <div className="flex items-center gap-3 bg-gradient-to-r from-blue-100/80 to-purple-100/80 dark:from-blue-900/40 dark:to-purple-900/40 
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
          </div>

          {/* القسم الأيمن - الأدوات والإشعارات */}
          <div className="flex items-center space-x-3 rtl:space-x-reverse">
            
            {/* إشعارات المواعيد */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button 
                  variant={upcomingAppointments.length > 0 ? "default" : "outline"} 
                  size="sm" 
                  className={`relative gap-2 transition-all duration-300 hover:scale-105 shadow-md
                    ${upcomingAppointments.length > 0 
                      ? 'bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-600 hover:to-pink-600 text-white border-red-300 shadow-red-200' 
                      : 'bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-700 border-gray-200 dark:border-gray-600 hover:from-gray-100 hover:to-gray-200 dark:hover:from-gray-700 dark:hover:to-gray-600'
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
              <DropdownMenuContent align="start" className="w-80 bg-gradient-to-b from-white to-gray-50 dark:from-gray-900 dark:to-gray-800 border-2 border-gray-200 dark:border-gray-700 shadow-2xl">
                <div className="flex items-center justify-between p-3 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950 dark:to-purple-950 rounded-t-lg">
                  <h3 className="text-sm font-bold bg-gradient-to-r from-blue-600 to-purple-600 dark:from-blue-400 dark:to-purple-400 bg-clip-text text-transparent">المواعيد القريبة (24 ساعة)</h3>
                  <Badge variant="secondary" className="bg-gradient-to-r from-blue-100 to-purple-100 dark:from-blue-900 dark:to-purple-900 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-700">
                    {upcomingAppointments.length}
                  </Badge>
                </div>
                <DropdownMenuSeparator />
                {upcomingAppointments.length === 0 ? (
                  <div className="flex justify-center py-6">
                    <span className="text-sm text-gray-500 dark:text-gray-400">✅ لا توجد مواعيد قريبة</span>
                  </div>
                ) : (
                  upcomingAppointments.slice(0, 5).map((appointment) => (
                    <DropdownMenuItem key={appointment.id} className="flex flex-col items-start py-3 hover:bg-gradient-to-r hover:from-blue-50 hover:to-purple-50 dark:hover:from-blue-950 dark:hover:to-purple-950 transition-all duration-200 rounded-lg mx-1">
                      <div className="text-sm font-semibold text-gray-800 dark:text-gray-200">{appointment.patient_name}</div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">{appointment.treatment_type}</div>
                      <div className="text-xs text-gray-500 dark:text-gray-500 bg-gradient-to-r from-blue-100 to-purple-100 dark:from-blue-900 dark:to-purple-900 rounded-full px-3 py-1 mt-1 border border-blue-200 dark:border-blue-700">
                        ⏰ {formatAppointmentTime(appointment.appointment_date)}
                      </div>
                    </DropdownMenuItem>
                  ))
                )}
              </DropdownMenuContent>
            </DropdownMenu>

            <ClinicSwitcher />

            {/* أدوات المطورين */}
            {(hasPermission('system.manage') || getPrimaryRole()?.role_name === 'super_admin' || process.env.NODE_ENV === 'development') && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className={`h-8 w-8 ${localStorage.getItem('dev_override_role') ? 'bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200' : ''}`}
                    title={`تبديل الصلاحيات (حالياً: ${getCurrentRoleDisplay()})`}
                  >
                    <Shield className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <div className="p-2 text-xs text-muted-foreground border-b">
                    🛠️ أدوات المطورين - الصلاحية الحالية: {getCurrentRoleDisplay()}
                  </div>
                  <DropdownMenuItem 
                    onClick={() => handleRoleChange('super_admin')}
                    className={localStorage.getItem('dev_override_role') === 'super_admin' ? 'bg-accent' : ''}
                  >
                    <div className="flex items-center justify-between w-full">
                      <span>🔧 مدير عام</span>
                      {localStorage.getItem('dev_override_role') === 'super_admin' && <span className="text-xs">✓</span>}
                    </div>
                  </DropdownMenuItem>
                  <DropdownMenuItem 
                    onClick={() => handleRoleChange('clinic_owner')}
                    className={localStorage.getItem('dev_override_role') === 'clinic_owner' ? 'bg-accent' : ''}
                  >
                    <div className="flex items-center justify-between w-full">
                      <span>👑 مالك العيادة</span>
                      {localStorage.getItem('dev_override_role') === 'clinic_owner' && <span className="text-xs">✓</span>}
                    </div>
                  </DropdownMenuItem>
                  <DropdownMenuItem 
                    onClick={() => handleRoleChange('doctor')}
                    className={localStorage.getItem('dev_override_role') === 'doctor' ? 'bg-accent' : ''}
                  >
                    <div className="flex items-center justify-between w-full">
                      <span>👨‍⚕️ طبيب</span>
                      {localStorage.getItem('dev_override_role') === 'doctor' && <span className="text-xs">✓</span>}
                    </div>
                  </DropdownMenuItem>
                  <DropdownMenuItem 
                    onClick={() => handleRoleChange('secretary')}
                    className={localStorage.getItem('dev_override_role') === 'secretary' ? 'bg-accent' : ''}
                  >
                    <div className="flex items-center justify-between w-full">
                      <span>📋 سكرتير</span>
                      {localStorage.getItem('dev_override_role') === 'secretary' && <span className="text-xs">✓</span>}
                    </div>
                  </DropdownMenuItem>
                  <DropdownMenuItem 
                    onClick={() => handleRoleChange('nurse')}
                    className={localStorage.getItem('dev_override_role') === 'nurse' ? 'bg-accent' : ''}
                  >
                    <div className="flex items-center justify-between w-full">
                      <span>👩‍⚕️ ممرض/ة</span>
                      {localStorage.getItem('dev_override_role') === 'nurse' && <span className="text-xs">✓</span>}
                    </div>
                  </DropdownMenuItem>
                  <DropdownMenuItem 
                    onClick={() => handleRoleChange('receptionist')}
                    className={localStorage.getItem('dev_override_role') === 'receptionist' ? 'bg-accent' : ''}
                  >
                    <div className="flex items-center justify-between w-full">
                      <span>🏥 موظف استقبال</span>
                      {localStorage.getItem('dev_override_role') === 'receptionist' && <span className="text-xs">✓</span>}
                    </div>
                  </DropdownMenuItem>
                  <div className="border-t my-1"></div>
                  <DropdownMenuItem 
                    onClick={() => handleRoleReset()}
                    className="text-red-600 dark:text-red-400"
                  >
                    🔄 إعادة للصلاحية الأصلية
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}

            {/* الملف الشخصي */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button 
                  variant="ghost" 
                  className="flex items-center gap-2 px-3 h-10 rounded-xl border-2 border-gray-200 dark:border-gray-700 
                             bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-700 
                             hover:from-gray-100 hover:to-gray-200 dark:hover:from-gray-700 dark:hover:to-gray-600 
                             shadow-lg shadow-gray-100/50 dark:shadow-gray-900/30 
                             transition-all duration-300 hover:scale-105 hover:shadow-xl"
                >
                  <Avatar className="h-8 w-8 ring-2 ring-blue-200 dark:ring-blue-800 ring-offset-1 ring-offset-white dark:ring-offset-gray-800">
                    <AvatarFallback className="text-sm font-bold bg-gradient-to-r from-blue-500 to-purple-500 text-white">
                      {userProfile?.full_name?.charAt(0) || 'د'}
                    </AvatarFallback>
                  </Avatar>
                  <div className="hidden lg:flex flex-col items-start">
                    <span className="text-sm font-bold bg-gradient-to-r from-gray-700 to-gray-900 dark:from-gray-200 dark:to-gray-100 bg-clip-text text-transparent leading-none">
                      د. {userProfile?.full_name?.split(' ')[0] || 'الطبيب'}
                    </span>
                    <span className="text-xs text-gray-500 dark:text-gray-400 font-medium">
                      {userProfile?.role || 'طبيب'}
                    </span>
                  </div>
                  <ChevronDown className="h-3 w-3 text-gray-500 dark:text-gray-400" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56 bg-gradient-to-b from-white to-gray-50 dark:from-gray-900 dark:to-gray-800 border-2 border-gray-200 dark:border-gray-700 shadow-2xl">
                <div className="flex flex-col p-3 gap-2 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950 dark:to-purple-950 rounded-t-lg">
                  <div className="font-bold text-sm bg-gradient-to-r from-blue-600 to-purple-600 dark:from-blue-400 dark:to-purple-400 bg-clip-text text-transparent">
                    د. {userProfile?.full_name || 'الطبيب'}
                  </div>
                  <div className="text-xs text-gray-600 dark:text-gray-400">
                    {userProfile?.role || 'طبيب'} • {user?.email}
                  </div>
                </div>
                <DropdownMenuSeparator />
                
                {/* أدوات تغيير حجم الخط */}
                <div className="p-3">
                  <div className="text-xs text-gray-600 dark:text-gray-400 mb-2 font-medium">حجم الخط</div>
                  <div className="flex items-center justify-between bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-700 rounded-lg p-1.5 border border-gray-200 dark:border-gray-600">
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      onClick={handleZoomOut} 
                      className="h-7 w-7 hover:bg-blue-100 dark:hover:bg-blue-900 transition-all duration-200 hover:scale-110" 
                      title="تصغير"
                    >
                      <Minus className="h-3 w-3 text-blue-600 dark:text-blue-400" />
                    </Button>
                    <span className="text-xs px-2 text-gray-600 dark:text-gray-300 min-w-[40px] text-center font-medium">{getZoomText()}</span>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      onClick={handleZoomIn} 
                      className="h-7 w-7 hover:bg-green-100 dark:hover:bg-green-900 transition-all duration-200 hover:scale-110" 
                      title="تكبير"
                    >
                      <Plus className="h-3 w-3 text-green-600 dark:text-green-400" />
                    </Button>
                  </div>
                </div>
                <DropdownMenuSeparator />
                
                {/* تبديل الثيم */}
                <DropdownMenuItem 
                  onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                  className="flex items-center justify-between hover:bg-gradient-to-r hover:from-purple-50 hover:to-pink-50 dark:hover:from-purple-950 dark:hover:to-pink-950 transition-all duration-200 rounded-lg mx-1 my-1"
                >
                  <span className="flex items-center gap-2">
                    {theme === "dark" ? "☀️" : "🌙"} 
                    <span className="font-medium">{theme === "dark" ? "الوضع النهاري" : "الوضع الليلي"}</span>
                  </span>
                  {theme === "dark" ? <Sun className="h-4 w-4 text-yellow-500" /> : <Moon className="h-4 w-4 text-blue-500" />}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                
                <DropdownMenuItem 
                  onClick={() => window.location.href = '/profile'}
                  className="hover:bg-gradient-to-r hover:from-blue-50 hover:to-cyan-50 dark:hover:from-blue-950 dark:hover:to-cyan-950 transition-all duration-200 rounded-lg mx-1 my-1"
                >
                  👤 الملف الشخصي
                </DropdownMenuItem>
                <DropdownMenuItem 
                  onClick={() => window.location.href = '/settings'}
                  className="hover:bg-gradient-to-r hover:from-gray-50 hover:to-slate-50 dark:hover:from-gray-950 dark:hover:to-slate-950 transition-all duration-200 rounded-lg mx-1 my-1"
                >
                  ⚙️ الإعدادات
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem 
                  className="text-red-600 dark:text-red-400 hover:bg-gradient-to-r hover:from-red-50 hover:to-pink-50 dark:hover:from-red-950 dark:hover:to-pink-950 transition-all duration-200 rounded-lg mx-1 my-1 font-medium"
                  onClick={handleLogout}
                >
                  🚪 تسجيل الخروج
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>

      {/* نافذة البحث الشامل */}
      <Dialog open={isSearchDialogOpen} onOpenChange={setIsSearchDialogOpen}>
        <DialogContent className="max-w-4xl h-[80vh] p-0 gap-0">
          <DialogHeader className="px-6 py-4 border-b">
            <div className="flex items-center justify-between">
              <DialogTitle className="text-xl font-bold">🔍 البحث الشامل في النظام</DialogTitle>
              <Button 
                variant="ghost" 
                size="icon"
                onClick={() => setIsSearchDialogOpen(false)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </DialogHeader>
          
          <div className="flex flex-col h-full">
            <div className="p-6 border-b">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-blue-500" />
                <Input
                  placeholder="ابحث في المرضى، المواعيد، العلاجات، الفواتير..."
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    performGlobalSearch(e.target.value);
                  }}
                  className="pl-12 h-12 text-lg border-2 border-blue-200 focus:border-purple-400 rounded-xl"
                  autoFocus
                />
              </div>
            </div>
            
            <div className="flex-1 overflow-auto p-6">
              {isSearching ? (
                <div className="flex items-center justify-center h-32">
                  <div className="text-gray-500">جاري البحث...</div>
                </div>
              ) : searchResults.length > 0 ? (
                <div className="space-y-3">
                  {searchResults.map((result) => (
                    <div
                      key={`${result.type}-${result.id}`}
                      className="flex items-center gap-4 p-4 bg-gradient-to-r from-white to-gray-50 dark:from-gray-800 dark:to-gray-900 
                                 border border-gray-200 dark:border-gray-700 rounded-xl
                                 hover:from-blue-50 hover:to-purple-50 dark:hover:from-blue-950 dark:hover:to-purple-950
                                 hover:border-blue-300 dark:hover:border-blue-600
                                 transition-all duration-200 cursor-pointer hover:shadow-lg"
                      onClick={() => {
                        window.location.href = result.url;
                        setIsSearchDialogOpen(false);
                      }}
                    >
                      <div className="text-2xl">{result.icon}</div>
                      <div className="flex-1">
                        <div className="font-semibold text-gray-800 dark:text-gray-200">{result.title}</div>
                        {result.subtitle && (
                          <div className="text-sm text-gray-600 dark:text-gray-400">{result.subtitle}</div>
                        )}
                        {result.description && (
                          <div className="text-xs text-gray-500 dark:text-gray-500">{result.description}</div>
                        )}
                      </div>
                      <Badge variant="secondary" className="capitalize">
                        {result.type}
                      </Badge>
                    </div>
                  ))}
                </div>
              ) : searchQuery.trim() ? (
                <div className="flex items-center justify-center h-32">
                  <div className="text-gray-500">لا توجد نتائج للبحث "{searchQuery}"</div>
                </div>
              ) : (
                <div className="flex items-center justify-center h-32">
                  <div className="text-gray-500">ابدأ بكتابة نص للبحث</div>
                </div>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* نوافذ الإضافة */}
      <AddPatientPopup 
        open={isAddPatientDialogOpen}
        onOpenChange={setIsAddPatientDialogOpen}
        onPatientAdded={() => {
          setIsAddPatientDialogOpen(false);
        }}
      />
      
      <AddAppointmentPopup 
        open={isAddAppointmentDialogOpen}
        onOpenChange={setIsAddAppointmentDialogOpen}
        onAppointmentAdded={() => {
          setIsAddAppointmentDialogOpen(false);
        }}
      />
    </>
  );
}

export default TopNavbar;
=======
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
          patient_name: (apt.patients as any)?.full_name || 'غير محدد',
          appointment_date: apt.appointment_date,
          treatment_type: apt.treatment_type || 'فحص عام'
        }));
        setUpcomingAppointments(formattedAppointments);
      }
    };

    fetchUpcomingAppointments();
    
    // Set up real-time subscription for appointments
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

  return (
    <div className="w-full bg-background border-b border-border h-16 px-4 flex items-center justify-between">
      {/* Empty space for potential logo or breadcrumbs */}
      <div className="flex-1" />

      {/* Right side actions */}
      <div className="flex items-center gap-2">
        <ClinicSwitcher />
        
        {/* Zoom Controls */}
        <div className="flex items-center gap-1 bg-secondary/50 rounded-md p-1">
          <Button 
            variant="ghost" 
            size="icon"
            onClick={handleZoomIn}
            className="h-7 w-7 hover:bg-background"
            title="تكبير"
          >
            <Plus className="h-4 w-4" />
          </Button>
          
          <Button 
            variant="ghost" 
            size="sm"
            onClick={handleZoomReset}
            className="h-7 px-2 text-xs hover:bg-background"
            title="إعادة تعيين التكبير"
          >
            {getZoomText()}
          </Button>
          
          <Button 
            variant="ghost" 
            size="icon"
            onClick={handleZoomOut}
            className="h-7 w-7 hover:bg-background"
            title="تصغير"
          >
            <Minus className="h-4 w-4" />
          </Button>
          
          <Button 
            variant="ghost" 
            size="icon"
            onClick={handleRefresh}
            className="h-7 w-7 hover:bg-background"
            title="تحديث الصفحة"
          >
            <RotateCcw className="h-4 w-4" />
          </Button>
        </div>
        
        {/* Upcoming Appointments Notifications */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="relative">
              <Bell className="h-5 w-5" />
              {upcomingAppointments.length > 0 && (
                <Badge variant="destructive" className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs">
                  {upcomingAppointments.length}
                </Badge>
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-80">
            <div className="flex items-center justify-between p-2">
              <h3 className="font-semibold">المواعيد القريبة (24 ساعة)</h3>
            </div>
            <DropdownMenuSeparator />
            {upcomingAppointments.length === 0 ? (
              <DropdownMenuItem className="flex justify-center py-4">
                <span className="text-muted-foreground">لا توجد مواعيد قريبة</span>
              </DropdownMenuItem>
            ) : (
              upcomingAppointments.slice(0, 5).map((appointment) => (
                <DropdownMenuItem key={appointment.id} className="flex flex-col items-start py-2">
                  <div className="font-medium">{appointment.patient_name}</div>
                  <div className="text-sm text-muted-foreground">
                    {appointment.treatment_type}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {formatAppointmentTime(appointment.appointment_date)}
                  </div>
                </DropdownMenuItem>
              ))
            )}
            {upcomingAppointments.length > 5 && (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="flex justify-center">
                  <span className="text-sm text-muted-foreground">
                    و {upcomingAppointments.length - 5} مواعيد أخرى
                  </span>
                </DropdownMenuItem>
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Theme Toggle */}
        <Button 
          variant="ghost" 
          size="icon"
          onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          className="transition-all duration-200 hover:bg-accent"
        >
          {theme === "dark" ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
        </Button>

        {/* User Profile */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="flex items-center gap-2 px-2">
              <div className="flex flex-col items-end text-right">
                <span className="text-sm font-medium">
                  {userProfile?.full_name || user?.email?.split('@')[0] || 'المستخدم'}
                </span>
                <span className="text-xs text-muted-foreground">
                  {userProfile?.role || 'مستخدم'}
                </span>
              </div>
              <Avatar className="h-8 w-8">
                <AvatarImage src={undefined} />
                <AvatarFallback>
                  {userProfile?.full_name?.charAt(0) || user?.email?.charAt(0) || 'م'}
                </AvatarFallback>
              </Avatar>
              <ChevronDown className="h-4 w-4 text-muted-foreground" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <div className="flex flex-col p-2 gap-2">
              <div className="font-medium">
                {userProfile?.full_name || user?.email?.split('@')[0] || 'المستخدم'}
              </div>
              <div className="text-sm text-muted-foreground">
                {userProfile?.role || 'مستخدم'}
              </div>
              {user?.email && (
                <div className="text-xs text-muted-foreground break-all">
                  {user.email}
                </div>
              )}
            </div>
            <DropdownMenuSeparator />
            <DropdownMenuSeparator />
            <DropdownMenuItem 
              className="text-red-500 focus:text-red-500 focus:bg-red-50 dark:focus:bg-red-950"
              onClick={handleLogout}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="mr-2 h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"></path>
                <polyline points="16 17 21 12 16 7"></polyline>
                <line x1="21" y1="12" x2="9" y2="12"></line>
              </svg>
              <span>{t("logout")}</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}

export default TopNavbar;
>>>>>>> cbd682d36e862741c55b9e7b5d144f8de65c694a
