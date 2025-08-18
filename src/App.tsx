import React from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
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

const App = () => (
  <QueryClientProvider client={queryClient}>
    <BrowserRouter>
      <Routes>
          {/* Public routes without MainLayout */}
          <Route path="/book" element={<PublicBooking />} />
          <Route path="/auth" element={<Auth />} />
          
          {/* Protected routes with MainLayout */}
          <Route path="/*" element={
            <ProtectedRoute>
              <MainLayout>
                <Routes>
                  <Route path="/" element={<Index />} />
                  <Route path="/patients" element={<Patients />} />
                  <Route path="/patients/:patientId" element={<PatientProfile />} />
                  <Route path="/add-patient" element={<AddPatientForm />} />
                  <Route path="/appointments" element={<Appointments />} />
                  <Route path="/appointment-requests" element={<AppointmentRequests />} />
                  <Route path="/new-appointment" element={<NewAppointment />} />
                  <Route path="/treatments" element={<Treatments />} />
                  <Route path="/doctor-applications" element={<DoctorApplications />} />
                  {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </MainLayout>
            </ProtectedRoute>
          } />
        </Routes>
      </BrowserRouter>
  </QueryClientProvider>
);

export default App;
