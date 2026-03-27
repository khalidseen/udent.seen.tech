import jsPDF from 'jspdf';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';
import type { ChartStatistics, DentalTreatmentRecord } from '@/types/dental-enhanced';
import { parseToothClinicalData, sortToothRecords } from '@/utils/dentalChart';

const CONDITION_LABELS: Record<string, string> = {
  sound: 'سليم', caries: 'تسوس', filled: 'محشو', crown: 'تاج',
  root_canal: 'علاج عصب', implant: 'زراعة', missing: 'مفقود',
  fractured: 'مكسور', periapical_lesion: 'آفة ذروية', periodontal_disease: 'مرض لثوي',
  note: 'ملاحظة',
};

const STATUS_LABELS: Record<string, string> = {
  planned: 'مخطط', in_progress: 'قيد العلاج', completed: 'مكتمل', cancelled: 'ملغي',
};

// Register Amiri font subset for Arabic - we'll use built-in font with unicode workaround
// jsPDF doesn't support Arabic natively, so we reverse text for display

function reverseArabic(text: string): string {
  // Simple RTL reversal for basic Arabic display in PDF
  return text.split('').reverse().join('');
}

export function exportDentalChartPDF(
  statistics: ChartStatistics,
  toothRecords: Map<string, DentalTreatmentRecord>,
  chartNotes: any[],
  patientName?: string,
) {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const pageWidth = doc.internal.pageSize.getWidth();
  let y = 15;

  const addLine = (text: string, size: number = 10, bold: boolean = false, align: 'left' | 'center' | 'right' = 'left') => {
    doc.setFontSize(size);
    if (bold) doc.setFont('helvetica', 'bold');
    else doc.setFont('helvetica', 'normal');
    
    const x = align === 'center' ? pageWidth / 2 : align === 'right' ? pageWidth - 15 : 15;
    doc.text(text, x, y, { align });
    y += size * 0.5 + 2;
  };

  const checkPage = () => {
    if (y > 270) { doc.addPage(); y = 15; }
  };

  // Header
  addLine('Dental Chart Report', 18, true, 'center');
  y += 2;
  addLine(`Date: ${format(new Date(), 'yyyy-MM-dd')}`, 10, false, 'center');
  if (patientName) {
    addLine(`Patient: ${patientName}`, 10, false, 'center');
  }
  y += 5;

  // Statistics
  doc.setDrawColor(200);
  doc.line(15, y, pageWidth - 15, y);
  y += 5;
  addLine('Statistics', 14, true, 'left');
  y += 2;

  const statsData = [
    ['Recorded Teeth', `${statistics.recordedTeeth} / ${statistics.totalTeeth}`],
    ['Healthy', `${statistics.healthyTeeth}`],
    ['Decayed', `${statistics.decayedTeeth}`],
    ['Filled', `${statistics.filledTeeth}`],
    ['Missing', `${statistics.missingTeeth}`],
    ['Root Canal', `${statistics.rootCanalTeeth}`],
    ['Urgent Cases', `${statistics.urgentCases}`],
  ];

  statsData.forEach(([label, value]) => {
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`${label}:`, 20, y);
    doc.setFont('helvetica', 'bold');
    doc.text(value, 70, y);
    y += 5;
  });

  y += 5;
  doc.line(15, y, pageWidth - 15, y);
  y += 5;

  // Tooth Records Table
  addLine('Tooth Records', 14, true, 'left');
  y += 3;

  // Table header
  const colX = [15, 35, 70, 110, 155];
  doc.setFillColor(240, 240, 240);
  doc.rect(15, y - 4, pageWidth - 30, 7, 'F');
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.text('Tooth #', colX[0], y);
  doc.text('Diagnosis', colX[1], y);
  doc.text('Treatment Plan', colX[2], y);
  doc.text('Status', colX[3], y);
  doc.text('Date', colX[4], y);
  y += 6;

  // Table rows
  const sortedRecords = sortToothRecords(Array.from(toothRecords.values())).map(record => [record.tooth_number, record] as const);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);

  sortedRecords.forEach(([toothNum, record]) => {
    checkPage();
    const diagLabel = CONDITION_LABELS[record.diagnosis] || record.diagnosis;
    const statusLabel = STATUS_LABELS[record.status] || record.status;
    const plan = (record.treatment_plan || '').substring(0, 40);
    const date = record.treatment_date || '';

    // Alternate row shading
    doc.text(toothNum, colX[0], y);
    doc.text(diagLabel, colX[1], y);
    doc.text(plan, colX[2], y);
    doc.text(statusLabel, colX[3], y);
    doc.text(date, colX[4], y);
    y += 5;
  });

  if (sortedRecords.length === 0) {
    doc.text('No tooth records found.', 20, y);
    y += 5;
  }

  // Surface details for each tooth
  y += 5;
  checkPage();
  doc.line(15, y, pageWidth - 15, y);
  y += 5;
  addLine('Surface Details', 14, true, 'left');
  y += 3;

  sortedRecords.forEach(([toothNum, record]) => {
    if (!record.tooth_surface) return;
    try {
      const parsed = parseToothClinicalData(record.tooth_surface);
      checkPage();
      
      doc.setFontSize(9);
      doc.setFont('helvetica', 'bold');
      doc.text(`Tooth ${toothNum}:`, 20, y);
      doc.setFont('helvetica', 'normal');
      
      const surfaceText = Object.entries(parsed.surfaces)
        .filter(([, val]) => val !== 'sound')
        .map(([key, val]) => `${key}: ${CONDITION_LABELS[val as string] || val}`)
        .join(', ');
      
      if (surfaceText) {
        doc.text(surfaceText, 50, y);
      } else {
        doc.text('All surfaces healthy', 50, y);
      }
      
      // Additional clinical info
      const extras: string[] = [];
      if (parsed.mobility > 0) extras.push(`Mobility: ${parsed.mobility}`);
      if (parsed.bleeding) extras.push('BOP: Yes');
      if (parsed.estimatedCost) extras.push(`Cost: ${parsed.estimatedCost} SAR`);
      
      if (extras.length > 0) {
        y += 4;
        doc.setFontSize(8);
        doc.text(extras.join(' | '), 50, y);
      }
      y += 5;
    } catch { /* skip */ }
  });

  // Chart Notes
  if (chartNotes.length > 0) {
    y += 5;
    checkPage();
    doc.line(15, y, pageWidth - 15, y);
    y += 5;
    addLine('Chart Notes', 14, true, 'left');
    y += 3;

    chartNotes.forEach((note: any, i: number) => {
      checkPage();
      doc.setFontSize(9);
      doc.setFont('helvetica', 'bold');
      doc.text(`${i + 1}.`, 20, y);
      doc.setFont('helvetica', 'normal');
      
      const noteText = note.notes || '';
      const dateStr = note.treatment_date ? format(new Date(note.treatment_date), 'yyyy-MM-dd') : '';
      
      // Word wrap for long notes
      const lines = doc.splitTextToSize(noteText, pageWidth - 60);
      lines.forEach((line: string) => {
        checkPage();
        doc.text(line, 28, y);
        y += 4;
      });
      
      if (dateStr) {
        doc.setFontSize(7);
        doc.setTextColor(130);
        doc.text(dateStr, 28, y);
        doc.setTextColor(0);
        y += 4;
      }
      y += 2;
    });
  }

  // Footer
  const pageCount = doc.getNumberOfPages();
  for (let p = 1; p <= pageCount; p++) {
    doc.setPage(p);
    doc.setFontSize(7);
    doc.setTextColor(150);
    doc.text(`Page ${p} of ${pageCount}`, pageWidth / 2, 290, { align: 'center' });
    doc.text(`Generated: ${format(new Date(), 'yyyy-MM-dd HH:mm')}`, 15, 290);
    doc.setTextColor(0);
  }

  doc.save(`dental-chart-${format(new Date(), 'yyyy-MM-dd')}.pdf`);
}
