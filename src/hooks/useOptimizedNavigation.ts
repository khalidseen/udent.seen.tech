import { useNavigate } from "react-router-dom";
import { useCallback } from "react";
import { toast } from "sonner";

// Hook محسن للتنقل بدلاً من window.location
export function useOptimizedNavigation() {
  const navigate = useNavigate();

  const navigateTo = useCallback((path: string, replace = false) => {
    try {
      navigate(path, { replace });
    } catch (error) {
      console.error('Navigation error:', error);
      toast.error('خطأ في التنقل');
    }
  }, [navigate]);

  const navigateWithReload = useCallback((path: string) => {
    // Use navigate instead of window.location.href
    navigateTo(path);
    // Force refresh data without page reload
    window.dispatchEvent(new Event('data-refresh'));
  }, [navigateTo]);

  const refreshCurrentPage = useCallback(() => {
    // Instead of window.location.reload(), refresh data
    window.dispatchEvent(new Event('data-refresh'));
    toast.success('تم تحديث البيانات');
  }, []);

  const openInNewTab = useCallback((url: string) => {
    window.open(url, '_blank', 'noopener,noreferrer');
  }, []);

  return {
    navigateTo,
    navigateWithReload,
    refreshCurrentPage,
    openInNewTab
  };
}