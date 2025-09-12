import React, { memo, useState, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
<<<<<<< HEAD
import { useToast } from "@/hooks/use-toast";
import { useCurrency } from '@/hooks/useCurrency';
import { useDoctors } from '@/hooks/useDoctors';
=======
>>>>>>> cbd682d36e862741c55b9e7b5d144f8de65c694a
import { 
  Eye, 
  Activity, 
  Edit, 
  MessageCircle, 
  Phone, 
  DollarSign,
  Smile,
  Heart,
  Pill,
  Camera,
<<<<<<< HEAD
  Calendar,
  Trash2,
  UserCheck,
  UserPlus,
  CreditCard,
  Mail
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Patient } from "@/hooks/usePatients";
import PatientMedicalSectionsDialog from "./PatientMedicalSectionsDialog";
import DeletePatientDialog from "./DeletePatientDialog";
import EditPatientDialog from "./EditPatientDialog";
import FinancialStatusDialog from "./FinancialStatusDialog";
import MedicationDialog from "./MedicationDialog";
import PhotoGalleryDialog from "./PhotoGalleryDialog";
import AppointmentBookingDialog from "./AppointmentBookingDialog";
import CommunicationDialog from "./CommunicationDialog";
import VitalsDialog from "./VitalsDialog";
import PatientCreatorFallback from "./PatientCreatorFallback";
import DoctorSelector from "./DoctorSelector";
import { useDeletePatient } from "@/hooks/useDeletePatient";
=======
  Calendar
} from "lucide-react";
import { Link } from "react-router-dom";
import { Patient } from "@/hooks/usePatients";
import PatientMedicalSectionsDialog from "./PatientMedicalSectionsDialog";
>>>>>>> cbd682d36e862741c55b9e7b5d144f8de65c694a

interface OptimizedPatientCardProps {
  patient: Patient;
  onAddTreatment: (patientId: string, patientName: string) => void;
  onEditPatient: (patientId: string) => void;
<<<<<<< HEAD
  onPatientUpdated?: () => void;
=======
>>>>>>> cbd682d36e862741c55b9e7b5d144f8de65c694a
}

