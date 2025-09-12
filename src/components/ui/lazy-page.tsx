import React, { Suspense } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

interface LazyPageProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  className?: string;
}

const DefaultPageSkeleton = () => (
  <div className="p-6 space-y-6 animate-pulse">
    {/* Header */}
    <div className="flex items-center justify-between">
      <div className="space-y-2">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-4 w-32" />
      </div>
      <div className="flex gap-2">
        <Skeleton className="h-10 w-24" />
        <Skeleton className="h-10 w-24" />
      </div>
    </div>

    {/* Main content */}
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {Array.from({ length: 8 }).map((_, i) => (
        <div key={i} className="border rounded-lg p-4 space-y-3">
          <div className="flex items-center justify-between">
            <Skeleton className="h-5 w-32" />
            <div className="flex gap-1">
              <Skeleton className="h-7 w-7" />
              <Skeleton className="h-7 w-7" />
            </div>
          </div>
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-8 w-full" />
        </div>
      ))}
    </div>
  </div>
);

export function LazyPage({ children, fallback, className }: LazyPageProps) {
  return (
    <div className={cn("min-h-screen", className)}>
      <Suspense fallback={fallback || <DefaultPageSkeleton />}>
        {children}
      </Suspense>
    </div>
  );
}

// Higher-order component for lazy loading pages
export function withLazyLoading<P extends object>(
  Component: React.ComponentType<P>,
  customFallback?: React.ReactNode
) {
  return function LazyLoadedComponent(props: P) {
    return (
      <LazyPage fallback={customFallback}>
        <Component {...props} />
      </LazyPage>
    );
  };
}