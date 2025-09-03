import React, { Suspense } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { withErrorBoundary } from "@/components/ui/error-boundary";

// Lazy load PatientList for better code splitting
const PatientList = React.lazy(() => import("@/components/patients/PatientList"));

const PatientsLoadingSkeleton = () => (
  <div className="p-4 space-y-4">
    <div className="flex items-center justify-between">
      <Skeleton className="h-8 w-32" />
      <div className="flex gap-2">
        <Skeleton className="h-10 w-24" />
        <Skeleton className="h-10 w-24" />
      </div>
    </div>
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {Array.from({ length: 8 }).map((_, i) => (
        <div key={i} className="border rounded-lg p-4 space-y-3">
          <div className="flex items-center justify-between">
            <Skeleton className="h-5 w-32" />
            <div className="flex gap-1">
              <Skeleton className="h-7 w-7" />
              <Skeleton className="h-7 w-7" />
              <Skeleton className="h-7 w-7" />
            </div>
          </div>
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-5 w-20" />
          <div className="grid grid-cols-4 gap-1 pt-3 border-t">
            {Array.from({ length: 4 }).map((_, j) => (
              <Skeleton key={j} className="h-8 w-full" />
            ))}
          </div>
          <Skeleton className="h-8 w-full" />
        </div>
      ))}
    </div>
  </div>
);

const Patients = () => {
  return (
    <Suspense fallback={<PatientsLoadingSkeleton />}>
      <PatientList />
    </Suspense>
  );
};

export default withErrorBoundary(Patients);