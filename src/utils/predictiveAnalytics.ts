import { supabase } from "@/integrations/supabase/client";

export interface AppointmentPrediction {
  appointmentId: string;
  patientId: string;
  patientName: string;
  appointmentDate: string;
  cancellationRisk: number;
  riskLevel: 'low' | 'medium' | 'high';
  riskFactors: string[];
  recommendations: string[];
}

export interface PatientReturnPrediction {
  patientId: string;
  patientName: string;
  lastVisit: string;
  returnProbability: number;
  predictedReturnDate: string;
  recommendations: string[];
  riskFactors: string[];
}

export interface PatientRecommendation {
  patientId: string;
  patientName: string;
  type: 'cleaning' | 'checkup' | 'treatment_followup' | 'prevention';
  title: string;
  description: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  dueDate: string;
  frequency: string;
  customMessage: string;
}

class PredictiveAnalyticsService {
  // تحليل احتمالية إلغاء المواعيد
  async predictAppointmentCancellations(clinicId: string): Promise<AppointmentPrediction[]> {
    try {
      // جلب المواعيد القادمة
      const { data: appointments, error: appointmentsError } = await supabase
        .from('appointments')
        .select(`
          id, appointment_date, patient_id, status, notes,
          patients!inner(id, full_name, phone, email, created_at)
        `)
        .eq('clinic_id', clinicId)
        .eq('status', 'scheduled')
        .gte('appointment_date', new Date().toISOString())
        .order('appointment_date', { ascending: true });

      if (appointmentsError) throw appointmentsError;

      // جلب المواعيد المُلغاة سابقاً لكل مريض لحساب النمط
      const { data: canceledHistory, error: historyError } = await supabase
        .from('appointments')
        .select('patient_id, status, appointment_date')
        .eq('clinic_id', clinicId)
        .in('status', ['canceled', 'no_show']);

      if (historyError) throw historyError;

      const predictions: AppointmentPrediction[] = [];

      for (const appointment of appointments || []) {
        const patient = appointment.patients;
        if (!patient) continue;

        // حساب عوامل الخطر
        const riskFactors = this.calculateCancellationRiskFactors(
          appointment,
          patient,
          canceledHistory || []
        );

        const cancellationRisk = this.calculateCancellationRisk(riskFactors);
        const riskLevel = this.getRiskLevel(cancellationRisk);

        predictions.push({
          appointmentId: appointment.id,
          patientId: patient.id,
          patientName: patient.full_name,
          appointmentDate: appointment.appointment_date,
          cancellationRisk,
          riskLevel,
          riskFactors: riskFactors.factors,
          recommendations: this.generateCancellationPreventionRecommendations(riskFactors)
        });
      }

      return predictions.sort((a, b) => b.cancellationRisk - a.cancellationRisk);
    } catch (error) {
      console.error('Error predicting cancellations:', error);
      return [];
    }
  }

  // تحليل احتمالية عودة المرضى
  async predictPatientReturns(clinicId: string): Promise<PatientReturnPrediction[]> {
    try {
      // جلب المرضى مع آخر زياراتهم
      const { data: patients, error } = await supabase
        .from('patients')
        .select(`
          id, full_name, created_at, medical_history,
          appointments(appointment_date, status)
        `)
        .eq('clinic_id', clinicId)
        .eq('patient_status', 'active');

      if (error) throw error;

      const predictions: PatientReturnPrediction[] = [];

      for (const patient of patients || []) {
        const completedAppointments = patient.appointments?.filter(
          apt => apt.status === 'completed'
        ) || [];

        if (completedAppointments.length === 0) continue;

        const lastVisit = completedAppointments
          .sort((a, b) => new Date(b.appointment_date).getTime() - new Date(a.appointment_date).getTime())[0];

        const returnPrediction = this.calculateReturnProbability(patient, completedAppointments);

        predictions.push({
          patientId: patient.id,
          patientName: patient.full_name,
          lastVisit: lastVisit.appointment_date,
          returnProbability: returnPrediction.probability,
          predictedReturnDate: returnPrediction.predictedDate,
          recommendations: returnPrediction.recommendations,
          riskFactors: returnPrediction.riskFactors
        });
      }

      return predictions.sort((a, b) => a.returnProbability - b.returnProbability);
    } catch (error) {
      console.error('Error predicting returns:', error);
      return [];
    }
  }

