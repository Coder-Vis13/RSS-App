import { useEffect } from "react";

export function useCategorizationPolling(
  fetchData: (showLoading?: boolean) => Promise<any>,
  enabled: boolean,
) {
  useEffect(() => {
    if (!enabled) return;

    let attempts = 0;

    const interval = setInterval(async () => {
      attempts++;

      const data = await fetchData(false);

      if (!data?.some((item: any) => !item.is_categorized)) {
        clearInterval(interval);
      }

      if (attempts >= 30) {
        clearInterval(interval);
      }
    }, 2000);

    return () => clearInterval(interval);
  }, [fetchData, enabled]);
}
