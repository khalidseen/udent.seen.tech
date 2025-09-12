import { ANATOMICAL_POSITIONS, ToothType } from '@/types/anatomical-dental';
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Heart, AlertTriangle, Plus, Edit, FileText, Calendar, Trash2, Save, X, Sparkles, ArrowLeft } from 'lucide-react';
import ToothNoteDialog from './ToothNoteDialog';
import { ToothNumberingSystem, ViewMode } from '@/types/dental-enhanced';

import { AnatomicalDentalChart } from './AnatomicalDentalChart';

interface Enhanced2DToothChartProps {
  patientId?: string;
  onToothSelect: (toothNumber: string) => void;
  selectedTooth?: string;
}

interface ToothCondition {
  id: string;
  tooth_number: string;
  condition_type: string;
  condition_color: string;
  notes: string;
  numbering_system: string;
  patient_id: string;
  clinic_id: string;
  treatment_date: string;
  created_at: string;
  updated_at: string;
}

interface ToothNote {
  id: string;
  tooth_number: string;
  title: string;
  content: string;
  note_type: string;
  priority: string;
  created_at: string;
}

const Enhanced2DToothChart = ({
  patientId,
  onToothSelect,
  selectedTooth
}: Enhanced2DToothChartProps) => {
  const [noteDialogOpen, setNoteDialogOpen] = useState(false);
  const [conditionDialogOpen, setConditionDialogOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("traditional");
  const [newNote, setNewNote] = useState({
    title: '',
    content: '',
    note_type: 'general',
    priority: 'medium'
  });
  const [newCondition, setNewCondition] = useState({
    condition_type: 'healthy',
    condition_color: '#10b981',
    notes: ''
  });
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // دالة لربط الألوان تلقائياً بنوع الحالة
  const getConditionColor = (conditionType: string) => {
    switch (conditionType) {
      case 'healthy':
        return '#10b981'; // أخضر (سليم)
      case 'decay':
        return '#f59e0b'; // برتقالي (تسوس)
      case 'filled':
        return '#3b82f6'; // أزرق (محشو)
      case 'crown':
        return '#8b5cf6'; // بنفسجي (تاج)
      case 'root_canal':
        return '#ec4899'; // وردي (علاج عصب)
      case 'implant':
        return '#10b981'; // أخضر (زراعة)
      case 'missing':
        return '#6b7280'; // رمادي (مفقود)
      default:
        return '#10b981'; // أخضر افتراضي
    }
  };
  
  // Fetch tooth conditions query
  const { data: toothConditions } = useQuery({
    queryKey: ['tooth-conditions', patientId],
    queryFn: async () => {
      if (!patientId) return [];
      const { data, error } = await supabase
        .from('tooth_conditions')
        .select('*')
        .eq('patient_id', patientId);
      
      if (error) {
        toast({
          title: 'خطأ في جلب حالات الأسنان',
          description: error.message,
          variant: 'destructive'
        });
        return [];
      }
      
      return data as ToothCondition[];
    },
    enabled: !!patientId
  });
  
  // Fetch tooth notes query
  const { data: toothNotes } = useQuery({
    queryKey: ['advanced-tooth-notes', patientId],
    queryFn: async () => {
      if (!patientId) return [];
      const { data, error } = await supabase
        .from('tooth_notes')
        .select('*')
        .eq('patient_id', patientId);
      
      if (error) {
        toast({
          title: 'خطأ في جلب ملاحظات الأسنان',
          description: error.message,
          variant: 'destructive'
        });
        return [];
      }
      
      return data as ToothNote[];
    },
    enabled: !!patientId
  });
  
  // Add condition mutation
  const addConditionMutation = useMutation({
    mutationFn: async (condition: {
      condition_type: string;
      condition_color: string;
      notes: string;
    }) => {
      if (!patientId || !selectedTooth) {
        throw new Error('يجب اختيار مريض وسن');
      }
      
      // Check if condition already exists
      const existingCondition = toothConditions?.find(c => c.tooth_number === selectedTooth);
      
      if (existingCondition) {
        // Update existing condition
        const { data, error } = await supabase
          .from('tooth_conditions')
          .update({
            condition_type: condition.condition_type,
            condition_color: condition.condition_color,
            notes: condition.notes,
            updated_at: new Date().toISOString()
          })
          .eq('id', existingCondition.id);
          
        if (error) throw error;
        return data;
      } else {
        // Insert new condition
        const { data, error } = await supabase
          .from('tooth_conditions')
          .insert({
            tooth_number: selectedTooth,
            condition_type: condition.condition_type,
            condition_color: condition.condition_color,
            notes: condition.notes,
            numbering_system: 'universal',
            patient_id: patientId,
            clinic_id: '1', // Replace with actual clinic ID
            treatment_date: new Date().toISOString(),
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          });
          
        if (error) throw error;
        return data;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tooth-conditions'] });
      setConditionDialogOpen(false);
      setNewCondition({
        condition_type: 'healthy',
        condition_color: '#10b981',
        notes: ''
      });
      toast({
        title: "تم بنجاح",
        description: "تم إضافة حالة السن بنجاح"
      });
    },
    onError: (error) => {
      toast({
        title: "خطأ",
        description: error instanceof Error ? error.message : "حدث خطأ أثناء حفظ حالة السن",
        variant: "destructive"
      });
    }
  });

  const handleToothClick = (toothNumber: string) => {
    onToothSelect(toothNumber);
  };

  const getToothCondition = (toothNumber: string) => {
    return toothConditions?.find(c => c.tooth_number === toothNumber);
  };

  const getToothNotes = (toothNumber: string) => {
    return toothNotes?.filter(n => n.tooth_number === toothNumber) || [];
  };

  const getToothColor = (toothNumber: string) => {
    const condition = getToothCondition(toothNumber);
    const notes = getToothNotes(toothNumber);
    const hasHighPriorityNotes = notes.some(n => n.priority === 'high');
    
    if (!condition && notes.length === 0) return 'default';
    if (hasHighPriorityNotes) return 'warning';
    
    switch (condition?.condition_type) {
      case 'decay':
        return 'decay';
      case 'filled':
        return 'filled';
      case 'crown':
        return 'crown';
      case 'missing':
        return 'missing';
      case 'root_canal':
        return 'root_canal';
      case 'implant':
        return 'implant';
      default:
        return notes.length > 0 ? 'has_notes' : 'healthy';
    }
  };

  const getToothColorClasses = (colorType: string, isSelected: boolean) => {
    if (isSelected) {
      return "bg-primary text-primary-foreground border-primary shadow-lg";
    }
    
    switch (colorType) {
      case 'critical':
        return "bg-red-100 border-red-500 text-red-800 hover:bg-red-150";
      case 'decay':
        return "bg-orange-100 border-orange-500 text-orange-800 hover:bg-orange-150";
      case 'filled':
        return "bg-blue-100 border-blue-500 text-blue-800 hover:bg-blue-150";
      case 'crown':
        return "bg-purple-100 border-purple-500 text-purple-800 hover:bg-purple-150";
      case 'missing':
        return "bg-gray-200 border-gray-500 text-gray-800 hover:bg-gray-250";
      case 'root_canal':
        return "bg-pink-100 border-pink-500 text-pink-800 hover:bg-pink-150";
      case 'implant':
        return "bg-green-100 border-green-500 text-green-800 hover:bg-green-150";
      case 'warning':
        return "bg-yellow-100 border-yellow-500 text-yellow-800 hover:bg-yellow-150";
      case 'has_notes':
        return "bg-cyan-100 border-cyan-500 text-cyan-800 hover:bg-cyan-150";
      case 'healthy':
        return "bg-emerald-100 border-emerald-500 text-emerald-800 hover:bg-emerald-150";
      default:
        return "bg-background border-border hover:bg-accent hover:text-accent-foreground";
    }
  };

  const renderTooth = (toothNumber: string, isUpper: boolean, index: number) => {
    const isSelected = selectedTooth === toothNumber;
    const condition = getToothCondition(toothNumber);
    const notes = getToothNotes(toothNumber);
    const colorType = getToothColor(toothNumber);

    // Determine tooth shape based on position
    const isMolar = index < 3 || index > 12;
    const isPremolar = index >= 3 && index <= 5 || index >= 10 && index <= 12;
    const isCanine = index === 6 || index === 9;
    const isIncisor = index === 7 || index === 8;
    
    let toothShape = "rounded-md h-8 w-6";
    if (isMolar) toothShape = "rounded-lg h-10 w-8";
    if (isPremolar) toothShape = "rounded-md h-9 w-7";
    if (isCanine) toothShape = "rounded-full h-10 w-6";
    if (isIncisor) toothShape = "rounded-sm h-8 w-5";
    
    // Create tooltip content for hover
    const tooltipContent = `السن رقم ${toothNumber} (Universal)${condition ? ` - ${condition.condition_type}` : ''}${notes.length > 0 ? `\nالملاحظات:\n${notes.map(n => `• ${n.title}: ${n.content.substring(0, 50)}${n.content.length > 50 ? '...' : ''}`).join('\n')}` : ''}`;
    
    return (
      <div key={`${isUpper ? 'upper' : 'lower'}-${toothNumber}`} className="relative">
        <button 
          onClick={() => handleToothClick(toothNumber)} 
          className={cn(
            toothShape, 
            "border-2 transition-all duration-200 hover:scale-110 flex items-center justify-center text-xs font-bold relative group", 
            getToothColorClasses(colorType, isSelected)
          )} 
          title={tooltipContent}
        >
          {toothNumber}
          
          {/* Notes indicator */}
          {notes.length > 0 && (
            <div className="absolute -top-1 -right-1">
              <Badge 
                variant={notes.some(n => n.priority === 'high') ? "destructive" : "secondary"} 
                className="text-xs h-4 w-4 p-0 flex items-center justify-center rounded-full"
              >
                {notes.length}
              </Badge>
            </div>
          )}
          
          {/* Condition indicator */}
          {condition && condition.condition_type === 'decay' && (
            <div className="absolute -top-1 -left-1">
              <AlertTriangle className="h-3 w-3 text-red-600" />
            </div>
          )}
          
          {/* Hover tooltip for notes */}
          {notes.length > 0 && (
            <div className="absolute bottom-full mb-2 left-1/2 transform -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-50 pointer-events-none">
              <div className="bg-popover text-popover-foreground border rounded-lg shadow-lg p-3 max-w-xs whitespace-pre-line text-right text-xs">
                <div className="font-medium mb-2">ملاحظات السن {toothNumber}:</div>
                {notes.slice(0, 3).map((note, idx) => (
                  <div key={note.id} className="mb-1 last:mb-0">
                    <div className="font-medium text-primary">{note.title}</div>
                    <div className="text-muted-foreground">
                      {note.content.length > 80 ? note.content.substring(0, 80) + '...' : note.content}
                    </div>
                    {note.priority === 'high' && (
                      <Badge variant="destructive" className="text-xs mt-1">
                        أولوية عالية
                      </Badge>
                    )}
                  </div>
                ))}
                {notes.length > 3 && (
                  <div className="text-muted-foreground text-xs mt-1">
                    و {notes.length - 3} ملاحظات أخرى...
                  </div>
                )}
              </div>
            </div>
          )}
        </button>
      </div>
    );
  };
  
  // Render dental chart with tabs
  const toothNumbers = {
    upper: ['18', '17', '16', '15', '14', '13', '12', '11', '21', '22', '23', '24', '25', '26', '27', '28'],
    lower: ['48', '47', '46', '45', '44', '43', '42', '41', '31', '32', '33', '34', '35', '36', '37', '38']
  };
  
  return (
    <div className="space-y-4">
      {/* تبويبات أنظمة الأسنان */}
      {patientId && (
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2 bg-muted/30">
            <TabsTrigger 
              value="traditional" 
              className="text-sm font-medium data-[state=active]:bg-white data-[state=active]:text-foreground"
            >
              النظام التقليدي
            </TabsTrigger>
            <TabsTrigger 
              value="anatomical"
              className="text-sm font-medium data-[state=active]:bg-gradient-to-r data-[state=active]:from-teal-50 data-[state=active]:to-cyan-50 data-[state=active]:text-teal-800"
            >
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4" />
                <span className="text-xs">مخطط أسنان عالمي بمعايير WHO وأنظمة ترقيم متعددة</span>
                <Badge variant="destructive" className="text-xs animate-pulse">جديد!</Badge>
              </div>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="traditional" className="mt-4">
            {/* النظام التقليدي */}
      
      <Card className="w-full max-w-6xl mx-auto">
        <CardContent className="space-y-8">
          {/* Main Layout with Side Panels */}
          <div className="flex gap-6">
            {/* Left Side - Control Buttons */}
            <div className="w-64 space-y-4">
              <h3 className="text-sm font-medium text-center text-muted-foreground border-b pb-2">
                أدوات التحكم
              </h3>
              
              {/* Selected Tooth Info and Controls */}
              {selectedTooth ? (
                <div className="bg-muted/50 p-4 rounded-lg space-y-4">
                  <h4 className="font-medium text-center">السن المختار: {selectedTooth}</h4>
                  
                  {/* Control Buttons */}
                  <div className="space-y-2">
                    <Button 
                      size="sm" 
                      onClick={() => setNoteDialogOpen(true)}
                      className="w-full flex items-center gap-2"
                    >
                      <Plus className="h-4 w-4" />
                      إضافة ملاحظة
                    </Button>
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => setConditionDialogOpen(true)}
                      className="w-full flex items-center gap-2"
                    >
                      <Edit className="h-4 w-4" />
                      تحديث الحالة
                    </Button>
                    {getToothNotes(selectedTooth).length > 0 && (
                      <Button 
                        size="sm" 
                        variant="secondary"
                        onClick={() => setNoteDialogOpen(true)}
                        className="w-full flex items-center gap-2"
                      >
                        <FileText className="h-4 w-4" />
                        عرض الملاحظات ({getToothNotes(selectedTooth).length})
                      </Button>
                    )}
                  </div>
                  
                  {/* Current Condition */}
                  {getToothCondition(selectedTooth) && (
                    <div className="space-y-2">
                      <h5 className="text-sm font-medium">الحالة الحالية:</h5>
                      <Badge variant="outline" className="text-xs">
                        {getToothCondition(selectedTooth)?.condition_type}
                      </Badge>
                    </div>
                  )}
                  
                  {/* Recent Notes Summary */}
                  {getToothNotes(selectedTooth).length > 0 && (
                    <div className="space-y-2">
                      <h5 className="text-sm font-medium">ملخص الملاحظات:</h5>
                      <div className="space-y-1 max-h-32 overflow-y-auto">
                        {getToothNotes(selectedTooth).slice(0, 2).map(note => (
                          <div key={note.id} className="text-xs bg-background p-2 rounded border">
                            <div className="font-medium">{note.title}</div>
                            <div className="text-muted-foreground truncate">{note.content}</div>
                          </div>
                        ))}
                        {getToothNotes(selectedTooth).length > 2 && (
                          <div className="text-xs text-muted-foreground text-center">
                            و {getToothNotes(selectedTooth).length - 2} ملاحظات أخرى...
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="bg-muted/30 p-4 rounded-lg text-center text-muted-foreground">
                  <p className="text-sm">اختر سناً من المخطط لعرض التحكم</p>
                </div>
              )}
            </div>

            {/* Center - Dental Chart */}
            <div className="flex-1">
              <div className="space-y-6">
                {/* Upper Teeth */}
                <div className="flex justify-center gap-1">
                  {toothNumbers.upper.map((toothNumber, index) => renderTooth(toothNumber, true, index))}
                </div>
                
                {/* Divider with Legend */}
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <div className="flex-1 h-px bg-border"></div>
                  <span>الفك العلوي ⬆️ | الفك السفلي ⬇️</span>
                  <div className="flex-1 h-px bg-border"></div>
                </div>
                
                {/* Lower Teeth */}
                <div className="flex justify-center gap-1">
                  {toothNumbers.lower.map((toothNumber, index) => renderTooth(toothNumber, false, index))}
                </div>
              </div>
            </div>

            {/* Right Side - Selected Tooth Details */}
            <div className="w-64 space-y-4">
              <h3 className="text-sm font-medium text-center text-muted-foreground border-b pb-2">
                تفاصيل السن
              </h3>
              
              {selectedTooth ? (
                <div className="bg-muted/50 p-4 rounded-lg space-y-4">
                  {/* Selected Tooth Details */}
                  <div className="text-center space-y-2">
                    <div className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
                      {selectedTooth}
                    </div>
                    <div className="font-medium">السن رقم {selectedTooth}</div>
                    
                    {/* Details */}
                    <div className="text-xs text-muted-foreground space-y-1 text-right">
                      <div>نظام الترقيم: Universal</div>
                      {(() => {
                        const toothNum = parseInt(selectedTooth);
                        let position = '';
                        if (toothNum >= 11 && toothNum <= 18) position = 'الفك العلوي - الجانب الأيمن';
                        else if (toothNum >= 21 && toothNum <= 28) position = 'الفك العلوي - الجانب الأيسر';
                        else if (toothNum >= 31 && toothNum <= 38) position = 'الفك السفلي - الجانب الأيسر';
                        else if (toothNum >= 41 && toothNum <= 48) position = 'الفك السفلي - الجانب الأيمن';
                        return <div>الموقع: {position}</div>;
                      })()}
                      {(() => {
                        const toothNum = parseInt(selectedTooth);
                        let type = '';
                        const lastDigit = toothNum % 10;
                        if (lastDigit === 1 || lastDigit === 2) type = 'قاطع';
                        else if (lastDigit === 3) type = 'ناب';
                        else if (lastDigit === 4 || lastDigit === 5) type = 'ضاحك';
                        else if (lastDigit === 6 || lastDigit === 7 || lastDigit === 8) type = 'طاحن';
                        return <div>النوع: {type}</div>;
                      })()}
                    </div>
                  </div>
                  
                  {/* Tooth Status */}
                  <div className="space-y-4 border-t pt-4">
                    <div className="flex items-center justify-between">
                      <div className="text-sm font-medium">حالة السن:</div>
                      {(() => {
                        const condition = getToothCondition(selectedTooth);
                        const hasNotes = getToothNotes(selectedTooth).length > 0;
                        const toothNotesForTooth = getToothNotes(selectedTooth);
                        const hasCondition = !!condition;
                        
                        return (
                          <div className="flex items-center gap-2">
                            <Badge variant={hasCondition ? (condition.condition_type === 'healthy' ? 'default' : 'secondary') : 'outline'}>
                              {hasCondition ? condition.condition_type : 'غير محدد'}
                            </Badge>
                            {hasNotes && (
                              <Badge variant="secondary" className="text-xs">
                                {toothNotesForTooth.length} ملاحظة
                              </Badge>
                            )}
                          </div>
                        );
                      })()}
                    </div>
                    
                    {/* Condition Info */}
                    {(() => {
                      const condition = getToothCondition(selectedTooth);
                      const toothNotesForTooth = getToothNotes(selectedTooth);
                      const hasCondition = !!condition;
                      const hasNotes = toothNotesForTooth.length > 0;
                      
                      return (
                        <>
                          {hasCondition && (
                            <div className="mb-2 text-xs">
                              <span className="text-muted-foreground">الحالة: </span>
                              <span className="font-medium">{condition.condition_type}</span>
                              {condition.notes && (
                                <div className="text-muted-foreground mt-1">
                                  {condition.notes}
                                </div>
                              )}
                            </div>
                          )}
                          
                          {/* Notes Info */}
                          {hasNotes && (
                            <div className="space-y-1">
                              <span className="text-xs text-muted-foreground">الملاحظات:</span>
                              {toothNotesForTooth.slice(0, 2).map(note => (
                                <div key={note.id} className="text-xs bg-muted/30 p-2 rounded">
                                  <div className="flex items-center justify-between mb-1">
                                    <span className="font-medium">{note.title}</span>
                                    {note.priority === 'high' && (
                                      <Badge variant="destructive" className="text-xs">عالية</Badge>
                                    )}
                                  </div>
                                  <div className="text-muted-foreground">{note.content}</div>
                                  <div className="text-muted-foreground mt-1">
                                    {new Date(note.created_at).toLocaleDateString('ar-SA')}
                                  </div>
                                </div>
                              ))}
                              {toothNotesForTooth.length > 2 && (
                                <div className="text-xs text-muted-foreground text-center">
                                  و {toothNotesForTooth.length - 2} ملاحظات أخرى...
                                </div>
                              )}
                            </div>
                          )}
                        </>
                      );
                    })()}
                  </div>
                </div>
              ) : (
                <div className="bg-muted/30 p-4 rounded-lg text-center text-muted-foreground">
                  <p className="text-sm">اختر سناً من المخطط لعرض التفاصيل</p>
                </div>
              )}
              
              {/* Show message if no teeth have conditions or notes */}
              {patientId && [...toothNumbers.upper, ...toothNumbers.lower].every(toothNumber => {
                const hasCondition = getToothCondition(toothNumber);
                const hasNotes = getToothNotes(toothNumber).length > 0;
                return !hasCondition && !hasNotes;
              }) && (
                <div className="text-center text-muted-foreground text-sm py-8">
                  لا توجد حالات أو ملاحظات مسجلة
                </div>
              )}
            </div>
          </div>

          {/* Enhanced Legend */}
          <div className="bg-muted p-4 rounded-lg">
            <h4 className="text-sm font-medium mb-3 text-center">مفتاح الألوان والحالات:</h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-emerald-100 border border-emerald-500 rounded"></div>
                <span>سليم</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-orange-100 border border-orange-500 rounded"></div>
                <span>تسوس</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-blue-100 border border-blue-500 rounded"></div>
                <span>محشو</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-purple-100 border border-purple-500 rounded"></div>
                <span>تاج</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-pink-100 border border-pink-500 rounded"></div>
                <span>علاج عصب</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-green-100 border border-green-500 rounded"></div>
                <span>زراعة</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-gray-200 border border-gray-500 rounded"></div>
                <span>مفقود</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-cyan-100 border border-cyan-500 rounded"></div>
                <span>له ملاحظات</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {patientId && selectedTooth && (
        <ToothNoteDialog 
          isOpen={noteDialogOpen} 
          onOpenChange={setNoteDialogOpen} 
          patientId={patientId} 
          toothNumber={selectedTooth} 
          numberingSystem="universal" 
          onNoteUpdate={() => {
            queryClient.invalidateQueries({
              queryKey: ['advanced-tooth-notes']
            });
          }} 
        />
      )}
          </TabsContent>

          <TabsContent value="anatomical" className="mt-4">
            {/* النظام التشريحي */}
            <AnatomicalDentalChart
              patientId={patientId || undefined}
              onToothSelect={onToothSelect}
              onSaveRecord={(record) => {
                console.log('حفظ سجل السن:', record);
              }}
            />
          </TabsContent>
        </Tabs>
      )}

      {/* Add Condition Dialog */}
      <Dialog open={conditionDialogOpen} onOpenChange={setConditionDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>تحديث حالة السن {selectedTooth}</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <Label htmlFor="condition-type">نوع الحالة</Label>
              <Select 
                value={newCondition.condition_type} 
                onValueChange={value => {
                  const color = getConditionColor(value);
                  setNewCondition({
                    ...newCondition,
                    condition_type: value,
                    condition_color: color
                  });
                }}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="healthy">سليم</SelectItem>
                  <SelectItem value="decay">تسوس</SelectItem>
                  <SelectItem value="filled">محشو</SelectItem>
                  <SelectItem value="crown">تاج</SelectItem>
                  <SelectItem value="root_canal">علاج عصب</SelectItem>
                  <SelectItem value="implant">زراعة</SelectItem>
                  <SelectItem value="missing">مفقود</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label htmlFor="condition-notes">ملاحظات إضافية</Label>
              <Textarea 
                id="condition-notes" 
                value={newCondition.notes} 
                onChange={e => setNewCondition({
                  ...newCondition,
                  notes: e.target.value
                })} 
                placeholder="أدخل ملاحظات إضافية عن حالة السن" 
                rows={3} 
              />
            </div>
            
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setConditionDialogOpen(false)}>
                <X className="h-4 w-4 ml-2" />
                إلغاء
              </Button>
              <Button onClick={() => addConditionMutation.mutate(newCondition)}>
                <Save className="h-4 w-4 ml-2" />
                حفظ
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Enhanced2DToothChart;
