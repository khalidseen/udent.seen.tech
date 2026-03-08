import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { User, Session, AuthError } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  initialized: boolean;
  signIn: (email: string, password: string) => Promise<{ success: boolean; data?: any; error?: AuthError }>;
  signOut: () => Promise<{ success: boolean; error?: AuthError }>;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [initialized, setInitialized] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    let mounted = true;
    let initFlag = false;

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, currentSession) => {
        if (mounted) {
          setSession(currentSession);
          setUser(currentSession?.user ?? null);
          if (!initFlag) {
            setLoading(false);
            setInitialized(true);
            initFlag = true;
          }
        }
      }
    );

    const initializeAuth = async () => {
      try {
        const { data: { session: currentSession }, error } = await supabase.auth.getSession();
        if (error) throw error;
        if (mounted) {
          setSession(currentSession);
          setUser(currentSession?.user ?? null);
          setLoading(false);
          setInitialized(true);
          initFlag = true;
        }
      } catch {
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
      setLoading(true);
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      toast({ title: 'تم تسجيل الدخول بنجاح', description: 'مرحباً ' + (data.user?.email || '') });
      return { success: true, data };
    } catch (error) {
      const authError = error as AuthError;
      toast({ title: 'خطأ في تسجيل الدخول', description: authError.message || 'حدث خطأ أثناء تسجيل الدخول', variant: 'destructive' });
      return { success: false, error: authError };
    } finally {
      setLoading(false);
    }
  }, [toast]);

  const signOut = useCallback(async () => {
    try {
      setLoading(true);
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      setUser(null);
      setSession(null);
      toast({ title: 'تم تسجيل الخروج', description: 'نراك قريباً!' });
      return { success: true };
    } catch (error) {
      const authError = error as AuthError;
      toast({ title: 'خطأ في تسجيل الخروج', description: authError.message, variant: 'destructive' });
      return { success: false, error: authError };
    } finally {
      setLoading(false);
    }
  }, [toast]);

  return (
    <AuthContext.Provider value={{ user, session, loading, initialized, signIn, signOut, isAuthenticated: !!user }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuthContext() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuthContext must be used within an AuthProvider');
  }
  return context;
}
