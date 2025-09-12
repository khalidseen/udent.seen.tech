import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useCurrency } from "@/hooks/useCurrency";
import { supabase } from "@/integrations/supabase/client";
import { Patient } from "@/hooks/usePatients";
import { Loader2, User, Calendar, Phone, Mail, MapPin, FileText, Heart, DollarSign } from "lucide-react";

interface EditPatientDialogProps {
  patient: Patient | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onPatientUpdated: () => void;
}

const EditPatientDialog: React.FC<EditPatientDialogProps> = ({
  patient,
  open,
  onOpenChange,
  onPatientUpdated
}) => {
  const { toast } = useToast();
  const { currentCurrency } = useCurrency();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    full_name: "",
    phone: "",
    email: "",
    date_of_birth: "",
    gender: "",
    address: "",
    medical_history: "",
    national_id: "",
    emergency_contact: "",
    emergency_phone: "",
    insurance_info: "",
    blood_type: "",
    occupation: "",
    marital_status: "",
    medical_condition: "",
    financial_status: "pending" as 'paid' | 'pending' | 'overdue' | 'partial',
    financial_balance: 0,
    total_payments: 0,
    total_charges: 0
  });

  // تحديث النموذج عند تغيير المريض
  useEffect(() => {
    if (patient) {
      setFormData({
        full_name: patient.full_name || "",
        phone: patient.phone || "",
        email: patient.email || "",
        date_of_birth: patient.date_of_birth || "",
        gender: patient.gender || "",
        address: patient.address || "",
        medical_history: patient.medical_history || "",
        national_id: patient.national_id || "",
        emergency_contact: patient.emergency_contact || "",
        emergency_phone: patient.emergency_phone || "",
        insurance_info: patient.insurance_info || "",
        blood_type: patient.blood_type || "",
        occupation: patient.occupation || "",
        marital_status: patient.marital_status || "",
        medical_condition: patient.medical_condition || "",
        financial_status: patient.financial_status || "pending",
        financial_balance: patient.financial_balance || 0,
        total_payments: patient.total_payments || 0,
        total_charges: patient.total_charges || 0
      });
    }
  }, [patient]);

  const handleInputChange = (field: string, value: string | number) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!patient) return;

    setIsLoading(true);
    try {
      const { error } = await supabase
        .from('patients')
        .update({
          ...formData,
          updated_at: new Date().toISOString()
        })
        .eq('id', patient.id);

      if (error) throw error;

      toast({
        title: "تم تحديث بيانات المريض",
        description: `تم تحديث بيانات ${formData.full_name} بنجاح`,
      });

      onPatientUpdated();
      onOpenChange(false);
    } catch (error) {
      console.error('خطأ في تحديث المريض:', error);
      toast({
        title: "خطأ في التحديث",
        description: "حدث خطأ أثناء تحديث بيانات المريض",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getFinancialStatusBadge = (status: string) => {
    const baseClasses = "text-xs font-medium";
    switch (status) {
      case 'paid':
        return <Badge className={`${baseClasses} bg-green-50 text-green-700 border-green-200`}>مدفوع</Badge>;
      case 'pending':
        return <Badge className={`${baseClasses} bg-yellow-50 text-yellow-700 border-yellow-200`}>معلق</Badge>;
      case 'overdue':
        return <Badge className={`${baseClasses} bg-red-50 text-red-700 border-red-200`}>متأخر</Badge>;
      case 'partial':
        return <Badge className={`${baseClasses} bg-blue-50 text-blue-700 border-blue-200`}>جزئي</Badge>;
      default:
        return <Badge variant="outline">غير محدد</Badge>;
    }
  };

  if (!patient) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-lg font-semibold">
            <User className="w-5 h-5" />
            تعديل بيانات المريض
          </DialogTitle>
          
          {/* معلومات من أنشأ المريض - Real Data */}
          {patient.created_by_name ? (
            <div className="flex items-center gap-4 p-3 bg-muted/50 rounded-lg text-sm">
              <div className="flex items-center gap-1">
                <span className="text-muted-foreground">أنشأ بواسطة:</span>
                <span className="font-medium">{patient.created_by_name}</span>
                <Badge variant="outline" className="text-xs">
                  {patient.created_by_role === 'doctor' && 'طبيب'}
                  {patient.created_by_role === 'assistant' && 'مساعد'}
                  {patient.created_by_role === 'secretary' && 'سكرتير'}
                  {patient.created_by_role === 'admin' && 'مدير'}
                  {patient.created_by_role === 'super_admin' && 'مدير عام'}
                  {!patient.created_by_role && 'مستخدم'}
                </Badge>
              </div>
              
              {patient.last_modified_by_name && patient.last_modified_by_name !== patient.created_by_name ? (
                <div className="flex items-center gap-1">
                  <span className="text-muted-foreground">آخر تعديل:</span>
                  <span className="font-medium">{patient.last_modified_by_name}</span>
                  <Badge variant="outline" className="text-xs">
                    {patient.last_modified_by_role === 'doctor' && 'طبيب'}
                    {patient.last_modified_by_role === 'assistant' && 'مساعد'}
                    {patient.last_modified_by_role === 'secretary' && 'سكرتير'}
                    {patient.last_modified_by_role === 'admin' && 'مدير'}
                    {patient.last_modified_by_role === 'super_admin' && 'مدير عام'}
                  </Badge>
                </div>
              ) : (
                <div className="flex items-center gap-1 text-muted-foreground">
                  <span>لم يتم التعديل بعد</span>
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-4 p-3 bg-yellow-50 rounded-lg text-sm border border-yellow-200">
              <span className="text-yellow-700">معلومات المنشئ غير متوفرة - يرجى استخدام زر "ربط المرضى" في الصفحة الرئيسية</span>
            </div>
          )}
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* المعلومات الأساسية */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="full_name" className="flex items-center gap-1">
                <User className="w-4 h-4" />
                الاسم الكامل *
              </Label>
              <Input
                id="full_name"
                value={formData.full_name}
                onChange={(e) => handleInputChange('full_name', e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone" className="flex items-center gap-1">
                <Phone className="w-4 h-4" />
                رقم الهاتف
              </Label>
              <Input
                id="phone"
                value={formData.phone}
                onChange={(e) => handleInputChange('phone', e.target.value)}
                dir="ltr"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email" className="flex items-center gap-1">
                <Mail className="w-4 h-4" />
                البريد الإلكتروني
              </Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
                dir="ltr"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="date_of_birth" className="flex items-center gap-1">
                <Calendar className="w-4 h-4" />
                تاريخ الميلاد
              </Label>
              <Input
                id="date_of_birth"
                type="date"
                value={formData.date_of_birth}
                onChange={(e) => handleInputChange('date_of_birth', e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="gender">الجنس</Label>
              <Select
                value={formData.gender}
                onValueChange={(value) => handleInputChange('gender', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="اختر الجنس" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="male">ذكر</SelectItem>
                  <SelectItem value="female">أنثى</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="national_id">رقم الهوية</Label>
              <Input
                id="national_id"
                value={formData.national_id}
                onChange={(e) => handleInputChange('national_id', e.target.value)}
                dir="ltr"
              />
            </div>
          </div>

          {/* معلومات الاتصال الطارئ */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="emergency_contact">جهة الاتصال الطارئ</Label>
              <Input
                id="emergency_contact"
                value={formData.emergency_contact}
                onChange={(e) => handleInputChange('emergency_contact', e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="emergency_phone">هاتف الطوارئ</Label>
              <Input
                id="emergency_phone"
                value={formData.emergency_phone}
                onChange={(e) => handleInputChange('emergency_phone', e.target.value)}
                dir="ltr"
              />
            </div>
          </div>

          {/* العنوان */}
          <div className="space-y-2">
            <Label htmlFor="address" className="flex items-center gap-1">
              <MapPin className="w-4 h-4" />
              العنوان
            </Label>
            <Textarea
              id="address"
              value={formData.address}
              onChange={(e) => handleInputChange('address', e.target.value)}
              rows={2}
            />
          </div>

          {/* المعلومات الطبية */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <Heart className="w-5 h-5" />
              المعلومات الطبية
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="blood_type">فصيلة الدم</Label>
                <Select
                  value={formData.blood_type}
                  onValueChange={(value) => handleInputChange('blood_type', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="اختر فصيلة الدم" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="A+">A+</SelectItem>
                    <SelectItem value="A-">A-</SelectItem>
                    <SelectItem value="B+">B+</SelectItem>
                    <SelectItem value="B-">B-</SelectItem>
                    <SelectItem value="AB+">AB+</SelectItem>
                    <SelectItem value="AB-">AB-</SelectItem>
                    <SelectItem value="O+">O+</SelectItem>
                    <SelectItem value="O-">O-</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="occupation">المهنة</Label>
                <Input
                  id="occupation"
                  value={formData.occupation}
                  onChange={(e) => handleInputChange('occupation', e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="marital_status">الحالة الاجتماعية</Label>
                <Select
                  value={formData.marital_status}
                  onValueChange={(value) => handleInputChange('marital_status', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="اختر الحالة الاجتماعية" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="single">أعزب</SelectItem>
                    <SelectItem value="married">متزوج</SelectItem>
                    <SelectItem value="divorced">مطلق</SelectItem>
                    <SelectItem value="widowed">أرمل</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="medical_history" className="flex items-center gap-1">
                <FileText className="w-4 h-4" />
                التاريخ الطبي
              </Label>
              <Textarea
                id="medical_history"
                value={formData.medical_history}
                onChange={(e) => handleInputChange('medical_history', e.target.value)}
                rows={3}
                placeholder="أدخل التاريخ الطبي للمريض..."
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="medical_condition">الحالة الطبية الحالية</Label>
              <Input
                id="medical_condition"
                value={formData.medical_condition}
                onChange={(e) => handleInputChange('medical_condition', e.target.value)}
                placeholder="مثل: ضغط الدم، السكري..."
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="insurance_info">معلومات التأمين</Label>
              <Input
                id="insurance_info"
                value={formData.insurance_info}
                onChange={(e) => handleInputChange('insurance_info', e.target.value)}
                placeholder="شركة التأمين ورقم الوثيقة"
              />
            </div>
          </div>

          {/* المعلومات المالية */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <DollarSign className="w-5 h-5" />
              المعلومات المالية
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="financial_status" className="flex items-center gap-2">
                  الحالة المالية الحالية:
                  {getFinancialStatusBadge(formData.financial_status)}
                </Label>
                <Select
                  value={formData.financial_status}
                  onValueChange={(value: 'paid' | 'pending' | 'overdue' | 'partial') => handleInputChange('financial_status', value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="paid">مدفوع</SelectItem>
                    <SelectItem value="pending">معلق</SelectItem>
                    <SelectItem value="overdue">متأخر</SelectItem>
                    <SelectItem value="partial">جزئي</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="financial_balance">الرصيد المالي ({currentCurrency.symbol})</Label>
                <Input
                  id="financial_balance"
                  type="number"
                  step="0.01"
                  value={formData.financial_balance}
                  onChange={(e) => handleInputChange('financial_balance', parseFloat(e.target.value) || 0)}
                  dir="ltr"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="total_payments">إجمالي المدفوعات ({currentCurrency.symbol})</Label>
                <Input
                  id="total_payments"
                  type="number"
                  step="0.01"
                  value={formData.total_payments}
                  onChange={(e) => handleInputChange('total_payments', parseFloat(e.target.value) || 0)}
                  dir="ltr"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="total_charges">إجمالي الرسوم ({currentCurrency.symbol})</Label>
                <Input
                  id="total_charges"
                  type="number"
                  step="0.01"
                  value={formData.total_charges}
                  onChange={(e) => handleInputChange('total_charges', parseFloat(e.target.value) || 0)}
                  dir="ltr"
                />
              </div>
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isLoading}
            >
              إلغاء
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              حفظ التغييرات
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default EditPatientDialog;
