import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Plus, Edit, Trash2, AlertTriangle } from "lucide-react";

interface MedicalCondition {
  id: string;
  name: string;
  description?: string;
  category: string;
  severity_level: 'low' | 'medium' | 'high' | 'critical';
  is_active: boolean;
  created_at: string;
}

const MedicalConditionsManager = () => {
  const [conditions, setConditions] = useState<MedicalCondition[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingCondition, setEditingCondition] = useState<MedicalCondition | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category: 'general',
    severity_level: 'medium' as 'low' | 'medium' | 'high' | 'critical'
  });
  
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    if (user) {
      fetchConditions();
    }
  }, [user]);

  const fetchConditions = async () => {
    if (!user) return;

    try {
      // Get clinic ID
      const { data: profile } = await supabase
        .from('profiles')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (!profile) return;

      const { data, error } = await supabase
        .from('medical_conditions')
        .select('*')
        .eq('clinic_id', profile.id)
        .order('name');

      if (error) throw error;
      setConditions((data || []).map(condition => ({
        ...condition,
        severity_level: condition.severity_level as 'low' | 'medium' | 'high' | 'critical'
      })));
    } catch (error) {
      console.error('Error fetching conditions:', error);
      toast({
        title: "خطأ",
        description: "حدث خطأ أثناء تحميل الحالات المرضية",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!user || !formData.name.trim()) return;

    try {
      // Get clinic ID
      const { data: profile } = await supabase
        .from('profiles')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (!profile) return;

      const conditionData = {
        ...formData,
        clinic_id: profile.id
      };

      if (editingCondition) {
        const { error } = await supabase
          .from('medical_conditions')
          .update(conditionData)
          .eq('id', editingCondition.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('medical_conditions')
          .insert([conditionData]);

        if (error) throw error;
      }

      await fetchConditions();
      handleDialogClose();
      toast({
        title: "تم بنجاح",
        description: editingCondition ? "تم تحديث الحالة المرضية" : "تم إضافة الحالة المرضية",
      });
    } catch (error) {
      console.error('Error saving condition:', error);
      toast({
        title: "خطأ",
        description: "حدث خطأ أثناء حفظ البيانات",
        variant: "destructive",
      });
    }
  };

  const handleDelete = async (conditionId: string) => {
    try {
      const { error } = await supabase
        .from('medical_conditions')
        .delete()
        .eq('id', conditionId);

      if (error) throw error;

      await fetchConditions();
      toast({
        title: "تم بنجاح",
        description: "تم حذف الحالة المرضية",
      });
    } catch (error) {
      console.error('Error deleting condition:', error);
      toast({
        title: "خطأ",
        description: "حدث خطأ أثناء حذف الحالة المرضية",
        variant: "destructive",
      });
    }
  };

  const handleDialogClose = () => {
    setDialogOpen(false);
    setEditingCondition(null);
    setFormData({
      name: '',
      description: '',
      category: 'general',
      severity_level: 'medium'
    });
  };

  const handleEdit = (condition: MedicalCondition) => {
    setEditingCondition(condition);
    setFormData({
      name: condition.name,
      description: condition.description || '',
      category: condition.category,
      severity_level: condition.severity_level
    });
    setDialogOpen(true);
  };

  const getSeverityBadge = (severity: string) => {
    switch (severity) {
      case 'low':
        return <Badge className="bg-green-100 text-green-800 border-green-200 dark:bg-green-900 dark:text-green-100">منخفض</Badge>;
      case 'medium':
        return <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900 dark:text-yellow-100">متوسط</Badge>;
      case 'high':
        return <Badge className="bg-orange-100 text-orange-800 border-orange-200 dark:bg-orange-900 dark:text-orange-100">عالي</Badge>;
      case 'critical':
        return <Badge className="bg-red-100 text-red-800 border-red-200 dark:bg-red-900 dark:text-red-100">حرج</Badge>;
      default:
        return <Badge variant="secondary">غير محدد</Badge>;
    }
  };

  const getCategoryName = (category: string) => {
    switch (category) {
      case 'general': return 'عام';
      case 'chronic': return 'مزمن';
      case 'acute': return 'حاد';
      case 'dental': return 'أسنان';
      case 'surgical': return 'جراحي';
      default: return category;
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center">جاري تحميل الحالات المرضية...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center">
            <AlertTriangle className="w-5 h-5 ml-2" />
            الحالات المرضية والتشخيص
          </CardTitle>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => handleDialogClose()}>
                <Plus className="w-4 h-4 ml-2" />
                إضافة حالة مرضية
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>
                  {editingCondition ? 'تعديل الحالة المرضية' : 'إضافة حالة مرضية جديدة'}
                </DialogTitle>
              </DialogHeader>
              
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">اسم الحالة المرضية *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="مثال: مرض السكري"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="category">التصنيف</Label>
                  <Select value={formData.category} onValueChange={(value) => setFormData({ ...formData, category: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="general">عام</SelectItem>
                      <SelectItem value="chronic">مزمن</SelectItem>
                      <SelectItem value="acute">حاد</SelectItem>
                      <SelectItem value="dental">أسنان</SelectItem>
                      <SelectItem value="surgical">جراحي</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="severity">مستوى الخطورة</Label>
                  <Select value={formData.severity_level} onValueChange={(value: 'low' | 'medium' | 'high' | 'critical') => setFormData({ ...formData, severity_level: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">منخفض</SelectItem>
                      <SelectItem value="medium">متوسط</SelectItem>
                      <SelectItem value="high">عالي</SelectItem>
                      <SelectItem value="critical">حرج</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">الوصف (اختياري)</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="وصف تفصيلي للحالة المرضية..."
                    rows={3}
                  />
                </div>

                <div className="flex justify-end space-x-2 space-x-reverse pt-4">
                  <Button variant="outline" onClick={handleDialogClose}>
                    إلغاء
                  </Button>
                  <Button onClick={handleSave}>
                    {editingCondition ? 'تحديث' : 'إضافة'}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        {conditions.length === 0 ? (
          <div className="text-center py-8">
            <AlertTriangle className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <h3 className="text-lg font-medium mb-2">لا توجد حالات مرضية</h3>
            <p className="text-muted-foreground mb-4">ابدأ بإضافة الحالات المرضية الشائعة في عيادتك</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {conditions.map((condition) => (
              <Card key={condition.id} className="border border-border/60 hover:shadow-md transition-all duration-200">
                <CardContent className="p-4">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <h3 className="font-semibold text-sm">{condition.name}</h3>
                      <div className="flex space-x-1 space-x-reverse">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0"
                          onClick={() => handleEdit(condition)}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
                          onClick={() => handleDelete(condition.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <Badge variant="outline" className="text-xs">
                        {getCategoryName(condition.category)}
                      </Badge>
                      {getSeverityBadge(condition.severity_level)}
                    </div>

                    {condition.description && (
                      <p className="text-xs text-muted-foreground line-clamp-2">
                        {condition.description}
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default MedicalConditionsManager;