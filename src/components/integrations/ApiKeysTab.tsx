import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  Key, 
  Copy, 
  Eye, 
  EyeOff, 
  Plus, 
  Trash2, 
  MoreVertical,
  AlertCircle,
  CheckCircle,
  Shield
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

interface ApiKey {
  id: string;
  name: string;
  key: string;
  permissions: string[];
  is_active: boolean;
  last_used?: string;
  created_at: string;
}

interface ApiKeysTabProps {
  apiKeys: ApiKey[];
  onGenerateKey: (name: string, permissions: string[]) => void;
  onToggleKey: (id: string) => void;
  onDeleteKey: (id: string) => void;
  onCopyKey: (key: string) => void;
}

const ApiKeysTab: React.FC<ApiKeysTabProps> = ({
  apiKeys,
  onGenerateKey,
  onToggleKey,
  onDeleteKey,
  onCopyKey
}) => {
  const [showNewKeyDialog, setShowNewKeyDialog] = useState(false);
  const [newKeyName, setNewKeyName] = useState('');
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>([]);
  const [visibleKeys, setVisibleKeys] = useState<Set<string>>(new Set());

  const availablePermissions = [
    { id: 'patients.read', name: 'قراءة بيانات المرضى', category: 'المرضى' },
    { id: 'patients.write', name: 'تعديل بيانات المرضى', category: 'المرضى' },
    { id: 'patients.delete', name: 'حذف المرضى', category: 'المرضى' },
    { id: 'appointments.read', name: 'قراءة المواعيد', category: 'المواعيد' },
    { id: 'appointments.write', name: 'إدارة المواعيد', category: 'المواعيد' },
    { id: 'treatments.read', name: 'قراءة العلاجات', category: 'العلاجات' },
    { id: 'treatments.write', name: 'تسجيل العلاجات', category: 'العلاجات' },
    { id: 'invoices.read', name: 'قراءة الفواتير', category: 'المالية' },
    { id: 'invoices.write', name: 'إصدار الفواتير', category: 'المالية' },
    { id: 'reports.read', name: 'عرض التقارير', category: 'التقارير' },
  ];

  const handleCreateKey = () => {
    if (!newKeyName.trim() || selectedPermissions.length === 0) {
      return;
    }
    onGenerateKey(newKeyName, selectedPermissions);
    setNewKeyName('');
    setSelectedPermissions([]);
    setShowNewKeyDialog(false);
  };

  const toggleKeyVisibility = (keyId: string) => {
    const newVisible = new Set(visibleKeys);
    if (newVisible.has(keyId)) {
      newVisible.delete(keyId);
    } else {
      newVisible.add(keyId);
    }
    setVisibleKeys(newVisible);
  };

  const togglePermission = (permissionId: string) => {
    setSelectedPermissions(prev => 
      prev.includes(permissionId) 
        ? prev.filter(p => p !== permissionId)
        : [...prev, permissionId]
    );
  };

  const groupedPermissions = availablePermissions.reduce((acc, perm) => {
    if (!acc[perm.category]) {
      acc[perm.category] = [];
    }
    acc[perm.category].push(perm);
    return acc;
  }, {} as Record<string, typeof availablePermissions>);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-2xl font-bold">API Keys</h3>
          <p className="text-muted-foreground mt-1">
            إدارة مفاتيح API للوصول إلى النظام
          </p>
        </div>
        <Button onClick={() => setShowNewKeyDialog(true)} className="gap-2">
          <Plus className="w-4 h-4" />
          إنشاء مفتاح جديد
        </Button>
      </div>

      {/* Security Notice */}
      <Card className="border-yellow-200 bg-yellow-50">
        <CardContent className="pt-6">
          <div className="flex gap-3">
            <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
            <div>
              <div className="font-semibold text-yellow-900 mb-1">تنبيه أمني مهم</div>
              <p className="text-sm text-yellow-800">
                احفظ مفتاح API في مكان آمن فور إنشائه. لن تتمكن من رؤيته مرة أخرى بعد إغلاق هذه الصفحة.
                لا تشارك المفتاح مع أحد ولا تقم بنشره في الأماكن العامة.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* API Keys List */}
      {apiKeys.length === 0 ? (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-12">
              <Key className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">لا توجد مفاتيح API</h3>
              <p className="text-sm text-muted-foreground mb-6">
                ابدأ بإنشاء أول مفتاح API للوصول إلى واجهة البرمجة
              </p>
              <Button onClick={() => setShowNewKeyDialog(true)} className="gap-2">
                <Plus className="w-4 h-4" />
                إنشاء أول مفتاح
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {apiKeys.map((apiKey) => (
            <Card key={apiKey.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <CardTitle className="text-xl">{apiKey.name}</CardTitle>
                      <Badge 
                        variant={apiKey.is_active ? "default" : "secondary"}
                        className={apiKey.is_active ? 'bg-green-100 text-green-800' : ''}
                      >
                        {apiKey.is_active ? (
                          <CheckCircle className="w-3 h-3 ml-1" />
                        ) : (
                          <AlertCircle className="w-3 h-3 ml-1" />
                        )}
                        {apiKey.is_active ? "نشط" : "معطل"}
                      </Badge>
                    </div>
                    <CardDescription>
                      تم الإنشاء: {new Date(apiKey.created_at).toLocaleDateString('ar-SA')}
                      {apiKey.last_used && ` • آخر استخدام: ${new Date(apiKey.last_used).toLocaleDateString('ar-SA')}`}
                    </CardDescription>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <MoreVertical className="w-4 h-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => onToggleKey(apiKey.id)}>
                        {apiKey.is_active ? "تعطيل" : "تفعيل"}
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        onClick={() => onDeleteKey(apiKey.id)}
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
                {/* API Key Display */}
                <div>
                  <Label className="text-sm font-medium mb-2 block">مفتاح API</Label>
                  <div className="flex gap-2">
                    <div className="flex-1 relative">
                      <Input
                        readOnly
                        value={visibleKeys.has(apiKey.id) ? apiKey.key : '••••••••••••••••••••••••••••••••'}
                        className="font-mono text-sm pr-10"
                      />
                      <Button
                        variant="ghost"
                        size="icon"
                        className="absolute left-1 top-1/2 -translate-y-1/2"
                        onClick={() => toggleKeyVisibility(apiKey.id)}
                      >
                        {visibleKeys.has(apiKey.id) ? (
                          <EyeOff className="w-4 h-4" />
                        ) : (
                          <Eye className="w-4 h-4" />
                        )}
                      </Button>
                    </div>
                    <Button
                      variant="outline"
                      onClick={() => onCopyKey(apiKey.key)}
                      className="gap-2"
                    >
                      <Copy className="w-4 h-4" />
                      نسخ
                    </Button>
                  </div>
                </div>

                {/* Permissions */}
                <div>
                  <Label className="text-sm font-medium mb-2 flex items-center gap-2">
                    <Shield className="w-4 h-4" />
                    الصلاحيات ({apiKey.permissions.length})
                  </Label>
                  <div className="flex flex-wrap gap-2">
                    {apiKey.permissions.map((permission) => (
                      <Badge key={permission} variant="outline" className="gap-1">
                        {availablePermissions.find(p => p.id === permission)?.name || permission}
                      </Badge>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Create New Key Dialog */}
      <Dialog open={showNewKeyDialog} onOpenChange={setShowNewKeyDialog}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Key className="w-5 h-5" />
              إنشاء مفتاح API جديد
            </DialogTitle>
            <DialogDescription>
              أنشئ مفتاح API جديد وحدد الصلاحيات المطلوبة للوصول إلى النظام
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            {/* Key Name */}
            <div className="space-y-2">
              <Label htmlFor="keyName">اسم المفتاح *</Label>
              <Input
                id="keyName"
                placeholder="مثال: Integration Key for Mobile App"
                value={newKeyName}
                onChange={(e) => setNewKeyName(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                استخدم اسماً واضحاً يساعدك على تحديد استخدام المفتاح
              </p>
            </div>

            {/* Permissions Selection */}
            <div className="space-y-3">
              <Label className="flex items-center gap-2">
                <Shield className="w-4 h-4" />
                الصلاحيات * ({selectedPermissions.length} محدد)
              </Label>
              
              {Object.entries(groupedPermissions).map(([category, permissions]) => (
                <Card key={category} className="border-2">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-semibold">{category}</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {permissions.map((permission) => (
                      <div key={permission.id} className="flex items-center gap-3">
                        <Checkbox
                          id={permission.id}
                          checked={selectedPermissions.includes(permission.id)}
                          onCheckedChange={() => togglePermission(permission.id)}
                        />
                        <Label
                          htmlFor={permission.id}
                          className="flex-1 cursor-pointer text-sm font-normal"
                        >
                          {permission.name}
                        </Label>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              ))}

              {selectedPermissions.length === 0 && (
                <p className="text-sm text-muted-foreground">
                  يجب تحديد صلاحية واحدة على الأقل
                </p>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowNewKeyDialog(false)}>
              إلغاء
            </Button>
            <Button 
              onClick={handleCreateKey}
              disabled={!newKeyName.trim() || selectedPermissions.length === 0}
              className="gap-2"
            >
              <Key className="w-4 h-4" />
              إنشاء المفتاح
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ApiKeysTab;