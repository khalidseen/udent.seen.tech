import { BrowserRouter, Route, Routes, Outlet } from "react-router-dom";
import { AppProviders } from "@/contexts/AppProviders";
import { lazy, Suspense, memo } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { SimpleProtectedRoute } from "@/components/auth/SimpleProtectedRoute";
import { ErrorBoundary } from "@/components/ui/error-boundary";
import { OptimizedPageLoader } from "@/components/layout/OptimizedPageLoader";
import Auth from "@/pages/Auth";

const PageLoader = memo(() => <OptimizedPageLoader type="default" />);
PageLoader.displayName = "PageLoader";

// Route-to-import map for prefetching
const routeImports: Record<string, () => Promise<any>> = {
  '/': () => import("@/pages/Index"),
  '/patients': () => import("@/pages/Patients"),
  '/appointments': () => import("@/pages/Appointments"),
  '/settings': () => import("@/pages/Settings"),
  '/doctors': () => import("@/pages/Doctors"),
  '/financial-overview': () => import("@/pages/FinancialOverview"),
  '/inventory': () => import("@/pages/Inventory"),
  '/invoice-management': () => import("@/pages/InvoiceManagement"),
  '/payment-management': () => import("@/pages/PaymentManagement"),
  '/dental-treatments-management': () => import("@/pages/DentalTreatmentsManagement"),
  '/doctor-assistants': () => import("@/pages/DoctorAssistants"),
  '/secretaries': () => import("@/pages/Secretaries"),
  '/detailed-reports': () => import("@/pages/DetailedReports"),
  '/insurance-management': () => import("@/pages/InsuranceManagement"),
  '/prescriptions': () => import("@/pages/Prescriptions"),
  '/treatment-plans': () => import("@/pages/TreatmentPlans"),
  '/financial-reports': () => import("@/pages/FinancialReports"),
  '/medications': () => import("@/pages/Medications"),
  '/purchase-orders': () => import("@/pages/PurchaseOrders"),
  '/stock-movements': () => import("@/pages/StockMovements"),
  '/dental-lab': () => import("@/pages/DentalLabManagement"),
  '/smart-scheduling': () => import("@/pages/SmartScheduling"),
  '/communication-center': () => import("@/pages/CommunicationCenter"),
  '/advanced-permissions-management': () => import("@/pages/AdvancedPermissionsManagement"),
  '/advanced-user-management': () => import("@/pages/AdvancedUserManagement"),
  '/advanced-notification-management': () => import("@/pages/AdvancedNotificationManagement"),
  '/advanced-medical-records': () => import("@/pages/AdvancedMedicalRecords"),
  '/comprehensive-security-audit': () => import("@/pages/ComprehensiveSecurityAudit"),
  '/profile': () => import("@/pages/Profile"),
  '/service-prices': () => import("@/pages/ServicePrices"),
  '/ai-management-dashboard': () => import("@/pages/AIManagementDashboard"),
  '/integrations': () => import("@/pages/Integrations"),
};

// Prefetch a route's chunk on hover
const prefetchedRoutes = new Set<string>();
export function prefetchRoute(path: string) {
  if (prefetchedRoutes.has(path)) return;
  const importer = routeImports[path];
  if (importer) {
    prefetchedRoutes.add(path);
    importer().catch(() => {
      prefetchedRoutes.delete(path);
    });
  }
}

// Lazy loaded pages (use same imports)
const Index = lazy(() => import("@/pages/Index"));
const Patients = lazy(() => import("@/pages/Patients"));
const PatientProfile = lazy(() => import("@/pages/PatientProfile"));
const EditPatient = lazy(() => import("@/pages/EditPatient"));
const Appointments = lazy(() => import("@/pages/Appointments"));
const NewAppointment = lazy(() => import("@/pages/NewAppointment"));
const PublicBooking = lazy(() => import("@/pages/PublicBooking"));
const Settings = lazy(() => import("@/pages/Settings"));
const Doctors = lazy(() => import("@/pages/Doctors"));
const DoctorProfile = lazy(() => import("@/pages/DoctorProfile"));
const AIInsights = lazy(() => import("@/pages/AIInsights"));
const DoctorAssistants = lazy(() => import("@/pages/DoctorAssistants"));
const Secretaries = lazy(() => import("@/pages/Secretaries"));
const AppointmentRequests = lazy(() => import("@/pages/AppointmentRequests"));
const DoctorApplications = lazy(() => import("@/pages/DoctorApplications"));
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
const PatientFinancialTransactions = lazy(() => import("@/pages/PatientFinancialTransactions"));
const InvoiceManagement = lazy(() => import("@/pages/InvoiceManagement"));
const PaymentManagement = lazy(() => import("@/pages/PaymentManagement"));
const ServicePrices = lazy(() => import("@/pages/ServicePrices"));
const DentalLabManagement = lazy(() => import("@/pages/DentalLabManagement"));
const SmartScheduling = lazy(() => import("@/pages/SmartScheduling"));
const CommunicationCenter = lazy(() => import("@/pages/CommunicationCenter"));
const InsuranceManagement = lazy(() => import("@/pages/InsuranceManagement"));
const NotFound = lazy(() => import("@/pages/NotFound"));

function App() {
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
                  <Route path="doctors/:doctorId" element={<DoctorProfile />} />
                  <Route path="medical-records" element={<MedicalRecords />} />
                  <Route path="dental-treatments" element={<DentalTreatments />} />
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
                  <Route path="dental-lab" element={<DentalLabManagement />} />
                  <Route path="smart-scheduling" element={<SmartScheduling />} />
                  <Route path="communication-center" element={<CommunicationCenter />} />
                  <Route path="insurance-management" element={<InsuranceManagement />} />
                </Route>
                
                <Route path="*" element={<NotFound />} />
              </Routes>
            </Suspense>
          </ErrorBoundary>
        </div>
      </BrowserRouter>
    </AppProviders>
  );
}

export default App;
