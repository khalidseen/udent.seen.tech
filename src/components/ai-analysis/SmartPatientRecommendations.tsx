import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Users, 
  Calendar, 
  CheckCircle2,
  Clock,
  AlertTriangle,
  Phone,
  MessageSquare,
  Filter,
  Bell,
  Send,
  Heart
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { 
  predictiveAnalyticsService, 
  PatientRecommendation 
} from "@/utils/predictiveAnalytics";
import { format } from "date-fns";

export function SmartPatientRecommendations() {
  const [recommendations, setRecommendations] = useState<PatientRecommendation[]>([]);
  const [filteredRecommendations, setFilteredRecommendations] = useState<PatientRecommendation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [priorityFilter, setPriorityFilter] = useState<string>("all");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [selectedRecommendations, setSelectedRecommendations] = useState<Set<string>>(new Set());
  const { toast } = useToast();

  // تحميل التوصيات
  const loadRecommendations = async () => {
    setIsLoading(true);
    try {
      const { data: profile } = await supabase
        .from('profiles')
        .select('id')
        .eq('user_id', (await supabase.auth.getUser()).data.user?.id)
        .single();

      if (!profile) return;

      const data = await predictiveAnalyticsService.generatePatientRecommendations(profile.id);
      setRecommendations(data);
      setFilteredRecommendations(data);
    } catch (error) {
      console.error('Error loading recommendations:', error);
      toast({
        title: "خطأ في التحميل",
        description: "حدث خطأ أثناء تحميل التوصيات",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // تطبيق الفلاتر
  useEffect(() => {
    let filtered = recommendations;

    if (searchTerm) {
      filtered = filtered.filter(rec => 
        rec.patientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        rec.title.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (priorityFilter !== "all") {
      filtered = filtered.filter(rec => rec.priority === priorityFilter);
    }

    if (typeFilter !== "all") {
      filtered = filtered.filter(rec => rec.type === typeFilter);
    }

    setFilteredRecommendations(filtered);
  }, [recommendations, searchTerm, priorityFilter, typeFilter]);

  useEffect(() => {
    loadRecommendations();
  }, []);

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'bg-red-100 text-red-800 border-red-200';
      case 'high': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'cleaning': return <Calendar className="w-4 h-4 text-blue-600" />;
      case 'checkup': return <CheckCircle2 className="w-4 h-4 text-green-600" />;
      case 'treatment_followup': return <Clock className="w-4 h-4 text-orange-600" />;
      case 'prevention': return <Heart className="w-4 h-4 text-purple-600" />;
      default: return <Calendar className="w-4 h-4 text-gray-600" />;
    }
  };

  const getTypeText = (type: string) => {
    switch (type) {
      case 'cleaning': return 'تنظيف';
      case 'checkup': return 'فحص';
      case 'treatment_followup': return 'متابعة';
      case 'prevention': return 'وقاية';
      default: return 'عام';
    }
  };

  const getPriorityText = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'عاجل';
      case 'high': return 'عالي';
      case 'medium': return 'متوسط';
      case 'low': return 'منخفض';
      default: return 'غير محدد';
    }
  };

  // إرسال رسائل التذكير
  const sendReminders = async () => {
    if (selectedRecommendations.size === 0) {
      toast({
        title: "لم يتم اختيار توصيات",
        description: "يرجى اختيار التوصيات التي تريد إرسال تذكير لها",
        variant: "destructive",
      });
      return;
    }

    try {
      const selectedRecs = filteredRecommendations.filter(rec => 
        selectedRecommendations.has(`${rec.patientId}-${rec.type}`)
      );

      // هنا يمكن إضافة منطق إرسال الرسائل الفعلي
      // مثل إرسال SMS أو WhatsApp أو إشعارات داخل التطبيق
      
      // محاكاة إرسال الرسائل
      await new Promise(resolve => setTimeout(resolve, 1000));

      toast({
        title: "تم إرسال التذكيرات",
        description: `تم إرسال ${selectedRecs.length} تذكير بنجاح`,
      });

      setSelectedRecommendations(new Set());
    } catch (error) {
      toast({
        title: "خطأ في الإرسال",
        description: "حدث خطأ أثناء إرسال التذكيرات",
        variant: "destructive",
      });
    }
  };

  // إنشاء إشعارات
  const createNotifications = async () => {
    if (selectedRecommendations.size === 0) {
      toast({
        title: "لم يتم اختيار توصيات",
        description: "يرجى اختيار التوصيات التي تريد إنشاء إشعارات لها",
        variant: "destructive",
      });
      return;
    }

    try {
      const { data: profile } = await supabase
        .from('profiles')
        .select('id')
        .eq('user_id', (await supabase.auth.getUser()).data.user?.id)
        .single();

      if (!profile) return;

      const selectedRecs = filteredRecommendations.filter(rec => 
        selectedRecommendations.has(`${rec.patientId}-${rec.type}`)
      );

      // إنشاء إشعارات في قاعدة البيانات
      const notifications = selectedRecs.map(rec => ({
        clinic_id: profile.id,
        patient_id: rec.patientId,
        title: rec.title,
        message: rec.customMessage,
        type: 'patient_reminder',
        priority: rec.priority === 'urgent' ? 'urgent' : rec.priority === 'high' ? 'high' : 'medium',
        scheduled_for: new Date(rec.dueDate).toISOString(),
        related_type: 'patient_care',
        auto_generated: true
      }));

      const { error } = await supabase
        .from('notifications')
        .insert(notifications);

      if (error) throw error;

      toast({
        title: "تم إنشاء الإشعارات",
        description: `تم إنشاء ${notifications.length} إشعار بنجاح`,
      });

      setSelectedRecommendations(new Set());
    } catch (error) {
      console.error('Error creating notifications:', error);
      toast({
        title: "خطأ في الإنشاء",
        description: "حدث خطأ أثناء إنشاء الإشعارات",
        variant: "destructive",
      });
    }
  };

  const toggleSelection = (id: string) => {
    const newSelected = new Set(selectedRecommendations);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedRecommendations(newSelected);
  };

  const selectAll = () => {
    if (selectedRecommendations.size === filteredRecommendations.length) {
      setSelectedRecommendations(new Set());
    } else {
      const newSelected = new Set(
        filteredRecommendations.map(rec => `${rec.patientId}-${rec.type}`)
      );
      setSelectedRecommendations(newSelected);
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center space-y-4">
            <Clock className="w-8 h-8 text-primary mx-auto animate-spin" />
            <p className="text-muted-foreground">جاري تحميل التوصيات الذكية...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* إحصائيات سريعة */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-red-600" />
              <div>
                <div className="text-2xl font-bold text-red-600">
                  {recommendations.filter(r => r.priority === 'urgent').length}
                </div>
                <p className="text-xs text-muted-foreground">عاجل</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-blue-600" />
              <div>
                <div className="text-2xl font-bold text-blue-600">
                  {recommendations.filter(r => r.type === 'cleaning').length}
                </div>
                <p className="text-xs text-muted-foreground">تنظيف</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-green-600" />
              <div>
                <div className="text-2xl font-bold text-green-600">
                  {recommendations.filter(r => r.type === 'checkup').length}
                </div>
                <p className="text-xs text-muted-foreground">فحص</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-purple-600" />
              <div>
                <div className="text-2xl font-bold text-purple-600">
                  {recommendations.length}
                </div>
                <p className="text-xs text-muted-foreground">إجمالي</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* أدوات التحكم */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="w-5 h-5" />
            التوصيات الذكية للمرضى
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* الفلاتر */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <Input
                placeholder="البحث في التوصيات..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full"
              />
            </div>
            <Select value={priorityFilter} onValueChange={setPriorityFilter}>
              <SelectTrigger>
                <SelectValue placeholder="الأولوية" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">جميع الأولويات</SelectItem>
                <SelectItem value="urgent">عاجل</SelectItem>
                <SelectItem value="high">عالي</SelectItem>
                <SelectItem value="medium">متوسط</SelectItem>
                <SelectItem value="low">منخفض</SelectItem>
              </SelectContent>
            </Select>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger>
                <SelectValue placeholder="النوع" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">جميع الأنواع</SelectItem>
                <SelectItem value="cleaning">تنظيف</SelectItem>
                <SelectItem value="checkup">فحص</SelectItem>
                <SelectItem value="treatment_followup">متابعة</SelectItem>
                <SelectItem value="prevention">وقاية</SelectItem>
              </SelectContent>
            </Select>
            <Button onClick={loadRecommendations} variant="outline">
              <Filter className="w-4 h-4 ml-2" />
              تحديث
            </Button>
          </div>

          {/* أدوات الإجراءات */}
          {filteredRecommendations.length > 0 && (
            <div className="flex items-center gap-2 p-4 bg-muted/50 rounded-lg">
              <Button
                onClick={selectAll}
                variant="outline"
                size="sm"
              >
                {selectedRecommendations.size === filteredRecommendations.length ? 
                  'إلغاء تحديد الكل' : 'تحديد الكل'}
              </Button>
              
              {selectedRecommendations.size > 0 && (
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">
                    {selectedRecommendations.size} محدد
                  </span>
                  <Button onClick={createNotifications} size="sm">
                    <Bell className="w-4 h-4 ml-2" />
                    إنشاء إشعارات
                  </Button>
                  <Button onClick={sendReminders} size="sm" variant="outline">
                    <Send className="w-4 h-4 ml-2" />
                    إرسال تذكيرات
                  </Button>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* قائمة التوصيات */}
      {filteredRecommendations.length > 0 ? (
        <div className="space-y-4">
          {filteredRecommendations.map((recommendation) => {
            const id = `${recommendation.patientId}-${recommendation.type}`;
            const isSelected = selectedRecommendations.has(id);
            
            return (
              <Card key={id} className={`transition-all ${isSelected ? 'ring-2 ring-primary' : 'hover:shadow-md'}`}>
                <CardContent className="pt-4">
                  <div className="flex items-start gap-4">
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => toggleSelection(id)}
                      className="mt-1"
                    />
                    
                    <div className="flex-1 space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          {getTypeIcon(recommendation.type)}
                          <div>
                            <h4 className="font-medium">{recommendation.patientName}</h4>
                            <p className="text-sm font-medium text-primary">{recommendation.title}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge className={getPriorityColor(recommendation.priority)}>
                            {getPriorityText(recommendation.priority)}
                          </Badge>
                          <Badge variant="outline">
                            {getTypeText(recommendation.type)}
                          </Badge>
                          <Badge variant="secondary">
                            {format(new Date(recommendation.dueDate), 'MM/dd')}
                          </Badge>
                        </div>
                      </div>

                      <p className="text-sm text-muted-foreground">
                        {recommendation.description}
                      </p>

                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span>التكرار: {recommendation.frequency}</span>
                        <span>مستحق في: {format(new Date(recommendation.dueDate), 'yyyy/MM/dd')}</span>
                      </div>

                      <Alert className="border-blue-200 bg-blue-50 dark:bg-blue-950/30">
                        <MessageSquare className="w-4 h-4 text-blue-600" />
                        <AlertDescription className="text-sm">
                          <strong>رسالة مقترحة:</strong><br />
                          {recommendation.customMessage}
                        </AlertDescription>
                      </Alert>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      ) : (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-8">
              <CheckCircle2 className="w-12 h-12 text-green-600 mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">لا توجد توصيات</h3>
              <p className="text-muted-foreground">
                {searchTerm || priorityFilter !== "all" || typeFilter !== "all" 
                  ? "لا توجد توصيات تطابق الفلاتر المحددة"
                  : "جميع المرضى محدثون ولا توجد توصيات جديدة"}
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}