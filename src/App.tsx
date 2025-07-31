import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
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
import AppointmentList from "./components/appointments/AppointmentList";
import PublicBooking from "./pages/PublicBooking";
import AppointmentRequests from "./pages/AppointmentRequests";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          {/* Public routes without MainLayout */}
          <Route path="/book" element={<PublicBooking />} />
          
          {/* Protected routes with MainLayout */}
          <Route path="/*" element={
            <MainLayout>
              <Routes>
                <Route path="/" element={<Index />} />
                <Route path="/patients" element={<Patients />} />
                <Route path="/patients/:patientId" element={<PatientProfile />} />
                <Route path="/add-patient" element={<AddPatientForm />} />
                <Route path="/appointments" element={<AppointmentList />} />
                <Route path="/appointment-requests" element={<AppointmentRequests />} />
                <Route path="/new-appointment" element={<NewAppointment />} />
                <Route path="/treatments" element={<Treatments />} />
                {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                <Route path="*" element={<NotFound />} />
              </Routes>
            </MainLayout>
          } />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