const OptimizedPatientCard = memo(({ 
  patient, 
  onAddTreatment, 
<<<<<<< HEAD
  onEditPatient,
  onPatientUpdated
}: OptimizedPatientCardProps) => {
  const [isHovered, setIsHovered] = useState(false);
  const [medicalDialogOpen, setMedicalDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [financialDialogOpen, setFinancialDialogOpen] = useState(false);
  const [selectedSection, setSelectedSection] = useState<'dental' | 'overview' | 'prescriptions' | 'images' | 'appointments' | 'financial'>('overview');
  
  // حالات النوافذ المنبثقة للأيقونات
  const [medicationDialogOpen, setMedicationDialogOpen] = useState(false);
  const [photoDialogOpen, setPhotoDialogOpen] = useState(false);
  const [appointmentDialogOpen, setAppointmentDialogOpen] = useState(false);
  const [communicationDialogOpen, setCommunicationDialogOpen] = useState(false);
  const [vitalsDialogOpen, setVitalsDialogOpen] = useState(false);
  
  const navigate = useNavigate();
  const { toast } = useToast();
  const deletePatientMutation = useDeletePatient();
  const { formatAmount } = useCurrency();
  const { doctors } = useDoctors();

  // دالة للتنقل إلى صفحة المريض
  const handleCardClick = useCallback((e: React.MouseEvent) => {
    // منع الانتقال إذا كان النقر على عنصر تفاعلي
    const target = e.target as HTMLElement;
    if (target.closest('button') || target.closest('[role="combobox"]')) {
      return;
    }
    navigate(`/patients/${patient.id}`);
  }, [navigate, patient.id]);

  // دالة لتحديد لون الحالة المالية
  const getFinancialStatusColor = useCallback((status: string) => {
    switch (status) {
      case 'paid': return 'bg-green-100 text-green-800 hover:bg-green-200';
      case 'pending': return 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200';
      case 'overdue': return 'bg-red-100 text-red-800 hover:bg-red-200';
      case 'partial': return 'bg-blue-100 text-blue-800 hover:bg-blue-200';
      default: return 'bg-gray-100 text-gray-800 hover:bg-gray-200';
    }
  }, []);

  // دالة للحصول على اسم الحالة المالية بالعربية
  const getFinancialStatusText = useCallback((status: string) => {
    switch (status) {
      case 'paid': return 'مدفوع';
      case 'pending': return 'معلق';
      case 'overdue': return 'متأخر';
      case 'partial': return 'جزئي';
      default: return 'غير محدد';
    }
  }, []);

  // دالة لعرض معلومات المنشئ
  const getCreatorInfo = useCallback(() => {
    // البحث في الملاحظات عن معلومات المنشئ
    if (patient.notes) {
      const creatorMatch = patient.notes.match(/CREATOR_INFO:(.+?)(?:\n|$)/);
      if (creatorMatch) {
        try {
          const creatorInfo = JSON.parse(creatorMatch[1]);
          return {
            name: creatorInfo.name,
            role: creatorInfo.role
          };
        } catch (e) {
          console.error('خطأ في تحليل معلومات المنشئ:', e);
        }
      }
    }
    return null;
  }, [patient.notes]);
=======
  onEditPatient 
}: OptimizedPatientCardProps) => {
  const [isHovered, setIsHovered] = useState(false);
  const [medicalDialogOpen, setMedicalDialogOpen] = useState(false);
  const [selectedSection, setSelectedSection] = useState<'dental' | 'overview' | 'prescriptions' | 'images' | 'appointments' | 'financial'>('overview');
>>>>>>> cbd682d36e862741c55b9e7b5d144f8de65c694a

  const getFinancialStatusBadge = useCallback((status: string) => {
    const baseClasses = "text-xs font-medium transition-colors";
    switch (status) {
      case 'paid':
        return <Badge className={`${baseClasses} bg-green-50 text-green-700 border-green-200 dark:bg-green-900/20 dark:text-green-400 dark:border-green-800`}>مدفوع</Badge>;
      case 'pending':
        return <Badge className={`${baseClasses} bg-yellow-50 text-yellow-700 border-yellow-200 dark:bg-yellow-900/20 dark:text-yellow-400 dark:border-yellow-800`}>معلق</Badge>;
      case 'overdue':
        return <Badge className={`${baseClasses} bg-red-50 text-red-700 border-red-200 dark:bg-red-900/20 dark:text-red-400 dark:border-red-800`}>متأخر</Badge>;
      case 'partial':
        return <Badge className={`${baseClasses} bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-800`}>جزئي</Badge>;
      default:
        return <Badge variant="secondary" className={baseClasses}>غير محدد</Badge>;
    }
  }, []);

  const getConditionBadge = useCallback((condition?: string) => {
    if (!condition) return null;
    return (
      <Badge variant="outline" className="text-xs font-medium">
        {condition}
      </Badge>
    );
  }, []);

  const handleWhatsApp = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
<<<<<<< HEAD
    if (!patient.phone) {
      toast({
        title: "لا يوجد رقم هاتف",
        description: "لا يمكن إرسال رسالة واتساب بدون رقم هاتف",
        variant: "destructive",
      });
      return;
    }

    try {
      // تنظيف رقم الهاتف وإضافة الرمز الدولي للسعودية إذا لم يكن موجوداً
      let cleanPhone = patient.phone.replace(/\D/g, '');
      
      // إضافة رمز السعودية إذا كان الرقم لا يبدأ برمز دولي
      if (cleanPhone.length === 9 && cleanPhone.startsWith('5')) {
        cleanPhone = '966' + cleanPhone;
      } else if (cleanPhone.length === 10 && cleanPhone.startsWith('05')) {
        cleanPhone = '966' + cleanPhone.substring(1);
      } else if (cleanPhone.startsWith('00966')) {
        cleanPhone = cleanPhone.substring(2);
      } else if (cleanPhone.startsWith('+966')) {
        cleanPhone = cleanPhone.substring(1);
      }

      const message = `مرحباً ${patient.full_name}،\n\nنود تذكيركم بموعدكم في العيادة.\n\nشكراً لكم.\nإدارة العيادة`;
      const encodedMessage = encodeURIComponent(message);
      const whatsappUrl = `https://wa.me/${cleanPhone}?text=${encodedMessage}`;
      
      window.open(whatsappUrl, '_blank');
      
      toast({
        title: "تم فتح واتساب",
        description: `تم فتح محادثة واتساب مع ${patient.full_name}`,
      });
    } catch (error) {
      console.error('خطأ في فتح واتساب:', error);
      toast({
        title: "خطأ",
        description: "حدث خطأ في فتح واتساب",
        variant: "destructive",
      });
    }
  }, [patient.phone, patient.full_name, toast]);
