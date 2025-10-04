import { BrowserRouter, Route, Routes, Outlet } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { LanguageProvider } from "@/contexts/LanguageContext";
import { SettingsProvider } from "@/contexts/SettingsContext";
import { SidebarProvider } from "@/contexts/SidebarContext";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { PermissionsProvider } from "@/contexts/PermissionsContext";
import { CurrencyProvider } from "@/contexts/CurrencyContext";
import { useEffect, lazy, Suspense } from "react";
import { toast } from "sonner";

// Layout components
import { MainLayout } from "@/components/layout/MainLayout";
import { SimpleProtectedRoute } from "@/components/auth/SimpleProtectedRoute";
import { ErrorBoundary } from "@/components/ui/error-boundary";

// Auth page - NOT lazy loaded (must be immediate)
import Auth from "@/pages/Auth";

// Loading component
const PageLoader = () => (
  <div className="flex items-center justify-center min-h-screen">
    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
  </div>
);

// Lazy-loaded Page components for better performance
const Index = lazy(() => import("@/pages/Index"));
const Patients = lazy(() => import("@/pages/Patients"));
const Appointments = lazy(() => import("@/pages/Appointments"));
const NewAppointment = lazy(() => import("@/pages/NewAppointment"));
const Settings = lazy(() => import("@/pages/Settings"));
const Doctors = lazy(() => import("@/pages/Doctors"));
const DoctorAssistants = lazy(() => import("@/pages/DoctorAssistants"));
const Secretaries = lazy(() => import("@/pages/Secretaries"));
const AppointmentRequests = lazy(() => import("@/pages/AppointmentRequests"));
const DoctorApplications = lazy(() => import("@/pages/DoctorApplications"));
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
const Notifications = lazy(() => import("@/pages/Notifications"));
const NotificationTemplates = lazy(() => import("@/pages/NotificationTemplates"));
const Reports = lazy(() => import("@/pages/Reports"));
const AIInsights = lazy(() => import("@/pages/AIInsights"));
const SmartDiagnosis = lazy(() => import("@/pages/SmartDiagnosis"));
const Medications = lazy(() => import("@/pages/Medications"));
const Prescriptions = lazy(() => import("@/pages/Prescriptions"));
const NotFound = lazy(() => import("@/pages/NotFound"));
const SplashCursorDemo = lazy(() => import("@/pages/SplashCursorDemo"));
const NoiseDemo = lazy(() => import("@/pages/NoiseDemo"));
const SecurityAudit = lazy(() => import("@/pages/SecurityAudit"));
const Permissions = lazy(() => import("@/pages/Permissions"));
const Profile = lazy(() => import("@/pages/Profile"));
const Users = lazy(() => import("@/pages/Users"));
const SuperAdmin = lazy(() => import("@/pages/SuperAdmin"));
const SubscriptionPlans = lazy(() => import("@/pages/SubscriptionPlans"));
const SubscriptionManagement = lazy(() => import("@/pages/SubscriptionManagement"));
const UnderDevelopment = lazy(() => import("@/pages/UnderDevelopment").then(m => ({ default: m.UnderDevelopment })));
const DentalTreatmentsManagement = lazy(() => import("@/pages/DentalTreatmentsManagement"));
const AdvancedMedicalRecords = lazy(() => import("@/pages/AdvancedMedicalRecords"));
const AIManagementDashboard = lazy(() => import("@/pages/AIManagementDashboard"));
const SmartDiagnosisSystem = lazy(() => import("@/pages/SmartDiagnosisSystem"));
const AIInsightsPage = lazy(() => import("@/pages/AIInsightsPage"));
const AdvancedNotificationManagement = lazy(() => import("@/pages/AdvancedNotificationManagement"));
const CustomNotificationTemplates = lazy(() => import("@/pages/CustomNotificationTemplates"));
const DetailedReports = lazy(() => import("@/pages/DetailedReports"));
const AdvancedPermissionsManagement = lazy(() => import("@/pages/AdvancedPermissionsManagement"));
const AdvancedUserManagement = lazy(() => import("@/pages/AdvancedUserManagement"));
const ComprehensiveSecurityAudit = lazy(() => import("@/pages/ComprehensiveSecurityAudit"));
const Dental3DModelsManagement = lazy(() => import("@/pages/Dental3DModelsManagement"));
// const EnhancedDentalChartDemo = lazy(() => import("@/pages/EnhancedDentalChartDemo"));
// const FinancialIntegrationTest = lazy(() => import("@/components/debug/FinancialIntegrationTest"));
const Integrations = lazy(() => import("@/pages/Integrations"));