  // إنشاء توصيات مخصصة للمرضى
  async generatePatientRecommendations(clinicId: string): Promise<PatientRecommendation[]> {
    try {
      const { data: patients, error } = await supabase
        .from('patients')
        .select(`
          id, full_name, date_of_birth, medical_history, created_at,
          appointments(appointment_date, status, treatment_type, created_at),
          dental_treatments(treatment_date, status, diagnosis)
        `)
        .eq('clinic_id', clinicId)
        .eq('patient_status', 'active');

      if (error) throw error;

      const recommendations: PatientRecommendation[] = [];

      for (const patient of patients || []) {
        const patientRecommendations = this.generateIndividualRecommendations(patient);
        recommendations.push(...patientRecommendations);
      }

      return recommendations.sort((a, b) => {
        const priorityOrder = { urgent: 4, high: 3, medium: 2, low: 1 };
        return priorityOrder[b.priority] - priorityOrder[a.priority];
      });
    } catch (error) {
      console.error('Error generating recommendations:', error);
      return [];
    }
  }

  private calculateCancellationRiskFactors(appointment: any, patient: any, canceledHistory: any[]) {
    const factors: string[] = [];
    let riskScore = 0;

    // تاريخ الإلغاءات
    const patientCancellations = canceledHistory.filter(h => h.patient_id === patient.id);
    if (patientCancellations.length > 0) {
      const cancellationRate = patientCancellations.length / (patientCancellations.length + 5); // افتراض 5 مواعيد مكتملة
      riskScore += cancellationRate * 40;
      factors.push(`نسبة إلغاء سابقة: ${(cancellationRate * 100).toFixed(0)}%`);
    }

    // وقت الموعد
    const appointmentDate = new Date(appointment.appointment_date);
    const dayOfWeek = appointmentDate.getDay();
    const hour = appointmentDate.getHours();
    
    if (dayOfWeek === 1) { // الاثنين
      riskScore += 10;
      factors.push('موعد يوم الاثنين (معدل إلغاء أعلى)');
    }
    
    if (hour < 9 || hour > 16) {
      riskScore += 15;
      factors.push('موعد خارج الساعات المثلى');
    }

    // عدم وجود رقم هاتف
    if (!patient.phone) {
      riskScore += 20;
      factors.push('عدم وجود رقم هاتف للتأكيد');
    }

    // مريض جديد
    const patientAge = Date.now() - new Date(patient.created_at).getTime();
    if (patientAge < 30 * 24 * 60 * 60 * 1000) { // أقل من شهر
      riskScore += 15;
      factors.push('مريض جديد');
    }

    // فترة الإشعار
    const noticeTime = new Date(appointment.appointment_date).getTime() - Date.now();
    const daysNotice = noticeTime / (24 * 60 * 60 * 1000);
    
    if (daysNotice > 14) {
      riskScore += 10;
      factors.push('موعد بعيد (أكثر من أسبوعين)');
    }

    return { factors, riskScore };
  }

  private calculateCancellationRisk(riskFactors: { factors: string[]; riskScore: number }): number {
    return Math.min(riskFactors.riskScore / 100, 0.95);
  }

  private getRiskLevel(risk: number): 'low' | 'medium' | 'high' {
    if (risk < 0.3) return 'low';
    if (risk < 0.6) return 'medium';
    return 'high';
  }

  private generateCancellationPreventionRecommendations(riskFactors: { factors: string[]; riskScore: number }): string[] {
    const recommendations: string[] = [];
    
    if (riskFactors.riskScore > 50) {
      recommendations.push('اتصال تأكيدي قبل الموعد بـ 24 ساعة');
      recommendations.push('إرسال رسالة تذكيرية');
    }
    
    if (riskFactors.factors.some(f => f.includes('جديد'))) {
      recommendations.push('اتصال ترحيبي وشرح إجراءات العيادة');
    }
    
    if (riskFactors.factors.some(f => f.includes('هاتف'))) {
      recommendations.push('تحديث بيانات الاتصال');
    }
    
    recommendations.push('توضيح أهمية الموعد والعلاج المطلوب');
    
    return recommendations;
  }

