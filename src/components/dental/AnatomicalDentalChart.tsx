import React, { Profiler, useCallback, useMemo, useState } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { 
  ToothNumberingSystem,
  INTERNATIONAL_COLOR_SYSTEM,
  CONDITION_LABELS_AR,
  type DentalTreatmentRecord,
} from "@/types/dental-enhanced";
import { AnatomicalChartProps } from "@/types/anatomical-dental";
import { ToothRecordDialog } from "./ToothRecordDialog";
import { ColorLegend } from "./ColorLegend";
import { DentalChartActionsAndStats } from './DentalChartActionsAndStats';
import { DentalChartNotesPanel } from './DentalChartNotesPanel';
import { useDentalChart } from "@/hooks/useDentalChart";
import { Loader2 } from "lucide-react";
import { exportDentalChartPDF } from './ExportDentalChartPDF';
import { toast } from "sonner";
import { format } from 'date-fns';
import { logger } from '@/lib/logger';
import { CHART_NOTE_TOOTH_NUMBER, FDI_DISPLAY_ORDER, FDI_PERMANENT_ROWS, FDI_TO_UNIVERSAL, getQuadrant, getToothKind } from '@/utils/dentalChart';

const getDisplayNumber = (fdi: string, system: ToothNumberingSystem): string => {
  if (system === ToothNumberingSystem.FDI) return fdi;
  if (system === ToothNumberingSystem.UNIVERSAL) return FDI_TO_UNIVERSAL[fdi] || fdi;
  return fdi;
};

const getConditionFromDiagnosis = (diagnosis?: string): string => diagnosis || 'sound';

const getConditionColor = (diagnosis: string): string =>
  (INTERNATIONAL_COLOR_SYSTEM as any)[diagnosis] || INTERNATIONAL_COLOR_SYSTEM.sound;

const CONDITION_DOT_CLASSES: Record<string, string> = {
  sound: 'bg-green-500',
  caries: 'bg-red-500',
  filled: 'bg-blue-500',
  crown: 'bg-purple-500',
  root_canal: 'bg-pink-500',
  implant: 'bg-slate-500',
  missing: 'bg-gray-500',
  fractured: 'bg-orange-500',
  periapical_lesion: 'bg-amber-500',
  periodontal_disease: 'bg-lime-500',
  has_notes: 'bg-indigo-500',
};

