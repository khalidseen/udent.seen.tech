import { useState, useEffect, ReactNode } from 'react';
import { SettingsContext, SettingsContextType } from './SettingsContextType';
import { isDashboardColumnAvailable } from '@/lib/database-init';

interface SettingsProviderProps {
  children: ReactNode;
}

export function SettingsProvider({ children }: SettingsProviderProps) {
  const [fontWeight, setFontWeight] = useState<'normal' | 'bold'>(() => {
    const saved = localStorage.getItem('fontWeight');
    return (saved as 'normal' | 'bold') || 'normal';
  });

  const [sidebarIconSize, setSidebarIconSize] = useState<'small' | 'medium' | 'large'>(() => {
    const saved = localStorage.getItem('sidebarIconSize');
    return (saved as 'small' | 'medium' | 'large') || 'medium';
  });

  const [collapsedIconSize, setCollapsedIconSize] = useState<'small' | 'medium' | 'large'>(() => {
    const saved = localStorage.getItem('collapsedIconSize');
    return (saved as 'small' | 'medium' | 'large') || 'large';
  });

  const [showDashboardBoxes, setShowDashboardBoxes] = useState<boolean>(() => {
    const saved = localStorage.getItem('showDashboardBoxes');
    return saved ? JSON.parse(saved) : true;
  });

  const [boxesPerRow, setBoxesPerRow] = useState<number>(() => {
    const saved = localStorage.getItem('boxesPerRow');
    return saved ? parseInt(saved) : 3;
  });

  const [boxSize, setBoxSize] = useState<number>(() => {
    const saved = localStorage.getItem('boxSize');
    return saved ? parseInt(saved) : 200;
  });

  const [linkValidationAlertEnabled, setLinkValidationAlertEnabled] = useState<boolean>(() => {
    const saved = localStorage.getItem('linkValidationAlertEnabled');
    return saved ? JSON.parse(saved) : true;
  });

  // Server-side persisted dismissal flag (per-profile)
  const [serverDashboardDismissed, setServerDashboardDismissed] = useState<boolean | null>(null);

  useEffect(() => {
    localStorage.setItem('fontWeight', fontWeight);
    
    // Apply font weight to the root element
    document.documentElement.style.setProperty(
      '--font-weight-global',
      fontWeight === 'bold' ? '700' : '400'
    );
    
    // Apply font weight class to body
    document.body.classList.toggle('font-bold', fontWeight === 'bold');
  }, [fontWeight]);

  useEffect(() => {
    localStorage.setItem('sidebarIconSize', sidebarIconSize);
  }, [sidebarIconSize]);

  useEffect(() => {
    localStorage.setItem('collapsedIconSize', collapsedIconSize);
  }, [collapsedIconSize]);

  useEffect(() => {
    localStorage.setItem('showDashboardBoxes', JSON.stringify(showDashboardBoxes));
  }, [showDashboardBoxes]);

  useEffect(() => {
    localStorage.setItem('boxesPerRow', boxesPerRow.toString());
  }, [boxesPerRow]);

  useEffect(() => {
    localStorage.setItem('boxSize', boxSize.toString());
  }, [boxSize]);

  useEffect(() => {
    localStorage.setItem('linkValidationAlertEnabled', JSON.stringify(linkValidationAlertEnabled));
  }, [linkValidationAlertEnabled]);

  // On mount, attempt to read the server-side dismissal flag from profiles for the current user
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        // فحص إذا كان العمود متوفر في قاعدة البيانات
        if (!isDashboardColumnAvailable) {
          console.log('💾 استخدام localStorage فقط للعلم - العمود غير متوفر في قاعدة البيانات');
          const local = localStorage.getItem('dashboard_link_validation_dismissed');
          if (local && mounted) setServerDashboardDismissed(JSON.parse(local));
          return;
        }

        const { supabase } = await import('@/integrations/supabase/client');
        const userResp = await supabase.auth.getUser();
        const userId = userResp.data.user?.id;
        if (!userId) {
          // Not authenticated; fall back to localStorage
          const local = localStorage.getItem('dashboard_link_validation_dismissed');
          if (local && mounted) setServerDashboardDismissed(JSON.parse(local));
          return;
        }

        const { data: profile, error } = await supabase.from('profiles').select('id').eq('user_id', userId).single();
        if (error || !profile) {
          const local = localStorage.getItem('dashboard_link_validation_dismissed');
          if (local && mounted) setServerDashboardDismissed(JSON.parse(local));
          return;
        }

        // استخدام RPC للقراءة الآمنة من قاعدة البيانات
        // @ts-expect-error: RPC function exists after migration
        const { data: dismissedData, error: rpcError } = await supabase.rpc('get_dashboard_dismissed', { 
          p_profile_id: profile.id 
        });

        if (mounted) {
          if (!rpcError && dismissedData !== undefined) {
            // استخدام قيمة الخادم
            setServerDashboardDismissed(Boolean(dismissedData));
            localStorage.setItem('dashboard_link_validation_dismissed', JSON.stringify(Boolean(dismissedData)));
          } else {
            // fallback إلى localStorage
            const local = localStorage.getItem('dashboard_link_validation_dismissed');
            if (local) {
              setServerDashboardDismissed(JSON.parse(local));
            }
          }
        }
      } catch (err) {
        const local = localStorage.getItem('dashboard_link_validation_dismissed');
        if (local && mounted) setServerDashboardDismissed(JSON.parse(local));
      }
    })();
    return () => { mounted = false; };
  }, []);

  // Helper to update server-side dismissed flag and mirror to localStorage
  const setDashboardDismissedServer = async (value: boolean) => {
    try {
      // العمود متوفر الآن بعد تطبيق الهجرة
      const { supabase } = await import('@/integrations/supabase/client');
      const userResp = await supabase.auth.getUser();
      const userId = userResp.data.user?.id;
      if (!userId) {
        // Not authenticated; fallback to local
        localStorage.setItem('dashboard_link_validation_dismissed', JSON.stringify(value));
        setServerDashboardDismissed(value);
        return;
      }

      // Find profile id for this user
      const { data: profile } = await supabase.from('profiles').select('id').eq('user_id', userId).single();
      if (!profile) {
        localStorage.setItem('dashboard_link_validation_dismissed', JSON.stringify(value));
        setServerDashboardDismissed(value);
        return;
      }

      // استخدام RPC function للتحديث الآمن
      // @ts-expect-error: RPC function exists after migration but may not be in type definitions yet
      const { error } = await supabase.rpc('set_dashboard_dismissed', { 
        p_profile_id: profile.id, 
        p_value: value 
      });
      
      if (error) {
        console.warn('⚠️ خطأ في تحديث الخادم، استخدام localStorage:', error.message);
        localStorage.setItem('dashboard_link_validation_dismissed', JSON.stringify(value));
        setServerDashboardDismissed(value);
        return;
      }

      // Success - تم الحفظ على الخادم
      localStorage.setItem('dashboard_link_validation_dismissed', JSON.stringify(value));
      setServerDashboardDismissed(value);
      console.log('✅ تم حفظ علم الإخفاء على الخادم بنجاح');
    } catch (err) {
      console.warn('⚠️ خطأ في الاتصال بالخادم، استخدام localStorage:', err);
      localStorage.setItem('dashboard_link_validation_dismissed', JSON.stringify(value));
      setServerDashboardDismissed(value);
    }
  };

  // No global exports; consumers should use useSettings() to access setDashboardDismissedServer

  return (
    <SettingsContext.Provider value={{ 
      fontWeight, 
      setFontWeight,
      sidebarIconSize,
      setSidebarIconSize,
      collapsedIconSize,
      setCollapsedIconSize,
      showDashboardBoxes,
      setShowDashboardBoxes,
      boxesPerRow,
      setBoxesPerRow,
      boxSize,
  setBoxSize,
  linkValidationAlertEnabled,
  setLinkValidationAlertEnabled,
  setDashboardDismissedServer
    }}>
      {children}
    </SettingsContext.Provider>
  );
}

// No content to replace