import { BrowserRouter, Route, Routes, Outlet } from "react-router-dom";
import { AppProviders } from "@/contexts/AppProviders";
import { useEffect, lazy, Suspense, memo } from "react";
import { toast } from "sonner";
import { performanceMonitor } from "@/lib/performance-monitor";
import { MainLayout } from "@/components/layout/MainLayout";
import { SimpleProtectedRoute } from "@/components/auth/SimpleProtectedRoute";
import { ErrorBoundary } from "@/components/ui/error-boundary";
import { PerformanceMonitor } from "@/components/performance/PerformanceMonitor";
import { PerformanceDashboard } from "@/components/performance/PerformanceDashboard";
import { OptimizedPageLoader } from "@/components/layout/OptimizedPageLoader";
import { DatabaseKeepAlive } from "@/components/system/DatabaseKeepAlive";
import { injectCriticalCSS } from "@/lib/critical-css";
import { setupSupabaseHints, setupFontHints } from "@/lib/resource-hints";
import Auth from "@/pages/Auth";

const PageLoader = memo(() => <OptimizedPageLoader type="default" />);
PageLoader.displayName = "PageLoader";

// offlineDB is initialized once at module level (line 88-89)

const Index = lazy(() => import("@/pages/Index"));
const Patients = lazy(() => import("@/pages/Patients"));
const PatientProfile = lazy(() => import("@/pages/PatientProfile"));
const EditPatient = lazy(() => import("@/pages/EditPatient"));
const Appointments = lazy(() => import("@/pages/Appointments"));
const NewAppointment = lazy(() => import("@/pages/NewAppointment"));
const PublicBooking = lazy(() => import("@/pages/PublicBooking"));
const Settings = lazy(() => import("@/pages/Settings"));
const Doctors = lazy(() => import("@/pages/Doctors"));
const MedicalRecords = lazy(() => import("@/pages/MedicalRecords"));
const DentalTreatments = lazy(() => import("@/pages/DentalTreatments"));
const AIInsights = lazy(() => import("@/pages/AIInsights"));
const Reports = lazy(() => import("@/pages/Reports"));
const Notifications = lazy(() => import("@/pages/Notifications"));
const DoctorAssistants = lazy(() => import("@/pages/DoctorAssistants"));
const Secretaries = lazy(() => import("@/pages/Secretaries"));
const AppointmentRequests = lazy(() => import("@/pages/AppointmentRequests"));
const DoctorApplications = lazy(() => import("@/pages/DoctorApplications"));
const Invoices = lazy(() => import("@/pages/Invoices"));
const Payments = lazy(() => import("@/pages/Payments"));
const FinancialOverview = lazy(() => import("@/pages/FinancialOverview"));
const TreatmentPlans = lazy(() => import("@/pages/TreatmentPlans"));
const FinancialReports = lazy(() => import("@/pages/FinancialReports"));
const Inventory = lazy(() => import("@/pages/Inventory"));
const Medications = lazy(() => import("@/pages/Medications"));
const Prescriptions = lazy(() => import("@/pages/Prescriptions"));
const PurchaseOrders = lazy(() => import("@/pages/PurchaseOrders"));
const StockMovements = lazy(() => import("@/pages/StockMovements"));
const DentalTreatmentsManagement = lazy(() => import("@/pages/DentalTreatmentsManagement"));
const AdvancedMedicalRecords = lazy(() => import("@/pages/AdvancedMedicalRecords"));
const AIManagementDashboard = lazy(() => import("@/pages/AIManagementDashboard"));
const SmartDiagnosis = lazy(() => import("@/pages/SmartDiagnosis"));
const AdvancedNotificationManagement = lazy(() => import("@/pages/AdvancedNotificationManagement"));
const CustomNotificationTemplates = lazy(() => import("@/pages/CustomNotificationTemplates"));
const DetailedReports = lazy(() => import("@/pages/DetailedReports"));
const AdvancedPermissionsManagement = lazy(() => import("@/pages/AdvancedPermissionsManagement"));
const AdvancedUserManagement = lazy(() => import("@/pages/AdvancedUserManagement"));
const ComprehensiveSecurityAudit = lazy(() => import("@/pages/ComprehensiveSecurityAudit"));
const Dental3DModelsManagement = lazy(() => import("@/pages/Dental3DModelsManagement"));
const SuperAdmin = lazy(() => import("@/pages/SuperAdmin"));
const SubscriptionPlans = lazy(() => import("@/pages/SubscriptionPlans"));
const SubscriptionManagement = lazy(() => import("@/pages/SubscriptionManagement"));
const Integrations = lazy(() => import("@/pages/Integrations"));
const Profile = lazy(() => import("@/pages/Profile"));
const Users = lazy(() => import("@/pages/Users"));
const Permissions = lazy(() => import("@/pages/Permissions"));
const PatientFinancialTransactions = lazy(() => import("@/pages/PatientFinancialTransactions"));
const InvoiceManagement = lazy(() => import("@/pages/InvoiceManagement"));
const PaymentManagement = lazy(() => import("@/pages/PaymentManagement"));
const ServicePrices = lazy(() => import("@/pages/ServicePrices"));
const SecurityAudit = lazy(() => import("@/pages/SecurityAudit"));
const NotificationTemplates = lazy(() => import("@/pages/NotificationTemplates"));
const NotFound = lazy(() => import("@/pages/NotFound"));