=======
    if (patient.phone) {
      const cleanPhone = patient.phone.replace(/\D/g, '');
      const message = `مرحباً ${patient.full_name}، نود تذكيركم بموعدكم في العيادة`;
      const encodedMessage = encodeURIComponent(message);
      window.open(`https://wa.me/${cleanPhone}?text=${encodedMessage}`, '_blank');
    }
  }, [patient.phone, patient.full_name]);
>>>>>>> cbd682d36e862741c55b9e7b5d144f8de65c694a

  const handleAddTreatmentClick = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onAddTreatment(patient.id, patient.full_name);
  }, [patient.id, patient.full_name, onAddTreatment]);

  const handleEditPatientClick = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
<<<<<<< HEAD
    setEditDialogOpen(true);
  }, []);

  const handlePatientUpdated = useCallback(() => {
    if (onPatientUpdated) {
      onPatientUpdated();
    }
  }, [onPatientUpdated]);
=======
    onEditPatient(patient.id);
  }, [patient.id, onEditPatient]);
>>>>>>> cbd682d36e862741c55b9e7b5d144f8de65c694a

  const handleSectionClick = useCallback((e: React.MouseEvent, section: 'dental' | 'overview' | 'prescriptions' | 'images' | 'appointments' | 'financial') => {
    e.preventDefault();
    e.stopPropagation();
<<<<<<< HEAD
    
    // إذا كان القسم هو المالية، فتح النافذة المنبثقة
    if (section === 'financial') {
      setFinancialDialogOpen(true);
      return;
    }
    
    // بدلاً من فتح modal، سننتقل لصفحة المريض مع القسم المحدد
    navigate(`/patients/${patient.id}?section=${section}`);
  }, [navigate, patient.id]);

  const handleIconClick = useCallback((e: React.MouseEvent, iconType: string) => {
    e.preventDefault();
    e.stopPropagation();
    
    switch (iconType) {
      case 'medication':
        setMedicationDialogOpen(true);
        break;
      case 'photo':
        setPhotoDialogOpen(true);
        break;
      case 'appointment':
        setAppointmentDialogOpen(true);
        break;
      case 'communication':
        setCommunicationDialogOpen(true);
        break;
      case 'vitals':
        setVitalsDialogOpen(true);
        break;
      default:
        // للأيقونات الأخرى، انتقل لصفحة المريض
        navigate(`/patients/${patient.id}`);
    }
  }, [navigate, patient.id]);

  const handleDeleteClick = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDeleteDialogOpen(true);
  }, []);

  const handleConfirmDelete = useCallback(() => {
    deletePatientMutation.mutate({
      patientId: patient.id,
      patientName: patient.full_name
    });
    setDeleteDialogOpen(false);
  }, [deletePatientMutation, patient.id, patient.full_name]);

=======
    setSelectedSection(section);
    setMedicalDialogOpen(true);
  }, []);

