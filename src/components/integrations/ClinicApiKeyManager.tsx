import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useApiKeys } from '@/hooks/useApiKeys';
import { Copy, Eye, EyeOff, Key, Plus, Trash2, ToggleLeft, ToggleRight } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { formatDistanceToNow } from 'date-fns';
import { ar } from 'date-fns/locale';

interface ClinicApiKeyManagerProps {
  clinicId: string | null;
}

export default function ClinicApiKeyManager({ clinicId }: ClinicApiKeyManagerProps) {
  const { apiKeys, loading, createApiKey, toggleApiKey, deleteApiKey } = useApiKeys(clinicId);
  const [showKeys, setShowKeys] = useState<Record<string, boolean>>({});
  const [newKeyName, setNewKeyName] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const { toast } = useToast();

  const handleCopyKey = (apiKey: string) => {
    navigator.clipboard.writeText(apiKey);
    toast({
      title: 'تم النسخ',
      description: 'تم نسخ مفتاح API إلى الحافظة',
    });
  };

  const handleCreateKey = async () => {
    if (!newKeyName.trim()) {
      toast({
        title: 'خطأ',
        description: 'الرجاء إدخال اسم للمفتاح',
        variant: 'destructive',
      });
      return;
    }

    setIsCreating(true);
    await createApiKey(newKeyName);
    setNewKeyName('');
    setIsCreating(false);
  };

  const toggleKeyVisibility = (keyId: string) => {
    setShowKeys(prev => ({ ...prev, [keyId]: !prev[keyId] }));
  };

  const maskApiKey = (key: string) => {
    return key.substring(0, 12) + '••••••••••••' + key.substring(key.length - 4);
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Key className="h-5 w-5" />
            مفاتيح API
          </CardTitle>
          <CardDescription>جاري التحميل...</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Key className="h-5 w-5" />
              مفاتيح API
            </CardTitle>
            <CardDescription>
              قم بإدارة مفاتيح API الخاصة بعيادتك للوصول إلى البيانات التحليلية
            </CardDescription>
          </div>
          <Dialog>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                إنشاء مفتاح جديد
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>إنشاء مفتاح API جديد</DialogTitle>
                <DialogDescription>
                  سيتم استخدام هذا المفتاح للوصول إلى بيانات عيادتك من خلال API
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="keyName">اسم المفتاح</Label>
                  <Input
                    id="keyName"
                    placeholder="مثال: نظام التحليلات الرئيسي"
                    value={newKeyName}
                    onChange={(e) => setNewKeyName(e.target.value)}
                  />
                </div>
                <Button
                  onClick={handleCreateKey}
                  disabled={isCreating}
                  className="w-full"
                >
                  {isCreating ? 'جاري الإنشاء...' : 'إنشاء المفتاح'}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {apiKeys.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Key className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>لا توجد مفاتيح API حالياً</p>
              <p className="text-sm">قم بإنشاء مفتاح جديد للبدء</p>
            </div>
          ) : (
            apiKeys.map((key) => (
              <div
                key={key.id}
                className="p-4 border rounded-lg space-y-3 bg-card"
              >
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <h4 className="font-medium">{key.key_name}</h4>
                      <Badge variant={key.is_active ? 'default' : 'secondary'}>
                        {key.is_active ? 'نشط' : 'معطل'}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      تم الإنشاء {formatDistanceToNow(new Date(key.created_at), { addSuffix: true, locale: ar })}
                    </p>
                    {key.last_used_at && (
                      <p className="text-sm text-muted-foreground">
                        آخر استخدام {formatDistanceToNow(new Date(key.last_used_at), { addSuffix: true, locale: ar })}
                      </p>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => toggleApiKey(key.id, !key.is_active)}
                      title={key.is_active ? 'إيقاف المفتاح' : 'تفعيل المفتاح'}
                    >
                      {key.is_active ? (
                        <ToggleRight className="h-4 w-4" />
                      ) : (
                        <ToggleLeft className="h-4 w-4" />
                      )}
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => deleteApiKey(key.id)}
                      title="حذف المفتاح"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <code className="flex-1 px-3 py-2 bg-muted rounded text-sm font-mono">
                    {showKeys[key.id] ? key.api_key : maskApiKey(key.api_key)}
                  </code>
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => toggleKeyVisibility(key.id)}
                    title={showKeys[key.id] ? 'إخفاء المفتاح' : 'إظهار المفتاح'}
                  >
                    {showKeys[key.id] ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => handleCopyKey(key.api_key)}
                    title="نسخ المفتاح"
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}
