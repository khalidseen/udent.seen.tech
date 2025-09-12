import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { AlertTriangle, Users, UserPlus, Settings, BarChart3, Plus, Edit, Trash2, Eye, MoreHorizontal } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';

interface User {
  id: string;
  user_id: string;
  full_name?: string;
  email?: string;
  clinic_id?: string;
  role?: string;
  current_clinic_role?: string;
  created_at: string;
  is_active?: boolean;
  status?: string;
}

interface Clinic {
  id: string;
  name: string;
  subscription_plan?: string;
  subscription_status?: string;
  max_users?: number;
  max_patients?: number;
  is_active: boolean;
}

interface ClinicRole {
  role_name: string;
  description_ar: string;
  level: number;
}

interface UsageStats {
  clinic_id: string;
  clinic_name: string;
  current_users: number;
  max_users: number;
  current_patients: number;
  max_patients: number;
  usage_percentage: number;
}

export const AdvancedUserManagement = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [showUserDialog, setShowUserDialog] = useState(false);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [newUserData, setNewUserData] = useState({
    full_name: '',
    email: '',
    role: '',
    clinic_id: ''
  });

  // الحصول على جميع المستخدمين
  const { data: users = [], isLoading: usersLoading } = useQuery({
    queryKey: ['all-users'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as User[];
    }
  });

  // الحصول على جميع العيادات
  const { data: clinics = [], isLoading: clinicsLoading } = useQuery({
    queryKey: ['all-clinics'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('clinics')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as Clinic[];
    }
  });

  // الحصول على الأدوار
  const { data: roles = [], isLoading: rolesLoading } = useQuery({
    queryKey: ['clinic-roles'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('clinic_role_hierarchy')
        .select('role_name, description_ar, level')
        .order('level');
      
      if (error) throw error;
      return data as ClinicRole[];
    }
  });

  // إحصائيات الاستخدام
  const { data: usageStats = [], isLoading: statsLoading } = useQuery({
    queryKey: ['usage-stats'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('clinic_subscription_usage')
        .select(`
          clinic_id,
          metric_type,
          current_count,
          max_count,
          clinics!inner(name)
        `)
        .eq('metric_type', 'users');
      
      if (error) throw error;
      
      return data.map(item => ({
        clinic_id: item.clinic_id,
        clinic_name: (item.clinics as any)?.name || 'عيادة غير معروفة',
        current_users: item.current_count,
        max_users: item.max_count,
        current_patients: 0, // يمكن إضافته لاحقاً
        max_patients: 0,
        usage_percentage: Math.round((item.current_count / item.max_count) * 100)
      })) as UsageStats[];
    }
  });

  // تحديث بيانات المستخدم
  const updateUserMutation = useMutation({
    mutationFn: async (userData: any) => {
      const { error } = await supabase
        .from('profiles')
        .update(userData)
        .eq('id', userData.id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      toast({
        title: 'تم تحديث المستخدم',
        description: 'تم تحديث بيانات المستخدم بنجاح'
      });
      queryClient.invalidateQueries({ queryKey: ['all-users'] });
      setShowUserDialog(false);
      setSelectedUser(null);
    }
  });

  // إنشاء مستخدم جديد
  const createUserMutation = useMutation({
    mutationFn: async (userData: typeof newUserData) => {
      const { error } = await supabase.auth.admin.createUser({
        email: userData.email,
        password: 'TempPassword123!', // كلمة مرور مؤقتة
        email_confirm: true,
        user_metadata: {
          full_name: userData.full_name,
          role: userData.role,
          clinic_id: userData.clinic_id
        }
      });
      
      if (error) throw error;
    },
    onSuccess: () => {
      toast({
        title: 'تم إنشاء المستخدم',
        description: 'تم إنشاء المستخدم الجديد بنجاح'
      });
      queryClient.invalidateQueries({ queryKey: ['all-users'] });
      setShowCreateDialog(false);
      setNewUserData({ full_name: '', email: '', role: '', clinic_id: '' });
    }
  });

  // تغيير حالة المستخدم
  const toggleUserStatusMutation = useMutation({
    mutationFn: async ({ userId, status }: { userId: string; status: boolean }) => {
      const { error } = await supabase
        .from('profiles')
        .update({ status: status ? 'active' : 'inactive' })
        .eq('id', userId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      toast({
        title: 'تم تحديث حالة المستخدم',
        description: 'تم تحديث حالة المستخدم بنجاح'
      });
      queryClient.invalidateQueries({ queryKey: ['all-users'] });
    }
  });

  const handleCreateUser = () => {
    if (!newUserData.full_name || !newUserData.email || !newUserData.role || !newUserData.clinic_id) {
      toast({
        title: 'بيانات ناقصة',
        description: 'يرجى ملء جميع الحقول المطلوبة',
        variant: 'destructive'
      });
      return;
    }

    createUserMutation.mutate(newUserData);
  };

  const handleUpdateUser = () => {
    if (!selectedUser) return;
    updateUserMutation.mutate(selectedUser);
  };

  const getRoleColor = (role: string) => {
    const colors: Record<string, string> = {
      admin: 'bg-red-500 text-white',
      owner: 'bg-red-500 text-white',
      clinic_manager: 'bg-orange-500 text-white',
      dentist: 'bg-blue-500 text-white',
      accountant: 'bg-green-500 text-white',
      assistant: 'bg-purple-500 text-white',
      receptionist: 'bg-teal-500 text-white',
      secretary: 'bg-gray-500 text-white'
    };
    return colors[role] || 'bg-gray-400 text-white';
  };

  const getUsageColor = (percentage: number) => {
    if (percentage >= 90) return 'bg-red-500';
    if (percentage >= 75) return 'bg-orange-500';
    if (percentage >= 50) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  if (usersLoading || clinicsLoading || rolesLoading || statsLoading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="text-muted-foreground">جاري تحميل بيانات المستخدمين...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">إدارة المستخدمين المتقدمة</h2>
          <p className="text-muted-foreground">إدارة شاملة لجميع المستخدمين في النظام</p>
        </div>
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogTrigger asChild>
            <Button>
              <UserPlus className="h-4 w-4 mr-2" />
              إضافة مستخدم جديد
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>إضافة مستخدم جديد</DialogTitle>
              <DialogDescription>
                إنشاء حساب مستخدم جديد في النظام
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="full_name">الاسم الكامل</Label>
                <Input
                  id="full_name"
                  value={newUserData.full_name}
                  onChange={(e) => setNewUserData({ ...newUserData, full_name: e.target.value })}
                  placeholder="أدخل الاسم الكامل"
                />
              </div>
              
              <div>
                <Label htmlFor="email">البريد الإلكتروني</Label>
                <Input
                  id="email"
                  type="email"
                  value={newUserData.email}
                  onChange={(e) => setNewUserData({ ...newUserData, email: e.target.value })}
                  placeholder="أدخل البريد الإلكتروني"
                />
              </div>

              <div>
                <Label htmlFor="clinic">العيادة</Label>
                <Select value={newUserData.clinic_id} onValueChange={(value) => setNewUserData({ ...newUserData, clinic_id: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="اختر العيادة" />
                  </SelectTrigger>
                  <SelectContent>
                    {clinics.map((clinic) => (
                      <SelectItem key={clinic.id} value={clinic.id}>
                        {clinic.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="role">الدور</Label>
                <Select value={newUserData.role} onValueChange={(value) => setNewUserData({ ...newUserData, role: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="اختر الدور" />
                  </SelectTrigger>
                  <SelectContent>
                    {roles.map((role) => (
                      <SelectItem key={role.role_name} value={role.role_name}>
                        {role.description_ar}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
                  إلغاء
                </Button>
                <Button onClick={handleCreateUser}>
                  إنشاء المستخدم
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Tabs defaultValue="users" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="users" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            المستخدمين
          </TabsTrigger>
          <TabsTrigger value="clinics" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            العيادات
          </TabsTrigger>
          <TabsTrigger value="usage" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            إحصائيات الاستخدام
          </TabsTrigger>
        </TabsList>

        <TabsContent value="users" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>جميع المستخدمين ({users.length})</CardTitle>
              <CardDescription>
                إدارة جميع المستخدمين المسجلين في النظام
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>المستخدم</TableHead>
                    <TableHead>البريد الإلكتروني</TableHead>
                    <TableHead>الدور</TableHead>
                    <TableHead>العيادة</TableHead>
                    <TableHead>تاريخ التسجيل</TableHead>
                    <TableHead>الحالة</TableHead>
                    <TableHead>الإجراءات</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell>
                        <div className="font-medium">{user.full_name || 'غير محدد'}</div>
                      </TableCell>
                      <TableCell>{user.email}</TableCell>
                      <TableCell>
                        <Badge className={getRoleColor(user.current_clinic_role || user.role || '')}>
                          {user.current_clinic_role || user.role || 'غير محدد'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {clinics.find(c => c.id === user.clinic_id)?.name || 'غير محدد'}
                      </TableCell>
                      <TableCell>
                        {format(new Date(user.created_at), 'PPP', { locale: ar })}
                      </TableCell>
                      <TableCell>
                        <Switch
                          checked={user.status !== 'inactive'}
                          onCheckedChange={(checked) => 
                            toggleUserStatusMutation.mutate({ userId: user.id, status: checked })
                          }
                        />
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent>
                            <DropdownMenuItem onClick={() => {
                              setSelectedUser(user);
                              setShowUserDialog(true);
                            }}>
                              <Edit className="h-4 w-4 mr-2" />
                              تعديل
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <Eye className="h-4 w-4 mr-2" />
                              عرض التفاصيل
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="clinics" className="space-y-4">
          <div className="grid gap-4">
            {clinics.map((clinic) => (
              <Card key={clinic.id}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <div className="space-y-1">
                    <CardTitle className="flex items-center gap-2">
                      {clinic.name}
                      <Badge variant={clinic.is_active ? 'default' : 'secondary'}>
                        {clinic.is_active ? 'نشطة' : 'غير نشطة'}
                      </Badge>
                    </CardTitle>
                    <CardDescription>
                      خطة الاشتراك: {clinic.subscription_plan || 'غير محدد'}
                    </CardDescription>
                  </div>
                  <Button variant="outline" size="sm">
                    <Settings className="h-4 w-4 mr-2" />
                    إدارة
                  </Button>
                </CardHeader>
                <CardContent>
                  <div className="flex gap-4 text-sm text-muted-foreground">
                    <span>الحد الأقصى للمستخدمين: {clinic.max_users || 'غير محدد'}</span>
                    <span>الحد الأقصى للمرضى: {clinic.max_patients || 'غير محدد'}</span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="usage" className="space-y-4">
          <div className="grid gap-4">
            {usageStats.map((stat) => (
              <Card key={stat.clinic_id}>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    {stat.clinic_name}
                    <Badge className={getUsageColor(stat.usage_percentage) + ' text-white'}>
                      {stat.usage_percentage}%
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>المستخدمين: {stat.current_users} / {stat.max_users}</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full ${getUsageColor(stat.usage_percentage)}`}
                        style={{ width: `${stat.usage_percentage}%` }}
                      ></div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>

      {/* Dialog لتعديل المستخدم */}
      <Dialog open={showUserDialog} onOpenChange={setShowUserDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>تعديل بيانات المستخدم</DialogTitle>
            <DialogDescription>
              تعديل معلومات المستخدم المحدد
            </DialogDescription>
          </DialogHeader>
          {selectedUser && (
            <div className="space-y-4">
              <div>
                <Label htmlFor="edit_full_name">الاسم الكامل</Label>
                <Input
                  id="edit_full_name"
                  value={selectedUser.full_name || ''}
                  onChange={(e) => setSelectedUser({ ...selectedUser, full_name: e.target.value })}
                />
              </div>
              
              <div>
                <Label htmlFor="edit_email">البريد الإلكتروني</Label>
                <Input
                  id="edit_email"
                  type="email"
                  value={selectedUser.email || ''}
                  onChange={(e) => setSelectedUser({ ...selectedUser, email: e.target.value })}
                />
              </div>

              <div>
                <Label htmlFor="edit_role">الدور</Label>
                <Select 
                  value={selectedUser.current_clinic_role || selectedUser.role || ''} 
                  onValueChange={(value) => setSelectedUser({ ...selectedUser, current_clinic_role: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="اختر الدور" />
                  </SelectTrigger>
                  <SelectContent>
                    {roles.map((role) => (
                      <SelectItem key={role.role_name} value={role.role_name}>
                        {role.description_ar}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setShowUserDialog(false)}>
                  إلغاء
                </Button>
                <Button onClick={handleUpdateUser}>
                  حفظ التغييرات
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};