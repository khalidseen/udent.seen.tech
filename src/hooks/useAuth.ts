import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
<<<<<<< HEAD
import { User, Session, Subscription } from '@supabase/supabase-js';
=======
import { User, Session } from '@supabase/supabase-js';
>>>>>>> cbd682d36e862741c55b9e7b5d144f8de65c694a
import { toast } from '@/hooks/use-toast';

export const useAuth = () => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
<<<<<<< HEAD
    let subscription: Subscription | null = null;
=======
    let subscription: any = null;
>>>>>>> cbd682d36e862741c55b9e7b5d144f8de65c694a
    
    const initAuth = async () => {
      try {
        // Set up auth state listener
        const { data: { subscription: sub } } = supabase.auth.onAuthStateChange(
          (event, session) => {
            setSession(session);
            setUser(session?.user ?? null);
            setLoading(false);
          }
        );
        subscription = sub;

        // Check for existing session
        try {
          const { data: { session } } = await supabase.auth.getSession();
          setSession(session);
          setUser(session?.user ?? null);
<<<<<<< HEAD
          

=======
>>>>>>> cbd682d36e862741c55b9e7b5d144f8de65c694a
        } catch (error) {
          console.warn('Failed to get session:', error);
        }
      } catch (error) {
        console.warn('Auth initialization error:', error);
      } finally {
        // Always set loading to false after 1 second max
        setTimeout(() => setLoading(false), 1000);
      }
    };

    initAuth();

    return () => {
      if (subscription) {
        subscription.unsubscribe();
      }
    };
  }, []);

  const signIn = async (email: string, password: string) => {
    setLoading(true);
    
    try {
      const result = await supabase.auth.signInWithPassword({ 
        email, 
        password
      });

      if (result.error) {
        toast({
          title: "فشل تسجيل الدخول",
          description: result.error.message,
          variant: "destructive"
        });
      } else {
        toast({
          title: "تم تسجيل الدخول بنجاح",
          description: "أهلاً وسهلاً بك"
        });
      }
      return result;
<<<<<<< HEAD
    } catch (error: unknown) {
=======
    } catch (error: any) {
>>>>>>> cbd682d36e862741c55b9e7b5d144f8de65c694a
      toast({
        title: "خطأ في الاتصال",
        description: "تحقق من اتصال الإنترنت وحاول مرة أخرى",
        variant: "destructive"
      });
      return { error };
    } finally {
      setLoading(false);
    }
  };

  const signUp = async (email: string, password: string, fullName: string) => {
    setLoading(true);
    
    try {
      const result = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName
          }
        }
      });

      if (result.error) {
        toast({
          title: "فشل إنشاء الحساب",
          description: result.error.message,
          variant: "destructive"
        });
      } else {
        toast({
          title: "تم إنشاء الحساب بنجاح",
          description: "تحقق من بريدك الإلكتروني لتأكيد الحساب"
        });
      }
      return result;
<<<<<<< HEAD
    } catch (error: unknown) {
=======
    } catch (error: any) {
>>>>>>> cbd682d36e862741c55b9e7b5d144f8de65c694a
      toast({
        title: "خطأ في الاتصال",
        description: "تحقق من اتصال الإنترنت وحاول مرة أخرى",
        variant: "destructive"
      });
      return { error };
    } finally {
      setLoading(false);
    }
  };

  const signInDemo = async () => {
    setLoading(true);
    
    try {
      // Use predefined demo credentials
      const result = await supabase.auth.signInWithPassword({
        email: 'demo@clinic.com',
        password: 'DemoPassword123!'
      });

      if (result.error) {
        toast({
          title: "فشل تسجيل الدخول التجريبي",
          description: "حدث خطأ في تسجيل الدخول التجريبي",
          variant: "destructive"
        });
      } else {
        toast({
          title: "تم تسجيل الدخول التجريبي",
          description: "مرحباً بك في النسخة التجريبية"
        });
      }
      return result;
<<<<<<< HEAD
    } catch (error: unknown) {
      toast({
        title: "خطأ في تسجيل الدخول التجريبي",
        description: error instanceof Error ? error.message : "حدث خطأ غير متوقع",
=======
    } catch (error: any) {
      toast({
        title: "خطأ في تسجيل الدخول التجريبي",
        description: error.message || "حدث خطأ غير متوقع",
>>>>>>> cbd682d36e862741c55b9e7b5d144f8de65c694a
        variant: "destructive"
      });
      return { error };
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    setLoading(true);
    
    try {
<<<<<<< HEAD
      // تسجيل الخروج من Supabase
      const { error } = await supabase.auth.signOut();
      
      if (error) throw error;
=======
      await supabase.auth.signOut();
      
      // Clear local state
      setUser(null);
      setSession(null);
>>>>>>> cbd682d36e862741c55b9e7b5d144f8de65c694a
      
      toast({
        title: "تم تسجيل الخروج",
        description: "تم تسجيل الخروج بنجاح"
      });
<<<<<<< HEAD
    } catch (error: unknown) {
      toast({
        title: "خطأ في تسجيل الخروج",
        description: error instanceof Error ? error.message : "حدث خطأ أثناء تسجيل الخروج",
=======
    } catch (error: any) {
      toast({
        title: "خطأ في تسجيل الخروج",
        description: error.message || "حدث خطأ أثناء تسجيل الخروج",
>>>>>>> cbd682d36e862741c55b9e7b5d144f8de65c694a
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
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