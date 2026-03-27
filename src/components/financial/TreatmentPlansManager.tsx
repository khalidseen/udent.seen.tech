import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FileText, User, Calendar, DollarSign, Stethoscope, Plus, Filter } from "lucide-react";
import { format } from "date-fns";
import { ar } from "date-fns/locale";
import { CurrencyAmount } from "@/components/ui/currency-display";
import { useNavigate } from "react-router-dom";
import { PermissionGuard } from "@/components/auth/PermissionGuard";
import { CreateInvoiceDialog } from "./CreateInvoiceDialog";
import { toast } from "sonner";

export function TreatmentPlansManager() {
  const navigate = useNavigate();
  const [statusFilter, setStatusFilter] = useState("all");
  const [showInvoiceDialog, setShowInvoiceDialog] = useState(false);
  const [selectedPatientId, setSelectedPatientId] = useState<string | undefined>();

  const { data: treatmentData, isLoading } = useQuery({
    queryKey: ['treatment-plans-financial'],
    queryFn: async () => {
      const { data: profile } = await supabase.rpc('get_current_user_profile');
      if (!profile) throw new Error('Profile not found');

      const { data: treatments, error } = await supabase
        .from('dental_treatments')
        .select(`*, patients!inner (full_name)`)
        .eq('clinic_id', profile.id)
        .order('created_at', { ascending: false });
      if (error) throw error;

      const treatmentIds = treatments?.map(t => t.id) || [];
      const { data: invoices } = await supabase
        .from('invoices')
        .select('treatment_plan_id, total_amount, paid_amount, balance_due, status')
        .in('treatment_plan_id', treatmentIds.length > 0 ? treatmentIds : ['none']);

      const invoiceMap = new Map<string, { total: number; paid: number; balance: number; status: string }>();
      invoices?.forEach(inv => {
        if (!inv.treatment_plan_id) return;
        const existing = invoiceMap.get(inv.treatment_plan_id) || { total: 0, paid: 0, balance: 0, status: 'pending' };
        existing.total += Number(inv.total_amount || 0);
        existing.paid += Number(inv.paid_amount || 0);
        existing.balance += Number(inv.balance_due || 0);
        if (inv.status === 'paid') existing.status = 'paid';
        invoiceMap.set(inv.treatment_plan_id, existing);
      });

      return {
        treatments: treatments?.map(t => ({
          ...t,
          financial: invoiceMap.get(t.id) || null,
          paymentProgress: invoiceMap.has(t.id) 
            ? (invoiceMap.get(t.id)!.total > 0 ? (invoiceMap.get(t.id)!.paid / invoiceMap.get(t.id)!.total) * 100 : 0)
            : null,
        })) || [],
        stats: {
          total: treatments?.length || 0,
          planned: treatments?.filter(t => t.status === 'planned').length || 0,
          inProgress: treatments?.filter(t => t.status === 'in_progress').length || 0,
          completed: treatments?.filter(t => t.status === 'completed').length || 0,
          totalCost: Array.from(invoiceMap.values()).reduce((s, v) => s + v.total, 0),
          totalPaid: Array.from(invoiceMap.values()).reduce((s, v) => s + v.paid, 0),
          totalBalance: Array.from(invoiceMap.values()).reduce((s, v) => s + v.balance, 0),
          withInvoice: invoiceMap.size,
          withoutInvoice: (treatments?.length || 0) - invoiceMap.size,
        }
      };
    },
  });

  const filteredTreatments = treatmentData?.treatments.filter(t => {
    if (statusFilter === 'all') return true;
    if (statusFilter === 'no_invoice') return !t.financial;
    return t.status === statusFilter;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'planned': return 'bg-blue-500/10 text-blue-600 border-blue-200';
      case 'in_progress': return 'bg-warning/10 text-warning border-warning/20';
      case 'completed': return 'bg-success/10 text-success border-success/20';
      case 'cancelled': return 'bg-muted text-muted-foreground border-border';
      default: return 'bg-muted text-muted-foreground border-border';
    }
  };

  const getStatusText = (status: string) => {
    const map: Record<string, string> = { planned: 'مخطط', in_progress: 'قيد التنفيذ', completed: 'مكتمل', cancelled: 'ملغي' };
    return map[status] || status;
  };

  const handleCreateInvoice = (patientId: string) => {
    setSelectedPatientId(patientId);
    setShowInvoiceDialog(true);
  };

  if (isLoading) {
    return <div className="flex items-center justify-center h-48"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div>;
  }

  return (
    <PermissionGuard requiredPermissions={['financial.view', 'financial.manage', 'treatments.view', 'dental_treatments.view']}>
      <div className="space-y-6">
        {/* Stats */}
        <div className="grid gap-4 md:grid-cols-5">
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm font-medium flex items-center gap-2"><Stethoscope className="h-4 w-4" />إجمالي الخطط</CardTitle></CardHeader>
            <CardContent><div className="text-2xl font-bold">{treatmentData?.stats.total}</div></CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">قيد التنفيذ</CardTitle></CardHeader>
            <CardContent><div className="text-2xl font-bold text-warning">{(treatmentData?.stats.planned || 0) + (treatmentData?.stats.inProgress || 0)}</div></CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm font-medium flex items-center gap-2"><DollarSign className="h-4 w-4 text-success" />التكلفة</CardTitle></CardHeader>
            <CardContent><div className="text-2xl font-bold"><CurrencyAmount amount={treatmentData?.stats.totalCost || 0} /></div></CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">المدفوع</CardTitle></CardHeader>
            <CardContent><div className="text-2xl font-bold text-success"><CurrencyAmount amount={treatmentData?.stats.totalPaid || 0} /></div></CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">بدون فاتورة</CardTitle></CardHeader>
            <CardContent><div className="text-2xl font-bold text-orange-600">{treatmentData?.stats.withoutInvoice}</div></CardContent>
          </Card>
        </div>

        {/* Filters & Links */}
        <div className="flex gap-2 flex-wrap items-center">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-44">
              <Filter className="h-4 w-4 ml-1" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">جميع الحالات</SelectItem>
              <SelectItem value="planned">مخطط</SelectItem>
              <SelectItem value="in_progress">قيد التنفيذ</SelectItem>
              <SelectItem value="completed">مكتمل</SelectItem>
              <SelectItem value="no_invoice">بدون فاتورة</SelectItem>
            </SelectContent>
          </Select>
          <div className="flex-1" />
          <Button variant="outline" size="sm" onClick={() => navigate('/dental-treatments-management')}>
            <Stethoscope className="ml-1 h-4 w-4" /> العلاجات
          </Button>
          <Button variant="outline" size="sm" onClick={() => navigate('/invoice-management')}>
            <FileText className="ml-1 h-4 w-4" /> الفواتير
          </Button>
        </div>

        {/* Treatment Plans List */}
        {!filteredTreatments || filteredTreatments.length === 0 ? (
          <Card>
            <CardContent className="pt-6 text-center">
              <p className="text-muted-foreground">لا توجد خطط علاج مطابقة.</p>
              <Button className="mt-4" onClick={() => navigate('/dental-treatments-management')}>
                الذهاب للعلاجات السنية
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {filteredTreatments.map((plan: any) => (
              <Card key={plan.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between gap-4">
                    <div className="space-y-2 flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <Badge className={getStatusColor(plan.status)}>{getStatusText(plan.status)}</Badge>
                        <span className="text-xs text-muted-foreground">سن: {plan.tooth_number}</span>
                      </div>
                      <button onClick={() => navigate(`/patients/${plan.patient_id}`)} className="text-sm text-primary hover:underline flex items-center gap-1">
                        <User className="h-3 w-3" /> {plan.patients?.full_name}
                      </button>
                      <p className="text-sm"><strong>التشخيص:</strong> {plan.diagnosis}</p>
                      <p className="text-sm truncate"><strong>الخطة:</strong> {plan.treatment_plan}</p>
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Calendar className="h-3 w-3" />
                        {format(new Date(plan.treatment_date), 'PPP', { locale: ar })}
                      </div>

                      {/* Payment Progress */}
                      {plan.financial && (
                        <div className="mt-2 space-y-1">
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-muted-foreground">تقدم السداد</span>
                            <span className="font-medium">{(plan.paymentProgress || 0).toFixed(0)}%</span>
                          </div>
                          <Progress value={plan.paymentProgress || 0} className="h-2" />
                        </div>
                      )}
                    </div>
                    <div className="text-left shrink-0 space-y-2">
                      {plan.financial ? (
                        <>
                          <p className="text-sm text-muted-foreground">التكلفة</p>
                          <p className="font-bold"><CurrencyAmount amount={plan.financial.total} /></p>
                          {plan.financial.balance > 0 && (
                            <p className="text-xs text-destructive">متبقي: <CurrencyAmount amount={plan.financial.balance} /></p>
                          )}
                        </>
                      ) : (
                        <Button size="sm" variant="outline" onClick={() => handleCreateInvoice(plan.patient_id)}>
                          <Plus className="h-3 w-3 ml-1" /> إنشاء فاتورة
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        <CreateInvoiceDialog
          open={showInvoiceDialog}
          onOpenChange={setShowInvoiceDialog}
          preselectedPatientId={selectedPatientId}
        />
      </div>
    </PermissionGuard>
  );
}