>>>>>>> cbd682d36e862741c55b9e7b5d144f8de65c694a
  return (
    <Card 
      className={`
        h-full transition-all duration-200 border border-border/60 
        bg-card/90 backdrop-blur-sm cursor-pointer group
        ${isHovered ? 'shadow-lg scale-[1.02]' : 'shadow-sm hover:shadow-md'}
      `}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
<<<<<<< HEAD
      onClick={handleCardClick}
    >
      <CardContent className="p-4 h-full flex flex-col justify-between">
        {/* Header Section */}
        <div className="space-y-3">
          {/* Patient Name & Quick Actions */}
          <div className="flex items-center justify-between">
            <h3 className="text-base font-semibold text-foreground group-hover:text-primary transition-colors line-clamp-1">
              {patient.full_name}
            </h3>
            <div className={`flex space-x-1 space-x-reverse transition-opacity ${isHovered ? 'opacity-100' : 'opacity-70'}`}>
              <Button
                variant="ghost"
                size="sm"
                className="h-7 w-7 p-0 bg-muted/40 hover:bg-primary/10 hover:text-primary transition-colors"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  navigate(`/patients/${patient.id}`);
                }}
              >
                <Eye className="w-3.5 h-3.5" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="h-7 w-7 p-0 bg-muted/40 hover:bg-green-500/10 hover:text-green-600 transition-colors"
                onClick={handleAddTreatmentClick}
              >
                <Activity className="w-3.5 h-3.5" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="h-7 w-7 p-0 bg-muted/40 hover:bg-blue-500/10 hover:text-blue-600 transition-colors"
                onClick={handleEditPatientClick}
              >
                <Edit className="w-3.5 h-3.5" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="h-7 w-7 p-0 bg-muted/40 hover:bg-red-500/10 hover:text-red-600 transition-colors"
                onClick={handleDeleteClick}
                title="حذف المريض"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </Button>
            </div>
          </div>

          {/* Doctor Assignment */}
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">الطبيب المسؤول</p>
            <DoctorSelector
              patientId={patient.id}
              currentDoctorId={patient.assigned_doctor_id}
              currentDoctorName={patient.assigned_doctor?.full_name}
              onDoctorChange={(doctorId, doctorName) => {
                // تحديث البيانات محلياً ثم إرسال للخادم
                const updatedPatient = { 
                  ...patient, 
                  assigned_doctor_id: doctorId || null,
                  assigned_doctor: { id: doctorId, full_name: doctorName }
                };
                onPatientUpdated?.();
              }}
            />
          </div>

          {/* Creator Information - Real Data Only */}
          {patient.created_by_name ? (
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">أنشأ بواسطة</p>
              <div className="flex items-center gap-2">
                <UserCheck className="w-3.5 h-3.5 text-muted-foreground" />
                <span className="text-sm font-medium text-foreground line-clamp-1">
                  {patient.created_by_name}
                </span>
                <Badge variant="outline" className="text-xs">
                  {patient.created_by_role === 'doctor' && 'طبيب'}
                  {patient.created_by_role === 'assistant' && 'مساعد'}
                  {patient.created_by_role === 'secretary' && 'سكرتير'}
                  {patient.created_by_role === 'admin' && 'مدير'}
                  {patient.created_by_role === 'super_admin' && 'مدير عام'}
                  {!patient.created_by_role && 'مستخدم'}
                </Badge>
              </div>
            </div>
          ) : (
            <PatientCreatorFallback patient={patient} />
          )}

          {/* Status Information - Real Data Only */}
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">الحالة المالية</p>
              <div className="flex items-center gap-2">
                {getFinancialStatusBadge(patient.financial_status)}
                {patient.financial_balance !== undefined && patient.financial_balance !== 0 && (
                  <span className={`text-xs font-medium ${patient.financial_balance > 0 ? 'text-red-600' : 'text-green-600'}`}>
                    {patient.financial_balance > 0 ? '+' : ''}{formatAmount(patient.financial_balance)}
                  </span>
                )}
              </div>
            </div>
            
            {patient.medical_condition && (
              <div className="text-right">
                {getConditionBadge(patient.medical_condition)}
              </div>
            )}
          </div>
        </div>

        {/* Quick Access Icons - Optimized */}
        <div className="space-y-2 pt-3 border-t border-border/40">
          <p className="text-xs text-muted-foreground font-medium">أقسام سريعة</p>
          <div className="grid grid-cols-6 gap-1">
            <Button
              variant="ghost"
              size="sm"
              className="h-8 flex flex-col items-center justify-center p-1 hover:bg-primary/10 hover:text-primary group/icon"
              onClick={(e) => handleSectionClick(e, 'dental')}
              title="مخطط الأسنان"
            >
              <Smile className="w-3.5 h-3.5 group-hover/icon:scale-110 transition-transform" />
            </Button>
            
            <Button
              variant="ghost"
              size="sm"
              className="h-8 flex flex-col items-center justify-center p-1 hover:bg-green-500/10 hover:text-green-600 group/icon"
              onClick={(e) => handleSectionClick(e, 'overview')}
              title="نظرة عامة"
            >
              <Heart className="w-3.5 h-3.5 group-hover/icon:scale-110 transition-transform" />
            </Button>

            <Button
              variant="ghost"
              size="sm"
              className="h-8 flex flex-col items-center justify-center p-1 hover:bg-blue-500/10 hover:text-blue-600 group/icon"
              onClick={(e) => handleSectionClick(e, 'prescriptions')}
              title="الوصفات"
            >
              <Pill className="w-3.5 h-3.5 group-hover/icon:scale-110 transition-transform" />
            </Button>

            <Button
              variant="ghost"
              size="sm"
              className="h-8 flex flex-col items-center justify-center p-1 hover:bg-purple-500/10 hover:text-purple-600 group/icon"
              onClick={(e) => handleSectionClick(e, 'images')}
              title="الأشعة"
            >
              <Camera className="w-3.5 h-3.5 group-hover/icon:scale-110 transition-transform" />
            </Button>

            <Button
              variant="ghost"
              size="sm"
              className="h-8 flex flex-col items-center justify-center p-1 hover:bg-orange-500/10 hover:text-orange-600 group/icon"
              onClick={(e) => handleSectionClick(e, 'appointments')}
              title="المواعيد"
            >
              <Calendar className="w-3.5 h-3.5 group-hover/icon:scale-110 transition-transform" />
            </Button>

            <Button
              variant="ghost"
              size="sm"
              className="h-8 flex flex-col items-center justify-center p-1 hover:bg-emerald-500/10 hover:text-emerald-600 group/icon"
              onClick={(e) => handleSectionClick(e, 'financial')}
              title="الحالة المالية"
            >
              <DollarSign className="w-3.5 h-3.5 group-hover/icon:scale-110 transition-transform" />
            </Button>
          </div>
          
          {/* Additional Icons Row */}
          <div className="grid grid-cols-6 gap-1 mt-2">
            <Button
              variant="ghost"
              size="sm"
              className="h-8 flex flex-col items-center justify-center p-1 hover:bg-red-500/10 hover:text-red-600 group/icon"
              onClick={(e) => handleIconClick(e, 'medication')}
              title="الأدوية"
            >
              <Pill className="w-3.5 h-3.5 group-hover/icon:scale-110 transition-transform" />
            </Button>

            <Button
              variant="ghost"
              size="sm"
              className="h-8 flex flex-col items-center justify-center p-1 hover:bg-indigo-500/10 hover:text-indigo-600 group/icon"
              onClick={(e) => handleIconClick(e, 'photo')}
              title="معرض الصور"
            >
              <Camera className="w-3.5 h-3.5 group-hover/icon:scale-110 transition-transform" />
            </Button>

            <Button
              variant="ghost"
              size="sm"
              className="h-8 flex flex-col items-center justify-center p-1 hover:bg-cyan-500/10 hover:text-cyan-600 group/icon"
              onClick={(e) => handleIconClick(e, 'appointment')}
              title="حجز موعد"
            >
              <Calendar className="w-3.5 h-3.5 group-hover/icon:scale-110 transition-transform" />
            </Button>

            <Button
              variant="ghost"
              size="sm"
              className="h-8 flex flex-col items-center justify-center p-1 hover:bg-teal-500/10 hover:text-teal-600 group/icon"
              onClick={(e) => handleIconClick(e, 'communication')}
              title="التواصل"
            >
              <Phone className="w-3.5 h-3.5 group-hover/icon:scale-110 transition-transform" />
            </Button>

            <Button
              variant="ghost"
              size="sm"
              className="h-8 flex flex-col items-center justify-center p-1 hover:bg-rose-500/10 hover:text-rose-600 group/icon"
              onClick={(e) => handleIconClick(e, 'vitals')}
              title="العلامات الحيوية"
            >
              <Activity className="w-3.5 h-3.5 group-hover/icon:scale-110 transition-transform" />
            </Button>

            <Button
              variant="ghost"
              size="sm"
              className="h-8 flex flex-col items-center justify-center p-1 hover:bg-amber-500/10 hover:text-amber-600 group/icon"
              onClick={(e) => handleCardClick(e)}
              title="عرض الملف"
            >
              <Eye className="w-3.5 h-3.5 group-hover/icon:scale-110 transition-transform" />
            </Button>
          </div>
        </div>

        {/* Contact Action */}
        {patient.phone && (
          <div className="pt-2">
            <Button
              variant="outline"
              size="sm"
              className="w-full justify-center gap-2 h-8 hover:bg-green-50 hover:border-green-200 hover:text-green-700 dark:hover:bg-green-900/20 dark:hover:border-green-800 dark:hover:text-green-300 transition-all duration-200"
              onClick={handleWhatsApp}
            >
              <MessageCircle className="w-3.5 h-3.5" />
              <span className="text-xs">واتساب</span>
            </Button>
          </div>
        )}
      </CardContent>
