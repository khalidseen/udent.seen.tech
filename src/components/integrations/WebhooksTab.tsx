import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  Webhook, 
  Plus, 
  Trash2, 
  MoreVertical,
  AlertCircle,
  CheckCircle,
  Play,
  Edit,
  Zap,
  TrendingUp,
  TrendingDown,
  Copy
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { Progress } from '@/components/ui/progress';

interface WebhookType {
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

interface WebhooksTabProps {
  webhooks: WebhookType[];
  onAddWebhook: (webhook: Omit<WebhookType, 'id' | 'success_count' | 'failure_count' | 'created_at'>) => void;
  onToggleWebhook: (id: string) => void;
  onDeleteWebhook: (id: string) => void;
  onTestWebhook: (id: string) => void;
  onUpdateWebhook: (id: string, data: Partial<WebhookType>) => void;
}

const WebhooksTab: React.FC<WebhooksTabProps> = ({
  webhooks,
  onAddWebhook,
  onToggleWebhook,
  onDeleteWebhook,
  onTestWebhook,
  onUpdateWebhook
}) => {
  const [showWebhookDialog, setShowWebhookDialog] = useState(false);
  const [editingWebhook, setEditingWebhook] = useState<WebhookType | null>(null);
  const [webhookName, setWebhookName] = useState('');
  const [webhookUrl, setWebhookUrl] = useState('');
  const [selectedEvents, setSelectedEvents] = useState<string[]>([]);

  const availableEvents = [
    { id: 'patient.created', name: 'إنشاء مريض جديد', category: 'المرضى' },
    { id: 'patient.updated', name: 'تحديث بيانات مريض', category: 'المرضى' },
    { id: 'patient.deleted', name: 'حذف مريض', category: 'المرضى' },
    { id: 'appointment.created', name: 'حجز موعد جديد', category: 'المواعيد' },
    { id: 'appointment.updated', name: 'تحديث موعد', category: 'المواعيد' },
    { id: 'appointment.cancelled', name: 'إلغاء موعد', category: 'المواعيد' },
    { id: 'treatment.completed', name: 'إتمام علاج', category: 'العلاجات' },
    { id: 'invoice.created', name: 'إصدار فاتورة', category: 'الفواتير' },
    { id: 'invoice.paid', name: 'دفع فاتورة', category: 'الفواتير' },
    { id: 'payment.received', name: 'استلام دفعة', category: 'المدفوعات' },
  ];

  const handleSaveWebhook = () => {
    if (!webhookName.trim() || !webhookUrl.trim() || selectedEvents.length === 0) {
      return;
    }

    const webhookData = {
      name: webhookName,
      url: webhookUrl,
      events: selectedEvents,
      secret: generateSecret(),
      is_active: true,
    };

    if (editingWebhook) {
      onUpdateWebhook(editingWebhook.id, webhookData);
    } else {
      onAddWebhook(webhookData);
    }

    resetForm();
  };

  const resetForm = () => {
    setWebhookName('');
    setWebhookUrl('');
    setSelectedEvents([]);
    setEditingWebhook(null);
    setShowWebhookDialog(false);
  };

  const handleEditWebhook = (webhook: WebhookType) => {
    setWebhookName(webhook.name);
    setWebhookUrl(webhook.url);
    setSelectedEvents(webhook.events);
    setEditingWebhook(webhook);
    setShowWebhookDialog(true);
  };

  const toggleEvent = (eventId: string) => {
    setSelectedEvents(prev => 
      prev.includes(eventId) 
        ? prev.filter(e => e !== eventId)
        : [...prev, eventId]
    );
  };

  const generateSecret = () => {
    return 'whsec_' + Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const getSuccessRate = (webhook: WebhookType) => {
    const total = webhook.success_count + webhook.failure_count;
    if (total === 0) return 0;
    return Math.round((webhook.success_count / total) * 100);
  };

  const groupedEvents = availableEvents.reduce((acc, event) => {
    if (!acc[event.category]) {
      acc[event.category] = [];
    }
    acc[event.category].push(event);
    return acc;
  }, {} as Record<string, typeof availableEvents>);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-2xl font-bold">Webhooks</h3>
          <p className="text-muted-foreground mt-1">
            استقبل إشعارات فورية عن الأحداث المهمة في النظام
          </p>
        </div>
        <Button onClick={() => setShowWebhookDialog(true)} className="gap-2">
          <Plus className="w-4 h-4" />
          إضافة Webhook
        </Button>
      </div>

      {/* Info Card */}
      <Card className="border-blue-200 bg-blue-50">
        <CardContent className="pt-6">
          <div className="flex gap-3">
            <Zap className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div>
              <div className="font-semibold text-blue-900 mb-1">كيف تعمل Webhooks؟</div>
              <p className="text-sm text-blue-800">
                عند حدوث أي حدث محدد في النظام، سنرسل طلب POST إلى الـ URL المحدد مع بيانات الحدث.
                استخدم الـ secret للتحقق من صحة الطلبات القادمة من نظامنا.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Webhooks List */}
      {webhooks.length === 0 ? (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-12">
              <Webhook className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">لا توجد Webhooks</h3>
              <p className="text-sm text-muted-foreground mb-6">
                أضف webhook لاستقبال إشعارات فورية عن الأحداث
              </p>
              <Button onClick={() => setShowWebhookDialog(true)} className="gap-2">
                <Plus className="w-4 h-4" />
                إضافة أول Webhook
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {webhooks.map((webhook) => {
            const successRate = getSuccessRate(webhook);
            const totalCalls = webhook.success_count + webhook.failure_count;

            return (
              <Card key={webhook.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <CardTitle className="text-xl">{webhook.name}</CardTitle>
                        <Badge 
                          variant={webhook.is_active ? "default" : "secondary"}
                          className={webhook.is_active ? 'bg-green-100 text-green-800' : ''}
                        >
                          {webhook.is_active ? (
                            <CheckCircle className="w-3 h-3 ml-1" />
                          ) : (
                            <AlertCircle className="w-3 h-3 ml-1" />
                          )}
                          {webhook.is_active ? "نشط" : "معطل"}
                        </Badge>
                      </div>
                      <CardDescription className="font-mono text-xs">
                        {webhook.url}
                      </CardDescription>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" aria-label="خيارات Webhook">
                          <MoreVertical className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleEditWebhook(webhook)}>
                          <Edit className="w-4 h-4 ml-2" />
                          تعديل
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => onTestWebhook(webhook.id)}>
                          <Play className="w-4 h-4 ml-2" />
                          اختبار
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => onToggleWebhook(webhook.id)}>
                          {webhook.is_active ? "تعطيل" : "تفعيل"}
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          onClick={() => onDeleteWebhook(webhook.id)}
                          className="text-red-600"
                        >
                          <Trash2 className="w-4 h-4 ml-2" />
                          حذف
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Statistics */}
                  <div className="grid grid-cols-3 gap-4">
                    <div className="space-y-1">
                      <div className="text-xs text-muted-foreground">إجمالي المحاولات</div>
                      <div className="text-2xl font-bold">{totalCalls.toLocaleString()}</div>
                    </div>
                    <div className="space-y-1">
                      <div className="text-xs text-muted-foreground">معدل النجاح</div>
                      <div className="text-2xl font-bold flex items-center gap-2">
                        {successRate}%
                        {successRate >= 95 ? (
                          <TrendingUp className="w-4 h-4 text-green-600" />
                        ) : (
                          <TrendingDown className="w-4 h-4 text-red-600" />
                        )}
                      </div>
                    </div>
                    <div className="space-y-1">
                      <div className="text-xs text-muted-foreground">الفشل</div>
                      <div className="text-2xl font-bold text-red-600">
                        {webhook.failure_count}
                      </div>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="space-y-2">
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>نجح: {webhook.success_count}</span>
                      <span>فشل: {webhook.failure_count}</span>
                    </div>
                    <Progress value={successRate} className="h-2" />
                  </div>

                  {/* Events */}
                  <div>
                    <Label className="text-sm font-medium mb-2 block">
                      الأحداث المراقبة ({webhook.events.length})
                    </Label>
                    <div className="flex flex-wrap gap-2">
                      {webhook.events.map((event) => (
                        <Badge key={event} variant="outline">
                          {availableEvents.find(e => e.id === event)?.name || event}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  {/* Secret */}
                  <div>
                    <Label className="text-sm font-medium mb-2 block">Signing Secret</Label>
                    <div className="flex gap-2">
                      <Input
                        readOnly
                        value={webhook.secret}
                        className="font-mono text-xs"
                      />
                      <Button
                        variant="outline"
                        onClick={() => copyToClipboard(webhook.secret)}
                        className="gap-2"
                      >
                        <Copy className="w-4 h-4" />
                        نسخ
                      </Button>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      استخدم هذا المفتاح للتحقق من أن الطلبات قادمة من نظامنا
                    </p>
                  </div>

                  {/* Test Button */}
                  <Button
                    variant="outline"
                    onClick={() => onTestWebhook(webhook.id)}
                    className="w-full gap-2"
                  >
                    <Play className="w-4 h-4" />
                    إرسال حدث تجريبي
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Add/Edit Webhook Dialog */}
      <Dialog open={showWebhookDialog} onOpenChange={(open) => !open && resetForm()}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Webhook className="w-5 h-5" />
              {editingWebhook ? 'تعديل Webhook' : 'إضافة Webhook جديد'}
            </DialogTitle>
            <DialogDescription>
              {editingWebhook 
                ? 'قم بتحديث بيانات الـ webhook' 
                : 'أضف webhook جديد لاستقبال إشعارات الأحداث'
              }
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            {/* Webhook Name */}
            <div className="space-y-2">
              <Label htmlFor="webhookName">الاسم *</Label>
              <Input
                id="webhookName"
                placeholder="مثال: Production Webhook"
                value={webhookName}
                onChange={(e) => setWebhookName(e.target.value)}
              />
            </div>

            {/* Webhook URL */}
            <div className="space-y-2">
              <Label htmlFor="webhookUrl">URL *</Label>
              <Input
                id="webhookUrl"
                type="url"
                placeholder="https://example.com/webhooks/udent"
                value={webhookUrl}
                onChange={(e) => setWebhookUrl(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                يجب أن يبدأ بـ https:// ويكون قادراً على استقبال طلبات POST
              </p>
            </div>

            {/* Events Selection */}
            <div className="space-y-3">
              <Label>الأحداث * ({selectedEvents.length} محدد)</Label>
              
              {Object.entries(groupedEvents).map(([category, events]) => (
                <Card key={category} className="border-2">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-semibold">{category}</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {events.map((event) => (
                      <div key={event.id} className="flex items-center gap-3">
                        <Checkbox
                          id={event.id}
                          checked={selectedEvents.includes(event.id)}
                          onCheckedChange={() => toggleEvent(event.id)}
                        />
                        <Label
                          htmlFor={event.id}
                          className="flex-1 cursor-pointer text-sm font-normal"
                        >
                          {event.name}
                        </Label>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={resetForm}>
              إلغاء
            </Button>
            <Button 
              onClick={handleSaveWebhook}
              disabled={!webhookName.trim() || !webhookUrl.trim() || selectedEvents.length === 0}
              className="gap-2"
            >
              <Webhook className="w-4 h-4" />
              {editingWebhook ? 'حفظ التغييرات' : 'إضافة Webhook'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default WebhooksTab;