import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertTriangle, Shield, Activity, Eye, Search, Filter, RefreshCw, Clock, User, Database } from 'lucide-react';
import { useAuditTrail } from '@/hooks/useAuditTrail';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement } from 'chart.js';
import { Bar, Doughnut } from 'react-chartjs-2';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement);

export const AuditTrailDashboard = () => {
  const {
    events,
    alerts,
    statistics,
    loading,
    fetchEvents,
    fetchAlerts,
    fetchStatistics,
    updateAlertStatus,
    runSuspiciousActivityDetection,
    getCategoryDisplayName,
    getSensitivityDisplayName,
    getSeverityDisplayName,
    getStatusDisplayName
  } = useAuditTrail();

  const [filters, setFilters] = useState({
    days: 7,
    category: '',
    sensitivity: '',
    search: '',
    limit: 50
  });

  const [alertFilters, setAlertFilters] = useState({
    status: ''
  });

  const handleFilterChange = (key: string, value: any) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);
    fetchEvents(newFilters);
  };

  const handleAlertFilterChange = (key: string, value: any) => {
    const newAlertFilters = { ...alertFilters, [key]: value };
    setAlertFilters(newAlertFilters);
    fetchAlerts(value || undefined);
  };

  const handleRefresh = async () => {
    await Promise.all([
      fetchEvents(filters),
      fetchAlerts(alertFilters.status || undefined),
      fetchStatistics(filters.days),
      runSuspiciousActivityDetection()
    ]);
  };

  const getRiskColor = (score: number) => {
    if (score >= 80) return 'hsl(var(--destructive))';
    if (score >= 60) return 'hsl(var(--warning))';
    if (score >= 30) return 'hsl(var(--warning) / 0.7)';
    return 'hsl(var(--muted))';
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'destructive';
      case 'high': return 'destructive';
      case 'medium': return 'secondary';
      case 'low': return 'outline';
      default: return 'outline';
    }
  };

  const categoryChartData = {
    labels: Object.keys(statistics?.events_by_category || {}).map(getCategoryDisplayName),
    datasets: [{
      data: Object.values(statistics?.events_by_category || {}),
      backgroundColor: [
        'hsl(var(--primary))',
        'hsl(var(--secondary))',
        'hsl(var(--accent))',
        'hsl(var(--muted))',
        'hsl(var(--warning))',
        'hsl(var(--destructive))',
        'hsl(var(--success))'
      ],
      borderColor: 'hsl(var(--border))',
      borderWidth: 1
    }]
  };

  const sensitivityChartData = {
    labels: Object.keys(statistics?.events_by_sensitivity || {}).map(getSensitivityDisplayName),
    datasets: [{
      label: 'عدد الأحداث',
      data: Object.values(statistics?.events_by_sensitivity || {}),
      backgroundColor: 'hsl(var(--primary) / 0.8)',
      borderColor: 'hsl(var(--primary))',
      borderWidth: 1
    }]
  };

  return (
    <div className="space-y-6" dir="rtl">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">لوحة مراقبة التدقيق الشامل</h2>
          <p className="text-muted-foreground">
            مراقبة وتحليل جميع الأنشطة الأمنية في النظام
          </p>
        </div>
        <Button onClick={handleRefresh} disabled={loading}>
          <RefreshCw className="w-4 h-4 ml-2" />
          تحديث
        </Button>
      </div>

      {/* Statistics Cards */}
      {statistics && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">إجمالي الأحداث</CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{statistics.total_events}</div>
              <p className="text-xs text-muted-foreground">
                في آخر {filters.days} أيام
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">أحداث عالية المخاطر</CardTitle>
              <AlertTriangle className="h-4 w-4 text-destructive" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-destructive">{statistics.high_risk_events}</div>
              <p className="text-xs text-muted-foreground">
                مخاطر ≥ 50
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">التنبيهات النشطة</CardTitle>
              <Shield className="h-4 w-4 text-warning" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-warning">{statistics.active_alerts}</div>
              <p className="text-xs text-muted-foreground">
                تحتاج للمراجعة
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">معدل الأمان</CardTitle>
              <Shield className="h-4 w-4 text-success" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-success">
                {statistics.total_events > 0 
                  ? Math.round(((statistics.total_events - statistics.high_risk_events) / statistics.total_events) * 100)
                  : 100}%
              </div>
              <p className="text-xs text-muted-foreground">
                أحداث آمنة
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      <Tabs defaultValue="events" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="events">سجل الأحداث</TabsTrigger>
          <TabsTrigger value="alerts">التنبيهات الأمنية</TabsTrigger>
          <TabsTrigger value="analytics">التحليلات</TabsTrigger>
          <TabsTrigger value="reports">التقارير</TabsTrigger>
        </TabsList>

        <TabsContent value="events" className="space-y-4">
          {/* Events Filters */}
          <Card>
            <CardHeader>
              <CardTitle>فلترة الأحداث</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
                <div>
                  <label className="text-sm font-medium">الفترة الزمنية</label>
                  <Select value={filters.days.toString()} onValueChange={(value) => handleFilterChange('days', parseInt(value))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">اليوم</SelectItem>
                      <SelectItem value="7">أسبوع</SelectItem>
                      <SelectItem value="30">شهر</SelectItem>
                      <SelectItem value="90">3 أشهر</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-sm font-medium">الفئة</label>
                  <Select value={filters.category} onValueChange={(value) => handleFilterChange('category', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="جميع الفئات" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">جميع الفئات</SelectItem>
                      <SelectItem value="authentication">المصادقة</SelectItem>
                      <SelectItem value="data_access">الوصول للبيانات</SelectItem>
                      <SelectItem value="data_modification">تعديل البيانات</SelectItem>
                      <SelectItem value="permission_change">تغيير الصلاحيات</SelectItem>
                      <SelectItem value="system_admin">إدارة النظام</SelectItem>
                      <SelectItem value="financial">مالية</SelectItem>
                      <SelectItem value="medical_record">السجلات الطبية</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-sm font-medium">مستوى الحساسية</label>
                  <Select value={filters.sensitivity} onValueChange={(value) => handleFilterChange('sensitivity', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="جميع المستويات" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">جميع المستويات</SelectItem>
                      <SelectItem value="normal">عادي</SelectItem>
                      <SelectItem value="sensitive">حساس</SelectItem>
                      <SelectItem value="critical">حرج</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-sm font-medium">عدد النتائج</label>
                  <Select value={filters.limit.toString()} onValueChange={(value) => handleFilterChange('limit', parseInt(value))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="25">25</SelectItem>
                      <SelectItem value="50">50</SelectItem>
                      <SelectItem value="100">100</SelectItem>
                      <SelectItem value="200">200</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-sm font-medium">البحث</label>
                  <div className="relative">
                    <Search className="absolute right-2 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="البحث في الأحداث..."
                      value={filters.search}
                      onChange={(e) => handleFilterChange('search', e.target.value)}
                      className="pr-8"
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Events List */}
          <Card>
            <CardHeader>
              <CardTitle>سجل الأحداث الأمنية ({events.length})</CardTitle>
              <CardDescription>
                تفاصيل جميع الأنشطة المسجلة في النظام
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {loading ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                    <p className="mt-2 text-muted-foreground">جاري التحميل...</p>
                  </div>
                ) : events.length === 0 ? (
                  <div className="text-center py-8">
                    <Eye className="mx-auto h-12 w-12 text-muted-foreground" />
                    <p className="mt-2 text-muted-foreground">لا توجد أحداث مطابقة للفلاتر المحددة</p>
                  </div>
                ) : (
                  events.map((event) => (
                    <div key={event.id} className="border rounded-lg p-4 space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Badge variant={event.sensitivity_level === 'critical' ? 'destructive' : event.sensitivity_level === 'sensitive' ? 'secondary' : 'outline'}>
                            {getSensitivityDisplayName(event.sensitivity_level)}
                          </Badge>
                          <Badge variant="outline">
                            {getCategoryDisplayName(event.event_category)}
                          </Badge>
                          {event.risk_score >= 50 && (
                            <Badge variant="destructive">
                              <AlertTriangle className="w-3 h-3 ml-1" />
                              مخاطر عالية ({event.risk_score})
                            </Badge>
                          )}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {format(new Date(event.created_at), 'PPpp', { locale: ar })}
                        </div>
                      </div>

                      <div className="grid gap-2 md:grid-cols-2">
                        <div className="flex items-center gap-2">
                          <Database className="w-4 h-4 text-muted-foreground" />
                          <span className="text-sm">
                            <span className="font-medium">العملية:</span> {event.operation} - {event.table_name}
                          </span>
                        </div>
                        {event.ip_address && (
                          <div className="flex items-center gap-2">
                            <Shield className="w-4 h-4 text-muted-foreground" />
                            <span className="text-sm">
                              <span className="font-medium">IP:</span> {event.ip_address}
                            </span>
                          </div>
                        )}
                      </div>

                      {event.error_message && (
                        <div className="text-sm text-destructive bg-destructive/10 p-2 rounded">
                          <span className="font-medium">خطأ:</span> {event.error_message}
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="alerts" className="space-y-4">
          {/* Alert Filters */}
          <Card>
            <CardHeader>
              <CardTitle>فلترة التنبيهات</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="text-sm font-medium">الحالة</label>
                  <Select value={alertFilters.status} onValueChange={(value) => handleAlertFilterChange('status', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="جميع الحالات" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">جميع الحالات</SelectItem>
                      <SelectItem value="open">مفتوح</SelectItem>
                      <SelectItem value="investigating">قيد التحقيق</SelectItem>
                      <SelectItem value="resolved">محلول</SelectItem>
                      <SelectItem value="false_positive">إنذار خاطئ</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Alerts List */}
          <Card>
            <CardHeader>
              <CardTitle>التنبيهات الأمنية ({alerts.length})</CardTitle>
              <CardDescription>
                التنبيهات المكتشفة تلقائياً للأنشطة المشبوهة
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {alerts.length === 0 ? (
                  <div className="text-center py-8">
                    <Shield className="mx-auto h-12 w-12 text-success" />
                    <p className="mt-2 text-muted-foreground">لا توجد تنبيهات أمنية</p>
                  </div>
                ) : (
                  alerts.map((alert) => (
                    <div key={alert.id} className="border rounded-lg p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Badge variant={getSeverityColor(alert.severity)}>
                            {getSeverityDisplayName(alert.severity)}
                          </Badge>
                          <Badge variant="outline">
                            {getStatusDisplayName(alert.status)}
                          </Badge>
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {format(new Date(alert.created_at), 'PPpp', { locale: ar })}
                        </div>
                      </div>

                      <div>
                        <h4 className="font-medium">{alert.title}</h4>
                        <p className="text-sm text-muted-foreground mt-1">{alert.description}</p>
                      </div>

                      {alert.metadata && (
                        <div className="text-xs text-muted-foreground bg-muted p-2 rounded">
                          <pre>{JSON.stringify(alert.metadata, null, 2)}</pre>
                        </div>
                      )}

                      {alert.status === 'open' && (
                        <div className="flex gap-2">
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => updateAlertStatus(alert.id, 'investigating')}
                          >
                            بدء التحقيق
                          </Button>
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => updateAlertStatus(alert.id, 'resolved', 'تم الحل تلقائياً')}
                          >
                            وضع علامة كمحلول
                          </Button>
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => updateAlertStatus(alert.id, 'false_positive', 'إنذار خاطئ')}
                          >
                            إنذار خاطئ
                          </Button>
                        </div>
                      )}

                      {alert.resolved_at && (
                        <div className="text-sm text-muted-foreground">
                          <span className="font-medium">تم الحل في:</span> {format(new Date(alert.resolved_at), 'PPpp', { locale: ar })}
                          {alert.resolution_notes && (
                            <div className="mt-1">
                              <span className="font-medium">ملاحظات:</span> {alert.resolution_notes}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          {statistics && (
            <div className="grid gap-6 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>توزيع الأحداث حسب الفئة</CardTitle>
                </CardHeader>
                <CardContent>
                  <div style={{ height: '300px' }}>
                    <Doughnut 
                      data={categoryChartData}
                      options={{
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: {
                          legend: {
                            position: 'bottom',
                          },
                        },
                      }}
                    />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>توزيع الأحداث حسب مستوى الحساسية</CardTitle>
                </CardHeader>
                <CardContent>
                  <div style={{ height: '300px' }}>
                    <Bar 
                      data={sensitivityChartData}
                      options={{
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: {
                          legend: {
                            display: false,
                          },
                        },
                        scales: {
                          y: {
                            beginAtZero: true,
                          },
                        },
                      }}
                    />
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </TabsContent>

        <TabsContent value="reports" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>التقارير الأمنية</CardTitle>
              <CardDescription>
                تقارير مفصلة حول الأنشطة الأمنية والتدقيق
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <Clock className="mx-auto h-12 w-12 text-muted-foreground" />
                <p className="mt-2 text-muted-foreground">التقارير المفصلة ستكون متاحة قريباً</p>
                <p className="text-sm text-muted-foreground mt-1">
                  سيتم إضافة تقارير يومية وأسبوعية وشهرية مع تحليلات متقدمة
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};