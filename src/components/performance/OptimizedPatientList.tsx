import React, { memo, useMemo, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Eye, UserPlus, Edit, Phone, Calendar } from "lucide-react";
import { VirtualizedList } from "./VirtualizedList";

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

interface OptimizedPatientListProps {
  patients: Patient[];
  onPatientClick?: (patientId: string) => void;
  onAddTreatment?: (patientId: string, patientName: string) => void;
  onEditPatient?: (patientId: string) => void;
  loading?: boolean;
}

// مكون مريض محسن
const PatientCard = memo(({ 
  patient, 
  onPatientClick, 
  onAddTreatment, 
  onEditPatient 
}: { 
  patient: Patient; 
  onPatientClick?: (id: string) => void;
  onAddTreatment?: (id: string, name: string) => void;
  onEditPatient?: (id: string) => void;
}) => {
  const getAge = useCallback((dateOfBirth?: string) => {
    if (!dateOfBirth) return null;
    const today = new Date();
    const birth = new Date(dateOfBirth);
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    return age;
  }, []);

  const getStatusColor = useCallback((status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800 hover:bg-green-200';
      case 'inactive':
        return 'bg-gray-100 text-gray-800 hover:bg-gray-200';
      case 'suspended':
        return 'bg-red-100 text-red-800 hover:bg-red-200';
      default:
        return 'bg-blue-100 text-blue-800 hover:bg-blue-200';
    }
  }, []);

  const age = useMemo(() => getAge(patient.date_of_birth), [patient.date_of_birth, getAge]);

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <h4 className="font-semibold text-lg">{patient.full_name}</h4>
            {patient.phone && (
              <div className="flex items-center gap-1 text-sm text-muted-foreground mt-1">
                <Phone className="h-3 w-3" />
                {patient.phone}
              </div>
            )}
          </div>
          <Badge className={getStatusColor(patient.patient_status)}>
            {patient.patient_status === 'active' ? 'نشط' : 
             patient.patient_status === 'inactive' ? 'غير نشط' : 
             patient.patient_status === 'suspended' ? 'موقوف' : patient.patient_status}
          </Badge>
        </div>
      </CardHeader>
      
      <CardContent className="pt-0">
        <div className="space-y-2 text-sm text-muted-foreground mb-4">
          {patient.gender && (
            <div>الجنس: {patient.gender === 'male' ? 'ذكر' : 'أنثى'}</div>
          )}
          {age && (
            <div className="flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              العمر: {age} سنة
            </div>
          )}
          {patient.national_id && (
            <div>الهوية: {patient.national_id}</div>
          )}
        </div>

        <div className="flex gap-2 flex-wrap">
          <Button
            size="sm"
            onClick={() => onPatientClick?.(patient.id)}
            className="flex items-center gap-1"
          >
            <Eye className="h-3 w-3" />
            عرض
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => onAddTreatment?.(patient.id, patient.full_name)}
            className="flex items-center gap-1"
          >
            <UserPlus className="h-3 w-3" />
            علاج
          </Button>
          <Button
            size="sm"
            variant="secondary"
            onClick={() => onEditPatient?.(patient.id)}
            className="flex items-center gap-1"
          >
            <Edit className="h-3 w-3" />
            تعديل
          </Button>
        </div>
      </CardContent>
    </Card>
  );
});

PatientCard.displayName = "PatientCard";

// قائمة المرضى المحسنة
export const OptimizedPatientList = memo<OptimizedPatientListProps>(({
  patients,
  onPatientClick,
  onAddTreatment,
  onEditPatient,
  loading = false
}) => {
  const renderPatientItem = useCallback(
    ({ item, style }: { item: Patient; style: React.CSSProperties }) => (
      <div style={style} className="p-2">
        <PatientCard
          patient={item}
          onPatientClick={onPatientClick}
          onAddTreatment={onAddTreatment}
          onEditPatient={onEditPatient}
        />
      </div>
    ),
    [onPatientClick, onAddTreatment, onEditPatient]
  );

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader>
              <div className="h-6 bg-muted rounded w-3/4" />
              <div className="h-4 bg-muted rounded w-1/2" />
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="h-3 bg-muted rounded w-full" />
                <div className="h-3 bg-muted rounded w-2/3" />
              </div>
              <div className="flex gap-2 mt-4">
                <div className="h-8 bg-muted rounded w-16" />
                <div className="h-8 bg-muted rounded w-16" />
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

  // استخدام الشبكة العادية للعرض المحسن
  if (patients.length <= 50) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
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

  // استخدام القائمة الافتراضية للبيانات الكبيرة
  return (
    <VirtualizedList
      items={patients}
      itemHeight={200}
      height={600}
      renderItem={renderPatientItem}
      className="border rounded-lg"
    />
  );
});

OptimizedPatientList.displayName = "OptimizedPatientList";