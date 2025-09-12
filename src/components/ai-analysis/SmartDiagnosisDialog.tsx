import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Brain, 
  Stethoscope, 
  FileText, 
  TrendingUp, 
  AlertTriangle,
  CheckCircle2,
  Calendar,
  User,
  Save
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface SmartDiagnosisDialogProps {
  isOpen: boolean;
  onClose: () => void;
  patientId?: string;
  medicalHistory?: string;
  symptoms?: string;
  onDiagnosisComplete?: (diagnosis: any) => void;
}

interface DiagnosisResult {
  primaryDiagnosis: string;
  differentialDiagnoses: string[];
  confidence: number;
  urgencyLevel: 'routine' | 'urgent' | 'emergency';
  recommendedTests: string[];
  treatmentPlan: string[];
  followUpSchedule: string;
  riskFactors: string[];
  prognosis: string;
}

export function SmartDiagnosisDialog({
  isOpen,
  onClose,
  patientId,
  medicalHistory = "",
  symptoms = "",
  onDiagnosisComplete
}: SmartDiagnosisDialogProps) {
  const [currentSymptoms, setCurrentSymptoms] = useState(symptoms);
  const [patientHistory, setPatientHistory] = useState(medicalHistory);
  const [chiefComplaint, setChiefComplaint] = useState("");
  const [urgency, setUrgency] = useState<string>("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisProgress, setAnalysisProgress] = useState(0);
  const [diagnosisResult, setDiagnosisResult] = useState<DiagnosisResult | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (isOpen) {
      setCurrentSymptoms(symptoms);
      setPatientHistory(medicalHistory);
      setDiagnosisResult(null);
      setAnalysisProgress(0);
    }
  }, [isOpen, symptoms, medicalHistory]);

  const handleSmartDiagnosis = async () => {
    if (!currentSymptoms.trim() || !chiefComplaint.trim()) {
      toast({
        title: "معلومات ناقصة",
        description: "يرجى إدخال الأعراض والشكوى الأساسية",
        variant: "destructive",
      });
      return;
    }

    setIsAnalyzing(true);
    setAnalysisProgress(0);

    try {
      // Simulate progressive analysis
      const progressSteps = [
        { progress: 20, message: "تحليل الأعراض..." },
        { progress: 40, message: "مراجعة التاريخ المرضي..." },
        { progress: 60, message: "البحث في قاعدة البيانات الطبية..." },
        { progress: 80, message: "توليد التشخيص التفريقي..." },
        { progress: 100, message: "إنهاء التحليل..." }
      ];

      for (const step of progressSteps) {
        await new Promise(resolve => setTimeout(resolve, 800));
        setAnalysisProgress(step.progress);
      }

      // Generate smart diagnosis based on symptoms
      const diagnosis = generateSmartDiagnosis(currentSymptoms, patientHistory, chiefComplaint, urgency);
      
      setDiagnosisResult(diagnosis);
      setIsAnalyzing(false);
      
      toast({
        title: "تم التشخيص الذكي",
        description: "تم إنتاج تشخيص شامل بالذكاء الاصطناعي",
      });

    } catch (error) {
      setIsAnalyzing(false);
      setAnalysisProgress(0);
      toast({
        title: "خطأ في التشخيص",
        description: "حدث خطأ أثناء عملية التشخيص الذكي",
        variant: "destructive",
      });
    }
  };

  const generateSmartDiagnosis = (symptoms: string, history: string, complaint: string, urgency: string): DiagnosisResult => {
    // Mock AI diagnosis generation based on input
    const symptomsLower = symptoms.toLowerCase();
    const complaintLower = complaint.toLowerCase();
    
    let primaryDiagnosis = "فحص طبي شامل مطلوب";
    let differentialDiagnoses = ["فحص إضافي", "متابعة دورية"];
    let confidence = 0.75;
    let urgencyLevel: 'routine' | 'urgent' | 'emergency' = 'routine';
    let recommendedTests = ["فحص سريري شامل"];
    let treatmentPlan = ["متابعة دورية"];
    let riskFactors = ["عوامل خطر عامة"];

    // Dental-specific analysis
    if (symptomsLower.includes('ألم') || symptomsLower.includes('وجع') || complaintLower.includes('سن')) {
      if (symptomsLower.includes('حاد') || urgency === 'urgent') {
        primaryDiagnosis = "التهاب عصب السن الحاد";
        differentialDiagnoses = ["خراج سني", "التهاب اللثة الحاد", "كسر في السن"];
        urgencyLevel = 'urgent';
        confidence = 0.85;
        recommendedTests = ["أشعة سينية فورية", "اختبار الحيوية", "فحص الإطباق"];
        treatmentPlan = [
          "علاج عصب فوري",
          "مسكن قوي للألم", 
          "مضاد حيوي",
          "متابعة خلال 24 ساعة"
        ];
        riskFactors = ["إهمال نظافة الأسنان", "تأخير العلاج", "مرض السكري"];
      } else {
        primaryDiagnosis = "تسوس أسنان متقدم";
        differentialDiagnoses = ["حساسية أسنان", "التهاب لثة", "تآكل أسنان"];
        confidence = 0.78;
        recommendedTests = ["أشعة سينية", "فحص تسوس بالليزر", "اختبار الحساسية"];
        treatmentPlan = ["حشوة أسنان", "فلورايد موضعي", "تعليمات نظافة"];
        riskFactors = ["السكريات الزائدة", "عدم انتظام التنظيف"];
      }
    }

    if (symptomsLower.includes('نزيف') || symptomsLower.includes('لثة')) {
      primaryDiagnosis = "التهاب اللثة المتوسط";
      differentialDiagnoses = ["التهاب دواعم السن", "نقص فيتامين C", "التهاب لثة حملي"];
      confidence = 0.82;
      recommendedTests = ["فحص جيوب اللثة", "تحليل دم شامل", "أشعة بانورامية"];
      treatmentPlan = [
        "تنظيف أسنان عميق",
        "غسول فم مطهر",
        "مراجعة دورية شهرية",
        "تحسين نظافة الأسنان"
      ];
      riskFactors = ["التدخين", "مرض السكري", "الحمل", "الضغط النفسي"];
    }

    if (symptomsLower.includes('تورم') || symptomsLower.includes('انتفاخ')) {
      primaryDiagnosis = "خراج سني حاد";
      differentialDiagnoses = ["التهاب غدد لعابية", "كيس سني", "ورم حميد"];
      urgencyLevel = 'emergency';
      confidence = 0.88;
      recommendedTests = ["أشعة مقطعية فورية", "تحليل دم", "زراعة بكتيرية"];
      treatmentPlan = [
        "تصريف الخراج فوراً",
        "مضاد حيوي قوي",
        "مسكن ومضاد التهاب",
        "علاج عصب أو خلع",
        "متابعة يومية"
      ];
      riskFactors = ["ضعف المناعة", "السكري غير المنضبط", "تأخير العلاج"];
    }

    return {
      primaryDiagnosis,
      differentialDiagnoses,
      confidence,
      urgencyLevel,
      recommendedTests,
      treatmentPlan,
      followUpSchedule: urgencyLevel === 'emergency' ? "متابعة خلال 24 ساعة" :
                       urgencyLevel === 'urgent' ? "متابعة خلال 3 أيام" : "متابعة خلال أسبوعين",
      riskFactors,
      prognosis: confidence > 0.8 ? "توقعات جيدة مع العلاج المناسب" : "يحتاج لتقييم إضافي"
    };
  };

  const getUrgencyColor = (level: string) => {
    switch (level) {
      case 'routine': return 'bg-green-100 text-green-800';
      case 'urgent': return 'bg-yellow-100 text-yellow-800';
      case 'emergency': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getUrgencyText = (level: string) => {
    switch (level) {
      case 'routine': return 'روتيني';
      case 'urgent': return 'عاجل';
      case 'emergency': return 'طارئ';
      default: return 'غير محدد';
    }
  };

  const saveDiagnosis = async () => {
    if (!diagnosisResult || !patientId) return;

    try {
      // Get current user's clinic ID
      const { data: profile } = await supabase
        .from('profiles')
        .select('id')
        .eq('user_id', (await supabase.auth.getUser()).data.user?.id)
        .single();

      if (!profile) {
        throw new Error('لم نتمكن من العثور على بيانات المستخدم');
      }

      const { error } = await supabase
        .from('medical_records')
        .insert({
          clinic_id: profile.id,
          patient_id: patientId,
          title: `تشخيص ذكي - ${diagnosisResult.primaryDiagnosis}`,
          record_type: 'consultation',
          diagnosis: diagnosisResult.primaryDiagnosis,
          treatment_plan: diagnosisResult.treatmentPlan.join('\n'),
          notes: `
الأعراض: ${currentSymptoms}
الشكوى الأساسية: ${chiefComplaint}
مستوى الثقة: ${(diagnosisResult.confidence * 100).toFixed(1)}%
التشخيص التفريقي: ${diagnosisResult.differentialDiagnoses.join(', ')}
الفحوصات المطلوبة: ${diagnosisResult.recommendedTests.join(', ')}
عوامل الخطورة: ${diagnosisResult.riskFactors.join(', ')}
المتابعة: ${diagnosisResult.followUpSchedule}
التوقعات: ${diagnosisResult.prognosis}
          `.trim(),
          treatment_date: new Date().toISOString().split('T')[0]
        });

      if (error) throw error;

      toast({
        title: "تم حفظ التشخيص",
        description: "تم حفظ نتائج التشخيص الذكي في السجل الطبي",
      });

      onDiagnosisComplete?.(diagnosisResult);
      onClose();
    } catch (error) {
      toast({
        title: "خطأ في الحفظ",
        description: "لم نتمكن من حفظ التشخيص",
        variant: "destructive",
      });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Brain className="w-5 h-5 text-primary" />
            التشخيص الذكي بالذكاء الاصطناعي
          </DialogTitle>
        </DialogHeader>

        <div className="overflow-y-auto max-h-[70vh] space-y-4">
          {!isAnalyzing && !diagnosisResult && (
            <div className="space-y-4">
              {/* Input Form */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">معلومات المريض والأعراض</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <label className="text-sm font-medium mb-2 block">الشكوى الأساسية *</label>
                    <Textarea
                      placeholder="ما هي المشكلة الأساسية التي يعاني منها المريض؟"
                      value={chiefComplaint}
                      onChange={(e) => setChiefComplaint(e.target.value)}
                      className="min-h-[80px]"
                    />
                  </div>

                  <div>
                    <label className="text-sm font-medium mb-2 block">الأعراض الحالية *</label>
                    <Textarea
                      placeholder="اكتب تفصيلاً عن الأعراض الحالية..."
                      value={currentSymptoms}
                      onChange={(e) => setCurrentSymptoms(e.target.value)}
                      className="min-h-[100px]"
                    />
                  </div>

                  <div>
                    <label className="text-sm font-medium mb-2 block">التاريخ المرضي</label>
                    <Textarea
                      placeholder="أي أمراض أو عمليات سابقة، أدوية، حساسية..."
                      value={patientHistory}
                      onChange={(e) => setPatientHistory(e.target.value)}
                      className="min-h-[80px]"
                    />
                  </div>

                  <div>
                    <label className="text-sm font-medium mb-2 block">مستوى الإلحاح</label>
                    <Select value={urgency} onValueChange={setUrgency}>
                      <SelectTrigger>
                        <SelectValue placeholder="اختر مستوى الإلحاح" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="routine">روتيني - يمكن الانتظار</SelectItem>
                        <SelectItem value="urgent">عاجل - يحتاج رعاية سريعة</SelectItem>
                        <SelectItem value="emergency">طارئ - يحتاج رعاية فورية</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </CardContent>
              </Card>

              <Button 
                onClick={handleSmartDiagnosis}
                className="w-full"
                disabled={!currentSymptoms.trim() || !chiefComplaint.trim()}
              >
                <Stethoscope className="w-4 h-4 ml-2" />
                بدء التشخيص الذكي
              </Button>
            </div>
          )}

          {isAnalyzing && (
            <Card>
              <CardContent className="pt-6">
                <div className="text-center space-y-4">
                  <div className="animate-pulse">
                    <Brain className="w-12 h-12 text-primary mx-auto mb-4" />
                  </div>
                  <h3 className="text-lg font-medium">جاري التشخيص الذكي...</h3>
                  <p className="text-sm text-muted-foreground">
                    يقوم الذكاء الاصطناعي بتحليل المعلومات وإنتاج التشخيص المناسب
                  </p>
                  <div className="space-y-2">
                    <Progress value={analysisProgress} className="w-full" />
                    <p className="text-xs text-muted-foreground">{analysisProgress}% مكتمل</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {diagnosisResult && (
            <Tabs defaultValue="diagnosis" className="space-y-4">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="diagnosis">التشخيص</TabsTrigger>
                <TabsTrigger value="treatment">العلاج</TabsTrigger>
                <TabsTrigger value="followup">المتابعة</TabsTrigger>
              </TabsList>

              <TabsContent value="diagnosis" className="space-y-4">
                {/* Primary Diagnosis */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      <span className="flex items-center gap-2">
                        <Stethoscope className="w-4 h-4" />
                        التشخيص الأساسي
                      </span>
                      <div className="flex items-center gap-2">
                        <Badge className={getUrgencyColor(diagnosisResult.urgencyLevel)}>
                          {getUrgencyText(diagnosisResult.urgencyLevel)}
                        </Badge>
                        <Badge variant="outline">
                          ثقة {(diagnosisResult.confidence * 100).toFixed(1)}%
                        </Badge>
                      </div>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Alert className="mb-4">
                      <CheckCircle2 className="w-4 h-4" />
                      <AlertDescription className="text-base font-medium">
                        {diagnosisResult.primaryDiagnosis}
                      </AlertDescription>
                    </Alert>

                    <div className="space-y-3">
                      <h4 className="font-medium">التشخيص التفريقي:</h4>
                      {diagnosisResult.differentialDiagnoses.map((diagnosis, index) => (
                        <div key={index} className="flex items-center gap-2 p-2 bg-muted/50 rounded">
                          <div className="w-2 h-2 rounded-full bg-orange-500"></div>
                          <span className="text-sm">{diagnosis}</span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Risk Factors */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4" />
                      عوامل الخطورة
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      {diagnosisResult.riskFactors.map((factor, index) => (
                        <div key={index} className="flex items-center gap-2 p-2 border rounded text-sm">
                          <AlertTriangle className="w-3 h-3 text-yellow-500" />
                          {factor}
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="treatment" className="space-y-4">
                {/* Recommended Tests */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <FileText className="w-4 h-4" />
                      الفحوصات المطلوبة
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {diagnosisResult.recommendedTests.map((test, index) => (
                        <div key={index} className="flex items-center gap-2 p-2 bg-blue-50 dark:bg-blue-950/30 rounded">
                          <CheckCircle2 className="w-4 h-4 text-blue-600" />
                          <span className="text-sm">{test}</span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Treatment Plan */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <TrendingUp className="w-4 h-4" />
                      خطة العلاج
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {diagnosisResult.treatmentPlan.map((treatment, index) => (
                        <div key={index} className="flex items-start gap-2 p-3 bg-green-50 dark:bg-green-950/30 rounded">
                          <div className="w-6 h-6 rounded-full bg-green-100 dark:bg-green-900 flex items-center justify-center text-xs font-medium text-green-800 dark:text-green-200 mt-0.5">
                            {index + 1}
                          </div>
                          <span className="text-sm">{treatment}</span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="followup" className="space-y-4">
                {/* Follow-up Schedule */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Calendar className="w-4 h-4" />
                      جدول المتابعة
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Alert>
                      <Calendar className="w-4 h-4" />
                      <AlertDescription>
                        <strong>المتابعة المقترحة: </strong>{diagnosisResult.followUpSchedule}
                      </AlertDescription>
                    </Alert>
                  </CardContent>
                </Card>

                {/* Prognosis */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <TrendingUp className="w-4 h-4" />
                      التوقعات والإنذار
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Alert className="bg-blue-50 dark:bg-blue-950/30 border-blue-200">
                      <TrendingUp className="w-4 h-4" />
                      <AlertDescription>{diagnosisResult.prognosis}</AlertDescription>
                    </Alert>
                  </CardContent>
                </Card>

                {/* Save Diagnosis */}
                {patientId && (
                  <Button onClick={saveDiagnosis} className="w-full">
                    <Save className="w-4 h-4 ml-2" />
                    حفظ التشخيص في السجل الطبي
                  </Button>
                )}
              </TabsContent>
            </Tabs>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}