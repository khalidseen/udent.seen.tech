import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { User, Session } from '@supabase/supabase-js';
import { toast } from '@/hooks/use-toast';

export const useAuth = () => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);
      }
    );

    // Check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signIn = async (email: string, password: string) => {
    try {
      setLoading(true);
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (error) {
        toast({
          title: 'خطأ في تسجيل الدخول',
          description: error.message,
          variant: 'destructive'
        });
        return { error };
      }

      toast({
        title: 'تم تسجيل الدخول بنجاح',
        description: 'مرحباً بك في نظام إدارة العيادة'
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
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/`,
          data: {
            full_name: fullName
          }
        }
      });

      if (error) {
        toast({
          title: 'خطأ في إنشاء الحساب',
          description: error.message,
          variant: 'destructive'
        });
        return { error };
      }

      // Create profile after successful signup
      if (data.user) {
        try {
          await supabase
            .from('profiles')
            .insert({
              user_id: data.user.id,
              full_name: fullName,
              role: 'doctor'
            });
        } catch (profileError) {
          console.warn('Profile creation warning:', profileError);
          // Don't fail the signup if profile creation fails
        }

        toast({
          title: 'تم إنشاء الحساب بنجاح',
          description: 'تم إرسال رسالة تأكيد إلى بريدك الإلكتروني'
        });
      }

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
      const { data, error } = await supabase.auth.signInWithPassword({
        email: 'demo@clinic.com',
        password: 'demo123456'
      });

      if (error) {
        // If demo user doesn't exist, create it
        if (error.message.includes('Invalid login credentials')) {
          const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
            email: 'demo@clinic.com',
            password: 'demo123456',
            options: {
              emailRedirectTo: `${window.location.origin}/`,
              data: {
                full_name: 'د. أحمد محمد - تجريبي'
              }
            }
          });

          if (signUpError) {
            toast({
              title: 'خطأ في إنشاء الحساب التجريبي',
              description: signUpError.message,
              variant: 'destructive'
            });
            return { error: signUpError };
          }

          // If sign up successful, create profile
          if (signUpData.user) {
            try {
              await supabase
                .from('profiles')
                .insert({
                  user_id: signUpData.user.id,
                  full_name: 'د. أحمد محمد - تجريبي',
                  role: 'doctor',
                  phone: '+201234567890',
                  specialization: 'طب الأسنان العام'
                });
            } catch (profileError) {
              console.warn('Demo profile creation warning:', profileError);
            }

            toast({
              title: 'تم إنشاء الحساب التجريبي',
              description: 'تم تسجيل الدخول بنجاح'
            });
          }

          return { data: signUpData, error: null };
        } else {
          toast({
            title: 'خطأ في تسجيل الدخول',
            description: error.message,
            variant: 'destructive'
          });
          return { error };
        }
      }

      toast({
        title: 'تم تسجيل الدخول بنجاح',
        description: 'مرحباً بك في نظام إدارة العيادة'
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
    const { error } = await supabase.auth.signOut();
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