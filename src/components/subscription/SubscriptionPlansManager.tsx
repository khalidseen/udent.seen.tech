import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Switch } from '@/components/ui/switch';
import { Plus, Edit, Eye, Trash2, Users, Database, Calendar, HardDrive } from 'lucide-react';

interface SubscriptionPlan {
  id: string;
  name: string;
  name_ar: string;
  description?: string;
  description_ar?: string;
  price: number;
  currency: string;
  duration_months: number;
  max_users: number;
  max_patients: number;
  max_monthly_appointments: number;
  max_storage_gb: number;
  is_active: boolean;
  is_customizable: boolean;
  is_trial: boolean;
  trial_duration_days?: number;
  display_order: number;
  created_at: string;
  updated_at: string;
}

interface NewPlanForm {
  name: string;
  name_ar: string;
  description: string;
  description_ar: string;
  price: number;
  currency: string;
  duration_months: number;
  max_users: number;
  max_patients: number;
  max_monthly_appointments: number;
  max_storage_gb: number;
  is_active: boolean;
  is_customizable: boolean;
  is_trial: boolean;
  trial_duration_days: number;
  display_order: number;
}

export const SubscriptionPlansManager = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [editingPlan, setEditingPlan] = useState<SubscriptionPlan | null>(null);
  const [newPlan, setNewPlan] = useState<NewPlanForm>({
    name: '',
    name_ar: '',
    description: '',
    description_ar: '',
    price: 0,
    currency: 'SAR',
    duration_months: 1,
    max_users: 10,
    max_patients: 1000,
    max_monthly_appointments: 500,
    max_storage_gb: 5,
    is_active: true,
    is_customizable: false,
    is_trial: false,
    trial_duration_days: 30,
    display_order: 1
  });

  // الحصول على خطط الاشتراك
  const { data: plans = [], isLoading } = useQuery({
    queryKey: ['subscription-plans'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('subscription_plans')
        .select('*')
        .order('display_order');
      
      if (error) throw error;
      return data as SubscriptionPlan[];
    }
  });

  // إنشاء خطة جديدة
  const createPlanMutation = useMutation({
    mutationFn: async (planData: NewPlanForm) => {
      const { error } = await supabase
        .from('subscription_plans')
        .insert([planData]);
      
      if (error) throw error;
    },
    onSuccess: () => {
      toast({
        title: 'تم بنجاح',
        description: 'تم إنشاء خطة الاشتراك بنجاح'
      });
      queryClient.invalidateQueries({ queryKey: ['subscription-plans'] });
      setShowCreateDialog(false);
      resetForm();
    },
    onError: (error) => {
      toast({
        title: 'خطأ',
        description: 'فشل في إنشاء خطة الاشتراك',
        variant: 'destructive'
      });
      console.error('Error creating plan:', error);
    }
  });

  // تحديث خطة
  const updatePlanMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<SubscriptionPlan> }) => {
      const { error } = await supabase
        .from('subscription_plans')
        .update(updates)
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      toast({
        title: 'تم التحديث',
        description: 'تم تحديث خطة الاشتراك بنجاح'
      });
      queryClient.invalidateQueries({ queryKey: ['subscription-plans'] });
      setEditingPlan(null);
    }
  });

  // حذف خطة
  const deletePlanMutation = useMutation({
    mutationFn: async (planId: string) => {
      const { error } = await supabase
        .from('subscription_plans')
        .delete()
        .eq('id', planId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      toast({
        title: 'تم الحذف',
        description: 'تم حذف خطة الاشتراك بنجاح'
      });
      queryClient.invalidateQueries({ queryKey: ['subscription-plans'] });
    }
  });

  const resetForm = () => {
    setNewPlan({
      name: '',
      name_ar: '',
      description: '',
      description_ar: '',
      price: 0,
      currency: 'SAR',
      duration_months: 1,
      max_users: 10,
      max_patients: 1000,
      max_monthly_appointments: 500,
      max_storage_gb: 5,
      is_active: true,
      is_customizable: false,
      is_trial: false,
      trial_duration_days: 30,
      display_order: 1
    });
  };

  const handleCreatePlan = () => {
    createPlanMutation.mutate(newPlan);
  };

  const handleUpdatePlan = (updates: Partial<SubscriptionPlan>) => {
    if (!editingPlan) return;
    updatePlanMutation.mutate({ id: editingPlan.id, updates });
  };

  const getPlanStatusColor = (plan: SubscriptionPlan) => {
    if (!plan.is_active) return 'bg-gray-500 text-white';
    if (plan.is_trial) return 'bg-blue-500 text-white';
    return 'bg-green-500 text-white';
  };

  const getPlanStatusText = (plan: SubscriptionPlan) => {
    if (!plan.is_active) return 'غير نشط';
    if (plan.is_trial) return 'تجريبي';
    return 'نشط';
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="text-muted-foreground">جاري تحميل خطط الاشتراك...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">إدارة خطط الاشتراك</h2>
          <p className="text-muted-foreground">إدارة وتخصيص خطط الاشتراك المختلفة</p>
        </div>
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              خطة جديدة
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>إنشاء خطة اشتراك جديدة</DialogTitle>
              <DialogDescription>
                أضف خطة اشتراك جديدة مع تحديد الحدود والميزات
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">الاسم (إنجليزي)</Label>
                  <Input
                    id="name"
                    value={newPlan.name}
                    onChange={(e) => setNewPlan({ ...newPlan, name: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="name_ar">الاسم (عربي)</Label>
                  <Input
                    id="name_ar"
                    value={newPlan.name_ar}
                    onChange={(e) => setNewPlan({ ...newPlan, name_ar: e.target.value })}
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="price">السعر</Label>
                  <Input
                    id="price"
                    type="number"
                    value={newPlan.price}
                    onChange={(e) => setNewPlan({ ...newPlan, price: Number(e.target.value) })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="duration">المدة (شهور)</Label>
                  <Input
                    id="duration"
                    type="number"
                    value={newPlan.duration_months}
                    onChange={(e) => setNewPlan({ ...newPlan, duration_months: Number(e.target.value) })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="max_users">الحد الأقصى للمستخدمين</Label>
                  <Input
                    id="max_users"
                    type="number"
                    value={newPlan.max_users}
                    onChange={(e) => setNewPlan({ ...newPlan, max_users: Number(e.target.value) })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="max_patients">الحد الأقصى للمرضى</Label>
                  <Input
                    id="max_patients"
                    type="number"
                    value={newPlan.max_patients}
                    onChange={(e) => setNewPlan({ ...newPlan, max_patients: Number(e.target.value) })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="max_appointments">الحد الأقصى للمواعيد الشهرية</Label>
                  <Input
                    id="max_appointments"
                    type="number"
                    value={newPlan.max_monthly_appointments}
                    onChange={(e) => setNewPlan({ ...newPlan, max_monthly_appointments: Number(e.target.value) })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="max_storage">مساحة التخزين (GB)</Label>
                  <Input
                    id="max_storage"
                    type="number"
                    value={newPlan.max_storage_gb}
                    onChange={(e) => setNewPlan({ ...newPlan, max_storage_gb: Number(e.target.value) })}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description_ar">الوصف (عربي)</Label>
                <Textarea
                  id="description_ar"
                  value={newPlan.description_ar}
                  onChange={(e) => setNewPlan({ ...newPlan, description_ar: e.target.value })}
                />
              </div>

              <div className="flex items-center space-x-2 space-x-reverse">
                <Switch
                  id="is_trial"
                  checked={newPlan.is_trial}
                  onCheckedChange={(checked) => setNewPlan({ ...newPlan, is_trial: checked })}
                />
                <Label htmlFor="is_trial">خطة تجريبية</Label>
              </div>

              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
                  إلغاء
                </Button>
                <Button onClick={handleCreatePlan} disabled={createPlanMutation.isPending}>
                  {createPlanMutation.isPending ? 'جاري الحفظ...' : 'حفظ'}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4">
        {plans.map((plan) => (
          <Card key={plan.id}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <div className="space-y-1">
                <CardTitle className="flex items-center gap-2">
                  {plan.name_ar}
                  <Badge className={getPlanStatusColor(plan)}>
                    {getPlanStatusText(plan)}
                  </Badge>
                </CardTitle>
                <CardDescription>{plan.description_ar}</CardDescription>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm">
                  <Eye className="h-4 w-4 mr-2" />
                  عرض التفاصيل
                </Button>
                <Button variant="outline" size="sm" onClick={() => setEditingPlan(plan)}>
                  <Edit className="h-4 w-4 mr-2" />
                  تعديل
                </Button>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => deletePlanMutation.mutate(plan.id)}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  حذف
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-blue-500" />
                  <span>المستخدمين: {plan.max_users}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Database className="h-4 w-4 text-green-500" />
                  <span>المرضى: {plan.max_patients}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-purple-500" />
                  <span>المواعيد: {plan.max_monthly_appointments}/شهر</span>
                </div>
                <div className="flex items-center gap-2">
                  <HardDrive className="h-4 w-4 text-orange-500" />
                  <span>التخزين: {plan.max_storage_gb}GB</span>
                </div>
              </div>
              <div className="mt-2 text-lg font-semibold text-primary">
                {plan.price} {plan.currency} / {plan.duration_months} شهر
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};