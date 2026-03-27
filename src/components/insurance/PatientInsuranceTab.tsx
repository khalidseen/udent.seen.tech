import React, { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Users, Shield } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";

interface PatientInsuranceTabProps {
  preselectedPatientId?: string;
  autoOpenCreate?: boolean;
}

const PatientInsuranceTab = ({ preselectedPatientId, autoOpenCreate = false }: PatientInsuranceTabProps) => {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    patient_id: preselectedPatientId || '', insurance_company_id: '', policy_number: '',
    member_id: '', coverage_percentage: '0', max_annual_coverage: '', notes: ''
  });

  useEffect(() => {
    if (preselectedPatientId) {
      setForm((current) => ({ ...current, patient_id: preselectedPatientId }));
    }
  }, [preselectedPatientId]);

  useEffect(() => {
    if (autoOpenCreate) {
      setOpen(true);
    }
  }, [autoOpenCreate]);

  const { data: clinicId } = useQuery({
    queryKey: ['current-clinic-id'],
    queryFn: async () => {
      const { data: profile } = await supabase.from('profiles').select('id').eq('user_id', (await supabase.auth.getUser()).data.user?.id).single();
      return profile?.id || null;
    },
  });

  const { data: patientInsurance, isLoading } = useQuery({
    queryKey: ['patient-insurance', clinicId],
    queryFn: async () => {
      if (!clinicId) return [];
      const { data } = await supabase.from('patient_insurance').select('*, insurance_companies(name, name_ar), patients(full_name)').eq('clinic_id', clinicId).eq('is_active', true).order('created_at', { ascending: false });
      return data || [];
    },
    enabled: !!clinicId,
  });

  const { data: patients } = useQuery({
    queryKey: ['patients-list', clinicId],
    queryFn: async () => {
      if (!clinicId) return [];
      const { data } = await supabase.from('patients').select('id, full_name').eq('clinic_id', clinicId).eq('patient_status', 'active');
      return data || [];
    },
    enabled: !!clinicId,
  });

  const { data: companies } = useQuery({
    queryKey: ['insurance-companies-list', clinicId],
    queryFn: async () => {
      if (!clinicId) return [];
      const { data } = await supabase.from('insurance_companies').select('id, name, name_ar, default_coverage_percentage').eq('clinic_id', clinicId).eq('is_active', true);
      return data || [];
    },
    enabled: !!clinicId,
  });

  const saveMutation = useMutation({
    mutationFn: async (f: typeof form) => {
      const { error } = await supabase.from('patient_insurance').insert({
        clinic_id: clinicId!,
        patient_id: f.patient_id,
        insurance_company_id: f.insurance_company_id,
        policy_number: f.policy_number,
        member_id: f.member_id || null,
        coverage_percentage: parseFloat(f.coverage_percentage) || 0,
        max_annual_coverage: f.max_annual_coverage ? parseFloat(f.max_annual_coverage) : null,
        notes: f.notes || null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['patient-insurance'] });
      toast.success('تم ربط التأمين بالمريض');
      setForm({ patient_id: '', insurance_company_id: '', policy_number: '', member_id: '', coverage_percentage: '0', max_annual_coverage: '', notes: '' });
      setOpen(false);
    },
    onError: () => toast.error('حدث خطأ'),
  });

  const onCompanyChange = (companyId: string) => {
    const company = companies?.find(c => c.id === companyId);
    setForm({
      ...form,
      insurance_company_id: companyId,
      coverage_percentage: String(company?.default_coverage_percentage || 0),
    });
  };

  const visiblePatientInsurance = useMemo(() => {
    if (!preselectedPatientId) return patientInsurance || [];
    return (patientInsurance || []).filter((item: any) => item.patient_id === preselectedPatientId);
  }, [patientInsurance, preselectedPatientId]);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-xl font-bold">تأمين المرضى</h3>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button><Plus className="h-4 w-4 mr-2" />ربط تأمين بمريض</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>ربط تأمين بمريض</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>المريض *</Label>
                <Select value={form.patient_id} onValueChange={v => setForm({...form, patient_id: v})}>
                  <SelectTrigger><SelectValue placeholder="اختر المريض" /></SelectTrigger>
                  <SelectContent>{patients?.map(p => <SelectItem key={p.id} value={p.id}>{p.full_name}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div>
                <Label>شركة التأمين *</Label>
                <Select value={form.insurance_company_id} onValueChange={onCompanyChange}>
                  <SelectTrigger><SelectValue placeholder="اختر الشركة" /></SelectTrigger>
                  <SelectContent>{companies?.map(c => <SelectItem key={c.id} value={c.id}>{c.name_ar || c.name}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div><Label>رقم البوليصة *</Label><Input value={form.policy_number} onChange={e => setForm({...form, policy_number: e.target.value})} /></div>
                <div><Label>رقم العضوية</Label><Input value={form.member_id} onChange={e => setForm({...form, member_id: e.target.value})} /></div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div><Label>نسبة التغطية %</Label><Input type="number" value={form.coverage_percentage} onChange={e => setForm({...form, coverage_percentage: e.target.value})} /></div>
                <div><Label>الحد السنوي (د.ع)</Label><Input type="number" value={form.max_annual_coverage} onChange={e => setForm({...form, max_annual_coverage: e.target.value})} /></div>
              </div>
              <Button className="w-full" disabled={!form.patient_id || !form.insurance_company_id || !form.policy_number || saveMutation.isPending} onClick={() => saveMutation.mutate(form)}>
                {saveMutation.isPending ? 'جارٍ الحفظ...' : 'ربط التأمين'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <div className="space-y-3">{[1,2,3].map(i => <Skeleton key={i} className="h-20 w-full" />)}</div>
      ) : (visiblePatientInsurance?.length || 0) === 0 ? (
        <Card><CardContent className="p-12 text-center">
          <Users className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">لا يوجد تأمين مرتبط</h3>
          <p className="text-sm text-muted-foreground">اربط تأمين بمريض للبدء</p>
        </CardContent></Card>
      ) : (
        <div className="space-y-3">
          {visiblePatientInsurance?.map((pi: any) => (
            <Card key={pi.id}>
              <CardContent className="p-4 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <Shield className="h-8 w-8 text-primary" />
                  <div>
                    <p className="font-medium">{pi.patients?.full_name}</p>
                    <p className="text-sm text-muted-foreground">{pi.insurance_companies?.name_ar || pi.insurance_companies?.name}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-center">
                    <p className="text-sm text-muted-foreground">رقم البوليصة</p>
                    <p className="font-mono text-sm">{pi.policy_number}</p>
                  </div>
                  <Badge variant="outline" className="text-lg">{pi.coverage_percentage}%</Badge>
                  {pi.max_annual_coverage && (
                    <div className="text-center">
                      <p className="text-sm text-muted-foreground">الحد السنوي</p>
                      <p className="font-medium">{Number(pi.max_annual_coverage).toLocaleString()} د.ع</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default PatientInsuranceTab;
