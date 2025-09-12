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
import { useLanguage } from '@/contexts/LanguageContext';

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
  const { t } = useLanguage();

  const quickActions: QuickAction[] = [
    {
      id: 'add-patient',
      title: t("quickActions.addPatient"),
      description: t("quickActions.addPatientDesc"),
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
      title: t("quickActions.scheduleAppointment"),
      description: t("quickActions.scheduleAppointmentDesc"),
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
      title: t("quickActions.emergencyContact"),
      description: t("quickActions.emergencyContactDesc"),
      icon: <Phone className="w-4 h-4" />,
      action: () => {
        toast({
          title: t("common.loading"),
          description: t("quickActions.emergencyContactDesc"),
        });
      },
      priority: 'high',
      category: 'admin'
    },
    {
      id: 'quick-search',
      title: t("quickActions.quickSearch"),
      description: t("quickActions.quickSearchDesc"),
      icon: <Search className="w-4 h-4" />,
      action: () => {
        const searchQuery = prompt(t("quickActions.quickSearchDesc"));
        if (searchQuery) {
          toast({
            title: t("common.loading"),
            description: `${t("common.search")}: ${searchQuery}`,
          });
        }
      },
      permission: 'patients.view',
      priority: 'medium',
      category: 'patient'
    },
    {
      id: 'medical-record',
      title: t("quickActions.medicalRecord"),
      description: t("quickActions.medicalRecordDesc"),
      icon: <FileText className="w-4 h-4" />,
      action: () => {
        toast({
          title: "Coming Soon",
          description: t("quickActions.medicalRecordDesc"),
        });
      },
      permission: 'medical_records.create',
      priority: 'medium',
      category: 'medical'
    },
    {
      id: 'send-reminder',
      title: t("quickActions.sendReminder"),
      description: t("quickActions.sendReminderDesc"),
      icon: <Bell className="w-4 h-4" />,
      action: () => {
        toast({
          title: t("common.success"),
          description: t("quickActions.sendReminderDesc"),
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
            {t("quickActions.title")}
          </CardTitle>
          <CardDescription>
            {t("quickActions.description")}
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
                       {t(`quickActions.priority.${action.priority}`)}
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
              <p>{t("quickActions.noActions")}</p>
              <p className="text-sm">{t("quickActions.checkPermissions")}</p>
            </div>
          )}
        </CardContent>
      </Card>
    </>
  );
};