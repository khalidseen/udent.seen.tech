import React, { useState, useEffect, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Save, AlertTriangle, CalendarDays, Sparkles, Keyboard, Microscope, History
} from "lucide-react";
import { ToothSurfaceSVG, SURFACE_CONDITION_CYCLE } from './ToothSurfaceSVG';
import type { DentalTreatmentRecord } from '@/types/dental-enhanced';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';
import { createDefaultClinicalData, parseToothClinicalData, serializeToothClinicalData } from '@/utils/dentalChart';

const ICD10_CODES = [
  { code: 'K02.0', label: 'تسوس محدود في الميناء' },
  { code: 'K02.1', label: 'تسوس ممتد إلى العاج' },
  { code: 'K02.2', label: 'تسوس ممتد إلى اللب' },
  { code: 'K02.9', label: 'تسوس غير محدد' },
  { code: 'K04.0', label: 'التهاب اللب' },
  { code: 'K04.1', label: 'نخر اللب' },
  { code: 'K04.4', label: 'التهاب ذروي حاد' },
  { code: 'K04.5', label: 'التهاب ذروي مزمن' },
  { code: 'K05.0', label: 'التهاب لثة حاد' },
  { code: 'K05.1', label: 'التهاب لثة مزمن' },
  { code: 'K05.3', label: 'التهاب دواعم مزمن' },
  { code: 'K08.1', label: 'فقدان أسنان بسبب حادث أو خلع' },
  { code: 'S02.5', label: 'كسر في السن' },
  { code: 'K03.0', label: 'تآكل الأسنان' },
];

const CONDITION_OPTIONS = [
  { value: 'sound', label: 'سليم' },
  { value: 'caries', label: 'تسوس' },
  { value: 'filled', label: 'محشو' },
  { value: 'crown', label: 'تاج' },
  { value: 'root_canal', label: 'علاج عصب' },
  { value: 'implant', label: 'زراعة' },
  { value: 'missing', label: 'مفقود' },
  { value: 'fractured', label: 'مكسور' },
  { value: 'periapical_lesion', label: 'آفة ذروية' },
  { value: 'periodontal_disease', label: 'مرض لثوي' },
];

const CONDITION_STYLES: Record<string, { dot: string; selected: string; border: string }> = {
  sound: { dot: 'bg-green-500', selected: 'border-green-500 bg-green-500/10 text-green-700', border: 'border-green-400' },
  caries: { dot: 'bg-red-500', selected: 'border-red-500 bg-red-500/10 text-red-700', border: 'border-red-400' },
  filled: { dot: 'bg-blue-500', selected: 'border-blue-500 bg-blue-500/10 text-blue-700', border: 'border-blue-400' },
  crown: { dot: 'bg-purple-500', selected: 'border-purple-500 bg-purple-500/10 text-purple-700', border: 'border-purple-400' },
  root_canal: { dot: 'bg-pink-500', selected: 'border-pink-500 bg-pink-500/10 text-pink-700', border: 'border-pink-400' },
  implant: { dot: 'bg-slate-500', selected: 'border-slate-500 bg-slate-500/10 text-slate-700', border: 'border-slate-400' },
  missing: { dot: 'bg-gray-500', selected: 'border-gray-500 bg-gray-500/10 text-gray-700', border: 'border-gray-400' },
  fractured: { dot: 'bg-orange-500', selected: 'border-orange-500 bg-orange-500/10 text-orange-700', border: 'border-orange-400' },
  periapical_lesion: { dot: 'bg-amber-500', selected: 'border-amber-500 bg-amber-500/10 text-amber-700', border: 'border-amber-400' },
  periodontal_disease: { dot: 'bg-lime-500', selected: 'border-lime-500 bg-lime-500/10 text-lime-700', border: 'border-lime-400' },
};

type SeverityLevel = 'low' | 'moderate' | 'high' | 'critical';

const DIAGNOSIS_SEVERITY: Record<string, SeverityLevel> = {
  sound: 'low',
  filled: 'low',
  crown: 'low',
  implant: 'low',
  caries: 'moderate',
  periodontal_disease: 'moderate',
  root_canal: 'high',
  fractured: 'high',
  missing: 'high',
  periapical_lesion: 'critical',
};

