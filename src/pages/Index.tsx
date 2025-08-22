import { AnalyticalDashboard } from "@/components/dashboard/AnalyticalDashboard";
import { PageContainer } from "@/components/layout/PageContainer";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/button";
import { UserPlus, CalendarPlus } from "lucide-react";
import { useNavigate } from "react-router-dom";

const Index = () => {
  const navigate = useNavigate();

  const handleAddPatient = () => {
    navigate("/patients");
  };

  const handleAddAppointment = () => {
    navigate("/new-appointment");
  };

  return (
    <PageContainer>
      <PageHeader 
        title="لوحة التحكم التحليلية"
        description="مراقبة الأداء والإحصائيات التفاعلية"
        action={
          <div className="flex gap-2">
            <Button onClick={handleAddPatient} className="gap-2">
              <UserPlus className="h-4 w-4" />
              إضافة مريض
            </Button>
            <Button onClick={handleAddAppointment} variant="outline" className="gap-2">
              <CalendarPlus className="h-4 w-4" />
              إضافة موعد
            </Button>
          </div>
        }
      />
      <AnalyticalDashboard />
    </PageContainer>
  );
};

export default Index;
