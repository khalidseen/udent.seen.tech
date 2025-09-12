import React, { useState } from 'react';
import { Check, ChevronsUpDown, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useDoctors } from '@/hooks/useDoctors';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

interface DoctorSelectorProps {
  patientId: string;
  currentDoctorId?: string;
  currentDoctorName?: string;
  onDoctorChange?: (doctorId: string, doctorName: string) => void;
}

const DoctorSelector: React.FC<DoctorSelectorProps> = ({
  patientId,
  currentDoctorId,
  currentDoctorName,
  onDoctorChange
}) => {
  const [open, setOpen] = useState(false);
  const [selectedDoctorId, setSelectedDoctorId] = useState(currentDoctorId || '');
  
  const { doctors, loading } = useDoctors();

  const handleDoctorSelect = async (doctorId: string) => {
    const selectedDoctor = doctors.find(d => d.id === doctorId);
    if (!selectedDoctor) return;

    setSelectedDoctorId(doctorId);
    setOpen(false);

    try {
      const { error } = await supabase
        .from('patients')
        .update({
          assigned_doctor_id: doctorId,
          updated_at: new Date().toISOString()
        })
        .eq('id', patientId);

      if (error) throw error;

      toast.success(`تم تعيين ${selectedDoctor.full_name} كطبيب مسؤول`);
      onDoctorChange?.(doctorId, selectedDoctor.full_name);
    } catch (error) {
      console.error('خطأ في تحديث الطبيب المسؤول:', error);
      toast.error('فشل في تحديث الطبيب المسؤول');
    }
  };

  const selectedDoctor = doctors.find(d => d.id === selectedDoctorId);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between text-right"
          size="sm"
        >
          <div className="flex items-center gap-2">
            <User className="w-4 h-4" />
            <span className="truncate">
              {selectedDoctor ? selectedDoctor.full_name : currentDoctorName || "غير محدد"}
            </span>
          </div>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-full p-0">
        <Command>
          <CommandInput placeholder="البحث عن طبيب..." />
          <CommandEmpty>لا يوجد أطباء متاحين</CommandEmpty>
          <CommandGroup>
            {loading ? (
              <CommandItem disabled>جاري التحميل...</CommandItem>
            ) : (
              doctors.map((doctor) => (
                <CommandItem
                  key={doctor.id}
                  value={doctor.full_name}
                  onSelect={() => handleDoctorSelect(doctor.id)}
                >
                  <Check
                    className={`mr-2 h-4 w-4 ${
                      selectedDoctorId === doctor.id ? "opacity-100" : "opacity-0"
                    }`}
                  />
                  <div className="flex flex-col">
                    <span>{doctor.full_name}</span>
                    <span className="text-xs text-muted-foreground">
                      {doctor.specialization || 'طبيب عام'}
                    </span>
                  </div>
                </CommandItem>
              ))
            )}
          </CommandGroup>
        </Command>
      </PopoverContent>
    </Popover>
  );
};

export default DoctorSelector;
