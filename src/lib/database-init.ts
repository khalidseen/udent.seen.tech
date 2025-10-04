import { supabase } from '@/integrations/supabase/client';

export async function initializeDatabaseSchema() {
  console.log('🔄 فحص وتهيئة مخطط قاعدة البيانات...');
  
  try {
    // التحقق من وجود مستخدم مسجل أولاً
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      console.log('⚠️ لا يوجد مستخدم مسجل - تخطي تهيئة قاعدة البيانات');
      return false;
    }

    // فحص إذا كان العمود موجود
    const { data, error } = await supabase.from('profiles').select('dashboard_link_validation_dismissed').limit(1);
    
    if (error && error.message.includes('does not exist')) {
      console.log('📝 إضافة العمود dashboard_link_validation_dismissed...');
      
      // لا يمكننا إضافة العمود مباشرة عبر العميل، لذا سنعتمد على localStorage فقط
      console.warn('⚠️ العمود dashboard_link_validation_dismissed غير موجود في قاعدة البيانات');
      console.warn('💡 سيتم استخدام localStorage كبديل مؤقت');
      console.warn('📋 لتفعيل الحفظ على الخادم، يرجى تشغيل الاستعلام التالي في محرر SQL في Supabase:');
      console.warn('ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS dashboard_link_validation_dismissed boolean DEFAULT false;');
      
      return false; // العمود غير موجود
    } else if (!error) {
      console.log('✅ العمود dashboard_link_validation_dismissed موجود ومتاح');
      return true; // العمود موجود
    }
    
    return false;
  } catch (error) {
    console.error('❌ خطأ في فحص مخطط قاعدة البيانات:', error);
    return false;
  }
}

// متغير لتتبع حالة العمود
export let isDashboardColumnAvailable = true; // تم تطبيق الهجرة - العمود متوفر الآن

// تهيئة المخطط عند تحميل الوحدة
initializeDatabaseSchema().then(available => {
  isDashboardColumnAvailable = available;
});
