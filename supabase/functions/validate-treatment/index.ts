/**
 * Supabase Edge Function: validate-treatment
 * التحقق من بيانات العلاج قبل التسجيل
 * 
 * هذه الدالة تتأكد من:
 * - صحة نوع العلاج والسن
 * - صحة التكلفة والحالة
 * - وجود المريض والطبيب
 * - عدم تسجيل علاجات متضاربة
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

// دالة التحقق من رقم السن
function validateToothNumber(toothNumber: number | string): { valid: boolean; error?: string } {
  if (!toothNumber) {
    return {
      valid: false,
      error: 'رقم السن مطلوب'
    };
  }
  
  const num = typeof toothNumber === 'string' ? parseInt(toothNumber) : toothNumber;
  
  if (isNaN(num)) {
    return {
      valid: false,
      error: 'رقم السن يجب أن يكون رقماً'
    };
  }
  
  // الأسنان الدائمة: 11-18, 21-28, 31-38, 41-48
  // أسنان الأطفال: 51-55, 61-65, 71-75, 81-85
  const validRanges = [
    [11, 18], [21, 28], [31, 38], [41, 48], // أسنان دائمة
    [51, 55], [61, 65], [71, 75], [81, 85]  // أسنان أطفال
  ];
  
  const isValid = validRanges.some(([min, max]) => num >= min && num <= max);
  
  if (!isValid) {
    return {
      valid: false,
      error: 'رقم السن غير صحيح. استخدم نظام FDI للترقيم'
    };
  }
  
  return { valid: true };
}

// دالة التحقق من نوع العلاج
function validateTreatmentType(type: string): { valid: boolean; error?: string } {
  if (!type) {
    return {
      valid: false,
      error: 'نوع العلاج مطلوب'
    };
  }
  
  const validTypes = [
    'examination',      // فحص
    'cleaning',         // تنظيف
    'filling',          // حشو
    'root_canal',       // علاج جذور
    'extraction',       // خلع
    'crown',            // تاج
    'bridge',           // جسر
    'implant',          // زراعة
    'orthodontics',     // تقويم
    'whitening',        // تبييض
    'veneer',           // فينير
    'denture',          // طقم أسنان
    'other'             // أخرى
  ];
  
  if (!validTypes.includes(type)) {
    return {
      valid: false,
      error: `نوع العلاج غير صحيح. القيم المسموحة: ${validTypes.join(', ')}`
    };
  }
  
  return { valid: true };
}

// دالة التحقق من حالة العلاج
function validateTreatmentStatus(status: string): { valid: boolean; error?: string } {
  if (!status) {
    return { valid: true }; // اختياري، القيمة الافتراضية 'planned'
  }
  
  const validStatuses = [
    'planned',          // مخطط
    'in_progress',      // قيد التنفيذ
    'completed',        // مكتمل
    'cancelled',        // ملغي
    'on_hold'           // معلق
  ];
  
  if (!validStatuses.includes(status)) {
    return {
      valid: false,
      error: `حالة العلاج غير صحيحة. القيم المسموحة: ${validStatuses.join(', ')}`
    };
  }
  
  return { valid: true };
}

// دالة التحقق من التكلفة
function validateCost(cost: number): { valid: boolean; error?: string } {
  if (cost === undefined || cost === null) {
    return { valid: true }; // اختياري
  }
  
  if (typeof cost !== 'number' || isNaN(cost)) {
    return {
      valid: false,
      error: 'التكلفة يجب أن تكون رقماً'
    };
  }
  
  if (cost < 0) {
    return {
      valid: false,
      error: 'التكلفة لا يمكن أن تكون سالبة'
    };
  }
  
  if (cost > 100000) {
    return {
      valid: false,
      error: 'التكلفة أكبر من الحد الأقصى المسموح (100,000 ريال)'
    };
  }
  
  return { valid: true };
}

// دالة التحقق من التاريخ
function validateTreatmentDate(date: string): { valid: boolean; error?: string } {
  if (!date) {
    return { valid: true }; // اختياري
  }
  
  try {
    const treatmentDate = new Date(date);
    
    if (isNaN(treatmentDate.getTime())) {
      return {
        valid: false,
        error: 'تاريخ العلاج غير صحيح'
      };
    }
    
    // التحقق من أن التاريخ ليس في المستقبل البعيد (أقصى حد سنة)
    const maxDate = new Date();
    maxDate.setFullYear(maxDate.getFullYear() + 1);
    
    if (treatmentDate > maxDate) {
      return {
        valid: false,
        error: 'تاريخ العلاج لا يمكن أن يكون بعد سنة من الآن'
      };
    }
    
    return { valid: true };
    
  } catch (error) {
    return {
      valid: false,
      error: 'تاريخ العلاج غير صحيح'
    };
  }
}

// دالة التحقق من الوصف
function validateDescription(description: string): { valid: boolean; error?: string } {
  if (!description || description.trim() === '') {
    return {
      valid: false,
      error: 'وصف العلاج مطلوب'
    };
  }
  
  if (description.length < 3) {
    return {
      valid: false,
      error: 'وصف العلاج يجب أن يكون 3 أحرف على الأقل'
    };
  }
  
  if (description.length > 500) {
    return {
      valid: false,
      error: 'وصف العلاج طويل جداً (الحد الأقصى 500 حرف)'
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
      doctor_id,
      clinic_id,
      tooth_number,
      treatment_type,
      description,
      cost,
      status,
      treatment_date,
      notes
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
      validateToothNumber(tooth_number),
      validateTreatmentType(treatment_type),
      validateDescription(description),
      validateCost(cost),
      validateTreatmentStatus(status),
      validateTreatmentDate(treatment_date)
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
    
    // التحقق من وجود الطبيب (إذا تم تحديده)
    if (doctor_id) {
      const { data: doctor } = await supabase
        .from('doctors')
        .select('id, clinic_id')
        .eq('id', doctor_id)
        .single();
      
      if (!doctor) {
        return new Response(
          JSON.stringify({
            valid: false,
            errors: ['الطبيب غير موجود']
          }),
          { status: 404, headers: { 'Content-Type': 'application/json' } }
        );
      }
      
      // التحقق من أن الطبيب ينتمي لنفس العيادة
      if (doctor.clinic_id !== clinic_id) {
        return new Response(
          JSON.stringify({
            valid: false,
            errors: ['الطبيب لا ينتمي لهذه العيادة']
          }),
          { status: 403, headers: { 'Content-Type': 'application/json' } }
        );
      }
    }
    
    // التحقق من عدم وجود علاج نشط لنفس السن
    const { data: activeTreatments } = await supabase
      .from('treatments')
      .select('id, treatment_type, status')
      .eq('patient_id', patient_id)
      .eq('tooth_number', tooth_number)
      .in('status', ['planned', 'in_progress']);
    
    if (activeTreatments && activeTreatments.length > 0) {
      // بعض أنواع العلاج لا يمكن أن تتكرر (مثل الخلع)
      const conflictingTypes = ['extraction'];
      const hasConflict = activeTreatments.some(t => 
        conflictingTypes.includes(t.treatment_type)
      );
      
      if (hasConflict || conflictingTypes.includes(treatment_type)) {
        return new Response(
          JSON.stringify({
            valid: false,
            errors: ['يوجد علاج نشط لنفس السن. لا يمكن تسجيل علاج آخر'],
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
        message: 'البيانات صحيحة ويمكن تسجيل العلاج'
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
