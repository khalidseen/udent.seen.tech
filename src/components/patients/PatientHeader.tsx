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

export const PatientHeader: React.FC<PatientHeaderProps> = ({ patient, stats }) => {
  const getAge = (dateOfBirth: string) => {
    return new Date().getFullYear() - new Date(dateOfBirth).getFullYear();
  };

  const getGenderIcon = (gender: string) => {
    return gender === 'male' ? '👨‍⚕️' : gender === 'female' ? '👩‍⚕️' : '👤';
  };

  const getHealthStatus = (percentage: number) => {
    if (percentage >= 90) return { label: 'ممتاز', color: 'bg-green-500', textColor: 'text-green-700' };
    if (percentage >= 75) return { label: 'جيد', color: 'bg-blue-500', textColor: 'text-blue-700' };
    if (percentage >= 60) return { label: 'متوسط', color: 'bg-yellow-500', textColor: 'text-yellow-700' };
    return { label: 'يحتاج عناية', color: 'bg-red-500', textColor: 'text-red-700' };
  };

  const healthStatus = stats ? getHealthStatus(stats.healthPercentage) : null;

  return (
    <Card className="bg-gradient-to-r from-blue-50 via-white to-green-50 dark:from-blue-950 dark:via-background dark:to-green-950 border-2 border-primary/20 shadow-lg">
      <CardContent className="p-8">
        <div className="flex flex-col lg:flex-row items-start lg:items-center gap-6">
          {/* Avatar Section */}
          <div className="flex-shrink-0">
            <div className="relative">
              <Avatar className="h-24 w-24 border-4 border-primary/20 shadow-lg">
                <AvatarImage src="/placeholder-patient.png" alt={patient.full_name} />
                <AvatarFallback className="text-2xl bg-gradient-to-br from-primary to-primary-foreground text-white">
                  {patient.full_name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                </AvatarFallback>
              </Avatar>
              <div className="absolute -bottom-2 -right-2 text-2xl">
                {getGenderIcon(patient.gender || '')}
              </div>
            </div>
          </div>

          {/* Patient Info */}
          <div className="flex-1 space-y-4">
            <div className="space-y-2">
              <div className="flex items-center gap-3 flex-wrap">
                <h1 className="text-3xl font-bold text-primary">{patient.full_name}</h1>
                {patient.gender && (
                  <Badge variant="outline" className="text-sm">
                    {patient.gender === 'male' ? 'ذكر' : 'أنثى'}
                  </Badge>
                )}
                {patient.date_of_birth && (
                  <Badge variant="secondary" className="text-sm bg-primary/10 text-primary">
                    {getAge(patient.date_of_birth)} سنة
                  </Badge>
                )}
              </div>
              
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <IdCard className="h-4 w-4" />
                <span>مريض منذ {format(new Date(patient.created_at), 'MMMM yyyy', { locale: ar })}</span>
              </div>
            </div>

            {/* Contact Info Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {patient.phone && (
                <div className="flex items-center gap-2 text-sm bg-white/60 dark:bg-background/60 rounded-lg p-3 border">
                  <Phone className="h-4 w-4 text-green-600" />
                  <div>
                    <p className="text-xs text-muted-foreground">رقم الهاتف</p>
                    <p className="font-medium">{patient.phone}</p>
                  </div>
                </div>
              )}
              
              {patient.email && (
                <div className="flex items-center gap-2 text-sm bg-white/60 dark:bg-background/60 rounded-lg p-3 border">
                  <Mail className="h-4 w-4 text-blue-600" />
                  <div>
                    <p className="text-xs text-muted-foreground">البريد الإلكتروني</p>
                    <p className="font-medium">{patient.email}</p>
                  </div>
                </div>
              )}
              
              {patient.date_of_birth && (
                <div className="flex items-center gap-2 text-sm bg-white/60 dark:bg-background/60 rounded-lg p-3 border">
                  <Calendar className="h-4 w-4 text-purple-600" />
                  <div>
                    <p className="text-xs text-muted-foreground">تاريخ الميلاد</p>
                    <p className="font-medium">
                      {format(new Date(patient.date_of_birth), 'dd MMMM yyyy', { locale: ar })}
                    </p>
                  </div>
                </div>
              )}
            </div>

            {patient.address && (
              <div className="flex items-start gap-2 text-sm bg-white/60 dark:bg-background/60 rounded-lg p-3 border">
                <MapPin className="h-4 w-4 text-orange-600 mt-1" />
                <div>
                  <p className="text-xs text-muted-foreground">العنوان</p>
                  <p className="font-medium">{patient.address}</p>
                </div>
              </div>
            )}
          </div>

          {/* Stats Section */}
          {stats && (
            <div className="flex-shrink-0">
              <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="bg-white/80 dark:bg-background/80 rounded-xl p-4 border shadow-sm text-center">
                  <div className="text-2xl font-bold text-blue-600">{stats.totalAppointments}</div>
                  <div className="text-xs text-muted-foreground">إجمالي المواعيد</div>
                </div>
                
                <div className="bg-white/80 dark:bg-background/80 rounded-xl p-4 border shadow-sm text-center">
                  <div className="text-2xl font-bold text-green-600">{stats.completedTreatments}</div>
                  <div className="text-xs text-muted-foreground">العلاجات المكتملة</div>
                </div>
                
                {healthStatus && (
                  <div className="bg-white/80 dark:bg-background/80 rounded-xl p-4 border shadow-sm text-center lg:col-span-1 col-span-2">
                    <div className="flex items-center justify-center gap-2 mb-2">
                      <Heart className={`h-5 w-5 ${healthStatus.textColor}`} />
                      <span className="text-lg font-bold">{stats.healthPercentage}%</span>
                    </div>
                    <Badge variant="outline" className={`text-xs ${healthStatus.textColor} border-current`}>
                      {healthStatus.label}
                    </Badge>
                    <div className="text-xs text-muted-foreground mt-1">صحة الفم</div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Medical History Alert */}
        {patient.medical_history && (
          <div className="mt-6 p-4 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-lg">
            <div className="flex items-start gap-2">
              <Heart className="h-5 w-5 text-amber-600 mt-0.5" />
              <div>
                <h4 className="font-medium text-amber-800 dark:text-amber-200 mb-1">التاريخ المرضي</h4>
                <p className="text-sm text-amber-700 dark:text-amber-300">{patient.medical_history}</p>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};