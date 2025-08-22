import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Bot, 
  Stethoscope, 
  FileText, 
  Lightbulb,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  Search,
  Brain,
  Clock,
  DollarSign
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface TreatmentSuggestion {
  id: string;
  treatmentName: string;
  description: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  estimatedCost: number;
  estimatedDuration: string;
  successRate: number;
  alternatives: string[];
  contraindications: string[];
  expectedOutcome: string;
  followUpRequired: boolean;
}

interface PatientAnalysis {
  patientId: string;
  patientName: string;
  riskProfile: 'low' | 'medium' | 'high';
  recommendedTreatments: TreatmentSuggestion[];
  preventiveMeasures: string[];
  urgentNeeds: string[];
  costEstimate: number;
}

export function VirtualDoctorAssistant() {
  const [patientSearch, setPatientSearch] = useState("");
  const [selectedPatient, setSelectedPatient] = useState<any>(null);
  const [patientAnalysis, setPatientAnalysis] = useState<PatientAnalysis | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [symptoms, setSymptoms] = useState("");
  const [medicalHistory, setMedicalHistory] = useState("");
  const { toast } = useToast();

  // البحث عن المرضى
  const searchPatients = async (query: string) => {
    if (query.length < 2) {
      setSearchResults([]);
      return;
    }

    try {
      const { data: profile } = await supabase
        .from('profiles')
        .select('id')
        .eq('user_id', (await supabase.auth.getUser()).data.user?.id)
        .single();

      if (!profile) return;

      const { data: patients, error } = await supabase
        .from('patients')
        .select(`
          id, full_name, date_of_birth, medical_history, phone,
          appointments(id, appointment_date, status, treatment_type),
          dental_treatments(id, diagnosis, treatment_date, status),
          medical_records(id, title, diagnosis, treatment_date)
        `)
        .eq('clinic_id', profile.id)
        .or(`full_name.ilike.%${query}%, phone.ilike.%${query}%`)
        .limit(10);

      if (error) throw error;
      setSearchResults(patients || []);
    } catch (error) {
      console.error('Error searching patients:', error);
    }
  };

  // تحليل المريض وإنتاج التوصيات
  const analyzePatient = async (patient: any) => {
    setIsAnalyzing(true);
    setSelectedPatient(patient);

    try {
      // محاكاة تحليل بالذكاء الاصطناعي
      await new Promise(resolve => setTimeout(resolve, 2000));

      const analysis = generateTreatmentRecommendations(patient, symptoms, medicalHistory);
      setPatientAnalysis(analysis);

      toast({
        title: "تم إنتاج التوصيات",
        description: "تم تحليل حالة المريض وإنتاج خطة العلاج المقترحة",
      });
    } catch (error) {
      toast({
        title: "خطأ في التحليل",
        description: "حدث خطأ أثناء تحليل بيانات المريض",
        variant: "destructive",
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  // إنتاج توصيات العلاج بالذكاء الاصطناعي
  const generateTreatmentRecommendations = (patient: any, symptoms: string, history: string): PatientAnalysis => {
    const treatments: TreatmentSuggestion[] = [];
    const preventiveMeasures: string[] = [];
    const urgentNeeds: string[] = [];
    let totalCost = 0;
    let riskProfile: 'low' | 'medium' | 'high' = 'low';

    // تحليل العمر
    const age = patient.date_of_birth ? 
      Math.floor((Date.now() - new Date(patient.date_of_birth).getTime()) / (365.25 * 24 * 60 * 60 * 1000)) : 30;

    // تحليل التاريخ المرضي والأعراض
    const symptomsLower = symptoms.toLowerCase();
    const historyLower = (patient.medical_history + ' ' + history).toLowerCase();

    // تحليل الألم والأعراض الحادة
    if (symptomsLower.includes('ألم') || symptomsLower.includes('وجع') || symptomsLower.includes('تورم')) {
      riskProfile = 'high';
      
      if (symptomsLower.includes('حاد') || symptomsLower.includes('شديد')) {
        treatments.push({
          id: 'emergency_treatment',
          treatmentName: 'علاج الألم الحاد',
          description: 'علاج فوري للألم مع مسكنات قوية ومضادات التهاب',
          priority: 'urgent',
          estimatedCost: 200,
          estimatedDuration: '1-2 ساعة',
          successRate: 95,
          alternatives: ['تسكين مؤقت', 'علاج عصب'],
          contraindications: ['حساسية للمسكنات', 'أمراض الكلى'],
          expectedOutcome: 'تخفيف فوري للألم',
          followUpRequired: true
        });
        urgentNeeds.push('علاج الألم الحاد فوراً');
        totalCost += 200;
      }

      if (symptomsLower.includes('تورم') || symptomsLower.includes('انتفاخ')) {
        treatments.push({
          id: 'abscess_treatment',
          treatmentName: 'علاج الخراج السني',
          description: 'تصريف الخراج وعلاج العدوى بالمضادات الحيوية',
          priority: 'urgent',
          estimatedCost: 350,
          estimatedDuration: '2-3 ساعات',
          successRate: 90,
          alternatives: ['مضاد حيوي فقط', 'قلع السن'],
          contraindications: ['حساسية المضادات الحيوية'],
          expectedOutcome: 'شفاء تام خلال أسبوع',
          followUpRequired: true
        });
        urgentNeeds.push('تصريف الخراج والعلاج بالمضادات الحيوية');
        totalCost += 350;
      }
    }

    // تحليل مشاكل اللثة
    if (symptomsLower.includes('نزيف') || symptomsLower.includes('لثة') || 
        patient.dental_treatments?.some((t: any) => t.diagnosis?.includes('لثة'))) {
      
      treatments.push({
        id: 'gum_treatment',
        treatmentName: 'علاج اللثة المتخصص',
        description: 'تنظيف عميق للثة وعلاج الالتهاب',
        priority: 'high',
        estimatedCost: 300,
        estimatedDuration: '1.5-2 ساعة',
        successRate: 85,
        alternatives: ['تنظيف بسيط', 'جراحة لثة'],
        contraindications: ['اضطرابات النزيف'],
        expectedOutcome: 'تحسن صحة اللثة خلال شهر',
        followUpRequired: true
      });
      
      preventiveMeasures.push('استخدام غسول فم مضاد للبكتيريا');
      preventiveMeasures.push('تنظيف أسنان متخصص كل 3 أشهر');
      totalCost += 300;
    }

    // تحليل مشاكل التسوس
    if (patient.dental_treatments?.some((t: any) => t.diagnosis?.includes('تسوس')) ||
        symptomsLower.includes('تسوس') || symptomsLower.includes('حفرة')) {
      
      treatments.push({
        id: 'cavity_treatment',
        treatmentName: 'علاج التسوس الشامل',
        description: 'حشو الأسنان المتسوسة بمواد عالية الجودة',
        priority: 'medium',
        estimatedCost: 150,
        estimatedDuration: '45-60 دقيقة',
        successRate: 95,
        alternatives: ['حشوة مؤقتة', 'تاج أسنان'],
        contraindications: ['حساسية للمواد'],
        expectedOutcome: 'استعادة وظيفة السن بالكامل',
        followUpRequired: false
      });
      totalCost += 150;
    }

    // توصيات وقائية بناءً على العمر
    if (age > 40) {
      preventiveMeasures.push('فحص دوري كل 6 أشهر للكشف المبكر');
      preventiveMeasures.push('أشعة بانورامية سنوية');
      
      treatments.push({
        id: 'preventive_care',
        treatmentName: 'برنامج رعاية وقائية',
        description: 'برنامج شامل للوقاية من مشاكل الأسنان',
        priority: 'medium',
        estimatedCost: 120,
        estimatedDuration: '30-45 دقيقة',
        successRate: 98,
        alternatives: ['فحص بسيط'],
        contraindications: [],
        expectedOutcome: 'منع تطور مشاكل جديدة',
        followUpRequired: true
      });
      totalCost += 120;
    }

    // تحليل الأمراض المزمنة
    if (historyLower.includes('سكري')) {
      riskProfile = 'high';
      urgentNeeds.push('متابعة خاصة بمرضى السكري');
      preventiveMeasures.push('تنظيف أسنان كل 3 أشهر');
      preventiveMeasures.push('مراقبة دقيقة لصحة اللثة');
      
      treatments.push({
        id: 'diabetic_care',
        treatmentName: 'رعاية خاصة لمرضى السكري',
        description: 'برنامج متابعة مكثف لمرضى السكري',
        priority: 'high',
        estimatedCost: 180,
        estimatedDuration: '1 ساعة',
        successRate: 88,
        alternatives: ['متابعة عادية'],
        contraindications: [],
        expectedOutcome: 'منع مضاعفات السكري على الأسنان',
        followUpRequired: true
      });
      totalCost += 180;
    }

    // إضافة توصيات تجميلية إذا لم تكن هناك مشاكل عاجلة
    if (riskProfile === 'low') {
      treatments.push({
        id: 'cosmetic_treatment',
        treatmentName: 'تحسين جمالية الابتسامة',
        description: 'تبييض أو قشور أسنان لتحسين المظهر',
        priority: 'low',
        estimatedCost: 500,
        estimatedDuration: '2-3 جلسات',
        successRate: 92,
        alternatives: ['تنظيف فقط', 'تقويم أسنان'],
        contraindications: ['أسنان حساسة'],
        expectedOutcome: 'ابتسامة أجمل وأكثر إشراقاً',
        followUpRequired: false
      });
      preventiveMeasures.push('المحافظة على نظافة الأسنان اليومية');
    }

    return {
      patientId: patient.id,
      patientName: patient.full_name,
      riskProfile,
      recommendedTreatments: treatments.sort((a, b) => {
        const priorityOrder = { urgent: 4, high: 3, medium: 2, low: 1 };
        return priorityOrder[b.priority] - priorityOrder[a.priority];
      }),
      preventiveMeasures,
      urgentNeeds,
      costEstimate: totalCost
    };
  };

  useEffect(() => {
    const debounceTimer = setTimeout(() => {
      searchPatients(patientSearch);
    }, 300);

    return () => clearTimeout(debounceTimer);
  }, [patientSearch]);

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'bg-red-100 text-red-800 border-red-300';
      case 'high': return 'bg-orange-100 text-orange-800 border-orange-300';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'low': return 'bg-green-100 text-green-800 border-green-300';
      default: return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'high': return 'bg-red-100 text-red-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bot className="w-6 h-6 text-primary" />
            المساعد الطبي الافتراضي
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* البحث عن المرضى */}
          <div className="space-y-2">
            <label className="text-sm font-medium">البحث عن مريض</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="ابحث بالاسم أو رقم الهاتف..."
                value={patientSearch}
                onChange={(e) => setPatientSearch(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          {/* نتائج البحث */}
          {searchResults.length > 0 && (
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {searchResults.map((patient) => (
                <div
                  key={patient.id}
                  className="p-3 border rounded-lg cursor-pointer hover:bg-muted/50 transition-colors"
                  onClick={() => {
                    setSelectedPatient(patient);
                    setPatientSearch(patient.full_name);
                    setSearchResults([]);
                  }}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">{patient.full_name}</p>
                      <p className="text-sm text-muted-foreground">{patient.phone}</p>
                    </div>
                    <Badge variant="outline">
                      {patient.appointments?.length || 0} موعد
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* معلومات إضافية */}
          {selectedPatient && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium mb-2 block">الأعراض الحالية</label>
                <Textarea
                  placeholder="اكتب الأعراض الحالية للمريض..."
                  value={symptoms}
                  onChange={(e) => setSymptoms(e.target.value)}
                  className="min-h-[100px]"
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">معلومات إضافية</label>
                <Textarea
                  placeholder="أي معلومات طبية إضافية..."
                  value={medicalHistory}
                  onChange={(e) => setMedicalHistory(e.target.value)}
                  className="min-h-[100px]"
                />
              </div>
            </div>
          )}

          {selectedPatient && (
            <Button 
              onClick={() => analyzePatient(selectedPatient)}
              disabled={isAnalyzing}
              className="w-full"
            >
              {isAnalyzing ? (
                <>
                  <Brain className="w-4 h-4 ml-2 animate-pulse" />
                  جاري التحليل والتوصية...
                </>
              ) : (
                <>
                  <Stethoscope className="w-4 h-4 ml-2" />
                  تحليل الحالة وإنتاج التوصيات
                </>
              )}
            </Button>
          )}
        </CardContent>
      </Card>

      {/* نتائج التحليل */}
      {patientAnalysis && (
        <Tabs defaultValue="treatments" className="space-y-4">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="treatments">خطة العلاج</TabsTrigger>
            <TabsTrigger value="prevention">الوقاية</TabsTrigger>
            <TabsTrigger value="urgent">العاجل</TabsTrigger>
            <TabsTrigger value="cost">التكلفة</TabsTrigger>
          </TabsList>

          {/* معلومات المريض */}
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium">{patientAnalysis.patientName}</h3>
                <div className="flex items-center gap-2">
                  <Badge className={getRiskColor(patientAnalysis.riskProfile)}>
                    مستوى خطر: {patientAnalysis.riskProfile === 'high' ? 'عالي' : 
                              patientAnalysis.riskProfile === 'medium' ? 'متوسط' : 'منخفض'}
                  </Badge>
                  <Badge variant="outline">
                    <DollarSign className="w-3 h-3 ml-1" />
                    {patientAnalysis.costEstimate} ريال
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          <TabsContent value="treatments" className="space-y-4">
            {patientAnalysis.recommendedTreatments.map((treatment) => (
              <Card key={treatment.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base">{treatment.treatmentName}</CardTitle>
                    <div className="flex items-center gap-2">
                      <Badge className={getPriorityColor(treatment.priority)}>
                        {treatment.priority === 'urgent' ? 'عاجل' :
                         treatment.priority === 'high' ? 'عالي' :
                         treatment.priority === 'medium' ? 'متوسط' : 'منخفض'}
                      </Badge>
                      <Badge variant="outline">
                        نجاح {treatment.successRate}%
                      </Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-sm text-muted-foreground">{treatment.description}</p>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="flex items-center gap-2">
                      <DollarSign className="w-4 h-4 text-muted-foreground" />
                      <span className="text-sm">{treatment.estimatedCost} ريال</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-muted-foreground" />
                      <span className="text-sm">{treatment.estimatedDuration}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <TrendingUp className="w-4 h-4 text-muted-foreground" />
                      <span className="text-sm">{treatment.expectedOutcome}</span>
                    </div>
                  </div>

                  {treatment.alternatives.length > 0 && (
                    <div>
                      <h4 className="text-sm font-medium mb-2">البدائل:</h4>
                      <div className="flex gap-2 flex-wrap">
                        {treatment.alternatives.map((alt, index) => (
                          <Badge key={index} variant="outline" className="text-xs">
                            {alt}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {treatment.contraindications.length > 0 && (
                    <Alert>
                      <AlertTriangle className="w-4 h-4" />
                      <AlertDescription className="text-sm">
                        <strong>موانع الاستعمال:</strong> {treatment.contraindications.join(', ')}
                      </AlertDescription>
                    </Alert>
                  )}
                </CardContent>
              </Card>
            ))}
          </TabsContent>

          <TabsContent value="prevention" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Lightbulb className="w-5 h-5" />
                  التوصيات الوقائية
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {patientAnalysis.preventiveMeasures.map((measure, index) => (
                    <div key={index} className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                      <CheckCircle2 className="w-4 h-4 text-green-600" />
                      <span className="text-sm">{measure}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="urgent" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-red-600" />
                  الاحتياجات العاجلة
                </CardTitle>
              </CardHeader>
              <CardContent>
                {patientAnalysis.urgentNeeds.length > 0 ? (
                  <div className="space-y-3">
                    {patientAnalysis.urgentNeeds.map((need, index) => (
                      <Alert key={index} className="border-red-200 bg-red-50">
                        <AlertTriangle className="w-4 h-4 text-red-600" />
                        <AlertDescription className="text-sm font-medium text-red-800">
                          {need}
                        </AlertDescription>
                      </Alert>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-6">
                    <CheckCircle2 className="w-8 h-8 text-green-600 mx-auto mb-2" />
                    <p className="text-sm text-muted-foreground">لا توجد احتياجات عاجلة</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="cost" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="w-5 h-5" />
                  تقدير التكلفة الإجمالية
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="text-center p-6 bg-primary/10 rounded-lg">
                    <div className="text-3xl font-bold text-primary mb-2">
                      {patientAnalysis.costEstimate} ريال
                    </div>
                    <p className="text-sm text-muted-foreground">تقدير إجمالي للعلاجات المقترحة</p>
                  </div>

                  <div className="space-y-2">
                    {patientAnalysis.recommendedTreatments.map((treatment) => (
                      <div key={treatment.id} className="flex items-center justify-between p-2 border rounded">
                        <span className="text-sm">{treatment.treatmentName}</span>
                        <span className="font-medium">{treatment.estimatedCost} ريال</span>
                      </div>
                    ))}
                  </div>

                  <Alert>
                    <FileText className="w-4 h-4" />
                    <AlertDescription className="text-xs">
                      * الأسعار تقديرية وقد تختلف حسب الحالة الفعلية ومتطلبات العلاج
                    </AlertDescription>
                  </Alert>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}