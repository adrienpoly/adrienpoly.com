import { useEffect } from "react";

/** Keeps the screen on while `active` is true, where the browser supports it. */
export function useWakeLock(active: boolean) {
  useEffect(() => {
    if (!active || !("wakeLock" in navigator)) return;

    let sentinel: WakeLockSentinel | null = null;
    let cancelled = false;

    async function acquire() {
      try {
        const lock = await navigator.wakeLock.request("screen");
        if (cancelled) void lock.release();
        else sentinel = lock;
      } catch {
        // Refused (Low Power Mode, for example): the screen follows the system setting.
      }
    }

    // The browser releases the lock when the app is hidden, so take it again on return.
    function onVisibilityChange() {
      if (document.visibilityState === "visible") void acquire();
    }

    void acquire();
    document.addEventListener("visibilitychange", onVisibilityChange);

    return () => {
      cancelled = true;
      document.removeEventListener("visibilitychange", onVisibilityChange);
      void sentinel?.release();
    };
  }, [active]);
}
