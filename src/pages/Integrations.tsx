import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Activity, Key, Webhook, FileText, TrendingUp, BarChart3 } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import OverviewTab from '@/components/integrations/OverviewTab';
import ApiKeysTab from '@/components/integrations/ApiKeysTab';
import WebhooksTab from '@/components/integrations/WebhooksTab';
import LogsTab from '@/components/integrations/LogsTab';
import DocumentationTab from '@/components/integrations/DocumentationTab';
import ClinicApiKeyManager from '@/components/integrations/ClinicApiKeyManager';
import ClinicAnalyticsDashboard from '@/components/integrations/ClinicAnalyticsDashboard';
import { useClinicContext } from '@/hooks/useClinicContext';

interface ApiKey {
  id: string;
  name: string;
  key: string;
  permissions: string[];
  is_active: boolean;
  last_used?: string;
  created_at: string;
}

interface Webhook {
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
  
  // Mock data - في التطبيق الحقيقي، سيتم جلبها من API
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([
    {
      id: '1',
      name: 'Production API Key',
      key: 'udent_live_abc123xyz789def456ghi',
      permissions: ['patients.read', 'appointments.read', 'invoices.read'],
      is_active: true,
      last_used: '2024-01-20T10:30:00Z',
      created_at: '2024-01-01T00:00:00Z',
    },
    {
      id: '2',
      name: 'Mobile App Integration',
      key: 'udent_live_mobile_app_key_123',
      permissions: ['patients.read', 'patients.write', 'appointments.read', 'appointments.write'],
      is_active: true,
      last_used: '2024-01-21T15:45:00Z',
      created_at: '2024-01-10T00:00:00Z',
    },
  ]);

  const [webhooks, setWebhooks] = useState<Webhook[]>([
    {
      id: '1',
      name: 'Patient Events Webhook',
      url: 'https://example.com/webhooks/patients',
      events: ['patient.created', 'patient.updated'],
      secret: 'whsec_abc123xyz789',
      is_active: true,
      success_count: 1245,
      failure_count: 5,
      created_at: '2024-01-05T00:00:00Z',
    },
    {
      id: '2',
      name: 'Appointment Notifications',
      url: 'https://api.notifications.com/udent',
      events: ['appointment.created', 'appointment.cancelled'],
      secret: 'whsec_def456ghi012',
      is_active: true,
      success_count: 3420,
      failure_count: 12,
      created_at: '2024-01-08T00:00:00Z',
    },
  ]);

  const [apiLogs, setApiLogs] = useState<ApiLog[]>([
    {
      id: '1',
      endpoint: '/api/v1/patients',
      method: 'GET',
      status: 200,
      response_time: 145,
      ip_address: '192.168.1.100',
      timestamp: '2024-01-21T16:30:00Z',
    },
    {
      id: '2',
      endpoint: '/api/v1/appointments',
      method: 'POST',
      status: 201,
      response_time: 234,
      ip_address: '192.168.1.101',
      timestamp: '2024-01-21T16:28:00Z',
    },
    {
      id: '3',
      endpoint: '/api/v1/patients/123',
      method: 'GET',
      status: 200,
      response_time: 98,
      ip_address: '192.168.1.100',
      timestamp: '2024-01-21T16:25:00Z',
    },
    {
      id: '4',
      endpoint: '/api/v1/invoices',
      method: 'GET',
      status: 200,
      response_time: 187,
      ip_address: '192.168.1.102',
      timestamp: '2024-01-21T16:20:00Z',
    },
    {
      id: '5',
      endpoint: '/api/v1/patients/456',
      method: 'PUT',
      status: 200,
      response_time: 312,
      ip_address: '192.168.1.100',
      timestamp: '2024-01-21T16:15:00Z',
    },
  ]);

  const stats = {
    totalRequests: 15420,
    successRate: 99.7,
    avgResponseTime: 187,
    activeKeys: apiKeys.filter(k => k.is_active).length,
    activeWebhooks: webhooks.filter(w => w.is_active).length,
  };