const SEVERITY_STYLES: Record<SeverityLevel, {
  label: string;
  dot: string;
  border: string;
  selected: string;
  badge: string;
  alert: string;
}> = {
  low: {
    label: 'منخفضة',
    dot: 'bg-emerald-500',
    border: 'border-emerald-300',
    selected: 'border-emerald-500 bg-emerald-50 text-emerald-700 ring-emerald-200',
    badge: 'border-emerald-300 bg-emerald-50 text-emerald-700',
    alert: 'bg-emerald-50 border-emerald-200 text-emerald-700',
  },
  moderate: {
    label: 'متوسطة',
    dot: 'bg-amber-500',
    border: 'border-amber-300',
    selected: 'border-amber-500 bg-amber-50 text-amber-700 ring-amber-200',
    badge: 'border-amber-300 bg-amber-50 text-amber-700',
    alert: 'bg-amber-50 border-amber-200 text-amber-700',
  },
  high: {
    label: 'عالية',
    dot: 'bg-orange-500',
    border: 'border-orange-300',
    selected: 'border-orange-500 bg-orange-50 text-orange-700 ring-orange-200',
    badge: 'border-orange-300 bg-orange-50 text-orange-700',
    alert: 'bg-orange-50 border-orange-200 text-orange-700',
  },
  critical: {
    label: 'حرجة',
    dot: 'bg-rose-600',
    border: 'border-rose-300',
    selected: 'border-rose-600 bg-rose-50 text-rose-700 ring-rose-200',
    badge: 'border-rose-300 bg-rose-50 text-rose-700',
    alert: 'bg-rose-50 border-rose-200 text-rose-700',
  },
};

const STATUS_OPTIONS = [
  { value: 'planned', label: 'مخطط', color: 'bg-amber-100 text-amber-800 border-amber-300' },
  { value: 'in_progress', label: 'قيد العلاج', color: 'bg-blue-100 text-blue-800 border-blue-300' },
  { value: 'completed', label: 'مكتمل', color: 'bg-green-100 text-green-800 border-green-300' },
  { value: 'cancelled', label: 'ملغي', color: 'bg-muted text-muted-foreground border-border' },
];

// Treatment presets by diagnosis
const TREATMENT_PRESETS: Record<string, { label: string; plan: string }[]> = {
  caries: [
    { label: 'حشوة أمامية (كمبوزت)', plan: 'حشوة كمبوزت أمامية — تنظيف التسوس وترميم بالكمبوزت' },
    { label: 'حشوة خلفية (كمبوزت)', plan: 'حشوة كمبوزت خلفية — إزالة التسوس وحشو بالكمبوزت' },
    { label: 'حشوة GIC', plan: 'حشوة GIC — إزالة التسوس وحشو بالأيونومر الزجاجي' },
    { label: 'تاج بعد حشو كبير', plan: 'حشو + تحضير تاج — التسوس واسع يحتاج تغطية بتاج' },
  ],
  root_canal: [
    { label: 'فتح + تنظيف أقنية', plan: 'فتح حجرة اللب وتنظيف الأقنية الجذرية — الجلسة الأولى' },
    { label: 'حشو أقنية', plan: 'حشو الأقنية الجذرية بالـ Gutta Percha — الجلسة النهائية' },
    { label: 'إعادة علاج عصب', plan: 'إعادة علاج عصب — إزالة الحشو القديم وإعادة التنظيف والحشو' },
    { label: 'Pulpotomy', plan: 'بتر اللب — إزالة اللب التاجي والحفاظ على اللب الجذري' },
  ],
  missing: [
    { label: 'جسر ثابت', plan: 'جسر ثابت — تحضير الأسنان المجاورة وتركيب جسر' },
    { label: 'زراعة', plan: 'زراعة سنية — وضع غرسة تيتانيوم + تاج خزفي' },
    { label: 'طقم جزئي متحرك', plan: 'طقم جزئي متحرك — أخذ طبعة وتصنيع طقم' },
  ],
  fractured: [
    { label: 'ترميم كمبوزت', plan: 'ترميم الكسر بالكمبوزت — بناء السن المكسور' },
    { label: 'تاج خزفي', plan: 'تحضير السن وتركيب تاج خزفي كامل' },
    { label: 'خلع', plan: 'خلع السن المكسور — الكسر غير قابل للترميم' },
  ],
  crown: [
    { label: 'تاج PFM', plan: 'تاج بورسلان على معدن (PFM) — تحضير وأخذ طبعة' },
    { label: 'تاج زيركون', plan: 'تاج زيركون كامل — تحضير وأخذ طبعة رقمية' },
    { label: 'تاج E-max', plan: 'تاج E-max — تحضير وتركيب تاج خزفي بالكامل' },
  ],
  implant: [
    { label: 'وضع الغرسة', plan: 'وضع الغرسة التيتانيومية — المرحلة الجراحية الأولى' },
    { label: 'تركيب الدعامة', plan: 'تركيب الدعامة (Abutment) — بعد فترة الالتئام' },
    { label: 'تركيب التاج النهائي', plan: 'تركيب التاج النهائي على الزراعة' },
  ],
  periapical_lesion: [
    { label: 'علاج عصب + متابعة', plan: 'علاج عصب وتنظيف الآفة الذروية مع متابعة شعاعية' },
    { label: 'جراحة ذروية', plan: 'جراحة قطع ذروة الجذر (Apicoectomy)' },
  ],
  periodontal_disease: [
    { label: 'تقليح وتنعيم جذور', plan: 'تقليح وتنعيم جذور (SRP) — علاج دواعم غير جراحي' },
    { label: 'جراحة لثوية', plan: 'جراحة شريحة لثوية لتنظيف الجيوب العميقة' },
  ],
};

