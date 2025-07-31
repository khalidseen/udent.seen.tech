import AppointmentRequestsList from "@/components/appointments/AppointmentRequestsList";
import { PageContainer } from "@/components/layout/PageContainer";
import { PageHeader } from "@/components/layout/PageHeader";

const AppointmentRequests = () => {
  return (
    <PageContainer>
      <PageHeader 
        title="طلبات المواعيد" 
        description="إدارة طلبات المواعيد الواردة من العملاء"
      />
      <AppointmentRequestsList />
    </PageContainer>
  );
};

export default AppointmentRequests;