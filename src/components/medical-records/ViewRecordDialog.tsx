import React from "react";
import { useQuery } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";

interface MedicalRecord {
  id: string;
  patient_id: string;
  record_type: string;
  title: string;
  description?: string;
  treatment_date: string;
  diagnosis?: string;
  treatment_plan?: string;
  notes?: string;
  patients: {
    full_name: string;
  } | null;
}

interface ViewRecordDialogProps {
  record: MedicalRecord;
  isOpen: boolean;
  onClose: () => void;
}

export function ViewRecordDialog({ record, isOpen, onClose }: ViewRecordDialogProps) {
  const { data: images } = useQuery({
    queryKey: ['medical-images', record.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('medical_images')
        .select('*')
        .eq('record_id', record.id)
        .order('created_at');
      
      if (error) throw error;
      return data;
    },
    enabled: isOpen && !!record.id
  });

  const getRecordTypeText = (type: string) => {
    switch (type) {
      case 'consultation': return 'استشارة';
      case 'treatment': return 'علاج';
      case 'surgery': return 'جراحة';
      case 'followup': return 'متابعة';
      case 'xray': return 'أشعة';
      default: return type;
    }
  };

  const getRecordTypeColor = (type: string) => {
    switch (type) {
      case 'consultation': return 'bg-blue-100 text-blue-800';
      case 'treatment': return 'bg-green-100 text-green-800';
      case 'surgery': return 'bg-red-100 text-red-800';
      case 'followup': return 'bg-yellow-100 text-yellow-800';
      case 'xray': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getImageUrl = async (path: string) => {
    const { data } = await supabase.storage
      .from('medical-images')
      .createSignedUrl(path, 3600); // 1 hour expiry
    return data?.signedUrl;
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>عرض السجل الطبي - {record.title}</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Record Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>معلومات السجل</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">العنوان:</span>
                  <span className="font-medium">{record.title}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">النوع:</span>
                  <Badge className={getRecordTypeColor(record.record_type)}>
                    {getRecordTypeText(record.record_type)}
                  </Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">تاريخ العلاج:</span>
                  <span>{format(new Date(record.treatment_date), 'yyyy/MM/dd')}</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>معلومات المريض</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">اسم المريض:</span>
                  <span className="font-medium">{record.patients?.full_name}</span>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Description */}
          {record.description && (
            <Card>
              <CardHeader>
                <CardTitle>الوصف</CardTitle>
              </CardHeader>
              <CardContent>
                <p>{record.description}</p>
              </CardContent>
            </Card>
          )}

          {/* Diagnosis */}
          {record.diagnosis && (
            <Card>
              <CardHeader>
                <CardTitle>التشخيص</CardTitle>
              </CardHeader>
              <CardContent>
                <p>{record.diagnosis}</p>
              </CardContent>
            </Card>
          )}

          {/* Treatment Plan */}
          {record.treatment_plan && (
            <Card>
              <CardHeader>
                <CardTitle>خطة العلاج</CardTitle>
              </CardHeader>
              <CardContent>
                <p>{record.treatment_plan}</p>
              </CardContent>
            </Card>
          )}

          {/* Medical Images */}
          {images && images.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>الصور الطبية ({images.length})</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {images.map((image) => (
                    <div key={image.id} className="border rounded-lg p-4">
                      <div className="space-y-2">
                        <h4 className="font-medium">{image.title}</h4>
                        <p className="text-sm text-muted-foreground">{image.description}</p>
                        <div className="flex gap-2">
                          <Badge variant="outline">{image.image_type}</Badge>
                          {image.is_before_treatment && (
                            <Badge variant="secondary">قبل العلاج</Badge>
                          )}
                          {image.is_after_treatment && (
                            <Badge variant="secondary">بعد العلاج</Badge>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {format(new Date(image.image_date), 'yyyy/MM/dd')}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Notes */}
          {record.notes && (
            <Card>
              <CardHeader>
                <CardTitle>ملاحظات</CardTitle>
              </CardHeader>
              <CardContent>
                <p>{record.notes}</p>
              </CardContent>
            </Card>
          )}
        </div>

        <div className="flex justify-end">
          <Button variant="outline" onClick={onClose}>
            إغلاق
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}