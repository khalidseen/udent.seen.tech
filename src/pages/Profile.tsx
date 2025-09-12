import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { PageContainer } from '@/components/layout/PageContainer';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/hooks/useAuth';
import { usePermissions } from '@/hooks/usePermissions';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { PermissionGate } from '@/components/auth/PermissionGate';
import { 
  User, 
  Calendar, 
  Shield, 
  Activity, 
  Eye, 
  Edit,
  Lock,
  Clock,
  AlertTriangle,
  Settings,
  FileText,
  ChevronRight
} from 'lucide-react';
import { format } from 'date-fns';

interface UserProfile {
  id: string;
  user_id: string;
  full_name: string;
  role: string;
  status: string;
  created_at: string;
  updated_at: string;
}

interface UserActivity {
  login_count: number;
  last_login: string;
  recent_actions: number;
  security_events: number;
}

export default function Profile() {
  const { userId } = useParams<{ userId?: string }>();
  const { user } = useAuth();
  const { hasPermission, permissions, userRoles } = usePermissions();
  const { toast } = useToast();
  
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [userPermissions, setUserPermissions] = useState<any[]>([]);
  const [userActivity, setUserActivity] = useState<UserActivity | null>(null);
  const [loading, setLoading] = useState(true);

  const isViewingOwnProfile = !userId || userId === user?.id;
  const canViewOtherProfiles = hasPermission('profiles.view_all');

  useEffect(() => {
    if (!isViewingOwnProfile && !canViewOtherProfiles) {
      toast({
        title: 'غير مصرح بالوصول',
        description: 'ليس لديك صلاحية لعرض ملفات المستخدمين الآخرين',
        variant: 'destructive',
      });
      return;
    }
    
    fetchUserProfile();
  }, [userId, user?.id]);

  const fetchUserProfile = async () => {
    try {
      setLoading(true);
      const targetUserId = userId || user?.id;

      // جلب معلومات الملف الشخصي
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', targetUserId)
        .single();

      if (profileError) throw profileError;
      setProfile(profileData);

      // جلب صلاحيات المستخدم الفعلية
      const { data: effectivePermissions, error: permissionsError } = await supabase
        .rpc('get_user_effective_permissions', { user_id_param: targetUserId });

      if (permissionsError) throw permissionsError;
      setUserPermissions(effectivePermissions || []);

      // جلب إحصائيات النشاط (محاكاة)
      setUserActivity({
        login_count: Math.floor(Math.random() * 100) + 10,
        last_login: new Date().toISOString(),
        recent_actions: Math.floor(Math.random() * 50) + 5,
        security_events: Math.floor(Math.random() * 10)
      });

    } catch (error) {
      console.error('Error fetching user profile:', error);
      toast({
        title: 'خطأ في جلب البيانات',
        description: 'حدث خطأ أثناء جلب بيانات الملف الشخصي',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <PageContainer>
        <div className="flex items-center justify-center p-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p>جاري تحميل الملف الشخصي...</p>
          </div>
        </div>
      </PageContainer>
    );
  }

  if (!profile) {
    return (
      <PageContainer>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-warning" />
              الملف الشخصي غير موجود
            </CardTitle>
            <CardDescription>
              لم يتم العثور على الملف الشخصي المطلوب
            </CardDescription>
          </CardHeader>
        </Card>
      </PageContainer>
    );
  }

  const getRoleColor = (role: string) => {
    const colors: Record<string, string> = {
      'super_admin': 'bg-red-100 text-red-800',
      'clinic_owner': 'bg-purple-100 text-purple-800',
      'doctor': 'bg-green-100 text-green-800',
      'receptionist': 'bg-blue-100 text-blue-800',
      'financial_manager': 'bg-yellow-100 text-yellow-800',
    };
    return colors[role] || 'bg-gray-100 text-gray-800';
  };

  const groupedPermissions = userPermissions.reduce((acc, permission) => {
    const category = permission.category || 'أخرى';
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(permission);
    return acc;
  }, {} as Record<string, any[]>);

  return (
    <PageContainer>
      <PageHeader 
        title={isViewingOwnProfile ? "ملفي الشخصي" : `ملف ${profile.full_name}`}
        description={isViewingOwnProfile ? "إدارة معلوماتك الشخصية وإعداداتك" : "عرض تفاصيل المستخدم"}
      />

      <div className="space-y-6" dir="rtl">
        {/* بطاقة المعلومات الأساسية */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-4">
              <Avatar className="h-16 w-16">
                <AvatarFallback className="text-lg">
                  {profile.full_name?.[0]?.toUpperCase() || 'U'}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <h2 className="text-2xl font-bold">{profile.full_name}</h2>
                <div className="flex items-center gap-2 mt-2">
                  <Badge className={getRoleColor(profile.role)}>
                    {userRoles.find(r => r.role_name === profile.role)?.role_name_ar || profile.role}
                  </Badge>
                  <Badge variant={profile.status === 'approved' ? 'default' : 'secondary'}>
                    {profile.status === 'approved' ? 'نشط' : 'معلق'}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground mt-1">
                  عضو منذ {format(new Date(profile.created_at), 'dd/MM/yyyy')}
                </p>
              </div>
              {isViewingOwnProfile && (
                <Button variant="outline" className="gap-2">
                  <Edit className="w-4 h-4" />
                  تعديل الملف
                </Button>
              )}
            </div>
          </CardHeader>
        </Card>

        <Tabs defaultValue="overview" className="space-y-4">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview" className="gap-2">
              <User className="w-4 h-4" />
              نظرة عامة
            </TabsTrigger>
            <TabsTrigger value="permissions" className="gap-2">
              <Shield className="w-4 h-4" />
              الصلاحيات
            </TabsTrigger>
            <TabsTrigger value="activity" className="gap-2">
              <Activity className="w-4 h-4" />
              النشاط
            </TabsTrigger>
            <TabsTrigger value="security" className="gap-2">
              <Lock className="w-4 h-4" />
              الأمان
            </TabsTrigger>
          </TabsList>

          {/* تبويب النظرة العامة */}
          <TabsContent value="overview" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">إجمالي الصلاحيات</CardTitle>
                  <Shield className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{userPermissions.length}</div>
                  <p className="text-xs text-muted-foreground">
                    صلاحية نشطة
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">آخر دخول</CardTitle>
                  <Clock className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">اليوم</div>
                  <p className="text-xs text-muted-foreground">
                    {userActivity && format(new Date(userActivity.last_login), 'HH:mm')}
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">العمليات الحديثة</CardTitle>
                  <Activity className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{userActivity?.recent_actions || 0}</div>
                  <p className="text-xs text-muted-foreground">
                    آخر 7 أيام
                  </p>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>معلومات الحساب</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">الاسم الكامل</label>
                    <p className="text-sm">{profile.full_name}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">الدور</label>
                    <p className="text-sm">{userRoles.find(r => r.role_name === profile.role)?.role_name_ar || profile.role}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">تاريخ الانضمام</label>
                    <p className="text-sm">{format(new Date(profile.created_at), 'dd/MM/yyyy HH:mm')}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">آخر تحديث</label>
                    <p className="text-sm">{format(new Date(profile.updated_at), 'dd/MM/yyyy HH:mm')}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* تبويب الصلاحيات */}
          <TabsContent value="permissions" className="space-y-4">
          {Object.entries(groupedPermissions).map(([category, categoryPermissions]) => (
            <Card key={category}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="w-5 h-5" />
                  {category}
                  <Badge variant="outline">{(categoryPermissions as any[]).length}</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                  {(categoryPermissions as any[]).map((permission) => (
                      <div
                        key={permission.permission_key}
                        className="flex items-center justify-between p-3 border rounded-lg"
                      >
                        <div className="flex-1">
                          <p className="font-medium text-sm">{permission.permission_name_ar}</p>
                          <p className="text-xs text-muted-foreground">{permission.permission_key}</p>
                        </div>
                        <div className="flex flex-col gap-1">
                          <Badge variant="secondary" className="text-xs">
                            {permission.permission_name}
                          </Badge>
                          <Badge 
                            variant={permission.source === 'primary_role' ? 'default' : 'outline'} 
                            className="text-xs"
                          >
                            {permission.source === 'primary_role' ? 'أساسي' : 
                             permission.source === 'additional_role' ? 'إضافي' : 'مؤقت'}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </TabsContent>

          {/* تبويب النشاط */}
          <TabsContent value="activity" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>إحصائيات الدخول</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between">
                    <span>إجمالي مرات الدخول:</span>
                    <span className="font-bold">{userActivity?.login_count || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>آخر دخول:</span>
                    <span className="font-bold">
                      {userActivity && format(new Date(userActivity.last_login), 'dd/MM/yyyy HH:mm')}
                    </span>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>نشاط النظام</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between">
                    <span>العمليات الحديثة:</span>
                    <span className="font-bold">{userActivity?.recent_actions || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>أحداث الأمان:</span>
                    <span className="font-bold">{userActivity?.security_events || 0}</span>
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>سجل النشاط الحديث</CardTitle>
                <CardDescription>آخر العمليات المنجزة</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {[...Array(5)].map((_, i) => (
                    <div key={i} className="flex items-center gap-3 p-3 border rounded-lg">
                      <div className="w-2 h-2 bg-primary rounded-full"></div>
                      <div className="flex-1">
                        <p className="text-sm font-medium">تم تسجيل الدخول بنجاح</p>
                        <p className="text-xs text-muted-foreground">
                          {format(new Date(Date.now() - i * 1000 * 60 * 60), 'dd/MM/yyyy HH:mm')}
                        </p>
                      </div>
                      <ChevronRight className="w-4 h-4 text-muted-foreground" />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* تبويب الأمان */}
          <TabsContent value="security" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Lock className="w-5 h-5" />
                  إعدادات الأمان
                </CardTitle>
                <CardDescription>
                  إدارة الأمان والخصوصية للحساب
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <p className="font-medium">المصادقة الثنائية</p>
                    <p className="text-sm text-muted-foreground">حماية إضافية للحساب</p>
                  </div>
                  <Badge variant="outline">غير مفعل</Badge>
                </div>

                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <p className="font-medium">إشعارات الأمان</p>
                    <p className="text-sm text-muted-foreground">تنبيهات عمليات الدخول المشبوهة</p>
                  </div>
                  <Badge variant="default">مفعل</Badge>
                </div>

                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <p className="font-medium">سجل الأمان</p>
                    <p className="text-sm text-muted-foreground">عرض سجل أحداث الأمان</p>
                  </div>
                  <Button variant="outline" size="sm">
                    <Eye className="w-4 h-4 mr-2" />
                    عرض
                  </Button>
                </div>
              </CardContent>
            </Card>

            {isViewingOwnProfile && (
              <Card>
                <CardHeader>
                  <CardTitle>تغيير كلمة المرور</CardTitle>
                  <CardDescription>
                    تحديث كلمة المرور لحماية حسابك
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button className="gap-2">
                    <Lock className="w-4 h-4" />
                    تغيير كلمة المرور
                  </Button>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </PageContainer>
  );
}