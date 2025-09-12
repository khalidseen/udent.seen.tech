import { PageContainer } from "@/components/layout/PageContainer";
import { PageHeader } from "@/components/layout/PageHeader";
import { AIInsightsDashboard } from "@/components/ai-analysis/AIInsightsDashboard";
import { VirtualDoctorAssistant } from "@/components/ai-analysis/VirtualDoctorAssistant";
import { PredictiveAnalyticsDashboard } from "@/components/ai-analysis/PredictiveAnalyticsDashboard";
import { SmartPatientRecommendations } from "@/components/ai-analysis/SmartPatientRecommendations";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Brain, TrendingUp, Users, Bot } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

export default function AIInsights() {
  const { t } = useLanguage();
  
  return (
    <PageContainer>
      <PageHeader
        title={t("aiFeatures.title")}
        description={t("aiFeatures.description")}
      />

      <div className="space-y-6">
        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview" className="flex items-center gap-2">
              <Brain className="h-4 w-4" />
              {t("aiFeatures.overview")}
            </TabsTrigger>
            <TabsTrigger value="assistant" className="flex items-center gap-2">
              <Bot className="h-4 w-4" />
              {t("aiFeatures.assistant")}
            </TabsTrigger>
            <TabsTrigger value="predictions" className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              {t("aiFeatures.predictions")}
            </TabsTrigger>
            <TabsTrigger value="recommendations" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              {t("aiFeatures.recommendations")}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6 mt-6">
            <AIInsightsDashboard />
          </TabsContent>

          <TabsContent value="assistant" className="space-y-6 mt-6">
            <VirtualDoctorAssistant />
          </TabsContent>

          <TabsContent value="predictions" className="space-y-6 mt-6">
            <PredictiveAnalyticsDashboard />
          </TabsContent>

          <TabsContent value="recommendations" className="space-y-6 mt-6">
            <SmartPatientRecommendations />
          </TabsContent>
        </Tabs>
      </div>
    </PageContainer>
  );
}