import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useCallback, useMemo } from "react";
import { cacheHelpers } from "@/lib/optimized-queries";

// Hook محسن للاستعلامات مع التخزين المؤقت
export function useOptimizedQuery<T>(
  queryKey: string[],
  queryFn: () => Promise<T>,
  options: {
    staleTime?: number;
    cacheTime?: number;
    enabled?: boolean;
    localCacheMinutes?: number;
  } = {}
) {
  const queryClient = useQueryClient();
  
  const {
    staleTime = 5 * 60 * 1000, // 5 دقائق
    cacheTime = 10 * 60 * 1000, // 10 دقائق
    enabled = true,
    localCacheMinutes = 2 // 2 دقيقة للتخزين المحلي
  } = options;

  const cacheKey = cacheHelpers.createCacheKey(queryKey.join(':'));

  const optimizedQueryFn = useCallback(async (): Promise<T> => {
    // تحقق من التخزين المؤقت المحلي أولاً
    const cachedData = cacheHelpers.getCache(cacheKey);
    if (cachedData) {
      return cachedData;
    }

    // إجراء الاستعلام
    const data = await queryFn();
    
    // تخزين النتيجة محلياً
    cacheHelpers.setCache(cacheKey, data, localCacheMinutes);
    
    return data;
  }, [queryFn, cacheKey, localCacheMinutes]);

  const query = useQuery({
    queryKey,
    queryFn: optimizedQueryFn,
    staleTime,
    gcTime: cacheTime,
    enabled,
    refetchOnWindowFocus: false,
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000)
  });

  const invalidate = useCallback(() => {
    queryClient.invalidateQueries({ queryKey });
    cacheHelpers.clearCache(cacheKey);
  }, [queryClient, queryKey, cacheKey]);

  const prefetch = useCallback(() => {
    queryClient.prefetchQuery({
      queryKey,
      queryFn: optimizedQueryFn,
      staleTime
    });
  }, [queryClient, queryKey, optimizedQueryFn, staleTime]);

  return {
    ...query,
    invalidate,
    prefetch
  };
}