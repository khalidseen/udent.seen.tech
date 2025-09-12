import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { supabase } from "@/integrations/supabase/client";
import { Smile, Activity, AlertTriangle, CheckCircle, Timer } from "lucide-react";

interface OralHealthStatisticsProps {
  patientId?: string;
  onStatUpdate?: () => void;
}

interface ToothStatistics {
  total: number;
  healthy: number;
  needsTreatment: number;
  treated: number;
  missing: number;
  urgent: number;
}

interface NotesStatistics {
  total: number;
  active: number;
  completed: number;
  urgent: number;
  high: number;
}

export default function OralHealthStatistics({ patientId, onStatUpdate }: OralHealthStatisticsProps) {
  const [toothStats, setToothStats] = useState<ToothStatistics>({
    total: 32,
    healthy: 0,
    needsTreatment: 0,
    treated: 0,
    missing: 0,
    urgent: 0
  });
  
  const [notesStats, setNotesStats] = useState<NotesStatistics>({
    total: 0,
    active: 0,
    completed: 0,
    urgent: 0,
    high: 0
  });

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (patientId) {
      fetchStatistics();
    }
  }, [patientId]);

  useEffect(() => {
    if (onStatUpdate) {
      fetchStatistics();
    }
  }, [onStatUpdate]);

  const fetchStatistics = async () => {
    if (!patientId) return;

    setLoading(true);
    try {
      // Fetch tooth conditions
      const { data: conditions } = await supabase
        .from('tooth_conditions')
        .select('condition_type')
        .eq('patient_id', patientId);

      // Fetch tooth notes
      const { data: notes } = await supabase
        .from('tooth_notes')
        .select('status, priority')
        .eq('patient_id', patientId);

      // Calculate tooth statistics
      const conditionCounts = {
        healthy: 0,
        needsTreatment: 0,
        treated: 0,
        missing: 0,
        urgent: 0
      };

      conditions?.forEach(condition => {
        switch (condition.condition_type) {
          case 'healthy':
            conditionCounts.healthy++;
            break;
          case 'caries':
          case 'needs_treatment':
          case 'observation':
            conditionCounts.needsTreatment++;
            break;
          case 'filled':
          case 'crown':
          case 'root_canal':
          case 'treated':
            conditionCounts.treated++;
            break;
          case 'missing':
            conditionCounts.missing++;
            break;
          case 'extraction_needed':
            conditionCounts.urgent++;
            break;
        }
      });

      // Calculate remaining healthy teeth (those without conditions)
      const totalWithConditions = conditions?.length || 0;
      conditionCounts.healthy = 32 - totalWithConditions + conditionCounts.healthy;

      setToothStats({
        total: 32,
        ...conditionCounts
      });

      // Calculate notes statistics
      const notesCounts = {
        total: notes?.length || 0,
        active: 0,
        completed: 0,
        urgent: 0,
        high: 0
      };

      notes?.forEach(note => {
        if (note.status === 'active') notesCounts.active++;
        if (note.status === 'completed') notesCounts.completed++;
        if (note.priority === 'urgent') notesCounts.urgent++;
        if (note.priority === 'high') notesCounts.high++;
      });

      setNotesStats(notesCounts);
    } catch (error) {
      console.error('Error fetching statistics:', error);
    } finally {
      setLoading(false);
    }
  };

  const getHealthPercentage = () => {
    const healthyAndTreated = toothStats.healthy + toothStats.treated;
    return Math.round((healthyAndTreated / toothStats.total) * 100);
  };

  const getOverallHealthStatus = () => {
    const percentage = getHealthPercentage();
    if (percentage >= 90) return { status: 'ممتاز', color: 'bg-green-500', variant: 'default' as const };
    if (percentage >= 75) return { status: 'جيد', color: 'bg-blue-500', variant: 'secondary' as const };
    if (percentage >= 60) return { status: 'متوسط', color: 'bg-yellow-500', variant: 'outline' as const };
    return { status: 'يحتاج عناية', color: 'bg-red-500', variant: 'destructive' as const };
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            إحصائيات صحة الفم
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4 animate-pulse">
            <div className="h-4 bg-muted rounded w-3/4"></div>
            <div className="h-4 bg-muted rounded w-1/2"></div>
            <div className="h-4 bg-muted rounded w-5/6"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const healthStatus = getOverallHealthStatus();

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Activity className="h-5 w-5" />
          إحصائيات صحة الفم
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Overall Health Status */}
        <div className="text-center space-y-3">
          <div className="flex items-center justify-center gap-2">
            <Badge variant={healthStatus.variant} className="text-sm px-3 py-1">
              {healthStatus.status}
            </Badge>
            <span className="text-2xl font-bold">{getHealthPercentage()}%</span>
          </div>
          <Progress value={getHealthPercentage()} className="h-3" />
          <p className="text-sm text-muted-foreground">
            الحالة الصحية العامة للفم
          </p>
        </div>

        <Separator />

        {/* Teeth Statistics */}
        <div className="space-y-4">
          <h4 className="font-semibold flex items-center gap-2">
            <Smile className="h-4 w-4" />
            إحصائيات الأسنان
          </h4>
          
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">أسنان سليمة:</span>
              <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                {toothStats.healthy}
              </Badge>
            </div>
            
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">معالجة:</span>
              <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                {toothStats.treated}
              </Badge>
            </div>
            
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">تحتاج علاج:</span>
              <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
                {toothStats.needsTreatment}
              </Badge>
            </div>
            
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">مفقودة:</span>
              <Badge variant="outline" className="bg-gray-50 text-gray-700 border-gray-200">
                {toothStats.missing}
              </Badge>
            </div>
          </div>

          {toothStats.urgent > 0 && (
            <div className="flex items-center gap-2 p-3 bg-red-50 dark:bg-red-950 rounded-lg border border-red-200 dark:border-red-800">
              <AlertTriangle className="h-4 w-4 text-red-600" />
              <span className="text-sm text-red-700 dark:text-red-300">
                {toothStats.urgent} أسنان تحتاج علاج طارئ
              </span>
            </div>
          )}
        </div>

        <Separator />

        {/* Notes Statistics */}
        <div className="space-y-4">
          <h4 className="font-semibold flex items-center gap-2">
            <Timer className="h-4 w-4" />
            ملاحظات العلاج
          </h4>
          
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">إجمالي الملاحظات:</span>
              <Badge variant="outline">{notesStats.total}</Badge>
            </div>
            
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">نشطة:</span>
              <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                {notesStats.active}
              </Badge>
            </div>
            
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">مكتملة:</span>
              <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                {notesStats.completed}
              </Badge>
            </div>
            
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">عالية الأولوية:</span>
              <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-200">
                {notesStats.high + notesStats.urgent}
              </Badge>
            </div>
          </div>

          {(notesStats.urgent > 0 || notesStats.high > 0) && (
            <div className="flex items-center gap-2 p-3 bg-orange-50 dark:bg-orange-950 rounded-lg border border-orange-200 dark:border-orange-800">
              <CheckCircle className="h-4 w-4 text-orange-600" />
              <span className="text-sm text-orange-700 dark:text-orange-300">
                {notesStats.urgent + notesStats.high} ملاحظات ذات أولوية عالية
              </span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}