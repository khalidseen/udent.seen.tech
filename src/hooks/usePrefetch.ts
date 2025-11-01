import { useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";

export function usePrefetch() {
  const queryClient = useQueryClient();

  const prefetch = useCallback(
    async (queryKey: string[], queryFn: () => Promise<any>) => {
      await queryClient.prefetchQuery({
        queryKey,
        queryFn,
        staleTime: 5 * 60 * 1000, // 5 minutes
      });
    },
    [queryClient]
  );

  const ensureQueryData = useCallback(
    async (queryKey: string[], queryFn: () => Promise<any>) => {
      return queryClient.ensureQueryData({
        queryKey,
        queryFn,
        staleTime: 5 * 60 * 1000,
      });
    },
    [queryClient]
  );

  return { prefetch, ensureQueryData };
}
