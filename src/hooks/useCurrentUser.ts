import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface CurrentUser {
  id: string;
  full_name: string;
  email: string;
  role: string;
  profile_picture_url?: string;
}

export const useCurrentUser = () => {
  const [user, setUser] = useState<CurrentUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCurrentUser();
  }, []);

  const fetchCurrentUser = async () => {
    try {
      setLoading(true);
      
      // تحقق من جلسة المدير التجريبية أولاً
      const tempAdminSession = localStorage.getItem('temp_admin_session');
      if (tempAdminSession) {
        try {
          const tempUser = JSON.parse(tempAdminSession);
          setUser(tempUser);
          console.log('🔓 استخدام صلاحيات تجريبية:', tempUser);
          return;
        } catch (error) {
          console.error('خطأ في تحليل الجلسة التجريبية:', error);
          localStorage.removeItem('temp_admin_session');
        }
      }
      
      const { data: { user: authUser } } = await supabase.auth.getUser();
      
      if (!authUser) {
        setUser(null);
        return;
      }

      const { data: profile, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', authUser.id)
        .single();

      if (error) throw error;

      setUser({
        id: profile.id,
        full_name: profile.full_name,
        email: authUser.email || '',
        role: profile.role
      });
    } catch (error) {
      console.error('خطأ في جلب بيانات المستخدم:', error);
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  return { user, loading, fetchCurrentUser };
};
