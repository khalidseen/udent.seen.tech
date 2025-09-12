import React, { useState, useRef, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Slider } from '@/components/ui/slider';
import { Card, CardContent } from '@/components/ui/card';
import { 
  Save, 
  RotateCw, 
  RotateCcw, 
  ZoomIn, 
  ZoomOut, 
  Move, 
  Crop,
  Palette,
  Sun,
  Contrast,
  Scissors,
  Download,
  Upload,
  RefreshCw
} from 'lucide-react';

interface EditMetadata {
  toothNumber: string;
  quadrant: string;
  editedAt: string;
  settings: EditorSettings;
  originalImage?: string;
}

interface ToothImageEditorProps {
  isOpen: boolean;
  onClose: () => void;
  toothNumber: string;
  quadrant: string;
  patientId?: string;
  originalImage?: string;
  onSave: (editedImageData: string, metadata: EditMetadata) => void;
}

interface EditorSettings {
  brightness: number;
  contrast: number;
  saturation: number;
  rotation: number;
  zoom: number;
  offsetX: number;
  offsetY: number;
  flipHorizontal: boolean;
  flipVertical: boolean;
}

export const ToothImageEditor: React.FC<ToothImageEditorProps> = ({
  isOpen,
  onClose,
  toothNumber,
  quadrant,
  patientId,
  originalImage,
  onSave
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [image, setImage] = useState<HTMLImageElement | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [currentTool, setCurrentTool] = useState<'move' | 'crop'>('move');
  
  const [settings, setSettings] = useState<EditorSettings>({
    brightness: 100,
    contrast: 100,
    saturation: 100,
    rotation: 0,
    zoom: 100,
    offsetX: 0,
    offsetY: 0,
    flipHorizontal: false,
    flipVertical: false
  });

  // تحميل الصورة الأصلية
  useEffect(() => {
    if (originalImage && isOpen) {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        setImage(img);
        drawCanvas(img, settings);
      };
      img.src = originalImage;
    }
  }, [originalImage, isOpen, settings]);

  // رسم الصورة على Canvas مع التأثيرات
  const drawCanvas = (img: HTMLImageElement, currentSettings: EditorSettings) => {
    const canvas = canvasRef.current;
    if (!canvas || !img) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // تنظيف Canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // حفظ حالة السياق
    ctx.save();

    // تطبيق التحولات
    ctx.translate(canvas.width / 2, canvas.height / 2);
    
    // التدوير
    ctx.rotate((currentSettings.rotation * Math.PI) / 180);
    
    // القلب
    ctx.scale(
      currentSettings.flipHorizontal ? -1 : 1,
      currentSettings.flipVertical ? -1 : 1
    );
    
    // التكبير والإزاحة
    const scale = currentSettings.zoom / 100;
    ctx.scale(scale, scale);
    ctx.translate(currentSettings.offsetX, currentSettings.offsetY);

    // تطبيق فلاتر الألوان
    ctx.filter = `
      brightness(${currentSettings.brightness}%) 
      contrast(${currentSettings.contrast}%) 
      saturate(${currentSettings.saturation}%)
    `;

    // رسم الصورة
    ctx.drawImage(
      img,
      -img.width / 2,
      -img.height / 2,
      img.width,
      img.height
    );

    // استعادة السياق
    ctx.restore();
  };

  // تحديث الإعدادات ورسم الصورة
  const updateSetting = (key: keyof EditorSettings, value: number | boolean) => {
    const newSettings = { ...settings, [key]: value };
    setSettings(newSettings);
    if (image) {
      drawCanvas(image, newSettings);
    }
  };

  // معالجة السحب والإفلات
  const handleMouseDown = (e: React.MouseEvent) => {
    if (currentTool === 'move') {
      setIsDragging(true);
      setDragStart({ x: e.clientX, y: e.clientY });
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging && currentTool === 'move') {
      const deltaX = e.clientX - dragStart.x;
      const deltaY = e.clientY - dragStart.y;
      
      updateSetting('offsetX', settings.offsetX + deltaX * 0.5);
      updateSetting('offsetY', settings.offsetY + deltaY * 0.5);
      
      setDragStart({ x: e.clientX, y: e.clientY });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // رفع صورة جديدة
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const img = new Image();
        img.onload = () => {
          setImage(img);
          drawCanvas(img, settings);
        };
        img.src = event.target?.result as string;
      };
      reader.readAsDataURL(file);
    }
  };

  // إعادة تعيين الإعدادات
  const resetSettings = () => {
    const defaultSettings: EditorSettings = {
      brightness: 100,
      contrast: 100,
      saturation: 100,
      rotation: 0,
      zoom: 100,
      offsetX: 0,
      offsetY: 0,
      flipHorizontal: false,
      flipVertical: false
    };
    setSettings(defaultSettings);
    if (image) {
      drawCanvas(image, defaultSettings);
    }
  };

  // حفظ الصورة المحررة
  const handleSave = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const editedImageData = canvas.toDataURL('image/png', 0.9);
    const metadata = {
      toothNumber,
      quadrant,
      editedAt: new Date().toISOString(),
      settings,
      originalImage
    };

    onSave(editedImageData, metadata);
    onClose();
  };

  // تنزيل الصورة
  const handleDownload = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const link = document.createElement('a');
    link.download = `tooth-${quadrant}-${toothNumber}-edited.png`;
    link.href = canvas.toDataURL();
    link.click();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl h-[90vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="text-center text-xl font-bold">
            🦷 محرر صورة السن {toothNumber} - {quadrant}
            {patientId && <span className="text-sm text-gray-500 block">المريض: {patientId}</span>}
          </DialogTitle>
        </DialogHeader>

        <div className="flex h-full gap-4">
          {/* لوحة الأدوات */}
          <Card className="w-80 overflow-y-auto">
            <CardContent className="p-4 space-y-4">
              
              {/* رفع صورة جديدة */}
              <div>
                <label className="block text-sm font-medium mb-2">رفع صورة جديدة</label>
                <div className="flex gap-2">
                  <Input
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                    id="image-upload"
                  />
                  <Button 
                    onClick={() => document.getElementById('image-upload')?.click()}
                    variant="outline"
                    className="flex-1"
                  >
                    <Upload className="w-4 h-4 mr-2" />
                    رفع صورة
                  </Button>
                </div>
              </div>

              {/* أدوات التحكم */}
              <div>
                <label className="block text-sm font-medium mb-2">الأدوات</label>
                <div className="flex gap-2">
                  <Button 
                    variant={currentTool === 'move' ? 'default' : 'outline'}
                    onClick={() => setCurrentTool('move')}
                    className="flex-1"
                  >
                    <Move className="w-4 h-4" />
                  </Button>
                  <Button 
                    variant={currentTool === 'crop' ? 'default' : 'outline'}
                    onClick={() => setCurrentTool('crop')}
                    className="flex-1"
                  >
                    <Crop className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              {/* التدوير */}
              <div>
                <label className="block text-sm font-medium mb-2">التدوير</label>
                <div className="flex gap-2 mb-2">
                  <Button 
                    onClick={() => updateSetting('rotation', settings.rotation - 90)}
                    variant="outline"
                    className="flex-1"
                  >
                    <RotateCcw className="w-4 h-4" />
                  </Button>
                  <Button 
                    onClick={() => updateSetting('rotation', settings.rotation + 90)}
                    variant="outline"
                    className="flex-1"
                  >
                    <RotateCw className="w-4 h-4" />
                  </Button>
                </div>
                <Slider
                  value={[settings.rotation]}
                  onValueChange={([value]) => updateSetting('rotation', value)}
                  min={-180}
                  max={180}
                  step={1}
                  className="w-full"
                />
                <span className="text-xs text-gray-500">{settings.rotation}°</span>
              </div>

              {/* التكبير */}
              <div>
                <label className="block text-sm font-medium mb-2">التكبير</label>
                <div className="flex gap-2 mb-2">
                  <Button 
                    onClick={() => updateSetting('zoom', Math.max(10, settings.zoom - 10))}
                    variant="outline"
                    className="flex-1"
                  >
                    <ZoomOut className="w-4 h-4" />
                  </Button>
                  <Button 
                    onClick={() => updateSetting('zoom', Math.min(500, settings.zoom + 10))}
                    variant="outline"
                    className="flex-1"
                  >
                    <ZoomIn className="w-4 h-4" />
                  </Button>
                </div>
                <Slider
                  value={[settings.zoom]}
                  onValueChange={([value]) => updateSetting('zoom', value)}
                  min={10}
                  max={500}
                  step={5}
                  className="w-full"
                />
                <span className="text-xs text-gray-500">{settings.zoom}%</span>
              </div>

              {/* السطوع */}
              <div>
                <label className="block text-sm font-medium mb-2">
                  <Sun className="w-4 h-4 inline mr-1" />
                  السطوع
                </label>
                <Slider
                  value={[settings.brightness]}
                  onValueChange={([value]) => updateSetting('brightness', value)}
                  min={0}
                  max={200}
                  step={1}
                  className="w-full"
                />
                <span className="text-xs text-gray-500">{settings.brightness}%</span>
              </div>

              {/* التباين */}
              <div>
                <label className="block text-sm font-medium mb-2">
                  <Contrast className="w-4 h-4 inline mr-1" />
                  التباين
                </label>
                <Slider
                  value={[settings.contrast]}
                  onValueChange={([value]) => updateSetting('contrast', value)}
                  min={0}
                  max={200}
                  step={1}
                  className="w-full"
                />
                <span className="text-xs text-gray-500">{settings.contrast}%</span>
              </div>

              {/* التشبع */}
              <div>
                <label className="block text-sm font-medium mb-2">
                  <Palette className="w-4 h-4 inline mr-1" />
                  التشبع
                </label>
                <Slider
                  value={[settings.saturation]}
                  onValueChange={([value]) => updateSetting('saturation', value)}
                  min={0}
                  max={200}
                  step={1}
                  className="w-full"
                />
                <span className="text-xs text-gray-500">{settings.saturation}%</span>
              </div>

              {/* القلب */}
              <div>
                <label className="block text-sm font-medium mb-2">القلب</label>
                <div className="flex gap-2">
                  <Button 
                    variant={settings.flipHorizontal ? 'default' : 'outline'}
                    onClick={() => updateSetting('flipHorizontal', !settings.flipHorizontal)}
                    className="flex-1"
                  >
                    ↔️ أفقي
                  </Button>
                  <Button 
                    variant={settings.flipVertical ? 'default' : 'outline'}
                    onClick={() => updateSetting('flipVertical', !settings.flipVertical)}
                    className="flex-1"
                  >
                    ↕️ عمودي
                  </Button>
                </div>
              </div>

              {/* إعادة تعيين */}
              <Button onClick={resetSettings} variant="outline" className="w-full">
                <RefreshCw className="w-4 h-4 mr-2" />
                إعادة تعيين
              </Button>

            </CardContent>
          </Card>

          {/* منطقة التحرير */}
          <div className="flex-1 flex flex-col">
            <div className="flex-1 bg-gray-50 border-2 border-dashed border-gray-300 rounded-lg overflow-hidden relative">
              <canvas
                ref={canvasRef}
                width={800}
                height={600}
                className="w-full h-full object-contain cursor-crosshair"
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
              />
              
              {/* معلومات السن */}
              <div className="absolute top-4 left-4 bg-white/90 p-2 rounded-lg shadow">
                <div className="text-sm font-medium">السن {toothNumber}</div>
                <div className="text-xs text-gray-500">المنطقة: {quadrant}</div>
              </div>
            </div>

            {/* أزرار الحفظ */}
            <div className="flex gap-4 mt-4">
              <Button onClick={handleSave} className="flex-1" size="lg">
                <Save className="w-5 h-5 mr-2" />
                حفظ في ملف المريض
              </Button>
              <Button onClick={handleDownload} variant="outline" size="lg">
                <Download className="w-5 h-5 mr-2" />
                تنزيل
              </Button>
              <Button onClick={onClose} variant="outline" size="lg">
                إلغاء
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
