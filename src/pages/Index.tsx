import { AnalyticalDashboard } from "@/components/dashboard/AnalyticalDashboard";
import { PageContainer } from "@/components/layout/PageContainer";
import { PageHeader } from "@/components/layout/PageHeader";

const Index = () => {
  return (
    <PageContainer>
      <PageHeader 
        title="لوحة التحكم التحليلية"
        description="مراقبة الأداء والإحصائيات التفاعلية"
      />
      <AnalyticalDashboard />
    </PageContainer>
  );
};

export default Index;
