import React, { useState, useCallback } from 'react';
import { Upload, FileType, AlertCircle, CheckCircle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface GLBModelUploaderProps {
  onUploadComplete?: (modelData: any) => void;
  uploadType?: 'default' | 'patient';
  patientId?: string;
}

export const GLBModelUploader: React.FC<GLBModelUploaderProps> = ({
  onUploadComplete,
  uploadType = 'default',
  patientId
}) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [toothNumber, setToothNumber] = useState<string>('');
  const [numberingSystem, setNumberingSystem] = useState<string>('universal');
  const [modelName, setModelName] = useState<string>('');
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const handleFileSelect = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.type === 'model/gltf-binary' || file.name.endsWith('.glb') || file.name.endsWith('.gltf')) {
        setSelectedFile(file);
        if (!modelName) {
          setModelName(file.name.replace(/\.(glb|gltf)$/, ''));
        }
      } else {
        toast.error('يرجى اختيار ملف GLB أو GLTF صالح');
      }
    }
  }, [modelName]);

  const handleUpload = async () => {
    if (!selectedFile || !toothNumber) {
      toast.error('يرجى اختيار ملف ورقم السن');
      return;
    }

    if (uploadType === 'patient' && !patientId) {
      toast.error('معرف المريض غير محدد');
      return;
    }

    setUploading(true);
    setUploadProgress(0);

    try {
      // التحقق من حالة المصادقة
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user) {
        throw new Error('المستخدم غير مصادق عليه. يرجى تسجيل الدخول مرة أخرى');
      }

      console.log('User authenticated:', user.id);
      
      // تحديد مسار الملف
      const folderPath = uploadType === 'default' 
        ? `default-models/${numberingSystem}`
        : `patient-models/${patientId}/${numberingSystem}`;
      
      const fileName = `tooth-${toothNumber}.glb`;
      const filePath = `${folderPath}/${fileName}`;

      console.log('Uploading to path:', filePath);

      // رفع الملف إلى Storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('dental-3d-models')
        .upload(filePath, selectedFile, {
          cacheControl: '3600',
          upsert: true
        });

      if (uploadError) {
        console.error('Storage upload error:', uploadError);
        throw uploadError;
      }

      console.log('File uploaded successfully:', uploadData);
      setUploadProgress(50);

      // الحصول على URL العام
      const { data: { publicUrl } } = supabase.storage
        .from('dental-3d-models')
        .getPublicUrl(filePath);

      console.log('Public URL generated:', publicUrl);
      setUploadProgress(75);

      // إدراج البيانات في قاعدة البيانات
      if (uploadType === 'default') {
        const { data, error } = await supabase
          .from('dental_3d_models')
          .upsert({
            tooth_number: toothNumber,
            numbering_system: numberingSystem,
            model_path: filePath,
            model_name: modelName,
            model_type: 'default',
            file_size: selectedFile.size
          }, {
            onConflict: 'tooth_number,numbering_system,model_type'
          });

        if (error) {
          console.error('Database insert error:', error);
          throw error;
        }
        console.log('Database record created:', data);
      } else {
        const { data, error } = await supabase
          .from('patient_dental_models')
          .upsert({
            patient_id: patientId,
            tooth_number: toothNumber,
            numbering_system: numberingSystem,
            model_path: filePath
          }, {
            onConflict: 'patient_id,tooth_number,numbering_system'
          });

        if (error) {
          console.error('Database insert error:', error);
          throw error;
        }
        console.log('Patient model record created:', data);
      }

      setUploadProgress(100);
      toast.success('تم رفع النموذج بنجاح');
      
      // إعادة تعيين النموذج
      setSelectedFile(null);
      setToothNumber('');
      setModelName('');
      
      // إشعار المكون الأب
      onUploadComplete?.({
        toothNumber,
        numberingSystem,
        modelPath: filePath,
        publicUrl
      });

    } catch (error: any) {
      console.error('Error uploading model:', error);
      
      // تحديد نوع الخطأ وإظهار رسالة مناسبة
      let errorMessage = 'خطأ في رفع النموذج';
      
      if (error.message?.includes('row-level security')) {
        errorMessage = 'خطأ في الصلاحيات. يرجى التأكد من تسجيل الدخول والمحاولة مرة أخرى';
      } else if (error.message?.includes('not authenticated')) {
        errorMessage = 'غير مصادق عليه. يرجى تسجيل الدخول مرة أخرى';
      } else if (error.message) {
        errorMessage = `خطأ في رفع النموذج: ${error.message}`;
      }
      
      toast.error(errorMessage);
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  const generateToothNumbers = () => {
    const numbers = [];
    switch (numberingSystem) {
      case 'universal':
        for (let i = 1; i <= 32; i++) {
          numbers.push(i.toString());
        }
        break;
      case 'palmer':
        // Palmer notation: 1-8 for each quadrant
        ['UR', 'UL', 'LR', 'LL'].forEach(quadrant => {
          for (let i = 1; i <= 8; i++) {
            numbers.push(`${quadrant}${i}`);
          }
        });
        break;
      case 'fdi':
        // FDI notation: 11-18, 21-28, 31-38, 41-48
        [1, 2, 3, 4].forEach(quadrant => {
          for (let i = 1; i <= 8; i++) {
            numbers.push(`${quadrant}${i}`);
          }
        });
        break;
    }
    return numbers;
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Upload className="h-5 w-5" />
          رفع نماذج الأسنان ثلاثية الأبعاد
        </CardTitle>
        <CardDescription>
          {uploadType === 'default' 
            ? 'رفع النماذج الافتراضية للأسنان (GLB/GLTF)'
            : 'رفع نماذج مخصصة للمريض'
          }
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* اختيار نظام الترقيم */}
        <div className="space-y-2">
          <Label htmlFor="numbering-system">نظام ترقيم الأسنان</Label>
          <Select value={numberingSystem} onValueChange={setNumberingSystem}>
            <SelectTrigger>
              <SelectValue placeholder="اختر نظام الترقيم" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="universal">Universal (1-32)</SelectItem>
              <SelectItem value="palmer">Palmer (UR1-LL8)</SelectItem>
              <SelectItem value="fdi">FDI (11-48)</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* اختيار رقم السن */}
        <div className="space-y-2">
          <Label htmlFor="tooth-number">رقم السن</Label>
          <Select value={toothNumber} onValueChange={setToothNumber}>
            <SelectTrigger>
              <SelectValue placeholder="اختر رقم السن" />
            </SelectTrigger>
            <SelectContent className="max-h-60 overflow-y-auto">
              {generateToothNumbers().map(num => (
                <SelectItem key={num} value={num}>
                  السن {num}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* اسم النموذج */}
        <div className="space-y-2">
          <Label htmlFor="model-name">اسم النموذج</Label>
          <Input
            id="model-name"
            value={modelName}
            onChange={(e) => setModelName(e.target.value)}
            placeholder="أدخل اسم النموذج"
          />
        </div>

        {/* رفع الملف */}
        <div className="space-y-2">
          <Label htmlFor="file-upload">ملف النموذج</Label>
          <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-6 text-center">
            <input
              id="file-upload"
              type="file"
              accept=".glb,.gltf,model/gltf-binary"
              onChange={handleFileSelect}
              className="hidden"
            />
            <label
              htmlFor="file-upload"
              className="cursor-pointer flex flex-col items-center gap-2"
            >
              <FileType className="h-8 w-8 text-muted-foreground" />
              <span className="text-sm font-medium">
                {selectedFile ? selectedFile.name : 'اضغط لاختيار ملف GLB/GLTF'}
              </span>
              <span className="text-xs text-muted-foreground">
                الحد الأقصى: 50MB
              </span>
            </label>
          </div>
        </div>

        {/* معلومات الملف المحدد */}
        {selectedFile && (
          <Alert>
            <CheckCircle className="h-4 w-4" />
            <AlertDescription>
              الملف: {selectedFile.name} ({(selectedFile.size / 1024 / 1024).toFixed(2)} MB)
            </AlertDescription>
          </Alert>
        )}

        {/* شريط التقدم */}
        {uploading && (
          <div className="w-full bg-muted rounded-full h-2">
            <div 
              className="bg-primary h-2 rounded-full transition-all duration-300"
              style={{ width: `${uploadProgress}%` }}
            />
          </div>
        )}

        {/* زر الرفع */}
        <Button
          onClick={handleUpload}
          disabled={!selectedFile || !toothNumber || uploading}
          className="w-full"
        >
          {uploading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin ml-2" />
              جاري الرفع...
            </>
          ) : (
            <>
              <Upload className="h-4 w-4 ml-2" />
              رفع النموذج
            </>
          )}
        </Button>
        
        {/* زر تشخيص للتحقق من الصلاحيات */}
        <Button
          variant="outline"
          onClick={async () => {
            try {
              const { data: { user }, error: authError } = await supabase.auth.getUser();
              if (authError) {
                toast.error(`خطأ في المصادقة: ${authError.message}`);
                return;
              }
              
              if (!user) {
                toast.error('المستخدم غير مصادق عليه');
                return;
              }
              
              console.log('Current user:', user);
              
              // التحقق من بيانات الملف الشخصي
              const { data: profile, error: profileError } = await supabase
                .from('profiles')
                .select('*')
                .eq('user_id', user.id)
                .single();
                
              if (profileError) {
                console.error('Profile error:', profileError);
                toast.error(`خطأ في جلب الملف الشخصي: ${profileError.message}`);
                return;
              }
              
              console.log('User profile:', profile);
              toast.success(`المستخدم: ${user.email}, الدور: ${profile?.role || 'غير محدد'}`);
              
            } catch (error: any) {
              console.error('Debug error:', error);
              toast.error(`خطأ في التشخيص: ${error.message}`);
            }
          }}
          className="w-full"
        >
          تحقق من الصلاحيات
        </Button>
      </CardContent>
    </Card>
  );
};