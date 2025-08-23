import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Plus, 
  Calendar, 
  Users, 
  FileText, 
  Phone, 
  MessageSquare,
  Clock,
  Stethoscope,
  Bell,
  Search
} from 'lucide-react';
import { usePermissions } from '@/hooks/usePermissions';
import { useToast } from '@/hooks/use-toast';

interface QuickAction {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  action: () => void;
  permission?: string;
  priority: 'high' | 'medium' | 'low';
  category: 'patient' | 'appointment' | 'medical' | 'admin';
}

export const QuickActionCenter: React.FC = () => {
  const { hasPermission } = usePermissions();
  const { toast } = useToast();

  const quickActions: QuickAction[] = [
    {
      id: 'add-patient',
      title: 'إضافة مريض جديد',
      description: 'تسجيل مريض جديد في النظام',
      icon: <Users className="w-4 h-4" />,
      action: () => {
        window.open('/patients', '_blank');
      },
      permission: 'patients.create',
      priority: 'high',
      category: 'patient'
    },
    {
      id: 'schedule-appointment',
      title: 'حجز موعد',
      description: 'إنشاء موعد جديد للمريض',
      icon: <Calendar className="w-4 h-4" />,
      action: () => {
        window.open('/appointments/new', '_blank');
      },
      permission: 'appointments.create',
      priority: 'high',
      category: 'appointment'
    },
    {
      id: 'emergency-contact',
      title: 'اتصال طارئ',
      description: 'الاتصال بخدمة الطوارئ',
      icon: <Phone className="w-4 h-4" />,
      action: () => {
        toast({
          title: 'جاري الاتصال...',
          description: 'يتم توصيلك بخدمة الطوارئ',
        });
      },
      priority: 'high',
      category: 'admin'
    },
    {
      id: 'quick-search',
      title: 'بحث سريع',
      description: 'البحث في قاعدة بيانات المرضى',
      icon: <Search className="w-4 h-4" />,
      action: () => {
        // فتح نافذة البحث السريع
        const searchQuery = prompt('ادخل اسم المريض أو رقم الهوية:');
        if (searchQuery) {
          toast({
            title: 'جاري البحث...',
            description: `البحث عن: ${searchQuery}`,
          });
        }
      },
      permission: 'patients.view',
      priority: 'medium',
      category: 'patient'
    },
    {
      id: 'medical-record',
      title: 'سجل طبي جديد',
      description: 'إنشاء سجل طبي أو تشخيص',
      icon: <FileText className="w-4 h-4" />,
      action: () => {
        toast({
          title: 'قريباً',
          description: 'هذه الميزة ستكون متاحة قريباً',
        });
      },
      permission: 'medical_records.create',
      priority: 'medium',
      category: 'medical'
    },
    {
      id: 'send-reminder',
      title: 'إرسال تذكير',
      description: 'إرسال تذكير للمرضى بمواعيدهم',
      icon: <Bell className="w-4 h-4" />,
      action: () => {
        toast({
          title: 'تم الإرسال',
          description: 'تم إرسال التذكيرات للمرضى',
        });
      },
      permission: 'notifications.send',
      priority: 'low',
      category: 'appointment'
    }
  ];

  const filteredActions = quickActions.filter(action => 
    !action.permission || hasPermission(action.permission)
  );

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'destructive';
      case 'medium': return 'default';
      case 'low': return 'secondary';
      default: return 'default';
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'patient': return <Users className="w-3 h-3" />;
      case 'appointment': return <Calendar className="w-3 h-3" />;
      case 'medical': return <Stethoscope className="w-3 h-3" />;
      case 'admin': return <MessageSquare className="w-3 h-3" />;
      default: return <Plus className="w-3 h-3" />;
    }
  };

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Plus className="w-5 h-5" />
            مركز الإجراءات السريعة
          </CardTitle>
          <CardDescription>
            إجراءات مهمة يمكن تنفيذها بسرعة
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
            {filteredActions.map((action) => (
              <Button
                key={action.id}
                variant="outline"
                className="h-auto p-4 flex flex-col items-start space-y-2 hover:bg-accent"
                onClick={action.action}
              >
                <div className="flex items-center justify-between w-full">
                  <div className="flex items-center gap-2">
                    {action.icon}
                    <Badge 
                      variant={getPriorityColor(action.priority)} 
                      className="text-xs"
                    >
                      {action.priority === 'high' && 'عاجل'}
                      {action.priority === 'medium' && 'متوسط'}
                      {action.priority === 'low' && 'عادي'}
                    </Badge>
                  </div>
                  {getCategoryIcon(action.category)}
                </div>
                <div className="text-left w-full">
                  <h4 className="font-medium text-sm">{action.title}</h4>
                  <p className="text-xs text-muted-foreground mt-1">
                    {action.description}
                  </p>
                </div>
              </Button>
            ))}
          </div>

          {filteredActions.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              <Clock className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>لا توجد إجراءات متاحة حالياً</p>
              <p className="text-sm">تحقق من صلاحياتك أو تواصل مع المدير</p>
            </div>
          )}
        </CardContent>
      </Card>
    </>
  );
};