import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { 
  Brain, 
  Activity, 
  AlertTriangle, 
  CheckCircle2, 
  Zap,
  TrendingUp,
  Eye,
  Download
} from "lucide-react";
import { aiAnalysisService, AIAnalysisResult, XRayAnalysisResult, DSDAnalysisResult } from "@/utils/aiAnalysis";
import { useToast } from "@/hooks/use-toast";

interface AIAnalysisPanelProps {
  imageElement: HTMLImageElement | null;
  imageType: 'xray' | 'photo' | 'ct' | 'mri';
  onAnalysisComplete?: (result: AIAnalysisResult) => void;
}

export function AIAnalysisPanel({ imageElement, imageType, onAnalysisComplete }: AIAnalysisPanelProps) {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<AIAnalysisResult | null>(null);
  const [analysisProgress, setAnalysisProgress] = useState(0);
  const { toast } = useToast();

  const handleAnalyze = async () => {
    if (!imageElement) {
      toast({
        title: "خطأ",
        description: "لا توجد صورة للتحليل",
        variant: "destructive",
      });
      return;
    }

    setIsAnalyzing(true);
    setAnalysisProgress(0);

    try {
      // Simulate progress updates
      const progressInterval = setInterval(() => {
        setAnalysisProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return prev;
          }
          return prev + 10;
        });
      }, 200);

      let result: AIAnalysisResult;
      
      if (imageType === 'xray') {
        result = await aiAnalysisService.analyzeXRayImage(imageElement);
      } else {
        result = await aiAnalysisService.analyzeDSDImage(imageElement);
      }

      clearInterval(progressInterval);
      setAnalysisProgress(100);
      
      setTimeout(() => {
        setAnalysisResult(result);
        setIsAnalyzing(false);
        onAnalysisComplete?.(result);
        
        toast({
          title: "تم التحليل بنجاح",
          description: "تم الانتهاء من تحليل الصورة بالذكاء الاصطناعي",
        });
      }, 500);

    } catch (error) {
      setIsAnalyzing(false);
      setAnalysisProgress(0);
      toast({
        title: "خطأ في التحليل",
        description: error instanceof Error ? error.message : "حدث خطأ أثناء التحليل",
        variant: "destructive",
      });
    }
  };

  const getRiskLevelColor = (riskLevel: string) => {
    switch (riskLevel) {
      case 'low': return 'bg-green-100 text-green-800 border-green-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'high': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'critical': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getRiskLevelIcon = (riskLevel: string) => {
    switch (riskLevel) {
      case 'low': return <CheckCircle2 className="w-4 h-4" />;
      case 'medium': return <Eye className="w-4 h-4" />;
      case 'high': return <AlertTriangle className="w-4 h-4" />;
      case 'critical': return <AlertTriangle className="w-4 h-4" />;
      default: return <Activity className="w-4 h-4" />;
    }
  };

  const getRiskLevelText = (riskLevel: string) => {
    switch (riskLevel) {
      case 'low': return 'خطورة منخفضة';
      case 'medium': return 'خطورة متوسطة';
      case 'high': return 'خطورة عالية';
      case 'critical': return 'حالة حرجة';
      default: return 'غير محدد';
    }
  };

  const exportAnalysis = () => {
    if (!analysisResult) return;
    
    const analysisData = {
      تاريخ_التحليل: new Date().toLocaleDateString('ar-SA'),
      نوع_الصورة: imageType === 'xray' ? 'أشعة سينية' : 'صورة فوتوغرافية',
      مستوى_الثقة: `${(analysisResult.confidence * 100).toFixed(1)}%`,
      مستوى_المخاطر: getRiskLevelText(analysisResult.riskLevel),
      الحالات_المكتشفة: analysisResult.detectedConditions,
      التوصيات: analysisResult.recommendations,
    };
    
    const dataStr = JSON.stringify(analysisData, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `ai-analysis-${Date.now()}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    
    toast({
      title: "تم تصدير التحليل",
      description: "تم حفظ نتائج التحليل على جهازك",
    });
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Brain className="w-5 h-5 text-primary" />
          تحليل الذكاء الاصطناعي
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {!analysisResult && !isAnalyzing && (
          <div className="text-center py-6">
            <Zap className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">تحليل ذكي للصورة الطبية</h3>
            <p className="text-muted-foreground mb-4">
              احصل على تحليل مفصل بالذكاء الاصطناعي لاكتشاف الحالات المرضية والتوصيات العلاجية
            </p>
            <Button onClick={handleAnalyze} className="w-full" disabled={!imageElement}>
              <Brain className="w-4 h-4 ml-2" />
              بدء التحليل الذكي
            </Button>
          </div>
        )}

        {isAnalyzing && (
          <div className="space-y-4">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
              <h3 className="text-lg font-medium mb-2">جاري التحليل...</h3>
              <p className="text-sm text-muted-foreground mb-4">
                يتم الآن تحليل الصورة باستخدام الذكاء الاصطناعي
              </p>
            </div>
            
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>التقدم</span>
                <span>{analysisProgress}%</span>
              </div>
              <Progress value={analysisProgress} className="w-full" />
            </div>
          </div>
        )}

        {analysisResult && (
          <div className="space-y-4">
            {/* Confidence Score */}
            <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-primary" />
                <span className="font-medium">مستوى الثقة</span>
              </div>
              <Badge variant="secondary" className="text-lg px-3 py-1">
                {(analysisResult.confidence * 100).toFixed(1)}%
              </Badge>
            </div>

            {/* Risk Level */}
            <Alert className={getRiskLevelColor(analysisResult.riskLevel)}>
              <div className="flex items-center gap-2">
                {getRiskLevelIcon(analysisResult.riskLevel)}
                <span className="font-medium">{getRiskLevelText(analysisResult.riskLevel)}</span>
              </div>
            </Alert>

            <Separator />

            {/* Detected Conditions */}
            <div className="space-y-3">
              <h4 className="font-medium flex items-center gap-2">
                <Activity className="w-4 h-4" />
                الحالات المكتشفة
              </h4>
              <div className="space-y-2">
                {analysisResult.detectedConditions.map((condition, index) => (
                  <div key={index} className="flex items-center gap-2 p-2 bg-muted/30 rounded">
                    <div className="w-2 h-2 rounded-full bg-primary"></div>
                    <span className="text-sm">{condition}</span>
                  </div>
                ))}
              </div>
            </div>

            <Separator />

            {/* Recommendations */}
            <div className="space-y-3">
              <h4 className="font-medium flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4" />
                التوصيات العلاجية
              </h4>
              <div className="space-y-2">
                {analysisResult.recommendations.map((recommendation, index) => (
                  <div key={index} className="flex items-start gap-2 p-2 bg-green-50 dark:bg-green-950/30 rounded">
                    <CheckCircle2 className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                    <span className="text-sm">{recommendation}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* X-ray Specific Results */}
            {imageType === 'xray' && (analysisResult as XRayAnalysisResult).toothConditions && (
              <>
                <Separator />
                <div className="space-y-3">
                  <h4 className="font-medium">تحليل الأسنان</h4>
                  <div className="grid grid-cols-2 gap-2">
                    {(analysisResult as XRayAnalysisResult).toothConditions.map((tooth, index) => (
                      <div key={index} className="p-2 border rounded text-sm">
                        <div className="font-medium">السن {tooth.toothNumber}</div>
                        <div className="text-xs text-muted-foreground">
                          {tooth.conditions.join(', ')}
                        </div>
                      </div>
                    ))}
                  </div>
                  <Alert>
                    <AlertDescription>
                      <strong>التقييم العام: </strong>
                      {(analysisResult as XRayAnalysisResult).overallOralHealth}
                    </AlertDescription>
                  </Alert>
                </div>
              </>
            )}

            {/* DSD Specific Results */}
            {imageType === 'photo' && (analysisResult as DSDAnalysisResult).facialSymmetry && (
              <>
                <Separator />
                <div className="space-y-3">
                  <h4 className="font-medium">تحليل الابتسامة الرقمية</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center p-2 bg-muted/50 rounded">
                      <span className="text-sm">تماثل الوجه</span>
                      <Badge variant="outline">
                        {((analysisResult as DSDAnalysisResult).facialSymmetry * 100).toFixed(0)}%
                      </Badge>
                    </div>
                    <div className="space-y-1">
                      <span className="text-sm font-medium">جماليات الابتسامة:</span>
                      {(analysisResult as DSDAnalysisResult).smileAesthetics.map((aesthetic, index) => (
                        <div key={index} className="text-xs text-muted-foreground ml-4">
                          • {aesthetic}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </>
            )}

            {/* Export Button */}
            <Button 
              variant="outline" 
              onClick={exportAnalysis}
              className="w-full"
            >
              <Download className="w-4 h-4 ml-2" />
              تصدير نتائج التحليل
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}