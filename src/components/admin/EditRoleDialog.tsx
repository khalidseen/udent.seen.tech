import React, { useEffect, useMemo, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Save, Shield } from "lucide-react";

interface EditRoleDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  role: {
    role_name: string;
    description?: string | null;
    description_ar?: string | null;
    level: number;
    can_manage: string[];
    permissions: Record<string, Record<string, boolean>>;
  } | null;
  onSaved?: () => void;
}

export const EditRoleDialog = ({ open, onOpenChange, role, onSaved }: EditRoleDialogProps) => {
  const { toast } = useToast();
  const [state, setState] = useState({
    role_name: "",
    description: "",
    description_ar: "",
    level: 1,
    can_manage: [] as string[],
    permissions: {} as Record<string, Record<string, boolean>>,
  });

  useEffect(() => {
    if (role) {
      setState({
        role_name: role.role_name,
        description: role.description || "",
        description_ar: role.description_ar || "",
        level: role.level,
        can_manage: role.can_manage || [],
        permissions: role.permissions || {},
      });
    }
  }, [role]);

  const categories = useMemo(() => ([
    { key: 'patients', name: 'إدارة المرضى' },
    { key: 'appointments', name: 'إدارة المواعيد' },
    { key: 'medical_records', name: 'السجلات الطبية' },
    { key: 'financial', name: 'الإدارة المالية' },
    { key: 'inventory', name: 'إدارة المخزون' },
    { key: 'staff', name: 'إدارة الموظفين' },
    { key: 'reports', name: 'التقارير' },
    { key: 'settings', name: 'الإعدادات' },
  ]), []);

  const permissionsByCategory: Record<string, string[]> = {
    patients: ['view', 'create', 'edit', 'delete', 'export'],
    appointments: ['view', 'create', 'edit', 'delete', 'manage_schedule'],
    medical_records: ['view', 'create', 'edit', 'delete', 'view_sensitive'],
    financial: ['view', 'create_invoice', 'edit_invoice', 'delete_invoice', 'view_reports', 'manage_payments'],
    inventory: ['view', 'create', 'edit', 'delete', 'manage_orders'],
    staff: ['view', 'create', 'edit', 'delete', 'manage_roles'],
    reports: ['view', 'generate', 'export', 'financial_reports'],
    settings: ['view', 'edit_clinic', 'manage_permissions', 'system_settings'],
  };

  const updateRole = useMutation({
    mutationFn: async () => {
      if (!role) return;
      const { error } = await supabase
        .from('clinic_role_hierarchy')
        .update({
          description: state.description,
          description_ar: state.description_ar,
          level: state.level as any,
          can_manage: state.can_manage as any,
          permissions: state.permissions as any,
        })
        .eq('role_name', role.role_name as any);
      if (error) throw error;
    },
    onSuccess: () => {
      toast({ title: 'تم حفظ التعديلات', description: 'تم تحديث صلاحيات الدور بنجاح' });
      onSaved?.();
      onOpenChange(false);
    },
    onError: (err: any) => {
      toast({
        title: 'فشل حفظ التعديلات',
        description: err?.message || 'تحقق من صلاحيات الوصول وسياسات RLS',
        variant: 'destructive',
      });
    }
  });

  const togglePermission = (category: string, perm: string, value: boolean) => {
    setState(prev => ({
      ...prev,
      permissions: {
        ...prev.permissions,
        [category]: {
          ...prev.permissions?.[category],
          [perm]: value,
        }
      }
    }));
  };

  if (!role) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            تعديل صلاحيات الدور — {state.description_ar || state.role_name}
          </DialogTitle>
          <DialogDescription>
            قم بتحديث مستوى الدور وصلاحياته التي تنعكس على جميع المستخدمين المرتبطين به
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>بيانات الدور</CardTitle>
              <CardDescription>تحديث اسم العرض والمستوى</CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="role_ar">اسم العرض (عربي)</Label>
                <Input id="role_ar" value={state.description_ar} onChange={(e) => setState(s => ({ ...s, description_ar: e.target.value }))} />
              </div>
              <div>
                <Label htmlFor="role_desc">وصف مختصر</Label>
                <Input id="role_desc" value={state.description} onChange={(e) => setState(s => ({ ...s, description: e.target.value }))} />
              </div>
              <div className="md:col-span-2">
                <Label>مستوى الدور</Label>
                <Select value={state.level.toString()} onValueChange={(v) => setState(s => ({ ...s, level: parseInt(v) }))}>
                  <SelectTrigger><SelectValue placeholder="اختر المستوى" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">1 - أساسي</SelectItem>
                    <SelectItem value="2">2 - متوسط</SelectItem>
                    <SelectItem value="3">3 - متقدم</SelectItem>
                    <SelectItem value="4">4 - إداري</SelectItem>
                    <SelectItem value="5">5 - إدارة عليا</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>الصلاحيات</CardTitle>
              <CardDescription>فعّل أو عطّل الصلاحيات حسب الفئة</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {categories.map(cat => (
                <div key={cat.key} className="space-y-3">
                  <h4 className="font-medium text-primary">{cat.name}</h4>
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                    {permissionsByCategory[cat.key]?.map(perm => (
                      <div key={perm} className="flex items-center space-x-2 space-x-reverse">
                        <Switch
                          id={`${cat.key}-${perm}`}
                          checked={Boolean(state.permissions?.[cat.key]?.[perm])}
                          onCheckedChange={(val) => togglePermission(cat.key, perm, val)}
                        />
                        <Label htmlFor={`${cat.key}-${perm}`} className="text-sm">{perm}</Label>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        <div className="flex justify-end gap-2 pt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)}>إلغاء</Button>
          <Button onClick={() => updateRole.mutate()} disabled={updateRole.isPending}>
            <Save className="h-4 w-4 mr-2" />
            {updateRole.isPending ? 'جارِ الحفظ...' : 'حفظ التعديلات'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default EditRoleDialog;
