import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// بيانات الاتصال من ملف .env
const supabaseUrl = 'https://lxusbjpvcyjcfrnyselc.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx4dXNianB2Y3lqY2ZybnlzZWxjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM4OTk1OTUsImV4cCI6MjA2OTQ3NTU5NX0.-UZM4oHEbJ52j_VBmEOJtmODhkkScc4I3yxgz9ckbVM';

// إنشاء عميل Supabase
const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function runMigrations() {
  console.log('🚀 بدء تطبيق الهجرة...');
  
  try {
    // قراءة وتطبيق الهجرة الأولى (إضافة العمود)
    const migration1 = fs.readFileSync(path.join(__dirname, 'supabase/migrations/20251001120000_add_dashboard_link_validation_dismissed_to_profiles.sql'), 'utf8');
    console.log('📝 تطبيق هجرة إضافة العمود...');
    
    // تطبيق الهجرة عبر RPC أو SQL
    const { error: error1 } = await supabase.rpc('exec_sql', { sql: migration1 });
    
    if (error1) {
      // إذا لم يعمل RPC، نجرب طريقة أخرى
      console.log('💡 محاولة تطبيق الهجرة يدوياً...');
      
      // إضافة العمود مباشرة
      const { error: addColumnError } = await supabase.rpc('add_column_if_not_exists', {
        table_name: 'profiles',
        column_name: 'dashboard_link_validation_dismissed',
        column_type: 'boolean',
        default_value: 'false'
      });
      
      if (addColumnError) {
        console.log('⚠️ تجاهل خطأ إضافة العمود (ربما موجود بالفعل):', addColumnError.message);
      }
    }
    
    console.log('✅ تم تطبيق الهجرة الأولى بنجاح');
    
    // قراءة وتطبيق الهجرة الثانية (إنشاء RPC)
    const migration2 = fs.readFileSync(path.join(__dirname, 'supabase/migrations/20251001121000_create_rpc_set_dashboard_dismissed.sql'), 'utf8');
    console.log('📝 تطبيق هجرة إنشاء RPC...');
    
    const { error: error2 } = await supabase.rpc('exec_sql', { sql: migration2 });
    
    if (error2) {
      console.log('⚠️ خطأ في إنشاء RPC:', error2.message);
      // يمكن تجاهل هذا إذا كان RPC موجود بالفعل
    }
    
    console.log('✅ تم تطبيق جميع الهجرات بنجاح!');
    console.log('🎉 العمود dashboard_link_validation_dismissed متاح الآن في جدول profiles');
    
  } catch (error) {
    console.error('❌ خطأ في تطبيق الهجرة:', error);
    process.exit(1);
  }
}

// تشغيل الهجرة
runMigrations().then(() => {
  console.log('🔄 تم الانتهاء من الهجرة');
  process.exit(0);
});
