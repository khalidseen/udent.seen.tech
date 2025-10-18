/**
 * Lazy Chart Wrapper
 * Loads chart libraries only when needed to reduce initial bundle size
 */

import { Suspense, lazy } from 'react';

const ChartComponent = lazy(() => 
  import('./ChartRenderer').catch(() => ({
    default: () => <div>Error loading chart</div>
  }))
);

interface LazyChartProps {
  type: 'line' | 'bar' | 'pie' | 'area';
  data: any;
  config?: any;
}

export const LazyChart = (props: LazyChartProps) => {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center h-64">
        <div className="animate-pulse text-muted-foreground">Loading chart...</div>
      </div>
    }>
      <ChartComponent {...props} />
    </Suspense>
  );
};
