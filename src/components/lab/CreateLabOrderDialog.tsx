import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

interface Props {
  open: boolean;
  onClose: () => void;
  clinicId: string;
  labs: any[];
}

export function CreateLabOrderDialog({ open, onClose, clinicId, labs }: Props) {
  const queryClient = useQueryClient();
  const [form, setForm] = useState({
    lab_id: '', patient_id: '', doctor_id: '', order_type: 'crown',
    tooth_number: '', shade: '', material: '', priority: 'normal',
    estimated_delivery: '', cost: '', notes: '', special_instructions: ''
  });

  const { data: patients = [] } = useQuery({
    queryKey: ['patients-lab', clinicId],
    queryFn: async () => {
      const { data } = await supabase.from('patients').select('id, full_name').eq('clinic_id', clinicId).eq('patient_status', 'active').order('full_name');
      return data || [];
    },
    enabled: !!clinicId
  });

  const { data: doctors = [] } = useQuery({
    queryKey: ['doctors-lab', clinicId],
    queryFn: async () => {
      const { data } = await supabase.from('doctors').select('id, full_name').eq('clinic_id', clinicId).eq('status', 'active').order('full_name');
      return data || [];
    },
    enabled: !!clinicId
  });

  const createMutation = useMutation({
    mutationFn: async () => {
      const { data: orderNum } = await supabase.rpc('generate_lab_order_number', { clinic_id_param: clinicId });
      const { error } = await supabase.from('lab_orders').insert({
        clinic_id: clinicId,
        order_number: orderNum,
        lab_id: form.lab_id || null,
        patient_id: form.patient_id,
        doctor_id: form.doctor_id || null,
        order_type: form.order_type,
        tooth_number: form.tooth_number || null,
        shade: form.shade || null,
        material: form.material || null,
        priority: form.priority,
        estimated_delivery: form.estimated_delivery || null,
        cost: form.cost ? parseFloat(form.cost) : 0,
        notes: form.notes || null,
        special_instructions: form.special_instructions || null,
        status: 'pending'
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lab-orders'] });
      toast.success('تم إنشاء طلب المختبر بنجاح');
      onClose();
    },
    onError: () => toast.error('فشل في إنشاء الطلب')
  });

  const update = (key: string, val: string) => setForm(p => ({ ...p, [key]: val }));

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto" dir="rtl">
        <DialogHeader>
          <DialogTitle>طلب مختبر جديد</DialogTitle>
        </DialogHeader>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label>المريض *</Label>
            <Select value={form.patient_id} onValueChange={v => update('patient_id', v)}>
              <SelectTrigger><SelectValue placeholder="اختر المريض" /></SelectTrigger>
              <SelectContent>
                {patients.map((p: any) => <SelectItem key={p.id} value={p.id}>{p.full_name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>الطبيب</Label>
            <Select value={form.doctor_id} onValueChange={v => update('doctor_id', v)}>
              <SelectTrigger><SelectValue placeholder="اختر الطبيب" /></SelectTrigger>
              <SelectContent>
                {doctors.map((d: any) => <SelectItem key={d.id} value={d.id}>{d.full_name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>المختبر</Label>
            <Select value={form.lab_id} onValueChange={v => update('lab_id', v)}>
              <SelectTrigger><SelectValue placeholder="اختر المختبر" /></SelectTrigger>
              <SelectContent>
                {labs.map((l: any) => <SelectItem key={l.id} value={l.id}>{l.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>نوع الطلب *</Label>
            <Select value={form.order_type} onValueChange={v => update('order_type', v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="crown">تاج</SelectItem>
                <SelectItem value="bridge">جسر</SelectItem>
                <SelectItem value="veneer">قشرة</SelectItem>
                <SelectItem value="denture">طقم أسنان</SelectItem>
                <SelectItem value="implant_abutment">دعامة زرع</SelectItem>
                <SelectItem value="orthodontic">تقويم</SelectItem>
                <SelectItem value="night_guard">واقي ليلي</SelectItem>
                <SelectItem value="retainer">مثبت</SelectItem>
                <SelectItem value="other">أخرى</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>رقم السن</Label>
            <Input value={form.tooth_number} onChange={e => update('tooth_number', e.target.value)} placeholder="مثال: 11, 21" />
          </div>
          <div>
            <Label>اللون (Shade)</Label>
            <Select value={form.shade} onValueChange={v => update('shade', v)}>
              <SelectTrigger><SelectValue placeholder="اختر اللون" /></SelectTrigger>
              <SelectContent>
                {['A1','A2','A3','A3.5','A4','B1','B2','B3','B4','C1','C2','C3','C4','D2','D3','D4'].map(s => (
                  <SelectItem key={s} value={s}>{s}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>المادة</Label>
            <Select value={form.material} onValueChange={v => update('material', v)}>
              <SelectTrigger><SelectValue placeholder="اختر المادة" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="zirconia">زيركونيا</SelectItem>
                <SelectItem value="emax">E-Max</SelectItem>
                <SelectItem value="pfm">PFM</SelectItem>
                <SelectItem value="full_metal">معدن كامل</SelectItem>
                <SelectItem value="acrylic">أكريليك</SelectItem>
                <SelectItem value="composite">كومبوزيت</SelectItem>
                <SelectItem value="titanium">تيتانيوم</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>الأولوية</Label>
            <Select value={form.priority} onValueChange={v => update('priority', v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="normal">عادي</SelectItem>
                <SelectItem value="urgent">عاجل</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>تاريخ التسليم المتوقع</Label>
            <Input type="date" value={form.estimated_delivery} onChange={e => update('estimated_delivery', e.target.value)} />
          </div>
          <div>
            <Label>التكلفة</Label>
            <Input type="number" value={form.cost} onChange={e => update('cost', e.target.value)} placeholder="0" />
          </div>
          <div className="col-span-2">
            <Label>ملاحظات</Label>
            <Textarea value={form.notes} onChange={e => update('notes', e.target.value)} rows={2} />
          </div>
          <div className="col-span-2">
            <Label>تعليمات خاصة للمختبر</Label>
            <Textarea value={form.special_instructions} onChange={e => update('special_instructions', e.target.value)} rows={2} />
          </div>
        </div>
        <div className="flex justify-end gap-2 mt-4">
          <Button variant="outline" onClick={onClose}>إلغاء</Button>
          <Button onClick={() => createMutation.mutate()} disabled={!form.patient_id || createMutation.isPending}>
            {createMutation.isPending ? 'جاري الإنشاء...' : 'إنشاء الطلب'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
