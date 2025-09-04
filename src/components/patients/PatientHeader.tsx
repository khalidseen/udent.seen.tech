import React from 'react';
import { User, Calendar, Phone, Mail, MapPin, Heart, IdCard } from 'lucide-react';
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
}

export const PatientHeader: React.FC<PatientHeaderProps> = ({
  patient,
  stats
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

  return (
    <Card className="bg-gradient-to-r from-blue-50 via-white to-green-50 dark:from-blue-950 dark:via-background dark:to-green-950 border-2 border-primary/20 shadow-lg">
      <CardContent className="p-4">
        <div className="flex items-center gap-4 min-h-[80px]">
          {/* Avatar Section */}
          <div className="flex-shrink-0">
            <div className="relative">
              <Avatar className="h-16 w-16 border-2 border-primary/20 shadow-sm">
                <AvatarImage src="/placeholder-patient.png" alt={patient.full_name} />
                <AvatarFallback className="text-lg bg-gradient-to-br from-primary to-primary-foreground text-white">
                  {patient.full_name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                </AvatarFallback>
              </Avatar>
              <div className="absolute -bottom-1 -right-1 text-lg">
                {getGenderIcon(patient.gender || '')}
              </div>
            </div>
          </div>

          {/* Patient Main Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h1 className="text-xl font-bold text-primary truncate">{patient.full_name}</h1>
              {patient.gender && (
                <Badge variant="outline" className="text-xs px-2 py-0.5">
                  {patient.gender === 'male' ? 'ذكر' : 'أنثى'}
                </Badge>
              )}
              {patient.date_of_birth && (
                <Badge variant="secondary" className="text-xs px-2 py-0.5 bg-primary/10 text-primary">
                  {getAge(patient.date_of_birth)} سنة
                </Badge>
              )}
            </div>
            
            <div className="flex items-center gap-1 text-xs text-muted-foreground mb-2">
              <IdCard className="h-3 w-3" />
              <span>مريض منذ {format(new Date(patient.created_at), 'MMMM yyyy', { locale: ar })}</span>
            </div>

            {/* Contact Info - Horizontal Layout */}
            <div className="flex items-center gap-4 flex-wrap text-xs">
              {patient.phone && (
                <div className="flex items-center gap-1">
                  <Phone className="h-3 w-3 text-green-600" />
                  <span>{patient.phone}</span>
                </div>
              )}
              
              {patient.email && (
                <div className="flex items-center gap-1">
                  <Mail className="h-3 w-3 text-blue-600" />
                  <span className="truncate max-w-[150px]">{patient.email}</span>
                </div>
              )}
              
              {patient.date_of_birth && (
                <div className="flex items-center gap-1">
                  <Calendar className="h-3 w-3 text-purple-600" />
                  <span>{format(new Date(patient.date_of_birth), 'dd/MM/yyyy')}</span>
                </div>
              )}

              {patient.address && (
                <div className="flex items-center gap-1">
                  <MapPin className="h-3 w-3 text-orange-600" />
                  <span className="truncate max-w-[200px]">{patient.address}</span>
                </div>
              )}
            </div>
          </div>

          {/* Stats Section - Horizontal */}
          {stats && (
            <div className="flex-shrink-0 flex items-center gap-3">
              <div className="text-center bg-white/60 dark:bg-background/60 rounded-lg px-3 py-2 border">
                <div className="text-lg font-bold text-blue-600">{stats.totalAppointments}</div>
                <div className="text-xs text-muted-foreground">المواعيد</div>
              </div>
              
              <div className="text-center bg-white/60 dark:bg-background/60 rounded-lg px-3 py-2 border">
                <div className="text-lg font-bold text-green-600">{stats.completedTreatments}</div>
                <div className="text-xs text-muted-foreground">العلاجات</div>
              </div>
              
              {healthStatus && (
                <div className="text-center bg-white/60 dark:bg-background/60 rounded-lg px-3 py-2 border">
                  <div className="flex items-center justify-center gap-1 mb-1">
                    <Heart className={`h-3 w-3 ${healthStatus.textColor}`} />
                    <span className="text-lg font-bold">{stats.healthPercentage}%</span>
                  </div>
                  <div className="text-xs text-muted-foreground">صحة الفم</div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Medical History Alert - Compact */}
        {patient.medical_history && (
          <div className="mt-3 p-2 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-lg">
            <div className="flex items-center gap-2">
              <Heart className="h-4 w-4 text-amber-600" />
              <div>
                <span className="text-xs font-medium text-amber-800 dark:text-amber-200 ml-1">التاريخ المرضي:</span>
                <span className="text-xs text-amber-700 dark:text-amber-300">{patient.medical_history}</span>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};