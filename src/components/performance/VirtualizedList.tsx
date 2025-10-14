import React, { useMemo, useCallback, useState, useRef, useEffect } from "react";

interface VirtualizedListProps<T> {
  items: T[];
  itemHeight: number;
  height: number;
  renderItem: (props: {
    item: T;
    index: number;
    style: React.CSSProperties;
  }) => React.ReactNode;
  className?: string;
  onItemClick?: (item: T, index: number) => void;
}

// قائمة افتراضية بسيطة محسنة للأداء
export function VirtualizedList<T>({
  items,
  itemHeight,
  height,
  renderItem,
  className,
  onItemClick
}: VirtualizedListProps<T>) {
  const [scrollTop, setScrollTop] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  const visibleItems = useMemo(() => {
    const containerHeight = height;
    const startIndex = Math.floor(scrollTop / itemHeight);
    const endIndex = Math.min(
      startIndex + Math.ceil(containerHeight / itemHeight) + 1,
      items.length
    );

    return {
      startIndex,
      endIndex,
      items: items.slice(startIndex, endIndex)
    };
  }, [items, scrollTop, itemHeight, height]);

  const rafRef = useRef<number | null>(null);

  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current);
    }
    
    rafRef.current = requestAnimationFrame(() => {
      setScrollTop(e.currentTarget.scrollTop);
      rafRef.current = null;
    });
  }, []);

  useEffect(() => {
    return () => {
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current);
      }
    };
  }, []);

  const totalHeight = items.length * itemHeight;
  const offsetY = visibleItems.startIndex * itemHeight;

  if (items.length === 0) {
    return (
      <div 
        className="flex items-center justify-center text-muted-foreground"
        style={{ height }}
      >
        لا توجد عناصر للعرض
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className={`overflow-auto ${className || ''}`}
      style={{ height }}
      onScroll={handleScroll}
    >
      <div style={{ height: totalHeight, position: 'relative' }}>
        <div style={{ transform: `translateY(${offsetY}px)` }}>
          {visibleItems.items.map((item, index) => {
            const actualIndex = visibleItems.startIndex + index;
            const style: React.CSSProperties = {
              height: itemHeight,
              display: 'flex',
              alignItems: 'center'
            };

            return (
              <div
                key={actualIndex}
                onClick={() => onItemClick?.(item, actualIndex)}
                className={onItemClick ? "cursor-pointer hover:bg-muted/50" : ""}
              >
                {renderItem({ item, index: actualIndex, style })}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// قائمة مرضى افتراضية
interface Patient {
  id: string;
  full_name: string;
  phone?: string;
  patient_status: string;
}

export function VirtualizedPatientList({
  patients,
  onPatientClick,
  height = 400
}: {
  patients: Patient[];
  onPatientClick?: (patient: Patient) => void;
  height?: number;
}) {
  const renderPatientItem = useCallback(
    ({ item, style }: { item: Patient; style: React.CSSProperties }) => (
      <div 
        style={style}
        className="flex items-center justify-between p-4 border-b"
      >
        <div>
          <h4 className="font-medium">{item.full_name}</h4>
          {item.phone && (
            <p className="text-sm text-muted-foreground">{item.phone}</p>
          )}
        </div>
        <span
          className={`px-2 py-1 text-xs rounded-full ${
            item.patient_status === 'active' 
              ? 'bg-green-100 text-green-800' 
              : 'bg-gray-100 text-gray-800'
          }`}
        >
          {item.patient_status}
        </span>
      </div>
    ),
    []
  );

  return (
    <VirtualizedList
      items={patients}
      itemHeight={80}
      height={height}
      renderItem={renderPatientItem}
      onItemClick={onPatientClick}
      className="border rounded-lg"
    />
  );
}