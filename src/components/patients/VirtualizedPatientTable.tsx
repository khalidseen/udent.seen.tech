import { memo, useRef, useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Eye, FileText, Calendar, Trash2 } from 'lucide-react';

interface Patient {
  id: string;
  full_name: string;
  phone: string;
  email: string;
  patient_status: string;
  financial_status: 'paid' | 'pending' | 'overdue' | 'partial';
  created_at: string;
}

interface VirtualizedPatientTableProps {
  patients: Patient[];
  onViewPatient: (id: string) => void;
  onViewRecords: (id: string) => void;
  onViewAppointments: (id: string) => void;
  onDeletePatient: (id: string) => void;
}

const ROW_HEIGHT = 80;
const BUFFER_SIZE = 5;

// Memoized Row Component
const PatientRow = memo(({ 
  patient,
  onViewPatient,
  onViewRecords,
  onViewAppointments,
  onDeletePatient,
}: { 
  patient: Patient;
  onViewPatient: (id: string) => void;
  onViewRecords: (id: string) => void;
  onViewAppointments: (id: string) => void;
  onDeletePatient: (id: string) => void;
}) => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'inactive': return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200';
      case 'completed': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      default: return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
    }
  };

  const getFinancialColor = (status: string) => {
    switch (status) {
      case 'paid': return 'bg-green-100 text-green-800';
      case 'overdue': return 'bg-red-100 text-red-800';
      case 'partial': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="flex items-center gap-4 px-4 py-4 border-b hover:bg-accent/50 transition-colors">
      <div className="flex-1 min-w-0">
        <p className="font-medium truncate">{patient.full_name}</p>
        <p className="text-sm text-muted-foreground truncate">{patient.phone}</p>
      </div>
      
      <div className="hidden md:block flex-1 min-w-0">
        <p className="text-sm truncate">{patient.email || '-'}</p>
      </div>

      <div className="flex items-center gap-2">
        <Badge variant="outline" className={getStatusColor(patient.patient_status)}>
          {patient.patient_status}
        </Badge>
        <Badge variant="outline" className={getFinancialColor(patient.financial_status)}>
          {patient.financial_status}
        </Badge>
      </div>

      <div className="flex items-center gap-1">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onViewPatient(patient.id)}
        >
          <Eye className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onViewRecords(patient.id)}
        >
          <FileText className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onViewAppointments(patient.id)}
        >
          <Calendar className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onDeletePatient(patient.id)}
        >
          <Trash2 className="h-4 w-4 text-destructive" />
        </Button>
      </div>
    </div>
  );
});

PatientRow.displayName = 'PatientRow';

// Optimized Virtualized Table with Scroll-based Rendering
export const VirtualizedPatientTable = memo<VirtualizedPatientTableProps>(({
  patients,
  onViewPatient,
  onViewRecords,
  onViewAppointments,
  onDeletePatient,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [visibleRange, setVisibleRange] = useState({ start: 0, end: 20 });

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleScroll = () => {
      const scrollTop = container.scrollTop;
      const start = Math.max(0, Math.floor(scrollTop / ROW_HEIGHT) - BUFFER_SIZE);
      const end = Math.min(
        patients.length,
        Math.ceil((scrollTop + container.clientHeight) / ROW_HEIGHT) + BUFFER_SIZE
      );

      setVisibleRange({ start, end });
    };

    container.addEventListener('scroll', handleScroll);
    handleScroll(); // Initial calculation

    return () => container.removeEventListener('scroll', handleScroll);
  }, [patients.length]);

  if (patients.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-muted-foreground">
        لا توجد بيانات للعرض
      </div>
    );
  }

  const visiblePatients = patients.slice(visibleRange.start, visibleRange.end);
  const offsetY = visibleRange.start * ROW_HEIGHT;
  const totalHeight = patients.length * ROW_HEIGHT;

  return (
    <div className="border rounded-lg">
      {/* Header */}
      <div className="flex items-center gap-4 px-4 py-3 bg-muted/50 border-b font-medium sticky top-0 z-10">
        <div className="flex-1">المريض</div>
        <div className="hidden md:block flex-1">البريد الإلكتروني</div>
        <div className="w-48">الحالة</div>
        <div className="w-40">الإجراءات</div>
      </div>

      {/* Virtualized Rows Container */}
      <div 
        ref={containerRef}
        className="overflow-y-auto"
        style={{ height: '600px' }}
      >
        <div style={{ height: `${totalHeight}px`, position: 'relative' }}>
          <div style={{ transform: `translateY(${offsetY}px)` }}>
            {visiblePatients.map((patient) => (
              <PatientRow
                key={patient.id}
                patient={patient}
                onViewPatient={onViewPatient}
                onViewRecords={onViewRecords}
                onViewAppointments={onViewAppointments}
                onDeletePatient={onDeletePatient}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
});

VirtualizedPatientTable.displayName = 'VirtualizedPatientTable';
