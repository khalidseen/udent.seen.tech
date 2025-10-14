import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Image as ImageIcon, Plus } from "lucide-react";
import { format } from "date-fns";
import { ar } from "date-fns/locale";

interface PatientImagesProps {
  patientId: string;
}

export function PatientImages({ patientId }: PatientImagesProps) {
  const { data: images, isLoading } = useQuery({
    queryKey: ['patient-images', patientId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('medical_images')
        .select('*')
        .eq('patient_id', patientId)
        .order('image_date', { ascending: false });
      
      if (error) throw error;
      return data;
    },
  });

  if (isLoading) {
    return <div className="text-center py-8">جاري التحميل...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">الصور والأشعة</h3>
        <Button size="sm">
          <Plus className="w-4 h-4 mr-2" />
          إضافة صورة
        </Button>
      </div>

      {!images || images.length === 0 ? (
        <Card>
          <CardContent className="pt-6">
            <p className="text-center text-muted-foreground">لا توجد صور مسجلة</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {images.map((image) => (
            <Card key={image.id} className="overflow-hidden">
              <div className="aspect-square bg-muted flex items-center justify-center">
                <ImageIcon className="h-12 w-12 text-muted-foreground" />
              </div>
              <CardContent className="pt-3">
                <p className="font-medium text-sm truncate">{image.title}</p>
                <p className="text-xs text-muted-foreground">
                  {format(new Date(image.image_date), 'PPP', { locale: ar })}
                </p>
                {image.tooth_number && (
                  <p className="text-xs text-muted-foreground">
                    السن: {image.tooth_number}
                  </p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
