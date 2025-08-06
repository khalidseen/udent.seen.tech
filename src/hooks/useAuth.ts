import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { User, Session } from '@supabase/supabase-js';
import { toast } from '@/hooks/use-toast';
import { offlineAuth } from '@/lib/offline-auth';
import { useNetworkStatus } from './useNetworkStatus';

export const useAuth = () => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const { isOnline } = useNetworkStatus();

  useEffect(() => {
    let subscription: any = null;
    
    const initAuth = async () => {
      if (isOnline) {
        // Set up auth state listener for online mode
        const { data: { subscription: sub } } = supabase.auth.onAuthStateChange(
          (event, session) => {
            setSession(session);
            setUser(session?.user ?? null);
            setLoading(false);
          }
        );
        subscription = sub;

        // Check for existing online session
        supabase.auth.getSession().then(({ data: { session } }) => {
          setSession(session);
          setUser(session?.user ?? null);
          setLoading(false);
        });
      } else {
        // Check for offline session
        const { data: { session } } = await offlineAuth.getCurrentSession();
        setSession(session as Session);
        setUser(session?.user as User ?? null);
        setLoading(false);
      }
    };

    initAuth();

    return () => {
      if (subscription) {
        subscription.unsubscribe();
      }
    };
  }, [isOnline]);

  const signIn = async (email: string, password: string) => {
    try {
      setLoading(true);
      const { data, error } = await offlineAuth.signIn(email, password);

      if (error) {
        toast({
          title: 'خطأ في تسجيل الدخول',
          description: error.message,
          variant: 'destructive'
        });
        return { error };
      }

      setSession(data.session as Session);
      setUser(data.user as User);

      toast({
        title: 'تم تسجيل الدخول بنجاح',
        description: `مرحباً بك في نظام إدارة العيادة ${isOnline ? '' : '(وضع offline)'}`
      });

      return { data, error: null };
    } catch (error: any) {
      toast({
        title: 'خطأ',
        description: error.message,
        variant: 'destructive'
      });
      return { error };
    } finally {
      setLoading(false);
    }
  };

  const signUp = async (email: string, password: string, fullName: string) => {
    try {
      setLoading(true);
      const { data, error } = await offlineAuth.signUp(email, password, fullName);

      if (error) {
        toast({
          title: 'خطأ في إنشاء الحساب',
          description: error.message,
          variant: 'destructive'
        });
        return { error };
      }

      setSession(data.session as Session);
      setUser(data.user as User);

      toast({
        title: 'تم إنشاء الحساب بنجاح',
        description: `تم تسجيل الدخول بنجاح ${isOnline ? '' : '(وضع offline)'}`
      });

      return { data, error: null };
    } catch (error: any) {
      toast({
        title: 'خطأ',
        description: error.message,
        variant: 'destructive'
      });
      return { error };
    } finally {
      setLoading(false);
    }
  };

  const signInDemo = async () => {
    try {
      setLoading(true);
      const { data, error } = await offlineAuth.signInDemo();

      if (error) {
        toast({
          title: 'خطأ في تسجيل الدخول التجريبي',
          description: error.message,
          variant: 'destructive'
        });
        return { error };
      }

      setSession(data.session as Session);
      setUser(data.user as User);

      toast({
        title: 'تم تسجيل الدخول بنجاح',
        description: `مرحباً بك في النظام التجريبي ${isOnline ? '' : '(وضع offline)'}`
      });

      return { data, error: null };
    } catch (error: any) {
      toast({
        title: 'خطأ',
        description: error.message,
        variant: 'destructive'
      });
      return { error };
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    const { error } = await offlineAuth.signOut();
    
    setUser(null);
    setSession(null);
    
    if (error) {
      toast({
        title: 'خطأ في تسجيل الخروج',
        description: error.message,
        variant: 'destructive'
      });
    } else {
      toast({
        title: 'تم تسجيل الخروج',
        description: 'نراك قريباً'
      });
    }
    return { error };
  };

  return {
    user,
    session,
    loading,
    signIn,
    signUp,
    signInDemo,
    signOut
  };
};