import { offlineDB } from "@/lib/offline-db";
offlineDB.init().catch(console.error);

function App() {
  useEffect(() => {
    performanceMonitor.start('app-initialization');
    
    // Inject critical CSS
    injectCriticalCSS();
    
    // Setup resource hints
    setupFontHints();
    if (import.meta.env.VITE_SUPABASE_URL) {
      setupSupabaseHints(import.meta.env.VITE_SUPABASE_URL);
    }
    
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

    performanceMonitor.end('app-initialization');

    if (process.env.NODE_ENV === 'development') {
      const memoryInterval = setInterval(() => {
        const memory = performanceMonitor.getMemoryUsage();
        if (memory && memory.usedPercentage > 90) {
          console.warn('⚠️ High memory usage detected:', memory.usedPercentage.toFixed(2) + '%');
        }
      }, 30000);

      return () => clearInterval(memoryInterval);
    }
  }, []);

  return (
    <AppProviders>
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
                  <Route path="/auth" element={<Auth />} />
                  
                  <Route path="/" element={
                    <SimpleProtectedRoute>
                      <MainLayout>
                        <Outlet />
                      </MainLayout>
                    </SimpleProtectedRoute>
                  }>
                    <Route index element={<Index />} />
                    <Route path="patients" element={<Patients />} />
                    <Route path="patients/:patientId" element={<PatientProfile />} />
                    <Route path="patients/edit/:patientId" element={<EditPatient />} />
                    <Route path="appointments" element={<Appointments />} />
                    <Route path="appointments/new" element={<NewAppointment />} />
                    <Route path="book" element={<PublicBooking />} />
                    <Route path="appointment-requests" element={<AppointmentRequests />} />
                    <Route path="doctor-applications" element={<DoctorApplications />} />
                    <Route path="settings" element={<Settings />} />
                    <Route path="doctors" element={<Doctors />} />
                    <Route path="medical-records" element={<MedicalRecords />} />
                    <Route path="dental-treatments" element={<DentalTreatments />} />
                    <Route path="ai-insights" element={<AIInsights />} />
                    <Route path="reports" element={<Reports />} />
                    <Route path="notifications" element={<Notifications />} />
                    <Route path="doctor-assistants" element={<DoctorAssistants />} />
                    <Route path="secretaries" element={<Secretaries />} />
                    <Route path="invoices" element={<Invoices />} />
                    <Route path="payments" element={<Payments />} />
                    <Route path="financial-overview" element={<FinancialOverview />} />
                    <Route path="treatment-plans" element={<TreatmentPlans />} />
                    <Route path="financial-reports" element={<FinancialReports />} />
                    <Route path="invoice-management" element={<InvoiceManagement />} />
                    <Route path="payment-management" element={<PaymentManagement />} />
                    <Route path="inventory" element={<Inventory />} />
                    <Route path="medications" element={<Medications />} />
                    <Route path="prescriptions" element={<Prescriptions />} />
                    <Route path="purchase-orders" element={<PurchaseOrders />} />
                    <Route path="stock-movements" element={<StockMovements />} />
                    <Route path="dental-treatments-management" element={<DentalTreatmentsManagement />} />
                    <Route path="advanced-medical-records" element={<AdvancedMedicalRecords />} />
                    <Route path="ai-management-dashboard" element={<AIManagementDashboard />} />
                    <Route path="smart-diagnosis-system" element={<SmartDiagnosis />} />
                    <Route path="ai-insights-page" element={<AIInsights />} />
                    <Route path="advanced-notification-management" element={<AdvancedNotificationManagement />} />
                    <Route path="custom-notification-templates" element={<CustomNotificationTemplates />} />
                    <Route path="detailed-reports" element={<DetailedReports />} />
                    <Route path="advanced-permissions-management" element={<AdvancedPermissionsManagement />} />
                    <Route path="advanced-user-management" element={<AdvancedUserManagement />} />
                    <Route path="comprehensive-security-audit" element={<ComprehensiveSecurityAudit />} />
                    <Route path="dental-3d-models-management" element={<Dental3DModelsManagement />} />
                    <Route path="super-admin" element={<SuperAdmin />} />
                    <Route path="subscription-plans" element={<SubscriptionPlans />} />
                    <Route path="subscription" element={<SubscriptionManagement />} />
                    <Route path="integrations" element={<Integrations />} />
                    <Route path="permissions" element={<Permissions />} />
                    <Route path="profile" element={<Profile />} />
                    <Route path="profile/:userId" element={<Profile />} />
                    <Route path="users" element={<Users />} />
                    <Route path="financial-transactions" element={<PatientFinancialTransactions />} />
                    <Route path="service-prices" element={<ServicePrices />} />
                    <Route path="security-audit" element={<SecurityAudit />} />
                    <Route path="notification-templates" element={<NotificationTemplates />} />
                  </Route>
                  
                  <Route path="*" element={<NotFound />} />
              </Routes>
            </Suspense>
          </ErrorBoundary>
          <DatabaseKeepAlive />
          <PerformanceMonitor />
          <PerformanceDashboard />
        </div>
      </BrowserRouter>
    </AppProviders>
  );
}

export default App;
