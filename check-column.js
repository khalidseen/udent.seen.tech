import { createClient } from '@supabase/supabase-js';

// بيانات الاتصال
const supabaseUrl = 'https://lxusbjpvcyjcfrnyselc.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx4dXNianB2Y3lqY2ZybnlzZWxjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM4OTk1OTUsImV4cCI6MjA2OTQ3NTU5NX0.-UZM4oHEbJ52j_VBmEOJtmODhkkScc4I3yxgz9ckbVM';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function addColumnDirectly() {
  console.log('🚀 إضافة العمود مباشرة...');
  
  try {
    // محاولة إضافة العمود عبر استعلام مباشر
    const { data, error } = await supabase.from('profiles').select('dashboard_link_validation_dismissed').limit(1);
    
    if (error && error.message.includes('does not exist')) {
      console.log('📝 العمود غير موجود، سأضيفه...');
      
      // نحاول إضافة العمود عبر تحديث profile موجود (هذا سيفشل ولكنه يعطينا معلومات)
      const { data: profiles } = await supabase.from('profiles').select('id').limit(1);
      
      if (profiles && profiles.length > 0) {
        console.log(`✅ جدول profiles موجود مع ${profiles.length} سجل على الأقل`);
        console.log('📋 العمود dashboard_link_validation_dismissed يحتاج إضافة يدوية');
        console.log('💡 يرجى تشغيل الاستعلام التالي في محرر SQL في Supabase:');
        console.log('');
        console.log('ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS dashboard_link_validation_dismissed boolean DEFAULT false;');
        console.log('');
        console.log('UPDATE public.profiles SET dashboard_link_validation_dismissed = false WHERE dashboard_link_validation_dismissed IS NULL;');
        console.log('');
        console.log('-- إنشاء function للتحديث:');
        console.log('CREATE OR REPLACE FUNCTION public.set_dashboard_dismissed(p_profile_id uuid, p_value boolean)');
        console.log('RETURNS void AS $$');
        console.log('BEGIN');
        console.log('  UPDATE public.profiles SET dashboard_link_validation_dismissed = p_value WHERE id = p_profile_id;');
        console.log('END;');
        console.log('$$ LANGUAGE plpgsql SECURITY DEFINER;');
      }
    } else if (!error) {
      console.log('✅ العمود dashboard_link_validation_dismissed موجود بالفعل!');
      console.log(`📊 تم العثور على ${data.length} سجل`);
    } else {
      console.log('❌ خطأ غير متوقع:', error);
    }
    
  } catch (error) {
    console.error('❌ خطأ:', error);
  }
}

addColumnDirectly();
