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
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { 
  Pill, 
  Plus, 
  Clock,
  AlertCircle,
  Calendar,
  Trash2
} from 'lucide-react';
import type { Patient } from '@/hooks/usePatients';
import { calculateAge } from './PatientUtils';
import { useToast } from '@/hooks/use-toast';

// تعديل نوع المريض لإضافة العمر
interface PatientWithAge extends Patient {
  age?: number;
}

interface MedicationDialogProps {
  patient: PatientWithAge;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const MedicationDialog: React.FC<MedicationDialogProps> = ({ patient, open, onOpenChange }) => {
  const { toast } = useToast();
  const [medications, setMedications] = useState([
    {
      id: '1',
      name: 'أموكسيسيلين',
      dosage: '500 مجم',
      frequency: 'ثلاث مرات يومياً',
      duration: '7 أيام',
      instructions: 'يؤخذ مع الطعام',
      status: 'active'
    }
  ]);

  const [newMedication, setNewMedication] = useState({
    name: '',
    dosage: '',
    frequency: '',
    duration: '',
    instructions: '',
    status: 'active'
  });

  const [showAddForm, setShowAddForm] = useState(false);

  const addMedication = () => {
    if (!newMedication.name || !newMedication.dosage) {
      toast({
        title: "خطأ",
        description: "يرجى إدخال اسم الدواء والجرعة",
        variant: "destructive"
      });
      return;
    }

    const medication = {
      ...newMedication,
      id: Date.now().toString()
    };

    setMedications([...medications, medication]);
    setNewMedication({
      name: '',
      dosage: '',
      frequency: '',
      duration: '',
      instructions: '',
      status: 'active'
    });
    setShowAddForm(false);

    toast({
      title: "تم الإضافة",
      description: "تم إضافة الدواء بنجاح"
    });
  };

  const removeMedication = (id: string) => {
    setMedications(medications.filter(med => med.id !== id));
    toast({
      title: "تم الحذف",
      description: "تم حذف الدواء"
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Pill className="w-5 h-5 text-blue-600" />
            إدارة الأدوية - {patient.full_name}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* معلومات المريض */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">معلومات المريض</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium">الاسم</Label>
                  <p className="text-sm">{patient.full_name}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">العمر</Label>
                  <p className="text-sm text-muted-foreground">العمر: {patient?.age || calculateAge(patient?.date_of_birth) || 'غير محدد'} سنة</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">الهاتف</Label>
                  <p className="text-sm">{patient.phone || 'غير محدد'}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">الحالة</Label>
                  <Badge variant="outline">{patient.patient_status}</Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* الأدوية الحالية */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-lg">الأدوية الحالية</CardTitle>
              <Button
                onClick={() => setShowAddForm(!showAddForm)}
                size="sm"
                className="flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                إضافة دواء
              </Button>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* قائمة الأدوية */}
              {medications.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">لا توجد أدوية مسجلة</p>
              ) : (
                <div className="grid gap-4">
                  {medications.map((medication) => (
                    <div
                      key={medication.id}
                      className="p-4 border rounded-lg bg-muted/50"
                    >
                      <div className="flex items-start justify-between">
                        <div className="space-y-2 flex-1">
                          <div className="flex items-center gap-2">
                            <h4 className="font-semibold">{medication.name}</h4>
                            <Badge variant={medication.status === 'active' ? 'default' : 'secondary'}>
                              {medication.status === 'active' ? 'نشط' : 'متوقف'}
                            </Badge>
                          </div>
                          <div className="grid grid-cols-2 gap-4 text-sm">
                            <div>
                              <Label className="text-xs text-muted-foreground">الجرعة</Label>
                              <p>{medication.dosage}</p>
                            </div>
                            <div>
                              <Label className="text-xs text-muted-foreground">التكرار</Label>
                              <p>{medication.frequency}</p>
                            </div>
                            <div>
                              <Label className="text-xs text-muted-foreground">المدة</Label>
                              <p>{medication.duration}</p>
                            </div>
                            <div>
                              <Label className="text-xs text-muted-foreground">تعليمات</Label>
                              <p>{medication.instructions || 'لا توجد تعليمات'}</p>
                            </div>
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeMedication(medication.id)}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* نموذج إضافة دواء جديد */}
              {showAddForm && (
                <div className="mt-6 p-4 border rounded-lg bg-background">
                  <h4 className="font-semibold mb-4">إضافة دواء جديد</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="name">اسم الدواء *</Label>
                      <Input
                        id="name"
                        value={newMedication.name}
                        onChange={(e) => setNewMedication({...newMedication, name: e.target.value})}
                        placeholder="مثال: أموكسيسيلين"
                      />
                    </div>
                    <div>
                      <Label htmlFor="dosage">الجرعة *</Label>
                      <Input
                        id="dosage"
                        value={newMedication.dosage}
                        onChange={(e) => setNewMedication({...newMedication, dosage: e.target.value})}
                        placeholder="مثال: 500 مجم"
                      />
                    </div>
                    <div>
                      <Label htmlFor="frequency">التكرار</Label>
                      <Input
                        id="frequency"
                        value={newMedication.frequency}
                        onChange={(e) => setNewMedication({...newMedication, frequency: e.target.value})}
                        placeholder="مثال: ثلاث مرات يومياً"
                      />
                    </div>
                    <div>
                      <Label htmlFor="duration">المدة</Label>
                      <Input
                        id="duration"
                        value={newMedication.duration}
                        onChange={(e) => setNewMedication({...newMedication, duration: e.target.value})}
                        placeholder="مثال: 7 أيام"
                      />
                    </div>
                    <div className="col-span-2">
                      <Label htmlFor="instructions">تعليمات الاستخدام</Label>
                      <Textarea
                        id="instructions"
                        value={newMedication.instructions}
                        onChange={(e) => setNewMedication({...newMedication, instructions: e.target.value})}
                        placeholder="مثال: يؤخذ مع الطعام، تجنب الحليب"
                        rows={2}
                      />
                    </div>
                  </div>
                  <div className="flex gap-2 mt-4">
                    <Button onClick={addMedication}>إضافة الدواء</Button>
                    <Button variant="outline" onClick={() => setShowAddForm(false)}>
                      إلغاء
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* تحذيرات وتنبيهات */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-yellow-600" />
                تحذيرات وتنبيهات
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <h5 className="font-medium text-yellow-800 mb-1">تفاعل محتمل مع المضادات الحيوية</h5>
                  <p className="text-sm text-yellow-700">
                    يرجى التأكد من عدم تناول منتجات الألبان مع المضادات الحيوية
                  </p>
                </div>
                <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <h5 className="font-medium text-blue-800 mb-1">تذكير بالمتابعة</h5>
                  <p className="text-sm text-blue-700">
                    موعد مراجعة الأدوية بعد أسبوع من بدء العلاج
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="flex justify-end gap-2 mt-6">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            إغلاق
          </Button>
          <Button onClick={() => {
            toast({
              title: "تم الحفظ",
              description: "تم حفظ تغييرات الأدوية بنجاح"
            });
            onOpenChange(false);
          }}>
            حفظ التغييرات
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default MedicationDialog;