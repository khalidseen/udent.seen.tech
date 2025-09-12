import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import { Calendar, FileText, User, Stethoscope } from "lucide-react";

interface PDFExportDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  chartRef: React.RefObject<HTMLDivElement>;
  patientName?: string;
  patientId?: string;
}

export default function PDFExportDialog({
  isOpen,
  onOpenChange,
  chartRef,
  patientName = '',
  patientId = ''
}: PDFExportDialogProps) {
  const [exportOptions, setExportOptions] = useState({
    patientName: patientName,
    doctorName: '',
    clinicName: '',
    date: new Date().toISOString().split('T')[0],
    notes: '',
    includeChart: true,
    includeStatistics: true,
    includeNotes: true,
    includeDiagnosis: true
  });
  const [exporting, setExporting] = useState(false);

  const handleExport = async () => {
    if (!chartRef.current) {
      toast.error('لا يمكن العثور على المخطط للتصدير');
      return;
    }

    setExporting(true);
    try {
      toast.loading('جاري إنشاء ملف PDF...');

      // Create PDF document
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      
      // Add Arabic font support (if available)
      try {
        // This is a fallback - in production you'd want to load Arabic fonts
        pdf.setFont('helvetica');
      } catch (e) {
        pdf.setFont('helvetica');
      }

      let yPosition = 20;

      // Header
      pdf.setFontSize(20);
      pdf.setTextColor(0, 0, 0);
      pdf.text('تقرير مخطط الأسنان الطبي', pageWidth / 2, yPosition, { align: 'center' });
      
      yPosition += 15;
      pdf.setFontSize(12);
      pdf.text(`تاريخ التقرير: ${new Date(exportOptions.date).toLocaleDateString('ar-SA')}`, pageWidth / 2, yPosition, { align: 'center' });

      yPosition += 20;

      // Patient Information Section
      if (exportOptions.patientName || exportOptions.doctorName || exportOptions.clinicName) {
        pdf.setFontSize(14);
        pdf.setTextColor(50, 50, 50);
        pdf.text('معلومات المريض والطبيب', 20, yPosition);
        yPosition += 10;

        pdf.setFontSize(11);
        if (exportOptions.patientName) {
          pdf.text(`اسم المريض: ${exportOptions.patientName}`, 20, yPosition);
          yPosition += 7;
        }
        if (exportOptions.doctorName) {
          pdf.text(`اسم الطبيب: ${exportOptions.doctorName}`, 20, yPosition);
          yPosition += 7;
        }
        if (exportOptions.clinicName) {
          pdf.text(`اسم العيادة: ${exportOptions.clinicName}`, 20, yPosition);
          yPosition += 7;
        }
        yPosition += 10;
      }

      // Notes Section
      if (exportOptions.notes) {
        pdf.setFontSize(14);
        pdf.text('ملاحظات إضافية', 20, yPosition);
        yPosition += 10;

        pdf.setFontSize(11);
        const notesLines = pdf.splitTextToSize(exportOptions.notes, pageWidth - 40);
        pdf.text(notesLines, 20, yPosition);
        yPosition += notesLines.length * 5 + 10;
      }

      // Chart Section
      if (exportOptions.includeChart) {
        // Check if we need a new page
        if (yPosition > pageHeight - 100) {
          pdf.addPage();
          yPosition = 20;
        }

        pdf.setFontSize(14);
        pdf.text('مخطط الأسنان', 20, yPosition);
        yPosition += 15;

        // Capture chart as image
        const canvas = await html2canvas(chartRef.current, {
          scale: 1.5,
          backgroundColor: '#ffffff',
          logging: false,
          useCORS: true
        });

        const imgData = canvas.toDataURL('image/png');
        const imgWidth = pageWidth - 40;
        const imgHeight = (canvas.height * imgWidth) / canvas.width;

        // Check if image fits on current page
        if (yPosition + imgHeight > pageHeight - 20) {
          pdf.addPage();
          yPosition = 20;
        }

        pdf.addImage(imgData, 'PNG', 20, yPosition, imgWidth, imgHeight);
        yPosition += imgHeight + 20;
      }

      // Footer
      pdf.setFontSize(10);
      pdf.setTextColor(128, 128, 128);
      pdf.text(
        'هذا التقرير تم إنشاؤه تلقائياً بواسطة نظام إدارة العيادة الطبية',
        pageWidth / 2,
        pageHeight - 10,
        { align: 'center' }
      );

      // Save PDF
      const fileName = `dental-chart-${exportOptions.patientName || 'patient'}-${exportOptions.date}.pdf`;
      pdf.save(fileName);

      toast.success('تم تصدير ملف PDF بنجاح');
      onOpenChange(false);

    } catch (error) {
      console.error('Error exporting PDF:', error);
      toast.error('حدث خطأ في تصدير ملف PDF');
    } finally {
      setExporting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            تصدير مخطط الأسنان كـ PDF
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Patient and Doctor Information */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-sm font-medium">
              <User className="h-4 w-4" />
              معلومات التقرير
            </div>
            
            <div className="space-y-3">
              <div>
                <Label htmlFor="patient-name">اسم المريض</Label>
                <Input
                  id="patient-name"
                  value={exportOptions.patientName}
                  onChange={(e) => setExportOptions(prev => ({ ...prev, patientName: e.target.value }))}
                  placeholder="أدخل اسم المريض"
                />
              </div>

              <div>
                <Label htmlFor="doctor-name">اسم الطبيب</Label>
                <Input
                  id="doctor-name"
                  value={exportOptions.doctorName}
                  onChange={(e) => setExportOptions(prev => ({ ...prev, doctorName: e.target.value }))}
                  placeholder="أدخل اسم الطبيب"
                />
              </div>

              <div>
                <Label htmlFor="clinic-name">اسم العيادة</Label>
                <Input
                  id="clinic-name"
                  value={exportOptions.clinicName}
                  onChange={(e) => setExportOptions(prev => ({ ...prev, clinicName: e.target.value }))}
                  placeholder="أدخل اسم العيادة"
                />
              </div>

              <div>
                <Label htmlFor="report-date">تاريخ التقرير</Label>
                <Input
                  id="report-date"
                  type="date"
                  value={exportOptions.date}
                  onChange={(e) => setExportOptions(prev => ({ ...prev, date: e.target.value }))}
                />
              </div>
            </div>
          </div>

          <Separator />

          {/* Additional Notes */}
          <div className="space-y-3">
            <Label htmlFor="notes">ملاحظات إضافية</Label>
            <Textarea
              id="notes"
              value={exportOptions.notes}
              onChange={(e) => setExportOptions(prev => ({ ...prev, notes: e.target.value }))}
              placeholder="أضف أي ملاحظات تريد تضمينها في التقرير..."
              rows={4}
            />
          </div>

          <Separator />

          {/* Export Options */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-sm font-medium">
              <Stethoscope className="h-4 w-4" />
              محتويات التقرير
            </div>

            <div className="space-y-3">
              <div className="flex items-center space-x-2 space-x-reverse">
                <Checkbox
                  id="include-chart"
                  checked={exportOptions.includeChart}
                  onCheckedChange={(checked) => 
                    setExportOptions(prev => ({ ...prev, includeChart: Boolean(checked) }))}
                />
                <Label htmlFor="include-chart" className="text-sm">
                  تضمين مخطط الأسنان
                </Label>
              </div>

              <div className="flex items-center space-x-2 space-x-reverse">
                <Checkbox
                  id="include-statistics"
                  checked={exportOptions.includeStatistics}
                  onCheckedChange={(checked) => 
                    setExportOptions(prev => ({ ...prev, includeStatistics: Boolean(checked) }))}
                />
                <Label htmlFor="include-statistics" className="text-sm">
                  تضمين الإحصائيات
                </Label>
              </div>

              <div className="flex items-center space-x-2 space-x-reverse">
                <Checkbox
                  id="include-notes"
                  checked={exportOptions.includeNotes}
                  onCheckedChange={(checked) => 
                    setExportOptions(prev => ({ ...prev, includeNotes: Boolean(checked) }))}
                />
                <Label htmlFor="include-notes" className="text-sm">
                  تضمين الملاحظات الطبية
                </Label>
              </div>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            إلغاء
          </Button>
          <Button onClick={handleExport} disabled={exporting}>
            {exporting ? 'جاري التصدير...' : 'تصدير PDF'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}