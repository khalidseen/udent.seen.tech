/**
 * Supabase Edge Function: validate-invoice
 * التحقق من بيانات الفاتورة قبل الإنشاء
 * 
 * هذه الدالة تتأكد من:
 * - صحة المبالغ والحسابات
 * - وجود العناصر المطلوبة
 * - عدم إنشاء فواتير سلبية
 * - صحة حسابات الضريبة والخصم
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

// دالة التحقق من المبلغ
function validateAmount(amount: number, fieldName: string = 'المبلغ'): { valid: boolean; error?: string } {
  if (amount === undefined || amount === null) {
    return {
      valid: false,
      error: `${fieldName} مطلوب`
    };
  }
  
  if (typeof amount !== 'number' || isNaN(amount)) {
    return {
      valid: false,
      error: `${fieldName} يجب أن يكون رقماً صحيحاً`
    };
  }
  
  if (amount < 0) {
    return {
      valid: false,
      error: `${fieldName} لا يمكن أن يكون سالباً`
    };
  }
  
  // الحد الأقصى للمبلغ: مليون ريال
  if (amount > 1000000) {
    return {
      valid: false,
      error: `${fieldName} أكبر من الحد الأقصى المسموح (1,000,000 ريال)`
    };
  }
  
  // التحقق من عدد المنازل العشرية (أقصى حد منزلتان)
  const decimalPlaces = (amount.toString().split('.')[1] || '').length;
  if (decimalPlaces > 2) {
    return {
      valid: false,
      error: `${fieldName} يجب ألا يحتوي على أكثر من منزلتين عشريتين`
    };
  }
  
  return { valid: true };
}

// دالة التحقق من نسبة الضريبة
function validateTaxRate(rate: number): { valid: boolean; error?: string } {
  if (rate === undefined || rate === null) {
    return { valid: true }; // اختياري، القيمة الافتراضية 15%
  }
  
  if (typeof rate !== 'number' || isNaN(rate)) {
    return {
      valid: false,
      error: 'نسبة الضريبة يجب أن تكون رقماً'
    };
  }
  
  if (rate < 0 || rate > 100) {
    return {
      valid: false,
      error: 'نسبة الضريبة يجب أن تكون بين 0 و 100'
    };
  }
  
  return { valid: true };
}

// دالة التحقق من نسبة الخصم
function validateDiscountRate(rate: number): { valid: boolean; error?: string } {
  if (rate === undefined || rate === null) {
    return { valid: true }; // اختياري
  }
  
  if (typeof rate !== 'number' || isNaN(rate)) {
    return {
      valid: false,
      error: 'نسبة الخصم يجب أن تكون رقماً'
    };
  }
  
  if (rate < 0 || rate > 100) {
    return {
      valid: false,
      error: 'نسبة الخصم يجب أن تكون بين 0 و 100'
    };
  }
  
  return { valid: true };
}

// دالة التحقق من حالة الفاتورة
function validateStatus(status: string): { valid: boolean; error?: string } {
  if (!status) {
    return { valid: true }; // اختياري، القيمة الافتراضية 'pending'
  }
  
  const validStatuses = [
    'draft',        // مسودة
    'pending',      // قيد الانتظار
    'paid',         // مدفوعة
    'partially_paid', // مدفوعة جزئياً
    'cancelled',    // ملغاة
    'overdue'       // متأخرة
  ];
  
  if (!validStatuses.includes(status)) {
    return {
      valid: false,
      error: `حالة الفاتورة غير صحيحة. القيم المسموحة: ${validStatuses.join(', ')}`
    };
  }
  
  return { valid: true };
}

// دالة التحقق من عناصر الفاتورة
function validateInvoiceItems(items: any[]): { valid: boolean; error?: string } {
  if (!items || !Array.isArray(items)) {
    return {
      valid: false,
      error: 'عناصر الفاتورة مطلوبة'
    };
  }
  
  if (items.length === 0) {
    return {
      valid: false,
      error: 'يجب أن تحتوي الفاتورة على عنصر واحد على الأقل'
    };
  }
  
  // التحقق من كل عنصر
  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    
    if (!item.description || item.description.trim() === '') {
      return {
        valid: false,
        error: `وصف العنصر ${i + 1} مطلوب`
      };
    }
    
    if (!item.quantity || item.quantity <= 0) {
      return {
        valid: false,
        error: `كمية العنصر ${i + 1} يجب أن تكون أكبر من صفر`
      };
    }
    
    if (!item.unit_price || item.unit_price < 0) {
      return {
        valid: false,
        error: `سعر الوحدة للعنصر ${i + 1} غير صحيح`
      };
    }
    
    // التحقق من صحة الحساب
    const expectedTotal = item.quantity * item.unit_price;
    const actualTotal = item.total || expectedTotal;
    
    if (Math.abs(actualTotal - expectedTotal) > 0.01) {
      return {
        valid: false,
        error: `إجمالي العنصر ${i + 1} غير صحيح (المتوقع: ${expectedTotal.toFixed(2)}، الفعلي: ${actualTotal.toFixed(2)})`
      };
    }
  }
  
  return { valid: true };
}

// دالة التحقق من حسابات الفاتورة
function validateInvoiceCalculations(data: any): { valid: boolean; error?: string } {
  const {
    items,
    subtotal,
    tax_rate = 15,
    tax_amount,
    discount_rate = 0,
    discount_amount,
    total_amount
  } = data;
  
  // حساب المجموع الفرعي
  const calculatedSubtotal = items.reduce((sum: number, item: any) => {
    return sum + (item.quantity * item.unit_price);
  }, 0);
  
  // التحقق من المجموع الفرعي
  if (Math.abs(subtotal - calculatedSubtotal) > 0.01) {
    return {
      valid: false,
      error: `المجموع الفرعي غير صحيح (المتوقع: ${calculatedSubtotal.toFixed(2)}، الفعلي: ${subtotal.toFixed(2)})`
    };
  }
  
  // حساب الخصم
  const calculatedDiscount = discount_rate > 0 
    ? (subtotal * discount_rate / 100)
    : (discount_amount || 0);
  
  if (Math.abs((discount_amount || 0) - calculatedDiscount) > 0.01) {
    return {
      valid: false,
      error: `مبلغ الخصم غير صحيح (المتوقع: ${calculatedDiscount.toFixed(2)}، الفعلي: ${(discount_amount || 0).toFixed(2)})`
    };
  }
  
  // حساب الضريبة
  const amountAfterDiscount = subtotal - calculatedDiscount;
  const calculatedTax = amountAfterDiscount * tax_rate / 100;
  
  if (Math.abs((tax_amount || 0) - calculatedTax) > 0.01) {
    return {
      valid: false,
      error: `مبلغ الضريبة غير صحيح (المتوقع: ${calculatedTax.toFixed(2)}، الفعلي: ${(tax_amount || 0).toFixed(2)})`
    };
  }
  
  // حساب الإجمالي
  const calculatedTotal = amountAfterDiscount + calculatedTax;
  
  if (Math.abs(total_amount - calculatedTotal) > 0.01) {
    return {
      valid: false,
      error: `الإجمالي النهائي غير صحيح (المتوقع: ${calculatedTotal.toFixed(2)}، الفعلي: ${total_amount.toFixed(2)})`
    };
  }
  
  return { valid: true };
}

// الدالة الرئيسية
serve(async (req) => {
  try {
    // التحقق من صحة الطلب
    if (req.method !== 'POST') {
      return new Response(
        JSON.stringify({ error: 'Method not allowed' }),
        { status: 405, headers: { 'Content-Type': 'application/json' } }
      );
    }
    
    // قراءة البيانات
    const data = await req.json();
    
    const {
      patient_id,
      clinic_id,
      items,
      subtotal,
      tax_rate,
      tax_amount,
      discount_rate,
      discount_amount,
      total_amount,
      paid_amount,
      status
    } = data;
    
    // التحقق من الحقول المطلوبة
    if (!patient_id) {
      return new Response(
        JSON.stringify({ error: 'معرف المريض مطلوب' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }
    
    if (!clinic_id) {
      return new Response(
        JSON.stringify({ error: 'معرف العيادة مطلوب' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }
    
    // التحقق من جميع الحقول
    const validations = [
      validateInvoiceItems(items),
      validateAmount(subtotal, 'المجموع الفرعي'),
      validateTaxRate(tax_rate || 15),
      validateAmount(tax_amount || 0, 'مبلغ الضريبة'),
      validateDiscountRate(discount_rate || 0),
      validateAmount(discount_amount || 0, 'مبلغ الخصم'),
      validateAmount(total_amount, 'الإجمالي'),
      validateAmount(paid_amount || 0, 'المبلغ المدفوع'),
      validateStatus(status),
      validateInvoiceCalculations(data)
    ];
    
    // البحث عن أي خطأ
    const errors = validations
      .filter(v => !v.valid)
      .map(v => v.error);
    
    if (errors.length > 0) {
      return new Response(
        JSON.stringify({
          valid: false,
          errors
        }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }
    
    // إنشاء اتصال بقاعدة البيانات
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );
    
    // التحقق من وجود المريض
    const { data: patient } = await supabase
      .from('patients')
      .select('id, clinic_id')
      .eq('id', patient_id)
      .single();
    
    if (!patient) {
      return new Response(
        JSON.stringify({
          valid: false,
          errors: ['المريض غير موجود']
        }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      );
    }
    
    // التحقق من أن المريض ينتمي لنفس العيادة
    if (patient.clinic_id !== clinic_id) {
      return new Response(
        JSON.stringify({
          valid: false,
          errors: ['المريض لا ينتمي لهذه العيادة']
        }),
        { status: 403, headers: { 'Content-Type': 'application/json' } }
      );
    }
    
    // التحقق من أن المبلغ المدفوع لا يتجاوز الإجمالي
    if (paid_amount > total_amount) {
      return new Response(
        JSON.stringify({
          valid: false,
          errors: ['المبلغ المدفوع لا يمكن أن يتجاوز الإجمالي']
        }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }
    
    // جميع البيانات صحيحة
    return new Response(
      JSON.stringify({
        valid: true,
        message: 'البيانات صحيحة ويمكن إنشاء الفاتورة'
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
    
  } catch (error) {
    console.error('Validation error:', error);
    
    return new Response(
      JSON.stringify({
        error: 'حدث خطأ أثناء التحقق من البيانات',
        details: error.message
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
});
