import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Eye, 
  Edit, 
  MessageCircle, 
  User2, 
  UserCog2,
  Smile,
  Heart,
  Camera,
  DollarSign
} from "lucide-react";
import { Link } from "react-router-dom";
import PatientMedicalSectionsPopup from "./PatientMedicalSectionsPopup";
import { usePatientFinancials } from '@/hooks/usePatientFinancials';
import DoctorSelector from './DoctorSelector';

interface PatientCardProps {
  patient: {
    id: string;
    full_name: string;
    phone?: string;
    assigned_doctor_id?: string;
    assigned_doctor?: {
      full_name: string;
    };
    financial_status?: 'paid' | 'pending' | 'overdue' | 'partial';
    medical_condition?: string;
    created_by_name?: string;
    created_by_role?: string;
    last_modified_by_name?: string;
    last_modified_by_role?: string;
  };
  onAddTreatment: (patientId: string, patientName: string) => void;
  onEditPatient: (patientId: string) => void;
}

const PatientCard = ({ patient, onAddTreatment, onEditPatient }: PatientCardProps) => {
  const [medicalDialogOpen, setMedicalDialogOpen] = useState(false);
  const [selectedSection, setSelectedSection] = useState<'dental' | 'overview' | 'prescriptions' | 'images' | 'appointments' | 'financial'>('overview');
  
  // استخدام الحالة المالية الفعلية من قاعدة البيانات
  const { financialStatus, loading: financialLoading } = usePatientFinancials(patient.id);
  
  const getFinancialStatusBadge = (status: string) => {
    switch (status) {
      case 'paid':
        return <Badge className="bg-green-100 text-green-800 border-green-200 dark:bg-green-900 dark:text-green-100">مدفوع</Badge>;
      case 'pending':
        return <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900 dark:text-yellow-100">معلق</Badge>;
      case 'overdue':
        return <Badge className="bg-red-100 text-red-800 border-red-200 dark:bg-red-900 dark:text-red-100">متأخر</Badge>;
      case 'partial':
        return <Badge className="bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900 dark:text-blue-100">جزئي</Badge>;
      default:
        return <Badge variant="secondary">غير محدد</Badge>;
    }
  };

  const getConditionBadge = (condition?: string) => {
    if (!condition) return null;
    return (
      <Badge variant="outline" className="text-xs">
        {condition}
      </Badge>
    );
  };

  const handleWhatsApp = () => {
    if (patient.phone) {
      const cleanPhone = patient.phone.replace(/\D/g, '');
      const message = `مرحباً ${patient.full_name}، نود تذكيركم بموعدكم في العيادة`;
      const encodedMessage = encodeURIComponent(message);
      window.open(`https://wa.me/${cleanPhone}?text=${encodedMessage}`, '_blank');
    }
  };

  const handleSectionClick = (section: 'dental' | 'overview' | 'prescriptions' | 'images' | 'appointments' | 'financial') => {
    setSelectedSection(section);
    setMedicalDialogOpen(true);
  };

  return (
    <Card 
      className="h-full hover:shadow-xl transition-all duration-300 border border-border/60 bg-white/90 dark:bg-card/90 backdrop-blur-sm cursor-pointer group"
    >
      <Link to={`/patients/${patient.id}`} className="block h-full">
        <CardContent className="p-6 h-full flex flex-col justify-between">
          {/* Header Section */}
          <div className="space-y-4">
            {/* Patient Name */}
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-foreground group-hover:text-primary transition-colors">
                {patient.full_name}
              </h3>
              <div className="flex space-x-1 space-x-reverse transition-opacity">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0 bg-muted/50 hover:bg-primary/10 hover:text-primary"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                  }}
                  asChild
                >
                  <Link to={`/patients/${patient.id}`}>
                    <Eye className="w-4 h-4" />
                  </Link>
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0 bg-muted/50 hover:bg-primary/10 hover:text-primary"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    onEditPatient(patient.id);
                  }}
                >
                  <Edit className="w-4 h-4" />
                </Button>
              </div>
            </div>

            {/* Assigned Doctor */}
            <div className="space-y-1" onClick={(e) => e.stopPropagation()}>
              <p className="text-sm text-muted-foreground flex items-center gap-1">
                <UserCog2 className="w-3 h-3" />
                الطبيب المسؤول
              </p>
              <DoctorSelector
                patientId={patient.id}
                currentDoctorId={patient.assigned_doctor_id}
                currentDoctorName={patient.assigned_doctor?.full_name}
              />
            </div>

            {/* Creator Info */}
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground flex items-center gap-1">
                <User2 className="w-3 h-3" />
                أنشئ بواسطة
              </p>
              <p className="text-xs text-muted-foreground">
                {patient.created_by_name || 'غير محدد'} 
                {patient.created_by_role && ` (${patient.created_by_role})`}
              </p>
            </div>

            {/* Financial Status */}
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground flex items-center gap-1">
                <DollarSign className="w-3 h-3" />
                الحالة المالية
              </p>
              {financialLoading ? (
                <Badge variant="outline" className="text-xs">جاري التحميل...</Badge>
              ) : (
                <div className="space-y-1">
                  {getFinancialStatusBadge(financialStatus.status)}
                  {financialStatus.balance_due > 0 && (
                    <p className="text-xs text-muted-foreground">
                      المتبقي: {financialStatus.balance_due.toFixed(2)} ريال
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* Medical Condition */}
            {patient.medical_condition && (
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">الحالة المرضية</p>
                {getConditionBadge(patient.medical_condition)}
              </div>
            )}
          </div>

            {/* Quick Actions - Keep only those with popups */}
            <div className="space-y-3 pt-4 border-t border-border/40">
              <p className="text-xs text-muted-foreground font-medium">الإجراءات السريعة</p>
              <div className="grid grid-cols-2 gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-12 flex flex-col items-center justify-center gap-1 p-2 hover:bg-primary/10 hover:text-primary group"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    handleSectionClick('dental');
                  }}
                  title="مخطط الأسنان التفاعلي"
                >
                  <Smile className="w-5 h-5 group-hover:scale-110 transition-transform" />
                  <span className="text-xs">الأسنان</span>
                </Button>
                
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-12 flex flex-col items-center justify-center gap-1 p-2 hover:bg-green-500/10 hover:text-green-600 group"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    handleSectionClick('overview');
                  }}
                  title="نظرة عامة على الصحة"
                >
                  <Heart className="w-5 h-5 group-hover:scale-110 transition-transform" />
                  <span className="text-xs">الملف الطبي</span>
                </Button>

                <Button
                  variant="ghost"
                  size="sm"
                  className="h-12 flex flex-col items-center justify-center gap-1 p-2 hover:bg-purple-500/10 hover:text-purple-600 group"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    handleSectionClick('images');
                  }}
                  title="الأشعة والصور"
                >
                  <Camera className="w-5 h-5 group-hover:scale-110 transition-transform" />
                  <span className="text-xs">الأشعة</span>
                </Button>

                <Button
                  variant="ghost"
                  size="sm"
                  className="h-12 flex flex-col items-center justify-center gap-1 p-2 hover:bg-yellow-500/10 hover:text-yellow-600 group"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    handleSectionClick('financial');
                  }}
                  title="الحالة المالية"
                >
                  <DollarSign className="w-5 h-5 group-hover:scale-110 transition-transform" />
                  <span className="text-xs">المالية</span>
                </Button>
              </div>
            </div>

          {/* Footer Section */}
          <div className="pt-4 border-t border-border/40 mt-auto">
            {patient.phone && (
              <Button
                variant="outline"
                size="sm"
                className="w-full justify-center gap-2 hover:bg-green-50 hover:border-green-200 hover:text-green-700 dark:hover:bg-green-900/20 dark:hover:border-green-800 dark:hover:text-green-300 transition-all duration-200"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  handleWhatsApp();
                }}
              >
                <MessageCircle className="w-4 h-4" />
                واتساب
              </Button>
            )}
          </div>
        </CardContent>
      </Link>

      {/* Medical Sections Popup */}
      <PatientMedicalSectionsPopup
        open={medicalDialogOpen}
        onOpenChange={setMedicalDialogOpen}
        patientId={patient.id}
        patientName={patient.full_name}
        initialSection={selectedSection}
      />
    </Card>
  );
};

export default PatientCard;