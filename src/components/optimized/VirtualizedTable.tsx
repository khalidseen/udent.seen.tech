import { memo, useMemo } from "react";
import { useVirtualList } from "@/hooks/useVirtualList";
import { cn } from "@/lib/utils";

interface VirtualizedTableProps<T> {
  data: T[];
  columns: Array<{
    key: string;
    header: string;
    render: (item: T) => React.ReactNode;
    className?: string;
  }>;
  rowHeight?: number;
  containerHeight?: number;
  onRowClick?: (item: T) => void;
  className?: string;
}

function VirtualizedTableInner<T extends { id: string | number }>(
  props: VirtualizedTableProps<T>
) {
  const {
    data,
    columns,
    rowHeight = 60,
    containerHeight = 600,
    onRowClick,
    className,
  } = props;

  const { virtualItems, totalHeight, handleScroll, scrollRef } = useVirtualList(data, {
    itemHeight: rowHeight,
    containerHeight,
    overscan: 5,
  });

  const headerRow = useMemo(
    () => (
      <div
        className="grid gap-4 px-4 py-3 bg-muted/50 font-medium text-sm border-b sticky top-0 z-10"
        style={{
          gridTemplateColumns: `repeat(${columns.length}, minmax(0, 1fr))`,
        }}
      >
        {columns.map((col) => (
          <div key={col.key} className={cn("truncate", col.className)}>
            {col.header}
          </div>
        ))}
      </div>
    ),
    [columns]
  );

  return (
    <div className={cn("border rounded-lg overflow-hidden", className)}>
      {headerRow}
      <div
        ref={scrollRef}
        onScroll={handleScroll}
        className="overflow-auto"
        style={{ height: containerHeight }}
      >
        <div style={{ height: totalHeight, position: "relative" }}>
          {virtualItems.map(({ item, index, offsetY }) => (
            <div
              key={item.id}
              className={cn(
                "grid gap-4 px-4 py-3 border-b hover:bg-muted/50 transition-colors cursor-pointer",
                "absolute left-0 right-0"
              )}
              style={{
                top: offsetY,
                height: rowHeight,
                gridTemplateColumns: `repeat(${columns.length}, minmax(0, 1fr))`,
              }}
              onClick={() => onRowClick?.(item)}
            >
              {columns.map((col) => (
                <div key={col.key} className={cn("truncate flex items-center", col.className)}>
                  {col.render(item)}
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export const VirtualizedTable = memo(VirtualizedTableInner) as typeof VirtualizedTableInner;
