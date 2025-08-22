// App configuration and setup
import { BrowserRouter, Route, Routes, Outlet } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useEffect } from "react";
import { toast } from "sonner";

// Layout components
import { MainLayout } from "@/components/layout/MainLayout";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";

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
import Invoices from "@/pages/Invoices";
import Payments from "@/pages/Payments";
import Inventory from "@/pages/Inventory";
import ServicePrices from "@/pages/ServicePrices";
import PurchaseOrders from "@/pages/PurchaseOrders";
import StockMovements from "@/pages/StockMovements";
import DentalTreatments from "@/pages/DentalTreatments";
import Treatments from "@/pages/Treatments";
import Advanced3DDental from "@/pages/Advanced3DDental";
import Notifications from "@/pages/Notifications";
import NotificationTemplates from "@/pages/NotificationTemplates";
import Reports from "@/pages/Reports";
import DoctorApplications from "@/pages/DoctorApplications";
import AIInsights from "@/pages/AIInsights";
import NotFound from "@/pages/NotFound";

// Initialize the offline database
import { offlineDB } from "@/lib/offline-db";

// Initialize the database when the app starts
offlineDB.init().catch(console.error);

// Create a client for React Query with optimized settings
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 10 * 60 * 1000, // 10 minutes
      gcTime: 30 * 60 * 1000, // 30 minutes
      retry: 2,
      refetchOnWindowFocus: false,
      refetchOnReconnect: true,
      refetchInterval: false, // Disable automatic refetching
    },
    mutations: {
      retry: 1,
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
      <TooltipProvider>
        <BrowserRouter>
          <Routes>
            {/* Public routes */}
            <Route path="/book" element={<PublicBooking />} />
            <Route path="/auth" element={<Auth />} />
            
            {/* Protected routes with main layout */}
            <Route path="/" element={
              <ProtectedRoute>
                <MainLayout>
                  <Outlet />
                </MainLayout>
              </ProtectedRoute>
            }>
              <Route index element={<Index />} />
              <Route path="patients" element={<Patients />} />
              <Route path="patients/:id" element={<PatientProfile />} />
              <Route path="appointments" element={<Appointments />} />
              <Route path="appointments/new" element={<NewAppointment />} />
              <Route path="appointment-requests" element={<AppointmentRequests />} />
              <Route path="medical-records" element={<MedicalRecords />} />
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
              <Route path="notifications" element={<Notifications />} />
              <Route path="notification-templates" element={<NotificationTemplates />} />
              <Route path="reports" element={<Reports />} />
              <Route path="doctor-applications" element={<DoctorApplications />} />
            </Route>
            
            {/* 404 route */}
            <Route path="*" element={<NotFound />} />
          </Routes>
          <Toaster />
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;