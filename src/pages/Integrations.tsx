import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Activity, Key, FileText, TrendingUp, BarChart3, Building2, Settings, PieChart, Plus } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import OverviewTab from '@/components/integrations/OverviewTab';
import LogsTab from '@/components/integrations/LogsTab';
import DocumentationTab from '@/components/integrations/DocumentationTab';
import ClinicApiKeyManager from '@/components/integrations/ClinicApiKeyManager';
import ClinicAnalyticsDashboard from '@/components/integrations/ClinicAnalyticsDashboard';
import MultiClinicDashboard from '@/components/integrations/MultiClinicDashboard';
import ClinicRemoteControl from '@/components/integrations/ClinicRemoteControl';
import AggregatedAnalytics from '@/components/integrations/AggregatedAnalytics';
import AdminClinicCreator from '@/components/integrations/AdminClinicCreator';
import { useClinicContext } from '@/hooks/useClinicContext';
import { useMultiClinicAnalytics } from '@/hooks/useMultiClinicAnalytics';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

const Integrations = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const { currentClinic } = useClinicContext();
  const multiClinic = useMultiClinicAnalytics();
  const isMultiClinic = multiClinic.clinics.length > 1;

  // Real stats from DB
  const { data: realStats } = useQuery({
    queryKey: ['integration-stats', currentClinic?.id],
    queryFn: async () => {
      if (!currentClinic?.id) return { totalRequests: 0, successRate: 0, avgResponseTime: 0, activeKeys: 0, activeWebhooks: 0 };
      
      const [logsRes, keysRes] = await Promise.all([
        supabase.from('api_logs').select('status_code, response_time_ms', { count: 'exact' }).eq('clinic_id', currentClinic.id),
        supabase.from('api_keys').select('id', { count: 'exact', head: true }).eq('clinic_id', currentClinic.id).eq('is_active', true),
      ]);

      const logs = logsRes.data || [];
      const total = logsRes.count || 0;
      const successful = logs.filter(l => l.status_code && l.status_code >= 200 && l.status_code < 300).length;
      const avgTime = logs.length > 0 ? Math.round(logs.reduce((s, l) => s + (l.response_time_ms || 0), 0) / logs.length) : 0;

      return {
        totalRequests: total,
        successRate: total > 0 ? Math.round((successful / total) * 1000) / 10 : 0,
        avgResponseTime: avgTime,
        activeKeys: keysRes.count || 0,
        activeWebhooks: 0,
      };
    },
    enabled: !!currentClinic?.id,
  });

  const stats = realStats || { totalRequests: 0, successRate: 0, avgResponseTime: 0, activeKeys: 0, activeWebhooks: 0 };

  const handleSelectClinic = (clinicId: string) => {
    setActiveTab('remote-control');
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">التكاملات والربط البرمجي</h1>
          <p className="text-muted-foreground mt-2">
            إدارة API Keys و Webhooks والتكاملات الخارجية
            {isMultiClinic && ' • إدارة متعددة العيادات'}
          </p>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {isMultiClinic ? 'العيادات النشطة' : 'إجمالي الطلبات'}
            </CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {isMultiClinic ? multiClinic.aggregated.activeClinics : stats.totalRequests.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">
              {isMultiClinic ? `من ${multiClinic.aggregated.totalClinics} عيادة` : 'من سجلات API'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {isMultiClinic ? 'إجمالي المرضى' : 'معدل النجاح'}
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {isMultiClinic ? multiClinic.aggregated.totalPatients.toLocaleString() : `${stats.successRate}%`}
            </div>
            <p className="text-xs text-muted-foreground">
              {isMultiClinic ? 'عبر جميع العيادات' : stats.totalRequests > 0 ? 'من السجلات الفعلية' : 'لا توجد بيانات'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {isMultiClinic ? 'إيرادات الشهر' : 'API Keys النشطة'}
            </CardTitle>
            <Key className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {isMultiClinic ? multiClinic.aggregated.thisMonthRevenue.toLocaleString() : stats.activeKeys}
            </div>
            <p className="text-xs text-muted-foreground">
              {isMultiClinic ? 'الإجمالي: ' + multiClinic.aggregated.totalRevenue.toLocaleString() : 'مفاتيح فعالة'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {isMultiClinic ? 'المواعيد (30 يوم)' : 'متوسط الاستجابة'}
            </CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {isMultiClinic ? multiClinic.aggregated.totalAppointments.toLocaleString() : `${stats.avgResponseTime}ms`}
            </div>
            <p className="text-xs text-muted-foreground">
              {isMultiClinic ? 'آخر 30 يوم' : 'وقت الاستجابة'}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} dir="rtl">
        <TabsList className={`grid w-full ${isMultiClinic ? 'grid-cols-8' : 'grid-cols-6'}`}>
          <TabsTrigger value="overview" className="gap-2">
            <Activity className="w-4 h-4" />
            نظرة عامة
          </TabsTrigger>
          {isMultiClinic && (
            <TabsTrigger value="clinics" className="gap-2">
              <Building2 className="w-4 h-4" />
              العيادات
            </TabsTrigger>
          )}
          {isMultiClinic && (
            <TabsTrigger value="aggregated" className="gap-2">
              <PieChart className="w-4 h-4" />
              تحليلات مجمّعة
            </TabsTrigger>
          )}
          <TabsTrigger value="create-clinic" className="gap-2">
            <Plus className="w-4 h-4" />
            عيادة جديدة
          </TabsTrigger>
          <TabsTrigger value="analytics" className="gap-2">
            <BarChart3 className="w-4 h-4" />
            التحليلات
          </TabsTrigger>
          <TabsTrigger value="clinic-api" className="gap-2">
            <Key className="w-4 h-4" />
            مفاتيح API
          </TabsTrigger>
          <TabsTrigger value="logs" className="gap-2">
            <FileText className="w-4 h-4" />
            السجلات
          </TabsTrigger>
          <TabsTrigger value="documentation" className="gap-2">
            <FileText className="w-4 h-4" />
            التوثيق
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-6">
          {isMultiClinic ? (
            <MultiClinicDashboard
              analytics={multiClinic.analytics}
              aggregated={multiClinic.aggregated}
              loading={multiClinic.loading}
              onRefresh={multiClinic.refresh}
              onSelectClinic={handleSelectClinic}
            />
          ) : (
            <OverviewTab apiKeys={[]} webhooks={[]} apiLogs={[]} stats={stats} />
          )}
        </TabsContent>

        {isMultiClinic && (
          <TabsContent value="clinics" className="mt-6">
            <ClinicRemoteControl
              clinics={multiClinic.clinics}
              analytics={multiClinic.analytics}
              settings={multiClinic.settings}
              onUpdateSettings={multiClinic.updateClinicSettings}
              onSwitchClinic={multiClinic.switchClinic}
            />
          </TabsContent>
        )}

        {isMultiClinic && (
          <TabsContent value="aggregated" className="mt-6">
            <AggregatedAnalytics
              analytics={multiClinic.analytics}
              loading={multiClinic.loading}
            />
          </TabsContent>
        )}

        <TabsContent value="create-clinic" className="mt-6">
          <AdminClinicCreator />
        </TabsContent>

        <TabsContent value="analytics" className="mt-6">
          <ClinicAnalyticsDashboard clinicId={currentClinic?.id || null} />
        </TabsContent>

        <TabsContent value="clinic-api" className="mt-6">
          <ClinicApiKeyManager clinicId={currentClinic?.id || null} />
        </TabsContent>

        <TabsContent value="logs" className="mt-6">
          <IntegrationLogsTab clinicId={currentClinic?.id || null} />
        </TabsContent>

        <TabsContent value="documentation" className="mt-6">
          <DocumentationTab />
        </TabsContent>

        {isMultiClinic && (
          <TabsContent value="remote-control" className="mt-6">
            <ClinicRemoteControl
              clinics={multiClinic.clinics}
              analytics={multiClinic.analytics}
              settings={multiClinic.settings}
              onUpdateSettings={multiClinic.updateClinicSettings}
              onSwitchClinic={multiClinic.switchClinic}
            />
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
};

// Wrapper that fetches real logs and passes to LogsTab
const IntegrationLogsTab = ({ clinicId }: { clinicId: string | null }) => {
  const { data: apiLogs = [], refetch } = useQuery({
    queryKey: ['api-logs', clinicId],
    queryFn: async () => {
      if (!clinicId) return [];
      const { data } = await supabase
        .from('api_logs')
        .select('*')
        .eq('clinic_id', clinicId)
        .order('created_at', { ascending: false })
        .limit(100);
      return (data || []).map(log => ({
        id: log.id,
        endpoint: log.endpoint,
        method: log.method,
        status: log.status_code || 0,
        response_time: log.response_time_ms || 0,
        ip_address: String(log.ip_address || ''),
        timestamp: log.created_at,
      }));
    },
    enabled: !!clinicId,
  });

  return <LogsTab apiLogs={apiLogs} onRefresh={() => refetch()} />;
};

export default Integrations;