// Initialize the offline database
import { offlineDB } from "@/lib/offline-db";

// Initialize the database when the app starts
offlineDB.init().catch(console.error);

// Create a client for React Query with optimized performance settings
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes - better caching
      gcTime: 1000 * 60 * 30, // 30 minutes - longer cache retention
      retry: 1, // Reduce retries for faster failures
      refetchOnWindowFocus: false,
      refetchOnReconnect: false, // Reduce unnecessary refetches
      refetchOnMount: false, // Don't refetch on component mount if data exists
      networkMode: 'offlineFirst', // Better offline support
    },
    mutations: {
      retry: 0, // Don't retry mutations
      networkMode: 'offlineFirst',
    },
  },
});

function App() {
  useEffect(() => {
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
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <LanguageProvider>
        <SettingsProvider>
          <SidebarProvider>
            <ThemeProvider>
              <CurrencyProvider>
                <PermissionsProvider>
                  <TooltipProvider>
                  <BrowserRouter 
                    future={{
                      v7_startTransition: true,
                    v7_relativeSplatPath: true
                  }}
                >
                  <div className="min-h-screen bg-background">
                  <ErrorBoundary>
                  <Suspense fallback={<PageLoader />}>
                  <Routes>
                  {/* Public routes */}
                  {/* <Route path="/book" element={<PublicBookingLanding />} /> */}
                  {/* <Route path="/book/:clinic" element={<PublicBooking />} /> */}
                  <Route path="/auth" element={<Auth />} />
                  
                  {/* Protected routes with main layout */}
                  <Route path="/" element={
                    <SimpleProtectedRoute>
                      <MainLayout>
                        <Outlet />
                      </MainLayout>
                    </SimpleProtectedRoute>
                  }>
                  <Route index element={<Index />} />
                  <Route path="patients" element={<Patients />} />
                  <Route path="appointments" element={<Appointments />} />
                  <Route path="appointments/new" element={<NewAppointment />} />
                  <Route path="appointment-requests" element={<AppointmentRequests />} />
                  <Route path="doctor-applications" element={<DoctorApplications />} />
                    {/* <Route path="medical-records" element={<MedicalRecords />} /> */}
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
                     <Route path="integrations" element={<Integrations />} />
                     
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
                      <Route path="comprehensive-security-audit" element={<ComprehensiveSecurityAudit />} />
                      <Route path="dental-3d-models-management" element={<Dental3DModelsManagement />} />
                      {/* <Route path="enhanced-dental-chart-demo" element={<EnhancedDentalChartDemo patientId="demo-patient-123" />} /> */}
                      {/* <Route path="financial-integration-test" element={<FinancialIntegrationTest />} /> */}
                      
                      <Route path="under-development" element={<UnderDevelopment />} />
                      <Route path="splash-cursor-demo" element={<SplashCursorDemo />} />
                  </Route>

                  {/* Public demo routes */}
                  <Route path="/demos/noise" element={<NoiseDemo />} />
                  
                  {/* 404 route */}
                  <Route path="*" element={<NotFound />} />
                  </Routes>
                  </Suspense>
                  </ErrorBoundary>
                  <Toaster />
                </div>
              </BrowserRouter>
            </TooltipProvider>
          </PermissionsProvider>
        </CurrencyProvider>
        </ThemeProvider>
        </SidebarProvider>
      </SettingsProvider>
    </LanguageProvider>
  </QueryClientProvider>
  );
}

export default App;