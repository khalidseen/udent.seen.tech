import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { User, Session, AuthError } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { generateDeviceHash } from '@/lib/deviceFingerprint';
import { setUser as setMonitoringUser, clearUser as clearMonitoringUser } from '@/services/monitoring';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  initialized: boolean;
  signIn: (email: string, password: string) => Promise<{ success: boolean; data?: any; error?: AuthError }>;
  signOut: () => Promise<{ success: boolean; error?: AuthError }>;
  isAuthenticated: boolean;
  // OTP 2FA
  needsOtp: boolean;
  otpMaskedPhone: string | null;
  verifyOtp: (code: string, rememberDevice: boolean) => Promise<{ success: boolean; error?: string }>;
  resendOtp: () => Promise<{ success: boolean; error?: string }>;
  cancelOtp: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [initialized, setInitialized] = useState(false);
  const [needsOtp, setNeedsOtp] = useState(false);
  const [otpMaskedPhone, setOtpMaskedPhone] = useState<string | null>(null);
  const [pendingSession, setPendingSession] = useState<Session | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    let mounted = true;
    let initFlag = false;

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, currentSession) => {
        if (mounted && !needsOtp) {
          setSession(currentSession);
          setUser(currentSession?.user ?? null);
          // Sync monitoring user context
          if (currentSession?.user) {
            setMonitoringUser({ id: currentSession.user.id, email: currentSession.user.email });
          } else {
            clearMonitoringUser();
          }
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
  }, [needsOtp]);

  const checkTrustedDevice = useCallback(async (userId: string): Promise<boolean> => {
    try {
      const hash = await generateDeviceHash();
      const { data } = await supabase
        .from('trusted_devices')
        .select('id, expires_at')
        .eq('user_id', userId)
        .eq('device_hash', hash)
        .maybeSingle();

      if (data && new Date(data.expires_at) > new Date()) {
        return true;
      }
      return false;
    } catch {
      return false;
    }
  }, []);

  const sendOtp = useCallback(async (accessToken: string): Promise<{ success: boolean; maskedPhone?: string; error?: string }> => {
    try {
      const { data, error } = await supabase.functions.invoke('send-otp-whatsapp', {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      if (error) return { success: false, error: 'فشل إرسال رمز التحقق.' };
      if (data?.success) return { success: true, maskedPhone: data.maskedPhone };
      return { success: false, error: data?.error || 'فشل إرسال رمز التحقق.' };
    } catch {
      return { success: false, error: 'فشل إرسال رمز التحقق.' };
    }
  }, []);

  const signIn = useCallback(async (email: string, password: string) => {
    try {
      setLoading(true);
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;

      const userId = data.user?.id;
      const accessToken = data.session?.access_token;
      if (!userId || !accessToken) throw new Error('Missing user data');

      // Check if user has whatsapp_number
      const { data: profile } = await supabase
        .from('profiles')
        .select('whatsapp_number')
        .eq('user_id', userId)
        .maybeSingle();

      if (!profile?.whatsapp_number) {
        // No WhatsApp number → direct login
        toast({ title: 'تم تسجيل الدخول بنجاح', description: 'مرحباً ' + (data.user?.email || '') });
        return { success: true, data };
      }

      // Check trusted device
      const isTrusted = await checkTrustedDevice(userId);
      if (isTrusted) {
        toast({ title: 'تم تسجيل الدخول بنجاح', description: 'مرحباً ' + (data.user?.email || '') });
        return { success: true, data };
      }

      // Need OTP — hold the session but don't expose user yet
      setPendingSession(data.session);
      setNeedsOtp(true);

      // Send OTP
      const otpResult = await sendOtp(accessToken);
      if (otpResult.success) {
        setOtpMaskedPhone(otpResult.maskedPhone || null);
      } else {
        // If OTP send fails, still show OTP screen but notify
        toast({ title: 'تنبيه', description: otpResult.error || 'فشل إرسال الرمز. حاول إعادة الإرسال.', variant: 'destructive' });
      }

      // Sign out temporarily so user isn't authenticated yet
      // We keep the session token in pendingSession for OTP verification
      await supabase.auth.signOut();
      setUser(null);
      setSession(null);

      return { success: true, data: { needsOtp: true } };
    } catch (error) {
      const authError = error as AuthError;
      toast({ title: 'خطأ في تسجيل الدخول', description: authError.message || 'حدث خطأ أثناء تسجيل الدخول', variant: 'destructive' });
      return { success: false, error: authError };
    } finally {
      setLoading(false);
    }
  }, [toast, checkTrustedDevice, sendOtp]);

  const verifyOtp = useCallback(async (code: string, rememberDevice: boolean) => {
    try {
      setLoading(true);
      if (!pendingSession?.access_token) {
        return { success: false, error: 'جلسة منتهية. أعد تسجيل الدخول.' };
      }

      const deviceHash = rememberDevice ? await generateDeviceHash() : undefined;

      const { data, error } = await supabase.functions.invoke('verify-otp', {
        headers: { Authorization: `Bearer ${pendingSession.access_token}` },
        body: { code, device_hash: deviceHash, remember_device: rememberDevice },
      });

      if (error || !data?.verified) {
        return { success: false, error: data?.error || 'فشل التحقق من الرمز.' };
      }

      // OTP verified — restore the session
      const { data: refreshData, error: refreshError } = await supabase.auth.setSession({
        access_token: pendingSession.access_token,
        refresh_token: pendingSession.refresh_token,
      });

      if (refreshError) {
        return { success: false, error: 'فشل استعادة الجلسة. أعد تسجيل الدخول.' };
      }

      setUser(refreshData.session?.user ?? null);
      setSession(refreshData.session);
      setNeedsOtp(false);
      setPendingSession(null);
      setOtpMaskedPhone(null);

      toast({ title: 'تم تسجيل الدخول بنجاح', description: 'مرحباً ' + (refreshData.session?.user?.email || '') });
      return { success: true };
    } catch {
      return { success: false, error: 'حدث خطأ غير متوقع.' };
    } finally {
      setLoading(false);
    }
  }, [pendingSession, toast]);

  const resendOtp = useCallback(async () => {
    if (!pendingSession?.access_token) {
      return { success: false, error: 'جلسة منتهية. أعد تسجيل الدخول.' };
    }
    const result = await sendOtp(pendingSession.access_token);
    if (result.success) {
      setOtpMaskedPhone(result.maskedPhone || null);
      toast({ title: 'تم إعادة الإرسال', description: 'تم إرسال رمز جديد إلى واتساب.' });
    }
    return result;
  }, [pendingSession, sendOtp, toast]);

  const cancelOtp = useCallback(() => {
    setNeedsOtp(false);
    setPendingSession(null);
    setOtpMaskedPhone(null);
    setUser(null);
    setSession(null);
  }, []);

  const signOut = useCallback(async () => {
    try {
      setLoading(true);
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      setUser(null);
      setSession(null);
      setNeedsOtp(false);
      setPendingSession(null);
      setOtpMaskedPhone(null);
      clearMonitoringUser();
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
    <AuthContext.Provider value={{
      user, session, loading, initialized, signIn, signOut,
      isAuthenticated: !!user,
      needsOtp, otpMaskedPhone, verifyOtp, resendOtp, cancelOtp,
    }}>
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
