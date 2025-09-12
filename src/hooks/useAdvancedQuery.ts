import { useQuery, useQueryClient, QueryKey } from "@tanstack/react-query";
import { useCallback, useMemo, useEffect } from "react";
import { toast } from "sonner";

interface AdvancedQueryOptions<T> {
  queryKey: QueryKey;
  queryFn: () => Promise<T>;
  staleTime?: number;
  gcTime?: number;
  enabled?: boolean;
  retry?: number;
  refetchOnWindowFocus?: boolean;
  refetchOnReconnect?: boolean;
  refetchInterval?: number;
  select?: (data: T) => any;
  onSuccess?: (data: T) => void;
  onError?: (error: Error) => void;
  localCache?: boolean;
  prefetch?: boolean;
}

export function useAdvancedQuery<T>(options: AdvancedQueryOptions<T>) {
  const queryClient = useQueryClient();
  
  const {
    queryKey,
    queryFn,
    staleTime = 5 * 60 * 1000, // 5 minutes
    gcTime = 10 * 60 * 1000, // 10 minutes  
    enabled = true,
    retry = 3,
    refetchOnWindowFocus = false,
    refetchOnReconnect = true,
    refetchInterval,
    select,
    onSuccess,
    onError,
    localCache = true,
    prefetch = false
  } = options;

  // Enhanced query function with local caching
  const enhancedQueryFn = useCallback(async (): Promise<T> => {
    const cacheKey = Array.isArray(queryKey) ? queryKey.join('-') : String(queryKey);
    
    // Check local cache first if enabled
    if (localCache) {
      const cached = localStorage.getItem(`cache_${cacheKey}`);
      if (cached) {
        try {
          const parsedCache = JSON.parse(cached);
          if (Date.now() - parsedCache.timestamp < staleTime) {
            return parsedCache.data;
          }
        } catch (e) {
          localStorage.removeItem(`cache_${cacheKey}`);
        }
      }
    }

    const data = await queryFn();
    
    // Store in local cache
    if (localCache) {
      localStorage.setItem(`cache_${cacheKey}`, JSON.stringify({
        data,
        timestamp: Date.now()
      }));
    }
    
    return data;
  }, [queryFn, queryKey, staleTime, localCache]);

  const query = useQuery({
    queryKey,
    queryFn: enhancedQueryFn,
    staleTime,
    gcTime,
    enabled,
    retry,
    refetchOnWindowFocus,
    refetchOnReconnect,
    refetchInterval,
    select
  });

  // Handle success/error callbacks
  useEffect(() => {
    if (query.isSuccess && query.data && onSuccess) {
      onSuccess(query.data);
    }
  }, [query.isSuccess, query.data, onSuccess]);

  useEffect(() => {
    if (query.isError && query.error && onError) {
      onError(query.error as Error);
    }
  }, [query.isError, query.error, onError]);

  // Prefetch if enabled
  useEffect(() => {
    if (prefetch && enabled) {
      queryClient.prefetchQuery({
        queryKey,
        queryFn: enhancedQueryFn,
        staleTime
      });
    }
  }, [prefetch, enabled, queryClient, queryKey, enhancedQueryFn, staleTime]);

  // Listen for data refresh events
  useEffect(() => {
    const handleDataRefresh = () => {
      query.refetch();
    };

    window.addEventListener('data-refresh', handleDataRefresh);
    return () => window.removeEventListener('data-refresh', handleDataRefresh);
  }, [query]);

  const invalidate = useCallback(() => {
    queryClient.invalidateQueries({ queryKey });
    const cacheKey = Array.isArray(queryKey) ? queryKey.join('-') : String(queryKey);
    localStorage.removeItem(`cache_${cacheKey}`);
  }, [queryClient, queryKey]);

  const refetch = useCallback(() => {
    return query.refetch();
  }, [query]);

  const prefetchNext = useCallback((nextQueryKey: QueryKey, nextQueryFn: () => Promise<any>) => {
    queryClient.prefetchQuery({
      queryKey: nextQueryKey,
      queryFn: nextQueryFn,
      staleTime
    });
  }, [queryClient, staleTime]);

  return {
    ...query,
    invalidate,
    refetch,
    prefetchNext
  };
}