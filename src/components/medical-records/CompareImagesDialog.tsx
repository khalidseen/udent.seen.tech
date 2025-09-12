import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";

interface MedicalRecord {
  id: string;
  title: string;
  medical_images?: {
    id: string;
    title: string;
    image_type: string;
    is_before_treatment: boolean;
    is_after_treatment: boolean;
  }[];
}

interface CompareImagesDialogProps {
  record: MedicalRecord;
  isOpen: boolean;
  onClose: () => void;
}

export function CompareImagesDialog({ record, isOpen, onClose }: CompareImagesDialogProps) {
  const [selectedImage1, setSelectedImage1] = useState("");
  const [selectedImage2, setSelectedImage2] = useState("");

  const { data: images } = useQuery({
    queryKey: ['medical-images-detail', record.id],
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

  const { data: image1Url } = useQuery({
    queryKey: ['image-url', selectedImage1],
    queryFn: async () => {
      if (!selectedImage1) return null;
      const image = images?.find(img => img.id === selectedImage1);
      if (!image) return null;
      
      const { data } = await supabase.storage
        .from('medical-images')
        .createSignedUrl(image.file_path, 3600);
      return data?.signedUrl;
    },
    enabled: !!selectedImage1 && !!images
  });

  const { data: image2Url } = useQuery({
    queryKey: ['image-url', selectedImage2],
    queryFn: async () => {
      if (!selectedImage2) return null;
      const image = images?.find(img => img.id === selectedImage2);
      if (!image) return null;
      
      const { data } = await supabase.storage
        .from('medical-images')
        .createSignedUrl(image.file_path, 3600);
      return data?.signedUrl;
    },
    enabled: !!selectedImage2 && !!images
  });

  const getImageInfo = (imageId: string) => {
    return images?.find(img => img.id === imageId);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>مقارنة الصور الطبية - {record.title}</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Image Selection */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium">الصورة الأولى</label>
              <Select value={selectedImage1} onValueChange={setSelectedImage1}>
                <SelectTrigger>
                  <SelectValue placeholder="اختر الصورة الأولى" />
                </SelectTrigger>
                <SelectContent>
                  {images?.map((image) => (
                    <SelectItem key={image.id} value={image.id}>
                      {image.title} - {format(new Date(image.image_date), 'yyyy/MM/dd')}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium">الصورة الثانية</label>
              <Select value={selectedImage2} onValueChange={setSelectedImage2}>
                <SelectTrigger>
                  <SelectValue placeholder="اختر الصورة الثانية" />
                </SelectTrigger>
                <SelectContent>
                  {images?.map((image) => (
                    <SelectItem key={image.id} value={image.id}>
                      {image.title} - {format(new Date(image.image_date), 'yyyy/MM/dd')}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Image Comparison */}
          {(selectedImage1 || selectedImage2) && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Image 1 */}
              {selectedImage1 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">
                      {getImageInfo(selectedImage1)?.title}
                    </CardTitle>
                    <div className="flex gap-2">
                      <Badge variant="outline">
                        {getImageInfo(selectedImage1)?.image_type}
                      </Badge>
                      {getImageInfo(selectedImage1)?.is_before_treatment && (
                        <Badge variant="secondary">قبل العلاج</Badge>
                      )}
                      {getImageInfo(selectedImage1)?.is_after_treatment && (
                        <Badge variant="secondary">بعد العلاج</Badge>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent>
                    {image1Url ? (
                      <div className="space-y-2">
                        <img
                          src={image1Url}
                          alt={getImageInfo(selectedImage1)?.title}
                          className="w-full h-64 object-contain border rounded"
                        />
                        <div className="text-sm text-muted-foreground">
                          <p>التاريخ: {format(new Date(getImageInfo(selectedImage1)?.image_date || ''), 'yyyy/MM/dd')}</p>
                          {getImageInfo(selectedImage1)?.description && (
                            <p>الوصف: {getImageInfo(selectedImage1)?.description}</p>
                          )}
                          {getImageInfo(selectedImage1)?.tooth_number && (
                            <p>رقم السن: {getImageInfo(selectedImage1)?.tooth_number}</p>
                          )}
                        </div>
                      </div>
                    ) : (
                      <div className="w-full h-64 bg-gray-100 flex items-center justify-center rounded">
                        <span className="text-muted-foreground">جاري تحميل الصورة...</span>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}

              {/* Image 2 */}
              {selectedImage2 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">
                      {getImageInfo(selectedImage2)?.title}
                    </CardTitle>
                    <div className="flex gap-2">
                      <Badge variant="outline">
                        {getImageInfo(selectedImage2)?.image_type}
                      </Badge>
                      {getImageInfo(selectedImage2)?.is_before_treatment && (
                        <Badge variant="secondary">قبل العلاج</Badge>
                      )}
                      {getImageInfo(selectedImage2)?.is_after_treatment && (
                        <Badge variant="secondary">بعد العلاج</Badge>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent>
                    {image2Url ? (
                      <div className="space-y-2">
                        <img
                          src={image2Url}
                          alt={getImageInfo(selectedImage2)?.title}
                          className="w-full h-64 object-contain border rounded"
                        />
                        <div className="text-sm text-muted-foreground">
                          <p>التاريخ: {format(new Date(getImageInfo(selectedImage2)?.image_date || ''), 'yyyy/MM/dd')}</p>
                          {getImageInfo(selectedImage2)?.description && (
                            <p>الوصف: {getImageInfo(selectedImage2)?.description}</p>
                          )}
                          {getImageInfo(selectedImage2)?.tooth_number && (
                            <p>رقم السن: {getImageInfo(selectedImage2)?.tooth_number}</p>
                          )}
                        </div>
                      </div>
                    ) : (
                      <div className="w-full h-64 bg-gray-100 flex items-center justify-center rounded">
                        <span className="text-muted-foreground">جاري تحميل الصورة...</span>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}
            </div>
          )}

          {/* Comparison Notes */}
          {selectedImage1 && selectedImage2 && (
            <Card>
              <CardHeader>
                <CardTitle>ملاحظات المقارنة</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <p className="text-sm">
                    مقارنة بين صورتين طبيتين لنفس المريض لتتبع تطور الحالة أو نتائج العلاج.
                  </p>
                  {getImageInfo(selectedImage1)?.is_before_treatment && 
                   getImageInfo(selectedImage2)?.is_after_treatment && (
                    <div className="p-3 bg-blue-50 rounded-lg">
                      <p className="text-sm text-blue-800">
                        <strong>مقارنة قبل وبعد العلاج:</strong> يمكن ملاحظة التغييرات في الحالة بين الصورتين
                      </p>
                    </div>
                  )}
                </div>
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