import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { 
  Save, AlertTriangle, CalendarDays, ChevronDown, Clock
} from "lucide-react";
import { ToothSurfaceSVG, SURFACE_CONDITION_CYCLE } from './ToothSurfaceSVG';
import { DentalTreatmentRecord } from '@/hooks/useDentalChart';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';

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
  { value: 'sound', label: 'سليم', color: '#4CAF50' },
  { value: 'caries', label: 'تسوس', color: '#FF5722' },
  { value: 'filled', label: 'محشو', color: '#2196F3' },
  { value: 'crown', label: 'تاج', color: '#9C27B0' },
  { value: 'root_canal', label: 'علاج عصب', color: '#E91E63' },
  { value: 'implant', label: 'زراعة', color: '#607D8B' },
  { value: 'missing', label: 'مفقود', color: '#9E9E9E' },
  { value: 'fractured', label: 'مكسور', color: '#FF9800' },
  { value: 'periapical_lesion', label: 'آفة ذروية', color: '#FFC107' },
  { value: 'periodontal_disease', label: 'مرض لثوي', color: '#CDDC39' },
];

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
  onSave: (data: Omit<DentalTreatmentRecord, 'id' | 'clinic_id'> & { id?: string }) => void;
  isSaving?: boolean;
  toothHistory?: any[];
}

