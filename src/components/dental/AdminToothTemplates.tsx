import React, { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  Upload, 
  Image as ImageIcon, 
  Trash2, 
  Edit, 
  Save, 
  Eye,
  Download,
  RefreshCw,
  Crown,
  Settings,
  Database,
  CheckCircle,
  XCircle,
  FileImage
} from "lucide-react";
import { cn } from "@/lib/utils";
import { 
  ToothTemplate,
  ToothType,
  AnatomicalPosition,
  ANATOMICAL_POSITIONS
} from "@/types/anatomical-dental";

interface AdminToothTemplatesProps {
  onTemplateUpdate?: (templates: Map<string, ToothTemplate>) => void;
}

export const AdminToothTemplates: React.FC<AdminToothTemplatesProps> = ({
  onTemplateUpdate
}) => {
  // حالات إدارة الأشكال
  const [templates, setTemplates] = useState<Map<string, ToothTemplate>>(new Map());
  const [selectedTemplate, setSelectedTemplate] = useState<ToothTemplate | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [isUploading, setIsUploading] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  
  // حالات التصفية
  const [filterType, setFilterType] = useState<ToothType | 'all'>('all');
  const [filterJaw, setFilterJaw] = useState<'upper' | 'lower' | 'all'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  
  // مراجع النماذج
  const fileInputRef = useRef<HTMLInputElement>(null);
  const formRef = useRef<HTMLFormElement>(null);
  
  // بيانات النموذج
  const [formData, setFormData] = useState({
    toothNumber: '',
    name: '',
    description: '',
    type: ToothType.INCISOR,
    imageUrl: '',
    isDefault: false
  });

  // تحميل الأشكال المحفوظة
  useEffect(() => {
    loadExistingTemplates();
  }, []);

  const loadExistingTemplates = async () => {
    // محاكاة تحميل الأشكال من قاعدة البيانات
    try {
      // في التطبيق الحقيقي، سيكون استدعاء API
      const mockTemplates = new Map<string, ToothTemplate>();
      
      // إضافة بعض الأشكال التجريبية
      Object.values(ANATOMICAL_POSITIONS).slice(0, 3).forEach((position) => {
        const template: ToothTemplate = {
          id: `template-${position.toothNumber}`,
          toothNumber: position.toothNumber,
          name: `شكل السن ${position.toothNumber}`,
          description: `الشكل الأساسي للسن رقم ${position.toothNumber}`,
          type: position.type,
          imageUrl: '', // سيتم رفع الصور
          isDefault: true,
          createdAt: new Date(),
          updatedAt: new Date()
        };
        mockTemplates.set(position.toothNumber, template);
      });
      
      setTemplates(mockTemplates);
      onTemplateUpdate?.(mockTemplates);
    } catch (error) {
      console.error('خطأ في تحميل الأشكال:', error);
    }
  };

  // رفع صورة جديدة
  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setUploadProgress(0);

    const reader = new FileReader();
    reader.onload = (e) => {
      const imageUrl = e.target?.result as string;
      setFormData(prev => ({ ...prev, imageUrl }));
      setIsUploading(false);
      setUploadProgress(100);
      
      setTimeout(() => setUploadProgress(0), 2000);
    };

    reader.onprogress = (e) => {
      if (e.lengthComputable) {
        const progress = (e.loaded / e.total) * 100;
        setUploadProgress(progress);
      }
    };

    reader.readAsDataURL(file);
  };

  // حفظ الشكل
  const handleSaveTemplate = async () => {
    if (!formData.toothNumber || !formData.name) {
      setSaveStatus('error');
      return;
    }

    setSaveStatus('saving');

    try {
      const template: ToothTemplate = {
        id: selectedTemplate?.id || `template-${formData.toothNumber}-${Date.now()}`,
        toothNumber: formData.toothNumber,
        name: formData.name,
        description: formData.description,
        type: formData.type,
        imageUrl: formData.imageUrl,
        isDefault: formData.isDefault,
        createdAt: selectedTemplate?.createdAt || new Date(),
        updatedAt: new Date()
      };

      const newTemplates = new Map(templates);
      newTemplates.set(formData.toothNumber, template);
      
      setTemplates(newTemplates);
      onTemplateUpdate?.(newTemplates);
      
      setSaveStatus('saved');
      setIsEditing(false);
      resetForm();
      
      setTimeout(() => setSaveStatus('idle'), 3000);
    } catch (error) {
      console.error('خطأ في حفظ الشكل:', error);
      setSaveStatus('error');
    }
  };

  // حذف شكل
  const handleDeleteTemplate = (toothNumber: string) => {
    if (window.confirm('هل أنت متأكد من حذف هذا الشكل؟')) {
      const newTemplates = new Map(templates);
      newTemplates.delete(toothNumber);
      setTemplates(newTemplates);
      onTemplateUpdate?.(newTemplates);
    }
  };

  // تحرير شكل
  const handleEditTemplate = (template: ToothTemplate) => {
    setSelectedTemplate(template);
    setFormData({
      toothNumber: template.toothNumber,
      name: template.name,
      description: template.description,
      type: template.type,
      imageUrl: template.imageUrl,
      isDefault: template.isDefault
    });
    setIsEditing(true);
  };

  // إعادة تعيين النموذج
  const resetForm = () => {
    setFormData({
      toothNumber: '',
      name: '',
      description: '',
      type: ToothType.INCISOR,
      imageUrl: '',
      isDefault: false
    });
    setSelectedTemplate(null);
    setIsEditing(false);
  };

  // تصفية الأشكال
  const filteredTemplates = Array.from(templates.values()).filter(template => {
    const matchesType = filterType === 'all' || template.type === filterType;
    const matchesJaw = filterJaw === 'all' || 
      (filterJaw === 'upper' && parseInt(template.toothNumber) <= 16) ||
      (filterJaw === 'lower' && parseInt(template.toothNumber) > 16);
    const matchesSearch = template.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      template.toothNumber.includes(searchTerm);
    
    return matchesType && matchesJaw && matchesSearch;
  });

  // الحصول على معلومات الإحصائيات
  const stats = {
    total: templates.size,
    byType: {
      incisors: Array.from(templates.values()).filter(t => t.type === ToothType.INCISOR).length,
      canines: Array.from(templates.values()).filter(t => t.type === ToothType.CANINE).length,
      premolars: Array.from(templates.values()).filter(t => t.type === ToothType.PREMOLAR).length,
      molars: Array.from(templates.values()).filter(t => t.type === ToothType.MOLAR).length
    },
    withImages: Array.from(templates.values()).filter(t => t.imageUrl).length
  };

  return (
    <div className="w-full max-w-7xl mx-auto p-6 space-y-6">
      {/* 👑 رأس صفحة الإدارة */}
      <Card className="bg-gradient-to-r from-purple-50 via-indigo-50 to-blue-50 dark:from-purple-900/20 dark:via-indigo-900/20 dark:to-blue-900/20 border-2 border-purple-200 dark:border-purple-700">
        <CardHeader>
          <CardTitle className="text-3xl font-bold text-center flex items-center justify-center gap-4">
            <Crown className="w-8 h-8 text-purple-600 animate-pulse" />
            🔧 إدارة أشكال الأسنان الأساسية
            <Settings className="w-8 h-8 text-indigo-600 animate-spin-slow" />
          </CardTitle>
          
          <div className="text-center text-gray-600 dark:text-gray-400 mt-2">
            إدارة الأشكال الأساسية للأسنان التي ستُستخدم كقوالب في النظام
          </div>
        </CardHeader>
      </Card>

      {/* 📊 إحصائيات سريعة */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-blue-600">{stats.total}</div>
            <div className="text-sm text-gray-600">إجمالي الأشكال</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-green-600">{stats.byType.incisors}</div>
            <div className="text-sm text-gray-600">قواطع</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-yellow-600">{stats.byType.canines}</div>
            <div className="text-sm text-gray-600">أنياب</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-orange-600">{stats.byType.premolars}</div>
            <div className="text-sm text-gray-600">ضواحك</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-red-600">{stats.byType.molars}</div>
            <div className="text-sm text-gray-600">طواحن</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 📝 نموذج إضافة/تحرير الأشكال */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileImage className="w-5 h-5" />
              {isEditing ? 'تحرير الشكل' : 'إضافة شكل جديد'}
            </CardTitle>
          </CardHeader>
          
          <CardContent className="space-y-4">
            <form ref={formRef} className="space-y-4">
              {/* رقم السن */}
              <div>
                <Label htmlFor="toothNumber">رقم السن</Label>
                <Input
                  id="toothNumber"
                  value={formData.toothNumber}
                  onChange={(e) => setFormData(prev => ({ ...prev, toothNumber: e.target.value }))}
                  placeholder="11, 12, 21, إلخ..."
                  disabled={isEditing}
                />
              </div>

              {/* اسم الشكل */}
              <div>
                <Label htmlFor="templateName">اسم الشكل</Label>
                <Input
                  id="templateName"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="مثال: قاطع علوي أيمن"
                />
              </div>

              {/* نوع السن */}
              <div>
                <Label htmlFor="toothType">نوع السن</Label>
                <select
                  id="toothType"
                  value={formData.type}
                  onChange={(e) => setFormData(prev => ({ ...prev, type: e.target.value as ToothType }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value={ToothType.INCISOR}>قاطع</option>
                  <option value={ToothType.CANINE}>ناب</option>
                  <option value={ToothType.PREMOLAR}>ضاحك</option>
                  <option value={ToothType.MOLAR}>طاحن</option>
                </select>
              </div>

              {/* الوصف */}
              <div>
                <Label htmlFor="description">الوصف</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="وصف مختصر للشكل..."
                  rows={3}
                />
              </div>

              {/* رفع الصورة */}
              <div>
                <Label>صورة الشكل</Label>
                <div className="space-y-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full"
                    disabled={isUploading}
                  >
                    <Upload className="w-4 h-4 mr-2" />
                    {isUploading ? 'جاري الرفع...' : 'رفع صورة'}
                  </Button>
                  
                  {uploadProgress > 0 && uploadProgress < 100 && (
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${uploadProgress}%` }}
                      ></div>
                    </div>
                  )}
                  
                  {formData.imageUrl && (
                    <div className="relative">
                      <img
                        src={formData.imageUrl}
                        alt="معاينة الشكل"
                        className="w-full h-32 object-cover rounded-md border"
                      />
                      <Button
                        type="button"
                        variant="destructive"
                        size="sm"
                        onClick={() => setFormData(prev => ({ ...prev, imageUrl: '' }))}
                        className="absolute top-2 right-2"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  )}
                </div>
              </div>

              {/* أزرار التحكم */}
              <div className="flex gap-2">
                <Button
                  type="button"
                  onClick={handleSaveTemplate}
                  disabled={saveStatus === 'saving'}
                  className="flex-1"
                >
                  {saveStatus === 'saving' ? (
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Save className="w-4 h-4 mr-2" />
                  )}
                  {saveStatus === 'saving' ? 'جاري الحفظ...' : 'حفظ الشكل'}
                </Button>
                
                {isEditing && (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={resetForm}
                  >
                    إلغاء
                  </Button>
                )}
              </div>

              {/* حالة الحفظ */}
              {saveStatus === 'saved' && (
                <Alert>
                  <CheckCircle className="h-4 w-4" />
                  <AlertDescription>
                    تم حفظ الشكل بنجاح!
                  </AlertDescription>
                </Alert>
              )}
              
              {saveStatus === 'error' && (
                <Alert variant="destructive">
                  <XCircle className="h-4 w-4" />
                  <AlertDescription>
                    حدث خطأ في حفظ الشكل. تأكد من ملء جميع الحقول المطلوبة.
                  </AlertDescription>
                </Alert>
              )}
            </form>
          </CardContent>
        </Card>

        {/* 📋 قائمة الأشكال الموجودة */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="w-5 h-5" />
              الأشكال الموجودة ({filteredTemplates.length})
            </CardTitle>
            
            {/* أدوات التصفية */}
            <div className="flex flex-wrap gap-2 mt-4">
              <Input
                placeholder="بحث بالاسم أو الرقم..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="max-w-xs"
              />
              
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value as ToothType | 'all')}
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">جميع الأنواع</option>
                <option value={ToothType.INCISOR}>قواطع</option>
                <option value={ToothType.CANINE}>أنياب</option>
                <option value={ToothType.PREMOLAR}>ضواحك</option>
                <option value={ToothType.MOLAR}>طواحن</option>
              </select>
              
              <select
                value={filterJaw}
                onChange={(e) => setFilterJaw(e.target.value as 'upper' | 'lower' | 'all')}
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">جميع الفكين</option>
                <option value="upper">الفك العلوي</option>
                <option value="lower">الفك السفلي</option>
              </select>
            </div>
          </CardHeader>
          
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-96 overflow-y-auto">
              {filteredTemplates.map((template) => (
                <Card key={template.id} className="relative">
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      {/* صورة الشكل */}
                      <div className="flex-shrink-0">
                        {template.imageUrl ? (
                          <img
                            src={template.imageUrl}
                            alt={template.name}
                            className="w-16 h-16 object-cover rounded-md border"
                          />
                        ) : (
                          <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-md border flex items-center justify-center">
                            <ImageIcon className="w-6 h-6 text-gray-400" />
                          </div>
                        )}
                      </div>
                      
                      {/* معلومات الشكل */}
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-sm truncate">{template.name}</h4>
                        <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                          السن رقم: {template.toothNumber}
                        </p>
                        <Badge variant="secondary" className="text-xs mt-1">
                          {template.type === ToothType.INCISOR && 'قاطع'}
                          {template.type === ToothType.CANINE && 'ناب'}
                          {template.type === ToothType.PREMOLAR && 'ضاحك'}
                          {template.type === ToothType.MOLAR && 'طاحن'}
                        </Badge>
                        
                        {template.isDefault && (
                          <Badge variant="default" className="text-xs mt-1 mr-1">
                            افتراضي
                          </Badge>
                        )}
                      </div>
                      
                      {/* أزرار التحكم */}
                      <div className="flex flex-col gap-1">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleEditTemplate(template)}
                        >
                          <Edit className="w-3 h-3" />
                        </Button>
                        
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => handleDeleteTemplate(template.toothNumber)}
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>
                    
                    {template.description && (
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-2 truncate">
                        {template.description}
                      </p>
                    )}
                  </CardContent>
                </Card>
              ))}
              
              {filteredTemplates.length === 0 && (
                <div className="col-span-2 text-center py-8 text-gray-500">
                  لا توجد أشكال مطابقة للبحث
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* مرجع رفع الملفات المخفي */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleImageUpload}
        className="hidden"
        title="رفع صورة الشكل"
        aria-label="رفع صورة الشكل"
      />
    </div>
  );
};
