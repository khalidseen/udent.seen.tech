import React, { useState, useEffect } from "react";
import { PageSkeleton } from "@/components/ui/skeleton";
import { PageContainer } from "@/components/layout/PageContainer";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Users, Plus, Edit, Search, Mail, Calendar, Activity, UserCheck, Shield } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { format } from "date-fns";
import { ar } from "date-fns/locale";

interface UserProfile {
  id: string;
  user_id: string;
  full_name: string;
  role?: string;
  created_at: string;
  updated_at: string;
  status?: string;
}

const ADMIN_ROLES = ['super_admin', 'clinic_owner', 'owner', 'admin', 'manager'];

const ROLE_CONFIG: Record<string, { label: string; color: string }> = {
  owner: { label: 'مالك العيادة', color: 'bg-purple-100 text-purple-800' },
  clinic_owner: { label: 'مالك العيادة', color: 'bg-purple-100 text-purple-800' },
  doctor: { label: 'طبيب', color: 'bg-blue-100 text-blue-800' },
  assistant: { label: 'مساعد طبيب', color: 'bg-green-100 text-green-800' },
  doctor_assistant: { label: 'مساعد طبيب', color: 'bg-green-100 text-green-800' },
  secretary: { label: 'سكرتير', color: 'bg-yellow-100 text-yellow-800' },
  accountant: { label: 'محاسب', color: 'bg-orange-100 text-orange-800' },
  super_admin: { label: 'مدير النظام', color: 'bg-red-100 text-red-800' },
  admin: { label: 'مدير', color: 'bg-red-100 text-red-800' },
  user: { label: 'مستخدم', color: 'bg-gray-100 text-gray-800' },
};

