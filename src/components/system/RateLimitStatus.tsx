/**
 * Rate Limit Status Component
 * 
 * عرض حالة Rate Limit للمستخدم
 */

import { useEffect, useState } from 'react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { AlertCircle, Clock, Shield } from 'lucide-react';
import { useRateLimiter, formatWaitTime } from '@/middleware/rateLimiter';
import { Card } from '@/components/ui/card';

interface RateLimitStatusProps {
  limiterType?: 'auth' | 'api' | 'sensitive' | 'heavy' | 'read';
  showProgress?: boolean;
  variant?: 'inline' | 'card' | 'alert';
}

export const RateLimitStatus = ({ 
  limiterType = 'api',
  showProgress = true,
  variant = 'inline'
}: RateLimitStatusProps) => {
  const { getInfo } = useRateLimiter(limiterType);
  const [info, setInfo] = useState<{
    remaining: number;
    total: number;
    resetTime: Date;
    isBlocked: boolean;
  } | null>(null);

  useEffect(() => {
    const fetchInfo = async () => {
      const data = await getInfo();
      setInfo(data);
    };

    fetchInfo();
    const interval = setInterval(fetchInfo, 5000); // تحديث كل 5 ثواني

    return () => clearInterval(interval);
  }, [getInfo]);

  if (!info) return null;

  const percentage = (info.remaining / info.total) * 100;
  const waitTime = info.isBlocked 
    ? formatWaitTime(info.resetTime.getTime() - Date.now())
    : null;

  // Inline variant
  if (variant === 'inline') {
    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Shield className="w-4 h-4" />
        <span>
          {info.remaining} / {info.total} طلب متبقي
        </span>
        {showProgress && (
          <Progress 
            value={percentage} 
            className="w-20 h-2"
          />
        )}
      </div>
    );
  }

  // Card variant
  if (variant === 'card') {
    return (
      <Card className="p-4">
        <div className="flex items-start gap-3">
          <Shield className="w-5 h-5 text-primary mt-0.5" />
          <div className="flex-1 space-y-2">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-medium">حالة الطلبات</h4>
              <span className="text-xs text-muted-foreground">
                {info.remaining} / {info.total}
              </span>
            </div>
            {showProgress && (
              <Progress value={percentage} className="h-2" />
            )}
            {info.isBlocked && waitTime && (
              <p className="text-xs text-destructive flex items-center gap-1">
                <Clock className="w-3 h-3" />
                تم الحظر. حاول بعد {waitTime}
              </p>
            )}
            {!info.isBlocked && (
              <p className="text-xs text-muted-foreground">
                يتم إعادة التعيين في {new Date(info.resetTime).toLocaleTimeString('ar-SA')}
              </p>
            )}
          </div>
        </div>
      </Card>
    );
  }

  // Alert variant
  if (info.isBlocked) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>تم تجاوز الحد المسموح</AlertTitle>
        <AlertDescription>
          لقد تجاوزت الحد المسموح من الطلبات. يرجى المحاولة مرة أخرى بعد {waitTime}.
        </AlertDescription>
      </Alert>
    );
  }

  if (percentage < 20) {
    return (
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>تحذير</AlertTitle>
        <AlertDescription>
          لديك {info.remaining} طلب متبقي فقط. سيتم إعادة التعيين في{' '}
          {new Date(info.resetTime).toLocaleTimeString('ar-SA')}.
        </AlertDescription>
      </Alert>
    );
  }

  return null;
};

/**
 * Rate Limit Error Message Component
 */
interface RateLimitErrorProps {
  waitTime: number;
  message?: string;
}

export const RateLimitError = ({ waitTime, message }: RateLimitErrorProps) => {
  const [countdown, setCountdown] = useState(waitTime);

  useEffect(() => {
    const interval = setInterval(() => {
      setCountdown((prev) => {
        const next = prev - 1000;
        if (next <= 0) {
          clearInterval(interval);
          window.location.reload(); // إعادة تحميل الصفحة عند انتهاء الوقت
        }
        return next;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] p-6">
      <div className="bg-destructive/10 rounded-full p-6 mb-6">
        <AlertCircle className="w-16 h-16 text-destructive" />
      </div>
      
      <h2 className="text-2xl font-bold text-center mb-3">
        تم تجاوز الحد المسموح
      </h2>
      
      <p className="text-center text-muted-foreground mb-6 max-w-md">
        {message || 'لقد تجاوزت الحد المسموح من الطلبات. يرجى الانتظار قليلاً قبل المحاولة مرة أخرى.'}
      </p>

      <div className="flex items-center gap-2 text-lg font-medium">
        <Clock className="w-5 h-5" />
        <span>الوقت المتبقي: {formatWaitTime(countdown)}</span>
      </div>

      <Progress 
        value={((waitTime - countdown) / waitTime) * 100} 
        className="w-full max-w-md mt-4"
      />
    </div>
  );
};

/**
 * Rate Limit Badge Component
 */
interface RateLimitBadgeProps {
  remaining: number;
  total: number;
}

export const RateLimitBadge = ({ remaining, total }: RateLimitBadgeProps) => {
  const percentage = (remaining / total) * 100;
  
  let color = 'bg-green-500';
  if (percentage < 50) color = 'bg-yellow-500';
  if (percentage < 20) color = 'bg-red-500';

  return (
    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-secondary text-secondary-foreground text-sm">
      <div className={`w-2 h-2 rounded-full ${color}`} />
      <span>{remaining} / {total}</span>
    </div>
  );
};

export default RateLimitStatus;
