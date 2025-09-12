import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Enhanced3DToothViewer } from './Enhanced3DToothViewer';
import { FullScreenToothEditor } from './FullScreenToothEditor';
import { Maximize2, Eye, Settings, Save, X } from 'lucide-react';
import { toast } from 'sonner';

interface Advanced3DToothEditorModalProps {
  isOpen: boolean;
  onClose: () => void;
  toothNumber: string;
  patientId: string;
  numberingSystem?: string;
  onSave?: (data: any) => void;
}

export const Advanced3DToothEditorModal: React.FC<Advanced3DToothEditorModalProps> = ({
  isOpen,
  onClose,
  toothNumber,
  patientId,
  numberingSystem = 'universal',
  onSave
}) => {
  const [activeTab, setActiveTab] = useState<'viewer' | 'editor'>('viewer');

  const handleSave = (data: any) => {
    onSave?.(data);
    toast.success('تم حفظ التعديلات بنجاح');
  };

  const openFullScreenEditor = () => {
    // فتح المحرر في نافذة جديدة بملء الشاشة
    const url = `/advanced-tooth-editor/${patientId}/${toothNumber}`;
    const popup = window.open(url, '_blank', 'fullscreen=yes,scrollbars=yes');
    if (popup) {
      popup.focus();
    } else {
      // إذا فشل فتح النافذة المنبثقة، الانتقال مباشرة
      window.open(url, '_blank');
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-7xl h-[95vh] flex flex-col">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle className="flex items-center gap-2">
                محرر الأسنان المتطور - السن {toothNumber}
                <Badge variant="secondary">{numberingSystem}</Badge>
              </DialogTitle>
              <DialogDescription>
                عرض وتحرير النموذج ثلاثي الأبعاد مع إمكانيات متقدمة
              </DialogDescription>
            </div>
            
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={openFullScreenEditor}
                className="bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:from-blue-700 hover:to-purple-700"
              >
                <Maximize2 className="h-4 w-4 ml-2" />
                ملء الشاشة
              </Button>
              
              <Button variant="ghost" size="sm" onClick={onClose}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </DialogHeader>
        
        <div className="flex-1 flex flex-col overflow-hidden">
          <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as 'viewer' | 'editor')} className="flex-1 flex flex-col">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="viewer" className="flex items-center gap-2">
                <Eye className="h-4 w-4" />
                عارض سريع
              </TabsTrigger>
              <TabsTrigger value="editor" className="flex items-center gap-2">
                <Settings className="h-4 w-4" />
                محرر متقدم
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="viewer" className="flex-1 overflow-hidden">
              <div className="h-full">
                <Enhanced3DToothViewer
                  toothNumber={toothNumber}
                  patientId={patientId}
                  numberingSystem={numberingSystem}
                  onSave={handleSave}
                  editable={true}
                />
              </div>
            </TabsContent>
            
            <TabsContent value="editor" className="flex-1 overflow-hidden">
              <div className="h-full bg-gradient-to-br from-slate-900 to-slate-800 rounded-lg overflow-hidden">
                <FullScreenToothEditor
                  toothNumber={toothNumber}
                  patientId={patientId}
                  numberingSystem={numberingSystem}
                  onSave={handleSave}
                  onClose={() => setActiveTab('viewer')}
                />
              </div>
            </TabsContent>
          </Tabs>
        </div>
        
        <div className="flex items-center justify-between pt-4 border-t">
          <div className="text-sm text-muted-foreground">
            استخدم التبويبات أعلاه للتنقل بين العارض والمحرر
          </div>
          
          <div className="flex gap-2">
            <Button variant="outline" onClick={onClose}>
              إلغاء
            </Button>
            <Button onClick={() => handleSave({})}>
              <Save className="h-4 w-4 ml-2" />
              حفظ
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};