interface ToothRecordDialogProps {
  isOpen: boolean;
  onClose: () => void;
  toothNumber: string;
  existingRecord?: DentalTreatmentRecord | null;
  patientId: string;
  onSave: (data: Omit<DentalTreatmentRecord, 'id' | 'clinic_id'> & { id?: string }) => Promise<void>;
  onSaveAndNext?: (data: Omit<DentalTreatmentRecord, 'id' | 'clinic_id'> & { id?: string }) => Promise<void>;
  nextToothNumber?: string | null;
  isSaving?: boolean;
  toothHistory?: any[];
}

export const ToothRecordDialog: React.FC<ToothRecordDialogProps> = ({
  isOpen, onClose, toothNumber, existingRecord, patientId, onSave, onSaveAndNext, nextToothNumber, isSaving, toothHistory = [],
}) => {
  const getInitialClinicalData = () => createDefaultClinicalData();
  const [diagnosis, setDiagnosis] = useState('sound');
  const [icdCode, setIcdCode] = useState('');
  const [treatmentPlan, setTreatmentPlan] = useState('');
  const [status, setStatus] = useState('planned');
  const [notes, setNotes] = useState('');
  const [treatmentDate, setTreatmentDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [followUpDate, setFollowUpDate] = useState('');
  const [estimatedCost, setEstimatedCost] = useState('');
  const [surfaces, setSurfaces] = useState(() => getInitialClinicalData().surfaces);
  const [mobility, setMobility] = useState(0);
  const [probingDepths, setProbingDepths] = useState(() => getInitialClinicalData().probingDepths);
  const [bleeding, setBleeding] = useState(false);
  const [recession, setRecession] = useState(() => getInitialClinicalData().recession);
  const [plaqueIndex, setPlaqueIndex] = useState(0);
  const [rootCount, setRootCount] = useState(1);
  const [endoTreatment, setEndoTreatment] = useState(false);
  const [endoDate, setEndoDate] = useState('');
  const [endoMaterial, setEndoMaterial] = useState('');
  const [rootConditions, setRootConditions] = useState<string[]>(['healthy']);
  const [activeTab, setActiveTab] = useState<'record' | 'clinical' | 'history'>('record');

  const treatmentPlanRef = useRef<HTMLTextAreaElement | null>(null);
  const notesRef = useRef<HTMLTextAreaElement | null>(null);

  useEffect(() => {
    if (existingRecord) {
      setDiagnosis(existingRecord.diagnosis || 'sound');
      setTreatmentPlan(existingRecord.treatment_plan || '');
      setStatus(existingRecord.status || 'planned');
      setNotes(existingRecord.notes || '');
      setTreatmentDate(existingRecord.treatment_date || format(new Date(), 'yyyy-MM-dd'));
      const clinicalData = parseToothClinicalData(existingRecord.tooth_surface);
      setSurfaces(clinicalData.surfaces);
      setIcdCode(clinicalData.icdCode);
      setMobility(clinicalData.mobility);
      setProbingDepths(clinicalData.probingDepths);
      setBleeding(clinicalData.bleeding);
      setRecession(clinicalData.recession);
      setRootCount(clinicalData.rootCount);
      setEndoTreatment(clinicalData.endoTreatment);
      setEndoDate(clinicalData.endoDate);
      setEndoMaterial(clinicalData.endoMaterial);
      setRootConditions(clinicalData.rootConditions);
      setFollowUpDate(clinicalData.followUpDate);
      setEstimatedCost(clinicalData.estimatedCost);
      setPlaqueIndex(clinicalData.plaqueIndex);
    } else {
      const initialClinicalData = getInitialClinicalData();
      setDiagnosis('sound'); setIcdCode(''); setTreatmentPlan(''); setStatus('planned');
      setNotes(''); setTreatmentDate(format(new Date(), 'yyyy-MM-dd'));
      setFollowUpDate(''); setEstimatedCost('');
      setSurfaces(initialClinicalData.surfaces);
      setMobility(initialClinicalData.mobility); setProbingDepths(initialClinicalData.probingDepths); setBleeding(initialClinicalData.bleeding);
      setRecession(initialClinicalData.recession); setPlaqueIndex(initialClinicalData.plaqueIndex);
      setRootCount(1); setEndoTreatment(false); setEndoDate(''); setEndoMaterial('');
      setRootConditions(['healthy']);
    }
    setActiveTab('record');
  }, [existingRecord, toothNumber, isOpen]);

  const buildPayload = () => {
    const clinicalData = serializeToothClinicalData({
      surfaces, icdCode, mobility, probingDepths, bleeding, recession, plaqueIndex,
      rootCount, endoTreatment, endoDate, endoMaterial, rootConditions, followUpDate, estimatedCost,
    });

    return {
      id: existingRecord?.id,
      patient_id: patientId,
      tooth_number: toothNumber,
      numbering_system: 'fdi',
      diagnosis,
      treatment_plan: treatmentPlan,
      status,
      tooth_surface: clinicalData,
      notes,
      treatment_date: treatmentDate,
    } as Omit<DentalTreatmentRecord, 'id' | 'clinic_id'> & { id?: string };
  };

  const handleSave = async () => {
    if (status === 'completed' && (!treatmentPlan.trim() || !notes.trim())) {
      return;
    }
    await onSave(buildPayload());
  };

  const handleSaveAndNext = async () => {
    if (!onSaveAndNext || !nextToothNumber) return;
    if (status === 'completed' && (!treatmentPlan.trim() || !notes.trim())) {
      return;
    }
    await onSaveAndNext(buildPayload());
  };

  useEffect(() => {
    if (!isOpen) return;

    const diagnosisShortcutMap: Record<string, string> = {
      '1': 'sound',
      '2': 'caries',
      '3': 'filled',
      '4': 'root_canal',
      '5': 'crown',
      '6': 'fractured',
      '7': 'implant',
      '8': 'missing',
      '9': 'periapical_lesion',
      '0': 'periodontal_disease',
    };

    const handleKeydown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      const isTyping = !!target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.getAttribute('role') === 'combobox');

      if (event.ctrlKey && event.key.toLowerCase() === 's') {
        event.preventDefault();
        handleSave().catch(() => undefined);
        return;
      }

      if (event.ctrlKey && event.key === 'Enter') {
        event.preventDefault();
        if (nextToothNumber && onSaveAndNext) {
          handleSaveAndNext().catch(() => undefined);
        } else {
          handleSave().catch(() => undefined);
        }
        return;
      }

      if (event.altKey && event.key.toLowerCase() === '1') {
        event.preventDefault();
        setActiveTab('record');
        return;
      }
      if (event.altKey && event.key.toLowerCase() === '2') {
        event.preventDefault();
        setActiveTab('clinical');
        return;
      }
      if (event.altKey && event.key.toLowerCase() === '3') {
        event.preventDefault();
        setActiveTab('history');
        return;
      }

      if (isTyping) {
        return;
      }

      if (event.altKey && diagnosisShortcutMap[event.key]) {
        event.preventDefault();
        setDiagnosis(diagnosisShortcutMap[event.key]);
        return;
      }

      if (event.altKey && event.key.toLowerCase() === 'p') {
        event.preventDefault();
        setStatus('planned');
        return;
      }
      if (event.altKey && event.key.toLowerCase() === 'i') {
        event.preventDefault();
        setStatus('in_progress');
        return;
      }
      if (event.altKey && event.key.toLowerCase() === 'c') {
        event.preventDefault();
        setStatus('completed');
        return;
      }

      if (event.altKey && event.key.toLowerCase() === 't') {
        event.preventDefault();
        setActiveTab('record');
        setTimeout(() => treatmentPlanRef.current?.focus(), 0);
        return;
      }
      if (event.altKey && event.key.toLowerCase() === 'n') {
        event.preventDefault();
        setActiveTab('record');
        setTimeout(() => notesRef.current?.focus(), 0);
      }
    };

    window.addEventListener('keydown', handleKeydown);
    return () => window.removeEventListener('keydown', handleKeydown);
  }, [isOpen, nextToothNumber, onSaveAndNext, status, treatmentPlan, notes]);

  const handleSurfaceClick = (surface: keyof typeof surfaces) => {
    const currentIdx = SURFACE_CONDITION_CYCLE.indexOf(surfaces[surface]);
    const nextIdx = (currentIdx + 1) % SURFACE_CONDITION_CYCLE.length;
    setSurfaces(prev => ({ ...prev, [surface]: SURFACE_CONDITION_CYCLE[nextIdx] }));
  };

  const probingLabels = ['MB', 'B', 'DB', 'ML', 'L', 'DL'];
  const presets = TREATMENT_PRESETS[diagnosis] || [];
  const currentSeverity = DIAGNOSIS_SEVERITY[diagnosis] || 'moderate';
  const currentSeverityStyle = SEVERITY_STYLES[currentSeverity];
  const visibleHistory = toothHistory.slice(0, 4);
  const hiddenHistoryCount = Math.max(0, toothHistory.length - visibleHistory.length);

  const getDepthColor = (depth: number) => {
    if (depth <= 3) return 'text-emerald-700 border-emerald-300 bg-emerald-50/70';
    if (depth <= 5) return 'text-amber-700 border-amber-300 bg-amber-50/70';
    return 'text-rose-700 border-rose-300 bg-rose-50/80';
  };

  const getRecessionColor = (value: number) => {
    if (value <= 1) return 'text-emerald-700 border-emerald-300 bg-emerald-50/60';
    if (value <= 3) return 'text-amber-700 border-amber-300 bg-amber-50/60';
    return 'text-rose-700 border-rose-300 bg-rose-50/70';
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="!left-0 !top-0 !h-screen !w-screen !max-w-none !translate-x-0 !translate-y-0 flex flex-col overflow-hidden rounded-none border-slate-200 bg-gradient-to-b from-background to-slate-50/60 p-0 shadow-2xl sm:!rounded-none" dir="rtl">
        <DialogHeader className="shrink-0 border-b bg-gradient-to-r from-slate-50 via-white to-slate-50 px-4 py-3">
          <div className="flex flex-col gap-2 xl:flex-row xl:items-start xl:justify-between">
            <DialogTitle className="text-xl font-bold flex flex-wrap items-center gap-3">
              <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-xl">🦷</span>
              <span>سجل السن {toothNumber}</span>
              <Badge variant="outline" className="text-xs border-primary/30 bg-primary/5 text-primary">
                نافذة تشخيص سريري متقدمة
              </Badge>
              <Badge variant="outline" className={`text-xs ${currentSeverityStyle.badge}`}>
                درجة الخطورة: {currentSeverityStyle.label}
              </Badge>
              {existingRecord && <Badge variant="outline" className="text-xs border-emerald-300 bg-emerald-50 text-emerald-700">سجل موجود</Badge>}
            </DialogTitle>

            <div className="max-w-[760px] rounded-xl border border-indigo-200/80 bg-gradient-to-r from-indigo-50 to-blue-50 px-3 py-2 text-[10px] text-slate-700 shadow-sm">
              <div className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold text-indigo-700">
                <Keyboard className="h-3.5 w-3.5" />
                اختصارات سريعة للفحص السريري
              </div>
              <div className="leading-5">
                حفظ Ctrl+S • حفظ والسن التالي Ctrl+Enter • تبويبات Alt+1/2/3 • حالة Alt+P/I/C • تشخيص Alt+0..9 • تركيز الخطة Alt+T • الملاحظات Alt+N
              </div>
            </div>
          </div>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as 'record' | 'clinical' | 'history')} className="flex min-h-0 flex-1 flex-col space-y-3 px-4 pb-3 pt-2">
          <TabsList className="grid h-auto w-full shrink-0 grid-cols-3 rounded-xl border bg-white p-1 shadow-sm">
            <TabsTrigger value="record" className="gap-2 rounded-lg data-[state=active]:bg-primary/10 data-[state=active]:text-primary">
              <Sparkles className="h-4 w-4" />
              التشخيص والخطة
            </TabsTrigger>
            <TabsTrigger value="clinical" className="gap-2 rounded-lg data-[state=active]:bg-primary/10 data-[state=active]:text-primary">
              <Microscope className="h-4 w-4" />
              القياسات السريرية
            </TabsTrigger>
            <TabsTrigger value="history" className="gap-2 rounded-lg data-[state=active]:bg-primary/10 data-[state=active]:text-primary">
              <History className="h-4 w-4" />
              السجل السابق
            </TabsTrigger>
          </TabsList>

          <TabsContent value="record" className="mt-0 min-h-0 flex-1 overflow-y-auto data-[state=active]:flex data-[state=active]:flex-col">
            <div className="grid min-h-0 flex-1 grid-cols-1 gap-3 lg:grid-cols-2">
              <div className="space-y-2 rounded-xl border bg-white p-3 shadow-sm">
                <div className="flex items-center gap-2 text-sm font-semibold text-slate-800">
                  <span className={`inline-block h-2 w-2 rounded-full ${currentSeverityStyle.dot}`} />
                  التقييم التشخيصي
                </div>
              <Label className="text-xs font-semibold">التشخيص السريع</Label>
              <div className="flex flex-wrap gap-2">
                {CONDITION_OPTIONS.map(opt => (
                  (() => {
                    const optionSeverity = DIAGNOSIS_SEVERITY[opt.value] || 'moderate';
                    const optionSeverityStyle = SEVERITY_STYLES[optionSeverity];
                    return (
                  <button
                    key={opt.value}
                    onClick={() => setDiagnosis(opt.value)}
                    type="button"
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border-2 transition-all
                      ${diagnosis === opt.value
                        ? `${optionSeverityStyle.selected} ring-2 ring-offset-1 scale-105 shadow-sm`
                        : `${optionSeverityStyle.border} opacity-80 hover:opacity-100`}`}
                  >
                    <div className={`w-2.5 h-2.5 rounded-full ${optionSeverityStyle.dot}`} />
                    {opt.label}
                  </button>
                    );
                  })()
                ))}
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <div className="flex gap-1.5">
                  {STATUS_OPTIONS.map(opt => (
                    <button
                      key={opt.value}
                      onClick={() => setStatus(opt.value)}
                      className={`px-3 py-1 rounded-md text-xs font-medium border transition-all
                        ${status === opt.value ? opt.color + ' ring-1 ring-primary' : 'bg-background text-muted-foreground border-border hover:bg-muted'}`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
                <Input type="date" value={treatmentDate} onChange={e => setTreatmentDate(e.target.value)} className="h-8 w-36 text-xs" />
              </div>

              <Select value={icdCode} onValueChange={setIcdCode}>
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue placeholder="رمز ICD-10 (اختياري)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">بدون رمز</SelectItem>
                  {ICD10_CODES.map(c => (
                    <SelectItem key={c.code} value={c.code}>
                      <span className="font-mono text-xs ml-2">{c.code}</span> — {c.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {diagnosis !== 'sound' && (
                <div className={`flex items-center gap-2 rounded-lg border p-2 text-xs ${currentSeverityStyle.alert}`}>
                  <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
                  <span>
                    يحتاج متابعة — {CONDITION_OPTIONS.find(o => o.value === diagnosis)?.label} (الخطورة: {currentSeverityStyle.label})
                  </span>
                </div>
              )}
              </div>

              <div className="space-y-2 rounded-xl border bg-white p-3 shadow-sm">
                <div className="flex items-center gap-2 text-sm font-semibold text-slate-800">
                  <span className="inline-block h-2 w-2 rounded-full bg-emerald-500" />
                  الخطة العلاجية والبيانات المالية
                </div>

                {status === 'completed' && (!treatmentPlan.trim() || !notes.trim()) && (
                  <div className="flex items-center gap-2 p-2 rounded-lg bg-red-50 border border-red-200 text-xs text-red-700">
                    <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                    <span>لا يمكن اعتماد الحالة كمكتملة بدون خطة علاج وملاحظات سريرية.</span>
                  </div>
                )}

                {presets.length > 0 && (
                  <div className="space-y-2">
                    <Label className="text-sm font-semibold">خيارات العلاج السريعة</Label>
                    <div className="flex flex-wrap gap-2">
                      {presets.map((p, i) => (
                        <button
                          key={i}
                          onClick={() => setTreatmentPlan(p.plan)}
                          className={`px-3 py-1.5 rounded-lg text-xs border transition-all
                            ${treatmentPlan === p.plan
                              ? 'bg-primary/10 border-primary text-primary font-medium'
                              : 'bg-background border-border text-foreground hover:bg-muted'}`}
                        >
                          {p.label}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                <div className="space-y-1.5">
                  <Label className="text-xs">خطة العلاج</Label>
                  <Textarea
                    ref={treatmentPlanRef}
                    value={treatmentPlan} onChange={e => setTreatmentPlan(e.target.value)}
                    placeholder="وصف خطة العلاج..." rows={2} className="h-16 resize-none text-xs"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs">الملاحظات</Label>
                  <Textarea
                    ref={notesRef}
                    value={notes} onChange={e => setNotes(e.target.value)}
                    placeholder="ملاحظات سريرية..." rows={2} className="h-16 resize-none text-xs"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label className="text-xs flex items-center gap-1"><CalendarDays className="w-3 h-3" /> المتابعة</Label>
                    <Input type="date" value={followUpDate} onChange={e => setFollowUpDate(e.target.value)} className="h-8 text-xs" />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">التكلفة (ر.س)</Label>
                    <Input type="number" min="0" value={estimatedCost} onChange={e => setEstimatedCost(e.target.value)} placeholder="0" className="h-8 text-xs" />
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="clinical" className="mt-0 min-h-0 flex-1 overflow-y-auto data-[state=active]:flex data-[state=active]:flex-col">
            <div className="space-y-3 pb-1">
              <div className="grid grid-cols-2 gap-2 xl:grid-cols-4">
                <div className="rounded-lg border bg-white px-3 py-2">
                  <div className="text-[10px] text-muted-foreground">الحركة</div>
                  <div className="text-sm font-semibold">درجة {mobility}</div>
                </div>
                <div className="rounded-lg border bg-white px-3 py-2">
                  <div className="text-[10px] text-muted-foreground">نزيف عند السبر</div>
                  <div className={`text-sm font-semibold ${bleeding ? 'text-red-600' : 'text-emerald-600'}`}>{bleeding ? 'موجود' : 'غير موجود'}</div>
                </div>
                <div className="rounded-lg border bg-white px-3 py-2">
                  <div className="text-[10px] text-muted-foreground">مؤشر اللويحة</div>
                  <div className="text-sm font-semibold">{plaqueIndex} / 3</div>
                </div>
                <div className="rounded-lg border bg-white px-3 py-2">
                  <div className="text-[10px] text-muted-foreground">عدد الجذور</div>
                  <div className="text-sm font-semibold">{rootCount}</div>
                </div>
              </div>

              <div className="grid grid-cols-1 items-start gap-3 xl:grid-cols-[380px_minmax(0,1fr)]">
                <div className="sticky top-2 z-10 rounded-xl border bg-white p-3 shadow-sm">
                  <div className="mb-2 flex items-center justify-between">
                    <Label className="text-xs font-semibold">شكل السن التفاعلي</Label>
                    <span className="text-[10px] text-muted-foreground">اضغط على السطح لتغيير الحالة</span>
                  </div>
                  <div className="flex min-h-[320px] items-center justify-center">
                    <ToothSurfaceSVG surfaces={surfaces} onSurfaceClick={handleSurfaceClick} toothNumber={toothNumber} clinicalRootCount={rootCount} />
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="rounded-xl border bg-white p-3 shadow-sm">
                    <div className="mb-2 text-xs font-semibold">المؤشرات السريرية الأساسية</div>
                    <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                      <div className="space-y-1.5">
                        <Label className="text-xs">الحركة (Miller)</Label>
                        <div className="flex gap-1">
                          {[0, 1, 2, 3].map(v => (
                            <button
                              key={v}
                              onClick={() => setMobility(v)}
                              className={`h-8 w-10 rounded text-xs font-bold border transition-all
                                ${mobility === v
                                  ? v === 0 ? 'bg-green-100 border-green-400 text-green-700'
                                    : v <= 1 ? 'bg-yellow-100 border-yellow-400 text-yellow-700'
                                    : 'bg-red-100 border-red-400 text-red-700'
                                  : 'bg-background border-border text-muted-foreground hover:bg-muted'}`}
                            >
                              {v}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div className="space-y-1.5">
                        <Label className="text-xs">مؤشر اللويحة</Label>
                        <div className="flex gap-1">
                          {[0, 1, 2, 3].map(v => (
                            <button
                              key={v}
                              onClick={() => setPlaqueIndex(v)}
                              className={`px-3 py-1 rounded text-xs border transition-all
                                ${plaqueIndex === v ? 'bg-primary/10 border-primary text-primary font-medium' : 'bg-background border-border text-muted-foreground hover:bg-muted'}`}
                            >
                              {v}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div className="mt-2 flex items-center gap-2 rounded-md border border-red-100 bg-red-50/60 px-2 py-1.5">
                      <Checkbox id="bop" checked={bleeding} onCheckedChange={v => setBleeding(v as boolean)} />
                      <Label htmlFor="bop" className="text-xs flex items-center gap-1">
                        <span className="text-red-500">●</span> نزيف عند السبر (BOP)
                      </Label>
                    </div>
                  </div>

                  <div className="rounded-xl border bg-white p-3 shadow-sm">
                    <div className="mb-2 text-xs font-semibold">قياسات دواعم السن</div>
                    <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
                      <div className="space-y-2">
                        <Label className="text-xs flex items-center gap-1">
                          عمق الجيوب (mm)
                          <span className="text-muted-foreground">(≤3 طبيعي | 4-5 معتدل | ≥6 شديد)</span>
                        </Label>
                        <div className="grid grid-cols-6 gap-1.5">
                          {probingDepths.map((depth, i) => (
                            <div key={i} className="text-center">
                              <div className="mb-0.5 text-[10px] text-muted-foreground">{probingLabels[i]}</div>
                              <Input
                                type="number"
                                min="0"
                                max="15"
                                value={depth}
                                onChange={e => {
                                  const v = [...probingDepths];
                                  v[i] = parseInt(e.target.value) || 0;
                                  setProbingDepths(v);
                                }}
                                className={`h-7 text-center text-[11px] font-bold ${getDepthColor(depth)}`}
                              />
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label className="text-xs">انحسار اللثة (mm)</Label>
                        <div className="grid grid-cols-6 gap-1.5">
                          {recession.map((val, i) => (
                            <div key={i} className="text-center">
                              <div className="mb-0.5 text-[10px] text-muted-foreground">{probingLabels[i]}</div>
                              <Input
                                type="number"
                                min="0"
                                max="10"
                                value={val}
                                onChange={e => {
                                  const v = [...recession];
                                  v[i] = parseInt(e.target.value) || 0;
                                  setRecession(v);
                                }}
                                className={`h-7 text-center text-xs ${getRecessionColor(val)}`}
                              />
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="rounded-xl border bg-white p-3 shadow-sm">
                    <div className="mb-2 text-xs font-semibold">الجذور وعلاج العصب</div>
                    <div className="flex flex-wrap items-center gap-4">
                      <div className="flex items-center gap-2">
                        <Label className="text-xs">عدد الجذور:</Label>
                        <div className="flex gap-1">
                          {[1, 2, 3, 4].map(v => (
                            <button
                              key={v}
                              onClick={() => {
                                setRootCount(v);
                                setRootConditions(prev => {
                                  const a = [...prev];
                                  while (a.length < v) a.push('healthy');
                                  return a.slice(0, v);
                                });
                              }}
                              className={`h-7 w-7 rounded text-xs font-bold border transition-all
                                ${rootCount === v ? 'bg-primary/10 border-primary text-primary' : 'bg-background border-border text-muted-foreground hover:bg-muted'}`}
                            >
                              {v}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div className="flex items-center gap-2 rounded-md border px-2 py-1">
                        <Checkbox id="endo" checked={endoTreatment} onCheckedChange={v => setEndoTreatment(v as boolean)} />
                        <Label htmlFor="endo" className="text-xs">تم علاج العصب</Label>
                      </div>
                    </div>

                    <div className="mt-3 grid grid-cols-2 gap-2 md:grid-cols-4">
                      {rootConditions.slice(0, rootCount).map((cond, i) => (
                        <div key={i} className="space-y-0.5">
                          <Label className="text-[10px] text-muted-foreground">الجذر {i + 1}</Label>
                          <Select value={cond} onValueChange={v => { const a = [...rootConditions]; a[i] = v; setRootConditions(a); }}>
                            <SelectTrigger className="h-7 text-xs"><SelectValue /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="healthy">سليم</SelectItem>
                              <SelectItem value="infected">ملتهب</SelectItem>
                              <SelectItem value="treated">معالج</SelectItem>
                              <SelectItem value="fractured">مكسور</SelectItem>
                              <SelectItem value="resorbed">ممتص</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      ))}
                    </div>

                    {endoTreatment && (
                      <div className="mt-3 grid grid-cols-2 gap-3">
                        <div className="space-y-1">
                          <Label className="text-xs">تاريخ علاج العصب</Label>
                          <Input type="date" value={endoDate} onChange={e => setEndoDate(e.target.value)} className="h-7 text-xs" />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs">المادة</Label>
                          <Select value={endoMaterial} onValueChange={setEndoMaterial}>
                            <SelectTrigger className="h-7 text-xs"><SelectValue placeholder="اختر..." /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="gutta_percha">Gutta Percha</SelectItem>
                              <SelectItem value="mta">MTA</SelectItem>
                              <SelectItem value="bioceramic">Bioceramic</SelectItem>
                              <SelectItem value="resilon">Resilon</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="history" className="mt-0 min-h-0 flex-1 overflow-y-auto data-[state=active]:flex data-[state=active]:flex-col">
            {toothHistory.length > 0 ? (
              <div className="grid grid-cols-1 gap-2 lg:grid-cols-2">
                {visibleHistory.map((record: any, i: number) => (
                  <div key={record.id || i} className="flex items-start gap-3 p-3 rounded-xl border bg-white text-xs shadow-sm">
                    <div className={`w-2 h-2 mt-1.5 rounded-full shrink-0 ${SEVERITY_STYLES[DIAGNOSIS_SEVERITY[record.diagnosis] || 'moderate'].dot}`} />
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <span className="font-medium">{CONDITION_OPTIONS.find(o => o.value === record.diagnosis)?.label || record.diagnosis}</span>
                        <div className="flex items-center gap-1.5">
                          <Badge variant="outline" className={`text-[10px] h-4 ${SEVERITY_STYLES[DIAGNOSIS_SEVERITY[record.diagnosis] || 'moderate'].badge}`}>
                            {SEVERITY_STYLES[DIAGNOSIS_SEVERITY[record.diagnosis] || 'moderate'].label}
                          </Badge>
                          <Badge variant="outline" className="text-[10px] h-4">
                            {STATUS_OPTIONS.find(o => o.value === record.status)?.label || record.status}
                          </Badge>
                        </div>
                      </div>
                      {record.treatment_plan && <p className="text-muted-foreground mt-0.5">{record.treatment_plan}</p>}
                      {record.treatment_date && (
                        <p className="text-muted-foreground">{format(new Date(record.treatment_date), 'PPP', { locale: ar })}</p>
                      )}
                    </div>
                  </div>
                ))}
                {hiddenHistoryCount > 0 && (
                  <div className="flex items-center justify-center rounded-xl border border-dashed bg-white/70 p-3 text-xs text-muted-foreground">
                    يوجد {hiddenHistoryCount} سجل إضافي غير معروض للحفاظ على العرض داخل الشاشة بدون تمرير
                  </div>
                )}
              </div>
            ) : (
              <div className="flex flex-1 items-center justify-center rounded-xl border bg-white text-sm text-muted-foreground shadow-sm">
                لا توجد سجلات سابقة لهذا السن
              </div>
            )}
          </TabsContent>
        </Tabs>

        {/* Save/Cancel */}
        <div className="shrink-0 flex justify-end gap-3 border-t bg-white/95 px-4 py-3 backdrop-blur supports-[backdrop-filter]:bg-white/80">
          <Button variant="outline" onClick={onClose} size="sm">إلغاء</Button>
          {onSaveAndNext && nextToothNumber && (
            <Button
              onClick={() => {
                handleSaveAndNext().catch(() => undefined);
              }}
              disabled={isSaving || (status === 'completed' && (!treatmentPlan.trim() || !notes.trim()))}
              variant="secondary"
              size="sm"
              className="min-w-[170px] bg-slate-900 text-white hover:bg-slate-800"
            >
              حفظ والانتقال إلى السن {nextToothNumber}
            </Button>
          )}
          <Button
            onClick={() => {
              handleSave().catch(() => undefined);
            }}
            disabled={isSaving || (status === 'completed' && (!treatmentPlan.trim() || !notes.trim()))}
            size="sm"
            className="min-w-[120px]"
          >
            <Save className="w-4 h-4 ml-1" />
            {isSaving ? 'جاري الحفظ...' : 'حفظ'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
