import React, { useEffect, useMemo, useState } from "react";
import { PageContainer } from "@/components/layout/PageContainer";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { UserCog, Plus, Edit, Shield } from "lucide-react";
import { CreateRoleDialog } from "@/components/admin/CreateRoleDialog";
import { SecuritySettingsDialog } from "@/components/admin/SecuritySettingsDialog";
import { useSubscriptionPermissions } from "@/hooks/useSubscriptionPermissions";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { EditRoleDialog } from "@/components/admin/EditRoleDialog";

interface RoleRow {
  role_name: string;
  description: string | null;
  description_ar: string | null;
  level: number;
  can_manage: string[];
  permissions: Record<string, Record<string, boolean>>;
}

const AdvancedPermissionsManagement = () => {
  const [openCreate, setOpenCreate] = useState(false);
  const [openSecurity, setOpenSecurity] = useState(false);
  const [openEdit, setOpenEdit] = useState(false);
  const [roles, setRoles] = useState<RoleRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRole, setSelectedRole] = useState<RoleRow | null>(null);
  const { checkPlanPermission, loading: planLoading } = useSubscriptionPermissions();
  const { toast } = useToast();

  const fetchRoles = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('clinic_role_hierarchy')
      .select('*')
      .order('level', { ascending: true });
    if (error) {
      console.error(error);
    } else {
      setRoles((data as any) || []);
    }
    setLoading(false);
  };

  useEffect(() => { fetchRoles(); }, []);

  const permCount = (permObj: RoleRow['permissions']) => {
    try {
      return Object.values(permObj || {}).reduce((sum, cat: any) => sum + Object.values(cat || {}).filter(Boolean).length, 0);
    } catch { return 0; }
  };

  const handleNewRoleClick = () => {
    const allowed = checkPlanPermission('permissions.manage');
    if (!allowed) {
      toast({ title: 'إدارة الأدوار مقيدة بالخطة', description: 'يمكنك المعاينة الآن. للحفظ الكامل، يرجى الترقية.', variant: 'default' });
    }
    setOpenCreate(true);
  };

  const openEditDialog = (role: RoleRow) => {
    const allowed = checkPlanPermission('permissions.manage');
    if (!allowed) {
      toast({ title: 'وضع القراءة فقط', description: 'يمكنك عرض الصلاحيات. للحفظ، يلزم ترقية الخطة.', variant: 'default' });
    }
    setSelectedRole(role);
    setOpenEdit(true);
  };

  const handleSecurityClick = () => setOpenSecurity(true);

  return (
    <PageContainer>
      <PageHeader 
        title="إدارة الصلاحيات المتقدمة" 
        description="إدارة شاملة لصلاحيات المستخدمين والأدوار"
      />
      
      <div className="space-y-6">
        <div className="flex gap-4">
          <Button onClick={handleNewRoleClick}>
            <Plus className="h-4 w-4 mr-2" />
            دور جديد
          </Button>
          <Button variant="outline" onClick={handleSecurityClick}>
            <Shield className="h-4 w-4 mr-2" />
            إعدادات الأمان
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {loading ? (
            Array.from({ length: 6 }).map((_, i) => (
              <Card key={i}><CardHeader><CardTitle className="h-5 w-40 bg-muted rounded" /></CardHeader></Card>
            ))
          ) : (
            roles.map((role) => (
              <Card key={role.role_name}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <UserCog className="h-5 w-5" />
                    {role.description_ar || role.role_name}
                  </CardTitle>
                  <CardDescription>
                    {permCount(role.permissions)} صلاحية
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button size="sm" variant="outline" className="w-full" onClick={() => openEditDialog(role)}>
                    <Edit className="h-3 w-3 mr-2" />
                    تعديل الصلاحيات
                  </Button>
                </CardContent>
              </Card>
            ))
          )}
        </div>

        {/* Dialogs */}
        <CreateRoleDialog open={openCreate} onOpenChange={(o) => { setOpenCreate(o); if (!o) fetchRoles(); }} />
        <SecuritySettingsDialog open={openSecurity} onOpenChange={setOpenSecurity} />
        <EditRoleDialog open={openEdit} onOpenChange={setOpenEdit} role={selectedRole} onSaved={fetchRoles} />
      </div>
    </PageContainer>
  );
};

export default AdvancedPermissionsManagement;
