import React, { useState } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { 
  ConditionType,
  ToothNumberingSystem,
  INTERNATIONAL_COLOR_SYSTEM,
  CONDITION_LABELS_AR
} from "@/types/dental-enhanced";
import { AnatomicalChartProps } from "@/types/anatomical-dental";
import { ToothRecordDialog } from "./ToothRecordDialog";
import { ColorLegend } from "./ColorLegend";
import { useDentalChart, DentalTreatmentRecord } from "@/hooks/useDentalChart";
import { Activity, AlertTriangle, CheckCircle, XCircle, Loader2, Plus, Trash2, Edit3, MessageSquare, FileDown } from "lucide-react";
import { exportDentalChartPDF } from './ExportDentalChartPDF';
import { toast } from "sonner";
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';

// FDI tooth layout
const UPPER_RIGHT = ['18','17','16','15','14','13','12','11'];
const UPPER_LEFT = ['21','22','23','24','25','26','27','28'];
const LOWER_RIGHT = ['48','47','46','45','44','43','42','41'];
const LOWER_LEFT = ['31','32','33','34','35','36','37','38'];

// FDI → Universal conversion
const FDI_TO_UNIVERSAL: Record<string, string> = {};
const UNIVERSAL_NUMS = [
  ...['18','17','16','15','14','13','12','11'].map((f, i) => [f, String(i + 1)]),
  ...['21','22','23','24','25','26','27','28'].map((f, i) => [f, String(i + 9)]),
  ...['31','32','33','34','35','36','37','38'].map((f, i) => [f, String(24 - i)]),
  ...['41','42','43','44','45','46','47','48'].map((f, i) => [f, String(25 + i)]),
];
UNIVERSAL_NUMS.forEach(([fdi, uni]) => { FDI_TO_UNIVERSAL[fdi] = uni; });

const getDisplayNumber = (fdi: string, system: ToothNumberingSystem): string => {
  if (system === ToothNumberingSystem.FDI) return fdi;
  if (system === ToothNumberingSystem.UNIVERSAL) return FDI_TO_UNIVERSAL[fdi] || fdi;
  return fdi;
};

const getConditionFromDiagnosis = (diagnosis?: string): string => diagnosis || 'sound';

const getConditionColor = (diagnosis: string): string =>
  (INTERNATIONAL_COLOR_SYSTEM as any)[diagnosis] || INTERNATIONAL_COLOR_SYSTEM.sound;

const getToothType = (fdi: string): string => {
  const d = fdi.slice(-1);
  if (d === '1' || d === '2') return 'قاطع';
  if (d === '3') return 'ناب';
  if (d === '4' || d === '5') return 'ضاحك';
  return 'طاحن';
};

const getQuadrant = (fdi: string): 'UL' | 'UR' | 'LL' | 'LR' => {
  const q = fdi[0];
  if (q === '1') return 'UR';
  if (q === '2') return 'UL';
  if (q === '3') return 'LL';
  return 'LR';
};

const getToothImagePath = (fdi: string): string | null => {
  const quadrant = getQuadrant(fdi);
  const lastDigit = fdi.slice(-1);
  switch (quadrant) {
    case 'UL': return `/teeth/U%20L/${parseInt(lastDigit) * 11}.png`;
    case 'UR': return `/teeth/U%20R/${parseInt(lastDigit) * 111}.png`;
    case 'LL': return `/teeth/L%20L/${lastDigit}.png`;
    case 'LR': return `/teeth/L%20R/${lastDigit}.png`;
  }
};

