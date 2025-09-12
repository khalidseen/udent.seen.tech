<<<<<<< HEAD
import { ReactNode, useState, useEffect, useCallback } from 'react';
=======
import { ReactNode, useState, useEffect } from 'react';
>>>>>>> cbd682d36e862741c55b9e7b5d144f8de65c694a
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Lock, Zap } from 'lucide-react';

interface FeatureGateProps {
  features: string[];
  requireAll?: boolean;
  children: ReactNode;
  fallback?: ReactNode;
  showUpgradePrompt?: boolean;
}

export const FeatureGate = ({ 
  features = [],
  requireAll = false,
  children,
  fallback = null,
  showUpgradePrompt = true
}: FeatureGateProps) => {
  const [hasAccess, setHasAccess] = useState(false);
  const [loading, setLoading] = useState(true);

<<<<<<< HEAD
  const checkFeatureAccess = useCallback(async () => {
    if (features.length === 0) {
      setHasAccess(true);
      setLoading(false);
      return;
    }

    try {
      const featureChecks = await Promise.all(
        features.map(feature => 
          supabase.rpc('has_plan_feature', { feature_key_param: feature })
        )
      );

      const hasFeatureAccess = requireAll 
        ? featureChecks.every(result => result.data === true)
        : featureChecks.some(result => result.data === true);

      setHasAccess(hasFeatureAccess);
    } catch (error) {
      console.error('Error checking feature access:', error);
      setHasAccess(false);
    } finally {
      setLoading(false);
    }
  }, [features, requireAll]);

  useEffect(() => {
    checkFeatureAccess();
  }, [checkFeatureAccess]);
=======
  useEffect(() => {
    const checkFeatureAccess = async () => {
      if (features.length === 0) {
        setHasAccess(true);
        setLoading(false);
        return;
      }

      try {
        const featureChecks = await Promise.all(
          features.map(feature => 
            supabase.rpc('has_plan_feature', { feature_key_param: feature })
          )
        );

        const hasFeatureAccess = requireAll 
          ? featureChecks.every(result => result.data === true)
          : featureChecks.some(result => result.data === true);

        setHasAccess(hasFeatureAccess);
      } catch (error) {
        console.error('Error checking feature access:', error);
        setHasAccess(false);
      } finally {
        setLoading(false);
      }
    };

    checkFeatureAccess();
  }, [features, requireAll]);
>>>>>>> cbd682d36e862741c55b9e7b5d144f8de65c694a

  if (loading) {
    return (
      <div className="animate-pulse">
        <div className="h-32 bg-muted rounded"></div>
      </div>
    );
  }

  if (hasAccess) {
    return <>{children}</>;
  }

  if (fallback) {
    return <>{fallback}</>;
  }

  if (showUpgradePrompt) {
    return (
      <Card className="border-dashed">
        <CardHeader className="text-center">
          <CardTitle className="flex items-center justify-center gap-2">
            <Lock className="h-5 w-5 text-muted-foreground" />
            ميزة مدفوعة
          </CardTitle>
          <CardDescription>
            هذه الميزة متاحة في الخطط المدفوعة فقط
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center space-y-4">
          <div className="text-sm text-muted-foreground">
            الميزات المطلوبة: {features.join(', ')}
          </div>
          <Button variant="default" className="w-full">
            <Zap className="h-4 w-4 mr-2" />
            ترقية الخطة
          </Button>
        </CardContent>
      </Card>
    );
  }

  return null;
};