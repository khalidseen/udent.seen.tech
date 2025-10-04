/**
 * خدمة تنظيف وتعقيم المدخلات
 * Input Sanitization Service
 * 
 * هذه الخدمة توفر دوال لتنظيف وتعقيم جميع المدخلات من المستخدم
 * لحماية النظام من هجمات:
 * - XSS (Cross-Site Scripting)
 * - SQL Injection
 * - HTML Injection
 * - Script Injection
 * 
 * الاستخدام:
 * import { sanitizeString, sanitizeObject } from '@/utils/sanitization';
 * 
 * const cleanData = sanitizeObject(userInput);
 */

// ====================================================================
// التثبيت المطلوب:
// npm install dompurify
// npm install @types/dompurify --save-dev
// ====================================================================

import DOMPurify from 'dompurify';

// ====================================================================
// الإعدادات الأساسية
// ====================================================================

const ALLOWED_TAGS = [
  'p', 'br', 'strong', 'em', 'u', 'span',
  'ul', 'ol', 'li',
  'h1', 'h2', 'h3', 'h4', 'h5', 'h6'
];

const ALLOWED_ATTR = ['class', 'id', 'style'];

// ====================================================================
// دوال التنظيف الأساسية
// ====================================================================

/**
 * تنظيف نص عادي - إزالة جميع علامات HTML والسكربتات
 */
