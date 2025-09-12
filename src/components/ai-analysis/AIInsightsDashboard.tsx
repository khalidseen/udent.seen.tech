import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  Brain, 
  TrendingUp, 
  Activity, 
  AlertTriangle, 
  CheckCircle2,
  Eye,
  FileText,
  BarChart3,
  PieChart,
  Calendar
} from "lucide-react";
import { format } from "date-fns";

interface AIInsight {
  type: 'success' | 'warning' | 'info' | 'error';
  title: string;
  description: string;
  confidence: number;
  timestamp: Date;
  relatedPatients: number;
}

interface AIStats {
  totalAnalyses: number;
  xrayAnalyses: number;
  dsdAnalyses: number;
  avgConfidence: number;
  detectedConditions: {
    condition: string;
    count: number;
    trend: 'up' | 'down' | 'stable';
  }[];
  recentInsights: AIInsight[];
}

const mockAIStats: AIStats = {
  totalAnalyses: 156,
  xrayAnalyses: 98,
  dsdAnalyses: 58,
  avgConfidence: 0.84,
  detectedConditions: [
    { condition: 'تسوس الأسنان', count: 42, trend: 'down' },
    { condition: 'التهاب اللثة', count: 38, trend: 'stable' },
    { condition: 'تآكل الأسنان', count: 21, trend: 'up' },
    { condition: 'خراج سني', count: 12, trend: 'down' },
    { condition: 'كسر في الأسنان', count: 8, trend: 'stable' },
  ],
  recentInsights: [
    {
      type: 'warning',
      title: 'زيادة حالات تآكل الأسنان',
      description: 'لوحظت زيادة بنسبة 25% في حالات تآكل الأسنان خلال الشهر الماضي',
      confidence: 0.89,
      timestamp: new Date(),
      relatedPatients: 8
    },
    {
      type: 'success',
      title: 'تحسن في صحة الأسنان العامة',
      description: 'انخفاض ملحوظ في حالات التسوس المتقدم بنسبة 18%',
      confidence: 0.92,
      timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
      relatedPatients: 15
    },
    {
      type: 'info',
      title: 'فعالية العلاجات الوقائية',
      description: 'العلاجات الوقائية تظهر نتائج إيجابية في 87% من الحالات',
      confidence: 0.91,
      timestamp: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
      relatedPatients: 23
    }
  ]
};

export function AIInsightsDashboard() {
  const stats = mockAIStats;

  const getInsightIcon = (type: string) => {
    switch (type) {
      case 'success': return <CheckCircle2 className="w-4 h-4 text-green-600" />;
      case 'warning': return <AlertTriangle className="w-4 h-4 text-yellow-600" />;
      case 'error': return <AlertTriangle className="w-4 h-4 text-red-600" />;
      default: return <Activity className="w-4 h-4 text-blue-600" />;
    }
  };

  const getInsightColor = (type: string) => {
    switch (type) {
      case 'success': return 'border-green-200 bg-green-50 dark:bg-green-950/30';
      case 'warning': return 'border-yellow-200 bg-yellow-50 dark:bg-yellow-950/30';
      case 'error': return 'border-red-200 bg-red-50 dark:bg-red-950/30';
      default: return 'border-blue-200 bg-blue-50 dark:bg-blue-950/30';
    }
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up': return <TrendingUp className="w-3 h-3 text-red-500" />;
      case 'down': return <TrendingUp className="w-3 h-3 text-green-500 rotate-180" />;
      default: return <Activity className="w-3 h-3 text-gray-500" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* AI Statistics Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">إجمالي التحاليل</CardTitle>
            <Brain className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalAnalyses}</div>
            <p className="text-xs text-muted-foreground">
              +12% من الشهر الماضي
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">تحليل الأشعة السينية</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.xrayAnalyses}</div>
            <p className="text-xs text-muted-foreground">
              63% من إجمالي التحاليل
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">تحليل DSD</CardTitle>
            <Eye className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.dsdAnalyses}</div>
            <p className="text-xs text-muted-foreground">
              37% من إجمالي التحاليل
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">متوسط الثقة</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{(stats.avgConfidence * 100).toFixed(1)}%</div>
            <Progress value={stats.avgConfidence * 100} className="mt-2" />
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Detected Conditions */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PieChart className="w-5 h-5" />
              الحالات المكتشفة
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {stats.detectedConditions.map((condition, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-8 bg-primary rounded-full" style={{ 
                      opacity: 1 - (index * 0.15) 
                    }}></div>
                    <div>
                      <p className="font-medium text-sm">{condition.condition}</p>
                      <p className="text-xs text-muted-foreground">{condition.count} حالة</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {getTrendIcon(condition.trend)}
                    <Badge variant="outline" className="text-xs">
                      {((condition.count / stats.totalAnalyses) * 100).toFixed(0)}%
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Recent AI Insights */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Brain className="w-5 h-5" />
              رؤى الذكاء الاصطناعي
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {stats.recentInsights.map((insight, index) => (
                <Alert key={index} className={getInsightColor(insight.type)}>
                  <div className="flex items-start gap-3">
                    {getInsightIcon(insight.type)}
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center justify-between">
                        <h4 className="font-medium text-sm">{insight.title}</h4>
                        <Badge variant="outline" className="text-xs">
                          {(insight.confidence * 100).toFixed(0)}% ثقة
                        </Badge>
                      </div>
                      <AlertDescription className="text-xs">
                        {insight.description}
                      </AlertDescription>
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {format(insight.timestamp, 'yyyy/MM/dd')}
                        </span>
                        <span>{insight.relatedPatients} مريض متأثر</span>
                      </div>
                    </div>
                  </div>
                </Alert>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* AI Performance Metrics */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5" />
            مؤشرات أداء الذكاء الاصطناعي
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">دقة التشخيص</span>
                <span className="text-sm font-bold">94.2%</span>
              </div>
              <Progress value={94.2} className="h-2" />
              <p className="text-xs text-muted-foreground">مقارنة مع التشخيص السريري</p>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">سرعة التحليل</span>
                <span className="text-sm font-bold">2.3 ثانية</span>
              </div>
              <Progress value={85} className="h-2" />
              <p className="text-xs text-muted-foreground">متوسط وقت التحليل</p>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">معدل الكشف المبكر</span>
                <span className="text-sm font-bold">87.6%</span>
              </div>
              <Progress value={87.6} className="h-2" />
              <p className="text-xs text-muted-foreground">للحالات في المراحل المبكرة</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="w-5 h-5" />
            التوصيات الذكية
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <Alert className="border-blue-200 bg-blue-50 dark:bg-blue-950/30">
              <CheckCircle2 className="w-4 h-4 text-blue-600" />
              <AlertDescription>
                <strong>العلاج الوقائي</strong><br />
                23 مريض يحتاج لعلاج وقائي للثة
              </AlertDescription>
            </Alert>

            <Alert className="border-yellow-200 bg-yellow-50 dark:bg-yellow-950/30">
              <AlertTriangle className="w-4 h-4 text-yellow-600" />
              <AlertDescription>
                <strong>متابعة عاجلة</strong><br />
                8 مرضى يحتاجون لمراجعة فورية
              </AlertDescription>
            </Alert>

            <Alert className="border-green-200 bg-green-50 dark:bg-green-950/30">
              <TrendingUp className="w-4 h-4 text-green-600" />
              <AlertDescription>
                <strong>تحسن ملحوظ</strong><br />
                15 مريض يظهر تحسن في العلاج
              </AlertDescription>
            </Alert>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}