import { memo } from "react";
import { Skeleton } from "@/components/ui/skeleton";

interface OptimizedPageLoaderProps {
  type?: "dashboard" | "list" | "form" | "default";
}

const DashboardSkeleton = memo(() => (
  <div className="p-6 space-y-6 animate-in fade-in duration-300">
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {[...Array(4)].map((_, i) => (
        <div key={i} className="space-y-3">
          <Skeleton className="h-24 w-full" />
        </div>
      ))}
    </div>
    <div className="grid gap-4 md:grid-cols-2">
      <Skeleton className="h-80 w-full" />
      <Skeleton className="h-80 w-full" />
    </div>
  </div>
));
DashboardSkeleton.displayName = "DashboardSkeleton";

const ListSkeleton = memo(() => (
  <div className="p-6 space-y-4 animate-in fade-in duration-300">
    <div className="flex justify-between items-center">
      <Skeleton className="h-10 w-64" />
      <Skeleton className="h-10 w-32" />
    </div>
    <div className="space-y-3">
      {[...Array(8)].map((_, i) => (
        <Skeleton key={i} className="h-16 w-full" />
      ))}
    </div>
  </div>
));
ListSkeleton.displayName = "ListSkeleton";

const FormSkeleton = memo(() => (
  <div className="p-6 space-y-6 max-w-2xl mx-auto animate-in fade-in duration-300">
    <Skeleton className="h-8 w-48" />
    <div className="space-y-4">
      {[...Array(6)].map((_, i) => (
        <div key={i} className="space-y-2">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-10 w-full" />
        </div>
      ))}
    </div>
    <div className="flex gap-4">
      <Skeleton className="h-10 w-32" />
      <Skeleton className="h-10 w-32" />
    </div>
  </div>
));
FormSkeleton.displayName = "FormSkeleton";

const DefaultSkeleton = memo(() => (
  <div className="flex items-center justify-center min-h-[400px] animate-in fade-in duration-300">
    <div className="space-y-4 text-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto" />
      <Skeleton className="h-4 w-32 mx-auto" />
    </div>
  </div>
));
DefaultSkeleton.displayName = "DefaultSkeleton";

export const OptimizedPageLoader = memo<OptimizedPageLoaderProps>(({ type = "default" }) => {
  switch (type) {
    case "dashboard":
      return <DashboardSkeleton />;
    case "list":
      return <ListSkeleton />;
    case "form":
      return <FormSkeleton />;
    default:
      return <DefaultSkeleton />;
  }
});

OptimizedPageLoader.displayName = "OptimizedPageLoader";
