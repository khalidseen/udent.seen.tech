import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Eye, Edit, Activity, Phone, Mail, Calendar, Trash2 } from "lucide-react";
import { format } from "date-fns";
import { ar } from "date-fns/locale";
import { Link } from "react-router-dom";
import { useState } from "react";
import DeletePatientDialog from "./DeletePatientDialog";
import { useDeletePatient } from "@/hooks/useDeletePatient";

interface Patient {
  id: string;
  full_name: string;
  phone: string;
  email: string;
  date_of_birth: string;
  gender: string;
  address: string;
  medical_history: string;
  created_at: string;
  national_id?: string;
  emergency_contact?: string;
  emergency_phone?: string;
  patient_status: string;
  insurance_info?: string;
  blood_type?: string;
  occupation?: string;
  marital_status?: string;
}

interface PatientTableViewProps {
  patients: Patient[];
  onAddTreatment: (patientId: string, patientName: string) => void;
}

const PatientTableView = ({ patients, onAddTreatment }: PatientTableViewProps) => {
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  
  const deletePatientMutation = useDeletePatient();
  const getGenderBadge = (gender: string) => {
    return gender === 'male' ? (
      <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">ذكر</Badge>
    ) : gender === 'female' ? (
      <Badge variant="outline" className="bg-pink-50 text-pink-700 border-pink-200">أنثى</Badge>
    ) : (
      <Badge variant="outline" className="bg-gray-50 text-gray-700 border-gray-200">غير محدد</Badge>
    );
  };

  const getAge = (dateOfBirth: string) => {
    if (!dateOfBirth) return '-';
    return new Date().getFullYear() - new Date(dateOfBirth).getFullYear();
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">نشط</Badge>;
      case 'inactive':
        return <Badge variant="outline" className="bg-gray-50 text-gray-700 border-gray-200">غير نشط</Badge>;
      case 'transferred':
        return <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">محول</Badge>;
      case 'deceased':
        return <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">متوفى</Badge>;
      default:
        return <Badge variant="outline" className="bg-gray-50 text-gray-700 border-gray-200">غير محدد</Badge>;
    }
  };

  const handleDeleteClick = (patient: Patient) => {
    setSelectedPatient(patient);
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = () => {
    if (selectedPatient) {
      deletePatientMutation.mutate({
        patientId: selectedPatient.id,
        patientName: selectedPatient.full_name
      });
      setDeleteDialogOpen(false);
      setSelectedPatient(null);
    }
  };

  return (
    <>
      <div className="rounded-md border border-border/60 bg-white/90 dark:bg-card/90 backdrop-blur-sm overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/40">
              <TableHead className="font-semibold">اسم المريض</TableHead>
              <TableHead className="font-semibold">الجنس</TableHead>
              <TableHead className="font-semibold">العمر</TableHead>
              <TableHead className="font-semibold">رقم الهوية</TableHead>
              <TableHead className="font-semibold">الهاتف</TableHead>
              <TableHead className="font-semibold">الحالة</TableHead>
              <TableHead className="font-semibold">تاريخ التسجيل</TableHead>
              <TableHead className="font-semibold text-center">الإجراءات</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {patients.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                  لا توجد مرضى
                </TableCell>
              </TableRow>
            ) : (
              patients.map((patient) => (
                <TableRow key={patient.id} className="hover:bg-accent/40 transition-colors">
                  <TableCell className="font-medium">
                    <div className="flex flex-col">
                      <span className="font-semibold text-foreground">{patient.full_name}</span>
                      {patient.blood_type && (
                        <span className="text-xs text-muted-foreground">فصيلة الدم: {patient.blood_type}</span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    {getGenderBadge(patient.gender)}
                  </TableCell>
                  <TableCell>
                    <span className="font-medium">{getAge(patient.date_of_birth)} سنة</span>
                  </TableCell>
                  <TableCell>
                    {patient.national_id ? (
                      <span className="text-sm font-mono">{patient.national_id}</span>
                    ) : (
                      <span className="text-muted-foreground text-sm">-</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col gap-1">
                      {patient.phone ? (
                        <div className="flex items-center gap-2">
                          <Phone className="w-4 h-4 text-muted-foreground" />
                          <span className="text-sm">{patient.phone}</span>
                        </div>
                      ) : (
                        <span className="text-muted-foreground text-sm">غير متوفر</span>
                      )}
                      {patient.emergency_phone && (
                        <div className="flex items-center gap-2">
                          <Phone className="w-3 h-3 text-red-500" />
                          <span className="text-xs text-red-600">طوارئ: {patient.emergency_phone}</span>
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    {getStatusBadge(patient.patient_status)}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-muted-foreground" />
                      <span className="text-sm">
                        {format(new Date(patient.created_at), 'yyyy/MM/dd', { locale: ar })}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center justify-center gap-1">
                      <Link to={`/patients/${patient.id}`}>
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                          <Eye className="w-4 h-4" />
                        </Button>
                      </Link>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="h-8 w-8 p-0"
                        onClick={() => onAddTreatment(patient.id, patient.full_name)}
                      >
                        <Activity className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="h-8 w-8 p-0 hover:bg-red-500/10 hover:text-red-600"
                        onClick={() => handleDeleteClick(patient)}
                        title="حذف المريض"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Delete Patient Dialog */}
      {selectedPatient && (
        <DeletePatientDialog
          open={deleteDialogOpen}
          onOpenChange={setDeleteDialogOpen}
          patientName={selectedPatient.full_name}
          onConfirmDelete={handleConfirmDelete}
          isLoading={deletePatientMutation.isPending}
        />
      )}
    </>
  );
};

export default PatientTableView;