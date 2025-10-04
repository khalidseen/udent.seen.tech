/**
 * Rate Limiting Middleware
 * 
 * يوفر حماية ضد هجمات DDoS و Brute Force
 * يحد من عدد الطلبات من IP واحد في فترة زمنية محددة
 */

import { RateLimiterMemory, RateLimiterRes } from 'rate-limiter-flexible';

// ================================================
// التكوينات الأساسية
// ================================================

/**
 * معدلات Rate Limiting المختلفة حسب نوع العملية
 */
export const RATE_LIMIT_CONFIG = {
  // للمصادقة (تسجيل الدخول، التسجيل)
  AUTH: {
    points: 5, // 5 محاولات
    duration: 15 * 60, // خلال 15 دقيقة
    blockDuration: 15 * 60, // حظر لمدة 15 دقيقة
  },
  
  // للـ API العامة
  API: {
    points: 100, // 100 طلب
    duration: 15 * 60, // خلال 15 دقيقة
    blockDuration: 5 * 60, // حظر لمدة 5 دقائق
  },
  
  // للعمليات الحساسة (إنشاء، تعديل، حذف)
  SENSITIVE: {
    points: 20, // 20 عملية
    duration: 60, // خلال دقيقة واحدة
    blockDuration: 2 * 60, // حظر لمدة دقيقتين
  },
  
  // للعمليات الثقيلة (تحميل الملفات، التقارير)
  HEAVY: {
    points: 10, // 10 عمليات
    duration: 60, // خلال دقيقة
    blockDuration: 5 * 60, // حظر لمدة 5 دقائق
  },
  
  // للقراءة فقط (GET requests)
  READ: {
    points: 200, // 200 طلب
    duration: 60, // خلال دقيقة
    blockDuration: 60, // حظر لمدة دقيقة
  },
} as const;

// ================================================
// Rate Limiters
// ================================================

/**
 * Rate Limiter للمصادقة (Login, Register)
 * - 5 محاولات كحد أقصى خلال 15 دقيقة
 * - حظر لمدة 15 دقيقة عند التجاوز
 */
export const authRateLimiter = new RateLimiterMemory({
  points: RATE_LIMIT_CONFIG.AUTH.points,
  duration: RATE_LIMIT_CONFIG.AUTH.duration,
  blockDuration: RATE_LIMIT_CONFIG.AUTH.blockDuration,
});

/**
 * Rate Limiter للـ API العامة
 * - 100 طلب خلال 15 دقيقة
 * - حظر لمدة 5 دقائق عند التجاوز
 */
export const apiRateLimiter = new RateLimiterMemory({
  points: RATE_LIMIT_CONFIG.API.points,
  duration: RATE_LIMIT_CONFIG.API.duration,
  blockDuration: RATE_LIMIT_CONFIG.API.blockDuration,
});

/**
 * Rate Limiter للعمليات الحساسة
 * - 20 عملية خلال دقيقة
 * - حظر لمدة دقيقتين عند التجاوز
 */
export const sensitiveRateLimiter = new RateLimiterMemory({
  points: RATE_LIMIT_CONFIG.SENSITIVE.points,
  duration: RATE_LIMIT_CONFIG.SENSITIVE.duration,
  blockDuration: RATE_LIMIT_CONFIG.SENSITIVE.blockDuration,
});

/**
 * Rate Limiter للعمليات الثقيلة
 * - 10 عمليات خلال دقيقة
 * - حظر لمدة 5 دقائق عند التجاوز
 */
export const heavyRateLimiter = new RateLimiterMemory({
  points: RATE_LIMIT_CONFIG.HEAVY.points,
  duration: RATE_LIMIT_CONFIG.HEAVY.duration,
  blockDuration: RATE_LIMIT_CONFIG.HEAVY.blockDuration,
});

/**
 * Rate Limiter للقراءة فقط
 * - 200 طلب خلال دقيقة
 * - حظر لمدة دقيقة عند التجاوز
 */
export const readRateLimiter = new RateLimiterMemory({
  points: RATE_LIMIT_CONFIG.READ.points,
  duration: RATE_LIMIT_CONFIG.READ.duration,
  blockDuration: RATE_LIMIT_CONFIG.READ.blockDuration,
});

// ================================================
// Helper Functions
// ================================================

/**
 * الحصول على IP Address من Request
 */
