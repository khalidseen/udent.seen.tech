import { offlineDB } from './offline-db';
import { supabase } from '@/integrations/supabase/client';

interface OfflineUser {
  id: string;
  email: string;
  password_hash: string;
  full_name: string;
  role: string;
  created_at: string;
}

interface OfflineSession {
  id: string;
  user_id: string;
  access_token: string;
  refresh_token: string;
  expires_at: string;
  created_at: string;
}

// Simple hash function for passwords (not secure, just for demo)
async function simpleHash(password: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(password + 'clinic_salt');
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

class OfflineAuth {
  private isOnline(): boolean {
    return navigator.onLine;
  }

  async signIn(email: string, password: string) {
    if (this.isOnline()) {
      try {
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password
        });
        
        if (!error && data.user && data.session) {
          // Cache user data for offline use
          const passwordHash = await simpleHash(password);
          const offlineUser: OfflineUser = {
            id: data.user.id,
            email: data.user.email!,
            password_hash: passwordHash,
            full_name: data.user.user_metadata?.full_name || email,
            role: 'doctor',
            created_at: new Date().toISOString()
          };
          
          const offlineSession: OfflineSession = {
            id: data.session.access_token.substring(0, 20),
            user_id: data.user.id,
            access_token: data.session.access_token,
            refresh_token: data.session.refresh_token || '',
            expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // 24 hours
            created_at: new Date().toISOString()
          };
          
          await offlineDB.put('offline_users', offlineUser);
          await offlineDB.put('offline_sessions', offlineSession);
        }
        
        return { data, error };
      } catch (error) {
        // If online auth fails, try offline
        return this.signInOffline(email, password);
      }
    } else {
      return this.signInOffline(email, password);
    }
  }

  private async signInOffline(email: string, password: string) {
    try {
      const passwordHash = await simpleHash(password);
      const users = await offlineDB.getAll('offline_users');
      const user = users.find((u: OfflineUser) => 
        u.email === email && u.password_hash === passwordHash
      );
      
      if (!user) {
        return {
          data: { user: null, session: null },
          error: { message: 'بيانات الدخول غير صحيحة' }
        };
      }
      
      // Create offline session
      const sessionId = crypto.randomUUID();
      const offlineSession: OfflineSession = {
        id: sessionId,
        user_id: user.id,
        access_token: `offline_${sessionId}`,
        refresh_token: '',
        expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        created_at: new Date().toISOString()
      };
      
      await offlineDB.put('offline_sessions', offlineSession);
      
      // Create fake user and session objects
    const fakeUser = {
      id: user.id,
      email: user.email,
      user_metadata: { full_name: user.full_name },
      app_metadata: { provider: 'offline', providers: ['offline'] },
      created_at: user.created_at,
      updated_at: user.created_at,
      aud: 'authenticated',
      role: 'authenticated',
      email_confirmed_at: user.created_at,
      phone: '',
      confirmed_at: user.created_at,
      last_sign_in_at: new Date().toISOString(),
      identities: []
    };
      
      const fakeSession = {
        access_token: offlineSession.access_token,
        refresh_token: offlineSession.refresh_token,
        expires_at: Math.floor(new Date(offlineSession.expires_at).getTime() / 1000),
        expires_in: 86400, // 24 hours
        token_type: 'bearer',
        user: fakeUser
      };
      
      return {
        data: { user: fakeUser, session: fakeSession },
        error: null
      };
    } catch (error) {
      return {
        data: { user: null, session: null },
        error: { message: 'خطأ في تسجيل الدخول بدون اتصال' }
      };
    }
  }

  async signUp(email: string, password: string, fullName: string) {
    if (this.isOnline()) {
      try {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/`,
            data: { full_name: fullName }
          }
        });
        
        if (!error && data.user) {
          // Cache user for offline use
          const passwordHash = await simpleHash(password);
          const offlineUser: OfflineUser = {
            id: data.user.id,
            email: email,
            password_hash: passwordHash,
            full_name: fullName,
            role: 'doctor',
            created_at: new Date().toISOString()
          };
          
          await offlineDB.put('offline_users', offlineUser);
        }
        
        return { data, error };
      } catch (error) {
        // If online signup fails, create offline user
        return this.signUpOffline(email, password, fullName);
      }
    } else {
      return this.signUpOffline(email, password, fullName);
    }
  }

  private async signUpOffline(email: string, password: string, fullName: string) {
    try {
      // Check if user already exists
      const users = await offlineDB.getAll('offline_users');
      const existingUser = users.find((u: OfflineUser) => u.email === email);
      
      if (existingUser) {
        return {
          data: { user: null, session: null },
          error: { message: 'المستخدم موجود مسبقاً' }
        };
      }
      
      const passwordHash = await simpleHash(password);
      const userId = crypto.randomUUID();
      
      const offlineUser: OfflineUser = {
        id: userId,
        email: email,
        password_hash: passwordHash,
        full_name: fullName,
        role: 'doctor',
        created_at: new Date().toISOString()
      };
      
      await offlineDB.put('offline_users', offlineUser);
      
      // Auto sign in after signup
      return this.signIn(email, password);
    } catch (error) {
      return {
        data: { user: null, session: null },
        error: { message: 'خطأ في إنشاء الحساب بدون اتصال' }
      };
    }
  }

  async signInDemo() {
    // Create/login with demo user
    const demoEmail = 'demo@clinic.com';
    const demoPassword = 'demo123456';
    const demoName = 'د. أحمد محمد - تجريبي';
    
    // Try to create demo user first (will fail if exists, which is fine)
    await this.signUpOffline(demoEmail, demoPassword, demoName);
    
    // Then sign in
    return this.signIn(demoEmail, demoPassword);
  }

  async signOut() {
    try {
      // Clear offline sessions
      const sessions = await offlineDB.getAll('offline_sessions');
      for (const session of sessions) {
        await offlineDB.delete('offline_sessions', session.id);
      }
      
      if (this.isOnline()) {
        return await supabase.auth.signOut();
      }
      
      return { error: null };
    } catch (error) {
      return { error: { message: 'خطأ في تسجيل الخروج' } };
    }
  }

  async getCurrentSession() {
    if (this.isOnline()) {
      try {
        return await supabase.auth.getSession();
      } catch (error) {
        // Fallback to offline session
      }
    }
    
    // Get offline session
    const sessions = await offlineDB.getAll('offline_sessions');
    const validSession = sessions.find((s: OfflineSession) => 
      new Date(s.expires_at) > new Date()
    );
    
    if (!validSession) {
      return { data: { session: null }, error: null };
    }
    
    const user = await offlineDB.get('offline_users', validSession.user_id);
    if (!user) {
      return { data: { session: null }, error: null };
    }
    
    const fakeUser = {
      id: user.id,
      email: user.email,
      user_metadata: { full_name: user.full_name },
      app_metadata: { provider: 'offline', providers: ['offline'] },
      created_at: user.created_at,
      updated_at: user.created_at,
      aud: 'authenticated',
      role: 'authenticated',
      email_confirmed_at: user.created_at,
      phone: '',
      confirmed_at: user.created_at,
      last_sign_in_at: new Date().toISOString(),
      identities: []
    };
    
    const fakeSession = {
      access_token: validSession.access_token,
      refresh_token: validSession.refresh_token,
      expires_at: Math.floor(new Date(validSession.expires_at).getTime() / 1000),
      expires_in: 86400,
      token_type: 'bearer',
      user: fakeUser
    };
    
    return { data: { session: fakeSession }, error: null };
  }
}

export const offlineAuth = new OfflineAuth();