import React, { useEffect, useRef, useState } from 'react';
import { Canvas as FabricCanvas, Circle, Rect, IText, FabricImage, PencilBrush, Pattern } from 'fabric';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Slider } from '@/components/ui/slider';
import { 
  Pen, 
  Type, 
  Circle as CircleIcon, 
  Square, 
  Undo2, 
  Save, 
  Palette,
  X,
  RotateCcw,
  MousePointer2,
  ZoomIn,
  ZoomOut
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface ImageAnnotationEditorProps {
  imageUrl: string;
  onSave: (annotatedImageUrl: string, annotationData: any) => Promise<void>;
  onClose: () => void;
}

export function ImageAnnotationEditor({ imageUrl, onSave, onClose }: ImageAnnotationEditorProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [fabricCanvas, setFabricCanvas] = useState<FabricCanvas | null>(null);
  const [activeColor, setActiveColor] = useState('#ef4444');
  const [activeTool, setActiveTool] = useState<'select' | 'draw' | 'text' | 'circle' | 'rectangle'>('select');
  const [brushWidth, setBrushWidth] = useState(3);
  const [isSaving, setIsSaving] = useState(false);
  const [backgroundImage, setBackgroundImage] = useState<FabricImage | null>(null);
  const { toast } = useToast();

  const colors = [
    '#ef4444', // red
    '#f97316', // orange
    '#eab308', // yellow
    '#22c55e', // green
    '#3b82f6', // blue
    '#8b5cf6', // purple
    '#000000', // black
    '#ffffff', // white
  ];

  useEffect(() => {
    if (!canvasRef.current) return;

    const canvas = new FabricCanvas(canvasRef.current, {
      width: 1000,
      height: 700,
      backgroundColor: '#ffffff',
    });

    // Create and configure PencilBrush manually
    const pencilBrush = new PencilBrush(canvas);
    pencilBrush.color = activeColor;
    pencilBrush.width = brushWidth;
    canvas.freeDrawingBrush = pencilBrush;

    // Load the image and add it as canvas object
    const loadImageToCanvas = async () => {
      try {
        // Try different approaches to load the image
        console.log('Loading image:', imageUrl);
        
        // First, try to load with a regular Image element to check accessibility
        const testImg = new Image();
        testImg.crossOrigin = 'anonymous';
        
        const imageLoaded = new Promise<HTMLImageElement>((resolve, reject) => {
          testImg.onload = () => resolve(testImg);
          testImg.onerror = () => reject(new Error('Failed to load image'));
          testImg.src = imageUrl;
        });

        const img = await imageLoaded;
        
        // Now create FabricImage from the loaded Image element
        const fabricImage = new FabricImage(img, {
          crossOrigin: 'anonymous'
        });

        // Calculate dimensions to fit the canvas while maintaining aspect ratio
        const maxWidth = 1000;
        const maxHeight = 700;
        const imageWidth = img.naturalWidth || img.width;
        const imageHeight = img.naturalHeight || img.height;
        
        let scaleX = maxWidth / imageWidth;
        let scaleY = maxHeight / imageHeight;
        let scale = Math.min(scaleX, scaleY);
        
        // Apply reasonable scaling limits
        if (scale < 0.3) scale = 0.3;
        if (scale > 2) scale = 2;

        const scaledWidth = imageWidth * scale;
        const scaledHeight = imageHeight * scale;

        // Update canvas dimensions to fit the image
        canvas.setDimensions({
          width: scaledWidth,
          height: scaledHeight
        });

        // Set image properties
        fabricImage.set({
          left: 0,
          top: 0,
          scaleX: scale,
          scaleY: scale,
          selectable: false,
          evented: false,
          excludeFromExport: false,
          name: 'backgroundImage'
        });

        // Add image as the first object (background)
        canvas.add(fabricImage);
        canvas.sendObjectToBack(fabricImage);
        
        setBackgroundImage(fabricImage);
        canvas.renderAll();
        
        toast({
          title: "تم تحميل الصورة بنجاح", 
          description: "يمكنك الآن الرسم والكتابة على الصورة",
        });

      } catch (error) {
        console.error('Error loading image with FabricImage:', error);
        
        // Fallback: Create a canvas with background image using CSS
        try {
          const img = new Image();
          img.crossOrigin = 'anonymous';
          
          img.onload = () => {
            // Set canvas size based on image dimensions
            const maxWidth = 1000;
            const maxHeight = 700;
            const imageWidth = img.naturalWidth || img.width;
            const imageHeight = img.naturalHeight || img.height;
            
            let scaleX = maxWidth / imageWidth;
            let scaleY = maxHeight / imageHeight;
            let scale = Math.min(scaleX, scaleY);
            
            const scaledWidth = imageWidth * scale;
            const scaledHeight = imageHeight * scale;
            
            canvas.setDimensions({
              width: scaledWidth,
              height: scaledHeight
            });
            
             // Create a rectangle to serve as background with image fill
             const bgRect = new Rect({
               left: 0,
               top: 0,
               width: scaledWidth,
               height: scaledHeight,
               fill: new Pattern({
                 source: img,
                 repeat: 'no-repeat'
               }),
               selectable: false,
               evented: false,
               excludeFromExport: false,
               name: 'backgroundImage'
             });
            
            canvas.add(bgRect);
            canvas.sendObjectToBack(bgRect);
            setBackgroundImage(bgRect as any);
            canvas.renderAll();
            
            toast({
              title: "تم تحميل الصورة", 
              description: "يمكنك الآن الرسم والكتابة على الصورة",
            });
          };
          
          img.onerror = () => {
            toast({
              title: "خطأ في تحميل الصورة",
              description: "تأكد من أن الصورة موجودة ومتاحة",
              variant: "destructive",
            });
          };
          
          img.src = imageUrl;
          
        } catch (fallbackError) {
          console.error('Fallback image loading failed:', fallbackError);
          toast({
            title: "خطأ في تحميل الصورة",
            description: "فشل في تحميل الصورة، تحقق من الرابط",
            variant: "destructive",
          });
        }
      }
    };

    setFabricCanvas(canvas);
    loadImageToCanvas();

    return () => {
      canvas.dispose();
    };
  }, [imageUrl, toast]);

  useEffect(() => {
    if (!fabricCanvas || !fabricCanvas.freeDrawingBrush) return;

    // Update drawing mode based on active tool
    fabricCanvas.isDrawingMode = activeTool === 'draw';
    
    // Configure drawing brush
    fabricCanvas.freeDrawingBrush.color = activeColor;
    fabricCanvas.freeDrawingBrush.width = brushWidth;

    // Set selection mode for other tools
    if (activeTool === 'select') {
      fabricCanvas.selection = true;
    } else if (activeTool !== 'draw') {
      fabricCanvas.selection = false;
    }

  }, [activeTool, activeColor, brushWidth, fabricCanvas]);

  const handleToolClick = (tool: typeof activeTool) => {
    if (!fabricCanvas) return;
    
    setActiveTool(tool);

    if (tool === 'rectangle') {
      const rect = new Rect({
        left: fabricCanvas.width! / 2 - 50,
        top: fabricCanvas.height! / 2 - 50,
        fill: 'transparent',
        stroke: activeColor,
        strokeWidth: brushWidth,
        width: 100,
        height: 100,
      });
      fabricCanvas.add(rect);
      fabricCanvas.setActiveObject(rect);
    } else if (tool === 'circle') {
      const circle = new Circle({
        left: fabricCanvas.width! / 2 - 50,
        top: fabricCanvas.height! / 2 - 50,
        fill: 'transparent',
        stroke: activeColor,
        strokeWidth: brushWidth,
        radius: 50,
      });
      fabricCanvas.add(circle);
      fabricCanvas.setActiveObject(circle);
    } else if (tool === 'text') {
      const text = new IText('اكتب هنا...', {
        left: fabricCanvas.width! / 2 - 50,
        top: fabricCanvas.height! / 2 - 10,
        fontFamily: 'Arial, sans-serif',
        fontSize: 20,
        fill: activeColor,
        textAlign: 'center'
      });
      fabricCanvas.add(text);
      fabricCanvas.setActiveObject(text);
      text.enterEditing();
    }
  };

  const handleUndo = () => {
    if (!fabricCanvas) return;
    const objects = fabricCanvas.getObjects();
    // Don't remove the background image when undoing
    const nonBackgroundObjects = objects.filter(obj => obj.get('name') !== 'backgroundImage');
    if (nonBackgroundObjects.length > 0) {
      fabricCanvas.remove(nonBackgroundObjects[nonBackgroundObjects.length - 1]);
    }
  };

  const handleClear = () => {
    if (!fabricCanvas) return;
    
    // Clear all objects except the background image
    const objects = fabricCanvas.getObjects();
    objects.forEach(obj => {
      if (obj.get('name') !== 'backgroundImage') {
        fabricCanvas.remove(obj);
      }
    });
    
    fabricCanvas.renderAll();
    
    toast({
      title: "تم مسح التعديلات",
      description: "تم الاحتفاظ بالصورة الأصلية",
    });
  };

  const handleZoom = (direction: 'in' | 'out') => {
    if (!fabricCanvas) return;
    
    const zoom = fabricCanvas.getZoom();
    const newZoom = direction === 'in' ? zoom * 1.2 : zoom * 0.8;
    
    if (newZoom >= 0.5 && newZoom <= 3) {
      fabricCanvas.setZoom(newZoom);
      fabricCanvas.renderAll();
    }
  };

  const handleSave = async () => {
    if (!fabricCanvas) return;
    
    setIsSaving(true);
    
    try {
      console.log('Starting save process...');
      
      // Ensure all objects are visible and properly rendered
      fabricCanvas.renderAll();
      
      // Export the canvas as high-quality image
      const dataURL = fabricCanvas.toDataURL({
        format: 'png',
        quality: 1.0,
        multiplier: 1,
        enableRetinaScaling: false
      });
      
      console.log('Canvas exported to dataURL, length:', dataURL.length);
      
      // Get annotation data for future editing (excluding background image)
      const allObjects = fabricCanvas.getObjects();
      const annotationObjects = allObjects.filter(obj => obj.get('name') !== 'backgroundImage');
      
      const annotationData = {
        objects: annotationObjects.map(obj => {
          const objData = obj.toJSON();
          return {
            ...objData,
            // Preserve important properties
            fill: obj.get('fill'),
            stroke: obj.get('stroke'),
            strokeWidth: obj.get('strokeWidth'),
          };
        }),
        canvasSize: {
          width: fabricCanvas.width,
          height: fabricCanvas.height
        },
        backgroundImage: imageUrl,
        timestamp: new Date().toISOString(),
        brushWidth,
        activeColor,
        hasAnnotations: annotationObjects.length > 0
      };
      
      console.log('Annotation data prepared:', annotationData);
      
      // Call the save function
      await onSave(dataURL, annotationData);
      
      toast({
        title: "تم الحفظ بنجاح",
        description: "تم حفظ الصورة المعدلة في سجل المريض",
      });
      
      onClose();
      
    } catch (error) {
      console.error('Error saving annotation:', error);
      toast({
        title: "خطأ في الحفظ",
        description: "حدث خطأ أثناء حفظ الصورة المعدلة",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50">
      <div className="bg-background rounded-lg shadow-lg max-w-6xl w-full max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="p-4 border-b flex justify-between items-center">
          <h3 className="text-lg font-semibold">محرر الصور الطبية</h3>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="w-4 h-4" />
          </Button>
        </div>
        
        {/* Toolbar */}
        <div className="p-4 border-b">
          <div className="flex flex-wrap gap-2 items-center">
            {/* Tools */}
            <div className="flex gap-1">
              <Button
                variant={activeTool === 'select' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setActiveTool('select')}
              >
                <MousePointer2 className="w-4 h-4 ml-1" />
                اختيار
              </Button>
              <Button
                variant={activeTool === 'draw' ? 'default' : 'outline'}
                size="sm"
                onClick={() => handleToolClick('draw')}
              >
                <Pen className="w-4 h-4 ml-1" />
                رسم
              </Button>
              <Button
                variant={activeTool === 'text' ? 'default' : 'outline'}
                size="sm"
                onClick={() => handleToolClick('text')}
              >
                <Type className="w-4 h-4 ml-1" />
                نص
              </Button>
              <Button
                variant={activeTool === 'circle' ? 'default' : 'outline'}
                size="sm"
                onClick={() => handleToolClick('circle')}
              >
                <CircleIcon className="w-4 h-4 ml-1" />
                دائرة
              </Button>
              <Button
                variant={activeTool === 'rectangle' ? 'default' : 'outline'}
                size="sm"
                onClick={() => handleToolClick('rectangle')}
              >
                <Square className="w-4 h-4 ml-1" />
                مربع
              </Button>
            </div>
            
            <Separator orientation="vertical" className="h-6" />
            
            {/* Brush Width */}
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">سُمك:</span>
              <Slider
                value={[brushWidth]}
                onValueChange={(values) => setBrushWidth(values[0])}
                max={20}
                min={1}
                step={1}
                className="w-20"
              />
              <span className="text-xs text-muted-foreground min-w-[20px]">{brushWidth}</span>
            </div>
            
            <Separator orientation="vertical" className="h-6" />
            
            {/* Colors */}
            <div className="flex gap-1 items-center">
              <Palette className="w-4 h-4 text-muted-foreground" />
              {colors.map((color) => (
                <Button
                  key={color}
                  variant="outline"
                  size="sm"
                  className={`w-8 h-8 p-0 ${activeColor === color ? 'ring-2 ring-primary' : ''}`}
                  style={{ backgroundColor: color }}
                  onClick={() => setActiveColor(color)}
                />
              ))}
            </div>
            
            <Separator orientation="vertical" className="h-6" />
            
            {/* Zoom */}
            <div className="flex gap-1">
              <Button variant="outline" size="sm" onClick={() => handleZoom('in')}>
                <ZoomIn className="w-4 h-4" />
              </Button>
              <Button variant="outline" size="sm" onClick={() => handleZoom('out')}>
                <ZoomOut className="w-4 h-4" />
              </Button>
            </div>
            
            <Separator orientation="vertical" className="h-6" />
            
            {/* Actions */}
            <Button variant="outline" size="sm" onClick={handleUndo}>
              <Undo2 className="w-4 h-4 ml-1" />
              تراجع
            </Button>
            <Button variant="outline" size="sm" onClick={handleClear}>
              <RotateCcw className="w-4 h-4 ml-1" />
              مسح الكل
            </Button>
          </div>
        </div>
        
        {/* Canvas Container */}
        <div className="flex-1 overflow-auto p-4 bg-gray-50 dark:bg-gray-900">
          <div className="flex justify-center items-center min-h-full">
            <div className="bg-white shadow-lg rounded-lg overflow-hidden">
              <canvas ref={canvasRef} className="max-w-full max-h-full border border-gray-200" />
            </div>
          </div>
        </div>
        
        {/* Footer */}
        <div className="p-4 border-t flex justify-between items-center">
          <div className="flex gap-2">
            <Badge variant="outline" className="text-xs">
              الأداة: {
                activeTool === 'select' ? 'اختيار' :
                activeTool === 'draw' ? 'رسم' :
                activeTool === 'text' ? 'نص' :
                activeTool === 'circle' ? 'دائرة' : 'مربع'
              }
            </Badge>
            <Badge variant="outline" className="text-xs">
              السُمك: {brushWidth}px
            </Badge>
            <Badge 
              variant="outline" 
              className="text-xs flex items-center gap-1"
            >
              <div 
                className="w-3 h-3 rounded-full border border-gray-300" 
                style={{ backgroundColor: activeColor }}
              />
              اللون
            </Badge>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={onClose}>
              إلغاء
            </Button>
            <Button onClick={handleSave} disabled={isSaving}>
              <Save className="w-4 h-4 ml-1" />
              {isSaving ? 'جاري الحفظ...' : 'حفظ التعديلات'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}