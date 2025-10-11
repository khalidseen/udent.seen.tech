import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Eye, Edit, Activity, Phone, Mail, Calendar, User, CreditCard, Heart } from "lucide-react";
import { format } from "date-fns";
import { ar } from "date-fns/locale";
import { Link } from "react-router-dom";
import { PatientCardActions } from "./PatientCardActions";
import { usePatientStats } from "@/hooks/usePatientStats";

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

interface PatientCardsViewProps {
  patients: Patient[];
  onAddTreatment: (patientId: string, patientName: string) => void;
}

export default function PatientCardsView({ patients, onAddTreatment }: PatientCardsViewProps) {
  const getGenderIcon = (gender: string) => {
    return gender === 'male' ? (
      <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/30 dark:text-blue-400">
        <User className="w-3 h-3 mr-1" />
        ذكر
      </Badge>
    ) : gender === 'female' ? (
      <Badge variant="outline" className="bg-pink-50 text-pink-700 border-pink-200 dark:bg-pink-950/30 dark:text-pink-400">
        <User className="w-3 h-3 mr-1" />
        أنثى
      </Badge>
    ) : (
      <Badge variant="outline" className="bg-gray-50 text-gray-700 border-gray-200">
        <User className="w-3 h-3 mr-1" />
        غير محدد
      </Badge>
    );
  };

  const getAge = (dateOfBirth: string) => {
    if (!dateOfBirth) return '-';
    return new Date().getFullYear() - new Date(dateOfBirth).getFullYear();
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-green-500/10 text-green-700 border-green-200 dark:bg-green-950/30 dark:text-green-400">نشط</Badge>;
      case 'inactive':
        return <Badge className="bg-gray-500/10 text-gray-700 border-gray-200">غير نشط</Badge>;
      case 'transferred':
        return <Badge className="bg-blue-500/10 text-blue-700 border-blue-200">محول</Badge>;
      case 'deceased':
        return <Badge className="bg-red-500/10 text-red-700 border-red-200">متوفى</Badge>;
      default:
        return <Badge variant="outline">غير محدد</Badge>;
    }
  };

  if (patients.length === 0) {
    return (
      <div className="text-center py-12">
        <User className="mx-auto h-12 w-12 text-muted-foreground" />
        <h3 className="mt-4 text-lg font-semibold">لا توجد مرضى</h3>
        <p className="text-muted-foreground">ابدأ بإضافة مريض جديد</p>
      </div>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {patients.map((patient, index) => {
        const PatientCard = () => {
          const { data: stats } = usePatientStats(patient.id);

          return (
            <Card className="hover:shadow-lg transition-all duration-300 border-border/60 overflow-hidden group">
              <CardHeader className="pb-3 bg-gradient-to-br from-primary/5 to-primary/10 dark:from-primary/10 dark:to-primary/20">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="font-bold text-lg mb-1">{patient.full_name}</h3>
                    <div className="flex items-center gap-2 flex-wrap">
                      {getGenderIcon(patient.gender)}
                      {getStatusBadge(patient.patient_status)}
                    </div>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="pt-4 space-y-3">
                {/* معلومات العمر وفصيلة الدم */}
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2 text-sm">
                    <Calendar className="w-4 h-4 text-muted-foreground" />
                    <span className="font-medium">{getAge(patient.date_of_birth)} سنة</span>
                  </div>
                  {patient.blood_type && (
                    <div className="flex items-center gap-2 text-sm">
                      <Heart className="w-4 h-4 text-red-500" />
                      <span className="font-medium">{patient.blood_type}</span>
                    </div>
                  )}
                </div>

                {/* رقم الهوية */}
                {patient.national_id && (
                  <div className="flex items-center gap-2 text-sm">
                    <CreditCard className="w-4 h-4 text-muted-foreground" />
                    <span className="font-mono text-xs">{patient.national_id}</span>
                  </div>
                )}

                {/* معلومات الاتصال */}
                <div className="space-y-2">
                  {patient.phone && (
                    <div className="flex items-center gap-2 text-sm">
                      <Phone className="w-4 h-4 text-muted-foreground" />
                      <span className="text-muted-foreground">{patient.phone}</span>
                    </div>
                  )}
                  {patient.email && (
                    <div className="flex items-center gap-2 text-sm">
                      <Mail className="w-4 h-4 text-muted-foreground" />
                      <span className="text-muted-foreground text-xs">{patient.email}</span>
                    </div>
                  )}
                </div>

                {/* تاريخ التسجيل */}
                <div className="pt-2 border-t border-border/50">
                  <p className="text-xs text-muted-foreground">
                    تاريخ التسجيل: {format(new Date(patient.created_at), 'yyyy/MM/dd', { locale: ar })}
                  </p>
                </div>
              </CardContent>

              <CardFooter className="flex flex-col gap-3 pt-3 pb-4 bg-muted/20">
                <div className="flex w-full gap-2">
                  <Link to={`/patients/${patient.id}`} className="flex-1">
                    <Button variant="outline" size="sm" className="w-full gap-2">
                      <Eye className="w-4 h-4" />
                      عرض
                    </Button>
                  </Link>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="flex-1 gap-2"
                    onClick={() => onAddTreatment(patient.id, patient.full_name)}
                  >
                    <Activity className="w-4 h-4" />
                    علاج
                  </Button>
                  <Button variant="outline" size="sm" className="gap-2">
                    <Edit className="w-4 h-4" />
                  </Button>
                </div>
                
                <PatientCardActions patientId={patient.id} stats={stats} />
              </CardFooter>
            </Card>
          );
        };

        return (
          <div 
            key={patient.id}
            className="animate-in fade-in zoom-in-95 duration-300"
            style={{ animationDelay: `${index * 50}ms` }}
          >
            <PatientCard />
          </div>
        );
      })}
    </div>
  );
}
