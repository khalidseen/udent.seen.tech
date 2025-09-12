import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  TrendingUp, 
  TrendingDown,
  AlertTriangle,
  Calendar,
  Users,
  Phone,
  CheckCircle2,
  Clock,
  BarChart3,
  PieChart,
  Zap,
  Brain
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { 
  predictiveAnalyticsService, 
  AppointmentPrediction, 
  PatientReturnPrediction, 
  PatientRecommendation 
} from "@/utils/predictiveAnalytics";
import { format } from "date-fns";

export function PredictiveAnalyticsDashboard() {
  const [cancellationPredictions, setCancellationPredictions] = useState<AppointmentPrediction[]>([]);
  const [returnPredictions, setReturnPredictions] = useState<PatientReturnPrediction[]>([]);
  const [patientRecommendations, setPatientRecommendations] = useState<PatientRecommendation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedTab, setSelectedTab] = useState("cancellations");
  const { toast } = useToast();

  // تحميل البيانات التحليلية
  const loadAnalytics = async () => {
    setIsLoading(true);
    try {
      const { data: profile } = await supabase
        .from('profiles')
        .select('id')
        .eq('user_id', (await supabase.auth.getUser()).data.user?.id)
        .single();

      if (!profile) return;

      // تحميل جميع التحليلات بشكل متوازي
      const [cancellations, returns, recommendations] = await Promise.all([
        predictiveAnalyticsService.predictAppointmentCancellations(profile.id),
        predictiveAnalyticsService.predictPatientReturns(profile.id),
        predictiveAnalyticsService.generatePatientRecommendations(profile.id)
      ]);

      setCancellationPredictions(cancellations);
      setReturnPredictions(returns);
      setPatientRecommendations(recommendations);

      toast({
        title: "تم تحديث التحليلات",
        description: "تم تحديث التوقعات والتوصيات بنجاح",
      });
    } catch (error) {
      console.error('Error loading analytics:', error);
      toast({
        title: "خطأ في التحميل",
        description: "حدث خطأ أثناء تحميل البيانات التحليلية",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadAnalytics();
  }, []);

  // إحصائيات سريعة
  const getQuickStats = () => {
    const highRiskCancellations = cancellationPredictions.filter(p => p.riskLevel === 'high').length;
    const lowReturnPatients = returnPredictions.filter(p => p.returnProbability < 0.3).length;
    const urgentRecommendations = patientRecommendations.filter(r => r.priority === 'urgent').length;
    const totalActiveRecommendations = patientRecommendations.length;

    return {
      highRiskCancellations,
      lowReturnPatients,
      urgentRecommendations,
      totalActiveRecommendations
    };
  };

  const stats = getQuickStats();

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'high': return 'bg-red-100 text-red-800 border-red-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'bg-red-100 text-red-800';
      case 'high': return 'bg-orange-100 text-orange-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'cleaning': return <Calendar className="w-4 h-4 text-blue-600" />;
      case 'checkup': return <CheckCircle2 className="w-4 h-4 text-green-600" />;
      case 'treatment_followup': return <Clock className="w-4 h-4 text-orange-600" />;
      case 'prevention': return <AlertTriangle className="w-4 h-4 text-purple-600" />;
      default: return <Calendar className="w-4 h-4 text-gray-600" />;
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center space-y-4">
              <div className="animate-pulse">
                <Brain className="w-12 h-12 text-primary mx-auto mb-4" />
              </div>
              <h3 className="text-lg font-medium">جاري تحليل البيانات...</h3>
              <p className="text-sm text-muted-foreground">
                يقوم الذكاء الاصطناعي بتحليل أنماط المرضى وإنتاج التوقعات
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* إحصائيات سريعة */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">مواعيد معرضة للإلغاء</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{stats.highRiskCancellations}</div>
            <p className="text-xs text-muted-foreground">
              من {cancellationPredictions.length} موعد قادم
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">مرضى قد لا يعودون</CardTitle>
            <TrendingDown className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{stats.lowReturnPatients}</div>
            <p className="text-xs text-muted-foreground">
              احتمالية عودة أقل من 30%
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">توصيات عاجلة</CardTitle>
            <Zap className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{stats.urgentRecommendations}</div>
            <p className="text-xs text-muted-foreground">
              تحتاج تدخل فوري
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">توصيات نشطة</CardTitle>
            <BarChart3 className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{stats.totalActiveRecommendations}</div>
            <p className="text-xs text-muted-foreground">
              إجمالي التوصيات الحالية
            </p>
          </CardContent>
        </Card>
      </div>

      {/* التحليلات التفصيلية */}
      <Tabs value={selectedTab} onValueChange={setSelectedTab} className="space-y-4">
        <div className="flex items-center justify-between">
          <TabsList className="grid w-full max-w-md grid-cols-3">
            <TabsTrigger value="cancellations">إلغاء المواعيد</TabsTrigger>
            <TabsTrigger value="returns">عودة المرضى</TabsTrigger>
            <TabsTrigger value="recommendations">التوصيات</TabsTrigger>
          </TabsList>
          <Button onClick={loadAnalytics} variant="outline" size="sm">
            <TrendingUp className="w-4 h-4 ml-2" />
            تحديث التحليلات
          </Button>
        </div>

        <TabsContent value="cancellations" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-red-600" />
                توقع إلغاء المواعيد
              </CardTitle>
            </CardHeader>
            <CardContent>
              {cancellationPredictions.length > 0 ? (
                <div className="space-y-4">
                  {cancellationPredictions.slice(0, 10).map((prediction) => (
                    <div key={prediction.appointmentId} className="border rounded-lg p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-medium">{prediction.patientName}</h4>
                          <p className="text-sm text-muted-foreground">
                            {format(new Date(prediction.appointmentDate), 'yyyy/MM/dd - HH:mm')}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge className={getRiskColor(prediction.riskLevel)}>
                            {prediction.riskLevel === 'high' ? 'عالي' : 
                             prediction.riskLevel === 'medium' ? 'متوسط' : 'منخفض'}
                          </Badge>
                          <Badge variant="outline">
                            {(prediction.cancellationRisk * 100).toFixed(0)}%
                          </Badge>
                        </div>
                      </div>

                      <div>
                        <Progress value={prediction.cancellationRisk * 100} className="h-2" />
                        <p className="text-xs text-muted-foreground mt-1">
                          احتمالية الإلغاء: {(prediction.cancellationRisk * 100).toFixed(1)}%
                        </p>
                      </div>

                      {prediction.riskFactors.length > 0 && (
                        <div>
                          <h5 className="text-sm font-medium mb-2">عوامل الخطر:</h5>
                          <div className="flex gap-1 flex-wrap">
                            {prediction.riskFactors.map((factor, index) => (
                              <Badge key={index} variant="outline" className="text-xs">
                                {factor}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}

                      <div>
                        <h5 className="text-sm font-medium mb-2">التوصيات:</h5>
                        <div className="space-y-1">
                          {prediction.recommendations.map((rec, index) => (
                            <div key={index} className="flex items-center gap-2 text-sm">
                              <CheckCircle2 className="w-3 h-3 text-green-600" />
                              <span>{rec}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <CheckCircle2 className="w-12 h-12 text-green-600 mx-auto mb-4" />
                  <h3 className="text-lg font-medium mb-2">لا توجد مواعيد معرضة للإلغاء</h3>
                  <p className="text-muted-foreground">جميع المواعيد القادمة لديها احتمالية منخفضة للإلغاء</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="returns" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingDown className="w-5 h-5 text-orange-600" />
                توقع عودة المرضى
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {returnPredictions.slice(0, 10).map((prediction) => (
                  <div key={prediction.patientId} className="border rounded-lg p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium">{prediction.patientName}</h4>
                        <p className="text-sm text-muted-foreground">
                          آخر زيارة: {format(new Date(prediction.lastVisit), 'yyyy/MM/dd')}
                        </p>
                      </div>
                      <div className="text-right">
                        <div className="text-lg font-bold">
                          {(prediction.returnProbability * 100).toFixed(0)}%
                        </div>
                        <p className="text-xs text-muted-foreground">احتمالية العودة</p>
                      </div>
                    </div>

                    <div>
                      <Progress value={prediction.returnProbability * 100} className="h-2" />
                      <p className="text-xs text-muted-foreground mt-1">
                        متوقع العودة: {format(new Date(prediction.predictedReturnDate), 'yyyy/MM/dd')}
                      </p>
                    </div>

                    {prediction.riskFactors.length > 0 && (
                      <div>
                        <h5 className="text-sm font-medium mb-2">عوامل الخطر:</h5>
                        <div className="flex gap-1 flex-wrap">
                          {prediction.riskFactors.map((factor, index) => (
                            <Badge key={index} variant="destructive" className="text-xs">
                              {factor}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}

                    <div>
                      <h5 className="text-sm font-medium mb-2">الإجراءات المقترحة:</h5>
                      <div className="space-y-1">
                        {prediction.recommendations.map((rec, index) => (
                          <div key={index} className="flex items-center gap-2 text-sm">
                            <Phone className="w-3 h-3 text-blue-600" />
                            <span>{rec}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="recommendations" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5 text-blue-600" />
                توصيات مخصصة للمرضى
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {patientRecommendations.slice(0, 15).map((recommendation) => (
                  <div key={`${recommendation.patientId}-${recommendation.type}`} 
                       className="border rounded-lg p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        {getTypeIcon(recommendation.type)}
                        <div>
                          <h4 className="font-medium">{recommendation.patientName}</h4>
                          <p className="text-sm font-medium text-primary">{recommendation.title}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge className={getPriorityColor(recommendation.priority)}>
                          {recommendation.priority === 'urgent' ? 'عاجل' :
                           recommendation.priority === 'high' ? 'عالي' :
                           recommendation.priority === 'medium' ? 'متوسط' : 'منخفض'}
                        </Badge>
                        <Badge variant="outline">
                          {format(new Date(recommendation.dueDate), 'MM/dd')}
                        </Badge>
                      </div>
                    </div>

                    <p className="text-sm text-muted-foreground">
                      {recommendation.description}
                    </p>

                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span>التكرار: {recommendation.frequency}</span>
                      <span>مستحق في: {format(new Date(recommendation.dueDate), 'yyyy/MM/dd')}</span>
                    </div>

                    <Alert className="border-blue-200 bg-blue-50 dark:bg-blue-950/30">
                      <CheckCircle2 className="w-4 h-4 text-blue-600" />
                      <AlertDescription className="text-sm">
                        <strong>رسالة مقترحة:</strong><br />
                        {recommendation.customMessage}
                      </AlertDescription>
                    </Alert>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}