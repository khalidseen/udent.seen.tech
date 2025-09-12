import { BrowserRouter, Route, Routes } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { LanguageProvider } from "@/contexts/LanguageContext";
import { SettingsProvider } from "@/contexts/SettingsContext";
import { SidebarProvider } from "@/contexts/SidebarContext";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { PermissionsProvider } from "@/contexts/PermissionsContext";
import { CurrencyProvider } from "@/contexts/CurrencyContext";
import { useEffect, Suspense, lazy } from "react";
import { toast } from "sonner";
import { EnhancedErrorBoundary } from "@/components/ui/enhanced-performance";
import { createNetworkMonitor } from "@/utils/performance";

// Layout components
import { MainLayout } from "@/components/layout/MainLayout";
import { SimpleProtectedRoute } from "@/components/auth/SimpleProtectedRoute";

// Critical pages - loaded immediately
import Index from "@/pages/Index";
import Auth from "@/pages/Auth";
import NotFound from "@/pages/NotFound";

// Lazy loaded pages for better performance
const Patients = lazy(() => import("@/pages/Patients"));
const Appointments = lazy(() => import("@/pages/Appointments"));
const NewAppointment = lazy(() => import("@/pages/NewAppointment"));
const PatientProfile = lazy(() => import("@/pages/PatientProfile"));
const MedicalRecords = lazy(() => import("@/pages/MedicalRecords"));
const Settings = lazy(() => import("@/pages/Settings"));
const Doctors = lazy(() => import("@/pages/Doctors"));
const DoctorAssistants = lazy(() => import("@/pages/DoctorAssistants"));
const Secretaries = lazy(() => import("@/pages/Secretaries"));
const AppointmentRequests = lazy(() => import("@/pages/AppointmentRequests"));
const PublicBooking = lazy(() => import("@/pages/PublicBooking"));
const PublicBookingLanding = lazy(() => import("@/pages/PublicBookingLanding"));
const Invoices = lazy(() => import("@/pages/Invoices"));
const Payments = lazy(() => import("@/pages/Payments"));
const Inventory = lazy(() => import("@/pages/Inventory"));
const ServicePrices = lazy(() => import("@/pages/ServicePrices"));
const PurchaseOrders = lazy(() => import("@/pages/PurchaseOrders"));
const StockMovements = lazy(() => import("@/pages/StockMovements"));
const DentalTreatments = lazy(() => import("@/pages/DentalTreatments"));
const Treatments = lazy(() => import("@/pages/Treatments"));
const Advanced3DDental = lazy(() => import("@/pages/Advanced3DDental"));
const DentalModelsAdmin = lazy(() => import("@/pages/DentalModelsAdmin"));
const Advanced3DDentalEditor = lazy(() => import("@/pages/Advanced3DDentalEditor"));
const AdvancedToothEditor = lazy(() => import("@/pages/AdvancedToothEditor"));
const ToothAnatomy = lazy(() => import("@/pages/ToothAnatomy"));
const Notifications = lazy(() => import("@/pages/Notifications"));
const NotificationTemplates = lazy(() => import("@/pages/NotificationTemplates"));
const Reports = lazy(() => import("@/pages/Reports"));
const AIInsights = lazy(() => import("@/pages/AIInsights"));
const SmartDiagnosis = lazy(() => import("@/pages/SmartDiagnosis"));
const Medications = lazy(() => import("@/pages/Medications"));
const Prescriptions = lazy(() => import("@/pages/Prescriptions"));
const SplashCursorDemo = lazy(() => import("@/pages/SplashCursorDemo"));
const NoiseDemo = lazy(() => import("@/pages/NoiseDemo"));
const SecurityAudit = lazy(() => import("@/pages/SecurityAudit"));
const Permissions = lazy(() => import("@/pages/Permissions"));
const Profile = lazy(() => import("@/pages/Profile"));
const Users = lazy(() => import("@/pages/Users"));
const SuperAdmin = lazy(() => import("@/pages/SuperAdmin"));
const SubscriptionPlans = lazy(() => import("@/pages/SubscriptionPlans"));
const SubscriptionManagement = lazy(() => import("@/pages/SubscriptionManagement"));
const UnderDevelopment = lazy(() => import("@/pages/UnderDevelopment").then(module => ({ default: module.UnderDevelopment })));

