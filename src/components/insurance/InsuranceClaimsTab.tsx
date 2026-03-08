import React, { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Plus, FileText, Clock, CheckCircle, XCircle, AlertCircle, DollarSign } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";

const statusMap: Record<string, { label: string; color: string; icon: any }> = {
  pending: { label: 'قيد الانتظار', color: 'bg-yellow-100 text-yellow-800', icon: Clock },
  submitted: { label: 'مُرسلة', color: 'bg-blue-100 text-blue-800', icon: AlertCircle },
  approved: { label: 'موافق عليها', color: 'bg-green-100 text-green-800', icon: CheckCircle },
  partially_approved: { label: 'موافقة جزئية', color: 'bg-orange-100 text-orange-800', icon: AlertCircle },
  rejected: { label: 'مرفوضة', color: 'bg-red-100 text-red-800', icon: XCircle },
  paid: { label: 'مدفوعة', color: 'bg-emerald-100 text-emerald-800', icon: DollarSign },
};

const InsuranceClaimsTab = () => {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    patient_insurance_id: '', claim_number: '', treatment_description: '',
    total_amount: '', covered_amount: '', patient_share: '', notes: ''
  });

  const { data: clinicId } = useQuery({
    queryKey: ['current-clinic-id'],
    queryFn: async () => {
      const { data: profile } = await supabase.from('profiles').select('id').eq('user_id', (await supabase.auth.getUser()).data.user?.id).single();
      return profile?.id || null;
    },
  });

  const { data: claims, isLoading } = useQuery({
    queryKey: ['insurance-claims', clinicId],
    queryFn: async () => {
      if (!clinicId) return [];
      const { data } = await supabase.from('insurance_claims')
        .select('*, patient_insurance(policy_number, coverage_percentage, insurance_companies(name, name_ar), patients(full_name))')
        .eq('clinic_id', clinicId).order('created_at', { ascending: false });
      return data || [];
    },
    enabled: !!clinicId,
  });

  const { data: patientInsurances } = useQuery({
    queryKey: ['patient-insurances-for-claims', clinicId],
    queryFn: async () => {
      if (!clinicId) return [];
      const { data } = await supabase.from('patient_insurance')
        .select('id, policy_number, coverage_percentage, patient_id, patients(full_name), insurance_companies(name, name_ar)')
        .eq('clinic_id', clinicId).eq('is_active', true);
      return data || [];
    },
    enabled: !!clinicId,
  });

  const saveMutation = useMutation({
    mutationFn: async (f: typeof form) => {
      const pi = patientInsurances?.find(p => p.id === f.patient_insurance_id) as any;
      if (!pi) throw new Error('لم يتم العثور على التأمين');
      const { error } = await supabase.from('insurance_claims').insert({
        clinic_id: clinicId!,
        patient_id: pi.patient_id,
        patient_insurance_id: f.patient_insurance_id,
        claim_number: f.claim_number,
        treatment_description: f.treatment_description || null,
        total_amount: parseFloat(f.total_amount) || 0,
        covered_amount: parseFloat(f.covered_amount) || 0,
        patient_share: parseFloat(f.patient_share) || 0,
        notes: f.notes || null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['insurance-claims'] });
      toast.success('تم إنشاء المطالبة');
      setForm({ patient_insurance_id: '', claim_number: '', treatment_description: '', total_amount: '', covered_amount: '', patient_share: '', notes: '' });
      setOpen(false);
    },
    onError: (e) => toast.error('حدث خطأ: ' + (e as Error).message),
  });

  const updateStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { error } = await supabase.from('insurance_claims').update({ status }).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['insurance-claims'] });
      toast.success('تم تحديث الحالة');
    },
  });

  const onInsuranceChange = (piId: string) => {
    const pi = patientInsurances?.find(p => p.id === piId) as any;
    const pct = pi?.coverage_percentage || 0;
    const total = parseFloat(form.total_amount) || 0;
    setForm({
      ...form,
      patient_insurance_id: piId,
      covered_amount: String(Math.round(total * pct / 100)),
      patient_share: String(Math.round(total * (100 - pct) / 100)),
    });
  };

  const onTotalChange = (val: string) => {
    const pi = patientInsurances?.find(p => p.id === form.patient_insurance_id) as any;
    const pct = pi?.coverage_percentage || 0;
    const total = parseFloat(val) || 0;
    setForm({
      ...form,
      total_amount: val,
      covered_amount: String(Math.round(total * pct / 100)),
      patient_share: String(Math.round(total * (100 - pct) / 100)),
    });
  };

  // Stats
  const totalClaims = claims?.length || 0;
  const pendingClaims = claims?.filter(c => c.status === 'pending' || c.status === 'submitted').length || 0;
  const approvedAmount = claims?.filter(c => c.status === 'approved' || c.status === 'paid').reduce((s, c) => s + Number(c.covered_amount || 0), 0) || 0;

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card><CardContent className="p-4 flex items-center justify-between">
          <div><p className="text-sm text-muted-foreground">إجمالي المطالبات</p><p className="text-2xl font-bold">{totalClaims}</p></div>
          <FileText className="h-8 w-8 text-primary" />
        </CardContent></Card>
        <Card><CardContent className="p-4 flex items-center justify-between">
          <div><p className="text-sm text-muted-foreground">قيد المعالجة</p><p className="text-2xl font-bold">{pendingClaims}</p></div>
          <Clock className="h-8 w-8 text-yellow-600" />
        </CardContent></Card>
        <Card><CardContent className="p-4 flex items-center justify-between">
          <div><p className="text-sm text-muted-foreground">المبالغ المعتمدة</p><p className="text-2xl font-bold">{approvedAmount.toLocaleString()} د.ع</p></div>
          <CheckCircle className="h-8 w-8 text-green-600" />
        </CardContent></Card>
      </div>

      <div className="flex justify-between items-center">
        <h3 className="text-xl font-bold">المطالبات</h3>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button><Plus className="h-4 w-4 mr-2" />مطالبة جديدة</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>إنشاء مطالبة تأمين</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>المريض المؤمّن *</Label>
                <Select value={form.patient_insurance_id} onValueChange={onInsuranceChange}>
                  <SelectTrigger><SelectValue placeholder="اختر" /></SelectTrigger>
                  <SelectContent>
                    {patientInsurances?.map((pi: any) => (
                      <SelectItem key={pi.id} value={pi.id}>
                        {pi.patients?.full_name} - {pi.insurance_companies?.name_ar || pi.insurance_companies?.name} ({pi.coverage_percentage}%)
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div><Label>رقم المطالبة *</Label><Input value={form.claim_number} onChange={e => setForm({...form, claim_number: e.target.value})} placeholder="CLM-001" /></div>
                <div><Label>المبلغ الإجمالي *</Label><Input type="number" value={form.total_amount} onChange={e => onTotalChange(e.target.value)} /></div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div><Label>حصة التأمين</Label><Input type="number" value={form.covered_amount} readOnly className="bg-muted" /></div>
                <div><Label>حصة المريض</Label><Input type="number" value={form.patient_share} readOnly className="bg-muted" /></div>
              </div>
              <div><Label>وصف العلاج</Label><Textarea value={form.treatment_description} onChange={e => setForm({...form, treatment_description: e.target.value})} /></div>
              <Button className="w-full" disabled={!form.patient_insurance_id || !form.claim_number || !form.total_amount || saveMutation.isPending} onClick={() => saveMutation.mutate(form)}>
                {saveMutation.isPending ? 'جارٍ الحفظ...' : 'إنشاء المطالبة'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <div className="space-y-3">{[1,2,3].map(i => <Skeleton key={i} className="h-20 w-full" />)}</div>
      ) : totalClaims === 0 ? (
        <Card><CardContent className="p-12 text-center">
          <FileText className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">لا توجد مطالبات</h3>
          <p className="text-sm text-muted-foreground">أنشئ مطالبة تأمين جديدة</p>
        </CardContent></Card>
      ) : (
        <div className="space-y-3">
          {claims?.map((claim: any) => {
            const st = statusMap[claim.status] || statusMap.pending;
            const StatusIcon = st.icon;
            return (
              <Card key={claim.id}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <StatusIcon className="h-6 w-6" />
                      <div>
                        <p className="font-medium">{claim.patient_insurance?.patients?.full_name}</p>
                        <p className="text-sm text-muted-foreground">
                          {claim.patient_insurance?.insurance_companies?.name_ar || claim.patient_insurance?.insurance_companies?.name} • {claim.claim_number}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-center">
                        <p className="text-xs text-muted-foreground">الإجمالي</p>
                        <p className="font-medium">{Number(claim.total_amount).toLocaleString()} د.ع</p>
                      </div>
                      <div className="text-center">
                        <p className="text-xs text-muted-foreground">التغطية</p>
                        <p className="font-medium text-green-600">{Number(claim.covered_amount).toLocaleString()} د.ع</p>
                      </div>
                      <Badge className={st.color}>{st.label}</Badge>
                      {claim.status === 'pending' && (
                        <Select onValueChange={(v) => updateStatus.mutate({ id: claim.id, status: v })}>
                          <SelectTrigger className="w-32"><SelectValue placeholder="تحديث" /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="submitted">إرسال</SelectItem>
                            <SelectItem value="approved">موافقة</SelectItem>
                            <SelectItem value="rejected">رفض</SelectItem>
                          </SelectContent>
                        </Select>
                      )}
                      {claim.status === 'submitted' && (
                        <Select onValueChange={(v) => updateStatus.mutate({ id: claim.id, status: v })}>
                          <SelectTrigger className="w-32"><SelectValue placeholder="تحديث" /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="approved">موافقة</SelectItem>
                            <SelectItem value="partially_approved">موافقة جزئية</SelectItem>
                            <SelectItem value="rejected">رفض</SelectItem>
                          </SelectContent>
                        </Select>
                      )}
                      {claim.status === 'approved' && (
                        <Button size="sm" variant="outline" onClick={() => updateStatus.mutate({ id: claim.id, status: 'paid' })}>تأكيد الدفع</Button>
                      )}
                    </div>
                  </div>
                  {claim.treatment_description && <p className="text-sm text-muted-foreground mt-2 pr-10">{claim.treatment_description}</p>}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default InsuranceClaimsTab;
