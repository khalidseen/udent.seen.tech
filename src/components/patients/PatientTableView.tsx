import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Eye, Edit, Activity, Phone, Mail, Calendar } from "lucide-react";
import { format } from "date-fns";
import { ar } from "date-fns/locale";
import { Link } from "react-router-dom";

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
}

interface PatientTableViewProps {
  patients: Patient[];
  onAddTreatment: (patientId: string, patientName: string) => void;
}

const PatientTableView = ({ patients, onAddTreatment }: PatientTableViewProps) => {
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

  return (
    <div className="rounded-md border border-border/60 bg-white/90 dark:bg-card/90 backdrop-blur-sm overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/40">
            <TableHead className="font-semibold">اسم المريض</TableHead>
            <TableHead className="font-semibold">الجنس</TableHead>
            <TableHead className="font-semibold">العمر</TableHead>
            <TableHead className="font-semibold">الهاتف</TableHead>
            <TableHead className="font-semibold">البريد الإلكتروني</TableHead>
            <TableHead className="font-semibold">تاريخ التسجيل</TableHead>
            <TableHead className="font-semibold text-center">الإجراءات</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {patients.length === 0 ? (
            <TableRow>
              <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                لا توجد مرضى
              </TableCell>
            </TableRow>
          ) : (
            patients.map((patient) => (
              <TableRow key={patient.id} className="hover:bg-accent/40 transition-colors">
                <TableCell className="font-medium">
                  <div className="flex flex-col">
                    <span className="font-semibold text-foreground">{patient.full_name}</span>
                    {patient.address && (
                      <span className="text-sm text-muted-foreground truncate max-w-[200px]">
                        {patient.address}
                      </span>
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
                  {patient.phone ? (
                    <div className="flex items-center gap-2">
                      <Phone className="w-4 h-4 text-muted-foreground" />
                      <span className="text-sm">{patient.phone}</span>
                    </div>
                  ) : (
                    <span className="text-muted-foreground text-sm">غير متوفر</span>
                  )}
                </TableCell>
                <TableCell>
                  {patient.email ? (
                    <div className="flex items-center gap-2">
                      <Mail className="w-4 h-4 text-muted-foreground" />
                      <span className="text-sm truncate max-w-[180px]">{patient.email}</span>
                    </div>
                  ) : (
                    <span className="text-muted-foreground text-sm">غير متوفر</span>
                  )}
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
                  </div>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
};

export default PatientTableView;