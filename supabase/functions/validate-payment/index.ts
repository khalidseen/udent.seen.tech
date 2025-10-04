/**
 * Supabase Edge Function: validate-payment
 * التحقق من بيانات الدفعة قبل التسجيل
 * 
 * هذه الدالة تتأكد من:
 * - صحة المبلغ وطريقة الدفع
 * - عدم تجاوز المبلغ المستحق
 * - صحة معلومات البطاقة أو الشيك
 * - عدم تكرار الدفعات
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

// دالة التحقق من المبلغ
function validateAmount(amount: number): { valid: boolean; error?: string } {
  if (amount === undefined || amount === null) {
    return {
      valid: false,
      error: 'مبلغ الدفعة مطلوب'
    };
  }
  
  if (typeof amount !== 'number' || isNaN(amount)) {
    return {
      valid: false,
      error: 'مبلغ الدفعة يجب أن يكون رقماً'
    };
  }
  
  if (amount <= 0) {
    return {
      valid: false,
      error: 'مبلغ الدفعة يجب أن يكون أكبر من صفر'
    };
  }
  
  if (amount > 1000000) {
    return {
      valid: false,
      error: 'مبلغ الدفعة أكبر من الحد الأقصى المسموح (1,000,000 ريال)'
    };
  }
  
  // التحقق من عدد المنازل العشرية (أقصى حد منزلتان)
  const decimalPlaces = (amount.toString().split('.')[1] || '').length;
  if (decimalPlaces > 2) {
    return {
      valid: false,
      error: 'مبلغ الدفعة يجب ألا يحتوي على أكثر من منزلتين عشريتين'
    };
  }
  
  return { valid: true };
}

// دالة التحقق من طريقة الدفع
function validatePaymentMethod(method: string): { valid: boolean; error?: string } {
  if (!method) {
    return {
      valid: false,
      error: 'طريقة الدفع مطلوبة'
    };
  }
  
  const validMethods = [
    'cash',           // نقدي
    'credit_card',    // بطاقة ائتمان
    'debit_card',     // بطاقة خصم
    'bank_transfer',  // تحويل بنكي
    'check',          // شيك
    'insurance',      // تأمين
    'other'           // أخرى
  ];
  
  if (!validMethods.includes(method)) {
    return {
      valid: false,
      error: `طريقة الدفع غير صحيحة. القيم المسموحة: ${validMethods.join(', ')}`
    };
  }
  
  return { valid: true };
}

// دالة التحقق من حالة الدفعة
function validatePaymentStatus(status: string): { valid: boolean; error?: string } {
  if (!status) {
    return { valid: true }; // اختياري، القيمة الافتراضية 'completed'
  }
  
  const validStatuses = [
    'pending',        // قيد الانتظار
    'completed',      // مكتملة
    'failed',         // فشلت
    'refunded',       // مستردة
    'cancelled'       // ملغاة
  ];
  
  if (!validStatuses.includes(status)) {
    return {
      valid: false,
      error: `حالة الدفعة غير صحيحة. القيم المسموحة: ${validStatuses.join(', ')}`
    };
  }
  
  return { valid: true };
}

// دالة التحقق من رقم المرجع
function validateReferenceNumber(refNumber: string, method: string): { valid: boolean; error?: string } {
  // رقم المرجع مطلوب لبعض طرق الدفع
  const methodsRequiringReference = ['credit_card', 'debit_card', 'bank_transfer', 'check'];
  
  if (methodsRequiringReference.includes(method) && !refNumber) {
    return {
      valid: false,
      error: `رقم المرجع مطلوب لطريقة الدفع ${method}`
    };
  }
  
  if (refNumber && refNumber.length < 4) {
    return {
      valid: false,
      error: 'رقم المرجع يجب أن يكون 4 أحرف على الأقل'
    };
  }
  
  if (refNumber && refNumber.length > 50) {
    return {
      valid: false,
      error: 'رقم المرجع طويل جداً (الحد الأقصى 50 حرف)'
    };
  }
  
  return { valid: true };
}

// دالة التحقق من تاريخ الدفع
function validatePaymentDate(date: string): { valid: boolean; error?: string } {
  if (!date) {
    return { valid: true }; // اختياري، سيتم استخدام التاريخ الحالي
  }
  
  try {
    const paymentDate = new Date(date);
    const now = new Date();
    
    if (isNaN(paymentDate.getTime())) {
      return {
        valid: false,
        error: 'تاريخ الدفعة غير صحيح'
      };
    }
    
    // التحقق من أن التاريخ ليس في المستقبل
    if (paymentDate > now) {
      return {
        valid: false,
        error: 'تاريخ الدفعة لا يمكن أن يكون في المستقبل'
      };
    }
    
    // التحقق من أن التاريخ ليس قديماً جداً (أقصى حد سنة)
    const oneYearAgo = new Date();
    oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
    
    if (paymentDate < oneYearAgo) {
      return {
        valid: false,
        error: 'تاريخ الدفعة قديم جداً (أكثر من سنة)',
        warning: true
      };
    }
    
    return { valid: true };
    
  } catch (error) {
    return {
      valid: false,
      error: 'تاريخ الدفعة غير صحيح'
    };
  }
}

// دالة التحقق من معلومات البطاقة (إذا كانت موجودة)
function validateCardInfo(cardLastFour: string, method: string): { valid: boolean; error?: string } {
  if (!cardLastFour) {
    return { valid: true }; // اختياري
  }
  
  // التحقق من أن طريقة الدفع هي بطاقة
  const cardMethods = ['credit_card', 'debit_card'];
  if (!cardMethods.includes(method)) {
    return {
      valid: false,
      error: 'معلومات البطاقة يمكن استخدامها فقط مع طرق دفع البطاقات'
    };
  }
  
  // التحقق من أن آخر 4 أرقام صحيحة
  if (!/^\d{4}$/.test(cardLastFour)) {
    return {
      valid: false,
      error: 'آخر 4 أرقام من البطاقة يجب أن تكون أرقاماً فقط'
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
      invoice_id,
      clinic_id,
      amount,
      payment_method,
      payment_date,
      reference_number,
      status,
      card_last_four,
      notes
    } = data;
    
    // التحقق من الحقول المطلوبة
    if (!invoice_id) {
      return new Response(
        JSON.stringify({ error: 'معرف الفاتورة مطلوب' }),
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
      validateAmount(amount),
      validatePaymentMethod(payment_method),
      validatePaymentStatus(status),
      validateReferenceNumber(reference_number, payment_method),
      validatePaymentDate(payment_date),
      validateCardInfo(card_last_four, payment_method)
    ];
    
    // البحث عن أي خطأ
    const errors = validations
      .filter(v => !v.valid && !v.warning)
      .map(v => v.error);
    
    const warnings = validations
      .filter(v => v.warning)
      .map(v => v.error);
    
    if (errors.length > 0) {
      return new Response(
        JSON.stringify({
          valid: false,
          errors,
          warnings
        }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }
    
    // إنشاء اتصال بقاعدة البيانات
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );
    
    // التحقق من وجود الفاتورة
    const { data: invoice } = await supabase
      .from('invoices')
      .select('id, clinic_id, total_amount, paid_amount, status')
      .eq('id', invoice_id)
      .single();
    
    if (!invoice) {
      return new Response(
        JSON.stringify({
          valid: false,
          errors: ['الفاتورة غير موجودة']
        }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      );
    }
    
    // التحقق من أن الفاتورة تنتمي لنفس العيادة
    if (invoice.clinic_id !== clinic_id) {
      return new Response(
        JSON.stringify({
          valid: false,
          errors: ['الفاتورة لا تنتمي لهذه العيادة']
        }),
        { status: 403, headers: { 'Content-Type': 'application/json' } }
      );
    }
    
    // التحقق من أن الفاتورة ليست ملغاة
    if (invoice.status === 'cancelled') {
      return new Response(
        JSON.stringify({
          valid: false,
          errors: ['لا يمكن إضافة دفعة لفاتورة ملغاة']
        }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }
    
    // حساب المبلغ المتبقي
    const remainingAmount = invoice.total_amount - (invoice.paid_amount || 0);
    
    // التحقق من أن المبلغ لا يتجاوز المبلغ المتبقي
    if (amount > remainingAmount + 0.01) { // سماح بفرق صغير للتقريب
      return new Response(
        JSON.stringify({
          valid: false,
          errors: [
            `مبلغ الدفعة (${amount} ريال) يتجاوز المبلغ المتبقي (${remainingAmount.toFixed(2)} ريال)`
          ]
        }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }
    
    // التحقق من عدم تكرار رقم المرجع (إذا وجد)
    if (reference_number) {
      const { data: existingPayment } = await supabase
        .from('payments')
        .select('id')
        .eq('reference_number', reference_number)
        .eq('clinic_id', clinic_id)
        .single();
      
      if (existingPayment) {
        return new Response(
          JSON.stringify({
            valid: false,
            errors: ['رقم المرجع مستخدم مسبقاً'],
            warning: true
          }),
          { status: 409, headers: { 'Content-Type': 'application/json' } }
        );
      }
    }
    
    // جميع البيانات صحيحة
    return new Response(
      JSON.stringify({
        valid: true,
        message: 'البيانات صحيحة ويمكن تسجيل الدفعة',
        remaining_amount: remainingAmount - amount,
        warnings
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
