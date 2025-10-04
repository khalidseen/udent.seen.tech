import { useCallback, useRef, useLayoutEffect } from 'react';

/**
 * Hook لإنشاء callback مستقر يمنع إعادة الرندر غير الضرورية
 * Similar to useCallback but with a stable reference
 */
export function useStableCallback<T extends (...args: any[]) => any>(
  callback: T
): T {
  const callbackRef = useRef(callback);

  useLayoutEffect(() => {
    callbackRef.current = callback;
  });

  return useCallback(((...args) => callbackRef.current(...args)) as T, []);
}
