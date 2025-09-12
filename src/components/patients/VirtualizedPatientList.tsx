import React, { memo, useState, useMemo, useCallback, Suspense } from 'react';
import { useVirtualScrolling } from '@/lib/performance-optimizations';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { ChevronLeft, ChevronRight, BarChart3 } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Patient } from '@/hooks/usePatients';

// Lazy load the optimized card
const OptimizedPatientCard = React.lazy(() => import('./OptimizedPatientCard'));

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  itemsPerPage: number;
  totalItems: number;
}

const Pagination = memo(({ 
  currentPage, 
  totalPages, 
  onPageChange, 
  itemsPerPage, 
  totalItems 
}: PaginationProps) => {
  const { t } = useLanguage();
  
  const pages = useMemo(() => {
    const delta = 2;
    const range = [];
    const rangeWithDots = [];

    for (let i = Math.max(2, currentPage - delta); 
         i <= Math.min(totalPages - 1, currentPage + delta); 
         i++) {
      range.push(i);
    }

    if (currentPage - delta > 2) {
      rangeWithDots.push(1, '...');
    } else {
      rangeWithDots.push(1);
    }

    rangeWithDots.push(...range);

    if (currentPage + delta < totalPages - 1) {
      rangeWithDots.push('...', totalPages);
    } else if (totalPages > 1) {
      rangeWithDots.push(totalPages);
    }

    return rangeWithDots;
  }, [currentPage, totalPages]);

  if (totalPages <= 1) return null;

  return (
    <div className="flex items-center justify-between px-4 py-3 bg-background border-t border-border/40">
      <div className="text-sm text-muted-foreground">
        عرض {((currentPage - 1) * itemsPerPage) + 1} إلى {Math.min(currentPage * itemsPerPage, totalItems)} من {totalItems} مريض
      </div>
      
      <div className="flex items-center gap-1">
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className="h-8 w-8 p-0"
        >
          <ChevronRight className="w-4 h-4" />
        </Button>
        
        {pages.map((page, index) => (
          page === '...' ? (
            <span key={`dots-${index}`} className="px-3 py-1 text-muted-foreground">
              ...
            </span>
          ) : (
            <Button
              key={page}
              variant={currentPage === page ? 'default' : 'outline'}
              size="sm"
              onClick={() => typeof page === 'number' && onPageChange(page)}
              className="h-8 w-8 p-0"
            >
              {page}
            </Button>
          )
        ))}
        
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className="h-8 w-8 p-0"
        >
          <ChevronLeft className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
});

Pagination.displayName = 'Pagination';

interface VirtualizedPatientListProps {
  patients: Patient[];
  onAddTreatment: (patientId: string, patientName: string) => void;
  onEditPatient: (patientId: string) => void;
<<<<<<< HEAD
  onPatientUpdated?: () => void;
=======
>>>>>>> cbd682d36e862741c55b9e7b5d144f8de65c694a
  loading?: boolean;
  viewMode: 'cards' | 'table';
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  itemsPerPage: number;
  totalItems: number;
}

const PatientCardSkeleton = memo(() => (
  <Card className="h-full">
    <CardContent className="p-4 space-y-3">
      <div className="flex items-center justify-between">
        <Skeleton className="h-5 w-32" />
        <div className="flex gap-1">
          <Skeleton className="h-7 w-7 rounded" />
          <Skeleton className="h-7 w-7 rounded" />
          <Skeleton className="h-7 w-7 rounded" />
        </div>
      </div>
      <div className="space-y-2">
        <Skeleton className="h-3 w-20" />
        <Skeleton className="h-4 w-24" />
      </div>
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <Skeleton className="h-3 w-16" />
          <Skeleton className="h-5 w-12" />
        </div>
        <Skeleton className="h-5 w-16" />
      </div>
      <div className="pt-3 border-t">
        <Skeleton className="h-3 w-20 mb-2" />
        <div className="grid grid-cols-4 gap-1">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-8 w-full" />
          ))}
        </div>
      </div>
      <Skeleton className="h-8 w-full" />
    </CardContent>
  </Card>
));

PatientCardSkeleton.displayName = 'PatientCardSkeleton';

const VirtualizedPatientList = memo(({
  patients,
  onAddTreatment,
  onEditPatient,
<<<<<<< HEAD
  onPatientUpdated,
=======
>>>>>>> cbd682d36e862741c55b9e7b5d144f8de65c694a
  loading = false,
  viewMode,
  currentPage,
  totalPages,
  onPageChange,
  itemsPerPage,
  totalItems
}: VirtualizedPatientListProps) => {
  const { t } = useLanguage();

  // Generate skeleton items for loading state
  const skeletonItems = useMemo(() => 
    Array.from({ length: itemsPerPage }, (_, i) => ({ id: `skeleton-${i}` })), 
    [itemsPerPage]
  );

  const handleAddTreatment = useCallback((patientId: string, patientName: string) => {
    onAddTreatment(patientId, patientName);
  }, [onAddTreatment]);

  const handleEditPatient = useCallback((patientId: string) => {
    onEditPatient(patientId);
  }, [onEditPatient]);

  if (loading) {
    return (
      <>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {skeletonItems.map((item) => (
            <PatientCardSkeleton key={item.id} />
          ))}
        </div>
        <Pagination
          currentPage={1}
          totalPages={1}
          onPageChange={() => {}}
          itemsPerPage={itemsPerPage}
          totalItems={0}
        />
      </>
    );
  }

  if (patients.length === 0) {
    return (
      <Card>
        <CardContent className="p-8">
          <div className="text-center text-muted-foreground">
            <BarChart3 className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <h3 className="text-lg font-medium mb-2">{t('messages.noResults')}</h3>
            <p>{t('messages.noPatients')}</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 min-h-0">
        {patients.map(patient => (
          <Suspense key={patient.id} fallback={<PatientCardSkeleton />}>
            <OptimizedPatientCard
              patient={patient}
              onAddTreatment={handleAddTreatment}
              onEditPatient={handleEditPatient}
<<<<<<< HEAD
              onPatientUpdated={onPatientUpdated}
=======
>>>>>>> cbd682d36e862741c55b9e7b5d144f8de65c694a
            />
          </Suspense>
        ))}
      </div>
      
      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={onPageChange}
        itemsPerPage={itemsPerPage}
        totalItems={totalItems}
      />
    </>
  );
});

VirtualizedPatientList.displayName = 'VirtualizedPatientList';

export default VirtualizedPatientList;