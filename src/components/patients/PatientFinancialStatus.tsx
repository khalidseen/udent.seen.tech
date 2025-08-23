import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Plus, DollarSign, FileText, Send, Download } from "lucide-react";
import { format } from "date-fns";
import { ar } from "date-fns/locale";

interface PatientFinancialStatusProps {
  patientId: string;
  patientName: string;
}

interface TreatmentPlan {
  id: string;
  title: string;
  description: string;
  estimated_cost: number;
  status: string;
  start_date: string;
  end_date: string;
  notes: string;
}

interface Payment {
  id: string;
  amount: number;
  payment_method: string;
  payment_date: string;
  status: string;
  reference_number: string;
  notes: string;
}

const PatientFinancialStatus = ({ patientId, patientName }: PatientFinancialStatusProps) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [addPlanDialog, setAddPlanDialog] = useState(false);
  const [addPaymentDialog, setAddPaymentDialog] = useState(false);

  const [newPlan, setNewPlan] = useState({
    title: "",
    description: "",
    estimated_cost: "",
    start_date: "",
    end_date: "",
    notes: ""
  });

  const [newPayment, setNewPayment] = useState({
    amount: "",
    payment_method: "cash",
    payment_date: new Date().toISOString().split('T')[0],
    reference_number: "",
    notes: ""
  });

  // Fetch treatment plans
  const { data: treatmentPlans = [], isLoading: plansLoading } = useQuery({
    queryKey: ["treatment-plans", patientId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("treatment_plans")
        .select("*")
        .eq("patient_id", patientId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as TreatmentPlan[];
    }
  });

  // Fetch payments
  const { data: payments = [], isLoading: paymentsLoading } = useQuery({
    queryKey: ["patient-payments", patientId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("payments")
        .select("*")
        .eq("patient_id", patientId)
        .order("payment_date", { ascending: false });

      if (error) throw error;
      return data as Payment[];
    }
  });

  // Calculate financial summary
  const totalCost = treatmentPlans.reduce((sum, plan) => sum + plan.estimated_cost, 0);
  const totalPaid = payments
    .filter(payment => payment.status === "completed")
    .reduce((sum, payment) => sum + payment.amount, 0);
  const remaining = totalCost - totalPaid;

  const handleAddPlan = async () => {
    try {
      const { data: profile } = await supabase
        .from("profiles")
        .select("id")
        .eq("user_id", (await supabase.auth.getUser()).data.user?.id)
        .single();

      if (!profile) throw new Error("Profile not found");

      const { error } = await supabase
        .from("treatment_plans")
        .insert({
          patient_id: patientId,
          clinic_id: profile.id,
          title: newPlan.title,
          description: newPlan.description,
          estimated_cost: parseFloat(newPlan.estimated_cost),
          start_date: newPlan.start_date || null,
          end_date: newPlan.end_date || null,
          notes: newPlan.notes
        });

      if (error) throw error;

      toast({ title: "تم إضافة خطة العلاج بنجاح" });
      setAddPlanDialog(false);
      setNewPlan({ title: "", description: "", estimated_cost: "", start_date: "", end_date: "", notes: "" });
      queryClient.invalidateQueries({ queryKey: ["treatment-plans", patientId] });
    } catch (error) {
      toast({
        title: "خطأ في إضافة خطة العلاج",
        description: error instanceof Error ? error.message : "حدث خطأ غير متوقع",
        variant: "destructive"
      });
    }
  };

  const handleAddPayment = async () => {
    try {
      const { data: profile } = await supabase
        .from("profiles")
        .select("id")
        .eq("user_id", (await supabase.auth.getUser()).data.user?.id)
        .single();

      if (!profile) throw new Error("Profile not found");

      const { error } = await supabase
        .from("payments")
        .insert({
          patient_id: patientId,
          clinic_id: profile.id,
          amount: parseFloat(newPayment.amount),
          payment_method: newPayment.payment_method,
          payment_date: newPayment.payment_date,
          reference_number: newPayment.reference_number,
          notes: newPayment.notes,
          status: "completed",
          invoice_id: null // Adding this to handle the required field
        });

      if (error) throw error;

      toast({ title: "تم إضافة الدفعة بنجاح" });
      setAddPaymentDialog(false);
      setNewPayment({
        amount: "",
        payment_method: "cash",
        payment_date: new Date().toISOString().split('T')[0],
        reference_number: "",
        notes: ""
      });
      queryClient.invalidateQueries({ queryKey: ["patient-payments", patientId] });
    } catch (error) {
      toast({
        title: "خطأ في إضافة الدفعة",
        description: error instanceof Error ? error.message : "حدث خطأ غير متوقع",
        variant: "destructive"
      });
    }
  };

  const generateWhatsAppReminder = () => {
    const message = `السلام عليكم ${patientName}،

هذا تذكير بالمبلغ المتبقي عليك:
💰 إجمالي التكلفة: ${totalCost.toLocaleString()} ريال
✅ المدفوع: ${totalPaid.toLocaleString()} ريال  
⏰ المتبقي: ${remaining.toLocaleString()} ريال

يرجى التواصل معنا لتحديد موعد الدفع.
شكراً لك 🙏`;

    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
  };

  if (plansLoading || paymentsLoading) {
    return <div className="text-center p-8">جاري التحميل...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Financial Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="border-2 border-orange-200 bg-orange-50 dark:bg-orange-950">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-orange-600">إجمالي التكلفة</p>
                <p className="text-2xl font-bold text-orange-700">{totalCost.toLocaleString()} ريال</p>
              </div>
              <DollarSign className="h-8 w-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-2 border-green-200 bg-green-50 dark:bg-green-950">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-green-600">المدفوع</p>
                <p className="text-2xl font-bold text-green-700">{totalPaid.toLocaleString()} ريال</p>
              </div>
              <DollarSign className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-2 border-red-200 bg-red-50 dark:bg-red-950">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-red-600">المتبقي</p>
                <p className="text-2xl font-bold text-red-700">{remaining.toLocaleString()} ريال</p>
              </div>
              <DollarSign className="h-8 w-8 text-red-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-wrap gap-3">
        <Dialog open={addPlanDialog} onOpenChange={setAddPlanDialog}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 ml-1" />
              إضافة خطة علاج
            </Button>
          </DialogTrigger>
        </Dialog>

        <Dialog open={addPaymentDialog} onOpenChange={setAddPaymentDialog}>
          <DialogTrigger asChild>
            <Button variant="outline">
              <Plus className="w-4 h-4 ml-1" />
              إضافة دفعة
            </Button>
          </DialogTrigger>
        </Dialog>

        {remaining > 0 && (
          <Button variant="outline" onClick={generateWhatsAppReminder}>
            <Send className="w-4 h-4 ml-1" />
            تذكير واتساب
          </Button>
        )}

        <Button variant="outline">
          <Download className="w-4 h-4 ml-1" />
          كشف حساب PDF
        </Button>
      </div>

      {/* Details Tabs */}
      <Tabs defaultValue="plans" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="plans">خطط العلاج</TabsTrigger>
          <TabsTrigger value="payments">الدفعات</TabsTrigger>
        </TabsList>

        <TabsContent value="plans" className="space-y-4">
          {treatmentPlans.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center text-muted-foreground">
                لا توجد خطط علاج مسجلة
              </CardContent>
            </Card>
          ) : (
            treatmentPlans.map((plan) => (
              <Card key={plan.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">{plan.title}</CardTitle>
                    <Badge variant={plan.status === 'completed' ? 'default' : 'secondary'}>
                      {plan.status === 'completed' ? 'مكتملة' : 
                       plan.status === 'active' ? 'نشطة' : 'مخططة'}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <p><strong>التكلفة المتوقعة:</strong> {plan.estimated_cost.toLocaleString()} ريال</p>
                    {plan.description && <p><strong>الوصف:</strong> {plan.description}</p>}
                    {plan.start_date && (
                      <p><strong>تاريخ البداية:</strong> {format(new Date(plan.start_date), 'yyyy/MM/dd', { locale: ar })}</p>
                    )}
                    {plan.end_date && (
                      <p><strong>تاريخ النهاية:</strong> {format(new Date(plan.end_date), 'yyyy/MM/dd', { locale: ar })}</p>
                    )}
                    {plan.notes && <p><strong>ملاحظات:</strong> {plan.notes}</p>}
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>

        <TabsContent value="payments" className="space-y-4">
          {payments.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center text-muted-foreground">
                لا توجد دفعات مسجلة
              </CardContent>
            </Card>
          ) : (
            payments.map((payment) => (
              <Card key={payment.id}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <p className="font-medium">{payment.amount.toLocaleString()} ريال</p>
                      <p className="text-sm text-muted-foreground">
                        {format(new Date(payment.payment_date), 'yyyy/MM/dd', { locale: ar })}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {payment.payment_method === 'cash' ? 'نقدي' : 
                         payment.payment_method === 'card' ? 'بطاقة' : 
                         payment.payment_method === 'bank_transfer' ? 'تحويل بنكي' : payment.payment_method}
                      </p>
                    </div>
                    <Badge variant={payment.status === 'completed' ? 'default' : 'secondary'}>
                      {payment.status === 'completed' ? 'مكتملة' : 'معلقة'}
                    </Badge>
                  </div>
                  {payment.reference_number && (
                    <p className="text-sm text-muted-foreground mt-2">
                      رقم المرجع: {payment.reference_number}
                    </p>
                  )}
                  {payment.notes && (
                    <p className="text-sm mt-2">{payment.notes}</p>
                  )}
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>
      </Tabs>

      {/* Add Plan Dialog */}
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>إضافة خطة علاج جديدة</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label htmlFor="title">عنوان الخطة</Label>
            <Input
              id="title"
              value={newPlan.title}
              onChange={(e) => setNewPlan({ ...newPlan, title: e.target.value })}
            />
          </div>
          <div>
            <Label htmlFor="description">الوصف</Label>
            <Textarea
              id="description"
              value={newPlan.description}
              onChange={(e) => setNewPlan({ ...newPlan, description: e.target.value })}
            />
          </div>
          <div>
            <Label htmlFor="cost">التكلفة المتوقعة (ريال)</Label>
            <Input
              id="cost"
              type="number"
              value={newPlan.estimated_cost}
              onChange={(e) => setNewPlan({ ...newPlan, estimated_cost: e.target.value })}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="start_date">تاريخ البداية</Label>
              <Input
                id="start_date"
                type="date"
                value={newPlan.start_date}
                onChange={(e) => setNewPlan({ ...newPlan, start_date: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="end_date">تاريخ النهاية</Label>
              <Input
                id="end_date"
                type="date"
                value={newPlan.end_date}
                onChange={(e) => setNewPlan({ ...newPlan, end_date: e.target.value })}
              />
            </div>
          </div>
          <div>
            <Label htmlFor="notes">ملاحظات</Label>
            <Textarea
              id="notes"
              value={newPlan.notes}
              onChange={(e) => setNewPlan({ ...newPlan, notes: e.target.value })}
            />
          </div>
          <div className="flex justify-end space-x-2 space-x-reverse">
            <Button variant="outline" onClick={() => setAddPlanDialog(false)}>
              إلغاء
            </Button>
            <Button onClick={handleAddPlan} disabled={!newPlan.title || !newPlan.estimated_cost}>
              إضافة
            </Button>
          </div>
        </div>
      </DialogContent>

      {/* Add Payment Dialog */}
      <Dialog open={addPaymentDialog} onOpenChange={setAddPaymentDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>إضافة دفعة جديدة</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="amount">المبلغ (ريال)</Label>
              <Input
                id="amount"
                type="number"
                value={newPayment.amount}
                onChange={(e) => setNewPayment({ ...newPayment, amount: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="payment_method">طريقة الدفع</Label>
              <Select
                value={newPayment.payment_method}
                onValueChange={(value) => setNewPayment({ ...newPayment, payment_method: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="cash">نقدي</SelectItem>
                  <SelectItem value="card">بطاقة</SelectItem>
                  <SelectItem value="bank_transfer">تحويل بنكي</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="payment_date">تاريخ الدفع</Label>
              <Input
                id="payment_date"
                type="date"
                value={newPayment.payment_date}
                onChange={(e) => setNewPayment({ ...newPayment, payment_date: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="reference">رقم المرجع</Label>
              <Input
                id="reference"
                value={newPayment.reference_number}
                onChange={(e) => setNewPayment({ ...newPayment, reference_number: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="payment_notes">ملاحظات</Label>
              <Textarea
                id="payment_notes"
                value={newPayment.notes}
                onChange={(e) => setNewPayment({ ...newPayment, notes: e.target.value })}
              />
            </div>
            <div className="flex justify-end space-x-2 space-x-reverse">
              <Button variant="outline" onClick={() => setAddPaymentDialog(false)}>
                إلغاء
              </Button>
              <Button onClick={handleAddPayment} disabled={!newPayment.amount}>
                إضافة
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default PatientFinancialStatus;