// New feature pages
import DentalTreatmentsManagement from "@/pages/DentalTreatmentsManagement";
import AdvancedMedicalRecords from "@/pages/AdvancedMedicalRecords";
import AIManagementDashboard from "@/pages/AIManagementDashboard";
import SmartDiagnosisSystem from "@/pages/SmartDiagnosisSystem";
import AIInsightsPage from "@/pages/AIInsightsPage";
import AdvancedNotificationManagement from "@/pages/AdvancedNotificationManagement";
import CustomNotificationTemplates from "@/pages/CustomNotificationTemplates";
import DetailedReports from "@/pages/DetailedReports";
import AdvancedPermissionsManagement from "@/pages/AdvancedPermissionsManagement";
import AdvancedUserManagement from "@/pages/AdvancedUserManagement";
import AdvancedManagement from "@/pages/AdvancedManagement";
import ComprehensiveSecurityAudit from "@/pages/ComprehensiveSecurityAudit";
import Dental3DModelsManagement from "@/pages/Dental3DModelsManagement";
import EnhancedDentalChartDemo from "@/pages/EnhancedDentalChartDemo";
import FinancialIntegrationTest from "@/components/debug/FinancialIntegrationTest";

// Initialize the offline database
import { offlineDB } from "@/lib/offline-db";

// Initialize the database when the app starts
offlineDB.init().catch(console.error);

// Create a client for React Query with optimized performance settings
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 3, // 3 minutes - reduced for better data freshness
      gcTime: 1000 * 60 * 15, // 15 minutes - increased for better caching
      retry: 2,
      refetchOnWindowFocus: false,
      refetchOnReconnect: true,
      networkMode: 'offlineFirst', // Better offline support
    },
    mutations: {
      retry: 1,
      networkMode: 'offlineFirst',
      onSuccess: () => {
        // Invalidate related queries after successful mutations
        queryClient.invalidateQueries();
      }
    },
  },
});

// Import the PageSkeleton component
import { PageSkeleton } from '@/components/ui/loading-skeleton';

// Loading component for suspense
const PageLoader = ({ type }: { type?: 'patients' | 'appointments' | 'form' | 'dashboard' | 'default' }) => {
  return <PageSkeleton type={type} />;
};

