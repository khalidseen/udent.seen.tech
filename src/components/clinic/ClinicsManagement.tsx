import { useState, useEffect } from 'react';
import { Plus, Building2, Users, Settings, Eye } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { CreateClinicDialog } from './CreateClinicDialog';
import { ViewClinicDialog } from './ViewClinicDialog';
import { usePermissions } from '@/hooks/usePermissions';
import { PermissionGate } from '@/components/auth/PermissionGate';

interface Clinic {
  id: string;
  name: string;
  license_number: string;
  phone: string;
  email: string;
  address: string;
  city: string;
  subscription_plan: string;
  subscription_status: string;
  max_users: number;
  max_patients: number;
  is_active: boolean;
  created_at: string;
  user_count?: number;
  patient_count?: number;
}

export function ClinicsManagement() {
  const [clinics, setClinics] = useState<Clinic[]>([]);
  const [loading, setLoading] = useState(true);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [selectedClinic, setSelectedClinic] = useState<Clinic | null>(null);
  const { toast } = useToast();

  const fetchClinics = async () => {
    try {
      const { data, error } = await supabase
        .from('clinics')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Get user and patient counts for each clinic
      const clinicsWithCounts = await Promise.all(
        (data || []).map(async (clinic) => {
          const [userCountResult, patientCountResult] = await Promise.all([
            supabase
              .from('profiles')
              .select('id', { count: 'exact' })
              .eq('clinic_id', clinic.id),
            supabase
              .from('patients')
              .select('id', { count: 'exact' })
              .eq('clinic_id', clinic.id)
          ]);

          return {
            ...clinic,
            user_count: userCountResult.count || 0,
            patient_count: patientCountResult.count || 0
          };
        })
      );

      setClinics(clinicsWithCounts);
    } catch (error) {
      console.error('Error fetching clinics:', error);
      toast({
        title: "خطأ",
        description: "فشل في تحميل بيانات العيادات",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClinics();
  }, []);

  const handleCreateClinic = () => {
    setCreateDialogOpen(false);
    fetchClinics();
  };

  const handleViewClinic = (clinic: Clinic) => {
    setSelectedClinic(clinic);
    setViewDialogOpen(true);
  };

  const toggleClinicStatus = async (clinicId: string, isActive: boolean) => {
    try {
      const { error } = await supabase
        .from('clinics')
        .update({ is_active: !isActive })
        .eq('id', clinicId);

      if (error) throw error;

      toast({
        title: "تم التحديث",
        description: `تم ${!isActive ? 'تفعيل' : 'إلغاء تفعيل'} العيادة بنجاح`,
      });

      fetchClinics();
    } catch (error) {
      console.error('Error updating clinic status:', error);
      toast({
        title: "خطأ",
        description: "فشل في تحديث حالة العيادة",
        variant: "destructive",
      });
    }
  };

  const getSubscriptionColor = (plan: string, status: string) => {
    if (status !== 'active') return 'destructive';
    
    switch (plan) {
      case 'premium': return 'default';
      case 'professional': return 'secondary';
      default: return 'outline';
    }
  };

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[...Array(6)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader className="space-y-2">
              <div className="h-6 bg-muted rounded w-3/4"></div>
              <div className="h-4 bg-muted rounded w-1/2"></div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="h-4 bg-muted rounded w-full"></div>
                <div className="h-4 bg-muted rounded w-2/3"></div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold text-foreground">إدارة العيادات</h2>
          <p className="text-muted-foreground">
            إدارة جميع العيادات في النظام
          </p>
        </div>
        
        <PermissionGate permissions={['clinic.create', 'system.manage_all_clinics']}>
          <Button onClick={() => setCreateDialogOpen(true)}>
            <Plus className="ml-2 h-4 w-4" />
            إضافة عيادة جديدة
          </Button>
        </PermissionGate>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {clinics.map((clinic) => (
          <Card key={clinic.id} className="hover:shadow-md transition-shadow">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex items-center space-x-2 space-x-reverse">
                  <Building2 className="h-5 w-5 text-primary" />
                  <CardTitle className="text-lg">{clinic.name}</CardTitle>
                </div>
                <Badge 
                  variant={clinic.is_active ? "default" : "destructive"}
                  className="text-xs"
                >
                  {clinic.is_active ? 'نشط' : 'معطل'}
                </Badge>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">
                  رقم الترخيص: {clinic.license_number || 'غير محدد'}
                </p>
                <Badge 
                  variant={getSubscriptionColor(clinic.subscription_plan, clinic.subscription_status)}
                  className="text-xs"
                >
                  {clinic.subscription_plan === 'basic' && 'أساسي'}
                  {clinic.subscription_plan === 'professional' && 'احترافي'}
                  {clinic.subscription_plan === 'premium' && 'مميز'}
                </Badge>
              </div>
            </CardHeader>
            
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="flex items-center space-x-2 space-x-reverse">
                  <Users className="h-4 w-4 text-muted-foreground" />
                  <span>{clinic.user_count || 0} مستخدم</span>
                </div>
                <div className="flex items-center space-x-2 space-x-reverse">
                  <Users className="h-4 w-4 text-muted-foreground" />
                  <span>{clinic.patient_count || 0} مريض</span>
                </div>
              </div>

              <div className="text-xs text-muted-foreground space-y-1">
                <p>الهاتف: {clinic.phone || 'غير محدد'}</p>
                <p>البريد: {clinic.email || 'غير محدد'}</p>
                <p>العنوان: {clinic.address || 'غير محدد'}</p>
              </div>

              <div className="flex space-x-2 space-x-reverse">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleViewClinic(clinic)}
                  className="flex-1"
                >
                  <Eye className="ml-1 h-4 w-4" />
                  عرض
                </Button>
                
                <PermissionGate permissions={['system.manage_all_clinics']}>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => toggleClinicStatus(clinic.id, clinic.is_active)}
                    className="flex-1"
                  >
                    <Settings className="ml-1 h-4 w-4" />
                    {clinic.is_active ? 'إلغاء تفعيل' : 'تفعيل'}
                  </Button>
                </PermissionGate>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <CreateClinicDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
        onSuccess={handleCreateClinic}
      />

      <ViewClinicDialog
        open={viewDialogOpen}
        onOpenChange={setViewDialogOpen}
        clinic={selectedClinic}
      />
    </div>
  );
}