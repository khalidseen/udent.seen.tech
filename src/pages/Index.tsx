import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import LoginPage from "@/components/auth/LoginPage";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import Overview from "@/components/dashboard/Overview";
import PatientList from "@/components/patients/PatientList";
import AddPatientForm from "@/components/patients/AddPatientForm";
import AppointmentList from "@/components/appointments/AppointmentList";
import DentalTreatmentForm from "@/components/dental/DentalTreatmentForm";

const Index = () => {
  const { user, loading } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');
  const [selectedPatient, setSelectedPatient] = useState<{id: string, name: string} | null>(null);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user) {
    return <LoginPage />;
  }

  const handleViewDentalTreatments = (patientId: string, patientName: string) => {
    setSelectedPatient({ id: patientId, name: patientName });
    setActiveTab('dental-treatments');
  };

  const handleBackToPatients = () => {
    setSelectedPatient(null);
    setActiveTab('patients');
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'overview':
        return <Overview />;
      case 'patients':
        return <PatientList onViewDentalTreatments={handleViewDentalTreatments} />;
      case 'appointments':
        return <AppointmentList />;
      case 'add-patient':
        return <AddPatientForm />;
      case 'dental-treatments':
        return selectedPatient ? (
          <div>
            <div className="mb-4">
              <button 
                onClick={handleBackToPatients}
                className="text-primary hover:underline text-sm"
              >
                ← العودة لقائمة المرضى
              </button>
            </div>
            <DentalTreatmentForm 
              patientId={selectedPatient.id} 
              patientName={selectedPatient.name} 
            />
          </div>
        ) : <PatientList onViewDentalTreatments={handleViewDentalTreatments} />;
      default:
        return <Overview />;
    }
  };

  return (
    <DashboardLayout activeTab={activeTab} onTabChange={setActiveTab}>
      {renderContent()}
    </DashboardLayout>
  );
};

export default Index;
