import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { usePermissions } from '@/hooks/usePermissions';
import { useRoles } from '@/hooks/useRoles';
import { Shield, Users, Settings, Plus, Edit, Trash2, UserCheck, Calendar, AlertTriangle } from 'lucide-react';

export const PermissionsManagement = () => {
  const { permissions, userRoles, loading: permissionsLoading } = usePermissions();
  const { roles, roleAssignments, loading: rolesLoading, createRole, updateRole, deleteRole } = useRoles();
  
  const [selectedRole, setSelectedRole] = useState<string>('');
  const [showCreateRoleDialog, setShowCreateRoleDialog] = useState(false);
  const [showEditRoleDialog, setShowEditRoleDialog] = useState(false);
  const [editingRole, setEditingRole] = useState<any>(null);
  
  const [newRole, setNewRole] = useState({
    role_name: '',
    role_name_ar: '',
    description: ''
  });

  const handleCreateRole = async () => {
    if (await createRole(newRole)) {
      setShowCreateRoleDialog(false);
      setNewRole({ role_name: '', role_name_ar: '', description: '' });
    }
  };

  const handleUpdateRole = async () => {
    if (editingRole && await updateRole(editingRole.id, editingRole)) {
      setShowEditRoleDialog(false);
      setEditingRole(null);
    }
  };

  const handleDeleteRole = async (roleId: string) => {
    if (confirm('هل أنت متأكد من حذف هذا الدور؟')) {
      await deleteRole(roleId);
    }
  };

  const groupedPermissions = permissions.reduce((acc, permission) => {
    if (!acc[permission.category]) {
      acc[permission.category] = [];
    }
    acc[permission.category].push(permission);
    return acc;
  }, {} as Record<string, typeof permissions>);

  if (permissionsLoading || rolesLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-sm text-muted-foreground">جاري تحميل نظام الصلاحيات...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">إدارة الصلاحيات والأدوار</h2>
          <p className="text-muted-foreground">
            إدارة أدوار المستخدمين وصلاحياتهم في النظام
          </p>
        </div>
      </div>

      <Tabs defaultValue="roles" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="roles" className="flex items-center gap-2">
            <Users className="w-4 h-4" />
            الأدوار
          </TabsTrigger>
          <TabsTrigger value="permissions" className="flex items-center gap-2">
            <Shield className="w-4 h-4" />
            الصلاحيات
          </TabsTrigger>
          <TabsTrigger value="assignments" className="flex items-center gap-2">
            <UserCheck className="w-4 h-4" />
            تعيين الأدوار
          </TabsTrigger>
        </TabsList>

        <TabsContent value="roles" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="w-5 h-5" />
                    الأدوار المتاحة
                  </CardTitle>
                  <CardDescription>
                    إدارة الأدوار المختلفة في النظام وصلاحياتها
                  </CardDescription>
                </div>
                <Dialog open={showCreateRoleDialog} onOpenChange={setShowCreateRoleDialog}>
                  <DialogTrigger asChild>
                    <Button>
                      <Plus className="w-4 h-4 mr-2" />
                      إضافة دور جديد
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>إنشاء دور جديد</DialogTitle>
                      <DialogDescription>
                        أضف دور جديد إلى النظام مع تحديد الصلاحيات المناسبة
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="role_name">اسم الدور (بالإنجليزية)</Label>
                        <Input
                          id="role_name"
                          value={newRole.role_name}
                          onChange={(e) => setNewRole({ ...newRole, role_name: e.target.value })}
                          placeholder="مثل: manager"
                        />
                      </div>
                      <div>
                        <Label htmlFor="role_name_ar">اسم الدور (بالعربية)</Label>
                        <Input
                          id="role_name_ar"
                          value={newRole.role_name_ar}
                          onChange={(e) => setNewRole({ ...newRole, role_name_ar: e.target.value })}
                          placeholder="مثل: مدير"
                        />
                      </div>
                      <div>
                        <Label htmlFor="description">وصف الدور</Label>
                        <Textarea
                          id="description"
                          value={newRole.description}
                          onChange={(e) => setNewRole({ ...newRole, description: e.target.value })}
                          placeholder="وصف مهام ومسؤوليات هذا الدور"
                        />
                      </div>
                    </div>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setShowCreateRoleDialog(false)}>
                        إلغاء
                      </Button>
                      <Button onClick={handleCreateRole}>إنشاء الدور</Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4">
                {roles.map((role) => (
                  <Card key={role.id} className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3">
                          <h3 className="font-medium">{role.role_name_ar}</h3>
                          <Badge variant={role.is_system_role ? "default" : "secondary"}>
                            {role.is_system_role ? "دور نظام" : "دور مخصص"}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">
                          {role.description}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          المعرف: {role.role_name}
                        </p>
                      </div>
                      {!role.is_system_role && (
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setEditingRole(role);
                              setShowEditRoleDialog(true);
                            }}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDeleteRole(role.id)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      )}
                    </div>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Dialog for editing role */}
          <Dialog open={showEditRoleDialog} onOpenChange={setShowEditRoleDialog}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>تعديل الدور</DialogTitle>
                <DialogDescription>
                  تعديل معلومات الدور المحدد
                </DialogDescription>
              </DialogHeader>
              {editingRole && (
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="edit_role_name_ar">اسم الدور (بالعربية)</Label>
                    <Input
                      id="edit_role_name_ar"
                      value={editingRole.role_name_ar}
                      onChange={(e) => setEditingRole({ ...editingRole, role_name_ar: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="edit_description">وصف الدور</Label>
                    <Textarea
                      id="edit_description"
                      value={editingRole.description}
                      onChange={(e) => setEditingRole({ ...editingRole, description: e.target.value })}
                    />
                  </div>
                </div>
              )}
              <DialogFooter>
                <Button variant="outline" onClick={() => setShowEditRoleDialog(false)}>
                  إلغاء
                </Button>
                <Button onClick={handleUpdateRole}>حفظ التغييرات</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </TabsContent>

        <TabsContent value="permissions" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="w-5 h-5" />
                الصلاحيات المتاحة
              </CardTitle>
              <CardDescription>
                جميع الصلاحيات المتاحة في النظام مجمعة حسب الفئة
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {Object.entries(groupedPermissions).map(([category, categoryPermissions]) => (
                  <div key={category}>
                    <h3 className="font-medium mb-3 capitalize">{category}</h3>
                    <div className="grid gap-2">
                      {categoryPermissions.map((permission) => (
                        <Card key={permission.permission_key} className="p-3">
                          <div className="flex items-center justify-between">
                            <div>
                              <div className="font-medium text-sm">
                                {permission.permission_name_ar}
                              </div>
                              <div className="text-xs text-muted-foreground">
                                {permission.permission_key}
                              </div>
                            </div>
                            <Badge variant="outline">{permission.category}</Badge>
                          </div>
                        </Card>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="assignments" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <UserCheck className="w-5 h-5" />
                تعيينات الأدوار
              </CardTitle>
              <CardDescription>
                عرض وإدارة تعيينات الأدوار للمستخدمين
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Alert className="mb-4">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  هذه الميزة ستكون متاحة قريباً لإدارة تعيين الأدوار للمستخدمين.
                  حالياً يمكن إدارة الأدوار من خلال قاعدة البيانات مباشرة.
                </AlertDescription>
              </Alert>
              
              {roleAssignments.length > 0 && (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>المستخدم</TableHead>
                      <TableHead>الدور</TableHead>
                      <TableHead>تاريخ التعيين</TableHead>
                      <TableHead>تاريخ الانتهاء</TableHead>
                      <TableHead>الحالة</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {roleAssignments.map((assignment) => (
                      <TableRow key={assignment.id}>
                        <TableCell>{assignment.user_id}</TableCell>
                        <TableCell>{assignment.role_id}</TableCell>
                        <TableCell>{new Date(assignment.assigned_at).toLocaleDateString('ar-SA')}</TableCell>
                        <TableCell>
                          {assignment.expires_at 
                            ? new Date(assignment.expires_at).toLocaleDateString('ar-SA') 
                            : 'دائم'
                          }
                        </TableCell>
                        <TableCell>
                          <Badge variant={assignment.is_active ? "default" : "secondary"}>
                            {assignment.is_active ? "نشط" : "غير نشط"}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};