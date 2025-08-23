import React, { useEffect, useRef, useState } from 'react';
import { Canvas as FabricCanvas, Circle, Rect, IText, FabricImage } from 'fabric';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  Pen, 
  Type, 
  Circle as CircleIcon, 
  Square, 
  Undo2, 
  Save, 
  Palette,
  X,
  RotateCcw
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
  const [isSaving, setIsSaving] = useState(false);
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
      width: 800,
      height: 600,
      backgroundColor: '#f8f9fa',
    });

    // Safely initialize drawing brush
    const initializeBrush = () => {
      try {
        // Enable drawing mode temporarily to ensure brush is created
        canvas.isDrawingMode = true;
        
        // Now we can safely access and configure the brush
        if (canvas.freeDrawingBrush) {
          canvas.freeDrawingBrush.color = activeColor;
          canvas.freeDrawingBrush.width = 3;
        }
        
        // Disable drawing mode initially
        canvas.isDrawingMode = false;
      } catch (error) {
        console.error('Error initializing brush:', error);
      }
    };

    // Initialize brush after canvas is ready
    setTimeout(initializeBrush, 50);

    // Load the image and set it as background
    const loadImageToCanvas = async () => {
      try {
        // Create FabricImage directly
        const fabricImage = await FabricImage.fromURL(imageUrl, {
          crossOrigin: 'anonymous'
        });

        // Calculate dimensions to fit the canvas
        const canvasWidth = 800;
        const canvasHeight = 600;
        const imageAspectRatio = fabricImage.width! / fabricImage.height!;
        const canvasAspectRatio = canvasWidth / canvasHeight;
        
        let renderWidth = canvasWidth;
        let renderHeight = canvasHeight;
        
        if (imageAspectRatio > canvasAspectRatio) {
          renderHeight = canvasWidth / imageAspectRatio;
        } else {
          renderWidth = canvasHeight * imageAspectRatio;
        }

        // Set canvas dimensions
        canvas.setDimensions({
          width: renderWidth,
          height: renderHeight
        });

        // Scale and position the image
        fabricImage.scaleToWidth(renderWidth);
        fabricImage.set({
          left: 0,
          top: 0,
          selectable: false,
          evented: false,
          excludeFromExport: false
        });

        // Set as background image
        canvas.backgroundImage = fabricImage;
        canvas.renderAll();
        
        toast({
          title: "تم تحميل الصورة بنجاح", 
          description: "يمكنك الآن الرسم والكتابة على الصورة",
        });

      } catch (error) {
        console.error('Error loading image:', error);
        
        // Fallback: try with HTML image and CSS background
        const img = new Image();
        img.crossOrigin = 'anonymous';
        
        img.onload = () => {
          const canvasElement = canvas.getElement();
          canvasElement.style.backgroundImage = `url(${imageUrl})`;
          canvasElement.style.backgroundSize = 'contain';
          canvasElement.style.backgroundRepeat = 'no-repeat';
          canvasElement.style.backgroundPosition = 'center';
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
      }
    };

    setFabricCanvas(canvas);
    
    // Load image after a short delay
    setTimeout(loadImageToCanvas, 200);

    return () => {
      canvas.dispose();
    };
  }, [imageUrl, activeColor, toast]);

  useEffect(() => {
    if (!fabricCanvas) return;

    // Update drawing mode based on active tool
    fabricCanvas.isDrawingMode = activeTool === 'draw';
    
    // Configure drawing brush
    if (fabricCanvas.freeDrawingBrush) {
      fabricCanvas.freeDrawingBrush.color = activeColor;
      fabricCanvas.freeDrawingBrush.width = 3;
    }

    // Set selection mode for other tools
    if (activeTool === 'select') {
      fabricCanvas.selection = true;
    } else if (activeTool !== 'draw') {
      fabricCanvas.selection = false;
    }

  }, [activeTool, activeColor, fabricCanvas]);

  const handleToolClick = (tool: typeof activeTool) => {
    if (!fabricCanvas) return;
    
    setActiveTool(tool);

    if (tool === 'rectangle') {
      const rect = new Rect({
        left: 100,
        top: 100,
        fill: 'transparent',
        stroke: activeColor,
        strokeWidth: 3,
        width: 100,
        height: 100,
      });
      fabricCanvas.add(rect);
    } else if (tool === 'circle') {
      const circle = new Circle({
        left: 100,
        top: 100,
        fill: 'transparent',
        stroke: activeColor,
        strokeWidth: 3,
        radius: 50,
      });
      fabricCanvas.add(circle);
    } else if (tool === 'text') {
      const text = new IText('اكتب هنا...', {
        left: 100,
        top: 100,
        fontFamily: 'Arial',
        fontSize: 20,
        fill: activeColor,
        textAlign: 'right'
      });
      fabricCanvas.add(text);
      fabricCanvas.setActiveObject(text);
      text.enterEditing();
    }
  };

  const handleUndo = () => {
    if (!fabricCanvas) return;
    const objects = fabricCanvas.getObjects();
    if (objects.length > 0) {
      fabricCanvas.remove(objects[objects.length - 1]);
    }
  };

  const handleClear = () => {
    if (!fabricCanvas) return;
    
    // Clear all objects but keep the background image
    const objects = fabricCanvas.getObjects();
    objects.forEach(obj => {
      fabricCanvas.remove(obj);
    });
    
    fabricCanvas.renderAll();
    
    toast({
      title: "تم مسح التعديلات",
      description: "تم الاحتفاظ بالصورة الأصلية",
    });
  };

  const handleSave = async () => {
    if (!fabricCanvas) return;
    
    setIsSaving(true);
    
    try {
      // Include background image in export by temporarily setting includeDefaultValues
      const dataURL = fabricCanvas.toDataURL({
        format: 'png',
        quality: 0.9,
        multiplier: 2, // Higher resolution
        width: fabricCanvas.width,
        height: fabricCanvas.height,
        left: 0,
        top: 0,
        enableRetinaScaling: false
      });
      
      // Get annotation data (positions, colors, etc.)
      const annotationData = {
        objects: fabricCanvas.toJSON().objects,
        canvasSize: {
          width: fabricCanvas.width,
          height: fabricCanvas.height
        },
        backgroundImage: imageUrl,
        timestamp: new Date().toISOString()
      };
      
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
          <div className="flex justify-center">
            <div className="bg-white shadow-lg rounded-lg overflow-hidden">
              <canvas ref={canvasRef} className="max-w-full max-h-full" />
            </div>
          </div>
        </div>
        
        {/* Footer */}
        <div className="p-4 border-t flex justify-between items-center">
          <Badge variant="outline" className="text-xs">
            اللون النشط: {activeColor} | الأداة: {
              activeTool === 'select' ? 'اختيار' :
              activeTool === 'draw' ? 'رسم' :
              activeTool === 'text' ? 'نص' :
              activeTool === 'circle' ? 'دائرة' : 'مربع'
            }
          </Badge>
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