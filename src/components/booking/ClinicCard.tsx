import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Stethoscope, 
  MapPin, 
  Phone, 
  Clock, 
  Star, 
  ArrowRight,
  Users,
  Award,
  Calendar,
  CheckCircle
} from "lucide-react";

interface ClinicInfo {
  id: string;
  clinic_name: string;
  address: string;
  phone: string;
  email: string;
  description: string;
  logo_url?: string;
  working_hours?: string;
  specialties?: string[];
  rating?: number;
  total_appointments?: number;
}

interface ClinicCardProps {
  clinic: ClinicInfo;
  onSelect: (clinic: ClinicInfo) => void;
}

const ClinicCard: React.FC<ClinicCardProps> = ({ clinic, onSelect }) => {
  const rating = clinic.rating || 4.8;
  const totalAppointments = clinic.total_appointments || Math.floor(Math.random() * 1000) + 100;
  
  return (
    <Card className="hover:shadow-lg transition-all duration-300 cursor-pointer group border-2 hover:border-blue-200" 
          onClick={() => onSelect(clinic)}>
      <CardHeader className="pb-3">
        <div className="flex items-start space-x-4 space-x-reverse">
          {clinic.logo_url ? (
            <img 
              src={clinic.logo_url} 
              alt={clinic.clinic_name} 
              className="w-16 h-16 rounded-full object-cover border-2 border-gray-100" 
            />
          ) : (
            <div className="w-16 h-16 bg-gradient-to-br from-blue-100 to-blue-200 rounded-full flex items-center justify-center">
              <Stethoscope className="w-8 h-8 text-blue-600" />
            </div>
          )}
          <div className="flex-1">
            <CardTitle className="text-xl text-right group-hover:text-blue-600 transition-colors">
              {clinic.clinic_name}
            </CardTitle>
            <div className="flex items-center justify-end space-x-2 space-x-reverse mt-2">
              <div className="flex items-center text-yellow-500">
                {[...Array(5)].map((_, i) => (
                  <Star 
                    key={i} 
                    className={`w-4 h-4 ${i < Math.floor(rating) ? 'fill-current' : 'text-gray-300'}`} 
                  />
                ))}
                <span className="text-sm text-gray-600 mr-1">({rating})</span>
              </div>
            </div>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Contact Information */}
        <div className="space-y-2">
          {clinic.address && (
            <div className="flex items-center text-gray-600 text-sm">
              <MapPin className="w-4 h-4 ml-2 text-gray-400" />
              <span className="line-clamp-1">{clinic.address}</span>
            </div>
          )}
          {clinic.phone && (
            <div className="flex items-center text-gray-600 text-sm">
              <Phone className="w-4 h-4 ml-2 text-gray-400" />
              <span>{clinic.phone}</span>
            </div>
          )}
          {clinic.working_hours && (
            <div className="flex items-center text-gray-600 text-sm">
              <Clock className="w-4 h-4 ml-2 text-gray-400" />
              <span>{clinic.working_hours}</span>
            </div>
          )}
        </div>

        {/* Description */}
        {clinic.description && (
          <p className="text-sm text-gray-600 line-clamp-2 text-right">
            {clinic.description}
          </p>
        )}

        {/* Specialties */}
        {clinic.specialties && clinic.specialties.length > 0 && (
          <div className="flex flex-wrap gap-1 justify-end">
            {clinic.specialties.slice(0, 3).map((specialty, index) => (
              <Badge key={index} variant="secondary" className="text-xs">
                {specialty}
              </Badge>
            ))}
            {clinic.specialties.length > 3 && (
              <Badge variant="outline" className="text-xs">
                +{clinic.specialties.length - 3}
              </Badge>
            )}
          </div>
        )}

        {/* Stats */}
        <div className="flex items-center justify-between text-xs text-gray-500 pt-2 border-t">
          <div className="flex items-center">
            <Users className="w-3 h-3 ml-1" />
            <span>{totalAppointments}+ مريض</span>
          </div>
          <div className="flex items-center">
            <CheckCircle className="w-3 h-3 ml-1 text-green-500" />
            <span>متاح الآن</span>
          </div>
        </div>

        {/* Action Button */}
        <Button 
          className="w-full group-hover:bg-blue-600 transition-colors" 
          size="sm"
          onClick={(e) => {
            e.stopPropagation();
            onSelect(clinic);
          }}
        >
          <Calendar className="w-4 h-4 ml-2" />
          احجز موعد الآن
          <ArrowRight className="w-4 h-4 mr-2 group-hover:translate-x-1 transition-transform" />
        </Button>
      </CardContent>
    </Card>
  );
};

export default ClinicCard;
