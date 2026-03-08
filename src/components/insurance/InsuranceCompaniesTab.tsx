import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, Building2, Phone, Mail, Edit, Trash2 } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";

const InsuranceCompaniesTab = () => {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({
    name: '', name_ar: '', phone: '', email: '', address: '',
    contact_person: '', contract_number: '',
    default_coverage_percentage: '0', max_coverage_amount: '', notes: ''
  });

  const { data: companies, isLoading } = useQuery({
    queryKey: ['insurance-companies'],
    queryFn: async () => {
      const { data: profile } = await supabase.from('profiles').select('id').eq('user_id', (await supabase.auth.getUser()).data.user?.id).single();
      if (!profile) return [];
      const { data, error } = await supabase.from('insurance_companies').select('*').eq('clinic_id', profile.id).order('created_at', { ascending: false });
      if (error) throw error;
      return data || [];
    },
  });

  const saveMutation = useMutation({
    mutationFn: async (formData: typeof form) => {
      const { data: profile } = await supabase.from('profiles').select('id').eq('user_id', (await supabase.auth.getUser()).data.user?.id).single();
      if (!profile) throw new Error('No profile');

      const payload = {
        clinic_id: profile.id,
        name: formData.name,
        name_ar: formData.name_ar || null,
        phone: formData.phone || null,
        email: formData.email || null,
        address: formData.address || null,
        contact_person: formData.contact_person || null,
        contract_number: formData.contract_number || null,
        default_coverage_percentage: parseFloat(formData.default_coverage_percentage) || 0,
        max_coverage_amount: formData.max_coverage_amount ? parseFloat(formData.max_coverage_amount) : null,
        notes: formData.notes || null,
      };

      if (editingId) {
        const { error } = await supabase.from('insurance_companies').update(payload).eq('id', editingId);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('insurance_companies').insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['insurance-companies'] });
      toast.success(editingId ? 'تم تحديث الشركة' : 'تم إضافة الشركة');
      resetForm();
    },
    onError: () => toast.error('حدث خطأ'),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('insurance_companies').update({ is_active: false }).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['insurance-companies'] });
      toast.success('تم حذف الشركة');
    },
  });

  const resetForm = () => {
    setForm({ name: '', name_ar: '', phone: '', email: '', address: '', contact_person: '', contract_number: '', default_coverage_percentage: '0', max_coverage_amount: '', notes: '' });
    setEditingId(null);
    setOpen(false);
  };

  const startEdit = (company: any) => {
    setForm({
      name: company.name, name_ar: company.name_ar || '', phone: company.phone || '',
      email: company.email || '', address: company.address || '', contact_person: company.contact_person || '',
      contract_number: company.contract_number || '',
      default_coverage_percentage: String(company.default_coverage_percentage || 0),
      max_coverage_amount: company.max_coverage_amount ? String(company.max_coverage_amount) : '',
      notes: company.notes || '',
    });
    setEditingId(company.id);
    setOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-xl font-bold">شركات التأمين</h3>
        <Dialog open={open} onOpenChange={(v) => { if (!v) resetForm(); setOpen(v); }}>
          <DialogTrigger asChild>
            <Button><Plus className="h-4 w-4 mr-2" />إضافة شركة</Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>{editingId ? 'تعديل شركة التأمين' : 'إضافة شركة تأمين جديدة'}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div><Label>اسم الشركة *</Label><Input value={form.name} onChange={e => setForm({...form, name: e.target.value})} /></div>
                <div><Label>الاسم بالعربية</Label><Input value={form.name_ar} onChange={e => setForm({...form, name_ar: e.target.value})} /></div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div><Label>الهاتف</Label><Input value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} /></div>
                <div><Label>البريد الإلكتروني</Label><Input value={form.email} onChange={e => setForm({...form, email: e.target.value})} /></div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div><Label>جهة الاتصال</Label><Input value={form.contact_person} onChange={e => setForm({...form, contact_person: e.target.value})} /></div>
                <div><Label>رقم العقد</Label><Input value={form.contract_number} onChange={e => setForm({...form, contract_number: e.target.value})} /></div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div><Label>نسبة التغطية الافتراضية %</Label><Input type="number" value={form.default_coverage_percentage} onChange={e => setForm({...form, default_coverage_percentage: e.target.value})} /></div>
                <div><Label>الحد الأقصى للتغطية (د.ع)</Label><Input type="number" value={form.max_coverage_amount} onChange={e => setForm({...form, max_coverage_amount: e.target.value})} /></div>
              </div>
              <div><Label>العنوان</Label><Input value={form.address} onChange={e => setForm({...form, address: e.target.value})} /></div>
              <div><Label>ملاحظات</Label><Textarea value={form.notes} onChange={e => setForm({...form, notes: e.target.value})} /></div>
              <Button className="w-full" onClick={() => saveMutation.mutate(form)} disabled={!form.name || saveMutation.isPending}>
                {saveMutation.isPending ? 'جارٍ الحفظ...' : editingId ? 'تحديث' : 'إضافة'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1,2,3].map(i => <Card key={i}><CardContent className="p-6"><Skeleton className="h-24 w-full" /></CardContent></Card>)}
        </div>
      ) : (companies?.filter(c => c.is_active) || []).length === 0 ? (
        <Card><CardContent className="p-12 text-center">
          <Building2 className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">لا توجد شركات تأمين</h3>
          <p className="text-sm text-muted-foreground">أضف شركة تأمين للبدء</p>
        </CardContent></Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {companies?.filter(c => c.is_active).map(company => (
            <Card key={company.id}>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Building2 className="h-5 w-5 text-primary" />
                    <span className="text-base">{company.name_ar || company.name}</span>
                  </div>
                  <Badge variant="outline">{company.default_coverage_percentage}%</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                {company.phone && <div className="flex items-center gap-2 text-muted-foreground"><Phone className="h-3 w-3" />{company.phone}</div>}
                {company.email && <div className="flex items-center gap-2 text-muted-foreground"><Mail className="h-3 w-3" />{company.email}</div>}
                {company.max_coverage_amount && <div className="flex justify-between"><span className="text-muted-foreground">الحد الأقصى:</span><span className="font-medium">{Number(company.max_coverage_amount).toLocaleString()} د.ع</span></div>}
                {company.contract_number && <div className="flex justify-between"><span className="text-muted-foreground">رقم العقد:</span><span>{company.contract_number}</span></div>}
                <div className="flex gap-2 pt-2">
                  <Button size="sm" variant="outline" onClick={() => startEdit(company)}><Edit className="h-3 w-3 mr-1" />تعديل</Button>
                  <Button size="sm" variant="outline" className="text-destructive" onClick={() => deleteMutation.mutate(company.id)}><Trash2 className="h-3 w-3 mr-1" />حذف</Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default InsuranceCompaniesTab;