function App() {
  useEffect(() => {
    // Network monitoring
    const networkMonitor = createNetworkMonitor();
    const unsubscribe = networkMonitor.subscribe((online) => {
      if (online) {
        toast.success('تم استعادة الاتصال بالإنترنت');
      } else {
        toast.error('تم فقدان الاتصال بالإنترنت', {
          description: 'سيتم حفظ التغييرات محلياً'
        });
      }
    });

    // Listen for service worker updates
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.addEventListener('message', (event) => {
        if (event.data && event.data.type === 'SW_UPDATED') {
          toast.info('تحديث جديد متاح', {
            description: 'انقر لإعادة تحميل الصفحة',
            action: {
              label: 'إعادة تحميل',
              onClick: () => window.location.reload()
            }
          });
        }
      });
    }

    return () => {
      unsubscribe();
    };
  }, []);

  return (
    <EnhancedErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <BrowserRouter 
          future={{
            v7_startTransition: true,
            v7_relativeSplatPath: true
          }}
        >
          <LanguageProvider>
            <SettingsProvider>
              <SidebarProvider>
                <ThemeProvider>
                  <CurrencyProvider>
                    <PermissionsProvider>
                      <TooltipProvider>
                        <div className="min-h-screen bg-background">
                          <Suspense fallback={<PageLoader />}>
                            <Routes>
                          {/* Public routes */}
                          <Route path="/book" element={<PublicBookingLanding />} />
                          <Route path="/book/:clinic" element={<PublicBooking />} />
                          <Route path="/auth" element={<Auth />} />
                          
                          {/* Protected routes with main layout */}
                          <Route path="/" element={
                            <SimpleProtectedRoute>
                              <MainLayout />
                            </SimpleProtectedRoute>
                          }>
                    <Route index element={<Index />} />
                    <Route path="patients" element={<Patients />} />
                    <Route path="patients/:id" element={<PatientProfile />} />
                    <Route path="appointments" element={<Appointments />} />
                    <Route path="appointments/new" element={<NewAppointment />} />
                    <Route path="appointment-requests" element={<AppointmentRequests />} />
                    <Route path="medical-records" element={<MedicalRecords />} />
                    <Route path="smart-diagnosis" element={<SmartDiagnosis />} />
                    <Route path="ai-insights" element={<AIInsights />} />
                    <Route path="settings" element={<Settings />} />
                    <Route path="doctors" element={<Doctors />} />
                    <Route path="doctor-assistants" element={<DoctorAssistants />} />
                    <Route path="secretaries" element={<Secretaries />} />
                    <Route path="invoices" element={<Invoices />} />
                    <Route path="payments" element={<Payments />} />
                    <Route path="inventory" element={<Inventory />} />
                    <Route path="service-prices" element={<ServicePrices />} />
                    <Route path="purchase-orders" element={<PurchaseOrders />} />
                    <Route path="stock-movements" element={<StockMovements />} />
                     <Route path="dental-treatments" element={<DentalTreatments />} />
                     <Route path="treatments" element={<Treatments />} />
                      <Route path="advanced-3d-dental" element={<Advanced3DDental />} />
                      <Route path="dental-models-admin" element={<DentalModelsAdmin />} />
                      <Route path="advanced-3d-dental-editor/:patientId/:toothNumber" element={<Advanced3DDentalEditor />} />
                      <Route path="advanced-tooth-editor/:patientId/:toothNumber" element={<AdvancedToothEditor />} />
                      <Route path="ToothAnatomy" element={<ToothAnatomy />} />
                      <Route path="notifications" element={<Notifications />} />
                    <Route path="notification-templates" element={<NotificationTemplates />} />
                    <Route path="reports" element={<Reports />} />
                    <Route path="medications" element={<Medications />} />
                    <Route path="prescriptions" element={<Prescriptions />} />
                    <Route path="permissions" element={<Permissions />} />
                    <Route path="profile" element={<Profile />} />
                    <Route path="profile/:userId" element={<Profile />} />
                    <Route path="users" element={<Users />} />
                    <Route path="security-audit" element={<SecurityAudit />} />
                     <Route path="super-admin" element={<SuperAdmin />} />
                     <Route path="subscription-plans" element={<SubscriptionPlans />} />
                     <Route path="subscription" element={<SubscriptionManagement />} />
                     
                     {/* New feature routes */}
                     <Route path="dental-treatments-management" element={<DentalTreatmentsManagement />} />
                     <Route path="advanced-medical-records" element={<AdvancedMedicalRecords />} />
                     <Route path="ai-management-dashboard" element={<AIManagementDashboard />} />
                     <Route path="smart-diagnosis-system" element={<SmartDiagnosisSystem />} />
                     <Route path="ai-insights-page" element={<AIInsightsPage />} />
                     <Route path="advanced-notification-management" element={<AdvancedNotificationManagement />} />
                     <Route path="custom-notification-templates" element={<CustomNotificationTemplates />} />
                     <Route path="detailed-reports" element={<DetailedReports />} />
                     <Route path="advanced-permissions-management" element={<AdvancedPermissionsManagement />} />
                     <Route path="advanced-user-management" element={<AdvancedUserManagement />} />
                     <Route path="advanced-management" element={<AdvancedManagement />} />
                     <Route path="comprehensive-security-audit" element={<ComprehensiveSecurityAudit />} />
                     <Route path="dental-3d-models-management" element={<Dental3DModelsManagement />} />
                     <Route path="enhanced-dental-chart-demo" element={<EnhancedDentalChartDemo patientId="demo-patient-123" />} />
                     <Route path="financial-integration-test" element={<FinancialIntegrationTest />} />
                     
                     <Route path="under-development" element={<UnderDevelopment />} />
                     <Route path="splash-cursor-demo" element={<SplashCursorDemo />} />
                  </Route>

                  {/* Public demo routes */}
                  <Route path="/demos/noise" element={<NoiseDemo />} />
                  
                   {/* 404 route */}
                   <Route path="*" element={<NotFound />} />
                            </Routes>
                          </Suspense>
                          <Toaster />
                        </div>
                      </TooltipProvider>
                    </PermissionsProvider>
                  </CurrencyProvider>
                </ThemeProvider>
              </SidebarProvider>
            </SettingsProvider>
          </LanguageProvider>
        </BrowserRouter>
      </QueryClientProvider>
    </EnhancedErrorBoundary>
  );
}

export default App;