export const ToothRecordDialog: React.FC<ToothRecordDialogProps> = ({
  isOpen, onClose, toothNumber, existingRecord, patientId, onSave, isSaving, toothHistory = [],
}) => {
  const [diagnosis, setDiagnosis] = useState('sound');
  const [icdCode, setIcdCode] = useState('');
  const [treatmentPlan, setTreatmentPlan] = useState('');
  const [status, setStatus] = useState('planned');
  const [notes, setNotes] = useState('');
  const [treatmentDate, setTreatmentDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [followUpDate, setFollowUpDate] = useState('');
  const [estimatedCost, setEstimatedCost] = useState('');
  const [surfaces, setSurfaces] = useState({ mesial: 'sound', distal: 'sound', buccal: 'sound', lingual: 'sound', occlusal: 'sound' });
  const [mobility, setMobility] = useState(0);
  const [probingDepths, setProbingDepths] = useState([2, 2, 2, 2, 2, 2]);
  const [bleeding, setBleeding] = useState(false);
  const [recession, setRecession] = useState([0, 0, 0, 0, 0, 0]);
  const [plaqueIndex, setPlaqueIndex] = useState(0);
  const [rootCount, setRootCount] = useState(1);
  const [endoTreatment, setEndoTreatment] = useState(false);
  const [endoDate, setEndoDate] = useState('');
  const [endoMaterial, setEndoMaterial] = useState('');
  const [rootConditions, setRootConditions] = useState<string[]>(['healthy']);
  const [advancedOpen, setAdvancedOpen] = useState(false);

  useEffect(() => {
    if (existingRecord) {
      setDiagnosis(existingRecord.diagnosis || 'sound');
      setTreatmentPlan(existingRecord.treatment_plan || '');
      setStatus(existingRecord.status || 'planned');
      setNotes(existingRecord.notes || '');
      setTreatmentDate(existingRecord.treatment_date || format(new Date(), 'yyyy-MM-dd'));
      if (existingRecord.tooth_surface) {
        try {
          const p = JSON.parse(existingRecord.tooth_surface);
          if (p.surfaces) setSurfaces(p.surfaces);
          if (p.icdCode) setIcdCode(p.icdCode);
          if (p.mobility !== undefined) setMobility(p.mobility);
          if (p.probingDepths) setProbingDepths(p.probingDepths);
          if (p.bleeding !== undefined) setBleeding(p.bleeding);
          if (p.recession) setRecession(p.recession);
          if (p.rootCount) setRootCount(p.rootCount);
          if (p.endoTreatment !== undefined) setEndoTreatment(p.endoTreatment);
          if (p.endoDate) setEndoDate(p.endoDate);
          if (p.endoMaterial) setEndoMaterial(p.endoMaterial);
          if (p.rootConditions) setRootConditions(p.rootConditions);
          if (p.followUpDate) setFollowUpDate(p.followUpDate);
          if (p.estimatedCost) setEstimatedCost(p.estimatedCost);
          if (p.plaqueIndex !== undefined) setPlaqueIndex(p.plaqueIndex);
        } catch { /* ignore */ }
      }
    } else {
      setDiagnosis('sound'); setIcdCode(''); setTreatmentPlan(''); setStatus('planned');
      setNotes(''); setTreatmentDate(format(new Date(), 'yyyy-MM-dd'));
      setFollowUpDate(''); setEstimatedCost('');
      setSurfaces({ mesial: 'sound', distal: 'sound', buccal: 'sound', lingual: 'sound', occlusal: 'sound' });
      setMobility(0); setProbingDepths([2,2,2,2,2,2]); setBleeding(false);
      setRecession([0,0,0,0,0,0]); setPlaqueIndex(0);
      setRootCount(1); setEndoTreatment(false); setEndoDate(''); setEndoMaterial('');
      setRootConditions(['healthy']); setAdvancedOpen(false);
    }
  }, [existingRecord, toothNumber, isOpen]);

  const handleSurfaceClick = (surface: keyof typeof surfaces) => {
    const currentIdx = SURFACE_CONDITION_CYCLE.indexOf(surfaces[surface]);
    const nextIdx = (currentIdx + 1) % SURFACE_CONDITION_CYCLE.length;
    setSurfaces(prev => ({ ...prev, [surface]: SURFACE_CONDITION_CYCLE[nextIdx] }));
  };

  const handleSave = () => {
    const clinicalData = JSON.stringify({
      surfaces, icdCode, mobility, probingDepths, bleeding, recession, plaqueIndex,
      rootCount, endoTreatment, endoDate, endoMaterial, rootConditions, followUpDate, estimatedCost,
    });
    onSave({
      id: existingRecord?.id, patient_id: patientId, tooth_number: toothNumber,
      numbering_system: 'fdi', diagnosis, treatment_plan: treatmentPlan,
      status, tooth_surface: clinicalData, notes, treatment_date: treatmentDate,
    });
  };

  const probingLabels = ['MB', 'B', 'DB', 'ML', 'L', 'DL'];
  const presets = TREATMENT_PRESETS[diagnosis] || [];

  const getDepthColor = (depth: number) => {
    if (depth <= 3) return 'text-green-600 border-green-300';
    if (depth <= 5) return 'text-yellow-600 border-yellow-300';
    return 'text-red-600 border-red-300 bg-red-50';
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto" dir="rtl">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold flex items-center gap-3">
            <span className="text-2xl">🦷</span>
            <span>سجل السن {toothNumber}</span>
            {existingRecord && <Badge variant="outline" className="text-xs">سجل موجود</Badge>}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-5">
          {/* ===== Section 1: Quick Diagnosis Buttons ===== */}
          <div className="space-y-3">
            <Label className="text-sm font-semibold">التشخيص السريع</Label>
            <div className="flex flex-wrap gap-2">
              {CONDITION_OPTIONS.map(opt => (
                <button
                  key={opt.value}
                  onClick={() => setDiagnosis(opt.value)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border-2 transition-all
                    ${diagnosis === opt.value 
                      ? 'ring-2 ring-offset-1 ring-primary scale-105 shadow-sm' 
                      : 'opacity-70 hover:opacity-100'}`}
                  style={{
                    borderColor: opt.color,
                    backgroundColor: diagnosis === opt.value ? opt.color + '20' : 'transparent',
                  }}
                >
                  <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: opt.color }} />
                  {opt.label}
                </button>
              ))}
            </div>

            {/* Status + Date row */}
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
              <Input type="date" value={treatmentDate} onChange={e => setTreatmentDate(e.target.value)} className="w-40 h-8 text-xs" />
            </div>

            {/* ICD-10 */}
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
              <div className="flex items-center gap-2 p-2 rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 text-xs">
                <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                <span className="text-amber-700 dark:text-amber-400">
                  يحتاج متابعة — {CONDITION_OPTIONS.find(o => o.value === diagnosis)?.label}
                </span>
              </div>
            )}
          </div>

          <Separator />

          {/* ===== Section 2: Surface SVG + Basic Measurements ===== */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex flex-col items-center">
              <Label className="text-sm font-semibold mb-2">أسطح السن</Label>
              <ToothSurfaceSVG surfaces={surfaces} onSurfaceClick={handleSurfaceClick} toothNumber={toothNumber} />
            </div>
            <div className="space-y-3">
              <div className="space-y-1.5">
                <Label className="text-xs">الحركة (Miller)</Label>
                <div className="flex gap-1">
                  {[0, 1, 2, 3].map(v => (
                    <button
                      key={v}
                      onClick={() => setMobility(v)}
                      className={`w-10 h-8 rounded text-xs font-bold border transition-all
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
              <div className="flex items-center gap-2">
                <Checkbox id="bop" checked={bleeding} onCheckedChange={v => setBleeding(v as boolean)} />
                <Label htmlFor="bop" className="text-xs flex items-center gap-1">
                  <span className="text-red-500">●</span> نزيف عند السبر (BOP)
                </Label>
              </div>
            </div>
          </div>

          <Separator />

          {/* ===== Section 3: Treatment Presets + Plan + Notes ===== */}
          <div className="space-y-3">
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
                value={treatmentPlan} onChange={e => setTreatmentPlan(e.target.value)}
                placeholder="وصف خطة العلاج..." rows={2} className="resize-none text-sm"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs">الملاحظات</Label>
              <Textarea
                value={notes} onChange={e => setNotes(e.target.value)}
                placeholder="ملاحظات سريرية..." rows={2} className="resize-none text-sm"
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

          {/* ===== Section 4: Collapsible Advanced ===== */}
          <Collapsible open={advancedOpen} onOpenChange={setAdvancedOpen}>
            <CollapsibleTrigger asChild>
              <button className="flex items-center gap-2 w-full py-2 px-3 rounded-lg border bg-muted/50 hover:bg-muted transition-colors text-sm font-medium text-muted-foreground">
                <ChevronDown className={`w-4 h-4 transition-transform ${advancedOpen ? 'rotate-180' : ''}`} />
                قياسات متقدمة (جيوب لثوية، انحسار، جذور)
              </button>
            </CollapsibleTrigger>
            <CollapsibleContent className="pt-3 space-y-4">
              {/* Probing Depths */}
              <div className="space-y-2">
                <Label className="text-xs flex items-center gap-1">
                  عمق الجيوب (mm)
                  <span className="text-muted-foreground">(≤3 طبيعي | 4-5 معتدل | ≥6 شديد)</span>
                </Label>
                <div className="grid grid-cols-6 gap-1.5">
                  {probingDepths.map((depth, i) => (
                    <div key={i} className="text-center">
                      <div className="text-[10px] text-muted-foreground mb-0.5">{probingLabels[i]}</div>
                      <Input type="number" min="0" max="15" value={depth}
                        onChange={e => { const v = [...probingDepths]; v[i] = parseInt(e.target.value) || 0; setProbingDepths(v); }}
                        className={`text-center text-xs h-7 font-bold ${getDepthColor(depth)}`}
                      />
                    </div>
                  ))}
                </div>
              </div>

              {/* Recession */}
              <div className="space-y-2">
                <Label className="text-xs">انحسار اللثة (mm)</Label>
                <div className="grid grid-cols-6 gap-1.5">
                  {recession.map((val, i) => (
                    <div key={i} className="text-center">
                      <div className="text-[10px] text-muted-foreground mb-0.5">{probingLabels[i]}</div>
                      <Input type="number" min="0" max="10" value={val}
                        onChange={e => { const v = [...recession]; v[i] = parseInt(e.target.value) || 0; setRecession(v); }}
                        className="text-center text-xs h-7"
                      />
                    </div>
                  ))}
                </div>
              </div>

              {/* Plaque Index */}
              <div className="space-y-1">
                <Label className="text-xs">مؤشر اللويحة</Label>
                <div className="flex gap-1">
                  {[0,1,2,3].map(v => (
                    <button key={v} onClick={() => setPlaqueIndex(v)}
                      className={`px-3 py-1 rounded text-xs border transition-all
                        ${plaqueIndex === v ? 'bg-primary/10 border-primary text-primary font-medium' : 'bg-background border-border text-muted-foreground hover:bg-muted'}`}
                    >{v}</button>
                  ))}
                </div>
              </div>

              <Separator />

              {/* Roots */}
              <div className="space-y-3">
                <Label className="text-xs font-semibold">الجذور وعلاج العصب</Label>
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <Label className="text-xs">عدد الجذور:</Label>
                    <div className="flex gap-1">
                      {[1,2,3,4].map(v => (
                        <button key={v} onClick={() => {
                          setRootCount(v);
                          setRootConditions(prev => { const a=[...prev]; while(a.length<v) a.push('healthy'); return a.slice(0,v); });
                        }}
                          className={`w-7 h-7 rounded text-xs font-bold border transition-all
                            ${rootCount === v ? 'bg-primary/10 border-primary text-primary' : 'bg-background border-border text-muted-foreground hover:bg-muted'}`}
                        >{v}</button>
                      ))}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Checkbox id="endo" checked={endoTreatment} onCheckedChange={v => setEndoTreatment(v as boolean)} />
                    <Label htmlFor="endo" className="text-xs">تم علاج العصب</Label>
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                  {rootConditions.slice(0, rootCount).map((cond, i) => (
                    <div key={i} className="space-y-0.5">
                      <Label className="text-[10px] text-muted-foreground">الجذر {i+1}</Label>
                      <Select value={cond} onValueChange={v => { const a=[...rootConditions]; a[i]=v; setRootConditions(a); }}>
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
                  <div className="grid grid-cols-2 gap-3">
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
            </CollapsibleContent>
          </Collapsible>

          {/* ===== Section 5: History (inline, collapsed by default) ===== */}
          {toothHistory.length > 0 && (
            <Collapsible>
              <CollapsibleTrigger asChild>
                <button className="flex items-center gap-2 w-full py-2 px-3 rounded-lg border bg-muted/50 hover:bg-muted transition-colors text-sm font-medium text-muted-foreground">
                  <Clock className="w-4 h-4" />
                  السجلات السابقة ({toothHistory.length})
                </button>
              </CollapsibleTrigger>
              <CollapsibleContent className="pt-2 space-y-2">
                {toothHistory.map((record: any, i: number) => (
                  <div key={record.id || i} className="flex items-start gap-2 p-2 rounded-lg border text-xs">
                    <div className="w-2 h-2 mt-1.5 rounded-full shrink-0" style={{
                      backgroundColor: CONDITION_OPTIONS.find(o => o.value === record.diagnosis)?.color || '#9E9E9E'
                    }} />
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <span className="font-medium">{CONDITION_OPTIONS.find(o => o.value === record.diagnosis)?.label || record.diagnosis}</span>
                        <Badge variant="outline" className="text-[10px] h-4">
                          {STATUS_OPTIONS.find(o => o.value === record.status)?.label || record.status}
                        </Badge>
                      </div>
                      {record.treatment_plan && <p className="text-muted-foreground mt-0.5">{record.treatment_plan}</p>}
                      {record.treatment_date && (
                        <p className="text-muted-foreground">{format(new Date(record.treatment_date), 'PPP', { locale: ar })}</p>
                      )}
                    </div>
                  </div>
                ))}
              </CollapsibleContent>
            </Collapsible>
          )}
        </div>

        {/* Save/Cancel */}
        <div className="flex justify-end gap-3 pt-4 border-t">
          <Button variant="outline" onClick={onClose} size="sm">إلغاء</Button>
          <Button onClick={handleSave} disabled={isSaving} size="sm" className="min-w-[100px]">
            <Save className="w-4 h-4 ml-1" />
            {isSaving ? 'جاري الحفظ...' : 'حفظ'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
