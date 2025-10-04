import { useMemo, useState, useCallback, useEffect } from 'react';

interface VirtualizedListOptions<T> {
  items: T[];
  itemHeight: number;
  containerHeight: number;
  overscan?: number;
  searchQuery?: string;
  searchFields?: (keyof T)[];
}

export function useVirtualizedList<T>({
  items,
  itemHeight,
  containerHeight,
  overscan = 5,
  searchQuery = '',
  searchFields = []
}: VirtualizedListOptions<T>) {
  const [scrollTop, setScrollTop] = useState(0);

  // Filter items based on search query
  const filteredItems = useMemo(() => {
    if (!searchQuery || searchFields.length === 0) return items;
    
    const query = searchQuery.toLowerCase();
    return items.filter(item =>
      searchFields.some(field => {
        const value = item[field];
        return String(value).toLowerCase().includes(query);
      })
    );
  }, [items, searchQuery, searchFields]);

  // Calculate visible range
  const visibleRange = useMemo(() => {
    const start = Math.max(0, Math.floor(scrollTop / itemHeight) - overscan);
    const visibleCount = Math.ceil(containerHeight / itemHeight);
    const end = Math.min(filteredItems.length, start + visibleCount + overscan * 2);
    
    return { start, end };
  }, [scrollTop, itemHeight, containerHeight, overscan, filteredItems.length]);

  // Get visible items
  const visibleItems = useMemo(() => {
    return filteredItems.slice(visibleRange.start, visibleRange.end).map((item, index) => ({
      item,
      index: visibleRange.start + index,
      style: {
        position: 'absolute' as const,
        top: (visibleRange.start + index) * itemHeight,
        height: itemHeight,
        width: '100%'
      }
    }));
  }, [filteredItems, visibleRange, itemHeight]);

  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    setScrollTop(e.currentTarget.scrollTop);
  }, []);

  const scrollToIndex = useCallback((index: number) => {
    const element = document.querySelector('[data-virtualized-container]') as HTMLElement;
    if (element) {
      element.scrollTop = index * itemHeight;
    }
  }, [itemHeight]);

  const totalHeight = filteredItems.length * itemHeight;

  return {
    visibleItems,
    totalHeight,
    handleScroll,
    scrollToIndex,
    filteredItemsCount: filteredItems.length,
    totalItemsCount: items.length
  };
}