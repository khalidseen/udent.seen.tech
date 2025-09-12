import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { 
  Camera, 
  Upload, 
  Image as ImageIcon,
  Calendar,
  Eye,
  Download,
  Trash2,
  Plus
} from 'lucide-react';
import { Patient } from '@/hooks/usePatients';
import { useToast } from '@/hooks/use-toast';

interface PhotoGalleryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  patient: Patient;
}

interface Photo {
  id: string;
  url: string;
  title: string;
  category: 'before' | 'after' | 'xray' | 'clinical' | 'other';
  uploadDate: string;
  description?: string;
  fileSize: string;
}

const PhotoGalleryDialog: React.FC<PhotoGalleryDialogProps> = ({
  open,
  onOpenChange,
  patient
}) => {
  const { toast } = useToast();
  const [photos, setPhotos] = useState<Photo[]>([
    {
      id: '1',
      url: '/placeholder.svg',
      title: 'صورة قبل العلاج',
      category: 'before',
      uploadDate: '2024-01-15',
      description: 'حالة الأسنان قبل بدء العلاج',
      fileSize: '2.5 MB'
    },
    {
      id: '2',
      url: '/placeholder.svg',
      title: 'أشعة سينية',
      category: 'xray',
      uploadDate: '2024-01-20',
      description: 'أشعة سينية للفك العلوي',
      fileSize: '1.8 MB'
    },
    {
      id: '3',
      url: '/placeholder.svg',
      title: 'صورة بعد العلاج',
      category: 'after',
      uploadDate: '2024-02-01',
      description: 'النتيجة النهائية بعد العلاج',
      fileSize: '3.1 MB'
    }
  ]);

  const [selectedPhoto, setSelectedPhoto] = useState<Photo | null>(null);
  const [uploadMode, setUploadMode] = useState(false);

  const categoryLabels = {
    before: 'قبل العلاج',
    after: 'بعد العلاج',
    xray: 'أشعة سينية',
    clinical: 'سريرية',
    other: 'أخرى'
  };

  const categoryColors = {
    before: 'bg-red-100 text-red-800',
    after: 'bg-green-100 text-green-800',
    xray: 'bg-blue-100 text-blue-800',
    clinical: 'bg-purple-100 text-purple-800',
    other: 'bg-gray-100 text-gray-800'
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files) {
      Array.from(files).forEach((file) => {
        const newPhoto: Photo = {
          id: Date.now().toString() + Math.random(),
          url: URL.createObjectURL(file),
          title: file.name,
          category: 'other',
          uploadDate: new Date().toISOString().split('T')[0],
          fileSize: (file.size / (1024 * 1024)).toFixed(1) + ' MB'
        };
        setPhotos(prev => [...prev, newPhoto]);
      });
      
      toast({
        title: "تم الرفع",
        description: `تم رفع ${files.length} صورة بنجاح`
      });
    }
  };

  const handleDeletePhoto = (id: string) => {
    setPhotos(prev => prev.filter(photo => photo.id !== id));
    toast({
      title: "تم الحذف",
      description: "تم حذف الصورة بنجاح"
    });
  };

  const handleDownloadPhoto = (photo: Photo) => {
    // في التطبيق الحقيقي، سيتم تحميل الصورة
    toast({
      title: "تحميل",
      description: `جاري تحميل ${photo.title}`
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Camera className="h-5 w-5 text-blue-600" />
            معرض الصور - {patient.full_name}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* شريط الأدوات */}
          <div className="flex items-center justify-between bg-gray-50 p-4 rounded-lg">
            <div className="flex items-center gap-4">
              <div className="text-sm">
                <span className="font-medium">إجمالي الصور: </span>
                <span className="text-blue-600 font-bold">{photos.length}</span>
              </div>
              <div className="text-sm">
                <span className="font-medium">آخر رفع: </span>
                <span className="text-gray-600">
                  {photos.length > 0 
                    ? new Date(Math.max(...photos.map(p => new Date(p.uploadDate).getTime()))).toLocaleDateString('ar-SA')
                    : 'لا توجد صور'
                  }
                </span>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <input
                type="file"
                multiple
                accept="image/*"
                onChange={handleFileUpload}
                className="hidden"
                id="photo-upload"
              />
              <label htmlFor="photo-upload">
                <Button asChild size="sm">
                  <span className="flex items-center gap-2 cursor-pointer">
                    <Upload className="h-4 w-4" />
                    رفع صور
                  </span>
                </Button>
              </label>
            </div>
          </div>

          {/* معرض الصور */}
          {photos.length === 0 ? (
            <div className="text-center py-12 bg-gray-50 rounded-lg">
              <ImageIcon className="h-16 w-16 mx-auto mb-4 text-gray-400" />
              <p className="text-gray-600 mb-4">لا توجد صور بعد</p>
              <label htmlFor="photo-upload">
                <Button asChild>
                  <span className="flex items-center gap-2 cursor-pointer">
                    <Plus className="h-4 w-4" />
                    إضافة أول صورة
                  </span>
                </Button>
              </label>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {photos.map((photo) => (
                <Card key={photo.id} className="group hover:shadow-lg transition-shadow">
                  <CardContent className="p-3">
                    <div className="aspect-square relative rounded-lg overflow-hidden mb-3">
                      <img
                        src={photo.url}
                        alt={photo.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                      />
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-200 flex items-center justify-center">
                        <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex gap-2">
                          <Button
                            size="sm"
                            variant="secondary"
                            onClick={() => setSelectedPhoto(photo)}
                            className="h-8 w-8 p-0"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="secondary"
                            onClick={() => handleDownloadPhoto(photo)}
                            className="h-8 w-8 p-0"
                          >
                            <Download className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="secondary"
                            onClick={() => handleDeletePhoto(photo.id)}
                            className="h-8 w-8 p-0 text-red-600 hover:bg-red-100"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Badge className={categoryColors[photo.category]}>
                          {categoryLabels[photo.category]}
                        </Badge>
                        <span className="text-xs text-gray-500">{photo.fileSize}</span>
                      </div>
                      
                      <h3 className="font-medium text-sm line-clamp-2" title={photo.title}>
                        {photo.title}
                      </h3>
                      
                      {photo.description && (
                        <p className="text-xs text-gray-600 line-clamp-2" title={photo.description}>
                          {photo.description}
                        </p>
                      )}
                      
                      <div className="flex items-center gap-1 text-xs text-gray-500">
                        <Calendar className="h-3 w-3" />
                        {new Date(photo.uploadDate).toLocaleDateString('ar-SA')}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* معاينة الصورة */}
        {selectedPhoto && (
          <Dialog open={!!selectedPhoto} onOpenChange={() => setSelectedPhoto(null)}>
            <DialogContent className="max-w-4xl">
              <DialogHeader>
                <DialogTitle>{selectedPhoto.title}</DialogTitle>
              </DialogHeader>
              
              <div className="space-y-4">
                <div className="aspect-video relative rounded-lg overflow-hidden bg-gray-100">
                  <img
                    src={selectedPhoto.url}
                    alt={selectedPhoto.title}
                    className="w-full h-full object-contain"
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <Label>التصنيف</Label>
                    <Badge className={categoryColors[selectedPhoto.category]}>
                      {categoryLabels[selectedPhoto.category]}
                    </Badge>
                  </div>
                  <div>
                    <Label>تاريخ الرفع</Label>
                    <p>{new Date(selectedPhoto.uploadDate).toLocaleDateString('ar-SA')}</p>
                  </div>
                  <div>
                    <Label>حجم الملف</Label>
                    <p>{selectedPhoto.fileSize}</p>
                  </div>
                  <div>
                    <Label>الوصف</Label>
                    <p>{selectedPhoto.description || 'لا يوجد وصف'}</p>
                  </div>
                </div>
                
                <div className="flex justify-end gap-2">
                  <Button
                    variant="outline"
                    onClick={() => handleDownloadPhoto(selectedPhoto)}
                  >
                    <Download className="h-4 w-4 mr-2" />
                    تحميل
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => handleDeletePhoto(selectedPhoto.id)}
                    className="text-red-600 hover:bg-red-50"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    حذف
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default PhotoGalleryDialog;