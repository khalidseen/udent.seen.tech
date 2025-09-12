import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Activity, 
  Heart,
  Thermometer,
  Weight,
  Ruler,
  Plus,
  Calendar,
  TrendingUp,
  TrendingDown,
  Minus,
  AlertTriangle,
  CheckCircle,
  Info
} from 'lucide-react';
import { Patient } from '@/hooks/usePatients';
import { useToast } from '@/hooks/use-toast';

interface VitalsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  patient: Patient;
}

interface VitalReading {
  id: string;
  type: 'blood_pressure' | 'heart_rate' | 'temperature' | 'weight' | 'height' | 'blood_sugar' | 'oxygen_saturation';
  value: string;
  unit: string;
  timestamp: string;
  notes?: string;
  recordedBy: string;
  status: 'normal' | 'high' | 'low' | 'critical';
}

const VitalsDialog: React.FC<VitalsDialogProps> = ({
  open,
  onOpenChange,
  patient
}) => {
  const { toast } = useToast();
  
  const [vitals, setVitals] = useState<VitalReading[]>([
    {
      id: '1',
      type: 'blood_pressure',
      value: '120/80',
      unit: 'mmHg',
      timestamp: '2024-01-20T10:00:00',
      recordedBy: 'د. أحمد محمد',
      status: 'normal',
      notes: 'قراءة طبيعية'
    },
    {
      id: '2',
      type: 'heart_rate',
      value: '72',
      unit: 'bpm',
      timestamp: '2024-01-20T10:05:00',
      recordedBy: 'د. أحمد محمد',
      status: 'normal'
    },
    {
      id: '3',
      type: 'temperature',
      value: '36.8',
      unit: '°C',
      timestamp: '2024-01-20T10:10:00',
      recordedBy: 'د. أحمد محمد',
      status: 'normal'
    },
    {
      id: '4',
      type: 'weight',
      value: '75',
      unit: 'kg',
      timestamp: '2024-01-15T09:00:00',
      recordedBy: 'الممرضة سارة',
      status: 'normal'
    },
    {
      id: '5',
      type: 'blood_sugar',
      value: '110',
      unit: 'mg/dL',
      timestamp: '2024-01-18T08:00:00',
      recordedBy: 'د. فاطمة خالد',
      status: 'high',
      notes: 'يحتاج متابعة'
    }
  ]);

  const [showAddVital, setShowAddVital] = useState(false);
  const [newVital, setNewVital] = useState({
    type: 'blood_pressure' as VitalReading['type'],
    value: '',
    notes: ''
  });

  const vitalTypes = {
    blood_pressure: { name: 'ضغط الدم', unit: 'mmHg', icon: Activity, normalRange: '120/80' },
    heart_rate: { name: 'معدل النبض', unit: 'bpm', icon: Heart, normalRange: '60-100' },
    temperature: { name: 'درجة الحرارة', unit: '°C', icon: Thermometer, normalRange: '36.5-37.5' },
    weight: { name: 'الوزن', unit: 'kg', icon: Weight, normalRange: 'حسب العمر' },
    height: { name: 'الطول', unit: 'cm', icon: Ruler, normalRange: 'حسب العمر' },
    blood_sugar: { name: 'سكر الدم', unit: 'mg/dL', icon: Activity, normalRange: '70-110' },
    oxygen_saturation: { name: 'تشبع الأكسجين', unit: '%', icon: Activity, normalRange: '95-100' }
  };

  const statusLabels = {
    normal: 'طبيعي',
    high: 'مرتفع',
    low: 'منخفض',
    critical: 'حرج'
  };

  const statusColors = {
    normal: 'bg-green-100 text-green-800',
    high: 'bg-yellow-100 text-yellow-800',
    low: 'bg-blue-100 text-blue-800',
    critical: 'bg-red-100 text-red-800'
  };

  const statusIcons = {
    normal: CheckCircle,
    high: TrendingUp,
    low: TrendingDown,
    critical: AlertTriangle
  };

  const handleAddVital = () => {
    if (!newVital.value.trim()) {
      toast({
        title: "خطأ",
        description: "يرجى إدخال القيمة",
        variant: "destructive"
      });
      return;
    }

    // تحديد الحالة بناءً على القيمة (محاكاة)
    let status: VitalReading['status'] = 'normal';
    if (newVital.type === 'blood_sugar') {
      const value = parseFloat(newVital.value);
      if (value > 140) status = 'high';
      else if (value < 70) status = 'low';
    } else if (newVital.type === 'heart_rate') {
      const value = parseFloat(newVital.value);
      if (value > 100) status = 'high';
      else if (value < 60) status = 'low';
    }

    const vital: VitalReading = {
      id: Date.now().toString(),
      ...newVital,
      unit: vitalTypes[newVital.type].unit,
      timestamp: new Date().toISOString(),
      recordedBy: 'المستخدم الحالي',
      status
    };

    setVitals(prev => [vital, ...prev]);
    setNewVital({ type: 'blood_pressure', value: '', notes: '' });
    setShowAddVital(false);

    toast({
      title: "تم الإضافة",
      description: "تم إضافة القراءة الحيوية بنجاح"
    });
  };

  const getLatestReading = (type: VitalReading['type']) => {
    return vitals
      .filter(v => v.type === type)
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())[0];
  };

  const getVitalTrend = (type: VitalReading['type']) => {
    const readings = vitals
      .filter(v => v.type === type)
      .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
    
    if (readings.length < 2) return null;
    
    const latest = readings[readings.length - 1];
    const previous = readings[readings.length - 2];
    
    if (type === 'weight' || type === 'height') {
      const latestVal = parseFloat(latest.value);
      const prevVal = parseFloat(previous.value);
      return latestVal > prevVal ? 'up' : latestVal < prevVal ? 'down' : 'stable';
    }
    
    return null;
  };

  const getVitalStats = () => {
    const totalReadings = vitals.length;
    const normalReadings = vitals.filter(v => v.status === 'normal').length;
    const abnormalReadings = vitals.filter(v => v.status !== 'normal').length;
    const criticalReadings = vitals.filter(v => v.status === 'critical').length;
    const lastReading = vitals.length > 0 
      ? new Date(Math.max(...vitals.map(v => new Date(v.timestamp).getTime())))
      : null;
    
    return { totalReadings, normalReadings, abnormalReadings, criticalReadings, lastReading };
  };

  const stats = getVitalStats();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5 text-blue-600" />
            العلامات الحيوية - {patient.full_name}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* إحصائيات سريعة */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <div className="bg-blue-50 p-4 rounded-lg text-center">
              <div className="text-2xl font-bold text-blue-600">{stats.totalReadings}</div>
              <div className="text-sm text-blue-700">إجمالي القراءات</div>
            </div>
            <div className="bg-green-50 p-4 rounded-lg text-center">
              <div className="text-2xl font-bold text-green-600">{stats.normalReadings}</div>
              <div className="text-sm text-green-700">قراءات طبيعية</div>
            </div>
            <div className="bg-yellow-50 p-4 rounded-lg text-center">
              <div className="text-2xl font-bold text-yellow-600">{stats.abnormalReadings}</div>
              <div className="text-sm text-yellow-700">قراءات غير طبيعية</div>
            </div>
            <div className="bg-red-50 p-4 rounded-lg text-center">
              <div className="text-2xl font-bold text-red-600">{stats.criticalReadings}</div>
              <div className="text-sm text-red-700">قراءات حرجة</div>
            </div>
            <div className="bg-purple-50 p-4 rounded-lg text-center">
              <div className="text-lg font-bold text-purple-600">
                {stats.lastReading ? stats.lastReading.toLocaleDateString('ar-SA') : 'N/A'}
              </div>
              <div className="text-sm text-purple-700">آخر قراءة</div>
            </div>
          </div>

          <Tabs defaultValue="overview" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="overview">نظرة عامة</TabsTrigger>
              <TabsTrigger value="history">السجل</TabsTrigger>
              <TabsTrigger value="add">إضافة قراءة</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-4">
              {/* آخر القراءات */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {Object.entries(vitalTypes).map(([type, config]) => {
                  const latest = getLatestReading(type as VitalReading['type']);
                  const trend = getVitalTrend(type as VitalReading['type']);
                  const Icon = config.icon;
                  
                  return (
                    <Card key={type}>
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <Icon className="h-5 w-5 text-blue-600" />
                            <span className="font-medium">{config.name}</span>
                          </div>
                          {trend && (
                            <div className="flex items-center gap-1">
                              {trend === 'up' && <TrendingUp className="h-4 w-4 text-green-600" />}
                              {trend === 'down' && <TrendingDown className="h-4 w-4 text-red-600" />}
                              {trend === 'stable' && <Minus className="h-4 w-4 text-gray-600" />}
                            </div>
                          )}
                        </div>
                        
                        {latest ? (
                          <div className="space-y-2">
                            <div className="text-2xl font-bold">
                              {latest.value} <span className="text-sm font-normal text-gray-500">{latest.unit}</span>
                            </div>
                            <Badge className={statusColors[latest.status]}>
                              {statusLabels[latest.status]}
                            </Badge>
                            <div className="text-xs text-gray-500">
                              {new Date(latest.timestamp).toLocaleDateString('ar-SA')}
                            </div>
                            <div className="text-xs text-gray-400">
                              المعدل الطبيعي: {config.normalRange}
                            </div>
                          </div>
                        ) : (
                          <div className="text-gray-500 text-center py-4">
                            <Info className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                            <p className="text-sm">لا توجد قراءات</p>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </TabsContent>

            <TabsContent value="history" className="space-y-4">
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {vitals.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <Activity className="h-16 w-16 mx-auto mb-4 text-gray-400" />
                    <p>لا توجد قراءات حيوية بعد</p>
                  </div>
                ) : (
                  vitals
                    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
                    .map((vital) => {
                      const Icon = statusIcons[vital.status];
                      const VitalIcon = vitalTypes[vital.type].icon;
                      
                      return (
                        <Card key={vital.id}>
                          <CardContent className="p-4">
                            <div className="flex items-start justify-between">
                              <div className="flex items-start gap-3">
                                <VitalIcon className="h-5 w-5 text-blue-600 mt-1" />
                                <div className="flex-1">
                                  <div className="flex items-center gap-2 mb-1">
                                    <span className="font-medium">{vitalTypes[vital.type].name}</span>
                                    <Badge className={statusColors[vital.status]}>
                                      <Icon className="h-3 w-3 mr-1" />
                                      {statusLabels[vital.status]}
                                    </Badge>
                                  </div>
                                  
                                  <div className="text-lg font-bold mb-1">
                                    {vital.value} {vital.unit}
                                  </div>
                                  
                                  <div className="text-sm text-gray-600 mb-2">
                                    تم التسجيل بواسطة: {vital.recordedBy}
                                  </div>
                                  
                                  {vital.notes && (
                                    <div className="text-sm text-gray-700 bg-gray-50 p-2 rounded">
                                      {vital.notes}
                                    </div>
                                  )}
                                </div>
                              </div>
                              
                              <div className="text-sm text-gray-500 text-left">
                                <Calendar className="h-4 w-4 inline mr-1" />
                                {new Date(vital.timestamp).toLocaleString('ar-SA')}
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })
                )}
              </div>
            </TabsContent>

            <TabsContent value="add" className="space-y-4">
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>نوع القراءة</Label>
                    <div className="grid grid-cols-2 gap-2">
                      {Object.entries(vitalTypes).map(([key, config]) => {
                        const Icon = config.icon;
                        return (
                          <Button
                            key={key}
                            size="sm"
                            variant={newVital.type === key ? 'default' : 'outline'}
                            onClick={() => setNewVital(prev => ({ ...prev, type: key as VitalReading['type'] }))}
                            className="justify-start"
                          >
                            <Icon className="h-4 w-4 mr-2" />
                            {config.name}
                          </Button>
                        );
                      })}
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="value">
                      القيمة ({vitalTypes[newVital.type].unit})
                    </Label>
                    <Input
                      id="value"
                      value={newVital.value}
                      onChange={(e) => setNewVital(prev => ({ ...prev, value: e.target.value }))}
                      placeholder={`أدخل ${vitalTypes[newVital.type].name}`}
                    />
                    <div className="text-sm text-gray-500">
                      المعدل الطبيعي: {vitalTypes[newVital.type].normalRange}
                    </div>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="notes">ملاحظات (اختياري)</Label>
                  <Textarea
                    id="notes"
                    value={newVital.notes}
                    onChange={(e) => setNewVital(prev => ({ ...prev, notes: e.target.value }))}
                    placeholder="أضف أي ملاحظات أو تفاصيل إضافية..."
                    rows={3}
                  />
                </div>
                
                <div className="flex justify-end gap-2">
                  <Button 
                    variant="outline" 
                    onClick={() => setNewVital({ type: 'blood_pressure', value: '', notes: '' })}
                  >
                    مسح
                  </Button>
                  <Button onClick={handleAddVital}>
                    <Plus className="h-4 w-4 mr-2" />
                    إضافة القراءة
                  </Button>
                </div>
                
                {/* تنبيهات مهمة */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Info className="h-4 w-4 text-blue-600" />
                    <span className="font-medium text-blue-800">إرشادات القياس</span>
                  </div>
                  <ul className="text-sm text-blue-700 space-y-1">
                    <li>• تأكد من دقة القياس قبل التسجيل</li>
                    <li>• سجل الظروف المحيطة بالقياس إذا كانت مؤثرة</li>
                    <li>• في الحالات الحرجة، اتصل بالطبيب فوراً</li>
                    <li>• احفظ القراءات في نفس الوقت يومياً للمتابعة الدقيقة</li>
                  </ul>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default VitalsDialog;