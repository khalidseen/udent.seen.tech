import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, Edit, Settings, Users, CreditCard } from 'lucide-react';
import { useSubscriptionPlans } from '@/hooks/useSubscriptionPlans';
import { CreatePlanDialog } from './CreatePlanDialog';
import { EditPlanDialog } from './EditPlanDialog';
import { PlanFeaturesDialog } from './PlanFeaturesDialog';
import { SubscriptionOverview } from './SubscriptionOverview';

export const SubscriptionPlansManagement = () => {
  const { plans, features, loading } = useSubscriptionPlans();
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [featuresDialogOpen, setFeaturesDialogOpen] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<any>(null);

  const handleEditPlan = (plan: any) => {
    setSelectedPlan(plan);
    setEditDialogOpen(true);
  };

  const handleManageFeatures = (plan: any) => {
    setSelectedPlan(plan);
    setFeaturesDialogOpen(true);
  };

  const getPlanColor = (planName: string) => {
    switch (planName.toLowerCase()) {
      case 'basic':
      case 'الأساسية':
        return 'bg-blue-500';
      case 'professional':
      case 'الاحترافية':
        return 'bg-purple-500';
      case 'advanced':
      case 'المتقدمة':
        return 'bg-emerald-500';
      case 'custom':
      case 'مخصصة':
        return 'bg-amber-500';
      default:
        return 'bg-gray-500';
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader>
              <div className="h-6 bg-muted rounded w-1/3"></div>
              <div className="h-4 bg-muted rounded w-2/3"></div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="h-4 bg-muted rounded"></div>
                <div className="h-4 bg-muted rounded w-3/4"></div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-semibold">إدارة خطط الاشتراك</h2>
          <p className="text-muted-foreground">إدارة وتخصيص خطط الاشتراك والميزات</p>
        </div>
        <Button onClick={() => setCreateDialogOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          إنشاء خطة جديدة
        </Button>
      </div>

      <Tabs defaultValue="plans" className="space-y-4">
        <TabsList>
          <TabsTrigger value="plans">الخطط</TabsTrigger>
          <TabsTrigger value="overview">نظرة عامة</TabsTrigger>
        </TabsList>

        <TabsContent value="plans" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {plans.map((plan) => (
              <Card key={plan.id} className="relative overflow-hidden">
                <div className={`absolute top-0 left-0 right-0 h-1 ${getPlanColor(plan.name)}`} />
                
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        {plan.name_ar}
                        {!plan.is_active && (
                          <Badge variant="secondary">غير نشط</Badge>
                        )}
                        {plan.is_trial && (
                          <Badge variant="outline">تجريبي</Badge>
                        )}
                      </CardTitle>
                      <CardDescription>{plan.description_ar}</CardDescription>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold text-primary">
                        {plan.price === 0 ? 'مجاني' : `${plan.price} ${plan.currency}`}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        كل {plan.duration_months} شهر
                      </div>
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4 text-muted-foreground" />
                      <span>{plan.max_users} مستخدم</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4 text-muted-foreground" />
                      <span>{plan.max_patients} مريض</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CreditCard className="h-4 w-4 text-muted-foreground" />
                      <span>{plan.max_monthly_appointments} موعد/شهر</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Settings className="h-4 w-4 text-muted-foreground" />
                      <span>{plan.max_storage_gb} GB تخزين</span>
                    </div>
                  </div>

                  {plan.is_customizable && (
                    <Badge variant="outline" className="w-full justify-center">
                      قابل للتخصيص
                    </Badge>
                  )}

                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEditPlan(plan)}
                      className="flex-1"
                    >
                      <Edit className="h-4 w-4 mr-2" />
                      تعديل
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleManageFeatures(plan)}
                      className="flex-1"
                    >
                      <Settings className="h-4 w-4 mr-2" />
                      الميزات
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="overview">
          <SubscriptionOverview />
        </TabsContent>
      </Tabs>

      <CreatePlanDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
      />

      <EditPlanDialog
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        plan={selectedPlan}
      />

      <PlanFeaturesDialog
        open={featuresDialogOpen}
        onOpenChange={setFeaturesDialogOpen}
        plan={selectedPlan}
      />
    </div>
  );
};