// Individual Tooth Component
const ToothItem: React.FC<{
  fdi: string; displayNumber: string; isLower: boolean;
  condition: string; conditionLabel: string; status?: string; onClick: () => void;
}> = ({ fdi, displayNumber, isLower, condition, conditionLabel, status, onClick }) => {
  const imagePath = getToothImagePath(fdi);
  const color = getConditionColor(condition);

  return (
    <TooltipProvider delayDuration={200}>
      <Tooltip>
        <TooltipTrigger asChild>
          <div
            className={`relative group cursor-pointer transition-all duration-200 hover:scale-110 hover:z-10 flex-shrink-0
              ${isLower ? 'flex flex-col-reverse' : 'flex flex-col'}`}
            onClick={onClick}
          >
            <div className={`text-[10px] font-bold text-center text-muted-foreground ${isLower ? 'mt-0.5' : 'mb-0.5'}`}>
              {displayNumber}
            </div>
            <div className="relative w-[52px] h-[68px]" style={{ margin: 0 }}>
              {imagePath ? (
                <img src={imagePath} alt={`سن ${fdi}`}
                  className={`w-full h-full object-contain ${isLower ? 'rotate-180' : ''}`}
                  onError={(e) => { e.currentTarget.style.display = 'none'; }}
                />
              ) : (
                <svg viewBox="0 0 24 24" className={`w-full h-full ${isLower ? 'rotate-180' : ''}`}>
                  <path d="M12 2C12 2 8 4 8 8V16C8 20 12 22 12 22C12 22 16 20 16 16V8C16 4 12 2 12 2Z" fill={color} />
                </svg>
              )}
              {condition !== 'sound' && (
                <div className="absolute bottom-0 left-0 w-3 h-3 rounded-full border-2 border-white shadow-sm" style={{ backgroundColor: color }} />
              )}
              {status === 'planned' && <div className="absolute top-0 right-0 w-2.5 h-2.5 rounded-full bg-amber-400 border border-white" />}
              {status === 'in_progress' && <div className="absolute top-0 right-0 w-2.5 h-2.5 rounded-full bg-blue-400 border border-white" />}
            </div>
          </div>
        </TooltipTrigger>
        <TooltipContent side={isLower ? 'bottom' : 'top'} className="text-right">
          <div className="space-y-1">
            <p className="font-bold">سن {fdi} — {getToothType(fdi)}</p>
            <p className="text-xs">الحالة: {conditionLabel}</p>
            {status && <p className="text-xs">العلاج: {status === 'planned' ? 'مخطط' : status === 'in_progress' ? 'قيد العلاج' : status === 'completed' ? 'مكتمل' : status}</p>}
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

export const AnatomicalDentalChart: React.FC<AnatomicalChartProps> = ({ patientId, onToothSelect }) => {
  const [selectedTooth, setSelectedTooth] = useState<string | null>(null);
  const [showDialog, setShowDialog] = useState(false);
  const [numberingSystem, setNumberingSystem] = useState<ToothNumberingSystem>(ToothNumberingSystem.FDI);
  const [showAlternativeNumbers, setShowAlternativeNumbers] = useState(false);
  const [chartNote, setChartNote] = useState('');
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);

  const { toothRecordsMap, statistics, isLoading, saveToothRecord, isSaving, getToothHistory, treatments } = useDentalChart(patientId || '');

  // Chart notes are stored with tooth_number = 'chart_note'
  const chartNotes = (treatments || []).filter(t => t.tooth_number === 'chart_note').sort((a: any, b: any) => 
    new Date(b.created_at || b.treatment_date).getTime() - new Date(a.created_at || a.treatment_date).getTime()
  );

  const handleToothClick = (fdi: string) => {
    setSelectedTooth(fdi);
    onToothSelect(fdi);
    setShowDialog(true);
  };

  const handleSaveRecord = async (data: Omit<DentalTreatmentRecord, 'id' | 'clinic_id'> & { id?: string }) => {
    try {
      await saveToothRecord(data);
      toast.success('تم حفظ سجل السن بنجاح');
      setShowDialog(false);
    } catch (err: any) {
      toast.error('فشل في حفظ السجل: ' + (err?.message || 'خطأ غير معروف'));
    }
  };

  const handleSaveChartNote = async () => {
    if (!chartNote.trim()) return;
    try {
      await saveToothRecord({
        id: editingNoteId || undefined,
        patient_id: patientId || '',
        tooth_number: 'chart_note',
        numbering_system: 'fdi',
        diagnosis: 'note',
        treatment_plan: '',
        status: 'completed',
        notes: chartNote.trim(),
        treatment_date: format(new Date(), 'yyyy-MM-dd'),
      });
      toast.success(editingNoteId ? 'تم تحديث الملاحظة' : 'تم حفظ الملاحظة');
      setChartNote('');
      setEditingNoteId(null);
    } catch (err: any) {
      toast.error('فشل في حفظ الملاحظة');
    }
  };

  const startEditNote = (note: any) => {
    setChartNote(note.notes || '');
    setEditingNoteId(note.id);
  };

  const selectedRecord = selectedTooth ? toothRecordsMap.get(selectedTooth) || null : null;

  const renderToothRow = (teeth: string[], isLower: boolean) => (
    <div className="flex justify-center items-center gap-0">
      {teeth.map(fdi => {
        const record = toothRecordsMap.get(fdi);
        const condition = getConditionFromDiagnosis(record?.diagnosis);
        const conditionLabel = (CONDITION_LABELS_AR as any)[condition] || condition;
        const display = showAlternativeNumbers
          ? `${getDisplayNumber(fdi, numberingSystem)} (${fdi})`
          : getDisplayNumber(fdi, numberingSystem);
        return (
          <ToothItem key={fdi} fdi={fdi} displayNumber={display} isLower={isLower}
            condition={condition} conditionLabel={conditionLabel} status={record?.status}
            onClick={() => handleToothClick(fdi)} />
        );
      })}
    </div>
  );

  return (
    <div className="w-full max-w-7xl mx-auto space-y-4">
      {/* Statistics Bar */}
      <div className="grid grid-cols-4 md:grid-cols-8 gap-2">
        {[
          { label: 'مسجلة', value: statistics.recordedTeeth, icon: Activity, color: 'text-primary' },
          { label: 'سليمة', value: statistics.healthyTeeth, icon: CheckCircle, color: 'text-green-600' },
          { label: 'تسوس', value: statistics.decayedTeeth, icon: AlertTriangle, color: 'text-red-600' },
          { label: 'محشوة', value: statistics.filledTeeth, icon: CheckCircle, color: 'text-blue-600' },
          { label: 'مفقودة', value: statistics.missingTeeth, icon: XCircle, color: 'text-muted-foreground' },
          { label: 'علاج عصب', value: statistics.rootCanalTeeth, icon: Activity, color: 'text-pink-600' },
          { label: 'عاجلة', value: statistics.urgentCases, icon: AlertTriangle, color: 'text-amber-600' },
          { label: 'الإجمالي', value: `${statistics.recordedTeeth}/32`, icon: Activity, color: 'text-muted-foreground' },
        ].map((stat, i) => (
          <div key={i} className="flex flex-col items-center p-2 rounded-lg border bg-card text-center">
            <stat.icon className={`w-4 h-4 ${stat.color} mb-1`} />
            <span className="text-lg font-bold">{stat.value}</span>
            <span className="text-[10px] text-muted-foreground">{stat.label}</span>
          </div>
        ))}
      </div>

      {/* Dental Chart */}
      <Card className="border-none shadow-sm">
        <CardContent className="p-4 space-y-2">
          {isLoading && (
            <div className="flex items-center justify-center py-4 gap-2 text-muted-foreground">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span className="text-sm">جاري تحميل بيانات المخطط...</span>
            </div>
          )}
          <div className="text-center mb-2"><Badge variant="outline" className="text-xs">الفك العلوي</Badge></div>
          <div className="flex justify-center items-end">
            {renderToothRow(UPPER_RIGHT, false)}
            <div className="w-px h-16 bg-border mx-1" />
            {renderToothRow(UPPER_LEFT, false)}
          </div>
          <div className="h-px bg-border my-2" />
          <div className="flex justify-center items-start">
            {renderToothRow(LOWER_RIGHT, true)}
            <div className="w-px h-16 bg-border mx-1" />
            {renderToothRow(LOWER_LEFT, true)}
          </div>
          <div className="text-center mt-2"><Badge variant="outline" className="text-xs">الفك السفلي</Badge></div>
        </CardContent>
      </Card>

      {/* Chart Notes Section */}
      <Card className="border bg-muted/20">
        <CardContent className="p-4 space-y-3">
          <div className="flex items-center gap-2 mb-1">
            <MessageSquare className="w-4 h-4 text-primary" />
            <Label className="text-sm font-semibold">ملاحظات على المخطط</Label>
          </div>
          <div className="flex gap-2">
            <Textarea
              value={chartNote}
              onChange={e => setChartNote(e.target.value)}
              placeholder="اكتب ملاحظة عامة على المخطط السني..."
              rows={2}
              className="resize-none text-sm flex-1"
            />
            <div className="flex flex-col gap-1">
              <Button size="sm" onClick={handleSaveChartNote} disabled={!chartNote.trim() || isSaving} className="h-8">
                <Plus className="w-3.5 h-3.5 ml-1" />
                {editingNoteId ? 'تحديث' : 'حفظ'}
              </Button>
              {editingNoteId && (
                <Button size="sm" variant="ghost" onClick={() => { setChartNote(''); setEditingNoteId(null); }} className="h-8 text-xs">
                  إلغاء
                </Button>
              )}
            </div>
          </div>

          {chartNotes.length > 0 && (
            <div className="space-y-2 pt-2 border-t">
              {chartNotes.map((note: any) => (
                <div key={note.id} className="flex items-start gap-2 p-2 rounded-lg border bg-background text-sm">
                  <div className="flex-1">
                    <p className="text-foreground">{note.notes}</p>
                    <p className="text-[10px] text-muted-foreground mt-1">
                      {note.treatment_date && format(new Date(note.treatment_date), 'PPP', { locale: ar })}
                    </p>
                  </div>
                  <Button variant="ghost" size="icon" className="h-6 w-6 shrink-0" onClick={() => startEditNote(note)}>
                    <Edit3 className="w-3 h-3" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Numbering System Controls */}
      <Card className="border bg-muted/30">
        <CardContent className="p-3">
          <div className="flex flex-wrap items-center gap-4 justify-center">
            <div className="flex items-center gap-2">
              <Label className="text-xs">نظام الترقيم:</Label>
              <Select value={numberingSystem} onValueChange={v => setNumberingSystem(v as ToothNumberingSystem)}>
                <SelectTrigger className="w-44 h-8 text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value={ToothNumberingSystem.FDI}>FDI (11-48) — دولي</SelectItem>
                  <SelectItem value={ToothNumberingSystem.UNIVERSAL}>Universal (1-32) — أمريكي</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-2">
              <Switch id="alt-nums" checked={showAlternativeNumbers} onCheckedChange={setShowAlternativeNumbers} />
              <Label htmlFor="alt-nums" className="text-xs">إظهار FDI البديل</Label>
            </div>
          </div>
        </CardContent>
      </Card>

      <ColorLegend compact={false} showDescriptions={true} />

      {selectedTooth && (
        <ToothRecordDialog isOpen={showDialog} onClose={() => setShowDialog(false)}
          toothNumber={selectedTooth} existingRecord={selectedRecord} patientId={patientId || ''}
          onSave={handleSaveRecord} isSaving={isSaving} toothHistory={getToothHistory(selectedTooth)}
        />
      )}
    </div>
  );
};
