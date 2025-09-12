// Enhanced error handling utilities for the dental app

export interface AppError {
  code?: string;
  message: string;
  type: 'network' | 'server' | 'client' | 'permission' | 'extension';
  severity: 'low' | 'medium' | 'high';
  fallbackData?: any;
}

export class ErrorHandler {
  private static logError(error: AppError) {
    console.error(`[${error.type.toUpperCase()}] ${error.message}`, error);
  }

  static handleSupabaseError(error: any, context: string): AppError {
    // Handle 500 server errors
    if (error?.code === '500' || error?.message?.includes('500')) {
      return {
        code: '500',
        message: `خطأ في الخادم - ${context}`,
        type: 'server',
        severity: 'medium',
        fallbackData: this.getFallbackData(context)
      };
    }

    // Handle network errors
    if (error?.message?.includes('NetworkError') || error?.message?.includes('fetch')) {
      return {
        code: 'NETWORK_ERROR',
        message: 'خطأ في الاتصال بالشبكة',
        type: 'network',
        severity: 'high',
        fallbackData: this.getFallbackData(context)
      };
    }

    // Handle permission errors
    if (error?.message?.includes('permission') || error?.code === '42501') {
      return {
        code: 'PERMISSION_DENIED',
        message: 'ليس لديك صلاحية للوصول لهذه البيانات',
        type: 'permission',
        severity: 'medium',
        fallbackData: this.getFallbackData(context)
      };
    }

    // Generic error
    return {
      message: error?.message || 'خطأ غير معروف',
      type: 'client',
      severity: 'low'
    };
  }

  static handleChromeExtensionError(error: any): AppError {
    if (error?.message?.includes('Extension context invalidated') ||
        error?.message?.includes('chrome-extension') ||
        error?.message?.includes('disconnected port')) {
      return {
        code: 'EXTENSION_ERROR',
        message: 'خطأ في امتداد المتصفح - لا يؤثر على التطبيق',
        type: 'extension',
        severity: 'low'
      };
    }

    return {
      message: 'خطأ في امتداد المتصفح',
      type: 'extension',
      severity: 'low'
    };
  }

  private static getFallbackData(context: string): any {
    switch (context) {
      case 'permissions':
        return [{
          permission_key: 'view_dashboard',
          permission_name: 'View Dashboard',
          permission_name_ar: 'عرض لوحة التحكم',
          category: 'dashboard'
        }];
      
      case 'roles':
        return [{
          role_name: 'user',
          role_name_ar: 'مستخدم',
          is_primary: true
        }];
      
      case 'patients':
        return [];
      
      default:
        return null;
    }
  }

  static shouldShowToast(error: AppError): boolean {
    // Don't show toasts for extension errors or low severity errors
    return error.type !== 'extension' && error.severity !== 'low';
  }

  static shouldRetry(error: AppError): boolean {
    // Retry network errors and some server errors
    return error.type === 'network' || 
           (error.type === 'server' && error.code !== '500');
  }

  static getRetryDelay(attempt: number): number {
    // Exponential backoff: 1s, 2s, 4s, 8s
    return Math.min(1000 * Math.pow(2, attempt), 8000);
  }
}

// Global error handler setup
export function setupGlobalErrorHandling() {
  // Handle unhandled promise rejections
  window.addEventListener('unhandledrejection', (event) => {
    const error = ErrorHandler.handleSupabaseError(event.reason, 'global');
    
    // Prevent default only for extension errors
    if (error.type === 'extension') {
      event.preventDefault();
    }
    
    ErrorHandler['logError'](error);
  });

  // Handle Chrome extension errors
  window.addEventListener('error', (event) => {
    if (event.message && (
      event.message.includes('Extension context invalidated') ||
      event.message.includes('chrome-extension') ||
      event.message.includes('Attempting to use a disconnected port')
    )) {
      event.preventDefault();
      const error = ErrorHandler.handleChromeExtensionError(event);
      ErrorHandler['logError'](error);
      return false;
    }
  });
}
