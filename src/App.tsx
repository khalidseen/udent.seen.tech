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
import { useEffect } from "react";
import { toast } from "sonner";

// Layout components
import { MainLayout } from "@/components/layout/MainLayout";
import { SimpleProtectedRoute } from "@/components/auth/SimpleProtectedRoute";

// Page components
import Index from "@/pages/Index";
import Auth from "@/pages/Auth";
import Patients from "@/pages/Patients";
import Appointments from "@/pages/Appointments";
import NewAppointment from "@/pages/NewAppointment";
import PatientProfile from "@/pages/PatientProfile";
import MedicalRecords from "@/pages/MedicalRecords";
import Settings from "@/pages/Settings";
import Doctors from "@/pages/Doctors";
import DoctorAssistants from "@/pages/DoctorAssistants";
import Secretaries from "@/pages/Secretaries";
import AppointmentRequests from "@/pages/AppointmentRequests";
import PublicBooking from "@/pages/PublicBooking";
import PublicBookingLanding from "@/pages/PublicBookingLanding";
import Invoices from "@/pages/Invoices";
import Payments from "@/pages/Payments";
import Inventory from "@/pages/Inventory";
import ServicePrices from "@/pages/ServicePrices";
import PurchaseOrders from "@/pages/PurchaseOrders";
import StockMovements from "@/pages/StockMovements";
import DentalTreatments from "@/pages/DentalTreatments";
import Treatments from "@/pages/Treatments";
import Advanced3DDental from "@/pages/Advanced3DDental";
import DentalModelsAdmin from "@/pages/DentalModelsAdmin";
import Advanced3DDentalEditor from "@/pages/Advanced3DDentalEditor";
import AdvancedToothEditor from "@/pages/AdvancedToothEditor";
import ToothAnatomy from "@/pages/ToothAnatomy";
import Notifications from "@/pages/Notifications";
import NotificationTemplates from "@/pages/NotificationTemplates";
import Reports from "@/pages/Reports";
import AIInsights from "@/pages/AIInsights";
import SmartDiagnosis from "@/pages/SmartDiagnosis";
import Medications from "@/pages/Medications";
import Prescriptions from "@/pages/Prescriptions";
import NotFound from "@/pages/NotFound";
import SplashCursorDemo from "@/pages/SplashCursorDemo";
import NoiseDemo from "@/pages/NoiseDemo";
import SecurityAudit from "@/pages/SecurityAudit";
import Permissions from "@/pages/Permissions";
import Profile from "@/pages/Profile";
import Users from "@/pages/Users";
import SuperAdmin from "@/pages/SuperAdmin";
import SubscriptionPlans from "@/pages/SubscriptionPlans";
import SubscriptionManagement from "@/pages/SubscriptionManagement";
import { UnderDevelopment } from "@/pages/UnderDevelopment";

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
  );
}
  );
);
}

export default App;