=======
    >
      <Link to={`/patients/${patient.id}`} className="block h-full">
        <CardContent className="p-4 h-full flex flex-col justify-between">
          {/* Header Section */}
          <div className="space-y-3">
            {/* Patient Name & Quick Actions */}
            <div className="flex items-center justify-between">
              <h3 className="text-base font-semibold text-foreground group-hover:text-primary transition-colors line-clamp-1">
                {patient.full_name}
              </h3>
              <div className={`flex space-x-1 space-x-reverse transition-opacity ${isHovered ? 'opacity-100' : 'opacity-70'}`}>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 w-7 p-0 bg-muted/40 hover:bg-primary/10 hover:text-primary transition-colors"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                  }}
                  asChild
                >
                  <Link to={`/patients/${patient.id}`}>
                    <Eye className="w-3.5 h-3.5" />
                  </Link>
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 w-7 p-0 bg-muted/40 hover:bg-green-500/10 hover:text-green-600 transition-colors"
                  onClick={handleAddTreatmentClick}
                >
                  <Activity className="w-3.5 h-3.5" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 w-7 p-0 bg-muted/40 hover:bg-blue-500/10 hover:text-blue-600 transition-colors"
                  onClick={handleEditPatientClick}
                >
                  <Edit className="w-3.5 h-3.5" />
                </Button>
              </div>
            </div>

            {/* Doctor Assignment */}
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">الطبيب المسؤول</p>
              <p className="text-sm font-medium text-foreground line-clamp-1">
                {patient.assigned_doctor?.full_name || 'غير محدد'}
              </p>
            </div>

            {/* Status Information */}
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">الحالة المالية</p>
                {getFinancialStatusBadge(patient.financial_status)}
              </div>
              
              {patient.medical_condition && (
                <div className="text-right">
                  {getConditionBadge(patient.medical_condition)}
                </div>
              )}
            </div>
          </div>

          {/* Quick Access Icons - Optimized */}
          <div className="space-y-2 pt-3 border-t border-border/40">
            <p className="text-xs text-muted-foreground font-medium">أقسام سريعة</p>
            <div className="grid grid-cols-6 gap-1">
              <Button
                variant="ghost"
                size="sm"
                className="h-8 flex flex-col items-center justify-center p-1 hover:bg-primary/10 hover:text-primary group/icon"
                onClick={(e) => handleSectionClick(e, 'dental')}
                title="مخطط الأسنان"
              >
                <Smile className="w-3.5 h-3.5 group-hover/icon:scale-110 transition-transform" />
              </Button>
              
              <Button
                variant="ghost"
                size="sm"
                className="h-8 flex flex-col items-center justify-center p-1 hover:bg-green-500/10 hover:text-green-600 group/icon"
                onClick={(e) => handleSectionClick(e, 'overview')}
                title="نظرة عامة"
              >
                <Heart className="w-3.5 h-3.5 group-hover/icon:scale-110 transition-transform" />
              </Button>

              <Button
                variant="ghost"
                size="sm"
                className="h-8 flex flex-col items-center justify-center p-1 hover:bg-blue-500/10 hover:text-blue-600 group/icon"
                onClick={(e) => handleSectionClick(e, 'prescriptions')}
                title="الوصفات"
              >
                <Pill className="w-3.5 h-3.5 group-hover/icon:scale-110 transition-transform" />
              </Button>

              <Button
                variant="ghost"
                size="sm"
                className="h-8 flex flex-col items-center justify-center p-1 hover:bg-purple-500/10 hover:text-purple-600 group/icon"
                onClick={(e) => handleSectionClick(e, 'images')}
                title="الأشعة"
              >
                <Camera className="w-3.5 h-3.5 group-hover/icon:scale-110 transition-transform" />
              </Button>

              <Button
                variant="ghost"
                size="sm"
                className="h-8 flex flex-col items-center justify-center p-1 hover:bg-orange-500/10 hover:text-orange-600 group/icon"
                onClick={(e) => handleSectionClick(e, 'appointments')}
                title="المواعيد"
              >
                <Calendar className="w-3.5 h-3.5 group-hover/icon:scale-110 transition-transform" />
              </Button>

              <Button
                variant="ghost"
                size="sm"
                className="h-8 flex flex-col items-center justify-center p-1 hover:bg-emerald-500/10 hover:text-emerald-600 group/icon"
                onClick={(e) => handleSectionClick(e, 'financial')}
                title="الحالة المالية"
              >
                <DollarSign className="w-3.5 h-3.5 group-hover/icon:scale-110 transition-transform" />
              </Button>
            </div>
          </div>

          {/* Contact Action */}
          {patient.phone && (
            <div className="pt-2">
              <Button
                variant="outline"
                size="sm"
                className="w-full justify-center gap-2 h-8 hover:bg-green-50 hover:border-green-200 hover:text-green-700 dark:hover:bg-green-900/20 dark:hover:border-green-800 dark:hover:text-green-300 transition-all duration-200"
                onClick={handleWhatsApp}
              >
                <MessageCircle className="w-3.5 h-3.5" />
                <span className="text-xs">واتساب</span>
              </Button>
            </div>
          )}
        </CardContent>
      </Link>
