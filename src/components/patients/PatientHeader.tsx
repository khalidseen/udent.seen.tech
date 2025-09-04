import React from 'react';
import { User, Calendar, Phone, Mail, MapPin, Heart, IdCard, Edit, Plus, Stethoscope } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';
interface PatientHeaderProps {
  patient: {
    id: string;
    full_name: string;
    phone?: string;
    email?: string;
    date_of_birth?: string;
    gender?: string;
    address?: string;
    medical_history?: string;
    created_at: string;
  };
  stats?: {
    totalAppointments: number;
    completedTreatments: number;
    healthPercentage: number;
  };
  onEditPatient?: () => void;
  onAddTreatment?: () => void;
}
export const PatientHeader: React.FC<PatientHeaderProps> = ({
  patient,
  stats,
  onEditPatient,
  onAddTreatment
}) => {
  const getAge = (dateOfBirth: string) => {
    return new Date().getFullYear() - new Date(dateOfBirth).getFullYear();
  };
  const getGenderIcon = (gender: string) => {
    return gender === 'male' ? '👨‍⚕️' : gender === 'female' ? '👩‍⚕️' : '👤';
  };
  const getHealthStatus = (percentage: number) => {
    if (percentage >= 90) return {
      label: 'ممتاز',
      color: 'bg-green-500',
      textColor: 'text-green-700'
    };
    if (percentage >= 75) return {
      label: 'جيد',
      color: 'bg-blue-500',
      textColor: 'text-blue-700'
    };
    if (percentage >= 60) return {
      label: 'متوسط',
      color: 'bg-yellow-500',
      textColor: 'text-yellow-700'
    };
    return {
      label: 'يحتاج عناية',
      color: 'bg-red-500',
      textColor: 'text-red-700'
    };
  };
  const healthStatus = stats ? getHealthStatus(stats.healthPercentage) : null;
  return <Card className="bg-gradient-to-r from-background to-secondary/5 border border-border/50 shadow-sm">
      <CardContent className="p-2">
        <div className="flex items-center gap-3 min-h-[60px]">
          {/* Avatar Section - Smaller */}
          <div className="flex-shrink-0">
            <Avatar className="h-12 w-12 border border-border">
              <AvatarImage src="/placeholder-patient.png" alt={patient.full_name} />
              <AvatarFallback className="text-sm bg-primary text-primary-foreground">
                {patient.full_name.split(' ').map(n => n[0]).join('').slice(0, 2)}
              </AvatarFallback>
            </Avatar>
          </div>

          {/* Patient Info - Single Row */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h1 className="text-lg font-semibold text-foreground truncate" dir="rtl">{patient.full_name}</h1>
              {patient.gender && <Badge variant="secondary" className="text-xs px-1.5 py-0.5">
                  {patient.gender === 'male' ? 'ذكر' : 'أنثى'}
                </Badge>}
              {patient.date_of_birth && <Badge variant="outline" className="text-xs px-1.5 py-0.5">
                  {getAge(patient.date_of_birth)} سنة
                </Badge>}
            </div>
            
            {/* Contact Info - Single Compact Row */}
            <div className="flex items-center gap-3 text-xs text-muted-foreground" dir="rtl">
              {patient.phone && <div className="flex items-center gap-1">
                  <Phone className="h-3 w-3" />
                  <span>{patient.phone}</span>
                </div>}
              
              {patient.email && <div className="flex items-center gap-1">
                  <Mail className="h-3 w-3" />
                  <span className="truncate max-w-[120px]">{patient.email}</span>
                </div>}
              
              {patient.date_of_birth && <div className="flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  <span>{format(new Date(patient.date_of_birth), 'dd/MM/yyyy')}</span>
                </div>}

              <div className="flex items-center gap-1">
                <IdCard className="h-3 w-3" />
                <span>منذ {format(new Date(patient.created_at), 'MM/yyyy', {
                  locale: ar
                })}</span>
              </div>

              {/* Action Icons */}
              <div className="flex items-center gap-2">
                {onEditPatient && <Button variant="ghost" className="h-7 px-2 py-1 text-xs hover:bg-primary/10" onClick={onEditPatient}>
                    <Edit className="h-3 w-3 ml-1" />
                    تعديل الملف
                  </Button>}
                {onAddTreatment && <Button variant="ghost" className="h-7 px-2 py-1 text-xs hover:bg-secondary/10" onClick={onAddTreatment}>
                    <Plus className="h-3 w-3 ml-1" />
                    إضافة علاج
                  </Button>}
              </div>
            </div>
          </div>

          {/* Stats - Icon Only */}
          {stats && <div className="flex-shrink-0 flex items-center gap-2">
              <div className="flex items-center justify-center px-2 py-1">
                <Calendar className="h-5 w-5 text-primary mr-1" />
                <span className="text-sm font-semibold text-primary">{stats.totalAppointments}</span>
              </div>
              
              <div className="flex items-center justify-center px-2 py-1">
                <Stethoscope className="h-4 w-4 text-secondary mr-1" />
                <span className="text-sm font-semibold text-secondary">{stats.completedTreatments}</span>
              </div>
            </div>}
        </div>

        {/* Medical History - Ultra Compact */}
        {patient.medical_history && <div className="mt-2 p-1.5 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded">
            <div className="flex items-center gap-1">
              <Heart className="h-3 w-3 text-amber-600 flex-shrink-0" />
              <span className="text-xs text-amber-800 dark:text-amber-200" dir="rtl">
                <span className="font-medium">التاريخ المرضي:</span> {patient.medical_history}
              </span>
            </div>
          </div>}
      </CardContent>
    </Card>;
};