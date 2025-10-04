/**
 * useRateLimitProtection Hook
 * 
 * Hook مخصص لحماية أي عملية بـ Rate Limiting
 */

import { useState, useCallback } from 'react';
import { useRateLimiter, RateLimitError } from '@/middleware/rateLimiter';
import { useToast } from '@/hooks/use-toast';

type RateLimiterType = 'auth' | 'api' | 'sensitive' | 'heavy' | 'read';

interface UseRateLimitProtectionOptions {
  limiterType?: RateLimiterType;
  onBlocked?: (waitTime: number) => void;
  showToast?: boolean;
}

interface ProtectedAction<T> {
  execute: () => Promise<T>;
  onSuccess?: (result: T) => void;
  onError?: (error: Error) => void;
}

export const useRateLimitProtection = (options: UseRateLimitProtectionOptions = {}) => {
  const {
    limiterType = 'api',
    onBlocked,
    showToast = true,
  } = options;

  const { consume, getInfo } = useRateLimiter(limiterType);
  const { toast } = useToast();
  const [isBlocked, setIsBlocked] = useState(false);
  const [waitTime, setWaitTime] = useState(0);

  /**
   * تنفيذ عملية محمية بـ Rate Limiting
   */
  const executeProtected = useCallback(
    async <T,>(action: ProtectedAction<T>): Promise<T | null> => {
      try {
        // فحص Rate Limit
        const result = await consume();

        if (!result.success) {
          setIsBlocked(true);
          setWaitTime(result.waitTime || 0);

          if (showToast) {
            toast({
              title: "تم تجاوز الحد المسموح",
              description: result.message || "حاول مرة أخرى لاحقاً",
              variant: "destructive",
            });
          }

          if (onBlocked && result.waitTime) {
            onBlocked(result.waitTime);
          }

          throw new RateLimitError(
            result.message || 'Rate limit exceeded',
            result.waitTime || 0,
            result.remaining
          );
        }

        // تنفيذ العملية
        const actionResult = await action.execute();

        if (action.onSuccess) {
          action.onSuccess(actionResult);
        }

        return actionResult;
      } catch (error) {
        if (error instanceof RateLimitError) {
          throw error;
        }

        if (action.onError && error instanceof Error) {
          action.onError(error);
        }

        throw error;
      }
    },
    [consume, showToast, toast, onBlocked]
  );

  /**
   * التحقق من حالة Rate Limit
   */
  const checkStatus = useCallback(async () => {
    const info = await getInfo();
    return info;
  }, [getInfo]);

  /**
   * إعادة تعيين حالة الحظر
   */
  const resetBlock = useCallback(() => {
    setIsBlocked(false);
    setWaitTime(0);
  }, []);

  return {
    executeProtected,
    checkStatus,
    resetBlock,
    isBlocked,
    waitTime,
  };
};

export default useRateLimitProtection;
