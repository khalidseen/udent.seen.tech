import { useCallback, useRef, useState } from "react";

interface UseInfiniteScrollOptions {
  threshold?: number;
  rootMargin?: string;
}

export function useInfiniteScroll(
  onLoadMore: () => void | Promise<void>,
  options: UseInfiniteScrollOptions = {}
) {
  const { threshold = 0.5, rootMargin = "100px" } = options;
  const [isLoading, setIsLoading] = useState(false);
  const observerRef = useRef<IntersectionObserver | null>(null);

  const lastElementRef = useCallback(
    (node: HTMLElement | null) => {
      if (isLoading) return;
      if (observerRef.current) observerRef.current.disconnect();

      observerRef.current = new IntersectionObserver(
        async (entries) => {
          if (entries[0].isIntersecting) {
            setIsLoading(true);
            await onLoadMore();
            setIsLoading(false);
          }
        },
        { threshold, rootMargin }
      );

      if (node) observerRef.current.observe(node);
    },
    [isLoading, onLoadMore, threshold, rootMargin]
  );

  return { lastElementRef, isLoading };
}
