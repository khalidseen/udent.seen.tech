import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertTriangle, CheckCircle, Info, Brain } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface Patient {
  id: string;
  full_name: string;
  date_of_birth: string;
  medical_history: string;
}

interface TreatmentRecommendation {
  id: string;
  type: 'warning' | 'info' | 'success';
  title: string;
  description: string;
  severity: 'high' | 'medium' | 'low';
}

interface SmartTreatmentRecommendationsProps {
  patientId: string;
  proposedTreatment: string;
  proposedMedication?: string;
}

const SmartTreatmentRecommendations = ({
  patientId,
  proposedTreatment,
  proposedMedication
}: SmartTreatmentRecommendationsProps) => {
  const [patient, setPatient] = useState<Patient | null>(null);
  const [recommendations, setRecommendations] = useState<TreatmentRecommendation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (patientId && proposedTreatment) {
      fetchPatientAndAnalyze();
    }
  }, [patientId, proposedTreatment, proposedMedication]);

  const fetchPatientAndAnalyze = async () => {
    try {
      setLoading(true);
      
      // Fetch patient data
      const { data: patientData, error } = await supabase
        .from('patients')
        .select('id, full_name, date_of_birth, medical_history')
        .eq('id', patientId)
        .single();

      if (error) throw error;
      
      setPatient(patientData);
      
      // Analyze and generate recommendations
      const analysisResults = analyzePatientForTreatment(patientData, proposedTreatment, proposedMedication);
      setRecommendations(analysisResults);
      
    } catch (error) {
      console.error('Error fetching patient data:', error);
    } finally {
      setLoading(false);
    }
  };

  const analyzePatientForTreatment = (
    patient: Patient, 
    treatment: string, 
    medication?: string
  ): TreatmentRecommendation[] => {
    const recommendations: TreatmentRecommendation[] = [];
    const medicalHistory = patient.medical_history?.toLowerCase() || '';
    const age = calculateAge(patient.date_of_birth);

    // Age-based recommendations
    if (age < 12) {
      recommendations.push({
        id: 'age_child',
        type: 'warning',
        title: 'مريض أطفال',
        description: 'يجب مراعاة الجرعات المناسبة للأطفال وتجنب بعض الأدوية غير المناسبة لهذا العمر',
        severity: 'high'
      });
    } else if (age > 65) {
      recommendations.push({
        id: 'age_elderly',
        type: 'info',
        title: 'مريض مسن',
        description: 'يُنصح بمراجعة الجرعات وتجنب الأدوية التي قد تتفاعل مع أدوية الضغط أو السكري',
        severity: 'medium'
      });
    }

    // Allergy checks
    const allergyKeywords = ['حساسية', 'أليرجي', 'حساس', 'رد فعل'];
    if (allergyKeywords.some(keyword => medicalHistory.includes(keyword))) {
      recommendations.push({
        id: 'allergy_warning',
        type: 'warning',
        title: 'تحذير: وجود حساسية',
        description: 'يُرجى مراجعة تاريخ الحساسية قبل وصف أي دواء. تجنب البنسلين إذا كان المريض يعاني من حساسية منه',
        severity: 'high'
      });
    }

    // Medical condition checks
    if (medicalHistory.includes('سكري') || medicalHistory.includes('سكر')) {
      recommendations.push({
        id: 'diabetes_warning',
        type: 'warning',
        title: 'مريض سكري',
        description: 'يجب مراقبة مستوى السكر أثناء العلاج. تجنب الأدوية التي قد تؤثر على مستوى السكر',
        severity: 'high'
      });
    }

    if (medicalHistory.includes('ضغط') || medicalHistory.includes('قلب')) {
      recommendations.push({
        id: 'heart_warning',
        type: 'warning',
        title: 'مريض ضغط/قلب',
        description: 'تجنب الأدوية المحتوية على إبينفرين بكميات كبيرة. استشر طبيب القلب عند الحاجة',
        severity: 'high'
      });
    }

    if (medicalHistory.includes('حمل') || medicalHistory.includes('حامل')) {
      recommendations.push({
        id: 'pregnancy_warning',
        type: 'warning',
        title: 'مريضة حامل',
        description: 'يجب تجنب الأشعة السينية والأدوية الضارة بالجنين. استخدم أدوية آمنة للحمل فقط',
        severity: 'high'
      });
    }

    // Treatment-specific recommendations
    if (treatment.toLowerCase().includes('خلع')) {
      recommendations.push({
        id: 'extraction_info',
        type: 'info',
        title: 'نصائح لخلع الأسنان',
        description: 'تأكد من تجلط الدم جيداً. وصف مضاد حيوي إذا لزم الأمر. نصح المريض بتجنب المضمضة القوية',
        severity: 'medium'
      });
    }

    if (treatment.toLowerCase().includes('جراحة') || treatment.toLowerCase().includes('عملية')) {
      recommendations.push({
        id: 'surgery_warning',
        type: 'warning',
        title: 'إجراء جراحي',
        description: 'تأكد من تحضير المريض جيداً. وصف مضاد حيوي قبل العملية إذا لزم. متابعة ما بعد العملية مهم',
        severity: 'high'
      });
    }

    // Medication-specific checks
    if (medication) {
      if (medication.toLowerCase().includes('بنسلين') && 
          (medicalHistory.includes('حساسية بنسلين') || medicalHistory.includes('أليرجي بنسلين'))) {
        recommendations.push({
          id: 'penicillin_allergy',
          type: 'warning',
          title: 'تحذير: حساسية البنسلين',
          description: 'المريض لديه حساسية من البنسلين. يُنصح باستخدام بديل مثل الإريثروميسين أو الكليندامايسين',
          severity: 'high'
        });
      }

      if (medication.toLowerCase().includes('إيبوبروفين') && 
          (medicalHistory.includes('قرحة') || medicalHistory.includes('نزيف معدة'))) {
        recommendations.push({
          id: 'ibuprofen_warning',
          type: 'warning',
          title: 'تحذير: الإيبوبروفين',
          description: 'المريض لديه تاريخ مع مشاكل المعدة. يُنصح باستخدام الباراسيتامول بدلاً من الإيبوبروفين',
          severity: 'medium'
        });
      }
    }

    // General success message if no major issues
    if (recommendations.filter(r => r.severity === 'high').length === 0) {
      recommendations.push({
        id: 'safe_treatment',
        type: 'success',
        title: 'العلاج آمن',
        description: 'لا توجد تحذيرات مهمة للعلاج المقترح بناءً على تاريخ المريض المدون',
        severity: 'low'
      });
    }

    return recommendations;
  };

  const calculateAge = (birthDate: string): number => {
    if (!birthDate) return 0;
    const today = new Date();
    const birth = new Date(birthDate);
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    
    return age;
  };

  const getIconForType = (type: string) => {
    switch (type) {
      case 'warning':
        return <AlertTriangle className="w-4 h-4" />;
      case 'success':
        return <CheckCircle className="w-4 h-4" />;
      default:
        return <Info className="w-4 h-4" />;
    }
  };

  const getVariantForType = (type: string): "default" | "destructive" => {
    return type === 'warning' ? 'destructive' : 'default';
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Brain className="w-5 h-5 ml-2" />
            النظام الذكي للعلاجات
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-4">جاري التحليل...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border border-border/60 bg-white/90 dark:bg-card/90 backdrop-blur-sm">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center text-xl font-semibold">
          <Brain className="w-6 h-6 ml-2 text-primary" />
          النظام الذكي للعلاجات
        </CardTitle>
        {patient && (
          <p className="text-base text-muted-foreground">
            تحليل ذكي للمريض: <span className="font-medium text-foreground">{patient.full_name}</span> (العمر: {calculateAge(patient.date_of_birth)} سنة)
          </p>
        )}
      </CardHeader>
      <CardContent className="space-y-4">
        {recommendations.map((rec) => (
          <Alert key={rec.id} variant={getVariantForType(rec.type)} className="border border-border/60 bg-white/70 dark:bg-card/70">
            {getIconForType(rec.type)}
            <div className="flex-1">
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-semibold text-base">{rec.title}</h4>
                <Badge variant={rec.severity === 'high' ? 'destructive' : 'secondary'} className="text-xs px-2 py-1">
                  {rec.severity === 'high' ? 'عالي' : rec.severity === 'medium' ? 'متوسط' : 'منخفض'}
                </Badge>
              </div>
              <AlertDescription className="text-sm leading-relaxed">{rec.description}</AlertDescription>
            </div>
          </Alert>
        ))}
      </CardContent>
    </Card>
  );
};

export default SmartTreatmentRecommendations;