export function sanitizeString(input: string | null | undefined): string {
  if (!input || typeof input !== 'string') {
    return '';
  }
  
  // إزالة جميع علامات HTML
  const withoutHtml = input.replace(/<[^>]*>/g, '');
  
  // إزالة السكربتات
  const withoutScripts = withoutHtml.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
  
  // تنظيف المسافات الزائدة
  const trimmed = withoutScripts.trim();
  
  // إزالة الأحرف الخطرة
  const cleaned = trimmed
    .replace(/[<>'"]/g, '') // إزالة < > ' "
    .replace(/javascript:/gi, '') // إزالة javascript:
    .replace(/on\w+\s*=/gi, ''); // إزالة onclick, onload, etc
  
  return cleaned;
}

/**
 * تنظيف HTML - السماح ببعض علامات HTML الآمنة فقط
 */
export function sanitizeHTML(input: string | null | undefined): string {
  if (!input || typeof input !== 'string') {
    return '';
  }
  
  // استخدام DOMPurify لتنظيف HTML
  return DOMPurify.sanitize(input, {
    ALLOWED_TAGS,
    ALLOWED_ATTR,
    KEEP_CONTENT: true,
    RETURN_DOM: false,
    RETURN_DOM_FRAGMENT: false,
  });
}

/**
 * تنظيف البريد الإلكتروني
 */
export function sanitizeEmail(input: string | null | undefined): string {
  if (!input || typeof input !== 'string') {
    return '';
  }
  
  // إزالة جميع الأحرف غير المسموحة في البريد الإلكتروني
  return input
    .toLowerCase()
    .replace(/[^a-z0-9@._-]/g, '')
    .trim();
}

/**
 * تنظيف رقم الهاتف
 */
export function sanitizePhone(input: string | null | undefined): string {
  if (!input || typeof input !== 'string') {
    return '';
  }
  
  // الاحتفاظ بالأرقام والرموز المسموحة فقط
  return input
    .replace(/[^0-9+\-\s()]/g, '')
    .trim();
}

/**
 * تنظيف رقم الهوية
 */
export function sanitizeNationalId(input: string | null | undefined): string {
  if (!input || typeof input !== 'string') {
    return '';
  }
  
  // الاحتفاظ بالأرقام فقط
  return input.replace(/\D/g, '');
}

/**
 * تنظيف URL
 */
export function sanitizeURL(input: string | null | undefined): string {
  if (!input || typeof input !== 'string') {
    return '';
  }
  
  try {
    // محاولة إنشاء كائن URL للتحقق من صحة الرابط
    const url = new URL(input);
    
    // السماح ب http و https فقط
    if (!['http:', 'https:'].includes(url.protocol)) {
      return '';
    }
    
    return url.toString();
  } catch {
    return '';
  }
}

/**
 * تنظيف اسم الملف
 */
export function sanitizeFilename(input: string | null | undefined): string {
  if (!input || typeof input !== 'string') {
    return '';
  }
  
  // إزالة المسارات والأحرف الخطرة
  return input
    .replace(/[^a-zA-Z0-9._-]/g, '_')
    .replace(/\.{2,}/g, '.') // منع ..
    .replace(/^\.+/, '') // منع البدء بنقطة
    .trim();
}

/**
 * تنظيف JSON string
 */
export function sanitizeJSON(input: string | null | undefined): string {
  if (!input || typeof input !== 'string') {
    return '{}';
  }
  
  try {
    // محاولة parse و stringify للتأكد من أنه JSON صحيح
    const parsed = JSON.parse(input);
    return JSON.stringify(parsed);
  } catch {
    return '{}';
  }
}

// ====================================================================
// دوال التنظيف المتقدمة
// ====================================================================

/**
 * تنظيف كائن كامل بشكل تلقائي
 */
export function sanitizeObject<T extends Record<string, any>>(
  obj: T,
  options: {
    allowHTML?: boolean;
    allowedFields?: string[];
  } = {}
): T {
  const { allowHTML = false, allowedFields } = options;
  
  if (!obj || typeof obj !== 'object') {
    return obj;
  }
  
  const sanitized: any = Array.isArray(obj) ? [] : {};
  
  for (const key in obj) {
    if (!obj.hasOwnProperty(key)) continue;
    
    // تخطي الحقول غير المسموحة
    if (allowedFields && !allowedFields.includes(key)) {
      continue;
    }
    
    const value = obj[key];
    
    // تنظيف حسب نوع البيانات
    if (value === null || value === undefined) {
      sanitized[key] = value;
    } else if (typeof value === 'string') {
      // تنظيف النصوص
      if (key.toLowerCase().includes('email')) {
        sanitized[key] = sanitizeEmail(value);
      } else if (key.toLowerCase().includes('phone') || key.toLowerCase().includes('mobile')) {
        sanitized[key] = sanitizePhone(value);
      } else if (key.toLowerCase().includes('url') || key.toLowerCase().includes('link')) {
        sanitized[key] = sanitizeURL(value);
      } else if (key.toLowerCase().includes('html') || key.toLowerCase().includes('content')) {
        sanitized[key] = allowHTML ? sanitizeHTML(value) : sanitizeString(value);
      } else {
        sanitized[key] = sanitizeString(value);
      }
    } else if (typeof value === 'number' || typeof value === 'boolean') {
      // الأرقام والقيم المنطقية آمنة
      sanitized[key] = value;
    } else if (typeof value === 'object') {
      // تنظيف الكائنات المتداخلة بشكل تكراري
      sanitized[key] = sanitizeObject(value, options);
    } else {
      // أنواع أخرى
      sanitized[key] = value;
    }
  }
  
  return sanitized as T;
}

/**
 * تنظيف بيانات النموذج
 */
export function sanitizeFormData(formData: FormData): FormData {
  const sanitized = new FormData();
  
  for (const [key, value] of formData.entries()) {
    if (typeof value === 'string') {
      sanitized.append(key, sanitizeString(value));
    } else {
      // File objects
      sanitized.append(key, value);
    }
  }
  
  return sanitized;
}

/**
 * تنظيف query parameters
 */
export function sanitizeQueryParams(params: URLSearchParams): URLSearchParams {
  const sanitized = new URLSearchParams();
  
  for (const [key, value] of params.entries()) {
    sanitized.append(sanitizeString(key), sanitizeString(value));
  }
  
  return sanitized;
}

// ====================================================================
// دوال التحقق من الهجمات
// ====================================================================

/**
 * التحقق من وجود محاولة XSS
 */
export function detectXSS(input: string): boolean {
  if (!input || typeof input !== 'string') {
    return false;
  }
  
  const xssPatterns = [
    /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
    /javascript:/gi,
    /on\w+\s*=/gi,
    /<iframe/gi,
    /<object/gi,
    /<embed/gi,
    /eval\(/gi,
    /expression\(/gi,
  ];
  
  return xssPatterns.some(pattern => pattern.test(input));
}

/**
 * التحقق من وجود محاولة SQL Injection
 */
export function detectSQLInjection(input: string): boolean {
  if (!input || typeof input !== 'string') {
    return false;
  }
  
  const sqlPatterns = [
    /(\bUNION\b|\bSELECT\b|\bINSERT\b|\bUPDATE\b|\bDELETE\b|\bDROP\b)/gi,
    /(\bOR\b|\bAND\b)\s+['"]?\d+['"]?\s*=\s*['"]?\d+/gi,
    /--/g,
    /;/g,
    /\/\*/g,
    /\*\//g,
  ];
  
  return sqlPatterns.some(pattern => pattern.test(input));
}

/**
 * التحقق من وجود محاولة Path Traversal
 */
export function detectPathTraversal(input: string): boolean {
  if (!input || typeof input !== 'string') {
    return false;
  }
  
  const pathPatterns = [
    /\.\./g,
    /\.\.[\\/]/g,
    /[\/\\]etc[\/\\]/gi,
    /[\/\\]windows[\/\\]/gi,
  ];
  
  return pathPatterns.some(pattern => pattern.test(input));
}

/**
 * فحص شامل للأمان
 */
export function securityCheck(input: string): {
  safe: boolean;
  threats: string[];
} {
  const threats: string[] = [];
  
  if (detectXSS(input)) {
    threats.push('XSS');
  }
  
  if (detectSQLInjection(input)) {
    threats.push('SQL Injection');
  }
  
  if (detectPathTraversal(input)) {
    threats.push('Path Traversal');
  }
  
  return {
    safe: threats.length === 0,
    threats,
  };
}

// ====================================================================
// دوال مساعدة للاستخدام مع React Hook Form
// ====================================================================

/**
 * تنظيف قيمة حقل قبل الإرسال
 */
export function sanitizeFieldValue(value: any, fieldName: string): any {
  if (typeof value !== 'string') {
    return value;
  }
  
  // تنظيف حسب اسم الحقل
  if (fieldName.toLowerCase().includes('email')) {
    return sanitizeEmail(value);
  } else if (fieldName.toLowerCase().includes('phone')) {
    return sanitizePhone(value);
  } else if (fieldName.toLowerCase().includes('url')) {
    return sanitizeURL(value);
  } else {
    return sanitizeString(value);
  }
}

/**
 * middleware للتحقق من الأمان قبل إرسال البيانات
 */
export function securityMiddleware<T extends Record<string, any>>(
  data: T,
  onSecurityThreat?: (threats: string[]) => void
): T | null {
  const dataString = JSON.stringify(data);
  const check = securityCheck(dataString);
  
  if (!check.safe) {
    console.error('🚨 Security threat detected:', check.threats);
    if (onSecurityThreat) {
      onSecurityThreat(check.threats);
    }
    return null;
  }
  
  return sanitizeObject(data);
}

// ====================================================================
// تصدير جميع الدوال
// ====================================================================

export default {
  // دوال التنظيف الأساسية
  sanitizeString,
  sanitizeHTML,
  sanitizeEmail,
  sanitizePhone,
  sanitizeNationalId,
  sanitizeURL,
  sanitizeFilename,
  sanitizeJSON,
  
  // دوال التنظيف المتقدمة
  sanitizeObject,
  sanitizeFormData,
  sanitizeQueryParams,
  
  // دوال الفحص الأمني
  detectXSS,
  detectSQLInjection,
  detectPathTraversal,
  securityCheck,
  
  // دوال مساعدة
  sanitizeFieldValue,
  securityMiddleware,
};
