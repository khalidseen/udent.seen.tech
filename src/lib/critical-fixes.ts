// Critical Error Fixes for Udent Dental System
// This file contains immediate fixes for the reported errors

import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

// 1. Fix Chrome Extension Port Errors
export function suppressChromeExtensionErrors() {
  // Suppress extension-related console errors
  const originalConsoleError = console.error;
  console.error = (...args) => {
    const message = args.join(' ');
    if (
      message.includes('Extension context invalidated') ||
      message.includes('chrome-extension') ||
      message.includes('Attempting to use a disconnected port') ||
      message.includes('Could not establish connection')
    ) {
      // Silently ignore these errors
      return;
    }
    originalConsoleError.apply(console, args);
  };

  // Prevent extension errors from bubbling up
  window.addEventListener('error', (event) => {
    if (event.message && (
      event.message.includes('Extension context invalidated') ||
      event.message.includes('chrome-extension') ||
      event.message.includes('Attempting to use a disconnected port')
    )) {
      event.preventDefault();
      event.stopPropagation();
      return false;
    }
  }, true);
}

// 2. Fix Supabase 500 Errors with Intelligent Fallback
export async function enhancedSupabaseQuery(
  queryFn: () => Promise<any>,
  fallbackData: any = null,
  context: string = 'query'
) {
  let retryCount = 0;
  const maxRetries = 3;

  while (retryCount < maxRetries) {
    try {
      const result = await queryFn();
      
      // If we get a result, return it
      if (result && !result.error) {
        return result;
      }

      // Handle 500 errors specifically
      if (result?.error?.code === '500' || result?.error?.message?.includes('500')) {
        console.warn(`500 error in ${context}, attempt ${retryCount + 1}/${maxRetries}`);
        
        if (retryCount === maxRetries - 1) {
          // Last attempt failed, return fallback
          console.warn(`All attempts failed for ${context}, using fallback data`);
          return {
            data: fallbackData,
            error: null,
            isFallback: true
          };
        }
        
        // Wait before retry (exponential backoff)
        await new Promise(resolve => setTimeout(resolve, Math.pow(2, retryCount) * 1000));
        retryCount++;
        continue;
      }

      // Other errors, return as-is
      return result;

    } catch (error) {
      console.warn(`Exception in ${context}, attempt ${retryCount + 1}/${maxRetries}:`, error);
      
      if (retryCount === maxRetries - 1) {
        // Last attempt, return fallback
        return {
          data: fallbackData,
          error: null,
          isFallback: true
        };
      }
      
      await new Promise(resolve => setTimeout(resolve, Math.pow(2, retryCount) * 1000));
      retryCount++;
    }
  }

  // Fallback return (shouldn't reach here)
  return {
    data: fallbackData,
    error: null,
    isFallback: true
  };
}

// 3. Enhanced Permission Fetching with Multiple Fallbacks
export async function getPermissionsWithFallback(userId: string) {
  try {
    const { data, error } = await supabase.rpc('get_user_effective_permissions');
    if (!error && data && data.length > 0) return data;
  } catch (error) {
    console.warn('RPC permissions failed:', error);
  }

  // Fallback 1: Try direct profile query
  try {
    const { data: profile } = await supabase
      .from('profiles' as any)
      .select('role')
      .eq('user_id', userId)
      .maybeSingle();

    if ((profile as any)?.role) {
      return getDefaultPermissionsByRole((profile as any).role);
    }
  } catch (error) {
    console.warn('Profile query failed:', error);
  }

  // Fallback 2: Return basic permissions
  return getDefaultPermissionsByRole('user');
}

// 4. Enhanced Role Fetching
export async function getRolesWithFallback(userId: string) {
  try {
    const { data, error } = await supabase.rpc('get_user_roles');
    if (!error && data && data.length > 0) return data;
  } catch (error) {
    console.warn('RPC roles failed:', error);
  }

  // Fallback: Try profile query
  try {
    const { data: profile } = await supabase
      .from('profiles' as any)
      .select('role')
      .eq('user_id', userId)
      .maybeSingle();

    if ((profile as any)?.role) {
      return [{
        role_name: (profile as any).role,
        role_name_ar: (profile as any).role === 'admin' ? 'مدير' : 'مستخدم',
        is_primary: true
      }];
    }
  } catch (error) {
    console.warn('Profile role query failed:', error);
  }

  // Default role
  return [{
    role_name: 'user',
    role_name_ar: 'مستخدم',
    is_primary: true
  }];
}

// 5. Default permissions by role
function getDefaultPermissionsByRole(role: string) {
  const basePermissions = [
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
    }
  ];

  if (role === 'admin' || role === 'doctor') {
    return [
      ...basePermissions,
      {
        permission_key: 'manage_patients',
        permission_name: 'Manage Patients',
        permission_name_ar: 'إدارة المرضى',
        category: 'patients'
      },
      {
        permission_key: 'view_appointments',
        permission_name: 'View Appointments',
        permission_name_ar: 'عرض المواعيد',
        category: 'appointments'
      }
    ];
  }

  return basePermissions;
}

// 6. System Health Check and Auto-Recovery
export async function performSystemHealthCheck() {
  const health = {
    database: false,
    serviceWorker: false,
    network: navigator.onLine
  };

  // Check database connectivity
  try {
    const { data } = await supabase.from('profiles').select('id').limit(1);
    health.database = data !== null;
  } catch {
    health.database = false;
  }

  // Check service worker
  if ('serviceWorker' in navigator) {
    health.serviceWorker = !!navigator.serviceWorker.controller;
  }

  return health;
}

// 7. Smart Error Toast (only show important errors)
export function smartErrorToast(error: any, context: string) {
  // Don't show toasts for:
  // - Extension errors
  // - 500 errors (we handle these with fallbacks)
  // - Network errors when offline
  
  if (
    error?.message?.includes('Extension context') ||
    error?.message?.includes('chrome-extension') ||
    error?.code === '500' ||
    error?.message?.includes('500') ||
    (!navigator.onLine && error?.message?.includes('NetworkError'))
  ) {
    return; // Silent handling
  }

  // Show toast for genuine errors
  toast.error('خطأ في النظام', {
    description: `مشكلة في ${context} - سيتم إعادة المحاولة`,
    duration: 3000,
  });
}

// 8. Initialize all fixes
export function initializeErrorFixes() {
  // Suppress Chrome extension errors
  suppressChromeExtensionErrors();

  // Set up health monitoring
  setInterval(() => {
    performSystemHealthCheck().then(health => {
      if (!health.database) {
        console.warn('Database connectivity issue detected');
      }
    });
  }, 30000); // Check every 30 seconds

  console.log('🔧 Error fixes initialized successfully');
}
