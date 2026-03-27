import { supabase } from '@/integrations/supabase/client';

export async function initializeDatabaseSchema() {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      return false;
    }

    const { data, error } = await supabase.from('profiles').select('dashboard_link_validation_dismissed').limit(1);
    
    if (error && error.message.includes('does not exist')) {
      // Column dashboard_link_validation_dismissed not in DB
      return false;
    } else if (!error) {
      return true;
    }
    
    return false;
  } catch (error) {
    console.error('❌ خطأ في فحص مخطط قاعدة البيانات:', error);
    return false;
  }
}

export let isDashboardColumnAvailable = true;
