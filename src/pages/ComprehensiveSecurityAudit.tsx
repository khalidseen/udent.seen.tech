import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { PageContainer } from "@/components/layout/PageContainer";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Shield, AlertTriangle, CheckCircle, Eye, Download, Search, Activity, Clock, Users, FileText } from "lucide-react";
import { format } from "date-fns";
import { ar } from "date-fns/locale";

const SEVERITY_MAP: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  critical: { label: "حرج", variant: "destructive" },
  high: { label: "عالي", variant: "destructive" },
  medium: { label: "متوسط", variant: "default" },
  low: { label: "منخفض", variant: "secondary" },
  normal: { label: "عادي", variant: "outline" },
};

const ComprehensiveSecurityAudit = () => {
  const [tab, setTab] = useState("events");
  const [search, setSearch] = useState("");
  const [severityFilter, setSeverityFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");

  const { data: profile } = useQuery({
    queryKey: ['profile-security'],
    queryFn: async () => {
      const { data } = await supabase.rpc('get_current_user_profile');
      return data;
    }
  });

  // جلب الأحداث الأمنية الحقيقية
  const { data: events = [], isLoading: eventsLoading } = useQuery({
    queryKey: ['security-events'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('security_events')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(500);
      if (error) throw error;
      return data;
    }
  });

  // جلب التنبيهات الأمنية
  const { data: alerts = [], isLoading: alertsLoading } = useQuery({
    queryKey: ['security-alerts', profile?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('security_alerts')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(200);
      if (error) throw error;
      return data;
    },
    enabled: !!profile?.id
  });

  // إحصائيات من RPC
  const { data: auditStats } = useQuery({
    queryKey: ['audit-stats'],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_audit_statistics', { days_back: 7 });
      if (error) throw error;
      return data as any;
    }
  });

  // سجل التدقيق
  const { data: auditLogs = [] } = useQuery({
    queryKey: ['audit-logs'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('audit_log')
        .select('*')
        .order('timestamp', { ascending: false })
        .limit(200);
      if (error) throw error;
      return data;
    }
  });

  const filteredEvents = events.filter((e: any) => {
    const matchSearch = !search || e.event_type?.toLowerCase().includes(search.toLowerCase()) || e.table_name?.toLowerCase().includes(search.toLowerCase());
    const matchSeverity = severityFilter === 'all' || e.sensitivity_level === severityFilter;
    const matchCategory = categoryFilter === 'all' || e.event_category === categoryFilter;
    return matchSearch && matchSeverity && matchCategory;
  });

  const stats = {
    totalEvents: auditStats?.total_events || events.length,
    highRisk: auditStats?.high_risk_events || events.filter((e: any) => (e.risk_score || 0) >= 50).length,
    activeAlerts: auditStats?.active_alerts || alerts.filter((a: any) => a.status === 'open').length,
    safeEvents: events.filter((e: any) => (e.risk_score || 0) < 20).length,
    securityRate: events.length > 0 ? ((events.filter((e: any) => (e.risk_score || 0) < 50).length / events.length) * 100).toFixed(1) : '100',
  };

  const exportCSV = () => {
    const csv = '\uFEFF' + 'النوع,الجدول,العملية,المخاطر,التاريخ\n' +
      events.map((e: any) => `${e.event_type},${e.table_name},${e.operation},${e.risk_score || 0},${e.created_at}`).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `security-audit-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    link.click();
  };

  return (
    <PageContainer>
      <PageHeader title="التدقيق الأمني الشامل" description="مراقبة وتدقيق جميع العمليات الأمنية في النظام - بيانات حقيقية" />

      <div className="space-y-6">
        {/* إحصائيات حقيقية */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <Card><CardContent className="p-4 text-center">
            <Activity className="w-5 h-5 mx-auto mb-1 text-primary" />
            <p className="text-2xl font-bold">{stats.totalEvents.toLocaleString()}</p>
            <p className="text-xs text-muted-foreground">أحداث (7 أيام)</p>
          </CardContent></Card>
          <Card><CardContent className="p-4 text-center">
            <AlertTriangle className="w-5 h-5 mx-auto mb-1 text-destructive" />
            <p className="text-2xl font-bold text-destructive">{stats.highRisk}</p>
            <p className="text-xs text-muted-foreground">مخاطر عالية</p>
          </CardContent></Card>
          <Card><CardContent className="p-4 text-center">
            <Shield className="w-5 h-5 mx-auto mb-1 text-amber-500" />
            <p className="text-2xl font-bold text-amber-600">{stats.activeAlerts}</p>
            <p className="text-xs text-muted-foreground">تنبيهات مفتوحة</p>
          </CardContent></Card>
          <Card><CardContent className="p-4 text-center">
            <CheckCircle className="w-5 h-5 mx-auto mb-1 text-green-500" />
            <p className="text-2xl font-bold text-green-600">{stats.safeEvents.toLocaleString()}</p>
            <p className="text-xs text-muted-foreground">أحداث آمنة</p>
          </CardContent></Card>
          <Card><CardContent className="p-4 text-center">
            <Shield className="w-5 h-5 mx-auto mb-1 text-green-500" />
            <p className="text-2xl font-bold text-green-600">{stats.securityRate}%</p>
            <p className="text-xs text-muted-foreground">معدل الأمان</p>
          </CardContent></Card>
        </div>

        {/* فلاتر */}
        <div className="flex gap-4 items-end flex-wrap">
          <div className="flex-1 min-w-[200px] max-w-sm">
            <div className="relative">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input placeholder="بحث بنوع الحدث أو الجدول..." value={search} onChange={e => setSearch(e.target.value)} className="pr-10" />
            </div>
          </div>
          <Select value={severityFilter} onValueChange={setSeverityFilter}>
            <SelectTrigger className="w-36"><SelectValue placeholder="المخاطر" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">جميع المستويات</SelectItem>
              <SelectItem value="critical">حرج</SelectItem>
              <SelectItem value="sensitive">حساس</SelectItem>
              <SelectItem value="normal">عادي</SelectItem>
            </SelectContent>
          </Select>
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="w-36"><SelectValue placeholder="الفئة" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">جميع الفئات</SelectItem>
              <SelectItem value="data_access">وصول بيانات</SelectItem>
              <SelectItem value="medical_record">سجلات طبية</SelectItem>
              <SelectItem value="financial">مالية</SelectItem>
              <SelectItem value="permission_change">صلاحيات</SelectItem>
              <SelectItem value="system_admin">إدارة نظام</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" onClick={exportCSV}>
            <Download className="w-4 h-4 ml-2" />تصدير CSV
          </Button>
        </div>

        <Tabs value={tab} onValueChange={setTab}>
          <TabsList>
            <TabsTrigger value="events">الأحداث الأمنية ({events.length})</TabsTrigger>
            <TabsTrigger value="alerts">التنبيهات ({alerts.length})</TabsTrigger>
            <TabsTrigger value="audit">سجل التدقيق ({auditLogs.length})</TabsTrigger>
          </TabsList>

          <TabsContent value="events" className="mt-4">
            {eventsLoading ? (
              <div className="text-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto" /></div>
            ) : filteredEvents.length === 0 ? (
              <Card><CardContent className="py-12 text-center text-muted-foreground">
                <Shield className="w-12 h-12 mx-auto mb-3 opacity-30" />
                لا توجد أحداث أمنية مسجلة
              </CardContent></Card>
            ) : (
              <div className="space-y-2">
                {filteredEvents.slice(0, 100).map((event: any) => {
                  const severity = SEVERITY_MAP[event.sensitivity_level] || SEVERITY_MAP.normal;
                  const isHighRisk = (event.risk_score || 0) >= 50;
                  return (
                    <Card key={event.id} className={isHighRisk ? 'border-destructive/30' : ''}>
                      <CardContent className="p-3 flex items-start justify-between gap-4">
                        <div className="flex items-start gap-3 flex-1">
                          <div className={`p-1.5 rounded ${isHighRisk ? 'bg-destructive/10' : 'bg-primary/10'}`}>
                            <Shield className={`w-4 h-4 ${isHighRisk ? 'text-destructive' : 'text-primary'}`} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="font-medium text-sm">{event.event_type}</span>
                              <Badge variant={severity.variant}>{severity.label}</Badge>
                              {event.event_category && <Badge variant="outline" className="text-[10px]">{event.event_category}</Badge>}
                              {isHighRisk && <Badge variant="destructive" className="text-[10px]">خطر: {event.risk_score}</Badge>}
                            </div>
                            <div className="flex gap-3 text-[10px] text-muted-foreground">
                              {event.table_name && <span>الجدول: {event.table_name}</span>}
                              {event.operation && <span>العملية: {event.operation}</span>}
                              {event.ip_address && <span>IP: {String(event.ip_address)}</span>}
                              <span>{format(new Date(event.created_at), 'dd/MM/yyyy HH:mm:ss', { locale: ar })}</span>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </TabsContent>

          <TabsContent value="alerts" className="mt-4">
            {alertsLoading ? (
              <div className="text-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto" /></div>
            ) : alerts.length === 0 ? (
              <Card><CardContent className="py-12 text-center text-muted-foreground">
                <CheckCircle className="w-12 h-12 mx-auto mb-3 opacity-30" />
                لا توجد تنبيهات أمنية - النظام آمن!
              </CardContent></Card>
            ) : (
              <div className="space-y-2">
                {alerts.map((alert: any) => {
                  const severity = SEVERITY_MAP[alert.severity] || SEVERITY_MAP.normal;
                  return (
                    <Card key={alert.id} className={alert.status === 'open' ? 'border-destructive/20' : ''}>
                      <CardContent className="p-4 flex items-start justify-between">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-medium">{alert.title}</span>
                            <Badge variant={severity.variant}>{severity.label}</Badge>
                            <Badge variant={alert.status === 'open' ? 'destructive' : 'secondary'}>
                              {alert.status === 'open' ? 'مفتوح' : alert.status === 'resolved' ? 'محلول' : alert.status}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground">{alert.description}</p>
                          <p className="text-[10px] text-muted-foreground mt-1">
                            {format(new Date(alert.created_at), 'dd/MM/yyyy HH:mm', { locale: ar })}
                            {alert.alert_type && ` • ${alert.alert_type}`}
                          </p>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </TabsContent>

          <TabsContent value="audit" className="mt-4">
            {auditLogs.length === 0 ? (
              <Card><CardContent className="py-12 text-center text-muted-foreground">
                <FileText className="w-12 h-12 mx-auto mb-3 opacity-30" />
                لا يوجد سجل تدقيق
              </CardContent></Card>
            ) : (
              <div className="space-y-2">
                {auditLogs.slice(0, 100).map((log: any) => (
                  <Card key={log.id}>
                    <CardContent className="p-3 flex items-center gap-3">
                      <FileText className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium">{log.table_name}</span>
                          <Badge variant="outline" className="text-[10px]">{log.operation}</Badge>
                          {log.ip_address && <span className="text-[10px] text-muted-foreground">IP: {String(log.ip_address)}</span>}
                        </div>
                        <p className="text-[10px] text-muted-foreground">
                          {log.timestamp && format(new Date(log.timestamp), 'dd/MM/yyyy HH:mm:ss', { locale: ar })}
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </PageContainer>
  );
};

export default ComprehensiveSecurityAudit;
