import { useEffect, useRef } from 'react';
import { supabase } from './supabase';

export function useIdleLogout(timeoutMs: number = 10 * 60 * 1000) {
  const timer = useRef<number | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function logoutNow() {
      if (cancelled) return;
      await supabase.auth.signOut();
      window.location.replace('/auth/login?reason=idle');
    }

    function reset() {
      if (timer.current) window.clearTimeout(timer.current);
      timer.current = window.setTimeout(logoutNow, timeoutMs);
    }

    const events: (keyof WindowEventMap)[] = [
      'mousemove',
      'mousedown',
      'keydown',
      'touchstart',
      'scroll',
    ];
    events.forEach((e) => window.addEventListener(e, reset, { passive: true }));

    const onVisibility = () => {
      if (document.visibilityState === 'visible') reset();
    };
    document.addEventListener('visibilitychange', onVisibility);

    reset();

    return () => {
      cancelled = true;
      if (timer.current) window.clearTimeout(timer.current);
      events.forEach((e) => window.removeEventListener(e, reset));
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, [timeoutMs]);
}
