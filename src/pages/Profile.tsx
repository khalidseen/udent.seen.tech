import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { PageContainer } from '@/components/layout/PageContainer';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/hooks/useAuth';
import { usePermissions } from '@/hooks/usePermissions';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { 
  User, 
  Shield, 
  Activity, 
  Edit,
  Lock,
  Clock,
  AlertTriangle,
  Eye,
  ChevronRight,
  Save,
  X
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
  clinic_id?: string;
}

interface SecurityEvent {
  id: string;
  event_type: string;
  created_at: string;
  ip_address: string;
  details: any;
}

export default function Profile() {
  const { userId } = useParams<{ userId?: string }>();
  const { user } = useAuth();
  const { hasPermission, userRoles } = usePermissions();
  const { toast } = useToast();
  
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [userPermissions, setUserPermissions] = useState<any[]>([]);
  const [securityEvents, setSecurityEvents] = useState<SecurityEvent[]>([]);
  const [activityStats, setActivityStats] = useState({ totalEvents: 0, recentActions: 0, securityAlerts: 0 });
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState('');
  const [changingPassword, setChangingPassword] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

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
      setEditName(profileData.full_name || '');

      // جلب صلاحيات المستخدم الفعلية
      const { data: effectivePermissions } = await supabase
        .rpc('get_user_effective_permissions', { user_id_param: targetUserId });
      setUserPermissions(effectivePermissions || []);

      // جلب أحداث الأمان الحقيقية
      const { data: events } = await supabase
        .from('security_events')
        .select('id, event_type, created_at, ip_address, details')
        .eq('user_id', targetUserId)
        .order('created_at', { ascending: false })
        .limit(20);
      setSecurityEvents(events || []);

      // حساب الإحصائيات الحقيقية
      const now = new Date();
      const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      const recentEvents = (events || []).filter(e => new Date(e.created_at) > weekAgo);
      const securityAlerts = (events || []).filter(e => 
        e.event_type?.includes('failed') || e.event_type?.includes('suspicious')
      );

      setActivityStats({
        totalEvents: (events || []).length,
        recentActions: recentEvents.length,
        securityAlerts: securityAlerts.length,
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

  const handleSaveName = async () => {
    if (!editName.trim() || !profile) return;
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ full_name: editName.trim(), updated_at: new Date().toISOString() })
        .eq('user_id', profile.user_id);
      if (error) throw error;
      setProfile({ ...profile, full_name: editName.trim() });
      setIsEditing(false);
      toast({ title: 'تم التحديث', description: 'تم تحديث الاسم بنجاح' });
    } catch (error) {
      toast({ title: 'خطأ', description: 'فشل في تحديث الاسم', variant: 'destructive' });
    }
  };

  const handleChangePassword = async () => {
    if (!newPassword || newPassword.length < 6) {
      toast({ title: 'خطأ', description: 'كلمة المرور يجب أن تكون 6 أحرف على الأقل', variant: 'destructive' });
      return;
    }
    if (newPassword !== confirmPassword) {
      toast({ title: 'خطأ', description: 'كلمتا المرور غير متطابقتين', variant: 'destructive' });
      return;
    }
    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) throw error;
      setChangingPassword(false);
      setNewPassword('');
      setConfirmPassword('');
      toast({ title: 'تم التحديث', description: 'تم تغيير كلمة المرور بنجاح' });
    } catch (error: any) {
      toast({ title: 'خطأ', description: error.message || 'فشل في تغيير كلمة المرور', variant: 'destructive' });
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
              <AlertTriangle className="h-5 w-5 text-destructive" />
              الملف الشخصي غير موجود
            </CardTitle>
          </CardHeader>
        </Card>
      </PageContainer>
    );
  }

  const getRoleColor = (role: string) => {
    const colors: Record<string, string> = {
      'super_admin': 'bg-destructive/10 text-destructive',
      'admin': 'bg-destructive/10 text-destructive',
      'clinic_owner': 'bg-primary/10 text-primary',
      'owner': 'bg-primary/10 text-primary',
      'doctor': 'bg-accent/20 text-accent-foreground',
      'receptionist': 'bg-secondary text-secondary-foreground',
      'financial_manager': 'bg-muted text-muted-foreground',
    };
    return colors[role] || 'bg-muted text-muted-foreground';
  };

  const getEventLabel = (eventType: string) => {
    const labels: Record<string, string> = {
      'authentication_success': 'تسجيل دخول ناجح',
      'authentication_failed': 'محاولة دخول فاشلة',
      'patients_INSERT': 'إضافة مريض',
      'patients_UPDATE': 'تعديل بيانات مريض',
      'patients_DELETE': 'حذف مريض',
      'appointments_INSERT': 'إنشاء موعد',
      'appointments_UPDATE': 'تعديل موعد',
      'invoices_INSERT': 'إنشاء فاتورة',
      'payments_INSERT': 'تسجيل دفعة',
    };
    return labels[eventType] || eventType;
  };

  const groupedPermissions = userPermissions.reduce((acc, permission) => {
    const category = permission.category || 'أخرى';
    if (!acc[category]) acc[category] = [];
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
                <AvatarFallback className="text-lg bg-primary text-primary-foreground">
                  {profile.full_name?.[0]?.toUpperCase() || 'U'}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                {isEditing ? (
                  <div className="flex items-center gap-2">
                    <Input value={editName} onChange={e => setEditName(e.target.value)} className="max-w-xs" />
                    <Button size="sm" onClick={handleSaveName}><Save className="w-4 h-4" /></Button>
                    <Button size="sm" variant="ghost" onClick={() => { setIsEditing(false); setEditName(profile.full_name); }}>
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                ) : (
                  <h2 className="text-2xl font-bold">{profile.full_name}</h2>
                )}
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
              {isViewingOwnProfile && !isEditing && (
                <Button variant="outline" className="gap-2" onClick={() => setIsEditing(true)}>
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
            {isViewingOwnProfile && (
              <TabsTrigger value="security" className="gap-2">
                <Lock className="w-4 h-4" />
                الأمان
              </TabsTrigger>
            )}
          </TabsList>

          {/* تبويب النظرة العامة */}
          <TabsContent value="overview" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-3">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">إجمالي الصلاحيات</CardTitle>
                  <Shield className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{userPermissions.length}</div>
                  <p className="text-xs text-muted-foreground">صلاحية نشطة</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">العمليات الأخيرة</CardTitle>
                  <Activity className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{activityStats.recentActions}</div>
                  <p className="text-xs text-muted-foreground">آخر 7 أيام</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">تنبيهات أمنية</CardTitle>
                  <AlertTriangle className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{activityStats.securityAlerts}</div>
                  <p className="text-xs text-muted-foreground">أحداث مشبوهة</p>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>معلومات الحساب</CardTitle>
              </CardHeader>
              <CardContent>
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
            {Object.keys(groupedPermissions).length === 0 ? (
              <Card>
                <CardContent className="py-8 text-center text-muted-foreground">
                  <Shield className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p>لا توجد صلاحيات مسجلة لهذا المستخدم</p>
                </CardContent>
              </Card>
            ) : (
              Object.entries(groupedPermissions).map(([category, categoryPermissions]) => (
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
                        <div key={permission.permission_key} className="flex items-center justify-between p-3 border rounded-lg">
                          <div className="flex-1">
                            <p className="font-medium text-sm">{permission.permission_name_ar}</p>
                            <p className="text-xs text-muted-foreground">{permission.permission_key}</p>
                          </div>
                          <Badge 
                            variant={permission.source === 'primary_role' ? 'default' : 'outline'} 
                            className="text-xs"
                          >
                            {permission.source === 'primary_role' ? 'أساسي' : 
                             permission.source === 'additional_role' ? 'إضافي' : 'مؤقت'}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </TabsContent>

          {/* تبويب النشاط */}
          <TabsContent value="activity" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>سجل النشاط الحديث</CardTitle>
                <CardDescription>آخر العمليات المسجلة من قاعدة البيانات</CardDescription>
              </CardHeader>
              <CardContent>
                {securityEvents.length === 0 ? (
                  <div className="py-8 text-center text-muted-foreground">
                    <Activity className="h-12 w-12 mx-auto mb-3 opacity-50" />
                    <p>لا توجد أحداث مسجلة بعد</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {securityEvents.slice(0, 15).map((event) => (
                      <div key={event.id} className="flex items-center gap-3 p-3 border rounded-lg">
                        <div className={`w-2 h-2 rounded-full ${
                          event.event_type?.includes('failed') || event.event_type?.includes('suspicious')
                            ? 'bg-destructive' 
                            : 'bg-primary'
                        }`} />
                        <div className="flex-1">
                          <p className="text-sm font-medium">{getEventLabel(event.event_type)}</p>
                          <p className="text-xs text-muted-foreground">
                            {format(new Date(event.created_at), 'dd/MM/yyyy HH:mm')}
                          </p>
                        </div>
                        <ChevronRight className="w-4 h-4 text-muted-foreground" />
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* تبويب الأمان - فقط للمستخدم نفسه */}
          {isViewingOwnProfile && (
            <TabsContent value="security" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Lock className="w-5 h-5" />
                    إعدادات الأمان
                  </CardTitle>
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
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>تغيير كلمة المرور</CardTitle>
                  <CardDescription>تحديث كلمة المرور لحماية حسابك</CardDescription>
                </CardHeader>
                <CardContent>
                  {changingPassword ? (
                    <div className="space-y-4 max-w-md">
                      <div>
                        <label className="text-sm font-medium">كلمة المرور الجديدة</label>
                        <Input 
                          type="password" 
                          value={newPassword} 
                          onChange={e => setNewPassword(e.target.value)}
                          placeholder="أدخل كلمة المرور الجديدة"
                        />
                      </div>
                      <div>
                        <label className="text-sm font-medium">تأكيد كلمة المرور</label>
                        <Input 
                          type="password" 
                          value={confirmPassword} 
                          onChange={e => setConfirmPassword(e.target.value)}
                          placeholder="أعد إدخال كلمة المرور"
                        />
                      </div>
                      <div className="flex gap-2">
                        <Button onClick={handleChangePassword} className="gap-2">
                          <Save className="w-4 h-4" />
                          حفظ
                        </Button>
                        <Button variant="ghost" onClick={() => { setChangingPassword(false); setNewPassword(''); setConfirmPassword(''); }}>
                          إلغاء
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <Button className="gap-2" onClick={() => setChangingPassword(true)}>
                      <Lock className="w-4 h-4" />
                      تغيير كلمة المرور
                    </Button>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          )}
        </Tabs>
      </div>
    </PageContainer>
  );
}
