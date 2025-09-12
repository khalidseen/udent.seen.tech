// 🦷 Enhanced Dental Chart Migration Runner
// تشغيل مايجريشن قاعدة البيانات للنظام المحسن

import { exec } from 'child_process';
import { promisify } from 'util';
import path from 'path';

const execAsync = promisify(exec);

async function runMigration() {
  console.log('🚀 بدء تشغيل مايجريشن نظام مخطط الأسنان المحسن...');
  
  try {
    // تشغيل مايجريشن Supabase
    const migrationPath = path.join(__dirname, 'supabase', 'migrations', 'create_enhanced_dental_chart.sql');
    
    console.log('📂 مسار المايجريشن:', migrationPath);
    
    // تشغيل أمر Supabase migration
    const { stdout, stderr } = await execAsync(`npx supabase db push --include-all`, {
      cwd: process.cwd()
    });
    
    if (stderr) {
      console.error('❌ خطأ في المايجريشن:', stderr);
      return;
    }
    
    console.log('✅ تم تشغيل المايجريشن بنجاح!');
    console.log(stdout);
    
    // التحقق من الجداول المنشأة
    console.log('\n📋 التحقق من الجداول المنشأة...');
    
    const tablesCheck = await execAsync(`npx supabase db show`, {
      cwd: process.cwd()
    });
    
    console.log('📊 حالة قاعدة البيانات:');
    console.log(tablesCheck.stdout);
    
    console.log('\n🎉 تم إعداد نظام مخطط الأسنان المحسن بنجاح!');
    
  } catch (error) {
    console.error('❌ فشل في تشغيل المايجريشن:', error);
    console.log('\n🔧 لتشغيل المايجريشن يدوياً:');
    console.log('1. npx supabase start');
    console.log('2. npx supabase db push');
    console.log('3. أو قم بنسخ محتوى create_enhanced_dental_chart.sql وتشغيله في Supabase');
  }
}

// تشغيل المايجريشن
runMigration();
