import { useState, useEffect, useCallback } from 'react';
import { User, Session, AuthError } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [initialized, setInitialized] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    let mounted = true;
    let initFlag = false;
    
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, currentSession) => {
        console.log('🔄 Auth state changed:', event);
        
        if (mounted) {
          setSession(currentSession);
          setUser(currentSession?.user ?? null);
          
          if (event === 'SIGNED_IN') {
            console.log('✅ User signed in:', currentSession?.user?.email);
          } else if (event === 'SIGNED_OUT') {
            console.log('👋 User signed out');
          }
          
          // Mark as initialized on any auth event
          if (!initFlag) {
            setLoading(false);
            setInitialized(true);
            initFlag = true;
          }
        }
      }
    );
    
    // THEN check for existing session
    const initializeAuth = async () => {
      try {
        console.log('🔐 Initializing auth...');
        const { data: { session: currentSession }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('❌ Error getting session:', error);
          throw error;
        }

        if (mounted) {
          console.log('📋 Session found:', currentSession ? '✅ Active' : '❌ None');
          setSession(currentSession);
          setUser(currentSession?.user ?? null);
          setLoading(false);
          setInitialized(true);
          initFlag = true;
        }
      } catch (error) {
        console.error('❌ Auth initialization error:', error);
        if (mounted) {
          setSession(null);
          setUser(null);
          setLoading(false);
          setInitialized(true);
          initFlag = true;
        }
      }
    };

    initializeAuth();

    const timeoutId = setTimeout(() => {
      if (!initFlag && mounted) {
        console.warn('⚠️ Auth initialization timeout - forcing completion');
        setLoading(false);
        setInitialized(true);
      }
    }, 3000);

    return () => {
      mounted = false;
      clearTimeout(timeoutId);
      subscription.unsubscribe();
    };
  }, []);

  const signIn = useCallback(async (email: string, password: string) => {
    try {
      console.log(' Attempting sign in for:', email);
      setLoading(true);

      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      console.log(' Sign in successful');
      
      toast({
        title: 'تم تسجيل الدخول بنجاح',
        description: 'مرحباً ' + (data.user?.email || ''),
      });

      return { success: true, data };
    } catch (error) {
      console.error(' Sign in error:', error);
      const authError = error as AuthError;
      
      toast({
        title: 'خطأ في تسجيل الدخول',
        description: authError.message || 'حدث خطأ أثناء تسجيل الدخول',
        variant: 'destructive',
      });

      return { success: false, error: authError };
    } finally {
      setLoading(false);
    }
  }, [toast]);

  const signOut = useCallback(async () => {
    try {
      console.log(' Attempting sign out...');
      setLoading(true);

      const { error } = await supabase.auth.signOut();

      if (error) throw error;

      console.log(' Sign out successful');
      
      setUser(null);
      setSession(null);

      toast({
        title: 'تم تسجيل الخروج',
        description: 'نراك قريباً!',
      });

      return { success: true };
    } catch (error) {
      console.error(' Sign out error:', error);
      const authError = error as AuthError;
      
      toast({
        title: 'خطأ في تسجيل الخروج',
        description: authError.message,
        variant: 'destructive',
      });

      return { success: false, error: authError };
    } finally {
      setLoading(false);
    }
  }, [toast]);

  return {
    user,
    session,
    loading,
    initialized,
    signIn,
    signOut,
    isAuthenticated: !!user,
  };
}
