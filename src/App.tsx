import { BrowserRouter, Route, Routes, Outlet } from "react-router-dom";
import { AppProviders } from "@/contexts/AppProviders";
import { lazy, Suspense, memo, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { MainLayout } from "@/components/layout/MainLayout";
import { SimpleProtectedRoute } from "@/components/auth/SimpleProtectedRoute";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { ErrorBoundary } from "@/components/ui/error-boundary";
import { OptimizedPageLoader } from "@/components/layout/OptimizedPageLoader";
import { useAuth } from "@/hooks/useAuth";
import { DevInspector } from "@/components/DevInspector";
import { VisualEditor } from "@/components/VisualEditor";

const PageLoader = memo(() => <OptimizedPageLoader type="default" />);
PageLoader.displayName = "PageLoader";

// Route-to-import map for prefetching
const routeImports: Record<string, () => Promise<any>> = {
  '/auth': () => import("@/pages/Auth"),
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

  '/medications': () => import("@/pages/Medications"),
  '/purchase-orders': () => import("@/pages/PurchaseOrders"),
  '/stock-movements': () => import("@/pages/StockMovements"),
  '/dental-lab': () => import("@/pages/DentalLabManagement"),
  '/smart-scheduling': () => import("@/pages/SmartScheduling"),

  '/advanced-permissions-management': () => import("@/pages/AdvancedPermissionsManagement"),
  '/advanced-user-management': () => import("@/pages/AdvancedUserManagement"),
  '/advanced-notification-management': () => import("@/pages/AdvancedNotificationManagement"),

  '/comprehensive-security-audit': () => import("@/pages/ComprehensiveSecurityAudit"),
  '/profile': () => import("@/pages/Profile"),
  '/service-prices': () => import("@/pages/ServicePrices"),

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

const CORE_PREFETCH_ROUTES = [
  '/patients',
  '/appointments',
  '/dental-treatments-management',
  '/financial-overview',
  '/doctors',
  '/inventory',
] as const;

const EXTENDED_PREFETCH_ROUTES = [
  '/invoice-management',
  '/payment-management',
  '/prescriptions',
] as const;

function runWhenIdle(task: () => void, timeout = 1500) {
  const w = window as unknown as {
    requestIdleCallback?: (callback: () => void, options?: { timeout: number }) => number;
    cancelIdleCallback?: (id: number) => void;
  };

  if (typeof w.requestIdleCallback === 'function') {
    const id = w.requestIdleCallback(task, { timeout });
    return () => {
      if (typeof w.cancelIdleCallback === 'function') {
        w.cancelIdleCallback(id);
      }
    };
  }

  const id = window.setTimeout(task, 300);
  return () => window.clearTimeout(id);
}

function AuthPrefetchManager() {
  const { user } = useAuth();
  const location = useLocation();

  useEffect(() => {
    if (!user) return;

    const connection = (navigator as Navigator & {
      connection?: { saveData?: boolean; effectiveType?: string };
    }).connection;

    const shouldLimitPrefetch = Boolean(connection?.saveData) || /2g/.test(connection?.effectiveType || '');

    const routeSet = new Set<string>(CORE_PREFETCH_ROUTES);
    if (!shouldLimitPrefetch) {
      EXTENDED_PREFETCH_ROUTES.forEach((route) => routeSet.add(route));
    }

    if (location.pathname.startsWith('/patients')) {
      routeSet.add('/appointments/new');
    }
    if (location.pathname.startsWith('/appointments')) {
      routeSet.add('/patients');
    }

    const cleanupFns: Array<() => void> = [];
    Array.from(routeSet).forEach((route, index) => {
      const cancel = runWhenIdle(() => prefetchRoute(route), 1000 + index * 300);
      cleanupFns.push(cancel);
    });

    return () => {
      cleanupFns.forEach((cleanup) => cleanup());
    };
  }, [user, location.pathname]);

  return null;
}

// Lazy loaded pages (use same imports)
const Index = lazy(() => import("@/pages/Index"));
const Auth = lazy(() => import("@/pages/Auth"));
const Patients = lazy(() => import("@/pages/Patients"));
const PatientProfile = lazy(() => import("@/pages/PatientProfile"));
const EditPatient = lazy(() => import("@/pages/EditPatient"));
const Appointments = lazy(() => import("@/pages/Appointments"));
const NewAppointment = lazy(() => import("@/pages/NewAppointment"));
const PublicBooking = lazy(() => import("@/pages/PublicBooking"));
const Settings = lazy(() => import("@/pages/Settings"));
const Doctors = lazy(() => import("@/pages/Doctors"));
const DoctorProfile = lazy(() => import("@/pages/DoctorProfile"));

const DoctorAssistants = lazy(() => import("@/pages/DoctorAssistants"));
const Secretaries = lazy(() => import("@/pages/Secretaries"));
const AppointmentRequests = lazy(() => import("@/pages/AppointmentRequests"));
const DoctorApplications = lazy(() => import("@/pages/DoctorApplications"));
const FinancialOverview = lazy(() => import("@/pages/FinancialOverview"));
const Inventory = lazy(() => import("@/pages/Inventory"));
const Medications = lazy(() => import("@/pages/Medications"));
const Prescriptions = lazy(() => import("@/pages/Prescriptions"));
const PurchaseOrders = lazy(() => import("@/pages/PurchaseOrders"));
const StockMovements = lazy(() => import("@/pages/StockMovements"));
const DentalTreatmentsManagement = lazy(() => import("@/pages/DentalTreatmentsManagement"));

const AdvancedNotificationManagement = lazy(() => import("@/pages/AdvancedNotificationManagement"));
const CustomNotificationTemplates = lazy(() => import("@/pages/CustomNotificationTemplates"));
const DetailedReports = lazy(() => import("@/pages/DetailedReports"));
const AdvancedPermissionsManagement = lazy(() => import("@/pages/AdvancedPermissionsManagement"));
const AdvancedUserManagement = lazy(() => import("@/pages/AdvancedUserManagement"));
const ComprehensiveSecurityAudit = lazy(() => import("@/pages/ComprehensiveSecurityAudit"));

const SuperAdmin = lazy(() => import("@/pages/SuperAdmin"));
const SubscriptionPlans = lazy(() => import("@/pages/SubscriptionPlans"));
const SubscriptionManagement = lazy(() => import("@/pages/SubscriptionManagement"));
const Integrations = lazy(() => import("@/pages/Integrations"));
const Profile = lazy(() => import("@/pages/Profile"));

const InvoiceManagement = lazy(() => import("@/pages/InvoiceManagement"));
const PaymentManagement = lazy(() => import("@/pages/PaymentManagement"));
const ServicePrices = lazy(() => import("@/pages/ServicePrices"));
const DentalLabManagement = lazy(() => import("@/pages/DentalLabManagement"));
const SmartScheduling = lazy(() => import("@/pages/SmartScheduling"));

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
        <AuthPrefetchManager />
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
                  <Route path="doctor-assistants" element={<DoctorAssistants />} />
                  <Route path="secretaries" element={<Secretaries />} />
                  <Route path="financial-overview" element={<FinancialOverview />} />

                  <Route path="invoice-management" element={
                    <ProtectedRoute permissions={['financial.view', 'invoices.view']}>
                      <InvoiceManagement />
                    </ProtectedRoute>
                  } />
                  <Route path="payment-management" element={
                    <ProtectedRoute permissions={['financial.view', 'payments.view']}>
                      <PaymentManagement />
                    </ProtectedRoute>
                  } />
                  <Route path="inventory" element={<Inventory />} />
                  <Route path="medications" element={<Medications />} />
                  <Route path="prescriptions" element={<Prescriptions />} />
                  <Route path="purchase-orders" element={<PurchaseOrders />} />
                  <Route path="stock-movements" element={<StockMovements />} />
                  <Route path="dental-treatments-management" element={
                    <ProtectedRoute permissions={['treatments.view', 'dental_treatments.view']}>
                      <DentalTreatmentsManagement />
                    </ProtectedRoute>
                  } />

                  
                  <Route path="advanced-notification-management" element={<AdvancedNotificationManagement />} />
                  <Route path="custom-notification-templates" element={<CustomNotificationTemplates />} />
                  <Route path="detailed-reports" element={<DetailedReports />} />
                  <Route path="advanced-permissions-management" element={
                    <ProtectedRoute permissions={['settings.manage', 'users.manage']}>
                      <AdvancedPermissionsManagement />
                    </ProtectedRoute>
                  } />
                  <Route path="advanced-user-management" element={
                    <ProtectedRoute permissions={['users.view', 'users.manage']}>
                      <AdvancedUserManagement />
                    </ProtectedRoute>
                  } />
                  <Route path="comprehensive-security-audit" element={
                    <ProtectedRoute permissions={['system.manage', 'settings.manage']}>
                      <ComprehensiveSecurityAudit />
                    </ProtectedRoute>
                  } />

                  <Route path="super-admin" element={
                    <ProtectedRoute roles={['super_admin']}>
                      <SuperAdmin />
                    </ProtectedRoute>
                  } />
                  <Route path="subscription-plans" element={<SubscriptionPlans />} />
                  <Route path="subscription" element={<SubscriptionManagement />} />
                  <Route path="integrations" element={<Integrations />} />
                  <Route path="profile" element={<Profile />} />
                  <Route path="profile/:userId" element={<Profile />} />

                  <Route path="service-prices" element={<ServicePrices />} />
                  <Route path="dental-lab" element={<DentalLabManagement />} />
                  <Route path="smart-scheduling" element={<SmartScheduling />} />

                  <Route path="insurance-management" element={<InsuranceManagement />} />
                </Route>
                
                <Route path="*" element={<NotFound />} />
              </Routes>
            </Suspense>
          </ErrorBoundary>
          <DevInspector />
          <VisualEditor />
        </div>
      </BrowserRouter>
    </AppProviders>
  );
}

export default App;
