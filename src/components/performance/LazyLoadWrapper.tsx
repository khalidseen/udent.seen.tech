import React, { Suspense, ReactNode } from 'react';
import { Skeleton } from '@/components/ui/skeleton';

interface LazyLoadWrapperProps {
  children: ReactNode;
  fallback?: ReactNode;
  minHeight?: string | number;
}

/**
 * Wrapper component for lazy loaded components with proper fallback
 */
export function LazyLoadWrapper({ 
  children, 
  fallback,
  minHeight = '200px' 
}: LazyLoadWrapperProps) {
  const defaultFallback = (
    <div 
      style={{ minHeight }} 
      className="w-full flex flex-col gap-4 p-6"
    >
      <Skeleton className="h-8 w-3/4" />
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-2/3" />
    </div>
  );

  return (
    <Suspense fallback={fallback || defaultFallback}>
      {children}
    </Suspense>
  );
}

/**
 * Specialized wrapper for page-level lazy loading
 */
export function LazyPageWrapper({ children }: { children: ReactNode }) {
  return (
    <LazyLoadWrapper minHeight="calc(100vh - 200px)">
      {children}
    </LazyLoadWrapper>
  );
}

/**
 * Specialized wrapper for component-level lazy loading
 */
export function LazyComponentWrapper({ children }: { children: ReactNode }) {
  return (
    <LazyLoadWrapper minHeight="100px">
      {children}
    </LazyLoadWrapper>
  );
}
