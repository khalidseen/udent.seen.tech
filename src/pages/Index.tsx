import { AnalyticalDashboard } from "@/components/dashboard/AnalyticalDashboard";
import { PageContainer } from "@/components/layout/PageContainer";
import { PageHeader } from "@/components/layout/PageHeader";
import AddPatientDrawer from "@/components/patients/AddPatientDrawer";
import AddAppointmentDrawer from "@/components/appointments/AddAppointmentDrawer";

const Index = () => {
  return (
    <PageContainer>
      <PageHeader 
        title="لوحة التحكم التحليلية"
        description="مراقبة الأداء والإحصائيات التفاعلية"
        action={
          <div className="flex gap-2">
            <AddPatientDrawer />
            <AddAppointmentDrawer />
          </div>
        }
      />
      <AnalyticalDashboard />
    </PageContainer>
  );
};

export default Index;
