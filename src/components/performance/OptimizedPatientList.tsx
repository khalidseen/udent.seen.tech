import React, { memo, useMemo, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Eye, Plus, Edit, User, Calendar } from "lucide-react";
import { VirtualizedList } from "./VirtualizedList";
import { cn } from "@/lib/utils";

interface Patient {
  id: string;
  full_name: string;
  phone?: string;
  email?: string;
  patient_status: string;
  date_of_birth?: string;
  gender?: string;
  national_id?: string;
  created_at: string;
}

interface PatientCardProps {
  patient: Patient;
  onPatientClick?: (patientId: string) => void;
  onAddTreatment?: (patientId: string, patientName: string) => void;
  onEditPatient?: (patientId: string) => void;
}

interface OptimizedPatientListProps {
  patients: Patient[];
  onPatientClick?: (patientId: string) => void;
  onAddTreatment?: (patientId: string, patientName: string) => void;
  onEditPatient?: (patientId: string) => void;
  loading?: boolean;
}

const PatientCard = memo<PatientCardProps>(
  ({ patient, onPatientClick, onAddTreatment, onEditPatient }) => {
    const getAge = (dateOfBirth: string | null): string => {
      if (!dateOfBirth) return "غير محدد";
      const today = new Date();
      const birthDate = new Date(dateOfBirth);
      let age = today.getFullYear() - birthDate.getFullYear();
      const monthDiff = today.getMonth() - birthDate.getMonth();
      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
        age--;
      }
      return `${age} سنة`;
    };

    const getStatusColor = (status: string | null): string => {
      switch (status) {
        case "active":
          return "bg-success/10 text-success border-success/20";
        case "inactive":
          return "bg-muted text-muted-foreground border-border";
        case "archived":
          return "bg-destructive/10 text-destructive border-destructive/20";
        default:
          return "bg-muted text-muted-foreground border-border";
      }
    };

    return (
      <Card className="hover:shadow-md transition-shadow h-full">
        <CardContent className="p-4">
          <div className="space-y-3">
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-base truncate mb-1">
                  {patient.full_name}
                </h3>
                <p className="text-sm text-muted-foreground truncate">
                  {patient.phone || "لا يوجد رقم"}
                </p>
              </div>
              <Badge
                variant="outline"
                className={cn("shrink-0 text-xs", getStatusColor(patient.patient_status))}
              >
                {patient.patient_status === "active"
                  ? "نشط"
                  : patient.patient_status === "inactive"
                  ? "غير نشط"
                  : "مؤرشف"}
              </Badge>
            </div>

            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-1">
                <User className="h-3.5 w-3.5" />
                <span>{patient.gender === "male" ? "ذكر" : patient.gender === "female" ? "أنثى" : "غير محدد"}</span>
              </div>
              <div className="flex items-center gap-1">
                <Calendar className="h-3.5 w-3.5" />
                <span>{getAge(patient.date_of_birth)}</span>
              </div>
            </div>

            <div className="flex items-center gap-2 pt-2">
              <Button
                variant="outline"
                size="sm"
                className="flex-1 h-8 text-xs"
                onClick={() => onPatientClick?.(patient.id)}
              >
                <Eye className="h-3.5 w-3.5 ml-1" />
                عرض
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="flex-1 h-8 text-xs"
                onClick={() => onAddTreatment?.(patient.id, patient.full_name)}
              >
                <Plus className="h-3.5 w-3.5 ml-1" />
                علاج
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0"
                onClick={() => onEditPatient?.(patient.id)}
              >
                <Edit className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }
);

PatientCard.displayName = "PatientCard";

export const OptimizedPatientList = memo<OptimizedPatientListProps>(({
  patients,
  onPatientClick,
  onAddTreatment,
  onEditPatient,
  loading = false
}) => {
  const renderPatientItem = useCallback(
    (patient: Patient) => (
      <PatientCard
        patient={patient}
        onPatientClick={onPatientClick}
        onAddTreatment={onAddTreatment}
        onEditPatient={onEditPatient}
      />
    ),
    [onPatientClick, onAddTreatment, onEditPatient]
  );

  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
        {Array.from({ length: 8 }).map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-4">
              <div className="space-y-3">
                <div className="h-5 bg-muted rounded w-3/4" />
                <div className="h-4 bg-muted rounded w-1/2" />
                <div className="flex gap-4">
                  <div className="h-3 bg-muted rounded w-16" />
                  <div className="h-3 bg-muted rounded w-16" />
                </div>
                <div className="flex gap-2 pt-2">
                  <div className="h-8 bg-muted rounded flex-1" />
                  <div className="h-8 bg-muted rounded flex-1" />
                  <div className="h-8 bg-muted rounded w-8" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (patients.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">لا يوجد مرضى للعرض</p>
      </div>
    );
  }

  if (patients.length <= 50) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
        {patients.map((patient) => (
          <PatientCard
            key={patient.id}
            patient={patient}
            onPatientClick={onPatientClick}
            onAddTreatment={onAddTreatment}
            onEditPatient={onEditPatient}
          />
        ))}
      </div>
    );
  }

  return (
    <VirtualizedList
      items={patients}
      itemHeight={200}
      height={600}
      renderItem={({ item, style }: { item: Patient; style: React.CSSProperties }) => (
        <div style={style} className="p-2">
          <PatientCard
            patient={item}
            onPatientClick={onPatientClick}
            onAddTreatment={onAddTreatment}
            onEditPatient={onEditPatient}
          />
        </div>
      )}
      className="border rounded-lg"
    />
  );
});

OptimizedPatientList.displayName = "OptimizedPatientList";