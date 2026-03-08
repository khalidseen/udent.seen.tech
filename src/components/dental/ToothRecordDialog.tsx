import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { 
  Save, Activity, FileText, Heart, Zap, Clock, Stethoscope,
  AlertTriangle, CalendarDays
} from "lucide-react";
import { ToothSurfaceSVG, SURFACE_CONDITION_CYCLE } from './ToothSurfaceSVG';
import { DentalTreatmentRecord } from '@/hooks/useDentalChart';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';

// ICD-10 Dental Codes
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
  { code: 'K08.4', label: 'فقدان أسنان جزئي' },
  { code: 'S02.5', label: 'كسر في السن' },
  { code: 'K03.0', label: 'تآكل الأسنان' },
  { code: 'K00.6', label: 'اضطرابات بزوغ الأسنان' },
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
  { value: 'planned', label: 'مخطط' },
  { value: 'in_progress', label: 'قيد العلاج' },
  { value: 'completed', label: 'مكتمل' },
  { value: 'cancelled', label: 'ملغي' },
];

interface ToothRecordDialogProps {
  isOpen: boolean;
  onClose: () => void;
  toothNumber: string; // FDI number like "18", "11", etc.
  existingRecord?: DentalTreatmentRecord | null;
  patientId: string;
  onSave: (data: Omit<DentalTreatmentRecord, 'id' | 'clinic_id'> & { id?: string }) => void;
  isSaving?: boolean;
  toothHistory?: any[];
}

