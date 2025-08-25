import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { ZoomIn, ZoomOut, RotateCcw, Move, Download } from "lucide-react";
import RealisticToothChart from "./RealisticToothChart";
import { toast } from "sonner";
import html2canvas from "html2canvas";

interface ZoomableToothChartProps {
  patientId?: string;
  onToothSelect?: (toothNumber: string, numberingSystem: string) => void;
  selectedTooth?: string;
  numberingSystem?: 'universal' | 'palmer' | 'fdi';
}

export default function ZoomableToothChart({
  patientId,
  onToothSelect,
  selectedTooth,
  numberingSystem = 'fdi'
}: ZoomableToothChartProps) {
  const [zoomLevel, setZoomLevel] = useState(1);
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [lastPanPoint, setLastPanPoint] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  
  const chartRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleZoomIn = () => {
    setZoomLevel(prev => Math.min(prev + 0.25, 3));
  };

  const handleZoomOut = () => {
    setZoomLevel(prev => Math.max(prev - 0.25, 0.5));
  };

  const handleReset = () => {
    setZoomLevel(1);
    setPanOffset({ x: 0, y: 0 });
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button === 0 && e.ctrlKey) { // Ctrl + Left click for panning
      setIsPanning(true);
      setIsDragging(true);
      setLastPanPoint({ x: e.clientX, y: e.clientY });
      e.preventDefault();
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isPanning && isDragging) {
      const deltaX = e.clientX - lastPanPoint.x;
      const deltaY = e.clientY - lastPanPoint.y;
      
      setPanOffset(prev => ({
        x: prev.x + deltaX,
        y: prev.y + deltaY
      }));
      
      setLastPanPoint({ x: e.clientX, y: e.clientY });
    }
  };

  const handleMouseUp = () => {
    setIsPanning(false);
    setIsDragging(false);
  };

  const handleWheel = (e: React.WheelEvent) => {
    if (e.ctrlKey) {
      e.preventDefault();
      const delta = e.deltaY > 0 ? -0.1 : 0.1;
      setZoomLevel(prev => Math.max(0.5, Math.min(3, prev + delta)));
    }
  };

  const handlePrintChart = async () => {
    if (!chartRef.current) return;

    try {
      toast.loading('جاري تحضير المخطط للطباعة...');
      
      const canvas = await html2canvas(chartRef.current, {
        scale: 2,
        backgroundColor: '#ffffff',
        logging: false,
        useCORS: true
      });

      // Create a new window for printing
      const printWindow = window.open('', '_blank');
      if (!printWindow) {
        toast.error('فشل في فتح نافذة الطباعة');
        return;
      }

      printWindow.document.write(`
        <html>
          <head>
            <title>مخطط الأسنان - طباعة</title>
            <style>
              body { 
                margin: 0; 
                padding: 20px; 
                font-family: Arial, sans-serif; 
                display: flex; 
                flex-direction: column; 
                align-items: center;
              }
              .header {
                text-align: center;
                margin-bottom: 20px;
                border-bottom: 2px solid #333;
                padding-bottom: 10px;
                width: 100%;
              }
              .chart-container {
                display: flex;
                justify-content: center;
                width: 100%;
              }
              .footer {
                margin-top: 20px;
                text-align: center;
                font-size: 12px;
                color: #666;
                width: 100%;
              }
              @media print {
                body { -webkit-print-color-adjust: exact; }
              }
            </style>
          </head>
          <body>
            <div class="header">
              <h1>مخطط الأسنان الطبي</h1>
              <p>تاريخ الطباعة: ${new Date().toLocaleDateString('ar-SA')}</p>
            </div>
            <div class="chart-container">
              <img src="${canvas.toDataURL()}" style="max-width: 100%; height: auto;" />
            </div>
            <div class="footer">
              <p>هذا المخطط تم إنشاؤه تلقائياً بواسطة نظام إدارة العيادة</p>
            </div>
          </body>
        </html>
      `);

      printWindow.document.close();
      
      // Wait for image to load then print
      setTimeout(() => {
        printWindow.print();
        toast.success('تم تحضير المخطط للطباعة');
      }, 1000);

    } catch (error) {
      console.error('Error generating print chart:', error);
      toast.error('حدث خطأ في تحضير المخطط للطباعة');
    }
  };

  const handleDownloadImage = async () => {
    if (!chartRef.current) return;

    try {
      toast.loading('جاري تحضير الصورة للتحميل...');
      
      const canvas = await html2canvas(chartRef.current, {
        scale: 2,
        backgroundColor: '#ffffff',
        logging: false,
        useCORS: true
      });

      // Create download link
      const link = document.createElement('a');
      link.download = `dental-chart-${new Date().toISOString().split('T')[0]}.png`;
      link.href = canvas.toDataURL();
      link.click();

      toast.success('تم تحميل مخطط الأسنان');
    } catch (error) {
      console.error('Error downloading chart:', error);
      toast.error('حدث خطأ في تحميل المخطط');
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>مخطط الأسنان التفاعلي</span>
          
          {/* Zoom and Action Controls */}
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 border rounded-lg p-1">
              <Button size="sm" variant="ghost" onClick={handleZoomOut} disabled={zoomLevel <= 0.5}>
                <ZoomOut className="h-4 w-4" />
              </Button>
              <span className="text-sm font-mono min-w-[3rem] text-center">
                {Math.round(zoomLevel * 100)}%
              </span>
              <Button size="sm" variant="ghost" onClick={handleZoomIn} disabled={zoomLevel >= 3}>
                <ZoomIn className="h-4 w-4" />
              </Button>
            </div>
            
            <Separator orientation="vertical" className="h-6" />
            
            <Button size="sm" variant="ghost" onClick={handleReset} title="إعادة تعيين">
              <RotateCcw className="h-4 w-4" />
            </Button>
            
            <Button size="sm" variant="ghost" onClick={handleDownloadImage} title="تحميل كصورة">
              <Download className="h-4 w-4" />
            </Button>
          </div>
        </CardTitle>
        
        <div className="text-sm text-muted-foreground space-y-1">
          <p>• استخدم عجلة الماوس مع Ctrl للتكبير والتصغير</p>
          <p>• اضغط Ctrl + انقر واسحب للتحريك</p>
          <p>• انقر مرتين على أي سن لتعديل حالته</p>
        </div>
      </CardHeader>

      <CardContent>
        <div 
          ref={containerRef}
          className="relative overflow-hidden border rounded-lg bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950 dark:to-indigo-950"
          style={{ height: '600px' }}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          onWheel={handleWheel}
        >
          <div
            ref={chartRef}
            className="absolute inset-0 transition-transform duration-200 ease-out"
            style={{
              transform: `scale(${zoomLevel}) translate(${panOffset.x / zoomLevel}px, ${panOffset.y / zoomLevel}px)`,
              transformOrigin: 'center center',
              cursor: isPanning ? 'grabbing' : 'grab'
            }}
          >
            <div className="p-8 flex items-center justify-center min-h-full">
              <RealisticToothChart
                patientId={patientId}
                onToothSelect={onToothSelect}
                selectedTooth={selectedTooth}
                numberingSystem={numberingSystem}
              />
            </div>
          </div>

          {/* Pan Mode Indicator */}
          {isPanning && (
            <div className="absolute top-4 left-4 bg-primary text-primary-foreground px-3 py-1 rounded-full text-sm flex items-center gap-2">
              <Move className="h-4 w-4" />
              وضع التحريك
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex justify-center gap-2 mt-4">
          <Button onClick={handlePrintChart} variant="outline" className="flex items-center gap-2">
            <Download className="h-4 w-4" />
            طباعة المخطط
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}