  private calculateReturnProbability(patient: any, appointments: any[]) {
    let probability = 0.5; // نقطة البداية
    const recommendations: string[] = [];
    const riskFactors: string[] = [];

    // تحليل نمط الزيارات
    if (appointments.length > 1) {
      const intervals = [];
      for (let i = 1; i < appointments.length; i++) {
        const interval = new Date(appointments[i-1].appointment_date).getTime() - 
                        new Date(appointments[i].appointment_date).getTime();
        intervals.push(interval / (24 * 60 * 60 * 1000)); // بالأيام
      }
      
      const avgInterval = intervals.reduce((a, b) => a + b, 0) / intervals.length;
      
      if (avgInterval < 180) { // أقل من 6 أشهر
        probability += 0.3;
        recommendations.push('مريض منتظم - حافظ على التواصل');
      } else {
        probability -= 0.2;
        riskFactors.push('فترات طويلة بين الزيارات');
      }
    }

    // آخر زيارة
    const daysSinceLastVisit = (Date.now() - new Date(appointments[0].appointment_date).getTime()) / (24 * 60 * 60 * 1000);
    
    if (daysSinceLastVisit > 365) {
      probability -= 0.4;
      riskFactors.push('لم يزر العيادة منذ أكثر من سنة');
      recommendations.push('اتصال متابعة عاجل');
    } else if (daysSinceLastVisit > 180) {
      probability -= 0.2;
      riskFactors.push('آخر زيارة منذ أكثر من 6 أشهر');
      recommendations.push('رسالة تذكيرية بالفحص الدوري');
    }

    // التاريخ المرضي
    if (patient.medical_history?.toLowerCase().includes('مزمن')) {
      probability += 0.2;
      recommendations.push('متابعة دورية للحالة المزمنة');
    }

    // تحديد التاريخ المتوقع للعودة
    const avgReturnDays = appointments.length > 1 ? 180 : 365; // 6 أشهر للمنتظمين، سنة للآخرين
    const predictedDate = new Date(Date.now() + avgReturnDays * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    return {
      probability: Math.max(0.1, Math.min(0.9, probability)),
      predictedDate,
      recommendations,
      riskFactors
    };
  }

  private generateIndividualRecommendations(patient: any): PatientRecommendation[] {
    const recommendations: PatientRecommendation[] = [];
    const now = new Date();
    
    // حساب العمر
    const age = patient.date_of_birth ? 
      Math.floor((now.getTime() - new Date(patient.date_of_birth).getTime()) / (365.25 * 24 * 60 * 60 * 1000)) : 30;

    // آخر موعد
    const lastAppointment = patient.appointments?.filter((apt: any) => apt.status === 'completed')
      .sort((a: any, b: any) => new Date(b.appointment_date).getTime() - new Date(a.appointment_date).getTime())[0];

    const daysSinceLastVisit = lastAppointment ? 
      (now.getTime() - new Date(lastAppointment.appointment_date).getTime()) / (24 * 60 * 60 * 1000) : 365;

    // توصيات التنظيف الدوري
    if (daysSinceLastVisit > 180) { // أكثر من 6 أشهر
      recommendations.push({
        patientId: patient.id,
        patientName: patient.full_name,
        type: 'cleaning',
        title: 'تنظيف أسنان دوري',
        description: 'حان وقت التنظيف الدوري للأسنان واللثة',
        priority: daysSinceLastVisit > 365 ? 'high' : 'medium',
        dueDate: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        frequency: 'كل 6 أشهر',
        customMessage: `مرحباً ${patient.full_name}، لقد مضى ${Math.floor(daysSinceLastVisit / 30)} شهراً على آخر تنظيف. نوصي بحجز موعد للتنظيف الدوري.`
      });
    }

    // توصيات خاصة بالعمر
    if (age > 40 && daysSinceLastVisit > 365) {
      recommendations.push({
        patientId: patient.id,
        patientName: patient.full_name,
        type: 'checkup',
        title: 'فحص شامل للأسنان',
        description: 'فحص شامل ضروري بعد سن الأربعين',
        priority: 'high',
        dueDate: new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        frequency: 'سنوياً',
        customMessage: `نوصي بفحص شامل سنوي بعد سن الأربعين للوقاية من مشاكل الأسنان واللثة.`
      });
    }

    // توصيات بناءً على التاريخ المرضي
    if (patient.medical_history?.toLowerCase().includes('سكري')) {
      recommendations.push({
        patientId: patient.id,
        patientName: patient.full_name,
        type: 'prevention',
        title: 'متابعة خاصة للثة',
        description: 'مرضى السكري يحتاجون متابعة خاصة للثة',
        priority: 'high',
        dueDate: new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        frequency: 'كل 3 أشهر',
        customMessage: `كمريض سكري، أنت بحاجة لمتابعة خاصة لصحة اللثة. ننصح بزيارة دورية كل 3 أشهر.`
      });
    }

    // متابعة العلاجات
    const recentTreatment = patient.dental_treatments?.filter((t: any) => t.status === 'completed')
      .sort((a: any, b: any) => new Date(b.treatment_date).getTime() - new Date(a.treatment_date).getTime())[0];

    if (recentTreatment) {
      const daysSinceTreatment = (now.getTime() - new Date(recentTreatment.treatment_date).getTime()) / (24 * 60 * 60 * 1000);
      
      if (daysSinceTreatment >= 14 && daysSinceTreatment <= 30) {
        recommendations.push({
          patientId: patient.id,
          patientName: patient.full_name,
          type: 'treatment_followup',
          title: 'متابعة العلاج',
          description: `متابعة ${recentTreatment.diagnosis || 'العلاج الأخير'}`,
          priority: 'medium',
          dueDate: new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          frequency: 'مرة واحدة',
          customMessage: `نود التأكد من تعافيك بعد العلاج الأخير. يرجى حجز موعد للمتابعة.`
        });
      }
    }

    return recommendations;
  }
}

export const predictiveAnalyticsService = new PredictiveAnalyticsService();