export const ToothRecordDialog: React.FC<ToothRecordDialogProps> = ({
  isOpen,
  onClose,
  toothNumber,
  existingRecord,
  patientId,
  onSave,
  isSaving,
  toothHistory = [],
}) => {
  // Form state
  const [diagnosis, setDiagnosis] = useState('sound');
  const [icdCode, setIcdCode] = useState('');
  const [treatmentPlan, setTreatmentPlan] = useState('');
  const [status, setStatus] = useState('planned');
  const [notes, setNotes] = useState('');
  const [treatmentDate, setTreatmentDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [followUpDate, setFollowUpDate] = useState('');
  const [estimatedCost, setEstimatedCost] = useState('');

  // Surfaces
  const [surfaces, setSurfaces] = useState({
    mesial: 'sound', distal: 'sound', buccal: 'sound',
    lingual: 'sound', occlusal: 'sound',
  });

  // Clinical measurements
  const [mobility, setMobility] = useState(0);
  const [probingDepths, setProbingDepths] = useState([2, 2, 2, 2, 2, 2]);
  const [bleeding, setBleeding] = useState(false);
  const [recession, setRecession] = useState([0, 0, 0, 0, 0, 0]);
  const [plaqueIndex, setPlaqueIndex] = useState(0);

  // Root details
  const [rootCount, setRootCount] = useState(1);
  const [endoTreatment, setEndoTreatment] = useState(false);
  const [endoDate, setEndoDate] = useState('');
  const [endoMaterial, setEndoMaterial] = useState('');
  const [rootConditions, setRootConditions] = useState<string[]>(['healthy']);

  // Load existing record
  useEffect(() => {
    if (existingRecord) {
      setDiagnosis(existingRecord.diagnosis || 'sound');
      setTreatmentPlan(existingRecord.treatment_plan || '');
      setStatus(existingRecord.status || 'planned');
      setNotes(existingRecord.notes || '');
      setTreatmentDate(existingRecord.treatment_date || format(new Date(), 'yyyy-MM-dd'));
      
      // Parse surfaces from tooth_surface field
      if (existingRecord.tooth_surface) {
        try {
          const parsed = JSON.parse(existingRecord.tooth_surface);
          if (parsed.surfaces) setSurfaces(parsed.surfaces);
          if (parsed.icdCode) setIcdCode(parsed.icdCode);
          if (parsed.mobility !== undefined) setMobility(parsed.mobility);
          if (parsed.probingDepths) setProbingDepths(parsed.probingDepths);
          if (parsed.bleeding !== undefined) setBleeding(parsed.bleeding);
          if (parsed.recession) setRecession(parsed.recession);
          if (parsed.rootCount) setRootCount(parsed.rootCount);
          if (parsed.endoTreatment !== undefined) setEndoTreatment(parsed.endoTreatment);
          if (parsed.endoDate) setEndoDate(parsed.endoDate);
          if (parsed.endoMaterial) setEndoMaterial(parsed.endoMaterial);
          if (parsed.rootConditions) setRootConditions(parsed.rootConditions);
          if (parsed.followUpDate) setFollowUpDate(parsed.followUpDate);
          if (parsed.estimatedCost) setEstimatedCost(parsed.estimatedCost);
          if (parsed.plaqueIndex !== undefined) setPlaqueIndex(parsed.plaqueIndex);
        } catch { /* ignore parse errors */ }
      }
    } else {
      // Reset defaults
      setDiagnosis('sound');
      setIcdCode('');
      setTreatmentPlan('');
      setStatus('planned');
      setNotes('');
      setTreatmentDate(format(new Date(), 'yyyy-MM-dd'));
      setFollowUpDate('');
      setEstimatedCost('');
      setSurfaces({ mesial: 'sound', distal: 'sound', buccal: 'sound', lingual: 'sound', occlusal: 'sound' });
      setMobility(0);
      setProbingDepths([2, 2, 2, 2, 2, 2]);
      setBleeding(false);
      setRecession([0, 0, 0, 0, 0, 0]);
      setPlaqueIndex(0);
      setRootCount(1);
      setEndoTreatment(false);
      setEndoDate('');
      setEndoMaterial('');
      setRootConditions(['healthy']);
    }
  }, [existingRecord, toothNumber, isOpen]);

  const handleSurfaceClick = (surface: keyof typeof surfaces) => {
    const currentIdx = SURFACE_CONDITION_CYCLE.indexOf(surfaces[surface]);
    const nextIdx = (currentIdx + 1) % SURFACE_CONDITION_CYCLE.length;
    setSurfaces(prev => ({ ...prev, [surface]: SURFACE_CONDITION_CYCLE[nextIdx] }));
  };

  const handleSave = () => {
    const clinicalData = JSON.stringify({
      surfaces,
      icdCode,
      mobility,
      probingDepths,
      bleeding,
      recession,
      plaqueIndex,
      rootCount,
      endoTreatment,
      endoDate,
      endoMaterial,
      rootConditions,
      followUpDate,
      estimatedCost,
    });

    onSave({
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
    });
  };

  const probingLabels = ['MB', 'B', 'DB', 'ML', 'L', 'DL'];

  const getDepthColor = (depth: number) => {
    if (depth <= 3) return 'text-green-600 border-green-300';
    if (depth <= 5) return 'text-yellow-600 border-yellow-300';
    return 'text-red-600 border-red-300 bg-red-50';
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold flex items-center gap-3">
            <span className="text-2xl">🦷</span>
            <span>سجل السن رقم {toothNumber} (FDI)</span>
            {existingRecord && (
              <Badge variant="outline" className="text-xs">
                سجل موجود
              </Badge>
            )}
          </DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="diagnosis" className="w-full" dir="rtl">
          <TabsList className="grid w-full grid-cols-6 h-auto">
            <TabsTrigger value="diagnosis" className="text-xs py-2">
              <Stethoscope className="w-3.5 h-3.5 ml-1" />
              التشخيص
            </TabsTrigger>
            <TabsTrigger value="surfaces" className="text-xs py-2">
              <Activity className="w-3.5 h-3.5 ml-1" />
              الأسطح
            </TabsTrigger>
            <TabsTrigger value="clinical" className="text-xs py-2">
              <Heart className="w-3.5 h-3.5 ml-1" />
              القياسات
            </TabsTrigger>
            <TabsTrigger value="roots" className="text-xs py-2">
              <Zap className="w-3.5 h-3.5 ml-1" />
              الجذور
            </TabsTrigger>
            <TabsTrigger value="treatment" className="text-xs py-2">
              <FileText className="w-3.5 h-3.5 ml-1" />
              خطة العلاج
            </TabsTrigger>
            <TabsTrigger value="history" className="text-xs py-2">
              <Clock className="w-3.5 h-3.5 ml-1" />
              التاريخ
            </TabsTrigger>
          </TabsList>

          {/* Diagnosis Tab */}
          <TabsContent value="diagnosis" className="space-y-4 mt-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Stethoscope className="w-5 h-5 text-primary" />
                  التشخيص الأساسي
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>الحالة الأساسية</Label>
                    <Select value={diagnosis} onValueChange={setDiagnosis}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {CONDITION_OPTIONS.map(opt => (
                          <SelectItem key={opt.value} value={opt.value}>
                            <div className="flex items-center gap-2">
                              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: opt.color }} />
                              {opt.label}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>حالة العلاج</Label>
                    <Select value={status} onValueChange={setStatus}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {STATUS_OPTIONS.map(opt => (
                          <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>رمز ICD-10</Label>
                  <Select value={icdCode} onValueChange={setIcdCode}>
                    <SelectTrigger>
                      <SelectValue placeholder="اختر رمز التصنيف الدولي..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">بدون رمز</SelectItem>
                      {ICD10_CODES.map(code => (
                        <SelectItem key={code.code} value={code.code}>
                          <span className="font-mono text-xs ml-2">{code.code}</span> — {code.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>تاريخ التشخيص</Label>
                  <Input type="date" value={treatmentDate} onChange={e => setTreatmentDate(e.target.value)} />
                </div>

                {diagnosis !== 'sound' && (
                  <div className="flex items-center gap-2 p-3 rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800">
                    <AlertTriangle className="w-4 h-4 text-amber-600" />
                    <span className="text-sm text-amber-700 dark:text-amber-400">
                      هذا السن يحتاج متابعة - الحالة: {CONDITION_OPTIONS.find(o => o.value === diagnosis)?.label}
                    </span>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Surfaces Tab - Interactive SVG */}
          <TabsContent value="surfaces" className="space-y-4 mt-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">أسطح السن التفاعلية</CardTitle>
              </CardHeader>
              <CardContent className="flex justify-center">
                <ToothSurfaceSVG surfaces={surfaces} onSurfaceClick={handleSurfaceClick} />
              </CardContent>
            </Card>
          </TabsContent>

          {/* Clinical Measurements Tab */}
          <TabsContent value="clinical" className="space-y-4 mt-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Heart className="w-5 h-5 text-red-500" />
                  القياسات السريرية
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Mobility */}
                <div className="space-y-2">
                  <Label>درجة حركة السن (Miller)</Label>
                  <Select value={mobility.toString()} onValueChange={v => setMobility(parseInt(v))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="0">0 — لا توجد حركة (طبيعي)</SelectItem>
                      <SelectItem value="1">I — حركة شدقية لسانية &lt; 1mm</SelectItem>
                      <SelectItem value="2">II — حركة شدقية لسانية &gt; 1mm</SelectItem>
                      <SelectItem value="3">III — حركة عمودية (سن متحرك بشدة)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Probing Depths */}
                <div className="space-y-3">
                  <Label className="flex items-center gap-2">
                    عمق الجيوب اللثوية (mm)
                    <span className="text-xs text-muted-foreground">( ≤3 طبيعي | 4-5 معتدل | ≥6 شديد )</span>
                  </Label>
                  <div className="grid grid-cols-6 gap-2">
                    {probingDepths.map((depth, i) => (
                      <div key={i} className="text-center">
                        <div className="text-xs text-muted-foreground mb-1 font-medium">{probingLabels[i]}</div>
                        <Input
                          type="number" min="0" max="15" value={depth}
                          onChange={e => {
                            const v = [...probingDepths];
                            v[i] = parseInt(e.target.value) || 0;
                            setProbingDepths(v);
                          }}
                          className={`text-center text-sm font-bold ${getDepthColor(depth)}`}
                        />
                      </div>
                    ))}
                  </div>
                  {probingDepths.some(d => d > 3) && (
                    <div className="flex items-center gap-2 p-2 rounded bg-red-50 dark:bg-red-950/30 border border-red-200 text-sm text-red-700 dark:text-red-400">
                      <AlertTriangle className="w-4 h-4" />
                      يوجد جيوب لثوية أعمق من 3mm — يحتاج تقييم دواعم
                    </div>
                  )}
                </div>

                {/* Bleeding */}
                <div className="flex items-center gap-3 p-3 rounded-lg border">
                  <Checkbox id="bleeding" checked={bleeding} onCheckedChange={v => setBleeding(v as boolean)} />
                  <Label htmlFor="bleeding" className="flex items-center gap-1">
                    <span className="text-red-500">●</span> نزيف عند السبر (BOP)
                  </Label>
                </div>

                {/* Recession */}
                <div className="space-y-3">
                  <Label>انحسار اللثة (mm)</Label>
                  <div className="grid grid-cols-6 gap-2">
                    {recession.map((val, i) => (
                      <div key={i} className="text-center">
                        <div className="text-xs text-muted-foreground mb-1">{probingLabels[i]}</div>
                        <Input
                          type="number" min="0" max="10" value={val}
                          onChange={e => {
                            const v = [...recession];
                            v[i] = parseInt(e.target.value) || 0;
                            setRecession(v);
                          }}
                          className="text-center text-sm"
                        />
                      </div>
                    ))}
                  </div>
                </div>

                {/* Plaque Index */}
                <div className="space-y-2">
                  <Label>مؤشر اللويحة (Plaque Index)</Label>
                  <Select value={plaqueIndex.toString()} onValueChange={v => setPlaqueIndex(parseInt(v))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="0">0 — لا توجد لويحة</SelectItem>
                      <SelectItem value="1">1 — لويحة خفيفة (بالمسبار فقط)</SelectItem>
                      <SelectItem value="2">2 — لويحة متوسطة (مرئية)</SelectItem>
                      <SelectItem value="3">3 — لويحة كثيفة</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Roots Tab */}
          <TabsContent value="roots" className="space-y-4 mt-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Zap className="w-5 h-5 text-purple-500" />
                  تفاصيل الجذور وعلاج العصب
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>عدد الجذور</Label>
                    <Select value={rootCount.toString()} onValueChange={v => {
                      const count = parseInt(v);
                      setRootCount(count);
                      setRootConditions(prev => {
                        const arr = [...prev];
                        while (arr.length < count) arr.push('healthy');
                        return arr.slice(0, count);
                      });
                    }}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1">جذر واحد</SelectItem>
                        <SelectItem value="2">جذران</SelectItem>
                        <SelectItem value="3">ثلاثة جذور</SelectItem>
                        <SelectItem value="4">أربعة جذور</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex items-center gap-3 p-3 rounded-lg border">
                    <Checkbox id="endo" checked={endoTreatment} onCheckedChange={v => setEndoTreatment(v as boolean)} />
                    <Label htmlFor="endo">تم علاج العصب</Label>
                  </div>
                </div>

                {/* Individual root conditions */}
                <div className="space-y-3">
                  <Label>حالة كل جذر</Label>
                  <div className="grid grid-cols-2 gap-3">
                    {rootConditions.slice(0, rootCount).map((cond, i) => (
                      <div key={i} className="space-y-1">
                        <Label className="text-xs text-muted-foreground">الجذر {i + 1}</Label>
                        <Select value={cond} onValueChange={v => {
                          const arr = [...rootConditions];
                          arr[i] = v;
                          setRootConditions(arr);
                        }}>
                          <SelectTrigger><SelectValue /></SelectTrigger>
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
                </div>

                {endoTreatment && (
                  <>
                    <Separator />
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>تاريخ علاج العصب</Label>
                        <Input type="date" value={endoDate} onChange={e => setEndoDate(e.target.value)} />
                      </div>
                      <div className="space-y-2">
                        <Label>المادة المستخدمة</Label>
                        <Select value={endoMaterial} onValueChange={setEndoMaterial}>
                          <SelectTrigger><SelectValue placeholder="اختر..." /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="gutta_percha">Gutta Percha</SelectItem>
                            <SelectItem value="mta">MTA</SelectItem>
                            <SelectItem value="bioceramic">Bioceramic</SelectItem>
                            <SelectItem value="resilon">Resilon</SelectItem>
                            <SelectItem value="other">أخرى</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Treatment Plan Tab */}
          <TabsContent value="treatment" className="space-y-4 mt-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <FileText className="w-5 h-5 text-blue-500" />
                  خطة العلاج والملاحظات
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>خطة العلاج</Label>
                  <Textarea
                    value={treatmentPlan}
                    onChange={e => setTreatmentPlan(e.target.value)}
                    placeholder="وصف خطة العلاج المقترحة..."
                    rows={4}
                    className="resize-none"
                  />
                </div>

                <div className="space-y-2">
                  <Label>الملاحظات السريرية</Label>
                  <Textarea
                    value={notes}
                    onChange={e => setNotes(e.target.value)}
                    placeholder="ملاحظات إضافية، حالة المريض، تعليمات..."
                    rows={4}
                    className="resize-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="flex items-center gap-1">
                      <CalendarDays className="w-4 h-4" />
                      تاريخ المتابعة
                    </Label>
                    <Input type="date" value={followUpDate} onChange={e => setFollowUpDate(e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label>التكلفة التقديرية (ر.س)</Label>
                    <Input
                      type="number" min="0"
                      value={estimatedCost}
                      onChange={e => setEstimatedCost(e.target.value)}
                      placeholder="0.00"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* History Tab */}
          <TabsContent value="history" className="space-y-4 mt-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Clock className="w-5 h-5 text-muted-foreground" />
                  تاريخ السجلات
                </CardTitle>
              </CardHeader>
              <CardContent>
                {toothHistory.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">لا توجد سجلات سابقة لهذا السن</p>
                ) : (
                  <div className="space-y-3">
                    {toothHistory.map((record: any, i: number) => (
                      <div key={record.id || i} className="flex items-start gap-3 p-3 rounded-lg border">
                        <div className="w-2 h-2 mt-2 rounded-full" style={{
                          backgroundColor: CONDITION_OPTIONS.find(o => o.value === record.diagnosis)?.color || '#9E9E9E'
                        }} />
                        <div className="flex-1 space-y-1">
                          <div className="flex items-center justify-between">
                            <span className="font-medium text-sm">
                              {CONDITION_OPTIONS.find(o => o.value === record.diagnosis)?.label || record.diagnosis}
                            </span>
                            <Badge variant="outline" className="text-xs">
                              {STATUS_OPTIONS.find(o => o.value === record.status)?.label || record.status}
                            </Badge>
                          </div>
                          <p className="text-xs text-muted-foreground">{record.treatment_plan}</p>
                          <p className="text-xs text-muted-foreground">
                            {record.treatment_date && format(new Date(record.treatment_date), 'PPP', { locale: ar })}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Save/Cancel */}
        <div className="flex justify-end gap-3 pt-4 border-t">
          <Button variant="outline" onClick={onClose}>إلغاء</Button>
          <Button onClick={handleSave} disabled={isSaving} className="min-w-[120px]">
            <Save className="w-4 h-4 ml-2" />
            {isSaving ? 'جاري الحفظ...' : 'حفظ السجل'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
