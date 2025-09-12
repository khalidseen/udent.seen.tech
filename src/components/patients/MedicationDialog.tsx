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
import { Patient } from '@/hooks/usePatients';
import { useToast } from '@/hooks/use-toast';

interface MedicationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  patient: Patient;
}

interface Medication {
  id: string;
  name: string;
  dosage: string;
  frequency: string;
  duration: string;
  notes?: string;
  startDate: string;
  endDate?: string;
  isActive: boolean;
}

const MedicationDialog: React.FC<MedicationDialogProps> = ({
  open,
  onOpenChange,
  patient
}) => {
  const { toast } = useToast();
  const [medications, setMedications] = useState<Medication[]>([
    {
      id: '1',
      name: 'أموكسيسيلين',
      dosage: '500 مجم',
      frequency: '3 مرات يومياً',
      duration: '7 أيام',
      notes: 'بعد الأكل',
      startDate: '2024-01-15',
      endDate: '2024-01-22',
      isActive: true
    },
    {
      id: '2',
      name: 'إيبوبروفين',
      dosage: '400 مجم',
      frequency: 'عند الحاجة',
      duration: 'حسب الحاجة',
      notes: 'للألم والالتهاب',
      startDate: '2024-01-15',
      isActive: true
    }
  ]);

  const [showAddForm, setShowAddForm] = useState(false);
  const [newMedication, setNewMedication] = useState({
    name: '',
    dosage: '',
    frequency: '',
    duration: '',
    notes: '',
    startDate: new Date().toISOString().split('T')[0]
  });

  const handleAddMedication = () => {
    if (!newMedication.name || !newMedication.dosage || !newMedication.frequency) {
      toast({
        title: "خطأ",
        description: "يرجى ملء الحقول المطلوبة",
        variant: "destructive"
      });
      return;
    }

    const medication: Medication = {
      id: Date.now().toString(),
      ...newMedication,
      isActive: true
    };

    setMedications(prev => [...prev, medication]);
    setNewMedication({
      name: '',
      dosage: '',
      frequency: '',
      duration: '',
      notes: '',
      startDate: new Date().toISOString().split('T')[0]
    });
    setShowAddForm(false);

    toast({
      title: "تم بنجاح",
      description: "تم إضافة الدواء بنجاح"
    });
  };

  const handleRemoveMedication = (id: string) => {
    setMedications(prev => prev.filter(med => med.id !== id));
    toast({
      title: "تم الحذف",
      description: "تم حذف الدواء بنجاح"
    });
  };

  const toggleMedicationStatus = (id: string) => {
    setMedications(prev => 
      prev.map(med => 
        med.id === id ? { ...med, isActive: !med.isActive } : med
      )
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Pill className="h-5 w-5 text-blue-600" />
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
                  <p className="text-sm">{patient.age} سنة</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">الهاتف</Label>
                  <p className="text-sm">{patient.phone || 'غير محدد'}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">عدد الأدوية النشطة</Label>
                  <p className="text-sm font-bold text-blue-600">
                    {medications.filter(med => med.isActive).length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* قائمة الأدوية الحالية */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">الأدوية الحالية</CardTitle>
                <Button
                  onClick={() => setShowAddForm(true)}
                  size="sm"
                  className="flex items-center gap-2"
                >
                  <Plus className="h-4 w-4" />
                  إضافة دواء
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {medications.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <Pill className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>لا توجد أدوية مسجلة بعد</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {medications.map((medication) => (
                    <Card key={medication.id} className={`${!medication.isActive ? 'opacity-60' : ''}`}>
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between">
                          <div className="flex-1 space-y-2">
                            <div className="flex items-center gap-3">
                              <h3 className="font-semibold text-lg">{medication.name}</h3>
                              <Badge variant={medication.isActive ? "default" : "secondary"}>
                                {medication.isActive ? 'نشط' : 'متوقف'}
                              </Badge>
                            </div>
                            
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                              <div>
                                <Label className="text-xs text-gray-600">الجرعة</Label>
                                <p className="font-medium">{medication.dosage}</p>
                              </div>
                              <div>
                                <Label className="text-xs text-gray-600">التكرار</Label>
                                <p className="font-medium">{medication.frequency}</p>
                              </div>
                              <div>
                                <Label className="text-xs text-gray-600">المدة</Label>
                                <p className="font-medium">{medication.duration}</p>
                              </div>
                              <div>
                                <Label className="text-xs text-gray-600">تاريخ البدء</Label>
                                <p className="font-medium">
                                  {new Date(medication.startDate).toLocaleDateString('ar-SA')}
                                </p>
                              </div>
                            </div>
                            
                            {medication.notes && (
                              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                                <div className="flex items-center gap-2 text-yellow-800">
                                  <AlertCircle className="h-4 w-4" />
                                  <span className="font-medium">ملاحظات</span>
                                </div>
                                <p className="text-sm text-yellow-700 mt-1">{medication.notes}</p>
                              </div>
                            )}
                          </div>
                          
                          <div className="flex flex-col gap-2 ml-4">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => toggleMedicationStatus(medication.id)}
                            >
                              {medication.isActive ? 'إيقاف' : 'تفعيل'}
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleRemoveMedication(medication.id)}
                              className="text-red-600 hover:text-red-700 hover:bg-red-50"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* نموذج إضافة دواء جديد */}
          {showAddForm && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">إضافة دواء جديد</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="name">اسم الدواء *</Label>
                    <Input
                      id="name"
                      value={newMedication.name}
                      onChange={(e) => setNewMedication(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="أدخل اسم الدواء"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="dosage">الجرعة *</Label>
                    <Input
                      id="dosage"
                      value={newMedication.dosage}
                      onChange={(e) => setNewMedication(prev => ({ ...prev, dosage: e.target.value }))}
                      placeholder="مثل: 500 مجم"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="frequency">التكرار *</Label>
                    <Input
                      id="frequency"
                      value={newMedication.frequency}
                      onChange={(e) => setNewMedication(prev => ({ ...prev, frequency: e.target.value }))}
                      placeholder="مثل: 3 مرات يومياً"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="duration">المدة</Label>
                    <Input
                      id="duration"
                      value={newMedication.duration}
                      onChange={(e) => setNewMedication(prev => ({ ...prev, duration: e.target.value }))}
                      placeholder="مثل: 7 أيام"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="startDate">تاريخ البدء</Label>
                    <Input
                      id="startDate"
                      type="date"
                      value={newMedication.startDate}
                      onChange={(e) => setNewMedication(prev => ({ ...prev, startDate: e.target.value }))}
                    />
                  </div>
                  
                  <div className="md:col-span-2">
                    <Label htmlFor="notes">ملاحظات</Label>
                    <Textarea
                      id="notes"
                      value={newMedication.notes}
                      onChange={(e) => setNewMedication(prev => ({ ...prev, notes: e.target.value }))}
                      placeholder="ملاحظات إضافية (اختياري)"
                      rows={3}
                    />
                  </div>
                </div>
                
                <Separator className="my-4" />
                
                <div className="flex justify-end gap-2">
                  <Button
                    variant="outline"
                    onClick={() => setShowAddForm(false)}
                  >
                    إلغاء
                  </Button>
                  <Button onClick={handleAddMedication}>
                    إضافة الدواء
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default MedicationDialog;