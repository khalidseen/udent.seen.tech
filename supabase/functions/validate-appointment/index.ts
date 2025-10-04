/**
 * Supabase Edge Function: validate-appointment
 * التحقق من بيانات الموعد قبل الحجز
 * 
 * هذه الدالة تتأكد من:
 * - صحة التاريخ والوقت
 * - عدم تعارض المواعيد
 * - توفر الطبيب في الوقت المحدد
 * - عدم حجز موعد في الماضي
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

// دالة التحقق من تاريخ ووقت الموعد
function validateAppointmentDateTime(date: string, time: string): { valid: boolean; error?: string } {
  if (!date || !time) {
    return {
      valid: false,
      error: 'تاريخ ووقت الموعد مطلوبان'
    };
  }
  
  try {
    const appointmentDateTime = new Date(`${date}T${time}`);
    const now = new Date();
    
    // التحقق من صحة التاريخ
    if (isNaN(appointmentDateTime.getTime())) {
      return {
        valid: false,
        error: 'تاريخ أو وقت الموعد غير صحيح'
      };
    }
    
    // التحقق من أن الموعد في المستقبل (على الأقل 30 دقيقة)
    const minTime = new Date(now.getTime() + 30 * 60000); // 30 دقيقة
    if (appointmentDateTime < minTime) {
      return {
        valid: false,
        error: 'لا يمكن حجز موعد في الماضي أو خلال 30 دقيقة القادمة'
      };
    }
    
    // التحقق من أن الموعد ليس بعيداً جداً (أقصى حد 6 أشهر)
    const maxTime = new Date(now.getTime() + 180 * 24 * 60 * 60000); // 6 أشهر
    if (appointmentDateTime > maxTime) {
      return {
        valid: false,
        error: 'لا يمكن حجز موعد بعد 6 أشهر'
      };
    }
    
    // التحقق من أن الموعد في ساعات العمل (8 صباحاً - 10 مساءً)
    const hour = appointmentDateTime.getHours();
    if (hour < 8 || hour >= 22) {
      return {
        valid: false,
        error: 'ساعات العمل من 8 صباحاً إلى 10 مساءً'
      };
    }
    
    return { valid: true };
    
  } catch (error) {
    return {
      valid: false,
      error: 'حدث خطأ في التحقق من التاريخ والوقت'
    };
  }
}

// دالة التحقق من المدة
function validateDuration(duration: number): { valid: boolean; error?: string } {
  if (!duration) {
    return {
      valid: false,
      error: 'مدة الموعد مطلوبة'
    };
  }
  
  // المدة يجب أن تكون بين 15 دقيقة و 4 ساعات
  if (duration < 15 || duration > 240) {
    return {
      valid: false,
      error: 'مدة الموعد يجب أن تكون بين 15 دقيقة و 4 ساعات'
    };
  }
  
  // المدة يجب أن تكون من مضاعفات 15 دقيقة
  if (duration % 15 !== 0) {
    return {
      valid: false,
      error: 'مدة الموعد يجب أن تكون من مضاعفات 15 دقيقة'
    };
  }
  
  return { valid: true };
}

// دالة التحقق من حالة الموعد
function validateStatus(status: string): { valid: boolean; error?: string } {
  if (!status) {
    return { valid: true }; // اختياري، القيمة الافتراضية 'scheduled'
  }
  
  const validStatuses = [
    'scheduled',    // محجوز
    'confirmed',    // مؤكد
    'cancelled',    // ملغي
    'completed',    // مكتمل
    'no_show',      // لم يحضر
    'rescheduled'   // معاد جدولته
  ];
  
  if (!validStatuses.includes(status)) {
    return {
      valid: false,
      error: `حالة الموعد غير صحيحة. القيم المسموحة: ${validStatuses.join(', ')}`
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
      appointment_date,
      appointment_time,
      duration,
      status,
      appointment_type
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
      validateAppointmentDateTime(appointment_date, appointment_time),
      validateDuration(duration || 30),
      validateStatus(status)
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
    
    // التحقق من عدم تعارض المواعيد للطبيب
    if (doctor_id) {
      const appointmentStart = new Date(`${appointment_date}T${appointment_time}`);
      const appointmentEnd = new Date(appointmentStart.getTime() + (duration || 30) * 60000);
      
      // البحث عن مواعيد متعارضة
      const { data: conflictingAppointments } = await supabase
        .from('appointments')
        .select('id, appointment_date, appointment_time, duration')
        .eq('doctor_id', doctor_id)
        .eq('appointment_date', appointment_date)
        .in('status', ['scheduled', 'confirmed']);
      
      if (conflictingAppointments && conflictingAppointments.length > 0) {
        for (const apt of conflictingAppointments) {
          const existingStart = new Date(`${apt.appointment_date}T${apt.appointment_time}`);
          const existingEnd = new Date(existingStart.getTime() + (apt.duration || 30) * 60000);
          
          // التحقق من التعارض
          if (
            (appointmentStart >= existingStart && appointmentStart < existingEnd) ||
            (appointmentEnd > existingStart && appointmentEnd <= existingEnd) ||
            (appointmentStart <= existingStart && appointmentEnd >= existingEnd)
          ) {
            return new Response(
              JSON.stringify({
                valid: false,
                errors: ['يوجد موعد آخر للطبيب في نفس الوقت']
              }),
              { status: 409, headers: { 'Content-Type': 'application/json' } }
            );
          }
        }
      }
    }
    
    // التحقق من عدم وجود موعد آخر للمريض في نفس اليوم
    const { data: patientAppointments } = await supabase
      .from('appointments')
      .select('id')
      .eq('patient_id', patient_id)
      .eq('appointment_date', appointment_date)
      .in('status', ['scheduled', 'confirmed']);
    
    if (patientAppointments && patientAppointments.length > 0) {
      return new Response(
        JSON.stringify({
          valid: false,
          errors: ['المريض لديه موعد آخر في نفس اليوم'],
          warning: true
        }),
        { status: 409, headers: { 'Content-Type': 'application/json' } }
      );
    }
    
    // جميع البيانات صحيحة
    return new Response(
      JSON.stringify({
        valid: true,
        message: 'البيانات صحيحة ويمكن حجز الموعد'
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
