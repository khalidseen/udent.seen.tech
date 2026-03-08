import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Activity, Key, FileText, TrendingUp, BarChart3, Building2, Settings, PieChart } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import OverviewTab from '@/components/integrations/OverviewTab';
import LogsTab from '@/components/integrations/LogsTab';
import DocumentationTab from '@/components/integrations/DocumentationTab';
import ClinicApiKeyManager from '@/components/integrations/ClinicApiKeyManager';
import ClinicAnalyticsDashboard from '@/components/integrations/ClinicAnalyticsDashboard';
import MultiClinicDashboard from '@/components/integrations/MultiClinicDashboard';
import ClinicRemoteControl from '@/components/integrations/ClinicRemoteControl';
import AggregatedAnalytics from '@/components/integrations/AggregatedAnalytics';
import { useClinicContext } from '@/hooks/useClinicContext';
import { useMultiClinicAnalytics } from '@/hooks/useMultiClinicAnalytics';

interface ApiKey {
  id: string;
  name: string;
  key: string;
  permissions: string[];
  is_active: boolean;
  last_used?: string;
  created_at: string;
}

interface WebhookData {
  id: string;
  name: string;
  url: string;
  events: string[];
  secret: string;
  is_active: boolean;
  success_count: number;
  failure_count: number;
  created_at: string;
}

interface ApiLog {
  id: string;
  endpoint: string;
  method: string;
  status: number;
  response_time: number;
  ip_address: string;
  timestamp: string;
}

const Integrations = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const { currentClinic } = useClinicContext();
  const multiClinic = useMultiClinicAnalytics();

  const isMultiClinic = multiClinic.clinics.length > 1;

  // Mock data for overview
  const [apiKeys] = useState<ApiKey[]>([
    {
      id: '1', name: 'Production API Key', key: 'udent_live_abc123xyz789def456ghi',
      permissions: ['patients.read', 'appointments.read', 'invoices.read'],
      is_active: true, last_used: '2024-01-20T10:30:00Z', created_at: '2024-01-01T00:00:00Z',
    },
  ]);

  const [webhooks] = useState<WebhookData[]>([
    {
      id: '1', name: 'Patient Events Webhook', url: 'https://example.com/webhooks/patients',
      events: ['patient.created', 'patient.updated'], secret: 'whsec_abc123xyz789',
      is_active: true, success_count: 1245, failure_count: 5, created_at: '2024-01-05T00:00:00Z',
    },
  ]);

  const [apiLogs] = useState<ApiLog[]>([
    { id: '1', endpoint: '/api/v1/patients', method: 'GET', status: 200, response_time: 145, ip_address: '192.168.1.100', timestamp: '2024-01-21T16:30:00Z' },
    { id: '2', endpoint: '/api/v1/appointments', method: 'POST', status: 201, response_time: 234, ip_address: '192.168.1.101', timestamp: '2024-01-21T16:28:00Z' },
  ]);

  const stats = {
    totalRequests: 15420,
    successRate: 99.7,
    avgResponseTime: 187,
    activeKeys: apiKeys.filter(k => k.is_active).length,
    activeWebhooks: webhooks.filter(w => w.is_active).length,
  };

  const refreshLogs = () => console.log('Refreshing logs...');

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
              {isMultiClinic ? `من ${multiClinic.aggregated.totalClinics} عيادة` : 'في آخر 30 يوم'}
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
              {isMultiClinic ? 'عبر جميع العيادات' : 'أداء ممتاز'}
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
              {isMultiClinic ? 'الإجمالي: ' + multiClinic.aggregated.totalRevenue.toLocaleString() : `من ${apiKeys.length} إجمالاً`}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {isMultiClinic ? 'المواعيد (30 يوم)' : 'Webhooks النشطة'}
            </CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {isMultiClinic ? multiClinic.aggregated.totalAppointments.toLocaleString() : stats.activeWebhooks}
            </div>
            <p className="text-xs text-muted-foreground">
              {isMultiClinic ? 'آخر 30 يوم' : `من ${webhooks.length} إجمالاً`}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} dir="rtl">
        <TabsList className={`grid w-full ${isMultiClinic ? 'grid-cols-7' : 'grid-cols-5'}`}>
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
            <OverviewTab apiKeys={apiKeys} webhooks={webhooks} apiLogs={apiLogs} stats={stats} />
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

        <TabsContent value="analytics" className="mt-6">
          <ClinicAnalyticsDashboard clinicId={currentClinic?.id || null} />
        </TabsContent>

        <TabsContent value="clinic-api" className="mt-6">
          <ClinicApiKeyManager clinicId={currentClinic?.id || null} />
        </TabsContent>

        <TabsContent value="logs" className="mt-6">
          <LogsTab apiLogs={apiLogs} onRefresh={refreshLogs} />
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

export default Integrations;
