import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { useSubscriptionPlans } from '@/hooks/useSubscriptionPlans';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

interface PlanFeaturesDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  plan: any;
}

export const PlanFeaturesDialog = ({ open, onOpenChange, plan }: PlanFeaturesDialogProps) => {
  const { features, planFeatures, updatePlanFeatures } = useSubscriptionPlans();
  const [loading, setLoading] = useState(false);
  const [featureStates, setFeatureStates] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (plan && open) {
      const currentPlanFeatures = planFeatures.filter(pf => pf.plan_id === plan.id);
      const states: Record<string, boolean> = {};
      
      features.forEach(feature => {
        const planFeature = currentPlanFeatures.find(pf => pf.feature_key === feature.feature_key);
        states[feature.feature_key] = planFeature?.is_enabled ?? false;
      });
      
      setFeatureStates(states);
    }
  }, [plan, open, features, planFeatures]);

  const handleFeatureToggle = (featureKey: string, enabled: boolean) => {
    setFeatureStates(prev => ({
      ...prev,
      [featureKey]: enabled
    }));
  };

  const handleSave = async () => {
    if (!plan?.id) return;

    try {
      setLoading(true);
      const featureUpdates = Object.entries(featureStates).map(([featureKey, isEnabled]) => ({
        feature_key: featureKey,
        is_enabled: isEnabled
      }));

      await updatePlanFeatures(plan.id, featureUpdates);
      onOpenChange(false);
    } catch (error) {
      console.error('Error updating plan features:', error);
    } finally {
      setLoading(false);
    }
  };

  const groupedFeatures = features.reduce((acc, feature) => {
    if (!acc[feature.category]) {
      acc[feature.category] = [];
    }
    acc[feature.category].push(feature);
    return acc;
  }, {} as Record<string, typeof features>);

  const getCategoryName = (category: string) => {
    const categoryNames: Record<string, string> = {
      'ai': 'الذكاء الاصطناعي',
      'dental': 'طب الأسنان',
      'reports': 'التقارير',
      'management': 'الإدارة',
      'integration': 'التكامل',
      'customization': 'التخصيص',
      'support': 'الدعم',
      'general': 'عام'
    };
    return categoryNames[category] || category;
  };

  if (!plan) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>إدارة ميزات الخطة: {plan.name_ar}</DialogTitle>
          <DialogDescription>
            تحديد الميزات المتاحة في هذه الخطة
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {Object.entries(groupedFeatures).map(([category, categoryFeatures]) => (
            <Card key={category}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  {getCategoryName(category)}
                  <Badge variant="outline">
                    {categoryFeatures.length} ميزة
                  </Badge>
                </CardTitle>
                <CardDescription>
                  الميزات المتعلقة بـ{getCategoryName(category)}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {categoryFeatures.map((feature) => (
                    <div key={feature.feature_key} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex-1">
                        <div className="font-medium">{feature.feature_name_ar}</div>
                        <div className="text-sm text-muted-foreground">
                          {feature.description_ar || feature.description}
                        </div>
                        <div className="text-xs text-muted-foreground mt-1">
                          {feature.feature_key}
                        </div>
                      </div>
                      <Switch
                        checked={featureStates[feature.feature_key] || false}
                        onCheckedChange={(checked) => handleFeatureToggle(feature.feature_key, checked)}
                      />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="flex justify-end gap-3">
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            إلغاء
          </Button>
          <Button onClick={handleSave} disabled={loading}>
            {loading ? 'جاري الحفظ...' : 'حفظ التغييرات'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};