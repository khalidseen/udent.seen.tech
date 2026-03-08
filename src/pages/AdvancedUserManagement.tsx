import React, { useState, useEffect } from "react";
import { PageContainer } from "@/components/layout/PageContainer";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Users, Plus, Edit, Trash, UserCheck, Search, Mail, Phone, Calendar, Activity } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { format } from "date-fns";
import { ar } from "date-fns/locale";

interface UserProfile {
  id: string;
  user_id: string;
  full_name: string;
  email?: string;
  phone?: string;
  role?: string;
  created_at: string;
  updated_at: string;
  status?: string;
  last_login?: string;
}

const AdvancedUserManagement = () => {
  const { user: authUser } = useAuth();
  const { user: currentUser } = useCurrentUser();
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  
  // Add User Dialog State
  const [showAddUserDialog, setShowAddUserDialog] = useState(false);
  const [addingUser, setAddingUser] = useState(false);
  const [newUserData, setNewUserData] = useState({
    email: "",
    password: "",
    full_name: "",
    phone: "",
    role: "user"
  });

  // Check if current user can add users
  const adminRoles = [
    'super_admin', 'clinic_owner', 'owner', 'admin',
    'system_admin', 'manager', 'clinic_manager'
  ];
  
  const canAddUsers = currentUser && adminRoles.includes(currentUser.role);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('profiles')
        .select(`
          id,
          user_id,
          full_name,
          role,
          created_at,
          updated_at,
          status
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setUsers(data || []);
    } catch (error) {
      console.error('Error fetching users:', error);
      toast({
        title: 'خطأ',
        description: 'فشل في تحميل بيانات المستخدمين',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const toggleUserStatus = async (userId: string, currentStatus: string) => {
    try {
      const newStatus = currentStatus === 'active' ? 'inactive' : 'active';
      const { error } = await supabase
        .from('profiles')
        .update({ status: newStatus })
        .eq('id', userId);

      if (error) throw error;

      toast({
        title: 'تم بنجاح',
        description: `تم ${newStatus === 'active' ? 'تفعيل' : 'إلغاء تفعيل'} المستخدم`
      });

      fetchUsers();
    } catch (error) {
      toast({
        title: 'خطأ',
        description: 'فشل في تحديث حالة المستخدم',
        variant: 'destructive'
      });
    }
  };

  const createNewUser = async () => {
    // Check permissions first
    if (!canAddUsers) {
      toast({
        title: 'غير مصرح',
        description: 'ليس لديك صلاحية لإضافة مستخدمين جدد',
        variant: 'destructive',
      });
      return;
    }

    if (!newUserData.email || !newUserData.password || !newUserData.full_name) {
      toast({
        title: 'خطأ',
        description: 'يرجى ملء جميع الحقول المطلوبة',
        variant: 'destructive',
      });
      return;
    }

    setAddingUser(true);
    try {
      // Create user in Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: newUserData.email,
        password: newUserData.password,
      });

      if (authError) throw authError;

      if (authData.user) {
        // Create profile for the new user
        const { error: profileError } = await supabase
          .from('profiles')
          .insert({
            user_id: authData.user.id,
            full_name: newUserData.full_name,
            email: newUserData.email,
            phone: newUserData.phone || null,
            role: newUserData.role,
            is_active: true,
          });

        if (profileError) throw profileError;

        toast({
          title: 'تم إنشاء المستخدم',
          description: `تم إنشاء المستخدم ${newUserData.full_name} بنجاح`,
        });

        // Reset form and close dialog
        setNewUserData({
          email: "",
          password: "",
          full_name: "",
          phone: "",
          role: "user"
        });
        setShowAddUserDialog(false);
        
        // Refresh users list
        fetchUsers();
      }
    } catch (error: unknown) {
      console.error('Error creating user:', error);
      const errorMessage = error instanceof Error ? error.message : 'حدث خطأ أثناء إنشاء المستخدم الجديد';
      toast({
        title: 'خطأ في إنشاء المستخدم',
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setAddingUser(false);
    }
  };

  const getRoleBadge = (role?: string) => {
    const roleConfig = {
      'owner': { label: 'مالك العيادة', variant: 'default' as const, color: 'bg-purple-100 text-purple-800' },
      'clinic_owner': { label: 'مالك العيادة', variant: 'default' as const, color: 'bg-purple-100 text-purple-800' },
      'doctor': { label: 'طبيب', variant: 'secondary' as const, color: 'bg-blue-100 text-blue-800' },
      'assistant': { label: 'مساعد طبيب', variant: 'outline' as const, color: 'bg-green-100 text-green-800' },
      'doctor_assistant': { label: 'مساعد طبيب', variant: 'outline' as const, color: 'bg-green-100 text-green-800' },
      'secretary': { label: 'سكرتير', variant: 'outline' as const, color: 'bg-yellow-100 text-yellow-800' },
      'accountant': { label: 'محاسب', variant: 'outline' as const, color: 'bg-orange-100 text-orange-800' },
      'super_admin': { label: 'مدير النظام', variant: 'destructive' as const, color: 'bg-red-100 text-red-800' },
    };

    const config = roleConfig[role as keyof typeof roleConfig] || { 
      label: role || 'غير محدد', 
      variant: 'outline' as const,
      color: 'bg-gray-100 text-gray-800'
    };

    return (
      <Badge className={config.color}>
        {config.label}
      </Badge>
    );
  };

  const getStatusBadge = (status?: string) => {
    if (status === 'active') {
      return <Badge className="bg-green-100 text-green-800">نشط</Badge>;
    } else if (status === 'inactive') {
      return <Badge variant="destructive">معطل</Badge>;
    }
    return <Badge variant="secondary">غير محدد</Badge>;
  };

  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), "dd MMMM yyyy", { locale: ar });
    } catch {
      return dateString;
    }
  };

  const formatLastLogin = (lastLogin?: string) => {
    if (!lastLogin) return 'لم يسجل دخول';
    
    try {
      const loginDate = new Date(lastLogin);
      const now = new Date();
      const diffMinutes = Math.floor((now.getTime() - loginDate.getTime()) / (1000 * 60));

      if (diffMinutes < 1) return 'الآن';
      if (diffMinutes < 60) return `منذ ${diffMinutes} دقيقة`;
      if (diffMinutes < 1440) return `منذ ${Math.floor(diffMinutes / 60)} ساعة`;
      return format(loginDate, "dd/MM/yyyy", { locale: ar });
    } catch {
      return 'غير محدد';
    }
  };

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.user_id?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesRole = roleFilter === "all" || user.role === roleFilter;
    const matchesStatus = statusFilter === "all" || 
                         (statusFilter === "active" && user.status === 'active') ||
                         (statusFilter === "inactive" && user.status === 'inactive');

    return matchesSearch && matchesRole && matchesStatus;
  });

  const stats = {
    total: users.length,
    active: users.filter(u => u.status === 'active').length,
    inactive: users.filter(u => u.status === 'inactive').length,
    newThisMonth: users.filter(u => {
      const created = new Date(u.created_at);
      const now = new Date();
      return created.getMonth() === now.getMonth() && created.getFullYear() === now.getFullYear();
    }).length
  };

  if (loading) {
    return (
      <PageContainer>
        <PageHeader 
          title="إدارة المستخدمين المتقدمة" 
          description="إدارة شاملة لجميع مستخدمي النظام"
        />
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            <p className="mt-2 text-muted-foreground">جاري تحميل البيانات...</p>
          </div>
        </div>
      </PageContainer>
    );
  }
  return (
    <PageContainer>
      <PageHeader 
        title="إدارة المستخدمين المتقدمة" 
        description="إدارة شاملة لجميع مستخدمي النظام"
      />
      
      <div className="space-y-6">
        {/* Action Buttons */}
        <div className="space-y-4 mb-6">
          {/* Debug Panel - Remove in production */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4 w-full">
            <h4 className="font-semibold text-blue-800 mb-3 flex items-center gap-2">
              🔍 معلومات التشخيص والصلاحيات
              {localStorage.getItem('temp_admin_session') && (
                <Badge className="bg-green-100 text-green-800">جلسة تجريبية نشطة</Badge>
              )}
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-blue-700">
              <div className="space-y-2">
                <p><strong>👤 المستخدم الحالي:</strong> {currentUser?.full_name || 'غير محدد'}</p>
                <p><strong>📧 البريد الإلكتروني:</strong> {currentUser?.email || authUser?.email || 'غير محدد'}</p>
                <p><strong>🎭 الدور:</strong> 
                  <Badge variant="outline" className="mr-2">
                    {currentUser?.role || 'غير محدد'}
                  </Badge>
                </p>
              </div>
              <div className="space-y-2">
                <p><strong>✅ يمكن إضافة مستخدمين:</strong> 
                  <Badge className={canAddUsers ? 'bg-green-100 text-green-800 mr-2' : 'bg-red-100 text-red-800 mr-2'}>
                    {canAddUsers ? '✓ نعم' : '✗ لا'}
                  </Badge>
                </p>
                <p><strong>🔐 الأدوار المصرح لها:</strong></p>
                <div className="flex flex-wrap gap-1 mt-1">
                  {adminRoles.map(role => (
                    <Badge 
                      key={role} 
                      variant={currentUser?.role === role ? "default" : "outline"}
                      className="text-xs"
                    >
                      {role}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>
          </div>
          
          {/* إرشادات للمستخدم */}
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-4">
            <h4 className="font-semibold text-gray-800 mb-2">📋 إرشادات الاستخدام</h4>
            <div className="text-sm text-gray-600 space-y-1">
              <p>• <strong>للمدير العام (super_admin):</strong> يمكنه إضافة وإدارة جميع المستخدمين</p>
              <p>• <strong>لمالك العيادة (clinic_owner):</strong> يمكنه إدارة موظفي عيادته</p>
              <p>• <strong>للمدير (admin/manager):</strong> صلاحيات إدارية محدودة</p>
              <p>• <strong>للمستخدمين العاديين:</strong> عرض فقط بدون صلاحيات إضافة</p>
              <p>• <strong>اختبار الصلاحيات:</strong> استخدم زر "صلاحيات مدير عام" للاختبار</p>
            </div>
          </div>
          
          <div className="flex gap-4">
          {canAddUsers ? (
            <Dialog open={showAddUserDialog} onOpenChange={setShowAddUserDialog}>
              <DialogTrigger asChild>
                <Button className="bg-green-600 hover:bg-green-700 text-white">
                  <Plus className="h-4 w-4 mr-2" />
                  إضافة مستخدم جديد
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                  <DialogTitle>إضافة مستخدم جديد</DialogTitle>
                  <DialogDescription>
                    أدخل بيانات المستخدم الجديد لإنشاء حساب في النظام
                  </DialogDescription>
                </DialogHeader>
                
                <div className="grid gap-4 py-4">
                  <div className="grid gap-2">
                    <Label htmlFor="email">البريد الإلكتروني *</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="user@example.com"
                      value={newUserData.email}
                      onChange={(e) => setNewUserData({...newUserData, email: e.target.value})}
                    />
                  </div>
                  
                  <div className="grid gap-2">
                    <Label htmlFor="password">كلمة المرور *</Label>
                    <Input
                      id="password"
                      type="password"
                      placeholder="كلمة مرور قوية"
                      value={newUserData.password}
                      onChange={(e) => setNewUserData({...newUserData, password: e.target.value})}
                    />
                  </div>
                  
                  <div className="grid gap-2">
                    <Label htmlFor="full_name">الاسم الكامل *</Label>
                    <Input
                      id="full_name"
                      placeholder="أدخل الاسم الكامل"
                      value={newUserData.full_name}
                      onChange={(e) => setNewUserData({...newUserData, full_name: e.target.value})}
                    />
                  </div>
                  
                  <div className="grid gap-2">
                    <Label htmlFor="phone">رقم الهاتف</Label>
                    <Input
                      id="phone"
                      placeholder="05xxxxxxxx"
                      value={newUserData.phone}
                      onChange={(e) => setNewUserData({...newUserData, phone: e.target.value})}
                    />
                  </div>
                  
                  <div className="grid gap-2">
                    <Label htmlFor="role">الصلاحية *</Label>
                    <Select 
                      value={newUserData.role} 
                      onValueChange={(value) => setNewUserData({...newUserData, role: value})}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="اختر الصلاحية" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="user">مستخدم عادي</SelectItem>
                        <SelectItem value="secretary">سكرتير</SelectItem>
                        <SelectItem value="assistant">مساعد طبيب</SelectItem>
                        <SelectItem value="doctor">طبيب</SelectItem>
                        <SelectItem value="accountant">محاسب</SelectItem>
                        {(currentUser?.role === 'super_admin' || currentUser?.role === 'clinic_owner') && (
                          <SelectItem value="clinic_owner">مالك العيادة</SelectItem>
                        )}
                        {currentUser?.role === 'super_admin' && (
                          <SelectItem value="super_admin">مدير النظام</SelectItem>
                        )}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                <DialogFooter>
                  <Button 
                    variant="outline" 
                    onClick={() => setShowAddUserDialog(false)}
                    disabled={addingUser}
                  >
                    إلغاء
                  </Button>
                  <Button 
                    onClick={createNewUser}
                    disabled={addingUser}
                  >
                    {addingUser ? 'جاري الإنشاء...' : 'إنشاء المستخدم'}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          ) : (
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 px-4 py-2 bg-red-50 border border-red-200 rounded-md">
                <Plus className="h-4 w-4 text-red-400" />
                <span className="text-sm text-red-600">
                  إضافة مستخدم (غير متاح - صلاحية محدودة)
                </span>
                <Badge variant="destructive" className="text-xs">
                  {currentUser?.role || 'غير محدد'}
                </Badge>
              </div>
              
              {/* أزرار الصلاحيات التجريبية */}
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={async () => {
                    try {
                      // إنشاء مستخدم مؤقت بصلاحيات super_admin
                      const tempUser = {
                        id: 'temp-admin-' + Date.now(),
                        full_name: 'مدير النظام التجريبي',
                        email: 'admin@test.com',
                        role: 'super_admin'
                      };
                      
                      // حفظ في localStorage لاختبار مؤقت
                      localStorage.setItem('temp_admin_session', JSON.stringify(tempUser));
                      
                      toast({
                        title: "🎉 تم تفعيل صلاحيات المدير العام",
                        description: "يمكنك الآن إضافة وإدارة المستخدمين",
                        duration: 3000,
                      });
                      
                      // إعادة تحميل الصفحة
                      setTimeout(() => window.location.reload(), 1000);
                    } catch (error) {
                      console.error('خطأ في إنشاء جلسة تجريبية:', error);
                      toast({
                        title: "خطأ",
                        description: "فشل في إنشاء الجلسة التجريبية",
                        variant: "destructive"
                      });
                    }
                  }}
                  className="text-blue-600 hover:text-blue-700 border-blue-300"
                >
                  🔓 صلاحيات مدير عام
                </Button>
                
                {localStorage.getItem('temp_admin_session') && (
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => {
                      localStorage.removeItem('temp_admin_session');
                      toast({
                        title: "تم إزالة الصلاحيات التجريبية",
                        description: "عودة للصلاحيات الأصلية",
                        variant: "destructive"
                      });
                      setTimeout(() => window.location.reload(), 1000);
                    }}
                    className="text-red-600 hover:text-red-700 border-red-300"
                  >
                    🔒 إزالة الصلاحيات التجريبية
                  </Button>
                )}
                
                {/* زر إنشاء مدير حقيقي في قاعدة البيانات */}
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={async () => {
                    try {
                      // إنشاء مدير حقيقي في قاعدة البيانات
                      const { error } = await supabase
                        .from('profiles')
                        .insert({
                          id: 'super-admin-001',
                          user_id: 'super-admin-001',
                          full_name: 'مدير النظام الرئيسي',
                          role: 'super_admin',
                          status: 'active'
                        });

                      if (error) throw error;

                      toast({
                        title: "✅ تم إنشاء مدير النظام",
                        description: "تم إنشاء مدير بصلاحيات كاملة في قاعدة البيانات",
                      });
                      
                      fetchUsers(); // إعادة تحميل قائمة المستخدمين
                    } catch (error) {
                      console.error('خطأ في إنشاء المدير:', error);
                      toast({
                        title: "خطأ",
                        description: "فشل في إنشاء المدير - قد يكون موجود مسبقاً",
                        variant: "destructive"
                      });
                    }
                  }}
                  className="text-green-600 hover:text-green-700 border-green-300"
                >
                  👑 إنشاء مدير حقيقي
                </Button>
              </div>
            </div>
          )}
          
          <Button variant="outline">
            <UserCheck className="h-4 w-4 mr-2" />
            طلبات الانضمام
          </Button>
          </div>
        </div>        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">إجمالي المستخدمين</p>
                  <p className="text-2xl font-bold">{stats.total}</p>
                </div>
                <Users className="h-8 w-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">المستخدمين النشطين</p>
                  <p className="text-2xl font-bold">{stats.active}</p>
                </div>
                <Users className="h-8 w-8 text-green-600" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">مستخدمين معطلين</p>
                  <p className="text-2xl font-bold">{stats.inactive}</p>
                </div>
                <Users className="h-8 w-8 text-red-600" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">جدد هذا الشهر</p>
                  <p className="text-2xl font-bold">{stats.newThisMonth}</p>
                </div>
                <Users className="h-8 w-8 text-purple-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Staff Management Section */}
        <Card>
          <CardHeader>
            <CardTitle className="text-xl">إدارة الموظفين</CardTitle>
            <CardDescription>تصنيف وإدارة جميع موظفي العيادة حسب التخصص</CardDescription>
          </CardHeader>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Doctors */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                  <Users className="h-4 w-4 text-blue-600" />
                </div>
                الأطباء
              </CardTitle>
              <CardDescription>إدارة الأطباء في العيادة</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">العدد الكلي</span>
                  <Badge variant="secondary">
                    {users.filter(u => u.role === 'doctor').length}
                  </Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">النشطين</span>
                  <Badge className="bg-green-100 text-green-800">
                    {users.filter(u => u.role === 'doctor' && u.status === 'active').length}
                  </Badge>
                </div>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="w-full"
                  onClick={() => setRoleFilter('doctor')}
                >
                  عرض الأطباء
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Doctor Assistants */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                  <UserCheck className="h-4 w-4 text-green-600" />
                </div>
                مساعدو الأطباء
              </CardTitle>
              <CardDescription>إدارة مساعدي الأطباء</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">العدد الكلي</span>
                  <Badge variant="secondary">
                    {users.filter(u => u.role === 'assistant' || u.role === 'doctor_assistant').length}
                  </Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">النشطين</span>
                  <Badge className="bg-green-100 text-green-800">
                    {users.filter(u => (u.role === 'assistant' || u.role === 'doctor_assistant') && u.status === 'active').length}
                  </Badge>
                </div>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="w-full"
                  onClick={() => setRoleFilter('assistant')}
                >
                  عرض المساعدين
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Secretary */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <div className="w-8 h-8 bg-yellow-100 rounded-full flex items-center justify-center">
                  <Edit className="h-4 w-4 text-yellow-600" />
                </div>
                السكرتارية
              </CardTitle>
              <CardDescription>إدارة السكرتارية</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">العدد الكلي</span>
                  <Badge variant="secondary">
                    {users.filter(u => u.role === 'secretary').length}
                  </Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">النشطين</span>
                  <Badge className="bg-green-100 text-green-800">
                    {users.filter(u => u.role === 'secretary' && u.status === 'active').length}
                  </Badge>
                </div>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="w-full"
                  onClick={() => setRoleFilter('secretary')}
                >
                  عرض السكرتارية
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Management & Admin */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                  <Activity className="h-4 w-4 text-purple-600" />
                </div>
                الإدارة
              </CardTitle>
              <CardDescription>المدراء والمحاسبين</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">المدراء</span>
                  <Badge variant="secondary">
                    {users.filter(u => u.role === 'super_admin' || u.role === 'admin' || u.role === 'clinic_owner' || u.role === 'owner').length}
                  </Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">المحاسبين</span>
                  <Badge variant="secondary">
                    {users.filter(u => u.role === 'accountant').length}
                  </Badge>
                </div>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="w-full"
                  onClick={() => {
                    // عرض جميع الأدوار الإدارية
                    setSearchTerm('');
                    setStatusFilter('all');
                  }}
                >
                  عرض الإدارة
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="p-4">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="space-y-2">
                <Label>البحث</Label>
                <div className="relative">
                  <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder="ابحث بالاسم أو الإيميل أو الهاتف"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pr-10"
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label>الدور</Label>
                <Select value={roleFilter} onValueChange={setRoleFilter}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">جميع الأدوار</SelectItem>
                    <SelectItem value="owner">مالك العيادة</SelectItem>
                    <SelectItem value="clinic_owner">مالك العيادة</SelectItem>
                    <SelectItem value="doctor">طبيب</SelectItem>
                    <SelectItem value="assistant">مساعد طبيب</SelectItem>
                    <SelectItem value="doctor_assistant">مساعد طبيب</SelectItem>
                    <SelectItem value="secretary">سكرتير</SelectItem>
                    <SelectItem value="accountant">محاسب</SelectItem>
                    <SelectItem value="super_admin">مدير النظام</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>الحالة</Label>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">جميع الحالات</SelectItem>
                    <SelectItem value="active">نشط</SelectItem>
                    <SelectItem value="inactive">معطل</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>الإجراءات</Label>
                <Button 
                  variant="outline" 
                  className="w-full"
                  onClick={() => {
                    setSearchTerm("");
                    setRoleFilter("all");
                    setStatusFilter("all");
                  }}
                >
                  مسح الفلاتر
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Users List */}
        <Card>
          <CardHeader>
            <CardTitle>قائمة المستخدمين ({filteredUsers.length})</CardTitle>
            <CardDescription>جميع مستخدمي النظام مع تفاصيلهم الكاملة</CardDescription>
          </CardHeader>
          <CardContent>
            {filteredUsers.length === 0 ? (
              <div className="text-center py-8">
                <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">لا توجد نتائج للبحث الحالي</p>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredUsers.map((user) => (
                  <div key={user.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent/50 transition-colors">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-gradient-to-br from-blue-100 to-purple-100 rounded-full flex items-center justify-center">
                        <Users className="h-6 w-6 text-blue-600" />
                      </div>
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <p className="font-medium text-lg">{user.full_name}</p>
                          {user.user_id === currentUser?.id && (
                            <Badge variant="outline" className="text-xs">أنت</Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <Mail className="h-3 w-3" />
                            <span>معرف: {user.user_id}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            <span>انضم في {formatDate(user.created_at)}</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {getRoleBadge(user.role)}
                          {getStatusBadge(user.status)}
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-4">
                      <div className="text-center">
                        <div className="flex items-center gap-1 text-sm">
                          <Activity className="h-3 w-3" />
                          <span>الحالة</span>
                        </div>
                        <p className="text-xs text-muted-foreground">{user.status || 'غير محدد'}</p>
                      </div>
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline">
                          <Edit className="h-3 w-3" />
                        </Button>
                        <Button 
                          size="sm" 
                          variant={user.status === 'active' ? "destructive" : "default"}
                          onClick={() => toggleUserStatus(user.id, user.status || 'inactive')}
                          disabled={user.user_id === currentUser?.id}
                        >
                          {user.status === 'active' ? 'تعطيل' : 'تفعيل'}
                        </Button>
                      </div>
                    </div>
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
