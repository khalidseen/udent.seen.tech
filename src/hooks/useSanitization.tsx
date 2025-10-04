/**
 * React Hook لتكامل خدمة التنظيف مع React Hook Form
 * Sanitization Integration Hook
 * 
 * هذا الـ Hook يوفر طريقة سهلة لتكامل خدمة التنظيف مع النماذج
 * ويمنع تلقائياً أي بيانات خطرة من الإرسال
 * 
 * الاستخدام:
 * ```tsx
 * const { sanitize, isSafe } = useSanitization();
 * 
 * const onSubmit = async (data) => {
 *   const cleanData = sanitize(data);
 *   if (!cleanData) {
 *     toast.error('البيانات تحتوي على محتوى غير آمن');
 *     return;
 *   }
 *   // إرسال البيانات النظيفة
 *   await submitData(cleanData);
 * };
 * ```
 */

import { useState, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';
import sanitizationService from '@/utils/sanitization';

// ====================================================================
// Types
// ====================================================================

interface SanitizationOptions {
  allowHTML?: boolean;
  allowedFields?: string[];
  showToast?: boolean;
  onThreat?: (threats: string[]) => void;
}

interface SanitizationResult<T> {
  data: T | null;
  safe: boolean;
  threats: string[];
}

// ====================================================================
// Hook الرئيسي
// ====================================================================

export function useSanitization(options: SanitizationOptions = {}) {
  const { toast } = useToast();
  const [lastThreats, setLastThreats] = useState<string[]>([]);
  
  const {
    allowHTML = false,
    allowedFields,
    showToast = true,
    onThreat,
  } = options;
  
  /**
   * تنظيف البيانات والتحقق من الأمان
   */
  const sanitize = useCallback(<T extends Record<string, any>>(
    data: T
  ): T | null => {
    try {
      // فحص الأمان أولاً
      const dataString = JSON.stringify(data);
      const check = sanitizationService.securityCheck(dataString);
      
      if (!check.safe) {
        setLastThreats(check.threats);
        
        // عرض رسالة للمستخدم
        if (showToast) {
          toast({
            title: '⚠️ تحذير أمني',
            description: `تم اكتشاف محاولة هجوم: ${check.threats.join(', ')}`,
            variant: 'destructive',
          });
        }
        
        // استدعاء callback إذا وجد
        if (onThreat) {
          onThreat(check.threats);
        }
        
        // تسجيل الهجوم للمراقبة
        console.error('🚨 Security threat detected:', {
          threats: check.threats,
          data: dataString.substring(0, 100), // أول 100 حرف فقط
          timestamp: new Date().toISOString(),
        });
        
        return null;
      }
      
      // تنظيف البيانات
      const cleaned = sanitizationService.sanitizeObject(data, {
        allowHTML,
        allowedFields,
      });
      
      setLastThreats([]);
      return cleaned;
      
    } catch (error) {
      console.error('Error during sanitization:', error);
      
      if (showToast) {
        toast({
          title: '❌ خطأ',
          description: 'حدث خطأ أثناء معالجة البيانات',
          variant: 'destructive',
        });
      }
      
      return null;
    }
  }, [allowHTML, allowedFields, showToast, onThreat, toast]);
  
  /**
   * فحص قيمة واحدة فقط
   */
  const checkValue = useCallback((value: string): boolean => {
    const check = sanitizationService.securityCheck(value);
    return check.safe;
  }, []);
  
  /**
   * تنظيف نص عادي
   */
  const sanitizeText = useCallback((text: string): string => {
    return sanitizationService.sanitizeString(text);
  }, []);
  
  /**
   * تنظيف HTML
   */
  const sanitizeHTMLContent = useCallback((html: string): string => {
    return sanitizationService.sanitizeHTML(html);
  }, []);
  
  return {
    sanitize,
    checkValue,
    sanitizeText,
    sanitizeHTMLContent,
    lastThreats,
    isSafe: lastThreats.length === 0,
  };
}

// ====================================================================
// Hook لمراقبة حقل معين في النموذج
// ====================================================================

export function useSanitizedField(
  fieldValue: string | undefined,
  fieldName: string
) {
  const [isSafe, setIsSafe] = useState(true);
  const [sanitizedValue, setSanitizedValue] = useState('');
  
  const checkAndSanitize = useCallback(() => {
    if (!fieldValue) {
      setSanitizedValue('');
      setIsSafe(true);
      return;
    }
    
    const check = sanitizationService.securityCheck(fieldValue);
    setIsSafe(check.safe);
    
    if (check.safe) {
      const cleaned = sanitizationService.sanitizeFieldValue(fieldValue, fieldName);
      setSanitizedValue(cleaned);
    } else {
      setSanitizedValue('');
    }
  }, [fieldValue, fieldName]);
  
  // تشغيل الفحص عند تغيير القيمة
  React.useEffect(() => {
    checkAndSanitize();
  }, [checkAndSanitize]);
  
  return {
    isSafe,
    sanitizedValue,
  };
}

// ====================================================================
// HOC للتغليف التلقائي للنماذج
// ====================================================================

export function withSanitization<T extends Record<string, any>>(
  Component: React.ComponentType<T>,
  options: SanitizationOptions = {}
) {
  return function SanitizedComponent(props: T) {
    const { sanitize } = useSanitization(options);
    
    // تغليف onSubmit إذا وجد
    const wrappedProps = { ...props };
    
    if (typeof props.onSubmit === 'function') {
      wrappedProps.onSubmit = async (data: any) => {
        const cleanData = sanitize(data);
        if (!cleanData) return;
        
        return props.onSubmit(cleanData);
      };
    }
    
    return <Component {...wrappedProps} />;
  };
}

// ====================================================================
// Context للتنظيف العام في التطبيق
// ====================================================================

import React, { createContext, useContext, ReactNode } from 'react';

interface SanitizationContextValue {
  sanitize: <T extends Record<string, any>>(data: T) => T | null;
  checkValue: (value: string) => boolean;
  sanitizeText: (text: string) => string;
  sanitizeHTMLContent: (html: string) => string;
}

const SanitizationContext = createContext<SanitizationContextValue | null>(null);

export function SanitizationProvider({
  children,
  ...options
}: {
  children: ReactNode;
} & SanitizationOptions) {
  const sanitizationHook = useSanitization(options);
  
  return (
    <SanitizationContext.Provider value={sanitizationHook}>
      {children}
    </SanitizationContext.Provider>
  );
}

export function useSanitizationContext() {
  const context = useContext(SanitizationContext);
  
  if (!context) {
    throw new Error(
      'useSanitizationContext must be used within SanitizationProvider'
    );
  }
  
  return context;
}

// ====================================================================
// Validator لـ React Hook Form
// ====================================================================

export function createSecurityValidator(fieldName: string) {
  return {
    validate: (value: any) => {
      if (!value || typeof value !== 'string') return true;
      
      const check = sanitizationService.securityCheck(value);
      
      if (!check.safe) {
        return `هذا الحقل يحتوي على محتوى غير آمن: ${check.threats.join(', ')}`;
      }
      
      return true;
    },
  };
}

// ====================================================================
// مثال على الاستخدام
// ====================================================================

/*
// في النموذج:
import { useSanitization } from '@/hooks/useSanitization';

function MyForm() {
  const { sanitize } = useSanitization({
    showToast: true,
    onThreat: (threats) => {
      // تسجيل الهجوم في Sentry
      captureError(new Error(`Security threat: ${threats.join(', ')}`));
    }
  });
  
  const onSubmit = async (data) => {
    const cleanData = sanitize(data);
    if (!cleanData) return;
    
    // إرسال البيانات النظيفة
    await api.post('/endpoint', cleanData);
  };
  
  return <form onSubmit={handleSubmit(onSubmit)}>...</form>;
}

// مع React Hook Form Validation:
import { createSecurityValidator } from '@/hooks/useSanitization';

<Controller
  name="description"
  control={control}
  rules={createSecurityValidator('description')}
  render={({ field }) => <Input {...field} />}
/>

// استخدام Context:
import { SanitizationProvider, useSanitizationContext } from '@/hooks/useSanitization';

// في App.tsx:
<SanitizationProvider showToast={true}>
  <App />
</SanitizationProvider>

// في أي مكون:
const { sanitize } = useSanitizationContext();
*/
