/**
 * Supabase Edge Function: validate-patient
 * التحقق من بيانات المريض قبل الإدخال في قاعدة البيانات
 * 
 * هذه الدالة تعمل كطبقة حماية إضافية للتأكد من صحة البيانات
 * حتى لو تم تجاوز التحقق في Frontend
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

// أنماط التحقق (Regular Expressions)
const PATTERNS = {
  // رقم الهوية السعودي: يبدأ بـ 1 أو 2 ويتبعه 9 أرقام
  saudiNationalId: /^[12]\d{9}$/,
  
  // رقم الجوال السعودي: يبدأ بـ 05 أو 5 ويتبعه 8 أرقام
  saudiPhone: /^(05|5)\d{8}$/,
  
  // البريد الإلكتروني
  email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  
  // الاسم: أحرف عربية وإنجليزية ومسافات فقط
  name: /^[\u0600-\u06FFa-zA-Z\s]{3,100}$/,
};

// دالة التحقق من رقم الهوية السعودي
function validateSaudiNationalId(id: string): { valid: boolean; error?: string } {
  if (!id) {
    return { valid: true }; // اختياري
  }
  
  if (!PATTERNS.saudiNationalId.test(id)) {
    return {
      valid: false,
      error: 'رقم الهوية غير صحيح. يجب أن يكون 10 أرقام ويبدأ بـ 1 أو 2'
    };
  }
  
  return { valid: true };
}

// دالة التحقق من رقم الجوال السعودي
function validateSaudiPhone(phone: string): { valid: boolean; error?: string } {
  if (!phone) {
    return {
      valid: false,
      error: 'رقم الجوال مطلوب'
    };
  }
  
  // تنظيف الرقم من المسافات والرموز
  const cleanPhone = phone.replace(/[\s\-\(\)]/g, '');
  
  // إزالة مفتاح الدولة +966 إذا وجد
  const phoneWithoutCountryCode = cleanPhone.replace(/^\+?966/, '');
  
  if (!PATTERNS.saudiPhone.test(phoneWithoutCountryCode)) {
    return {
      valid: false,
      error: 'رقم الجوال غير صحيح. يجب أن يبدأ بـ 05 ويتكون من 10 أرقام'
    };
  }
  
  return { valid: true };
}

// دالة التحقق من البريد الإلكتروني
function validateEmail(email: string): { valid: boolean; error?: string } {
  if (!email) {
    return { valid: true }; // اختياري
  }
  
  if (!PATTERNS.email.test(email)) {
    return {
      valid: false,
      error: 'البريد الإلكتروني غير صحيح'
    };
  }
  
  return { valid: true };
}

// دالة التحقق من الاسم
function validateName(name: string): { valid: boolean; error?: string } {
  if (!name) {
    return {
      valid: false,
      error: 'اسم المريض مطلوب'
    };
  }
  
  if (name.length < 3) {
    return {
      valid: false,
      error: 'اسم المريض يجب أن يكون 3 أحرف على الأقل'
    };
  }
  
  if (name.length > 100) {
    return {
      valid: false,
      error: 'اسم المريض طويل جداً (الحد الأقصى 100 حرف)'
    };
  }
  
  if (!PATTERNS.name.test(name)) {
    return {
      valid: false,
      error: 'اسم المريض يجب أن يحتوي على أحرف فقط'
    };
  }
  
  return { valid: true };
}

// دالة التحقق من تاريخ الميلاد
function validateDateOfBirth(dob: string): { valid: boolean; error?: string } {
  if (!dob) {
    return { valid: true }; // اختياري
  }
  
  const birthDate = new Date(dob);
  const today = new Date();
  
  // التحقق من صحة التاريخ
  if (isNaN(birthDate.getTime())) {
    return {
      valid: false,
      error: 'تاريخ الميلاد غير صحيح'
    };
  }
  
  // التحقق من أن التاريخ في الماضي
  if (birthDate > today) {
    return {
      valid: false,
      error: 'تاريخ الميلاد لا يمكن أن يكون في المستقبل'
    };
  }
  
  // التحقق من أن العمر معقول (0-150 سنة)
  const age = today.getFullYear() - birthDate.getFullYear();
  if (age > 150) {
    return {
      valid: false,
      error: 'تاريخ الميلاد غير معقول'
    };
  }
  
  return { valid: true };
}

// دالة التحقق من الجنس
function validateGender(gender: string): { valid: boolean; error?: string } {
  if (!gender) {
    return { valid: true }; // اختياري
  }
  
  const validGenders = ['male', 'female', 'other', 'ذكر', 'أنثى'];
  
  if (!validGenders.includes(gender.toLowerCase())) {
    return {
      valid: false,
      error: 'الجنس غير صحيح. القيم المسموحة: male, female, other'
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
      name,
      phone,
      email,
      national_id,
      date_of_birth,
      gender,
      clinic_id
    } = data;
    
    // التحقق من وجود clinic_id (مطلوب)
    if (!clinic_id) {
      return new Response(
        JSON.stringify({ error: 'معرف العيادة مطلوب' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }
    
    // التحقق من جميع الحقول
    const validations = [
      validateName(name),
      validateSaudiPhone(phone),
      validateEmail(email),
      validateSaudiNationalId(national_id),
      validateDateOfBirth(date_of_birth),
      validateGender(gender)
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
    
    // التحقق من عدم تكرار رقم الهوية (إذا وجد)
    if (national_id) {
      const supabase = createClient(
        Deno.env.get('SUPABASE_URL') ?? '',
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
      );
      
      const { data: existingPatient } = await supabase
        .from('patients')
        .select('id')
        .eq('national_id', national_id)
        .eq('clinic_id', clinic_id)
        .single();
      
      if (existingPatient) {
        return new Response(
          JSON.stringify({
            valid: false,
            errors: ['رقم الهوية مسجل مسبقاً']
          }),
          { status: 400, headers: { 'Content-Type': 'application/json' } }
        );
      }
    }
    
    // التحقق من عدم تكرار رقم الجوال
    if (phone) {
      const supabase = createClient(
        Deno.env.get('SUPABASE_URL') ?? '',
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
      );
      
      const cleanPhone = phone.replace(/[\s\-\(\)]/g, '').replace(/^\+?966/, '');
      
      const { data: existingPatient } = await supabase
        .from('patients')
        .select('id')
        .eq('phone', cleanPhone)
        .eq('clinic_id', clinic_id)
        .single();
      
      if (existingPatient) {
        return new Response(
          JSON.stringify({
            valid: false,
            errors: ['رقم الجوال مسجل مسبقاً']
          }),
          { status: 400, headers: { 'Content-Type': 'application/json' } }
        );
      }
    }
    
    // جميع البيانات صحيحة
    return new Response(
      JSON.stringify({
        valid: true,
        message: 'البيانات صحيحة'
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
