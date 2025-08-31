import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { supabase } from '@/integrations/supabase/client';
import { AlertTriangle, Clock, CreditCard, Users, X } from 'lucide-react';

interface SubscriptionAlert {
  id: string;
  type: 'expiring' | 'expired' | 'usage_limit' | 'trial_ending';
  title: string;
  message: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  clinic_id: string;
  clinic_name: string;
  created_at: string;
}

export const SubscriptionNotifications = () => {
  const [alerts, setAlerts] = useState<SubscriptionAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [dismissedAlerts, setDismissedAlerts] = useState<Set<string>>(new Set());

  const fetchSubscriptionAlerts = async () => {
    try {
      // Get expiring subscriptions (within 30 days)
      const thirtyDaysFromNow = new Date();
      thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);

      const { data: expiringClinics } = await supabase
        .from('clinics')
        .select('id, name, subscription_end_date, trial_end_date')
        .not('subscription_end_date', 'is', null)
        .lte('subscription_end_date', thirtyDaysFromNow.toISOString())
        .gt('subscription_end_date', new Date().toISOString());

      // Get expired subscriptions
      const { data: expiredClinics } = await supabase
        .from('clinics')
        .select('id, name, subscription_end_date')
        .not('subscription_end_date', 'is', null)
        .lt('subscription_end_date', new Date().toISOString());

      // Get usage limit warnings
      const { data: usageWarnings } = await supabase
        .from('usage_tracking')
        .select(`
          clinic_id,
          metric_type,
          current_count,
          max_count,
          clinics (
            id,
            name
          )
        `);

      const newAlerts: SubscriptionAlert[] = [];

      // Process expiring subscriptions
      expiringClinics?.forEach(clinic => {
        const daysUntilExpiry = Math.ceil(
          (new Date(clinic.subscription_end_date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
        );
        
        newAlerts.push({
          id: `expiring-${clinic.id}`,
          type: 'expiring',
          title: `اشتراك ${clinic.name} ينتهي قريباً`,
          message: `سينتهي الاشتراك خلال ${daysUntilExpiry} يوم`,
          severity: daysUntilExpiry <= 7 ? 'critical' : daysUntilExpiry <= 15 ? 'high' : 'medium',
          clinic_id: clinic.id,
          clinic_name: clinic.name,
          created_at: new Date().toISOString()
        });
      });

      // Process expired subscriptions
      expiredClinics?.forEach(clinic => {
        newAlerts.push({
          id: `expired-${clinic.id}`,
          type: 'expired',
          title: `انتهت صلاحية اشتراك ${clinic.name}`,
          message: `انتهت صلاحية الاشتراك في ${new Date(clinic.subscription_end_date).toLocaleDateString('ar')}`,
          severity: 'critical',
          clinic_id: clinic.id,
          clinic_name: clinic.name,
          created_at: new Date().toISOString()
        });
      });

      // Process usage warnings
      usageWarnings?.forEach(usage => {
        const percentage = Math.round((usage.current_count / usage.max_count) * 100);
        if (percentage >= 80) { // Only show warnings for 80% or higher usage
          const clinic = usage.clinics as any;
          
          newAlerts.push({
            id: `usage-${usage.clinic_id}-${usage.metric_type}`,
            type: 'usage_limit',
            title: `تحذير استخدام: ${clinic.name}`,
            message: `تم استخدام ${percentage}% من حد ${usage.metric_type} (${usage.current_count}/${usage.max_count})`,
            severity: percentage >= 95 ? 'critical' : percentage >= 90 ? 'high' : 'medium',
            clinic_id: usage.clinic_id,
            clinic_name: clinic.name,
            created_at: new Date().toISOString()
          });
        }
      });

      setAlerts(newAlerts.filter(alert => !dismissedAlerts.has(alert.id)));
    } catch (error) {
      console.error('Error fetching subscription alerts:', error);
    } finally {
      setLoading(false);
    }
  };

  const dismissAlert = (alertId: string) => {
    setDismissedAlerts(prev => new Set([...prev, alertId]));
    setAlerts(prev => prev.filter(alert => alert.id !== alertId));
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'destructive';
      case 'high': return 'default';
      case 'medium': return 'secondary';
      default: return 'outline';
    }
  };

  const getAlertIcon = (type: string) => {
    switch (type) {
      case 'expiring':
      case 'trial_ending':
        return <Clock className="h-4 w-4" />;
      case 'expired':
        return <AlertTriangle className="h-4 w-4" />;
      case 'usage_limit':
        return <Users className="h-4 w-4" />;
      default:
        return <CreditCard className="h-4 w-4" />;
    }
  };

  useEffect(() => {
    fetchSubscriptionAlerts();
    // Refresh alerts every 5 minutes
    const interval = setInterval(fetchSubscriptionAlerts, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [dismissedAlerts]);

  if (loading) {
    return (
      <Card className="animate-pulse">
        <CardHeader>
          <div className="h-6 bg-muted rounded w-1/3"></div>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="h-4 bg-muted rounded"></div>
            <div className="h-4 bg-muted rounded w-3/4"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (alerts.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-green-600">✓ جميع الاشتراكات في حالة جيدة</CardTitle>
          <CardDescription>
            لا توجد تنبيهات متعلقة بالاشتراكات حالياً
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-amber-600" />
            تنبيهات الاشتراكات
          </CardTitle>
          <CardDescription>
            {alerts.length} تنبيه يتطلب انتباهك
          </CardDescription>
        </CardHeader>
      </Card>

      {alerts.map((alert) => (
        <Alert key={alert.id} className="relative">
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-3">
              {getAlertIcon(alert.type)}
              <div className="flex-1">
                <AlertTitle className="flex items-center gap-2">
                  {alert.title}
                  <Badge variant={getSeverityColor(alert.severity) as any}>
                    {alert.severity === 'critical' ? 'عاجل' : 
                     alert.severity === 'high' ? 'مهم' :
                     alert.severity === 'medium' ? 'متوسط' : 'منخفض'}
                  </Badge>
                </AlertTitle>
                <AlertDescription className="mt-1">
                  {alert.message}
                </AlertDescription>
                <div className="text-xs text-muted-foreground mt-2">
                  العيادة: {alert.clinic_name}
                </div>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => dismissAlert(alert.id)}
              className="h-8 w-8 p-0"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </Alert>
      ))}
    </div>
  );
};