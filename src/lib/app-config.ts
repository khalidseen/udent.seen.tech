// Enhanced application configuration and error recovery

export const APP_CONFIG = {
  // Error handling settings
  errors: {
    maxRetries: 3,
    retryDelay: 1000,
    showExtensionErrors: false,
    fallbackTimeout: 5000,
  },

  // Cache settings
  cache: {
    permissions: 3 * 60 * 1000, // 3 minutes
    roles: 3 * 60 * 1000, // 3 minutes
    user: 5 * 60 * 1000, // 5 minutes
    staticAssets: 24 * 60 * 60 * 1000, // 24 hours
  },

  // Supabase settings
  supabase: {
    retryAttempts: 2,
    timeout: 10000,
    fallbackEnabled: true,
  },

  // Service Worker settings
  serviceWorker: {
    enabled: true,
    updateCheckInterval: 60000, // 1 minute
    cacheStrategy: 'networkFirst',
  },

  // Development settings
  development: {
    showDebugLogs: process.env.NODE_ENV === 'development',
    enableStrictMode: process.env.NODE_ENV === 'development',
    mockData: false,
  },
};

// Fallback data for when services are unavailable
export const FALLBACK_DATA = {
  permissions: [
    {
      permission_key: 'view_dashboard',
      permission_name: 'View Dashboard', 
      permission_name_ar: 'عرض لوحة التحكم',
      category: 'dashboard'
    },
    {
      permission_key: 'view_patients',
      permission_name: 'View Patients',
      permission_name_ar: 'عرض المرضى', 
      category: 'patients'
    },
    {
      permission_key: 'view_appointments',
      permission_name: 'View Appointments',
      permission_name_ar: 'عرض المواعيد',
      category: 'appointments'
    }
  ],

  roles: [
    {
      role_name: 'user',
      role_name_ar: 'مستخدم',
      is_primary: true
    }
  ],

  userProfile: {
    role: 'user',
    name: 'مستخدم',
    permissions: ['view_dashboard', 'view_patients', 'view_appointments']
  }
};

// Error messages in Arabic
export const ERROR_MESSAGES = {
  ar: {
    network: 'خطأ في الاتصال بالشبكة',
    server: 'خطأ في الخادم',
    permission: 'ليس لديك صلاحية للوصول',
    extension: 'خطأ في امتداد المتصفح',
    unknown: 'خطأ غير معروف',
    fallback: 'جاري استخدام البيانات المحفوظة مؤقتاً',
    retry: 'سيتم إعادة المحاولة تلقائياً'
  },
  en: {
    network: 'Network connection error',
    server: 'Server error',
    permission: 'Permission denied',
    extension: 'Browser extension error',
    unknown: 'Unknown error',
    fallback: 'Using cached data temporarily',
    retry: 'Will retry automatically'
  }
};

// Health check utilities
export class AppHealthChecker {
  private static healthStatus = {
    supabase: 'unknown',
    serviceWorker: 'unknown',
    network: 'unknown',
    lastCheck: 0
  };

  static async checkHealth() {
    const now = Date.now();
    
    // Only check every 30 seconds
    if (now - this.healthStatus.lastCheck < 30000) {
      return this.healthStatus;
    }

    try {
      // Check Supabase connectivity
      const response = await fetch('https://lxusbjpvcyjcfrnyselc.supabase.co/rest/v1/', {
        method: 'HEAD',
        headers: {
          'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx4dXNianB2Y3lqY2ZybnlzZWxjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM4OTk1OTUsImV4cCI6MjA2OTQ3NTU5NX0.-UZM4oHEbJ52j_VBmEOJtmODhkkScc4I3yxgz9ckbVM'
        }
      });
      
      this.healthStatus.supabase = response.ok ? 'healthy' : 'unhealthy';
    } catch {
      this.healthStatus.supabase = 'unhealthy';
    }

    // Check Service Worker
    this.healthStatus.serviceWorker = 'serviceWorker' in navigator && 
      navigator.serviceWorker.controller ? 'healthy' : 'unhealthy';

    // Check Network
    this.healthStatus.network = navigator.onLine ? 'healthy' : 'unhealthy';
    
    this.healthStatus.lastCheck = now;
    
    return this.healthStatus;
  }

  static getHealthStatus() {
    return this.healthStatus;
  }
}
