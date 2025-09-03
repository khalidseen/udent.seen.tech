import React, { memo, useState, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
  Calendar
} from "lucide-react";
import { Link } from "react-router-dom";
import { Patient } from "@/hooks/usePatients";

interface OptimizedPatientCardProps {
  patient: Patient;
  onAddTreatment: (patientId: string, patientName: string) => void;
  onEditPatient: (patientId: string) => void;
}

const OptimizedPatientCard = memo(({ 
  patient, 
  onAddTreatment, 
  onEditPatient 
}: OptimizedPatientCardProps) => {
  const [isHovered, setIsHovered] = useState(false);

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
    
    if (patient.phone) {
      const cleanPhone = patient.phone.replace(/\D/g, '');
      const message = `مرحباً ${patient.full_name}، نود تذكيركم بموعدكم في العيادة`;
      const encodedMessage = encodeURIComponent(message);
      window.open(`https://wa.me/${cleanPhone}?text=${encodedMessage}`, '_blank');
    }
  }, [patient.phone, patient.full_name]);

  const handleAddTreatmentClick = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onAddTreatment(patient.id, patient.full_name);
  }, [patient.id, patient.full_name, onAddTreatment]);

  const handleEditPatientClick = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onEditPatient(patient.id);
  }, [patient.id, onEditPatient]);

  return (
    <Card 
      className={`
        h-full transition-all duration-200 border border-border/60 
        bg-card/90 backdrop-blur-sm cursor-pointer group
        ${isHovered ? 'shadow-lg scale-[1.02]' : 'shadow-sm hover:shadow-md'}
      `}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
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
            <div className="grid grid-cols-4 gap-1">
              <Button
                variant="ghost"
                size="sm"
                className="h-8 flex flex-col items-center justify-center p-1 hover:bg-primary/10 hover:text-primary group/icon"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                }}
                title="مخطط الأسنان"
              >
                <Smile className="w-3.5 h-3.5 group-hover/icon:scale-110 transition-transform" />
              </Button>
              
              <Button
                variant="ghost"
                size="sm"
                className="h-8 flex flex-col items-center justify-center p-1 hover:bg-green-500/10 hover:text-green-600 group/icon"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                }}
                title="الصحة العامة"
              >
                <Heart className="w-3.5 h-3.5 group-hover/icon:scale-110 transition-transform" />
              </Button>

              <Button
                variant="ghost"
                size="sm"
                className="h-8 flex flex-col items-center justify-center p-1 hover:bg-blue-500/10 hover:text-blue-600 group/icon"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                }}
                title="الوصفات"
              >
                <Pill className="w-3.5 h-3.5 group-hover/icon:scale-110 transition-transform" />
              </Button>

              <Button
                variant="ghost"
                size="sm"
                className="h-8 flex flex-col items-center justify-center p-1 hover:bg-purple-500/10 hover:text-purple-600 group/icon"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                }}
                title="الأشعة"
              >
                <Camera className="w-3.5 h-3.5 group-hover/icon:scale-110 transition-transform" />
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
    </Card>
  );
});

OptimizedPatientCard.displayName = 'OptimizedPatientCard';

export default OptimizedPatientCard;