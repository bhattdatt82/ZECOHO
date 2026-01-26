import { useEffect, useCallback } from "react";

export function useAutoRefresh(refetchFn: () => void, intervalMs: number = 15000) {
  const stableRefetch = useCallback(refetchFn, [refetchFn]);

  useEffect(() => {
    const interval = setInterval(stableRefetch, intervalMs);
    return () => clearInterval(interval);
  }, [stableRefetch, intervalMs]);
}
