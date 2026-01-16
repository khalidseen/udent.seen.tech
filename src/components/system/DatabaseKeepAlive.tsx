import { useEffect, useCallback } from 'react';

const KEEP_ALIVE_KEY = 'db_last_keep_alive';
const KEEP_ALIVE_INTERVAL_MS = 24 * 60 * 60 * 1000; // 24 hours

export const DatabaseKeepAlive = () => {
  const sendKeepAlive = useCallback(async () => {
    try {
      const response = await fetch(
        'https://lxusbjpvcyjcfrnyselc.supabase.co/functions/v1/keep-alive',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        console.log('✅ Database keep-alive successful:', data.timestamp);
        localStorage.setItem(KEEP_ALIVE_KEY, Date.now().toString());
        return true;
      } else {
        console.warn('⚠️ Keep-alive response not ok:', response.status);
        return false;
      }
    } catch (error) {
      console.error('❌ Keep-alive error:', error);
      return false;
    }
  }, []);

  const checkAndSendKeepAlive = useCallback(async () => {
    const lastPing = localStorage.getItem(KEEP_ALIVE_KEY);
    const now = Date.now();

    if (!lastPing) {
      // First time - send ping
      console.log('🔄 First keep-alive ping...');
      await sendKeepAlive();
      return;
    }

    const lastPingTime = parseInt(lastPing, 10);
    const timeSinceLastPing = now - lastPingTime;

    if (timeSinceLastPing >= KEEP_ALIVE_INTERVAL_MS) {
      console.log('🔄 Sending daily keep-alive ping...');
      await sendKeepAlive();
    } else {
      const hoursRemaining = Math.round(
        (KEEP_ALIVE_INTERVAL_MS - timeSinceLastPing) / (60 * 60 * 1000)
      );
      console.log(`✅ Database keep-alive active. Next ping in ~${hoursRemaining} hours`);
    }
  }, [sendKeepAlive]);

  useEffect(() => {
    // Check on mount with a small delay to not block initial render
    const timeoutId = setTimeout(() => {
      checkAndSendKeepAlive();
    }, 3000);

    return () => clearTimeout(timeoutId);
  }, [checkAndSendKeepAlive]);

  // This component doesn't render anything
  return null;
};
