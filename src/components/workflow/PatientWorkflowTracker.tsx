import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  Calendar, Activity, FileText, DollarSign, 
  CheckCircle, Clock, ArrowRight, AlertCircle 
} from "lucide-react";
import { Progress } from "@/components/ui/progress";

interface PatientWorkflowTrackerProps {
  patientId: string;
}

export function PatientWorkflowTracker({ patientId }: PatientWorkflowTrackerProps) {
  const { data: workflowStatus, isLoading } = useQuery({
    queryKey: ['patient-workflow', patientId],
    queryFn: async () => {
      // جلب جميع البيانات المتعلقة بالمريض
      const [appointmentsResult, treatmentsResult, invoicesResult, paymentsResult] = await Promise.all([
        supabase.from('appointments').select('*').eq('patient_id', patientId).order('appointment_date', { ascending: false }),
        supabase.from('dental_treatments').select('*').eq('patient_id', patientId).order('treatment_date', { ascending: false }),
        supabase.from('invoices').select('*').eq('patient_id', patientId),
        supabase.from('payments').select('*').eq('patient_id', patientId)
      ]);

      const appointments = appointmentsResult.data || [];
      const treatments = treatmentsResult.data || [];
      const invoices = invoicesResult.data || [];
      const payments = paymentsResult.data || [];

      // حساب حالة كل مرحلة
      const hasAppointment = appointments.length > 0;
      const hasCompletedAppointment = appointments.some(a => a.status === 'completed');
      const hasTreatmentPlan = treatments.length > 0;
      const hasOngoingTreatment = treatments.some(t => t.status === 'in_progress');
      const hasCompletedTreatment = treatments.some(t => t.status === 'completed');
      const hasInvoice = invoices.length > 0;
      const hasPayment = payments.length > 0;
      const totalBalance = invoices.reduce((sum, inv) => sum + Number(inv.balance_due || 0), 0);
      const isPaid = totalBalance <= 0;

      // حساب نسبة الإنجاز
      let completedSteps = 0;
      const totalSteps = 7;
      
      if (hasAppointment) completedSteps++;
      if (hasCompletedAppointment) completedSteps++;
      if (hasTreatmentPlan) completedSteps++;
      if (hasOngoingTreatment || hasCompletedTreatment) completedSteps++;
      if (hasInvoice) completedSteps++;
      if (hasPayment) completedSteps++;
      if (isPaid) completedSteps++;

      const progress = (completedSteps / totalSteps) * 100;

      // تحديد المرحلة الحالية
      let currentStage = 'appointment_booking';
      if (isPaid && hasCompletedTreatment) currentStage = 'completed';
      else if (hasPayment) currentStage = 'payment';
      else if (hasInvoice) currentStage = 'invoicing';
      else if (hasOngoingTreatment) currentStage = 'treatment_execution';
      else if (hasTreatmentPlan) currentStage = 'treatment_planning';
      else if (hasCompletedAppointment) currentStage = 'diagnosis';

      return {
        currentStage,
        progress,
        steps: {
          appointmentBooked: hasAppointment,
          appointmentCompleted: hasCompletedAppointment,
          treatmentPlanned: hasTreatmentPlan,
          treatmentStarted: hasOngoingTreatment,
          treatmentCompleted: hasCompletedTreatment,
          invoiceCreated: hasInvoice,
          paymentReceived: hasPayment,
          fullyPaid: isPaid,
        },
        nextActions: getNextActions(currentStage, {
          hasAppointment,
          hasCompletedAppointment,
          hasTreatmentPlan,
          hasOngoingTreatment,
          hasInvoice,
          hasPayment,
          isPaid,
        }),
      };
    },
  });

  const getNextActions = (stage: string, data: any) => {
    const actions = [];
    
    if (!data.hasAppointment) {
      actions.push({ label: 'حجز موعد', action: 'book_appointment', icon: Calendar });
    }
    if (data.hasAppointment && !data.hasCompletedAppointment) {
      actions.push({ label: 'إكمال الموعد', action: 'complete_appointment', icon: CheckCircle });
    }
    if (data.hasCompletedAppointment && !data.hasTreatmentPlan) {
      actions.push({ label: 'إنشاء خطة علاج', action: 'create_treatment_plan', icon: FileText });
    }
    if (data.hasTreatmentPlan && !data.hasInvoice) {
      actions.push({ label: 'إنشاء فاتورة', action: 'create_invoice', icon: DollarSign });
    }
    if (data.hasInvoice && !data.hasPayment) {
      actions.push({ label: 'تسجيل دفعة', action: 'record_payment', icon: DollarSign });
    }
    if (data.hasTreatmentPlan && !data.hasOngoingTreatment) {
      actions.push({ label: 'بدء العلاج', action: 'start_treatment', icon: Activity });
    }
    
    return actions;
  };

  const stages = [
    { id: 'appointment_booking', label: 'حجز الموعد', icon: Calendar, color: 'blue' },
    { id: 'diagnosis', label: 'الكشف والتشخيص', icon: Activity, color: 'purple' },
    { id: 'treatment_planning', label: 'خطة العلاج', icon: FileText, color: 'indigo' },
    { id: 'treatment_execution', label: 'تنفيذ العلاج', icon: Activity, color: 'green' },
    { id: 'invoicing', label: 'إصدار الفاتورة', icon: DollarSign, color: 'yellow' },
    { id: 'payment', label: 'الدفع', icon: DollarSign, color: 'orange' },
    { id: 'completed', label: 'مكتمل', icon: CheckCircle, color: 'emerald' },
  ];

  if (isLoading) {
    return <div className="text-center py-8">جاري التحميل...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Progress Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            مسار المريض
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>نسبة الإنجاز</span>
              <span className="font-bold">{workflowStatus?.progress.toFixed(0)}%</span>
            </div>
            <Progress value={workflowStatus?.progress} className="h-3" />
          </div>

          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Clock className="h-4 w-4" />
            المرحلة الحالية: 
            <Badge variant="outline">
              {stages.find(s => s.id === workflowStatus?.currentStage)?.label}
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Workflow Stages */}
      <Card>
        <CardHeader>
          <CardTitle>مراحل العلاج</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {stages.map((stage, index) => {
              const isActive = workflowStatus?.currentStage === stage.id;
              const isPassed = stages.findIndex(s => s.id === workflowStatus?.currentStage) > index;
              const StageIcon = stage.icon;

              return (
                <div key={stage.id} className="flex items-center gap-4">
                  <div className={`
                    p-3 rounded-full flex items-center justify-center
                    ${isPassed ? `bg-${stage.color}-500 text-white` : 
                      isActive ? `bg-${stage.color}-100 text-${stage.color}-600 border-2 border-${stage.color}-500` : 
                      'bg-gray-100 text-gray-400'}
                  `}>
                    <StageIcon className="h-5 w-5" />
                  </div>
                  
                  <div className="flex-1">
                    <div className="font-medium">{stage.label}</div>
                    {isActive && (
                      <div className="text-sm text-muted-foreground flex items-center gap-1">
                        <AlertCircle className="h-3 w-3" />
                        المرحلة الحالية
                      </div>
                    )}
                  </div>

                  {isPassed && (
                    <CheckCircle className="h-5 w-5 text-green-500" />
                  )}
                  
                  {index < stages.length - 1 && (
                    <ArrowRight className="h-4 w-4 text-muted-foreground" />
                  )}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Next Actions */}
      {workflowStatus?.nextActions && workflowStatus.nextActions.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>الإجراءات التالية المقترحة</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {workflowStatus.nextActions.map((action: any, index: number) => {
              const ActionIcon = action.icon;
              return (
                <Button
                  key={index}
                  variant="outline"
                  className="w-full justify-start"
                  onClick={() => {
                    // هنا يمكن إضافة منطق التوجيه للصفحة المناسبة
                    console.log('Action:', action.action);
                  }}
                >
                  <ActionIcon className="h-4 w-4 mr-2" />
                  {action.label}
                </Button>
              );
            })}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
