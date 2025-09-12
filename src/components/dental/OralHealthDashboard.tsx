import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { supabase } from '@/integrations/supabase/client';
import { 
  Activity, 
  Smile, 
  AlertTriangle, 
  CheckCircle, 
  Timer, 
  TrendingUp,
  Heart,
  Shield,
  Zap
} from 'lucide-react';

interface OralHealthDashboardProps {
  patientId?: string;
  onStatUpdate?: () => void;
}

interface HealthMetrics {
  overallHealth: number;
  teethStats: {
    total: number;
    healthy: number;
    treated: number;
    needsTreatment: number;
    missing: number;
    urgent: number;
  };
  treatmentStats: {
    total: number;
    completed: number;
    inProgress: number;
    planned: number;
  };
  riskFactors: {
    high: number;
    medium: number;
    low: number;
  };
}

export const OralHealthDashboard: React.FC<OralHealthDashboardProps> = ({ 
  patientId, 
  onStatUpdate 
}) => {
  const [metrics, setMetrics] = useState<HealthMetrics>({
    overallHealth: 0,
    teethStats: {
      total: 32,
      healthy: 0,
      treated: 0,
      needsTreatment: 0,
      missing: 0,
      urgent: 0
    },
    treatmentStats: {
      total: 0,
      completed: 0,
      inProgress: 0,
      planned: 0
    },
    riskFactors: {
      high: 0,
      medium: 0,
      low: 0
    }
  });
  const [loading, setLoading] = useState(true);

  const fetchHealthMetrics = useCallback(async () => {
    if (!patientId) return;

    setLoading(true);
    try {
      // Fetch tooth conditions
      const { data: conditions } = await supabase
        .from('tooth_conditions')
        .select('condition_type')
        .eq('patient_id', patientId);

      // Fetch dental treatments
      const { data: treatments } = await supabase
        .from('dental_treatments')
        .select('status')
        .eq('patient_id', patientId);

      // Fetch tooth notes for additional risk assessment
      const { data: notes } = await supabase
        .from('tooth_notes')
        .select('priority, status')
        .eq('patient_id', patientId);

      // Process teeth statistics
      const teethConditions = {
        healthy: 0,
        treated: 0,
        needsTreatment: 0,
        missing: 0,
        urgent: 0
      };

      conditions?.forEach(condition => {
        switch (condition.condition_type) {
          case 'healthy':
            teethConditions.healthy++;
            break;
          case 'filled':
          case 'crown':
          case 'root_canal':
          case 'treated':
            teethConditions.treated++;
            break;
          case 'caries':
          case 'needs_treatment':
          case 'observation':
            teethConditions.needsTreatment++;
            break;
          case 'missing':
            teethConditions.missing++;
            break;
          case 'extraction_needed':
            teethConditions.urgent++;
            break;
        }
      });

      // Calculate remaining healthy teeth
      const totalWithConditions = conditions?.length || 0;
      teethConditions.healthy = Math.max(0, 32 - totalWithConditions + teethConditions.healthy);

      // Process treatment statistics
      const treatmentCounts = {
        total: treatments?.length || 0,
        completed: 0,
        inProgress: 0,
        planned: 0
      };

      treatments?.forEach(treatment => {
        switch (treatment.status) {
          case 'completed':
            treatmentCounts.completed++;
            break;
          case 'in_progress':
            treatmentCounts.inProgress++;
            break;
          case 'planned':
            treatmentCounts.planned++;
            break;
        }
      });

      // Calculate risk factors based on notes priority
      const riskCounts = { high: 0, medium: 0, low: 0 };

      notes?.forEach(note => {
        if (note.priority === 'urgent' || note.priority === 'high') {
          riskCounts.high++;
        } else if (note.priority === 'medium') {
          riskCounts.medium++;
        } else {
          riskCounts.low++;
        }
      });

      // Calculate overall health percentage
      const healthyAndTreated = teethConditions.healthy + teethConditions.treated;
      const overallHealth = Math.round((healthyAndTreated / 32) * 100);

      setMetrics({
        overallHealth,
        teethStats: {
          total: 32,
          ...teethConditions
        },
        treatmentStats: treatmentCounts,
        riskFactors: riskCounts
      });

    } catch (error) {
      console.error('Error fetching health metrics:', error);
    } finally {
      setLoading(false);
    }
  }, [patientId]);

  useEffect(() => {
    if (patientId) {
      fetchHealthMetrics();
    }
  }, [patientId, fetchHealthMetrics]);

  const getHealthStatus = (percentage: number) => {
    if (percentage >= 90) return { 
      status: 'ممتاز', 
      color: 'from-green-500 to-emerald-600',
      textColor: 'text-green-700',
      bgColor: 'bg-green-50',
      icon: Shield
    };
    if (percentage >= 75) return { 
      status: 'جيد', 
      color: 'from-blue-500 to-sky-600',
      textColor: 'text-blue-700',
      bgColor: 'bg-blue-50',
      icon: CheckCircle
    };
    if (percentage >= 60) return { 
      status: 'متوسط', 
      color: 'from-yellow-500 to-amber-600',
      textColor: 'text-yellow-700',
      bgColor: 'bg-yellow-50',
      icon: Timer
    };
    return { 
      status: 'يحتاج عناية', 
      color: 'from-red-500 to-rose-600',
      textColor: 'text-red-700',
      bgColor: 'bg-red-50',
      icon: AlertTriangle
    };
  };

  if (loading) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {[...Array(3)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-6">
              <div className="space-y-4">
                <div className="h-4 bg-muted rounded w-3/4"></div>
                <div className="h-8 bg-muted rounded"></div>
                <div className="h-4 bg-muted rounded w-1/2"></div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const healthStatus = getHealthStatus(metrics.overallHealth);
  const StatusIcon = healthStatus.icon;

  return (
    <div className="space-y-6">
      {/* Overall Health Status */}
      <Card className={`${healthStatus.bgColor} border-2 shadow-lg`}>
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <StatusIcon className={`h-8 w-8 ${healthStatus.textColor}`} />
              <div>
                <h3 className="text-lg font-semibold">الحالة الصحية العامة</h3>
                <Badge className={`bg-gradient-to-r ${healthStatus.color} text-white border-0`}>
                  {healthStatus.status}
                </Badge>
              </div>
            </div>
            <div className="text-right">
              <div className="text-4xl font-bold text-primary mb-1">{metrics.overallHealth}%</div>
              <div className="text-sm text-muted-foreground">نسبة الصحة</div>
            </div>
          </div>
          
          <Progress 
            value={metrics.overallHealth} 
            className="h-3 mb-2" 
          />
          
          <div className="text-sm text-muted-foreground text-center">
            {metrics.teethStats.healthy + metrics.teethStats.treated} من {metrics.teethStats.total} سن في حالة جيدة
          </div>
        </CardContent>
      </Card>

      {/* Detailed Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        
        {/* Teeth Statistics */}
        <Card className="border-2 border-green-200 bg-gradient-to-br from-green-50 to-emerald-50">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-green-700">
              <Smile className="h-5 w-5" />
              إحصائيات الأسنان
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="flex justify-between items-center bg-white/60 rounded p-2">
                <span className="text-muted-foreground">سليمة:</span>
                <Badge variant="outline" className="bg-green-100 text-green-700 border-green-300">
                  {metrics.teethStats.healthy}
                </Badge>
              </div>
              
              <div className="flex justify-between items-center bg-white/60 rounded p-2">
                <span className="text-muted-foreground">معالجة:</span>
                <Badge variant="outline" className="bg-blue-100 text-blue-700 border-blue-300">
                  {metrics.teethStats.treated}
                </Badge>
              </div>
              
              <div className="flex justify-between items-center bg-white/60 rounded p-2">
                <span className="text-muted-foreground">تحتاج علاج:</span>
                <Badge variant="outline" className="bg-yellow-100 text-yellow-700 border-yellow-300">
                  {metrics.teethStats.needsTreatment}
                </Badge>
              </div>
              
              <div className="flex justify-between items-center bg-white/60 rounded p-2">
                <span className="text-muted-foreground">مفقودة:</span>
                <Badge variant="outline" className="bg-gray-100 text-gray-700 border-gray-300">
                  {metrics.teethStats.missing}
                </Badge>
              </div>
            </div>

            {metrics.teethStats.urgent > 0 && (
              <div className="flex items-center gap-2 p-3 bg-red-100 rounded-lg border border-red-300">
                <Zap className="h-4 w-4 text-red-600" />
                <span className="text-sm text-red-700 font-medium">
                  {metrics.teethStats.urgent} أسنان تحتاج علاج طارئ
                </span>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Treatment Progress */}
        <Card className="border-2 border-blue-200 bg-gradient-to-br from-blue-50 to-sky-50">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-blue-700">
              <Activity className="h-5 w-5" />
              تقدم العلاج
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-center mb-4">
              <div className="text-3xl font-bold text-blue-600 mb-1">
                {metrics.treatmentStats.total}
              </div>
              <div className="text-sm text-muted-foreground">إجمالي العلاجات</div>
            </div>

            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">مكتملة:</span>
                <div className="flex items-center gap-2">
                  <Progress 
                    value={metrics.treatmentStats.total ? (metrics.treatmentStats.completed / metrics.treatmentStats.total) * 100 : 0} 
                    className="w-16 h-2" 
                  />
                  <Badge className="bg-green-100 text-green-700 border border-green-300">
                    {metrics.treatmentStats.completed}
                  </Badge>
                </div>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">قيد التنفيذ:</span>
                <div className="flex items-center gap-2">
                  <Progress 
                    value={metrics.treatmentStats.total ? (metrics.treatmentStats.inProgress / metrics.treatmentStats.total) * 100 : 0} 
                    className="w-16 h-2" 
                  />
                  <Badge className="bg-orange-100 text-orange-700 border border-orange-300">
                    {metrics.treatmentStats.inProgress}
                  </Badge>
                </div>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">مخططة:</span>
                <div className="flex items-center gap-2">
                  <Progress 
                    value={metrics.treatmentStats.total ? (metrics.treatmentStats.planned / metrics.treatmentStats.total) * 100 : 0} 
                    className="w-16 h-2" 
                  />
                  <Badge className="bg-gray-100 text-gray-700 border border-gray-300">
                    {metrics.treatmentStats.planned}
                  </Badge>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Risk Assessment */}
        <Card className="border-2 border-purple-200 bg-gradient-to-br from-purple-50 to-violet-50">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-purple-700">
              <TrendingUp className="h-5 w-5" />
              تقييم المخاطر
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              {metrics.riskFactors.high > 0 && (
                <div className="flex items-center justify-between p-3 bg-red-100 rounded-lg border border-red-300">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 text-red-600" />
                    <span className="text-sm font-medium text-red-700">مخاطر عالية</span>
                  </div>
                  <Badge className="bg-red-200 text-red-800 border border-red-400">
                    {metrics.riskFactors.high}
                  </Badge>
                </div>
              )}
              
              {metrics.riskFactors.medium > 0 && (
                <div className="flex items-center justify-between p-3 bg-yellow-100 rounded-lg border border-yellow-300">
                  <div className="flex items-center gap-2">
                    <Timer className="h-4 w-4 text-yellow-600" />
                    <span className="text-sm font-medium text-yellow-700">مخاطر متوسطة</span>
                  </div>
                  <Badge className="bg-yellow-200 text-yellow-800 border border-yellow-400">
                    {metrics.riskFactors.medium}
                  </Badge>
                </div>
              )}
              
              {metrics.riskFactors.low > 0 && (
                <div className="flex items-center justify-between p-3 bg-green-100 rounded-lg border border-green-300">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <span className="text-sm font-medium text-green-700">مخاطر منخفضة</span>
                  </div>
                  <Badge className="bg-green-200 text-green-800 border border-green-400">
                    {metrics.riskFactors.low}
                  </Badge>
                </div>
              )}
              
              {metrics.riskFactors.high === 0 && metrics.riskFactors.medium === 0 && metrics.riskFactors.low === 0 && (
                <div className="text-center py-6 text-muted-foreground">
                  <Heart className="h-8 w-8 mx-auto mb-2 text-green-500" />
                  <p className="text-sm">لا توجد عوامل خطر محددة</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};