export const getClientIp = (): string => {
  // في بيئة المتصفح، نستخدم معرف فريد من localStorage
  const storedIp = localStorage.getItem('client_ip');
  if (storedIp) return storedIp;
  
  // إنشاء معرف فريد للمتصفح
  const uniqueId = `browser_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  localStorage.setItem('client_ip', uniqueId);
  return uniqueId;
};

/**
 * فحص Rate Limit
 * @param limiter - Rate Limiter المراد استخدامه
 * @param key - مفتاح التعريف (عادة IP address)
 * @returns Promise<RateLimiterRes | null> - null إذا كان محظور
 */
export const checkRateLimit = async (
  limiter: RateLimiterMemory,
  key?: string
): Promise<RateLimiterRes | null> => {
  const identifier = key || getClientIp();
  
  try {
    const result = await limiter.consume(identifier);
    return result;
  } catch (error) {
    // المستخدم تجاوز الحد
    if (error instanceof Error && 'msBeforeNext' in error) {
      return null;
    }
    throw error;
  }
};

/**
 * الحصول على معلومات Rate Limit
 */
export const getRateLimitInfo = async (
  limiter: RateLimiterMemory,
  key?: string
): Promise<{
  remaining: number;
  total: number;
  resetTime: Date;
  isBlocked: boolean;
}> => {
  const identifier = key || getClientIp();
  
  try {
    const res = await limiter.get(identifier);
    
    if (!res) {
      // لم يتم استخدام Rate Limit بعد
      return {
        remaining: limiter.points,
        total: limiter.points,
        resetTime: new Date(Date.now() + limiter.duration * 1000),
        isBlocked: false,
      };
    }
    
    return {
      remaining: res.remainingPoints,
      total: limiter.points,
      resetTime: new Date(Date.now() + res.msBeforeNext),
      isBlocked: res.remainingPoints <= 0,
    };
  } catch (error) {
    console.error('Error getting rate limit info:', error);
    return {
      remaining: 0,
      total: limiter.points,
      resetTime: new Date(Date.now() + limiter.duration * 1000),
      isBlocked: true,
    };
  }
};

/**
 * إعادة تعيين Rate Limit لمستخدم معين
 */
export const resetRateLimit = async (
  limiter: RateLimiterMemory,
  key?: string
): Promise<void> => {
  const identifier = key || getClientIp();
  await limiter.delete(identifier);
};

/**
 * Format وقت الانتظار
 */
export const formatWaitTime = (ms: number): string => {
  const seconds = Math.ceil(ms / 1000);
  
  if (seconds < 60) {
    return `${seconds} ثانية`;
  }
  
  const minutes = Math.ceil(seconds / 60);
  
  if (minutes < 60) {
    return `${minutes} دقيقة`;
  }
  
  const hours = Math.ceil(minutes / 60);
  return `${hours} ساعة`;
};

// ================================================
// React Hooks
// ================================================

/**
 * Hook لاستخدام Rate Limiter في مكونات React
 */
export const useRateLimiter = (limiterType: 'auth' | 'api' | 'sensitive' | 'heavy' | 'read' = 'api') => {
  const getLimiter = () => {
    switch (limiterType) {
      case 'auth':
        return authRateLimiter;
      case 'api':
        return apiRateLimiter;
      case 'sensitive':
        return sensitiveRateLimiter;
      case 'heavy':
        return heavyRateLimiter;
      case 'read':
        return readRateLimiter;
      default:
        return apiRateLimiter;
    }
  };
  
  const limiter = getLimiter();
  
  /**
   * فحص إذا كان يمكن إجراء الطلب
   */
  const canProceed = async (): Promise<boolean> => {
    const result = await checkRateLimit(limiter);
    return result !== null;
  };
  
  /**
   * استهلاك نقطة من Rate Limit
   */
  const consume = async (): Promise<{
    success: boolean;
    remaining: number;
    waitTime?: number;
    message?: string;
  }> => {
    try {
      const result = await checkRateLimit(limiter);
      
      if (result === null) {
        const info = await getRateLimitInfo(limiter);
        const waitMs = info.resetTime.getTime() - Date.now();
        
        return {
          success: false,
          remaining: 0,
          waitTime: waitMs,
          message: `تم تجاوز الحد المسموح. حاول مرة أخرى بعد ${formatWaitTime(waitMs)}`,
        };
      }
      
      return {
        success: true,
        remaining: result.remainingPoints,
      };
    } catch (error) {
      console.error('Rate limit error:', error);
      return {
        success: false,
        remaining: 0,
        message: 'حدث خطأ في التحقق من الحد المسموح',
      };
    }
  };
  
  /**
   * الحصول على معلومات Rate Limit
   */
  const getInfo = async () => {
    return getRateLimitInfo(limiter);
  };
  
  /**
   * إعادة تعيين Rate Limit
   */
  const reset = async () => {
    await resetRateLimit(limiter);
  };
  
  return {
    canProceed,
    consume,
    getInfo,
    reset,
    limiter,
  };
};

// ================================================
// Error Types
// ================================================

export class RateLimitError extends Error {
  constructor(
    message: string,
    public waitTime: number,
    public remaining: number = 0
  ) {
    super(message);
    this.name = 'RateLimitError';
  }
}

// ================================================
// Utilities
// ================================================

/**
 * Decorator لحماية الدوال بـ Rate Limiting
 */
export const withRateLimit = (
  limiterType: 'auth' | 'api' | 'sensitive' | 'heavy' | 'read' = 'api'
) => {
  return function (
    target: any,
    propertyKey: string,
    descriptor: PropertyDescriptor
  ) {
    const originalMethod = descriptor.value;
    
    descriptor.value = async function (...args: any[]) {
      const limiter = {
        auth: authRateLimiter,
        api: apiRateLimiter,
        sensitive: sensitiveRateLimiter,
        heavy: heavyRateLimiter,
        read: readRateLimiter,
      }[limiterType];
      
      const result = await checkRateLimit(limiter);
      
      if (result === null) {
        const info = await getRateLimitInfo(limiter);
        const waitMs = info.resetTime.getTime() - Date.now();
        throw new RateLimitError(
          `تم تجاوز الحد المسموح. حاول مرة أخرى بعد ${formatWaitTime(waitMs)}`,
          waitMs
        );
      }
      
      return originalMethod.apply(this, args);
    };
    
    return descriptor;
  };
};

// ================================================
// Export Default Configuration
// ================================================

export default {
  authRateLimiter,
  apiRateLimiter,
  sensitiveRateLimiter,
  heavyRateLimiter,
  readRateLimiter,
  checkRateLimit,
  getRateLimitInfo,
  resetRateLimit,
  formatWaitTime,
  useRateLimiter,
  RateLimitError,
  withRateLimit,
  RATE_LIMIT_CONFIG,
};
