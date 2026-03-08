import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Plus, Trash2, Phone, Mail, MapPin } from "lucide-react";

interface Props {
  open: boolean;
  onClose: () => void;
  clinicId: string;
}

export function ManageLabsDialog({ open, onClose, clinicId }: Props) {
  const queryClient = useQueryClient();
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ name: '', phone: '', email: '', address: '', contact_person: '' });

  const { data: labs = [] } = useQuery({
    queryKey: ['dental-labs', clinicId],
    queryFn: async () => {
      const { data } = await supabase.from('dental_labs').select('*').eq('clinic_id', clinicId).order('name');
      return data || [];
    }
  });

  const addMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from('dental_labs').insert({
        clinic_id: clinicId, name: form.name, phone: form.phone || null,
        email: form.email || null, address: form.address || null, contact_person: form.contact_person || null
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dental-labs'] });
      toast.success('تمت إضافة المختبر');
      setShowAdd(false);
      setForm({ name: '', phone: '', email: '', address: '', contact_person: '' });
    }
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('dental_labs').update({ is_active: false }).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dental-labs'] });
      toast.success('تم حذف المختبر');
    }
  });

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto" dir="rtl">
        <DialogHeader>
          <DialogTitle>إدارة المختبرات</DialogTitle>
        </DialogHeader>

        <div className="space-y-3">
          {labs.map((lab: any) => (
            <Card key={lab.id}>
              <CardContent className="p-3 flex justify-between items-start">
                <div>
                  <p className="font-medium">{lab.name}</p>
                  <div className="flex flex-wrap gap-2 text-xs text-muted-foreground mt-1">
                    {lab.phone && <span className="flex items-center gap-1"><Phone className="w-3 h-3" />{lab.phone}</span>}
                    {lab.email && <span className="flex items-center gap-1"><Mail className="w-3 h-3" />{lab.email}</span>}
                    {lab.address && <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{lab.address}</span>}
                  </div>
                  {lab.contact_person && <p className="text-xs text-muted-foreground mt-1">جهة الاتصال: {lab.contact_person}</p>}
                </div>
                <Button variant="ghost" size="icon" onClick={() => deleteMutation.mutate(lab.id)}>
                  <Trash2 className="w-4 h-4 text-destructive" />
                </Button>
              </CardContent>
            </Card>
          ))}

          {showAdd ? (
            <Card>
              <CardContent className="p-4 space-y-3">
                <div><Label>اسم المختبر *</Label><Input value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} /></div>
                <div className="grid grid-cols-2 gap-2">
                  <div><Label>الهاتف</Label><Input value={form.phone} onChange={e => setForm(p => ({ ...p, phone: e.target.value }))} /></div>
                  <div><Label>البريد</Label><Input value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))} /></div>
                </div>
                <div><Label>العنوان</Label><Input value={form.address} onChange={e => setForm(p => ({ ...p, address: e.target.value }))} /></div>
                <div><Label>جهة الاتصال</Label><Input value={form.contact_person} onChange={e => setForm(p => ({ ...p, contact_person: e.target.value }))} /></div>
                <div className="flex gap-2">
                  <Button onClick={() => addMutation.mutate()} disabled={!form.name}>إضافة</Button>
                  <Button variant="outline" onClick={() => setShowAdd(false)}>إلغاء</Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Button variant="outline" className="w-full" onClick={() => setShowAdd(true)}>
              <Plus className="w-4 h-4 ml-2" />إضافة مختبر جديد
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
