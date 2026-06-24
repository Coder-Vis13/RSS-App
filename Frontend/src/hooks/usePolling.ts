import { useEffect } from "react";

export function usePolling(
  callback: () => void | Promise<void>,
  enabled: boolean,
  delay = 30000,
  immediate = false,
) {
  useEffect(() => {
    if (!enabled) return;

    if (immediate) {
      callback();
    }

    const interval = setInterval(callback, delay);

    return () => clearInterval(interval);
  }, [callback, enabled, delay, immediate]);
}
