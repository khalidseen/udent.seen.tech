import React, { useState, useRef, useCallback, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { ZoomIn, ZoomOut, RotateCw, Sun, Moon, Move, Download, Maximize, Home } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface MedicalImage {
  id: string;
  title: string;
  description?: string;
  image_type: string;
  file_path: string;
  image_date: string;
  is_before_treatment?: boolean;
  is_after_treatment?: boolean;
  tooth_number?: string;
}

interface EnhancedImageViewerProps {
  image: MedicalImage;
  isOpen: boolean;
  onClose: () => void;
}

export function EnhancedImageViewer({ image, isOpen, onClose }: EnhancedImageViewerProps) {
  const [imageUrl, setImageUrl] = useState<string>("");
  const [zoom, setZoom] = useState(100);
  const [brightness, setBrightness] = useState(100);
  const [contrast, setContrast] = useState(100);
  const [rotation, setRotation] = useState(0);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const imageRef = useRef<HTMLImageElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (isOpen && image.file_path) {
      loadImage();
    }
  }, [isOpen, image.file_path]);

  const loadImage = async () => {
    try {
      const { data } = await supabase.storage
        .from('medical-images')
        .createSignedUrl(image.file_path, 3600);
      
      if (data?.signedUrl) {
        setImageUrl(data.signedUrl);
      }
    } catch (error) {
      console.error('Error loading image:', error);
      toast({
        title: "خطأ في تحميل الصورة",
        description: "لم نتمكن من تحميل الصورة",
        variant: "destructive",
      });
    }
  };

  const handleZoomIn = () => {
    setZoom(prev => Math.min(500, prev + 25));
  };

  const handleZoomOut = () => {
    setZoom(prev => Math.max(25, prev - 25));
  };

  const handleRotate = () => {
    setRotation(prev => (prev + 90) % 360);
  };

  const resetImage = () => {
    setZoom(100);
    setBrightness(100);
    setContrast(100);
    setRotation(0);
    setPosition({ x: 0, y: 0 });
  };

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (zoom > 100) {
      setIsDragging(true);
      setDragStart({
        x: e.clientX - position.x,
        y: e.clientY - position.y
      });
    }
  }, [zoom, position]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (isDragging && zoom > 100) {
      setPosition({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y
      });
    }
  }, [isDragging, dragStart, zoom]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  const downloadImage = async () => {
    try {
      const response = await fetch(imageUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${image.title}.jpg`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      toast({
        title: "تم تنزيل الصورة",
        description: "تم حفظ الصورة على جهازك",
      });
    } catch (error) {
      toast({
        title: "خطأ في التنزيل",
        description: "لم نتمكن من تنزيل الصورة",
        variant: "destructive",
      });
    }
  };

  const getImageTypeIcon = (type: string) => {
    switch (type) {
      case 'xray':
        return '🦴';
      case 'ct':
        return '🔍';
      case 'mri':
        return '🧠';
      case 'photo':
        return '📷';
      default:
        return '🏥';
    }
  };

  const getImageTypeText = (type: string) => {
    switch (type) {
      case 'xray':
        return 'أشعة سينية';
      case 'ct':
        return 'أشعة مقطعية';
      case 'mri':
        return 'رنين مغناطيسي';
      case 'photo':
        return 'صورة فوتوغرافية';
      default:
        return type;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-7xl max-h-[95vh] overflow-hidden p-0">
        <div className="flex h-full">
          {/* Control Panel */}
          <div className="w-80 bg-muted/30 p-4 space-y-4 overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-lg">{image.title}</DialogTitle>
            </DialogHeader>

            {/* Image Info */}
            <Card>
              <CardContent className="p-4 space-y-3">
                <div className="flex items-center gap-2">
                  <span className="text-2xl">{getImageTypeIcon(image.image_type)}</span>
                  <Badge variant="outline">{getImageTypeText(image.image_type)}</Badge>
                </div>
                
                {image.description && (
                  <p className="text-sm text-muted-foreground">{image.description}</p>
                )}

                <div className="space-y-2 text-sm">
                  <div>
                    <span className="font-medium">التاريخ: </span>
                    {new Date(image.image_date).toLocaleDateString('ar-SA')}
                  </div>
                  
                  {image.tooth_number && (
                    <div>
                      <span className="font-medium">رقم السن: </span>
                      {image.tooth_number}
                    </div>
                  )}
                  
                  <div className="flex gap-2">
                    {image.is_before_treatment && (
                      <Badge variant="secondary" className="text-xs">قبل العلاج</Badge>
                    )}
                    {image.is_after_treatment && (
                      <Badge variant="secondary" className="text-xs">بعد العلاج</Badge>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            <Separator />

            {/* Zoom Controls */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">التكبير</span>
                <span className="text-sm text-muted-foreground">{zoom}%</span>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={handleZoomOut}>
                  <ZoomOut className="w-4 h-4" />
                </Button>
                <Slider
                  value={[zoom]}
                  onValueChange={(value) => setZoom(value[0])}
                  min={25}
                  max={500}
                  step={25}
                  className="flex-1"
                />
                <Button variant="outline" size="sm" onClick={handleZoomIn}>
                  <ZoomIn className="w-4 h-4" />
                </Button>
              </div>
            </div>

            {/* Brightness Controls */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">السطوع</span>
                <span className="text-sm text-muted-foreground">{brightness}%</span>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => setBrightness(50)}>
                  <Moon className="w-4 h-4" />
                </Button>
                <Slider
                  value={[brightness]}
                  onValueChange={(value) => setBrightness(value[0])}
                  min={25}
                  max={200}
                  step={25}
                  className="flex-1"
                />
                <Button variant="outline" size="sm" onClick={() => setBrightness(150)}>
                  <Sun className="w-4 h-4" />
                </Button>
              </div>
            </div>

            {/* Contrast Controls */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">التباين</span>
                <span className="text-sm text-muted-foreground">{contrast}%</span>
              </div>
              <Slider
                value={[contrast]}
                onValueChange={(value) => setContrast(value[0])}
                min={25}
                max={200}
                step={25}
              />
            </div>

            <Separator />

            {/* Action Buttons */}
            <div className="space-y-2">
              <div className="grid grid-cols-2 gap-2">
                <Button variant="outline" size="sm" onClick={handleRotate}>
                  <RotateCw className="w-4 h-4 ml-1" />
                  دوران
                </Button>
                <Button variant="outline" size="sm" onClick={resetImage}>
                  <Home className="w-4 h-4 ml-1" />
                  إعادة تعيين
                </Button>
              </div>
              
              <Button variant="outline" size="sm" onClick={downloadImage} className="w-full">
                <Download className="w-4 h-4 ml-2" />
                تنزيل الصورة
              </Button>
            </div>

            {zoom > 100 && (
              <div className="text-xs text-muted-foreground flex items-center gap-1">
                <Move className="w-3 h-3" />
                اسحب الصورة للتنقل
              </div>
            )}
          </div>

          {/* Image Display Area */}
          <div 
            ref={containerRef}
            className="flex-1 bg-black/90 relative overflow-hidden cursor-move"
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
          >
            {imageUrl && (
              <div className="absolute inset-0 flex items-center justify-center">
                <img
                  ref={imageRef}
                  src={imageUrl}
                  alt={image.title}
                  className="max-w-none transition-transform duration-200 select-none"
                  style={{
                    transform: `scale(${zoom / 100}) rotate(${rotation}deg) translate(${position.x}px, ${position.y}px)`,
                    filter: `brightness(${brightness}%) contrast(${contrast}%)`,
                    cursor: zoom > 100 ? 'move' : 'default'
                  }}
                  draggable={false}
                />
              </div>
            )}
            
            {!imageUrl && (
              <div className="absolute inset-0 flex items-center justify-center text-white">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto mb-4"></div>
                  <p>جاري تحميل الصورة...</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}