import { useQuery, UseQueryOptions } from '@tanstack/react-query';
import { useCallback, useMemo } from 'react';

interface OptimizedQueryOptions<T> {
  queryKey: string[];
  queryFn: () => Promise<T>;
  optimistic?: boolean;
  priority?: 'high' | 'normal' | 'low';
  enabled?: boolean;
  staleTime?: number;
  gcTime?: number;
  refetchOnWindowFocus?: boolean;
}

export function useOptimizedQuery<T>({
  queryKey,
  queryFn,
  optimistic = false,
  priority = 'normal',
  enabled = true,
  staleTime,
  gcTime,
  refetchOnWindowFocus,
  ...options
}: OptimizedQueryOptions<T>) {
  // Memoize query function to prevent unnecessary re-renders
  const memoizedQueryFn = useCallback(queryFn, []);

  // Optimize query options based on priority
  const optimizedOptions = useMemo(() => {
    const baseOptions: UseQueryOptions<T, Error, T, string[]> = {
      queryKey,
      queryFn: memoizedQueryFn,
      enabled,
      staleTime: staleTime ?? (priority === 'high' ? 1000 * 60 * 1 : // 1 minute for high priority
                 priority === 'normal' ? 1000 * 60 * 3 : // 3 minutes for normal
                 1000 * 60 * 10), // 10 minutes for low priority
      gcTime: gcTime ?? 1000 * 60 * 15, // 15 minutes cache time
      retry: priority === 'high' ? 3 : 2,
      retryDelay: (attemptIndex: number) => Math.min(1000 * 2 ** attemptIndex, 30000),
      refetchOnWindowFocus: refetchOnWindowFocus ?? (priority === 'high'),
    };

    if (optimistic && !staleTime) {
      baseOptions.staleTime = 0; // Always consider optimistic data fresh
    }

    return baseOptions;
  }, [queryKey, memoizedQueryFn, enabled, priority, optimistic, staleTime, gcTime, refetchOnWindowFocus]);

  return useQuery(optimizedOptions);
}

// Hook for batch queries to reduce network requests
export function useBatchQuery<T>(
  queries: Array<{
    queryKey: string[];
    queryFn: () => Promise<T>;
    enabled?: boolean;
  }>
) {
  const enabledQueries = queries.filter(q => q.enabled !== false);
  
  return enabledQueries.map(({ queryKey, queryFn, enabled }) =>
    useOptimizedQuery({
      queryKey,
      queryFn,
      priority: 'normal',
      enabled
    })
  );
}