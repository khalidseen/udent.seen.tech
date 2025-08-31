import { ReactNode, useState, useEffect } from 'react';
import { useUsageLimits } from '@/hooks/useUsageLimits';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { AlertTriangle, Zap } from 'lucide-react';

interface UsageLimitProtectionProps {
  metricType: string;
  incrementBy?: number;
  children: ReactNode;
  fallback?: ReactNode;
  showWarningOnly?: boolean;
}

export const UsageLimitProtection = ({
  metricType,
  incrementBy = 1,
  children,
  fallback,
  showWarningOnly = false
}: UsageLimitProtectionProps) => {
  const { checkUsageLimit, getUsageStatus, limits } = useUsageLimits();
  const [canProceed, setCanProceed] = useState(true);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkLimit = async () => {
      try {
        const hasCapacity = await checkUsageLimit(metricType);
        const status = getUsageStatus(metricType);
        
        // If showing warning only, always allow but show status
        if (showWarningOnly) {
          setCanProceed(true);
        } else {
          setCanProceed(hasCapacity);
        }
      } catch (error) {
        console.error('Error checking usage limit:', error);
        setCanProceed(false);
      } finally {
        setLoading(false);
      }
    };

    checkLimit();
  }, [metricType, checkUsageLimit, getUsageStatus, showWarningOnly]);

  if (loading) {
    return (
      <div className="animate-pulse">
        <div className="h-8 bg-muted rounded"></div>
      </div>
    );
  }

  const currentLimit = limits.find(l => l.metric_type === metricType);
  const usageStatus = getUsageStatus(metricType);

  // Show warning if usage is high (>75%)
  if (usageStatus.percentage > 75) {
    const warningLevel = usageStatus.percentage >= 90 ? 'critical' : 'warning';
    
    return (
      <div className="space-y-4">
        <Alert variant={warningLevel === 'critical' ? 'destructive' : 'default'}>
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>
            {warningLevel === 'critical' ? 'تحذير عاجل' : 'تنبيه استخدام'}
          </AlertTitle>
          <AlertDescription>
            لقد استخدمت {usageStatus.percentage.toFixed(1)}% من حدود {metricType}.
            الاستخدام الحالي: {currentLimit?.current_count}/{currentLimit?.max_count}
            {warningLevel === 'critical' && (
              <div className="mt-2">
                <Button size="sm" variant="outline">
                  <Zap className="h-4 w-4 mr-2" />
                  ترقية الخطة
                </Button>
              </div>
            )}
          </AlertDescription>
        </Alert>
        
        {(canProceed || showWarningOnly) && children}
      </div>
    );
  }

  // If limit exceeded and not showing warning only
  if (!canProceed && !showWarningOnly) {
    if (fallback) {
      return <>{fallback}</>;
    }

    return (
      <Alert variant="destructive">
        <AlertTriangle className="h-4 w-4" />
        <AlertTitle>تم الوصول للحد الأقصى</AlertTitle>
        <AlertDescription>
          لقد وصلت إلى الحد الأقصى المسموح لـ{metricType} ({currentLimit?.max_count}).
          يرجى ترقية خطتك للمتابعة.
          <div className="mt-2">
            <Button size="sm">
              <Zap className="h-4 w-4 mr-2" />
              ترقية الخطة الآن
            </Button>
          </div>
        </AlertDescription>
      </Alert>
    );
  }

  return <>{children}</>;
};