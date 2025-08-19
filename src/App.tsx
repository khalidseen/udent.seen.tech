import React from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "@/components/ui/toaster";
import { MainLayout } from "./components/layout/MainLayout";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import NewAppointment from "./pages/NewAppointment";
import Patients from "./pages/Patients";
import PatientProfile from "./pages/PatientProfile";
import Treatments from "./pages/Treatments";
import AddPatientForm from "./components/patients/AddPatientForm";
import Appointments from "./pages/Appointments";
import PublicBooking from "./pages/PublicBooking";
import AppointmentRequests from "./pages/AppointmentRequests";
import Auth from "./pages/Auth";
import DoctorApplications from "./pages/DoctorApplications";
import Invoices from "./pages/Invoices";
import ServicePrices from "./pages/ServicePrices";
import Inventory from "./pages/Inventory";
import MedicalRecords from "./pages/MedicalRecords";
import Settings from "./pages/Settings";
import Reports from "./pages/Reports";
import Notifications from "./pages/Notifications";
import { ProtectedRoute } from "./components/auth/ProtectedRoute";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      gcTime: 10 * 60 * 1000, // 10 minutes
      refetchOnWindowFocus: false,
      retry: 2
    },
  },
});

const App = () => {
  return (
    <React.StrictMode>
      <QueryClientProvider client={queryClient}>
        <TooltipProvider delayDuration={300}>
          <BrowserRouter>
            <Routes>
              {/* Public routes without MainLayout */}
              <Route path="/book" element={<PublicBooking />} />
              <Route path="/auth" element={<Auth />} />
              
              {/* Protected routes with MainLayout */}
              <Route path="/" element={
                <ProtectedRoute>
                  <MainLayout>
                    <Index />
                  </MainLayout>
                </ProtectedRoute>
              } />
              <Route path="/patients" element={
                <ProtectedRoute>
                  <MainLayout>
                    <Patients />
                  </MainLayout>
                </ProtectedRoute>
              } />
              <Route path="/patients/:patientId" element={
                <ProtectedRoute>
                  <MainLayout>
                    <PatientProfile />
                  </MainLayout>
                </ProtectedRoute>
              } />
              <Route path="/add-patient" element={
                <ProtectedRoute>
                  <MainLayout>
                    <AddPatientForm />
                  </MainLayout>
                </ProtectedRoute>
              } />
              <Route path="/appointments" element={
                <ProtectedRoute>
                  <MainLayout>
                    <Appointments />
                  </MainLayout>
                </ProtectedRoute>
              } />
              <Route path="/appointment-requests" element={
                <ProtectedRoute>
                  <MainLayout>
                    <AppointmentRequests />
                  </MainLayout>
                </ProtectedRoute>
              } />
              <Route path="/new-appointment" element={
                <ProtectedRoute>
                  <MainLayout>
                    <NewAppointment />
                  </MainLayout>
                </ProtectedRoute>
              } />
              <Route path="/treatments" element={
                <ProtectedRoute>
                  <MainLayout>
                    <Treatments />
                  </MainLayout>
                </ProtectedRoute>
              } />
              <Route path="/invoices" element={
                <ProtectedRoute>
                  <MainLayout>
                    <Invoices />
                  </MainLayout>
                </ProtectedRoute>
              } />
              <Route path="/service-prices" element={
                <ProtectedRoute>
                  <MainLayout>
                    <ServicePrices />
                  </MainLayout>
                </ProtectedRoute>
              } />
              <Route path="/inventory" element={
                <ProtectedRoute>
                  <MainLayout>
                    <Inventory />
                  </MainLayout>
                </ProtectedRoute>
              } />
              <Route path="/medical-records" element={
                <ProtectedRoute>
                  <MainLayout>
                    <MedicalRecords />
                  </MainLayout>
                </ProtectedRoute>
              } />
              <Route path="/doctor-applications" element={
                <ProtectedRoute>
                  <MainLayout>
                    <DoctorApplications />
                  </MainLayout>
                </ProtectedRoute>
              } />
              <Route path="/settings" element={
                <ProtectedRoute>
                  <MainLayout>
                    <Settings />
                  </MainLayout>
                </ProtectedRoute>
              } />
              <Route path="/reports" element={
                <ProtectedRoute>
                  <MainLayout>
                    <Reports />
                  </MainLayout>
                </ProtectedRoute>
              } />
              <Route path="/notifications" element={
                <ProtectedRoute>
                  <MainLayout>
                    <Notifications />
                  </MainLayout>
                </ProtectedRoute>
              } />
              <Route path="*" element={<NotFound />} />
            </Routes>
            <Toaster />
          </BrowserRouter>
        </TooltipProvider>
      </QueryClientProvider>
    </React.StrictMode>
  );
};

export default App;
