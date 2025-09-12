import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { Building2, ChevronDown, Check } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface AccessibleClinic {
  clinic_id: string;
  clinic_name: string;
  is_current: boolean;
  access_type: string;
}

export function ClinicSwitcher() {
  const [clinics, setClinics] = useState<AccessibleClinic[]>([]);
  const [loading, setLoading] = useState(false);
  const [currentClinic, setCurrentClinic] = useState<AccessibleClinic | null>(null);
  const { toast } = useToast();

  const fetchAccessibleClinics = async () => {
    try {
      const { data, error } = await supabase.rpc('get_user_accessible_clinics');
      
      if (error) throw error;
      
      setClinics(data || []);
      setCurrentClinic(data?.find((c: AccessibleClinic) => c.is_current) || null);
    } catch (error) {
      console.error('Error fetching accessible clinics:', error);
    }
  };

  const switchClinic = async (clinicId: string) => {
    try {
      setLoading(true);
      
      const { data, error } = await supabase.rpc('switch_user_clinic', {
        new_clinic_id: clinicId
      });
      
      if (error) throw error;
      
      if (data) {
        toast({
          title: "تم تغيير العيادة",
          description: "تم تغيير العيادة الحالية بنجاح",
        });
        
        // Refresh the page to update all data
        window.location.reload();
      } else {
        toast({
          title: "خطأ",
          description: "لا تملك صلاحية للوصول لهذه العيادة",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error switching clinic:', error);
      toast({
        title: "خطأ",
        description: "فشل في تغيير العيادة",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAccessibleClinics();
  }, []);

  if (clinics.length <= 1) return null;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" disabled={loading}>
          <Building2 className="h-4 w-4 ml-2" />
          {currentClinic?.clinic_name || 'اختر العيادة'}
          <ChevronDown className="h-4 w-4 mr-2" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-64">
        {clinics.map((clinic) => (
          <DropdownMenuItem
            key={clinic.clinic_id}
            onClick={() => !clinic.is_current && switchClinic(clinic.clinic_id)}
            className="flex items-center justify-between cursor-pointer"
          >
            <div className="flex flex-col">
              <span className="font-medium">{clinic.clinic_name}</span>
              <div className="flex items-center gap-2 mt-1">
                <Badge 
                  variant={clinic.access_type === 'super_admin' ? 'default' : 'secondary'}
                  className="text-xs"
                >
                  {clinic.access_type === 'super_admin' ? 'مدير عام' : 
                   clinic.access_type === 'primary' ? 'العيادة الأساسية' : clinic.access_type}
                </Badge>
                {clinic.is_current && <Check className="h-4 w-4 text-primary" />}
              </div>
            </div>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}