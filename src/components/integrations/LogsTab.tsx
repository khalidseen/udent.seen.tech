import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Activity, 
  Search,
  Download,
  Filter,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  RefreshCw
} from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface ApiLog {
  id: string;
  endpoint: string;
  method: string;
  status: number;
  response_time: number;
  ip_address: string;
  timestamp: string;
}

interface LogsTabProps {
  apiLogs: ApiLog[];
  onRefresh: () => void;
}

const LogsTab: React.FC<LogsTabProps> = ({ apiLogs, onRefresh }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [methodFilter, setMethodFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const getMethodColor = (method: string) => {
    switch (method) {
      case 'GET': return 'bg-blue-100 text-blue-800';
      case 'POST': return 'bg-green-100 text-green-800';
      case 'PUT': return 'bg-yellow-100 text-yellow-800';
      case 'PATCH': return 'bg-orange-100 text-orange-800';
      case 'DELETE': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusColor = (status: number) => {
    if (status >= 200 && status < 300) return 'bg-green-100 text-green-800';
    if (status >= 300 && status < 400) return 'bg-blue-100 text-blue-800';
    if (status >= 400 && status < 500) return 'bg-yellow-100 text-yellow-800';
    return 'bg-red-100 text-red-800';
  };

  const getResponseTimeColor = (time: number) => {
    if (time < 100) return 'text-green-600';
    if (time < 500) return 'text-yellow-600';
    return 'text-red-600';
  };

  const filteredLogs = apiLogs.filter(log => {
    const matchesSearch = 
      log.endpoint.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.ip_address.includes(searchQuery);
    
    const matchesMethod = methodFilter === 'all' || log.method === methodFilter;
    
    const matchesStatus = 
      statusFilter === 'all' ||
      (statusFilter === 'success' && log.status >= 200 && log.status < 300) ||
      (statusFilter === 'error' && log.status >= 400);
    
    return matchesSearch && matchesMethod && matchesStatus;
  });

  const exportLogs = () => {
    const csv = [
      ['Timestamp', 'Method', 'Endpoint', 'Status', 'Response Time (ms)', 'IP Address'],
      ...filteredLogs.map(log => [
        new Date(log.timestamp).toLocaleString('ar-SA'),
        log.method,
        log.endpoint,
        log.status.toString(),
        log.response_time.toString(),
        log.ip_address
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `api-logs-${new Date().toISOString()}.csv`;
    a.click();
  };

  const calculateStats = () => {
    const total = filteredLogs.length;
    const successful = filteredLogs.filter(log => log.status >= 200 && log.status < 300).length;
    const failed = filteredLogs.filter(log => log.status >= 400).length;
    const avgResponseTime = total > 0 
      ? Math.round(filteredLogs.reduce((sum, log) => sum + log.response_time, 0) / total)
      : 0;

    return { total, successful, failed, avgResponseTime };
  };

  const stats = calculateStats();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-2xl font-bold">سجل الطلبات</h3>
          <p className="text-muted-foreground mt-1">
            عرض وتحليل جميع طلبات API
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={onRefresh} className="gap-2">
            <RefreshCw className="w-4 h-4" />
            تحديث
          </Button>
          <Button variant="outline" onClick={exportLogs} className="gap-2">
            <Download className="w-4 h-4" />
            تصدير CSV
          </Button>
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
            <div className="text-2xl font-bold">{stats.total.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground mt-1">
              حسب الفلاتر المحددة
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">الطلبات الناجحة</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.successful.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {stats.total > 0 ? Math.round((stats.successful / stats.total) * 100) : 0}% من الإجمالي
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">الطلبات الفاشلة</CardTitle>
            <XCircle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{stats.failed.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {stats.total > 0 ? Math.round((stats.failed / stats.total) * 100) : 0}% من الإجمالي
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">متوسط الاستجابة</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${getResponseTimeColor(stats.avgResponseTime)}`}>
              {stats.avgResponseTime}ms
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              وقت الاستجابة
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="w-5 h-5" />
            تصفية السجلات
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Search */}
            <div className="space-y-2">
              <label className="text-sm font-medium">بحث</label>
              <div className="relative">
                <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="بحث في Endpoint أو IP..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pr-10"
                />
              </div>
            </div>

            {/* Method Filter */}
            <div className="space-y-2">
              <label className="text-sm font-medium">نوع الطلب</label>
              <Select value={methodFilter} onValueChange={setMethodFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="جميع الأنواع" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">جميع الأنواع</SelectItem>
                  <SelectItem value="GET">GET</SelectItem>
                  <SelectItem value="POST">POST</SelectItem>
                  <SelectItem value="PUT">PUT</SelectItem>
                  <SelectItem value="PATCH">PATCH</SelectItem>
                  <SelectItem value="DELETE">DELETE</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Status Filter */}
            <div className="space-y-2">
              <label className="text-sm font-medium">الحالة</label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="جميع الحالات" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">جميع الحالات</SelectItem>
                  <SelectItem value="success">ناجحة (2xx)</SelectItem>
                  <SelectItem value="error">فاشلة (4xx, 5xx)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Logs List */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Activity className="w-5 h-5" />
              السجلات ({filteredLogs.length})
            </CardTitle>
            {searchQuery || methodFilter !== 'all' || statusFilter !== 'all' ? (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setSearchQuery('');
                  setMethodFilter('all');
                  setStatusFilter('all');
                }}
              >
                إعادة تعيين الفلاتر
              </Button>
            ) : null}
          </div>
        </CardHeader>
        <CardContent>
          {filteredLogs.length === 0 ? (
            <div className="text-center py-12">
              <Activity className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">لا توجد سجلات</h3>
              <p className="text-sm text-muted-foreground">
                {searchQuery || methodFilter !== 'all' || statusFilter !== 'all'
                  ? 'لا توجد سجلات تطابق الفلاتر المحددة'
                  : 'لم يتم تسجيل أي طلبات بعد'
                }
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {filteredLogs.map((log) => (
                <div 
                  key={log.id} 
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center gap-3 flex-1">
                    <Badge className={getMethodColor(log.method)}>
                      {log.method}
                    </Badge>
                    <code className="text-sm bg-muted px-2 py-1 rounded flex-1">
                      {log.endpoint}
                    </code>
                    <Badge className={getStatusColor(log.status)}>
                      {log.status}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground mr-4">
                    <span className={`flex items-center gap-1 font-medium ${getResponseTimeColor(log.response_time)}`}>
                      <Clock className="w-3 h-3" />
                      {log.response_time}ms
                    </span>
                    <span className="font-mono text-xs">{log.ip_address}</span>
                    <span>{new Date(log.timestamp).toLocaleTimeString('ar-SA')}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default LogsTab;