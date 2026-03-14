import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
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

const stageStyles: Record<string, { passed: string; active: string }> = {
  blue: { passed: 'bg-blue-500 text-white', active: 'bg-blue-100 text-blue-600 border-2 border-blue-500' },
  purple: { passed: 'bg-purple-500 text-white', active: 'bg-purple-100 text-purple-600 border-2 border-purple-500' },
  indigo: { passed: 'bg-indigo-500 text-white', active: 'bg-indigo-100 text-indigo-600 border-2 border-indigo-500' },
  green: { passed: 'bg-green-500 text-white', active: 'bg-green-100 text-green-600 border-2 border-green-500' },
  yellow: { passed: 'bg-yellow-500 text-white', active: 'bg-yellow-100 text-yellow-600 border-2 border-yellow-500' },
  orange: { passed: 'bg-orange-500 text-white', active: 'bg-orange-100 text-orange-600 border-2 border-orange-500' },
  emerald: { passed: 'bg-emerald-500 text-white', active: 'bg-emerald-100 text-emerald-600 border-2 border-emerald-500' },
};

export function PatientWorkflowTracker({ patientId }: PatientWorkflowTrackerProps) {
  const navigate = useNavigate();

  const { data: workflowStatus, isLoading } = useQuery({
    queryKey: ['patient-workflow', patientId],
    queryFn: async () => {
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

      const hasAppointment = appointments.length > 0;
      const hasCompletedAppointment = appointments.some(a => a.status === 'completed');
      const hasTreatmentPlan = treatments.length > 0;
      const hasOngoingTreatment = treatments.some(t => t.status === 'in_progress');
      const hasCompletedTreatment = treatments.some(t => t.status === 'completed');
      const hasInvoice = invoices.length > 0;
      const hasPayment = payments.length > 0;
      const totalBalance = invoices.reduce((sum, inv) => sum + Number(inv.balance_due || 0), 0);
      const isPaid = totalBalance <= 0 && hasInvoice;

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
        nextActions: getNextActions({
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

  const getNextActions = (data: any) => {
    const actions: { label: string; action: string; icon: any }[] = [];
    
    if (!data.hasAppointment) {
      actions.push({ label: 'حجز موعد', action: 'book_appointment', icon: Calendar });
    }
    if (data.hasAppointment && !data.hasCompletedAppointment) {
      actions.push({ label: 'إدارة المواعيد', action: 'manage_appointments', icon: CheckCircle });
    }
    if (data.hasCompletedAppointment && !data.hasTreatmentPlan) {
      actions.push({ label: 'إنشاء خطة علاج', action: 'create_treatment_plan', icon: FileText });
    }
    if (data.hasTreatmentPlan && !data.hasOngoingTreatment) {
      actions.push({ label: 'بدء العلاج', action: 'start_treatment', icon: Activity });
    }
    if (data.hasTreatmentPlan && !data.hasInvoice) {
      actions.push({ label: 'إنشاء فاتورة', action: 'create_invoice', icon: DollarSign });
    }
    if (data.hasInvoice && !data.hasPayment) {
      actions.push({ label: 'تسجيل دفعة', action: 'record_payment', icon: DollarSign });
    }
    
    return actions;
  };

  const handleAction = (action: string) => {
    switch (action) {
      case 'book_appointment':
        navigate(`/appointments/new?patient=${patientId}`);
        break;
      case 'manage_appointments':
        navigate(`/patients/${patientId}?tab=appointments`);
        break;
      case 'create_treatment_plan':
        navigate(`/dental-treatments?patient=${patientId}`);
        break;
      case 'start_treatment':
        navigate(`/dental-treatments?patient=${patientId}`);
        break;
      case 'create_invoice':
        navigate(`/invoices?patient=${patientId}`);
        break;
      case 'record_payment':
        navigate(`/invoices?patient=${patientId}`);
        break;
      default:
        break;
    }
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
              const styles = stageStyles[stage.color] || stageStyles.blue;

              return (
                <div key={stage.id} className="flex items-center gap-4">
                  <div className={`
                    p-3 rounded-full flex items-center justify-center
                    ${isPassed ? styles.passed : isActive ? styles.active : 'bg-muted text-muted-foreground'}
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
                  onClick={() => handleAction(action.action)}
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
