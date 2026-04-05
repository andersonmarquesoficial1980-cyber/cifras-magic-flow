import { useEffect, useRef, useCallback } from 'react';

export function useWakeLock(enabled: boolean) {
  const wakeLockRef = useRef<WakeLockSentinel | null>(null);

  const request = useCallback(async () => {
    if (!('wakeLock' in navigator)) return;
    try {
      wakeLockRef.current = await navigator.wakeLock.request('screen');
    } catch (e) {
      console.warn('Wake Lock failed:', e);
    }
  }, []);

  const release = useCallback(async () => {
    if (wakeLockRef.current) {
      await wakeLockRef.current.release();
      wakeLockRef.current = null;
    }
  }, []);

  useEffect(() => {
    if (enabled) {
      request();
      const onVisibility = () => {
        if (document.visibilityState === 'visible' && enabled) request();
      };
      document.addEventListener('visibilitychange', onVisibility);
      return () => {
        release();
        document.removeEventListener('visibilitychange', onVisibility);
      };
    } else {
      release();
    }
  }, [enabled, request, release]);
}
