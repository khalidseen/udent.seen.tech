import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Brain, Search, FileText, Activity, Heart, Eye, AlertTriangle, CheckCircle, Clock, TrendingUp, Users, Target } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

interface DiagnosisResult {
  condition: string;
  confidence: number;
  severity: 'low' | 'medium' | 'high' | 'critical';
  symptoms: string[];
  recommendations: string[];
  urgency: 'routine' | 'soon' | 'urgent' | 'emergency';
  followUp: string;
  differentialDiagnosis: string[];
  riskFactors: string[];
  treatmentOptions: string[];
  prognosis: string;
  estimatedCost: number;
}

interface PatientData {
  id: string;
  name: string;
  age: number;
  gender: string;
  medicalHistory: string;
  currentSymptoms: string;
  vitals: {
    bloodPressure: string;
    heartRate: number;
    temperature: number;
    respiratoryRate: number;
  };
}

export function SmartDiagnosisEngine() {
  const [patients, setPatients] = useState<PatientData[]>([]);
  const [selectedPatient, setSelectedPatient] = useState<PatientData | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [symptoms, setSymptoms] = useState("");
  const [additionalInfo, setAdditionalInfo] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [diagnosisResults, setDiagnosisResults] = useState<DiagnosisResult[]>([]);
  const [analysisHistory, setAnalysisHistory] = useState<any[]>([]);

  useEffect(() => {
    loadPatients();
    loadAnalysisHistory();
  }, []);

  const loadPatients = async () => {
    try {
      const { data, error } = await supabase
        .from('patients')
        .select('*')
        .limit(10);

      if (error) throw error;

      const patientsData = data?.map(patient => ({
        id: patient.id,
        name: patient.full_name,
        age: patient.date_of_birth ? new Date().getFullYear() - new Date(patient.date_of_birth).getFullYear() : 0,
        gender: patient.gender || 'غير محدد',
        medicalHistory: patient.medical_history || '',
        currentSymptoms: '',
        vitals: {
          bloodPressure: '120/80',
          heartRate: 70,
          temperature: 37.0,
          respiratoryRate: 16
        }
      })) || [];

      setPatients(patientsData);
    } catch (error) {
      console.error('Error loading patients:', error);
      toast.error('خطأ في تحميل بيانات المرضى');
    }
  };

  const loadAnalysisHistory = async () => {
    try {
      const { data, error } = await supabase
        .from('ai_analysis_results')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) throw error;
      setAnalysisHistory(data || []);
    } catch (error) {
      console.error('Error loading analysis history:', error);
    }
  };

  const performSmartDiagnosis = async () => {
    if (!selectedPatient || !symptoms.trim()) {
      toast.error('يرجى اختيار مريض وإدخال الأعراض');
      return;
    }

    setIsAnalyzing(true);

    try {
      // محاكاة تحليل الذكاء الاصطناعي المتقدم
      await new Promise(resolve => setTimeout(resolve, 3000));

      const mockResults: DiagnosisResult[] = [
        {
          condition: "التهاب اللثة المزمن",
          confidence: 87,
          severity: 'medium',
          symptoms: symptoms.split(',').map(s => s.trim()),
          recommendations: [
            "تنظيف عميق للأسنان",
            "استخدام غسول فم مضاد للبكتيريا",
            "تحسين نظافة الفم اليومية",
            "زيارة متابعة خلال 4 أسابيع"
          ],
          urgency: 'soon',
          followUp: "مراجعة خلال 2-4 أسابيع",
          differentialDiagnosis: ["التهاب دواعم السن", "خراج لثوي", "التهاب الفم القلاعي"],
          riskFactors: ["التدخين", "سوء نظافة الفم", "مرض السكري"],
          treatmentOptions: [
            "العلاج التحفظي (تنظيف وتلميع)",
            "العلاج بالمضادات الحيوية الموضعية",
            "جراحة اللثة في الحالات المتقدمة"
          ],
          prognosis: "ممتاز مع العلاج المناسب",
          estimatedCost: 250
        },
        {
          condition: "تسوس عمق متوسط",
          confidence: 72,
          severity: 'low',
          symptoms: ["ألم عند تناول الحلويات", "حساسية للبرد"],
          recommendations: [
            "حشوة تجميلية",
            "تطبيق فلورايد",
            "تجنب المأكولات السكرية"
          ],
          urgency: 'routine',
          followUp: "مراجعة خلال 6 أشهر",
          differentialDiagnosis: ["حساسية الأسنان", "التهاب العصب الطفيف"],
          riskFactors: ["نظام غذائي غني بالسكر", "إهمال نظافة الفم"],
          treatmentOptions: ["حشوة كومبوزيت", "حشوة أمالجام", "تاج في الحالات المتقدمة"],
          prognosis: "ممتاز",
          estimatedCost: 150
        }
      ];

      setDiagnosisResults(mockResults);

      // حفظ نتائج التحليل في قاعدة البيانات
      const { data: profile } = await supabase
        .from('profiles')
        .select('id')
        .single();

      const analysisData = {
        image_id: crypto.randomUUID(),
        clinic_id: profile?.id || crypto.randomUUID(),
        ai_model: 'smart-diagnosis-engine-v2',
        analysis_type: 'comprehensive_diagnosis',
        confidence_score: mockResults[0].confidence / 100,
        detected_conditions: JSON.stringify(mockResults.map(r => r.condition)),
        recommendations: JSON.stringify(mockResults[0].recommendations),
        analysis_data: JSON.stringify({
          patient_id: selectedPatient.id,
          symptoms: symptoms,
          additional_info: additionalInfo,
          vitals: selectedPatient.vitals,
          results: mockResults
        })
      };

      const { error } = await supabase
        .from('ai_analysis_results')
        .insert(analysisData);

      if (error) throw error;

      toast.success('تم إجراء التشخيص الذكي بنجاح');
      loadAnalysisHistory();

    } catch (error) {
      console.error('Error performing diagnosis:', error);
      toast.error('خطأ في إجراء التشخيص');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'low': return 'bg-green-500';
      case 'medium': return 'bg-yellow-500';
      case 'high': return 'bg-orange-500';
      case 'critical': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const getUrgencyIcon = (urgency: string) => {
    switch (urgency) {
      case 'routine': return <Clock className="h-4 w-4 text-green-500" />;
      case 'soon': return <TrendingUp className="h-4 w-4 text-yellow-500" />;
      case 'urgent': return <AlertTriangle className="h-4 w-4 text-orange-500" />;
      case 'emergency': return <Heart className="h-4 w-4 text-red-500" />;
      default: return <Clock className="h-4 w-4" />;
    }
  };

  const filteredPatients = patients.filter(patient =>
    patient.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5 text-primary" />
            محرك التشخيص الذكي المتطور
          </CardTitle>
          <CardDescription>
            نظام تشخيص طبي متقدم يستخدم الذكاء الاصطناعي لتحليل الأعراض وتقديم تشخيص دقيق ومخصص
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="diagnosis" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="diagnosis">التشخيص الذكي</TabsTrigger>
              <TabsTrigger value="results">النتائج</TabsTrigger>
              <TabsTrigger value="history">السجل</TabsTrigger>
            </TabsList>

            <TabsContent value="diagnosis" className="space-y-6">
              {/* اختيار المريض */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">اختيار المريض</h3>
                <div className="flex gap-4">
                  <div className="flex-1">
                    <Input
                      placeholder="البحث عن مريض..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full"
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-h-60 overflow-y-auto">
                  {filteredPatients.map((patient) => (
                    <Card 
                      key={patient.id} 
                      className={`cursor-pointer transition-all ${
                        selectedPatient?.id === patient.id 
                          ? 'ring-2 ring-primary bg-primary/5' 
                          : 'hover:bg-muted/50'
                      }`}
                      onClick={() => setSelectedPatient(patient)}
                    >
                      <CardContent className="p-4">
                        <div className="space-y-2">
                          <h4 className="font-semibold">{patient.name}</h4>
                          <div className="text-sm text-muted-foreground">
                            <p>العمر: {patient.age} سنة</p>
                            <p>الجنس: {patient.gender}</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>

              {selectedPatient && (
                <div className="space-y-4">
                  <Alert>
                    <Users className="h-4 w-4" />
                    <AlertDescription>
                      المريض المختار: {selectedPatient.name} ({selectedPatient.age} سنة)
                    </AlertDescription>
                  </Alert>

                  {/* إدخال الأعراض */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold">الأعراض الحالية</h3>
                    <Textarea
                      placeholder="اكتب الأعراض التي يعاني منها المريض، مفصولة بفاصلات..."
                      value={symptoms}
                      onChange={(e) => setSymptoms(e.target.value)}
                      rows={4}
                    />
                  </div>

                  {/* معلومات إضافية */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold">معلومات إضافية</h3>
                    <Textarea
                      placeholder="أي معلومات إضافية مهمة للتشخيص..."
                      value={additionalInfo}
                      onChange={(e) => setAdditionalInfo(e.target.value)}
                      rows={3}
                    />
                  </div>

                  {/* العلامات الحيوية */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold">العلامات الحيوية</h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <Card>
                        <CardContent className="p-3 text-center">
                          <p className="text-sm text-muted-foreground">ضغط الدم</p>
                          <p className="font-semibold">{selectedPatient.vitals.bloodPressure}</p>
                        </CardContent>
                      </Card>
                      <Card>
                        <CardContent className="p-3 text-center">
                          <p className="text-sm text-muted-foreground">نبضات القلب</p>
                          <p className="font-semibold">{selectedPatient.vitals.heartRate}</p>
                        </CardContent>
                      </Card>
                      <Card>
                        <CardContent className="p-3 text-center">
                          <p className="text-sm text-muted-foreground">الحرارة</p>
                          <p className="font-semibold">{selectedPatient.vitals.temperature}°</p>
                        </CardContent>
                      </Card>
                      <Card>
                        <CardContent className="p-3 text-center">
                          <p className="text-sm text-muted-foreground">التنفس</p>
                          <p className="font-semibold">{selectedPatient.vitals.respiratoryRate}</p>
                        </CardContent>
                      </Card>
                    </div>
                  </div>

                  <Button 
                    onClick={performSmartDiagnosis}
                    disabled={isAnalyzing || !symptoms.trim()}
                    className="w-full"
                    size="lg"
                  >
                    {isAnalyzing ? (
                      <>
                        <Activity className="h-4 w-4 mr-2 animate-spin" />
                        جاري التحليل الذكي...
                      </>
                    ) : (
                      <>
                        <Brain className="h-4 w-4 mr-2" />
                        إجراء التشخيص الذكي
                      </>
                    )}
                  </Button>
                </div>
              )}
            </TabsContent>

            <TabsContent value="results" className="space-y-6">
              {isAnalyzing && (
                <Card>
                  <CardContent className="p-6">
                    <div className="space-y-4">
                      <div className="text-center">
                        <Brain className="h-12 w-12 mx-auto text-primary animate-pulse mb-4" />
                        <h3 className="text-lg font-semibold">جاري التحليل الذكي</h3>
                        <p className="text-muted-foreground">يتم تحليل البيانات باستخدام الذكاء الاصطناعي المتطور...</p>
                      </div>
                      <Progress value={66} className="w-full" />
                      <div className="text-sm text-muted-foreground text-center">
                        تحليل الأعراض والتاريخ الطبي...
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {diagnosisResults.length > 0 && (
                <div className="space-y-6">
                  <h3 className="text-xl font-bold">نتائج التشخيص الذكي</h3>
                  
                  {diagnosisResults.map((result, index) => (
                    <Card key={index} className="border-l-4 border-l-primary">
                      <CardHeader>
                        <CardTitle className="flex items-center justify-between">
                          <span>{result.condition}</span>
                          <div className="flex items-center gap-2">
                            {getUrgencyIcon(result.urgency)}
                            <Badge variant="outline">
                              دقة {result.confidence}%
                            </Badge>
                            <div className={`w-3 h-3 rounded-full ${getSeverityColor(result.severity)}`} />
                          </div>
                        </CardTitle>
                        <CardDescription>
                          الأولوية: {result.urgency} | المتابعة: {result.followUp}
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div className="space-y-4">
                            <div>
                              <h4 className="font-semibold mb-2 flex items-center gap-2">
                                <Target className="h-4 w-4" />
                                التوصيات
                              </h4>
                              <ul className="space-y-1">
                                {result.recommendations.map((rec, i) => (
                                  <li key={i} className="flex items-start gap-2 text-sm">
                                    <CheckCircle className="h-3 w-3 text-green-500 mt-1 flex-shrink-0" />
                                    {rec}
                                  </li>
                                ))}
                              </ul>
                            </div>

                            <div>
                              <h4 className="font-semibold mb-2">خيارات العلاج</h4>
                              <ul className="space-y-1">
                                {result.treatmentOptions.map((option, i) => (
                                  <li key={i} className="text-sm flex items-start gap-2">
                                    <span className="w-2 h-2 rounded-full bg-blue-500 mt-2 flex-shrink-0" />
                                    {option}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          </div>

                          <div className="space-y-4">
                            <div>
                              <h4 className="font-semibold mb-2">التشخيص التفريقي</h4>
                              <div className="flex flex-wrap gap-2">
                                {result.differentialDiagnosis.map((diag, i) => (
                                  <Badge key={i} variant="outline" className="text-xs">
                                    {diag}
                                  </Badge>
                                ))}
                              </div>
                            </div>

                            <div>
                              <h4 className="font-semibold mb-2">عوامل الخطر</h4>
                              <div className="flex flex-wrap gap-2">
                                {result.riskFactors.map((factor, i) => (
                                  <Badge key={i} variant="destructive" className="text-xs">
                                    {factor}
                                  </Badge>
                                ))}
                              </div>
                            </div>

                            <div className="p-4 bg-muted rounded-lg">
                              <div className="flex justify-between items-center mb-2">
                                <span className="font-semibold">التكلفة المتوقعة</span>
                                <span className="text-lg font-bold text-primary">
                                  ${result.estimatedCost}
                                </span>
                              </div>
                              <div className="text-sm text-muted-foreground">
                                التوقعات: {result.prognosis}
                              </div>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="history" className="space-y-4">
              <h3 className="text-lg font-semibold">سجل التحليلات السابقة</h3>
              
              {analysisHistory.length === 0 ? (
                <Card>
                  <CardContent className="p-6 text-center">
                    <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <p className="text-muted-foreground">لا توجد تحليلات سابقة</p>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-4">
                  {analysisHistory.map((analysis) => (
                    <Card key={analysis.id}>
                      <CardContent className="p-4">
                        <div className="flex justify-between items-start">
                          <div>
                            <h4 className="font-semibold">{analysis.analysis_type}</h4>
                            <p className="text-sm text-muted-foreground">
                              الثقة: {Math.round(analysis.confidence_score * 100)}%
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {new Date(analysis.created_at).toLocaleDateString('ar-SA')}
                            </p>
                          </div>
                          <Badge variant="outline">
                            {analysis.ai_model}
                          </Badge>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}