  const generateApiKey = (name: string, permissions: string[]) => {
    const newKey: ApiKey = {
      id: Date.now().toString(),
      name,
      key: `udent_live_${Math.random().toString(36).substring(2, 15)}`,
      permissions,
      is_active: true,
      created_at: new Date().toISOString(),
    };
    setApiKeys([...apiKeys, newKey]);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const toggleApiKey = (id: string) => {
    setApiKeys(apiKeys.map(key => 
      key.id === id ? { ...key, is_active: !key.is_active } : key
    ));
  };

  const deleteApiKey = (id: string) => {
    setApiKeys(apiKeys.filter(key => key.id !== id));
  };

  const addWebhook = (webhook: Omit<Webhook, 'id' | 'success_count' | 'failure_count' | 'created_at'>) => {
    const newWebhook: Webhook = {
      ...webhook,
      id: Date.now().toString(),
      success_count: 0,
      failure_count: 0,
      created_at: new Date().toISOString(),
    };
    setWebhooks([...webhooks, newWebhook]);
  };

  const toggleWebhook = (id: string) => {
    setWebhooks(webhooks.map(webhook => 
      webhook.id === id ? { ...webhook, is_active: !webhook.is_active } : webhook
    ));
  };

  const deleteWebhook = (id: string) => {
    setWebhooks(webhooks.filter(webhook => webhook.id !== id));
  };

  const testWebhook = (id: string) => {
    console.log('Testing webhook:', id);
    // في التطبيق الحقيقي، سيتم إرسال طلب تجريبي
  };

  const updateWebhook = (id: string, data: Partial<Webhook>) => {
    setWebhooks(webhooks.map(webhook => 
      webhook.id === id ? { ...webhook, ...data } : webhook
    ));
  };

  const refreshLogs = () => {
    console.log('Refreshing logs...');
    // في التطبيق الحقيقي، سيتم جلب السجلات من API
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">التكاملات والربط البرمجي</h1>
          <p className="text-muted-foreground mt-2">
            إدارة API Keys و Webhooks والتكاملات الخارجية
          </p>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">إجمالي الطلبات</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalRequests.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">في آخر 30 يوم</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">معدل النجاح</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.successRate}%</div>
            <p className="text-xs text-muted-foreground">أداء ممتاز</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">API Keys النشطة</CardTitle>
            <Key className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.activeKeys}</div>
            <p className="text-xs text-muted-foreground">من {apiKeys.length} إجمالاً</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Webhooks النشطة</CardTitle>
            <Webhook className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.activeWebhooks}</div>
            <p className="text-xs text-muted-foreground">من {webhooks.length} إجمالاً</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} dir="rtl">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview" className="gap-2">
            <Activity className="w-4 h-4" />
            نظرة عامة
          </TabsTrigger>
          <TabsTrigger value="api-keys" className="gap-2">
            <Key className="w-4 h-4" />
            API Keys
          </TabsTrigger>
          <TabsTrigger value="webhooks" className="gap-2">
            <Webhook className="w-4 h-4" />
            Webhooks
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
          <OverviewTab
            apiKeys={apiKeys}
            webhooks={webhooks}
            apiLogs={apiLogs}
            stats={stats}
          />
        </TabsContent>

        <TabsContent value="analytics" className="mt-6">
          <ClinicAnalyticsDashboard clinicId={currentClinic?.id || null} />
        </TabsContent>

        <TabsContent value="clinic-api" className="mt-6">
          <ClinicApiKeyManager clinicId={currentClinic?.id || null} />
        </TabsContent>

        <TabsContent value="api-keys" className="mt-6">
          <ApiKeysTab
            apiKeys={apiKeys}
            onGenerateKey={generateApiKey}
            onToggleKey={toggleApiKey}
            onDeleteKey={deleteApiKey}
            onCopyKey={copyToClipboard}
          />
        </TabsContent>

        <TabsContent value="webhooks" className="mt-6">
          <WebhooksTab
            webhooks={webhooks}
            onAddWebhook={addWebhook}
            onToggleWebhook={toggleWebhook}
            onDeleteWebhook={deleteWebhook}
            onTestWebhook={testWebhook}
            onUpdateWebhook={updateWebhook}
          />
        </TabsContent>

        <TabsContent value="logs" className="mt-6">
          <LogsTab
            apiLogs={apiLogs}
            onRefresh={refreshLogs}
          />
        </TabsContent>

        <TabsContent value="documentation" className="mt-6">
          <DocumentationTab />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Integrations;
