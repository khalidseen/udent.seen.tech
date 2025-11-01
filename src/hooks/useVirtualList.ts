import { useState, useCallback, useMemo, useEffect, useRef } from "react";

interface UseVirtualListOptions {
  itemHeight: number;
  containerHeight: number;
  overscan?: number;
}

export function useVirtualList<T>(
  items: T[],
  { itemHeight, containerHeight, overscan = 3 }: UseVirtualListOptions
) {
  const [scrollTop, setScrollTop] = useState(0);
  const scrollRef = useRef<HTMLDivElement>(null);

  const { virtualItems, totalHeight, offsetY } = useMemo(() => {
    const itemCount = items.length;
    const totalHeight = itemCount * itemHeight;

    const startIndex = Math.max(0, Math.floor(scrollTop / itemHeight) - overscan);
    const endIndex = Math.min(
      itemCount - 1,
      Math.ceil((scrollTop + containerHeight) / itemHeight) + overscan
    );

    const virtualItems = items.slice(startIndex, endIndex + 1).map((item, index) => ({
      item,
      index: startIndex + index,
      offsetY: (startIndex + index) * itemHeight,
    }));

    return {
      virtualItems,
      totalHeight,
      offsetY: startIndex * itemHeight,
    };
  }, [items, scrollTop, itemHeight, containerHeight, overscan]);

  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    const target = e.currentTarget;
    setScrollTop(target.scrollTop);
  }, []);

  useEffect(() => {
    // Reset scroll when items change significantly
    if (scrollRef.current && items.length === 0) {
      scrollRef.current.scrollTop = 0;
      setScrollTop(0);
    }
  }, [items.length]);

  return {
    virtualItems,
    totalHeight,
    offsetY,
    handleScroll,
    scrollRef,
  };
}
