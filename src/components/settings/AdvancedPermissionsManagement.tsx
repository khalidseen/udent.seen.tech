import React, { useState, useEffect } from 'react';
import { usePermissions } from '@/hooks/usePermissions';
import { useRoles } from '@/hooks/useRoles';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { 
  Shield, 
  Users, 
  Key, 
  Clock, 
  AlertTriangle, 
  Eye, 
  Edit, 
  Trash2, 
  Plus,
  UserCheck,
  History,
  Settings
} from 'lucide-react';

interface TemporaryPermission {
  id: string;
  user_id: string;
  permission_key: string;
  granted_at: string;
  expires_at: string;
  granted_by: string;
  reason: string;
  is_active: boolean;
}

interface UserWithProfile {
  id: string;
  email: string;
  full_name: string;
  role: string;
}

export const AdvancedPermissionsManagement = () => {
  const { permissions, userRoles, loading: permissionsLoading } = usePermissions();
  const { roles, roleAssignments, loading: rolesLoading } = useRoles();
  const { toast } = useToast();

  const [users, setUsers] = useState<UserWithProfile[]>([]);
  const [temporaryPermissions, setTemporaryPermissions] = useState<TemporaryPermission[]>([]);
  const [selectedUser, setSelectedUser] = useState<string>('');
  const [selectedPermission, setSelectedPermission] = useState<string>('');
  const [expiryHours, setExpiryHours] = useState<number>(24);
  const [reason, setReason] = useState<string>('');
  const [isGrantingTemp, setIsGrantingTemp] = useState(false);

  // تحميل المستخدمين
  const fetchUsers = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, user_id, full_name, role')
        .eq('status', 'approved');

      if (error) throw error;
      
      // جلب الإيميلات من auth.users (إذا كانت متاحة)
      const usersWithEmail = data?.map(user => ({
        id: user.user_id,
        email: `user-${user.user_id.slice(0, 8)}`, // placeholder
        full_name: user.full_name,
        role: user.role
      })) || [];

      setUsers(usersWithEmail);
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  };

  // تحميل الصلاحيات المؤقتة
  const fetchTemporaryPermissions = async () => {
    try {
      const { data, error } = await supabase
        .from('temporary_permissions')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setTemporaryPermissions(data || []);
    } catch (error) {
      console.error('Error fetching temporary permissions:', error);
    }
  };

  // منح صلاحية مؤقتة
  const grantTemporaryPermission = async () => {
    if (!selectedUser || !selectedPermission || !reason.trim()) {
      toast({
        title: 'خطأ في البيانات',
        description: 'يرجى تعبئة جميع الحقول المطلوبة',
        variant: 'destructive',
      });
      return;
    }

    setIsGrantingTemp(true);
    try {
      const expiresAt = new Date(Date.now() + expiryHours * 60 * 60 * 1000).toISOString();
      
      const { error } = await supabase
        .from('temporary_permissions')
        .insert({
          user_id: selectedUser,
          permission_key: selectedPermission,
          expires_at: expiresAt,
          reason: reason.trim(),
          granted_by: (await supabase.auth.getUser()).data.user?.id
        });

      if (error) throw error;

      toast({
        title: 'تم منح الصلاحية',
        description: `تم منح صلاحية مؤقتة لمدة ${expiryHours} ساعة`,
      });

      // إعادة تعيين النموذج
      setSelectedUser('');
      setSelectedPermission('');
      setReason('');
      setExpiryHours(24);
      
      fetchTemporaryPermissions();
    } catch (error) {
      console.error('Error granting temporary permission:', error);
      toast({
        title: 'خطأ في منح الصلاحية',
        description: 'حدث خطأ أثناء منح الصلاحية المؤقتة',
        variant: 'destructive',
      });
    } finally {
      setIsGrantingTemp(false);
    }
  };

  // إلغاء صلاحية مؤقتة
  const revokeTemporaryPermission = async (permissionId: string) => {
    try {
      const { error } = await supabase
        .from('temporary_permissions')
        .update({ is_active: false })
        .eq('id', permissionId);

      if (error) throw error;

      toast({
        title: 'تم إلغاء الصلاحية',
        description: 'تم إلغاء الصلاحية المؤقتة بنجاح',
      });

      fetchTemporaryPermissions();
    } catch (error) {
      console.error('Error revoking temporary permission:', error);
      toast({
        title: 'خطأ في الإلغاء',
        description: 'حدث خطأ أثناء إلغاء الصلاحية',
        variant: 'destructive',
      });
    }
  };

  useEffect(() => {
    fetchUsers();
    fetchTemporaryPermissions();
  }, []);

  // تجميع الصلاحيات حسب الفئة
  const groupedPermissions = permissions.reduce((acc, permission) => {
    const category = permission.category || 'أخرى';
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(permission);
    return acc;
  }, {} as Record<string, typeof permissions>);

  // تحديد لون الأدوار
  const getRoleColor = (roleName: string) => {
    const colors = {
      'super_admin': 'bg-red-100 text-red-800',
      'clinic_owner': 'bg-purple-100 text-purple-800',
      'clinic_manager': 'bg-blue-100 text-blue-800',
      'doctor': 'bg-green-100 text-green-800',
      'medical_assistant': 'bg-cyan-100 text-cyan-800',
      'financial_manager': 'bg-yellow-100 text-yellow-800',
      'receptionist': 'bg-pink-100 text-pink-800',
      'system_administrator': 'bg-gray-100 text-gray-800',
      'secretary': 'bg-orange-100 text-orange-800',
      'assistant': 'bg-indigo-100 text-indigo-800',
      'viewer': 'bg-slate-100 text-slate-800'
    };
    return colors[roleName as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  if (permissionsLoading || rolesLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p>جاري تحميل نظام الصلاحيات المتقدم...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6" dir="rtl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">إدارة الصلاحيات المتقدمة</h1>
          <p className="text-muted-foreground">
            نظام شامل لإدارة الأدوار والصلاحيات مع الأمان المتقدم
          </p>
        </div>
        <div className="flex gap-2">
          <Badge variant="outline" className="gap-1">
            <Shield className="w-3 h-3" />
            {roles.length} أدوار
          </Badge>
          <Badge variant="outline" className="gap-1">
            <Key className="w-3 h-3" />
            {permissions.length} صلاحية
          </Badge>
        </div>
      </div>

      <Tabs defaultValue="roles" className="space-y-4">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="roles" className="gap-2">
            <Users className="w-4 h-4" />
            الأدوار
          </TabsTrigger>
          <TabsTrigger value="permissions" className="gap-2">
            <Key className="w-4 h-4" />
            الصلاحيات
          </TabsTrigger>
          <TabsTrigger value="assignments" className="gap-2">
            <UserCheck className="w-4 h-4" />
            التعيينات
          </TabsTrigger>
          <TabsTrigger value="temporary" className="gap-2">
            <Clock className="w-4 h-4" />
            الصلاحيات المؤقتة
          </TabsTrigger>
          <TabsTrigger value="audit" className="gap-2">
            <History className="w-4 h-4" />
            سجل التدقيق
          </TabsTrigger>
        </TabsList>

        {/* تبويب الأدوار */}
        <TabsContent value="roles" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {roles.map((role) => (
              <Card key={role.id} className="relative">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <Badge className={getRoleColor(role.role_name)}>
                      {role.role_name_ar}
                    </Badge>
                    {role.is_system_role && (
                      <Badge variant="outline" className="text-xs">
                        <Settings className="w-3 h-3 mr-1" />
                        نظام
                      </Badge>
                    )}
                  </div>
                  <CardTitle className="text-lg">{role.role_name}</CardTitle>
                  <CardDescription className="text-right">
                    {role.description}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>المستخدمين:</span>
                      <span>{roleAssignments.filter(a => a.role_id === role.id).length}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>الحالة:</span>
                      <Badge variant={role.is_active ? "default" : "secondary"}>
                        {role.is_active ? "نشط" : "معطل"}
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* تبويب الصلاحيات */}
        <TabsContent value="permissions" className="space-y-4">
          {Object.entries(groupedPermissions).map(([category, categoryPermissions]) => (
            <Card key={category}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Key className="w-5 h-5" />
                  {category}
                  <Badge variant="outline">{categoryPermissions.length}</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-2 md:grid-cols-2 lg:grid-cols-3">
                  {categoryPermissions.map((permission) => (
                    <div
                      key={permission.permission_key}
                      className="flex items-center justify-between p-3 border rounded-lg"
                    >
                      <div className="flex-1">
                        <p className="font-medium text-sm">{permission.permission_name_ar}</p>
                        <p className="text-xs text-muted-foreground">{permission.permission_key}</p>
                      </div>
                      <Badge variant="secondary" className="text-xs">
                        {permission.permission_name}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        {/* تبويب التعيينات */}
        <TabsContent value="assignments" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>تعيينات الأدوار النشطة</CardTitle>
              <CardDescription>
                المستخدمين المعينين للأدوار المختلفة
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-right">المستخدم</TableHead>
                    <TableHead className="text-right">الدور</TableHead>
                    <TableHead className="text-right">تاريخ التعيين</TableHead>
                    <TableHead className="text-right">انتهاء الصلاحية</TableHead>
                    <TableHead className="text-center">الإجراءات</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {roleAssignments.slice(0, 10).map((assignment) => {
                    const roleInfo = roles.find(r => r.id === assignment.role_id);
                    return (
                      <TableRow key={assignment.id}>
                        <TableCell>{assignment.user_id.slice(0, 8)}...</TableCell>
                        <TableCell>
                          <Badge className={getRoleColor(roleInfo?.role_name || 'unknown')}>
                            {roleInfo?.role_name_ar || roleInfo?.role_name || 'غير محدد'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {new Date(assignment.assigned_at).toLocaleDateString('ar-SA')}
                        </TableCell>
                        <TableCell>
                          {assignment.expires_at 
                            ? new Date(assignment.expires_at).toLocaleDateString('ar-SA')
                            : 'دائم'
                          }
                        </TableCell>
                        <TableCell className="text-center">
                          <Button variant="outline" size="sm">
                            <Edit className="w-4 h-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* تبويب الصلاحيات المؤقتة */}
        <TabsContent value="temporary" className="space-y-4">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-lg font-medium">الصلاحيات المؤقتة</h3>
              <p className="text-sm text-muted-foreground">
                إدارة الوصول المحدود زمنياً للبيانات الحساسة
              </p>
            </div>
            <Dialog>
              <DialogTrigger asChild>
                <Button className="gap-2">
                  <Plus className="w-4 h-4" />
                  منح صلاحية مؤقتة
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md" dir="rtl">
                <DialogHeader>
                  <DialogTitle>منح صلاحية مؤقتة</DialogTitle>
                  <DialogDescription>
                    منح وصول محدود زمنياً لصلاحية معينة
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="user">المستخدم</Label>
                    <Select value={selectedUser} onValueChange={setSelectedUser}>
                      <SelectTrigger>
                        <SelectValue placeholder="اختر المستخدم" />
                      </SelectTrigger>
                      <SelectContent>
                        {users.map((user) => (
                          <SelectItem key={user.id} value={user.id}>
                            {user.full_name} ({user.role})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="permission">الصلاحية</Label>
                    <Select value={selectedPermission} onValueChange={setSelectedPermission}>
                      <SelectTrigger>
                        <SelectValue placeholder="اختر الصلاحية" />
                      </SelectTrigger>
                      <SelectContent>
                        {permissions
                          .filter(p => p.category === 'sensitive' || p.category === 'emergency')
                          .map((permission) => (
                            <SelectItem key={permission.permission_key} value={permission.permission_key}>
                              {permission.permission_name_ar}
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="hours">مدة الصلاحية (ساعات)</Label>
                    <Input
                      type="number"
                      min="1"
                      max="168"
                      value={expiryHours}
                      onChange={(e) => setExpiryHours(Number(e.target.value))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="reason">سبب منح الصلاحية</Label>
                    <Textarea
                      placeholder="اكتب السبب..."
                      value={reason}
                      onChange={(e) => setReason(e.target.value)}
                    />
                  </div>
                  <Button 
                    onClick={grantTemporaryPermission}
                    disabled={isGrantingTemp}
                    className="w-full"
                  >
                    {isGrantingTemp ? 'جاري المنح...' : 'منح الصلاحية'}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-right">المستخدم</TableHead>
                    <TableHead className="text-right">الصلاحية</TableHead>
                    <TableHead className="text-right">السبب</TableHead>
                    <TableHead className="text-right">انتهاء الصلاحية</TableHead>
                    <TableHead className="text-center">الإجراءات</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {temporaryPermissions.map((temp) => (
                    <TableRow key={temp.id}>
                      <TableCell>
                        {temp.user_id.slice(0, 8)}...
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {permissions.find(p => p.permission_key === temp.permission_key)?.permission_name_ar}
                        </Badge>
                      </TableCell>
                      <TableCell className="max-w-xs truncate">
                        {temp.reason}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {new Date(temp.expires_at) > new Date() ? (
                            <Badge variant="secondary" className="gap-1">
                              <Clock className="w-3 h-3" />
                              {new Date(temp.expires_at).toLocaleString('ar-SA')}
                            </Badge>
                          ) : (
                            <Badge variant="destructive" className="gap-1">
                              <AlertTriangle className="w-3 h-3" />
                              منتهية
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-center">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => revokeTemporaryPermission(temp.id)}
                          disabled={new Date(temp.expires_at) <= new Date()}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                  {temporaryPermissions.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                        لا توجد صلاحيات مؤقتة نشطة
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* تبويب سجل التدقيق */}
        <TabsContent value="audit" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <History className="w-5 h-5" />
                سجل أنشطة الصلاحيات
              </CardTitle>
              <CardDescription>
                سجل شامل لجميع العمليات المتعلقة بالأدوار والصلاحيات
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-muted-foreground">
                <History className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>سيتم تطبيق سجل التدقيق في المرحلة القادمة</p>
                <p className="text-sm">المرحلة الثانية: تفعيل نظام تدقيق شامل</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};