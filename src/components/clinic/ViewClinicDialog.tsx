import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Building2, Users, Phone, Mail, MapPin, Calendar, CreditCard } from 'lucide-react';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';

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

interface ViewClinicDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  clinic: Clinic | null;
  embedded?: boolean;
}

export function ViewClinicDialog({ open, onOpenChange, clinic, embedded = false }: ViewClinicDialogProps) {
  if (!clinic) return null;

  const getSubscriptionPlanName = (plan: string) => {
    switch (plan) {
      case 'premium': return 'مميز';
      case 'professional': return 'احترافي';
      default: return 'أساسي';
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

  const content = (
    <div className="space-y-6">
      {/* Basic Information */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">المعلومات الأساسية</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-muted-foreground">اسم العيادة</label>
              <p className="text-sm">{clinic.name}</p>
            </div>
            
            <div>
              <label className="text-sm font-medium text-muted-foreground">رقم الترخيص</label>
              <p className="text-sm">{clinic.license_number || 'غير محدد'}</p>
            </div>
            
            <div className="flex items-center space-x-2 space-x-reverse">
              <Phone className="h-4 w-4 text-muted-foreground" />
              <div>
                <label className="text-sm font-medium text-muted-foreground">الهاتف</label>
                <p className="text-sm">{clinic.phone || 'غير محدد'}</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-2 space-x-reverse">
              <Mail className="h-4 w-4 text-muted-foreground" />
              <div>
                <label className="text-sm font-medium text-muted-foreground">البريد الإلكتروني</label>
                <p className="text-sm">{clinic.email || 'غير محدد'}</p>
              </div>
            </div>
          </div>
          
          <div className="flex items-center space-x-2 space-x-reverse">
            <MapPin className="h-4 w-4 text-muted-foreground" />
            <div className="flex-1">
              <label className="text-sm font-medium text-muted-foreground">العنوان</label>
              <p className="text-sm">{clinic.address || 'غير محدد'}</p>
              {clinic.city && (
                <p className="text-xs text-muted-foreground">{clinic.city}</p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Subscription & Limits */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center space-x-2 space-x-reverse">
            <CreditCard className="h-5 w-5" />
            <span>الاشتراك والحدود</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">خطة الاشتراك</span>
            <Badge 
              variant={getSubscriptionColor(clinic.subscription_plan, clinic.subscription_status)}
            >
              {getSubscriptionPlanName(clinic.subscription_plan)}
            </Badge>
          </div>
          
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">حالة الاشتراك</span>
            <Badge variant={clinic.subscription_status === 'active' ? 'default' : 'destructive'}>
              {clinic.subscription_status === 'active' ? 'نشط' : 'معطل'}
            </Badge>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center p-3 bg-muted rounded-lg">
              <div className="text-2xl font-bold text-primary">{clinic.max_users}</div>
              <div className="text-xs text-muted-foreground">الحد الأقصى للمستخدمين</div>
            </div>
            
            <div className="text-center p-3 bg-muted rounded-lg">
              <div className="text-2xl font-bold text-primary">{clinic.max_patients}</div>
              <div className="text-xs text-muted-foreground">الحد الأقصى للمرضى</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Usage Statistics */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center space-x-2 space-x-reverse">
            <Users className="h-5 w-5" />
            <span>إحصائيات الاستخدام</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center p-3 border rounded-lg">
              <div className="text-2xl font-bold text-blue-600">{clinic.user_count || 0}</div>
              <div className="text-xs text-muted-foreground">المستخدمين الحاليين</div>
              <div className="text-xs text-muted-foreground">
                من أصل {clinic.max_users}
              </div>
            </div>
            
            <div className="text-center p-3 border rounded-lg">
              <div className="text-2xl font-bold text-green-600">{clinic.patient_count || 0}</div>
              <div className="text-xs text-muted-foreground">المرضى الحاليين</div>
              <div className="text-xs text-muted-foreground">
                من أصل {clinic.max_patients}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Creation Date */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center space-x-2 space-x-reverse">
            <Calendar className="h-5 w-5" />
            <span>معلومات إضافية</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">تاريخ الإنشاء</span>
            <span className="text-sm text-muted-foreground">
              {format(new Date(clinic.created_at), 'dd MMMM yyyy', { locale: ar })}
            </span>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  if (embedded) {
    return content;
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2 space-x-reverse">
            <Building2 className="h-5 w-5 text-primary" />
            <span>{clinic.name}</span>
            <Badge 
              variant={clinic.is_active ? "default" : "destructive"}
              className="text-xs"
            >
              {clinic.is_active ? 'نشط' : 'معطل'}
            </Badge>
          </DialogTitle>
          <DialogDescription>
            تفاصيل العيادة ومعلومات الاشتراك
          </DialogDescription>
        </DialogHeader>
        {content}
      </DialogContent>
    </Dialog>
  );
}