import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Image as ImageIcon, 
  Plus, 
  Edit3, 
  Eye, 
  Calendar,
  Tag
} from 'lucide-react';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';
import { UploadImageDialog } from './UploadImageDialog';
import { ImageAnnotationEditor } from './ImageAnnotationEditor';
import { EnhancedImageViewer } from './EnhancedImageViewer';
import { useToast } from '@/hooks/use-toast';

interface PatientImageGalleryProps {
  patientId: string;
}

interface MedicalImage {
  id: string;
  title: string;
  description: string;
  image_type: string;
  file_path: string;
  annotated_image_path: string;
  has_annotations: boolean;
  annotation_data: any;
  tooth_number: string;
  is_before_treatment: boolean;
  is_after_treatment: boolean;
  image_date: string;
  created_at: string;
  updated_at: string;
}

export function PatientImageGallery({ patientId }: PatientImageGalleryProps) {
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [annotationEditor, setAnnotationEditor] = useState<{
    isOpen: boolean;
    imageUrl?: string;
    imageId?: string;
    existingAnnotations?: any;
  }>({ isOpen: false });
  const [viewerOpen, setViewerOpen] = useState(false);
  const [selectedImageId, setSelectedImageId] = useState<string>('');
  const { toast } = useToast();

  const { data: images, isLoading, refetch } = useQuery({
    queryKey: ['patient-images', patientId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('medical_images')
        .select('*')
        .eq('patient_id', patientId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as MedicalImage[];
    }
  });

  const getImageUrl = (image: MedicalImage) => {
    // Always prioritize annotated image if it exists and has annotations
    const imagePath = image.has_annotations && image.annotated_image_path 
      ? image.annotated_image_path 
      : image.file_path;
    
    const { data } = supabase.storage
      .from('medical-images')
      .getPublicUrl(imagePath);
    
    // Add cache-busting timestamp for updated images
    const timestamp = image.has_annotations 
      ? new Date(image.updated_at).getTime() 
      : new Date(image.created_at).getTime();
    
    return `${data.publicUrl}?t=${timestamp}&cache=bust`;
  };

  const getImageTypeLabel = (type: string) => {
    const types: { [key: string]: string } = {
      'xray': 'أشعة سينية',
      'photo': 'صورة فوتوغرافية',
      'scan': 'مسح ضوئي',
      'dicom': 'ملف DICOM'
    };
    return types[type] || type;
  };

  const handleEditAnnotation = (image: MedicalImage) => {
    // Always use the original image as base, but load existing annotations if they exist
    const originalImageUrl = supabase.storage.from('medical-images').getPublicUrl(image.file_path).data.publicUrl;
      
    console.log('Opening annotation editor for image:', image.id);
    console.log('Original image URL:', originalImageUrl);
    console.log('Existing annotations:', image.annotation_data);
    console.log('Has annotations:', image.has_annotations);

    setAnnotationEditor({
      isOpen: true,
      imageUrl: originalImageUrl, // Always use original image as base
      imageId: image.id,
      existingAnnotations: image.has_annotations ? image.annotation_data : null
    });
  };

  const handleSaveAnnotation = async (annotatedImageUrl: string, annotationData: any) => {
    if (!annotationEditor.imageId) return;

    try {
      // Convert data URL to blob
      const response = await fetch(annotatedImageUrl);
      const blob = await response.blob();

      // Get current user profile for clinic_id
      const { data: profile } = await supabase
        .from('profiles')
        .select('id')
        .single();

      if (!profile) throw new Error('لم يتم العثور على ملف المستخدم');

      // Create unique filename for annotated image
      const timestamp = Date.now();
      const random = Math.random().toString(36).substring(2, 8);
      const fileName = `${profile.id}/${patientId}/annotated_${annotationEditor.imageId}_${timestamp}_${random}.png`;
      
      console.log('Uploading annotated image:', fileName);
      console.log('Blob size:', blob.size, 'bytes');
      
      // Upload annotated image to storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('medical-images')
        .upload(fileName, blob, {
          contentType: 'image/png',
          upsert: false
        });

      if (uploadError) {
        console.error('Upload error:', uploadError);
        throw new Error(`خطأ في رفع الصورة: ${uploadError.message}`);
      }

      console.log('Image uploaded successfully:', uploadData.path);

      // Update medical image record
      const updateData = {
        annotated_image_path: uploadData.path,
        annotation_data: annotationData,
        has_annotations: true,
        updated_at: new Date().toISOString()
      };
      
      console.log('Updating image record with:', updateData);

      const { error: updateError } = await supabase
        .from('medical_images')
        .update(updateData)
        .eq('id', annotationEditor.imageId);

      if (updateError) {
        console.error('Update error:', updateError);
        throw new Error(`خطأ في تحديث البيانات: ${updateError.message}`);
      }

      console.log('Image record updated successfully');

      // Close editor and refresh
      setAnnotationEditor({ isOpen: false });
      
      // Add a small delay to ensure the storage has processed the upload
      setTimeout(() => {
        refetch();
        toast({
          title: "تم حفظ التعديلات بنجاح",
          description: "تم حفظ الصورة المعدلة في سجل المريض",
        });
      }, 1000);
      
    } catch (error: any) {
      console.error('Error saving annotation:', error);
      toast({
        title: "خطأ في حفظ التعديلات",
        description: error.message || 'حدث خطأ أثناء حفظ التعديلات',
        variant: "destructive",
      });
    }
  };

  const handleViewImage = (imageId: string) => {
    setSelectedImageId(imageId);
    setViewerOpen(true);
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center text-muted-foreground">جاري تحميل الصور...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle className="flex items-center">
              <ImageIcon className="w-5 h-5 ml-2" />
              الصور الطبية ({images?.length || 0})
            </CardTitle>
            <Button onClick={() => setUploadDialogOpen(true)}>
              <Plus className="w-4 h-4 ml-1" />
              رفع صورة جديدة
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {!images || images.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <ImageIcon className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>لا توجد صور طبية مرفوعة لهذا المريض</p>
              <Button 
                variant="outline" 
                className="mt-4"
                onClick={() => setUploadDialogOpen(true)}
              >
                رفع أول صورة
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {images.map((image) => (
                <div key={image.id} className="group relative">
                  <Card className="overflow-hidden">
                    <div className="aspect-square bg-gray-100 dark:bg-gray-800 relative overflow-hidden">
                      <img
                        src={getImageUrl(image)}
                        alt={image.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                        onError={(e) => {
                          // Fallback to original image if annotated version fails
                          const target = e.target as HTMLImageElement;
                          if (image.has_annotations && image.annotated_image_path && !target.src.includes('fallback')) {
                            const { data } = supabase.storage
                              .from('medical-images')
                              .getPublicUrl(image.file_path);
                            target.src = `${data.publicUrl}?fallback=true`;
                          }
                        }}
                        loading="lazy"
                      />
                      {image.has_annotations && (
                        <Badge 
                          className="absolute top-2 right-2 bg-primary text-primary-foreground"
                        >
                          معدلة
                        </Badge>
                      )}
                      <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center gap-2">
                        <Button 
                          size="sm" 
                          variant="secondary"
                          onClick={() => handleViewImage(image.id)}
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                        <Button 
                          size="sm" 
                          variant="secondary"
                          onClick={() => handleEditAnnotation(image)}
                        >
                          <Edit3 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                    <CardContent className="p-3">
                      <h4 className="font-medium text-sm mb-1 truncate">{image.title}</h4>
                      <div className="flex flex-wrap gap-1 mb-2">
                        <Badge variant="outline" className="text-xs">
                          {getImageTypeLabel(image.image_type)}
                        </Badge>
                        {image.tooth_number && (
                          <Badge variant="outline" className="text-xs">
                            <Tag className="w-3 h-3 ml-1" />
                            {image.tooth_number}
                          </Badge>
                        )}
                      </div>
                      {(image.is_before_treatment || image.is_after_treatment) && (
                        <div className="flex gap-1 mb-2">
                          {image.is_before_treatment && (
                            <Badge variant="secondary" className="text-xs">قبل العلاج</Badge>
                          )}
                          {image.is_after_treatment && (
                            <Badge variant="secondary" className="text-xs">بعد العلاج</Badge>
                          )}
                        </div>
                      )}
                      <p className="text-xs text-muted-foreground flex items-center">
                        <Calendar className="w-3 h-3 ml-1" />
                        {format(new Date(image.image_date), 'dd/MM/yyyy', { locale: ar })}
                      </p>
                    </CardContent>
                  </Card>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Upload Dialog */}
      <UploadImageDialog
        isOpen={uploadDialogOpen}
        onClose={() => setUploadDialogOpen(false)}
        onImageUploaded={() => {
          refetch();
          setUploadDialogOpen(false);
        }}
        defaultPatientId={patientId}
      />

      {/* Annotation Editor */}
      {annotationEditor.isOpen && annotationEditor.imageUrl && (
        <ImageAnnotationEditor
          imageUrl={annotationEditor.imageUrl}
          existingAnnotations={annotationEditor.existingAnnotations}
          onSave={handleSaveAnnotation}
          onClose={() => setAnnotationEditor({ isOpen: false })}
        />
      )}

      {/* Image Viewer */}
      {viewerOpen && selectedImageId && (
        <EnhancedImageViewer
          image={images?.find(img => img.id === selectedImageId)!}
          isOpen={viewerOpen}
          onClose={() => setViewerOpen(false)}
        />
      )}
    </>
  );
}