>>>>>>> cbd682d36e862741c55b9e7b5d144f8de65c694a

      {/* Medical Sections Dialog */}
      <PatientMedicalSectionsDialog
        open={medicalDialogOpen}
        onOpenChange={setMedicalDialogOpen}
        patientId={patient.id}
        patientName={patient.full_name}
        initialSection={selectedSection}
      />
<<<<<<< HEAD

      {/* Edit Patient Dialog */}
      <EditPatientDialog
        patient={patient}
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        onPatientUpdated={handlePatientUpdated}
      />

      {/* Financial Status Dialog */}
      <FinancialStatusDialog
        patient={patient}
        isOpen={financialDialogOpen}
        onClose={() => {
          setFinancialDialogOpen(false);
          if (onPatientUpdated) {
            onPatientUpdated();
          }
        }}
      />

      {/* Delete Patient Dialog */}
      <DeletePatientDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        patientName={patient.full_name}
        onConfirmDelete={handleConfirmDelete}
        isLoading={deletePatientMutation.isPending}
      />

      {/* Medication Dialog */}
      <MedicationDialog
        open={medicationDialogOpen}
        onOpenChange={setMedicationDialogOpen}
        patient={patient}
      />

      {/* Photo Gallery Dialog */}
      <PhotoGalleryDialog
        open={photoDialogOpen}
        onOpenChange={setPhotoDialogOpen}
        patient={patient}
      />

      {/* Appointment Dialog */}
      <AppointmentBookingDialog
        open={appointmentDialogOpen}
        onOpenChange={setAppointmentDialogOpen}
        patient={patient}
      />

      {/* Communication Dialog */}
      <CommunicationDialog
        open={communicationDialogOpen}
        onOpenChange={setCommunicationDialogOpen}
        patient={patient}
      />

      {/* Vitals Dialog */}
      <VitalsDialog
        open={vitalsDialogOpen}
        onOpenChange={setVitalsDialogOpen}
        patient={patient}
      />
=======
>>>>>>> cbd682d36e862741c55b9e7b5d144f8de65c694a
    </Card>
  );
});

OptimizedPatientCard.displayName = 'OptimizedPatientCard';

export default OptimizedPatientCard;