import { AdvancedAnalyticsDashboard } from "@/components/dashboard/AdvancedAnalyticsDashboard";
import { SmartNotificationSystem } from "@/components/dashboard/SmartNotificationSystem";
import { QuickActionCenter } from "@/components/dashboard/QuickActionCenter";
import { PerformanceOptimizer } from "@/components/performance/PerformanceOptimizer";
import { SystemHealthMonitor } from "@/components/system/SystemHealthMonitor";
import { PageContainer } from "@/components/layout/PageContainer";
import { PageHeader } from "@/components/layout/PageHeader";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BarChart3, Bell, Zap, Plus, Activity, Shield } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
const Index = () => {
  const { t } = useLanguage();
  
  return <PageContainer>
      <PageHeader title={t("dashboard.title")} description={t("dashboard.description")} />
      
      <Tabs defaultValue="analytics" className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="analytics" className="flex items-center gap-2">
            <BarChart3 className="w-4 h-4" />
            {t("dashboard.tabs.analytics")}
          </TabsTrigger>
          <TabsTrigger value="notifications" className="flex items-center gap-2">
            <Bell className="w-4 h-4" />
            {t("dashboard.tabs.notifications")}
          </TabsTrigger>
          <TabsTrigger value="actions" className="flex items-center gap-2">
            <Plus className="w-4 h-4" />
            {t("dashboard.tabs.actions")}
          </TabsTrigger>
          <TabsTrigger value="performance" className="flex items-center gap-2">
            <Zap className="w-4 h-4" />
            {t("dashboard.tabs.performance")}
          </TabsTrigger>
          
        </TabsList>

        <TabsContent value="analytics" className="space-y-6">
          <AdvancedAnalyticsDashboard />
        </TabsContent>

        <TabsContent value="notifications" className="space-y-6">
          <SmartNotificationSystem />
        </TabsContent>

        <TabsContent value="actions" className="space-y-6">
          <QuickActionCenter />
        </TabsContent>

        <TabsContent value="performance" className="space-y-6">
          <PerformanceOptimizer />
        </TabsContent>

        <TabsContent value="system" className="space-y-6">
          <SystemHealthMonitor />
        </TabsContent>
      </Tabs>
    </PageContainer>;
};
export default Index;