const getToothType = (fdi: string): string => {
  const type = getToothKind(fdi);
  if (type === 'incisor') return 'قاطع';
  if (type === 'canine') return 'ناب';
  if (type === 'premolar') return 'ضاحك';
  return 'طاحن';
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
  condition: string; conditionLabel: string; status?: string; onSelect: (fdi: string) => void;
}> = React.memo(({ fdi, displayNumber, isLower, condition, conditionLabel, status, onSelect }) => {
  const imagePath = getToothImagePath(fdi);
  const color = getConditionColor(condition);
  const dotClass = CONDITION_DOT_CLASSES[condition] || 'bg-muted-foreground';

  return (
    <TooltipProvider delayDuration={200}>
      <Tooltip>
        <TooltipTrigger asChild>
          <div
            className={`relative group cursor-pointer transition-all duration-200 hover:scale-110 hover:z-10 flex-shrink-0
              ${isLower ? 'flex flex-col-reverse' : 'flex flex-col'}`}
            onClick={() => onSelect(fdi)}
          >
            <div className={`text-[10px] font-bold text-center text-muted-foreground ${isLower ? 'mt-0.5' : 'mb-0.5'}`}>
              {displayNumber}
            </div>
            <div className="relative w-[52px] h-[68px]">
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
                <div className={`absolute bottom-0 left-0 w-3 h-3 rounded-full border-2 border-white shadow-sm ${dotClass}`} />
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
});

export const AnatomicalDentalChart: React.FC<AnatomicalChartProps> = ({ patientId, onToothSelect }) => {
  const [selectedTooth, setSelectedTooth] = useState<string | null>(null);
  const [showDialog, setShowDialog] = useState(false);
  const [numberingSystem, setNumberingSystem] = useState<ToothNumberingSystem>(ToothNumberingSystem.FDI);
  const [showAlternativeNumbers, setShowAlternativeNumbers] = useState(false);
  const [chartNote, setChartNote] = useState('');
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);

  const { toothRecordsMap, statistics, isLoading, saveToothRecord, isSaving, getToothHistory, chartNotes } = useDentalChart(patientId || '');

  const onChartRender = useCallback((id: string, phase: 'mount' | 'update', actualDuration: number) => {
    if (import.meta.env.DEV && actualDuration > 12) {
      logger.debug(`[perf] ${id} ${phase}: ${actualDuration.toFixed(2)}ms`);
    }
  }, []);

  const handleToothClick = useCallback((fdi: string) => {
    setSelectedTooth(fdi);
    onToothSelect(fdi);
    setShowDialog(true);
  }, [onToothSelect]);

  const handleSaveRecord = useCallback(async (data: Omit<DentalTreatmentRecord, 'id' | 'clinic_id'> & { id?: string }) => {
    try {
      await saveToothRecord(data);
      toast.success('تم حفظ سجل السن بنجاح');
      setShowDialog(false);
    } catch (err: any) {
      toast.error('فشل في حفظ السجل: ' + (err?.message || 'خطأ غير معروف'));
    }
  }, [saveToothRecord]);

  const handleSaveChartNote = useCallback(async () => {
    if (!chartNote.trim()) return;
    try {
      await saveToothRecord({
        id: editingNoteId || undefined,
        patient_id: patientId || '',
        tooth_number: CHART_NOTE_TOOTH_NUMBER,
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
  }, [chartNote, editingNoteId, patientId, saveToothRecord]);

  const startEditNote = useCallback((note: any) => {
    setChartNote(note.notes || '');
    setEditingNoteId(note.id);
  }, []);

  const selectedRecord = selectedTooth ? toothRecordsMap.get(selectedTooth) || null : null;
  const nextToothNumber = useMemo(() => {
    if (!selectedTooth) return null;
    const index = FDI_DISPLAY_ORDER.indexOf(selectedTooth);
    return FDI_DISPLAY_ORDER[(index + 1) % FDI_DISPLAY_ORDER.length];
  }, [selectedTooth]);

  const toothViewMap = useMemo(() => {
    const map = new Map<string, { condition: string; conditionLabel: string; status?: string }>();
    FDI_DISPLAY_ORDER.forEach((fdi) => {
      const record = toothRecordsMap.get(fdi);
      const condition = getConditionFromDiagnosis(record?.diagnosis);
      const conditionLabel = (CONDITION_LABELS_AR as any)[condition] || condition;
      map.set(fdi, {
        condition,
        conditionLabel,
        status: record?.status,
      });
    });
    return map;
  }, [toothRecordsMap]);

  const renderToothRow = useCallback((teeth: readonly string[], isLower: boolean) => (
    <div className="flex justify-center items-center gap-0">
      {teeth.map(fdi => {
        const viewData = toothViewMap.get(fdi);
        const display = showAlternativeNumbers
          ? `${getDisplayNumber(fdi, numberingSystem)} (${fdi})`
          : getDisplayNumber(fdi, numberingSystem);
        return (
          <ToothItem key={fdi} fdi={fdi} displayNumber={display} isLower={isLower}
            condition={viewData?.condition || 'sound'}
            conditionLabel={viewData?.conditionLabel || 'سليم'}
            status={viewData?.status}
            onSelect={handleToothClick} />
        );
      })}
    </div>
  ), [handleToothClick, numberingSystem, showAlternativeNumbers, toothViewMap]);

  const handleSaveAndNextRecord = useCallback(async (data: Omit<DentalTreatmentRecord, 'id' | 'clinic_id'> & { id?: string }) => {
    try {
      await saveToothRecord(data);
      if (!selectedTooth) return;
      const currentIndex = FDI_DISPLAY_ORDER.indexOf(selectedTooth);
      const nextTooth = FDI_DISPLAY_ORDER[(currentIndex + 1) % FDI_DISPLAY_ORDER.length];
      setSelectedTooth(nextTooth);
      toast.success(`تم الحفظ، الانتقال إلى السن ${nextTooth}`);
    } catch (err: any) {
      toast.error('فشل في الحفظ والانتقال: ' + (err?.message || 'خطأ غير معروف'));
    }
  }, [saveToothRecord, selectedTooth]);

  return (
    <Profiler id="AnatomicalDentalChart" onRender={onChartRender}>
      <div className="w-full max-w-7xl mx-auto space-y-4">
      <DentalChartActionsAndStats
        statistics={statistics}
        onExport={() => {
          exportDentalChartPDF(statistics, toothRecordsMap, chartNotes);
        }}
      />

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
            {renderToothRow(FDI_PERMANENT_ROWS.upperRight, false)}
            <div className="w-px h-16 bg-border mx-1" />
            {renderToothRow(FDI_PERMANENT_ROWS.upperLeft, false)}
          </div>
          <div className="h-px bg-border my-2" />
          <div className="flex justify-center items-start">
            {renderToothRow(FDI_PERMANENT_ROWS.lowerRight, true)}
            <div className="w-px h-16 bg-border mx-1" />
            {renderToothRow(FDI_PERMANENT_ROWS.lowerLeft, true)}
          </div>
          <div className="text-center mt-2"><Badge variant="outline" className="text-xs">الفك السفلي</Badge></div>
        </CardContent>
      </Card>

      <DentalChartNotesPanel
        chartNote={chartNote}
        onChartNoteChange={setChartNote}
        onSave={handleSaveChartNote}
        isSaving={isSaving}
        editingNoteId={editingNoteId}
        onCancelEdit={() => {
          setChartNote('');
          setEditingNoteId(null);
        }}
        notes={chartNotes}
        onEditNote={startEditNote}
      />

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
          onSave={handleSaveRecord}
          onSaveAndNext={handleSaveAndNextRecord}
          nextToothNumber={nextToothNumber}
          isSaving={isSaving} toothHistory={getToothHistory(selectedTooth)}
        />
      )}
      </div>
    </Profiler>
  );
};
