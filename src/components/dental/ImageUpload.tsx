// 🦷 Enhanced Image Upload Component
// مكون رفع الصور المحسن

import React, { useState, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { 
  Upload, 
  Image as ImageIcon, 
  X, 
  Camera, 
  FileImage,
  Trash2,
  ZoomIn,
  Download
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { ImageUploadProps } from '@/types/dentalChart';

const ImageUpload: React.FC<ImageUploadProps> = ({
  onImageSelect,
  currentImage,
  maxSize = 5, // 5MB
  acceptedFormats = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
}) => {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [previewImage, setPreviewImage] = useState<string | null>(currentImage || null);
  const [dragActive, setDragActive] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const validateFile = useCallback((file: File): boolean => {
    // التحقق من نوع الملف
    if (!acceptedFormats.includes(file.type)) {
      toast({
        title: "نوع ملف غير مدعوم",
        description: `يرجى اختيار صورة بصيغة: ${acceptedFormats.map(f => f.split('/')[1]).join(', ')}`,
        variant: "destructive"
      });
      return false;
    }

    // التحقق من حجم الملف
    const fileSizeMB = file.size / (1024 * 1024);
    if (fileSizeMB > maxSize) {
      toast({
        title: "حجم الملف كبير جداً",
        description: `يجب أن يكون حجم الصورة أقل من ${maxSize} ميجابايت`,
        variant: "destructive"
      });
      return false;
    }

    return true;
  }, [acceptedFormats, maxSize, toast]);

  const processImage = useCallback(async (file: File) => {
    if (!validateFile(file)) return;

    setIsUploading(true);
    setUploadProgress(0);

    try {
      // ضغط الصورة إذا كانت كبيرة
      const compressedFile = await compressImage(file);
      
      const reader = new FileReader();
      
      reader.onprogress = (e) => {
        if (e.lengthComputable) {
          const progress = (e.loaded / e.total) * 100;
          setUploadProgress(progress);
        }
      };

      reader.onload = (e) => {
        const imageData = e.target?.result as string;
        setPreviewImage(imageData);
        onImageSelect(imageData);
        setUploadProgress(100);
        
        toast({
          title: "تم رفع الصورة بنجاح",
          description: "تم حفظ صورة السن بنجاح"
        });
      };

      reader.onerror = () => {
        toast({
          title: "خطأ في قراءة الملف",
          description: "حدث خطأ أثناء معالجة الصورة",
          variant: "destructive"
        });
      };

      reader.readAsDataURL(compressedFile);
    } catch (error) {
      console.error('خطأ في معالجة الصورة:', error);
      toast({
        title: "خطأ في رفع الصورة",
        description: "حدث خطأ أثناء معالجة الصورة",
        variant: "destructive"
      });
    } finally {
      setIsUploading(false);
    }
  }, [onImageSelect, toast, validateFile]);

  const compressImage = (file: File): Promise<File> => {
    return new Promise((resolve) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();
      
      img.onload = () => {
        // تحديد أبعاد مناسبة (أقصى عرض/ارتفاع 1200 بيكسل)
        const maxDimension = 1200;
        let { width, height } = img;
        
        if (width > height) {
          if (width > maxDimension) {
            height = (height * maxDimension) / width;
            width = maxDimension;
          }
        } else {
          if (height > maxDimension) {
            width = (width * maxDimension) / height;
            height = maxDimension;
          }
        }
        
        canvas.width = width;
        canvas.height = height;
        
        ctx?.drawImage(img, 0, 0, width, height);
        
        canvas.toBlob((blob) => {
          if (blob) {
            const compressedFile = new File([blob], file.name, {
              type: 'image/jpeg',
              lastModified: Date.now()
            });
            resolve(compressedFile);
          } else {
            resolve(file);
          }
        }, 'image/jpeg', 0.8);
      };
      
      img.src = URL.createObjectURL(file);
    });
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processImage(file);
    }
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
    
    const file = e.dataTransfer.files[0];
    if (file) {
      processImage(file);
    }
  }, [processImage]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
  }, []);

  const removeImage = () => {
    setPreviewImage(null);
    onImageSelect('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    toast({
      title: "تم حذف الصورة",
      description: "تم حذف صورة السن"
    });
  };

  const downloadImage = () => {
    if (previewImage) {
      const link = document.createElement('a');
      link.href = previewImage;
      link.download = `tooth-image-${Date.now()}.jpg`;
      link.click();
    }
  };

  return (
    <div className="space-y-4">
      {/* منطقة رفع الصورة */}
      {!previewImage && (
        <div
          className={cn(
            "border-2 border-dashed rounded-lg p-6 text-center transition-all duration-200",
            dragActive 
              ? "border-primary bg-primary/5" 
              : "border-gray-300 hover:border-primary hover:bg-gray-50",
            isUploading && "pointer-events-none opacity-50"
          )}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
        >
          <div className="space-y-4">
            <div className="flex justify-center">
              <Upload className="w-12 h-12 text-gray-400" />
            </div>
            
            <div className="space-y-2">
              <h3 className="text-lg font-medium">رفع صورة السن</h3>
              <p className="text-sm text-gray-500">
                اسحب الصورة هنا أو انقر لاختيار ملف
              </p>
              <p className="text-xs text-gray-400">
                الحد الأقصى: {maxSize}MB | الصيغ المدعومة: JPG, PNG, WebP
              </p>
            </div>
            
            <div className="flex gap-2 justify-center">
              <Button
                type="button"
                variant="outline"
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading}
                className="gap-2"
              >
                <FileImage className="w-4 h-4" />
                اختيار ملف
              </Button>
              
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  // في التطبيق الحقيقي، يمكن فتح الكاميرا
                  fileInputRef.current?.click();
                }}
                disabled={isUploading}
                className="gap-2"
              >
                <Camera className="w-4 h-4" />
                التقاط صورة
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* شريط التقدم */}
      {isUploading && (
        <div className="space-y-2">
          <Progress value={uploadProgress} className="w-full" />
          <p className="text-sm text-center text-gray-500">
            جاري رفع الصورة... {Math.round(uploadProgress)}%
          </p>
        </div>
      )}

      {/* معاينة الصورة */}
      {previewImage && !isUploading && (
        <div className="space-y-3">
          <div className="relative group">
            <img
              src={previewImage}
              alt="صورة السن"
              className="w-full h-48 object-cover rounded-lg border"
            />
            
            {/* أزرار التحكم */}
            <div className="absolute top-2 right-2 flex gap-1">
              <Button
                type="button"
                size="sm"
                variant="secondary"
                onClick={() => setShowPreview(true)}
                className="h-8 w-8 p-0"
                title="عرض مكبر"
              >
                <ZoomIn className="w-4 h-4" />
              </Button>
              
              <Button
                type="button"
                size="sm"
                variant="secondary"
                onClick={downloadImage}
                className="h-8 w-8 p-0"
                title="تحميل الصورة"
              >
                <Download className="w-4 h-4" />
              </Button>
              
              <Button
                type="button"
                size="sm"
                variant="destructive"
                onClick={removeImage}
                className="h-8 w-8 p-0"
                title="حذف الصورة"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          </div>
          
          <div className="flex justify-between items-center text-sm text-gray-500">
            <span>صورة السن محفوظة</span>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => fileInputRef.current?.click()}
              className="gap-2"
            >
              <ImageIcon className="w-4 h-4" />
              تغيير الصورة
            </Button>
          </div>
        </div>
      )}

      {/* معاينة مكبرة */}
      {showPreview && previewImage && (
        <div 
          className="fixed inset-0 bg-black/80 flex items-center justify-center z-50"
          onClick={() => setShowPreview(false)}
        >
          <div className="relative max-w-4xl max-h-full p-4">
            <img
              src={previewImage}
              alt="صورة السن - معاينة مكبرة"
              className="max-w-full max-h-full object-contain"
            />
            <Button
              type="button"
              size="sm"
              variant="secondary"
              onClick={() => setShowPreview(false)}
              className="absolute top-2 right-2"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Input مخفي */}
      <Input
        ref={fileInputRef}
        type="file"
        accept={acceptedFormats.join(',')}
        onChange={handleFileSelect}
        className="hidden"
      />
    </div>
  );
};

export default ImageUpload;