const AdvancedUserManagement = () => {
  const { user: currentUser, loading: userLoading } = useCurrentUser();
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  
  const [showAddUserDialog, setShowAddUserDialog] = useState(false);
  const [addingUser, setAddingUser] = useState(false);
  const [editingUser, setEditingUser] = useState<UserProfile | null>(null);
  const [newUserData, setNewUserData] = useState({
    email: "", password: "", full_name: "", phone: "", role: "user"
  });

  const canManageUsers = currentUser && ADMIN_ROLES.includes(currentUser.role);

  useEffect(() => {
    if (!userLoading) fetchUsers();
  }, [userLoading]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const { data: profile } = await supabase.rpc('get_current_user_profile');
      if (!profile) throw new Error('Profile not found');

      const { data, error } = await supabase
        .from('profiles')
        .select('id, user_id, full_name, role, created_at, updated_at, status')
        .eq('clinic_id', profile.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setUsers(data || []);
    } catch (error) {
      console.error('Error fetching users:', error);
      toast({ title: 'خطأ', description: 'فشل في تحميل بيانات المستخدمين', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const toggleUserStatus = async (userId: string, currentStatus: string) => {
    if (!canManageUsers) {
      toast({ title: 'غير مصرح', description: 'ليس لديك صلاحية لتعديل حالة المستخدم', variant: 'destructive' });
      return;
    }
    try {
      const newStatus = currentStatus === 'active' ? 'inactive' : 'active';
      const { error } = await supabase.from('profiles').update({ status: newStatus }).eq('id', userId);
      if (error) throw error;
      toast({ title: 'تم بنجاح', description: `تم ${newStatus === 'active' ? 'تفعيل' : 'إلغاء تفعيل'} المستخدم` });
      fetchUsers();
    } catch (error) {
      toast({ title: 'خطأ', description: 'فشل في تحديث حالة المستخدم', variant: 'destructive' });
    }
  };

  const updateUserRole = async (userId: string, newRole: string) => {
    if (!canManageUsers) {
      toast({ title: 'غير مصرح', description: 'ليس لديك صلاحية لتعديل الأدوار', variant: 'destructive' });
      return;
    }
    try {
      const { error } = await supabase.from('profiles').update({ role: newRole }).eq('id', userId);
      if (error) throw error;
      toast({ title: 'تم بنجاح', description: 'تم تحديث دور المستخدم' });
      setEditingUser(null);
      fetchUsers();
    } catch (error) {
      toast({ title: 'خطأ', description: 'فشل في تحديث الدور', variant: 'destructive' });
    }
  };

  const createNewUser = async () => {
    if (!canManageUsers) {
      toast({ title: 'غير مصرح', description: 'ليس لديك صلاحية لإضافة مستخدمين', variant: 'destructive' });
      return;
    }
    if (!newUserData.email || !newUserData.password || !newUserData.full_name) {
      toast({ title: 'خطأ', description: 'يرجى ملء جميع الحقول المطلوبة', variant: 'destructive' });
      return;
    }

    setAddingUser(true);
    try {
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: newUserData.email,
        password: newUserData.password,
      });
      if (authError) throw authError;

      if (authData.user) {
        const { data: profile } = await supabase.rpc('get_current_user_profile');
        const { error: profileError } = await supabase
          .from('profiles')
          .insert({
            user_id: authData.user.id,
            full_name: newUserData.full_name,
            role: newUserData.role,
            clinic_id: profile?.id || null,
            status: 'active',
          });
        if (profileError) throw profileError;

        toast({ title: 'تم بنجاح', description: `تم إنشاء المستخدم ${newUserData.full_name}` });
        setNewUserData({ email: "", password: "", full_name: "", phone: "", role: "user" });
        setShowAddUserDialog(false);
        fetchUsers();
      }
    } catch (error: unknown) {
      toast({ title: 'خطأ', description: error instanceof Error ? error.message : 'حدث خطأ', variant: 'destructive' });
    } finally {
      setAddingUser(false);
    }
  };

  const getRoleBadge = (role?: string) => {
    const config = ROLE_CONFIG[role || 'user'] || { label: role || 'غير محدد', color: 'bg-gray-100 text-gray-800' };
    return <Badge className={config.color}>{config.label}</Badge>;
  };

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.full_name?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = roleFilter === "all" || user.role === roleFilter;
    const matchesStatus = statusFilter === "all" || user.status === statusFilter;
    return matchesSearch && matchesRole && matchesStatus;
  });

  const stats = {
    total: users.length,
    active: users.filter(u => u.status === 'active').length,
    inactive: users.filter(u => u.status === 'inactive').length,
    doctors: users.filter(u => u.role === 'doctor').length,
  };

  if (loading || userLoading) {
    return (
      <PageContainer>
        <PageHeader title="إدارة المستخدمين" description="إدارة شاملة لجميع مستخدمي النظام" />
        <PageSkeleton variant="table" />
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <PageHeader title="إدارة المستخدمين" description="إدارة شاملة لجميع مستخدمي النظام" />
      
      <div className="space-y-6">
        {/* Action Bar */}
        <div className="flex gap-4">
          {canManageUsers ? (
            <Dialog open={showAddUserDialog} onOpenChange={setShowAddUserDialog}>
              <DialogTrigger asChild>
                <Button><Plus className="h-4 w-4 ml-2" />إضافة مستخدم جديد</Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                  <DialogTitle>إضافة مستخدم جديد</DialogTitle>
                  <DialogDescription>أدخل بيانات المستخدم الجديد لإنشاء حساب في النظام</DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid gap-2">
                    <Label>البريد الإلكتروني *</Label>
                    <Input type="email" placeholder="user@example.com" value={newUserData.email} onChange={(e) => setNewUserData({ ...newUserData, email: e.target.value })} />
                  </div>
                  <div className="grid gap-2">
                    <Label>كلمة المرور *</Label>
                    <Input type="password" placeholder="كلمة مرور قوية (8 أحرف على الأقل)" value={newUserData.password} onChange={(e) => setNewUserData({ ...newUserData, password: e.target.value })} />
                  </div>
                  <div className="grid gap-2">
                    <Label>الاسم الكامل *</Label>
                    <Input placeholder="أدخل الاسم الكامل" value={newUserData.full_name} onChange={(e) => setNewUserData({ ...newUserData, full_name: e.target.value })} />
                  </div>
                  <div className="grid gap-2">
                    <Label>الدور *</Label>
                    <Select value={newUserData.role} onValueChange={(value) => setNewUserData({ ...newUserData, role: value })}>
                      <SelectTrigger><SelectValue placeholder="اختر الدور" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="user">مستخدم عادي</SelectItem>
                        <SelectItem value="secretary">سكرتير</SelectItem>
                        <SelectItem value="assistant">مساعد طبيب</SelectItem>
                        <SelectItem value="doctor">طبيب</SelectItem>
                        <SelectItem value="accountant">محاسب</SelectItem>
                        {currentUser?.role === 'super_admin' && <SelectItem value="admin">مدير</SelectItem>}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setShowAddUserDialog(false)} disabled={addingUser}>إلغاء</Button>
                  <Button onClick={createNewUser} disabled={addingUser}>{addingUser ? 'جاري الإنشاء...' : 'إنشاء المستخدم'}</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          ) : (
            <div className="flex items-center gap-2 px-4 py-2 bg-muted rounded-md">
              <Shield className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">إضافة المستخدمين متاحة للمدراء فقط</span>
            </div>
          )}
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card><CardContent className="p-4"><div className="flex items-center justify-between"><div><p className="text-sm text-muted-foreground">إجمالي المستخدمين</p><p className="text-2xl font-bold">{stats.total}</p></div><Users className="h-8 w-8 text-primary opacity-50" /></div></CardContent></Card>
          <Card><CardContent className="p-4"><div className="flex items-center justify-between"><div><p className="text-sm text-muted-foreground">النشطين</p><p className="text-2xl font-bold">{stats.active}</p></div><UserCheck className="h-8 w-8 text-primary opacity-50" /></div></CardContent></Card>
          <Card><CardContent className="p-4"><div className="flex items-center justify-between"><div><p className="text-sm text-muted-foreground">المعطلين</p><p className="text-2xl font-bold">{stats.inactive}</p></div><Users className="h-8 w-8 text-destructive opacity-50" /></div></CardContent></Card>
          <Card><CardContent className="p-4"><div className="flex items-center justify-between"><div><p className="text-sm text-muted-foreground">الأطباء</p><p className="text-2xl font-bold">{stats.doctors}</p></div><Activity className="h-8 w-8 text-primary opacity-50" /></div></CardContent></Card>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="p-4">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="space-y-2">
                <Label>البحث</Label>
                <div className="relative">
                  <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input placeholder="ابحث بالاسم" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pr-10" />
                </div>
              </div>
              <div className="space-y-2">
                <Label>الدور</Label>
                <Select value={roleFilter} onValueChange={setRoleFilter}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">جميع الأدوار</SelectItem>
                    <SelectItem value="owner">مالك العيادة</SelectItem>
                    <SelectItem value="doctor">طبيب</SelectItem>
                    <SelectItem value="assistant">مساعد طبيب</SelectItem>
                    <SelectItem value="secretary">سكرتير</SelectItem>
                    <SelectItem value="accountant">محاسب</SelectItem>
                    <SelectItem value="super_admin">مدير النظام</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>الحالة</Label>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">جميع الحالات</SelectItem>
                    <SelectItem value="active">نشط</SelectItem>
                    <SelectItem value="inactive">معطل</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>&nbsp;</Label>
                <Button variant="outline" className="w-full" onClick={() => { setSearchTerm(""); setRoleFilter("all"); setStatusFilter("all"); }}>مسح الفلاتر</Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Users List */}
        <Card>
          <CardHeader>
            <CardTitle>قائمة المستخدمين ({filteredUsers.length})</CardTitle>
          </CardHeader>
          <CardContent>
            {filteredUsers.length === 0 ? (
              <div className="text-center py-8">
                <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">لا توجد نتائج</p>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredUsers.map((u) => (
                  <div key={u.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent/50 transition-colors">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                        <Users className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-medium">{u.full_name}</p>
                          {u.user_id === currentUser?.id && <Badge variant="outline" className="text-xs">أنت</Badge>}
                        </div>
                        <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1">
                          <span className="flex items-center gap-1"><Calendar className="h-3 w-3" />{format(new Date(u.created_at), "dd/MM/yyyy", { locale: ar })}</span>
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                          {getRoleBadge(u.role)}
                          <Badge className={u.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
                            {u.status === 'active' ? 'نشط' : 'معطل'}
                          </Badge>
                        </div>
                      </div>
                    </div>
                    
                    {canManageUsers && u.user_id !== currentUser?.id && (
                      <div className="flex items-center gap-2">
                        {/* Edit Role */}
                        <Dialog open={editingUser?.id === u.id} onOpenChange={(open) => !open && setEditingUser(null)}>
                          <DialogTrigger asChild>
                            <Button size="sm" variant="outline" onClick={() => setEditingUser(u)}>
                              <Edit className="h-3 w-3 ml-1" />تعديل الدور
                            </Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>تعديل دور {u.full_name}</DialogTitle>
                            </DialogHeader>
                            <div className="space-y-4 py-4">
                              <Select defaultValue={u.role || 'user'} onValueChange={(val) => updateUserRole(u.id, val)}>
                                <SelectTrigger><SelectValue /></SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="user">مستخدم عادي</SelectItem>
                                  <SelectItem value="secretary">سكرتير</SelectItem>
                                  <SelectItem value="assistant">مساعد طبيب</SelectItem>
                                  <SelectItem value="doctor">طبيب</SelectItem>
                                  <SelectItem value="accountant">محاسب</SelectItem>
                                  {currentUser?.role === 'super_admin' && <SelectItem value="admin">مدير</SelectItem>}
                                </SelectContent>
                              </Select>
                            </div>
                          </DialogContent>
                        </Dialog>

                        {/* Toggle Status */}
                        <Button
                          size="sm"
                          variant={u.status === 'active' ? 'destructive' : 'default'}
                          onClick={() => toggleUserStatus(u.id, u.status || 'active')}
                        >
                          {u.status === 'active' ? 'تعطيل' : 'تفعيل'}
                        </Button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </PageContainer>
  );
};

export default AdvancedUserManagement;
