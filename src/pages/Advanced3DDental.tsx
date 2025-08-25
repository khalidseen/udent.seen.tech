import React, { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { PageContainer } from '@/components/layout/PageContainer';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import Enhanced3DToothChart from '@/components/dental/Enhanced3DToothChart';
import Tooth3DManager from '@/components/dental/Tooth3DManager';
import RealisticTooth3D from '@/components/dental/RealisticTooth3D';
import { 
  User, 
  Calendar, 
  FileText, 
  Activity,
  Box,
  Eye,
  BarChart3,
  Settings,
  Download,
  Share2
} from 'lucide-react';

const Advanced3DDental = () => {
  const [searchParams] = useSearchParams();
  const initialPatientId = searchParams.get('patientId');
  
  const [selectedPatientId, setSelectedPatientId] = useState<string>(initialPatientId || '');
  const [selectedTooth, setSelectedTooth] = useState<string>('');
  const [numberingSystem, setNumberingSystem] = useState<'universal' | 'palmer' | 'fdi'>('universal');
  const [activeTab, setActiveTab] = useState('overview');

  // Fetch patients
  const { data: patients = [] } = useQuery({
    queryKey: ['patients-list'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('patients')
        .select('id, full_name, phone')
        .order('full_name');
      
      if (error) throw error;
      return data;
    }
  });

  // Fetch patient details
  const { data: selectedPatient } = useQuery({
    queryKey: ['patient-details', selectedPatientId],
    queryFn: async () => {
      if (!selectedPatientId) return null;
      
      const { data, error } = await supabase
        .from('patients')
        .select('*')
        .eq('id', selectedPatientId)
        .single();
      
      if (error) throw error;
      return data;
    },
    enabled: !!selectedPatientId
  });

  // Fetch dental treatments for the patient
  const { data: treatments = [] } = useQuery({
    queryKey: ['patient-treatments', selectedPatientId],
    queryFn: async () => {
      if (!selectedPatientId) return [];
      
      const { data, error } = await supabase
        .from('dental_treatments')
        .select('*')
        .eq('patient_id', selectedPatientId)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data;
    },
    enabled: !!selectedPatientId
  });

  // Fetch 3D annotations stats
  const { data: annotationsStats } = useQuery({
    queryKey: ['annotations-stats', selectedPatientId],
    queryFn: async () => {
      if (!selectedPatientId) return null;
      
      const { data, error } = await supabase
        .from('tooth_3d_annotations')
        .select('annotation_type, severity, tooth_number')
        .eq('patient_id', selectedPatientId);
      
      if (error) throw error;
      
      const stats = {
        total: data.length,
        byType: {} as Record<string, number>,
        bySeverity: {} as Record<string, number>,
        teethWithAnnotations: new Set(data.map(a => a.tooth_number)).size
      };
      
      data.forEach(annotation => {
        stats.byType[annotation.annotation_type] = (stats.byType[annotation.annotation_type] || 0) + 1;
        stats.bySeverity[annotation.severity] = (stats.bySeverity[annotation.severity] || 0) + 1;
      });
      
      return stats;
    },
    enabled: !!selectedPatientId
  });

  const handleToothSelect = (toothNumber: string, system: string) => {
    setSelectedTooth(toothNumber);
    setNumberingSystem(system as 'universal' | 'palmer' | 'fdi');
  };

  return (
    <PageContainer>
      <PageHeader 
        title="النظام المتقدم ثلاثي الأبعاد للأسنان" 
        description="تشخيص وتحليل شامل باستخدام النماذج ثلاثية الأبعاد"
      />

      <div className="space-y-6">
        {/* Patient Selection */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="w-5 h-5" />
              اختيار المريض
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-4 items-end">
              <div className="flex-1">
                <Select value={selectedPatientId} onValueChange={setSelectedPatientId}>
                  <SelectTrigger>
                    <SelectValue placeholder="اختر مريضاً" />
                  </SelectTrigger>
                  <SelectContent>
                    {patients.map((patient) => (
                      <SelectItem key={patient.id} value={patient.id}>
                        {patient.full_name} {patient.phone && `- ${patient.phone}`}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              {selectedPatient && (
                <div className="flex gap-2">
                  <Badge variant="outline">
                    <Calendar className="w-3 h-3 mr-1" />
                    {treatments.length} علاج
                  </Badge>
                  <Badge variant="outline">
                    <Box className="w-3 h-3 mr-1" />
                    {annotationsStats?.total || 0} تعليق ثلاثي الأبعاد
                  </Badge>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {selectedPatient && (
          <>
            {/* Patient Info Summary */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>معلومات المريض</span>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm">
                      <Download className="w-4 h-4 mr-1" />
                      تصدير التقرير
                    </Button>
                    <Button variant="outline" size="sm">
                      <Share2 className="w-4 h-4 mr-1" />
                      مشاركة
                    </Button>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div>
                    <h4 className="font-medium">{selectedPatient.full_name}</h4>
                    <p className="text-sm text-muted-foreground">{selectedPatient.phone}</p>
                  </div>
                  <div>
                    <h4 className="font-medium">العمر</h4>
                    <p className="text-sm text-muted-foreground">
                      {selectedPatient.date_of_birth 
                        ? `${new Date().getFullYear() - new Date(selectedPatient.date_of_birth).getFullYear()} سنة`
                        : 'غير محدد'
                      }
                    </p>
                  </div>
                  <div>
                    <h4 className="font-medium">آخر زيارة</h4>
                    <p className="text-sm text-muted-foreground">
                      {treatments[0]?.treatment_date 
                        ? new Date(treatments[0].treatment_date).toLocaleDateString('ar')
                        : 'لا توجد زيارات'
                      }
                    </p>
                  </div>
                  <div>
                    <h4 className="font-medium">حالة الأسنان</h4>
                    <div className="flex gap-1 mt-1">
                      {annotationsStats?.bySeverity.critical > 0 && (
                        <Badge variant="destructive" className="text-xs">حرج</Badge>
                      )}
                      {annotationsStats?.bySeverity.high > 0 && (
                        <Badge variant="default" className="text-xs">عالي</Badge>
                      )}
                      {annotationsStats?.total === 0 && (
                        <Badge variant="secondary" className="text-xs">سليم</Badge>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Main Content Tabs */}
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-5">
                <TabsTrigger value="overview" className="flex items-center gap-2">
                  <Eye className="w-4 h-4" />
                  نظرة عامة
                </TabsTrigger>
                <TabsTrigger value="3d-chart" className="flex items-center gap-2">
                  <Box className="w-4 h-4" />
                  المخطط ثلاثي الأبعاد
                </TabsTrigger>
                <TabsTrigger value="realistic-tooth" className="flex items-center gap-2">
                  <Box className="w-4 h-4" />
                  النموذج الواقعي - سن 23
                </TabsTrigger>
                <TabsTrigger value="tooth-detail" className="flex items-center gap-2" disabled={!selectedTooth}>
                  <Settings className="w-4 h-4" />
                  تفاصيل السن
                </TabsTrigger>
                <TabsTrigger value="analytics" className="flex items-center gap-2">
                  <BarChart3 className="w-4 h-4" />
                  التحليلات
                </TabsTrigger>
              </TabsList>

              <TabsContent value="overview" className="space-y-6">
                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-muted-foreground">إجمالي العلاجات</p>
                          <p className="text-2xl font-bold">{treatments.length}</p>
                        </div>
                        <FileText className="w-8 h-8 text-muted-foreground" />
                      </div>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-muted-foreground">التعليقات ثلاثية الأبعاد</p>
                          <p className="text-2xl font-bold">{annotationsStats?.total || 0}</p>
                        </div>
                        <Box className="w-8 h-8 text-muted-foreground" />
                      </div>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-muted-foreground">أسنان بتعليقات</p>
                          <p className="text-2xl font-bold">{annotationsStats?.teethWithAnnotations || 0}</p>
                        </div>
                        <Activity className="w-8 h-8 text-muted-foreground" />
                      </div>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-muted-foreground">حالات حرجة</p>
                          <p className="text-2xl font-bold text-red-600">
                            {annotationsStats?.bySeverity.critical || 0}
                          </p>
                        </div>
                        <Activity className="w-8 h-8 text-red-500" />
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* 3D Chart Preview */}
                <Enhanced3DToothChart
                  patientId={selectedPatientId}
                  onToothSelect={handleToothSelect}
                  selectedTooth={selectedTooth}
                  numberingSystem={numberingSystem}
                />
              </TabsContent>

              <TabsContent value="3d-chart">
                <Enhanced3DToothChart
                  patientId={selectedPatientId}
                  onToothSelect={handleToothSelect}
                  selectedTooth={selectedTooth}
                  numberingSystem={numberingSystem}
                />
              </TabsContent>

              <TabsContent value="realistic-tooth">
                <div className="space-y-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-center">
                        النموذج ثلاثي الأبعاد الواقعي للسن رقم 23 (الناب العلوي الأيسر)
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-center mb-4">
                        <p className="text-muted-foreground">
                          نموذج متطور يُظهر التضاريس الحقيقية والشكل التشريحي الدقيق للناب
                        </p>
                      </div>
                      <RealisticTooth3D
                        toothNumber="23"
                        annotations={[
                          {
                            id: "1",
                            position: [0.3, 0.5, 0.2],
                            color: "#ef4444",
                            title: "منطقة تسوس",
                            description: "تسوس صغير في الجانب الأمامي",
                            type: "decay",
                            severity: "medium"
                          },
                          {
                            id: "2", 
                            position: [-0.2, 0.8, 0.1],
                            color: "#10b981",
                            title: "منطقة سليمة",
                            description: "النسيج في حالة جيدة",
                            type: "healthy",
                            severity: "low"
                          }
                        ]}
                        onToothClick={() => {
                          console.log('تم النقر على السن 23');
                        }}
                        interactionMode="view"
                      />
                    </CardContent>
                  </Card>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Card>
                      <CardHeader>
                        <CardTitle>خصائص الناب العلوي الأيسر</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-3">
                          <div>
                            <h4 className="font-medium">الرقم حسب نظام FDI</h4>
                            <p className="text-sm text-muted-foreground">23</p>
                          </div>
                          <div>
                            <h4 className="font-medium">الموقع</h4>
                            <p className="text-sm text-muted-foreground">الفك العلوي الأيسر</p>
                          </div>
                          <div>
                            <h4 className="font-medium">الوظيفة</h4>
                            <p className="text-sm text-muted-foreground">تمزيق الطعام والإطباق</p>
                          </div>
                          <div>
                            <h4 className="font-medium">الخصائص التشريحية</h4>
                            <ul className="text-sm text-muted-foreground list-disc list-inside">
                              <li>قمة حادة ومدببة</li>
                              <li>جذر واحد طويل</li>
                              <li>سطح قطع مثلثي</li>
                              <li>حواف جانبية مائلة</li>
                            </ul>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                    
                    <Card>
                      <CardHeader>
                        <CardTitle>مميزات النموذج الواقعي</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-3">
                          <div className="flex items-center gap-2">
                            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                            <span className="text-sm">تضاريس تشريحية دقيقة</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                            <span className="text-sm">ألوان واقعية للمينا والجذر</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                            <span className="text-sm">إضاءة متقدمة ثلاثية الأبعاد</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                            <span className="text-sm">تفاعل حقيقي مع التعليقات</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                            <span className="text-sm">حركة تنفس طبيعية</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                            <span className="text-sm">تحكم كامل في الدوران والتكبير</span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="tooth-detail">
                {selectedTooth ? (
                  <Tooth3DManager
                    patientId={selectedPatientId}
                    toothNumber={selectedTooth}
                    numberingSystem={numberingSystem}
                  />
                ) : (
                  <Card>
                    <CardContent className="p-8 text-center">
                      <Box className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                      <h3 className="text-lg font-medium mb-2">لم يتم اختيار سن</h3>
                      <p className="text-muted-foreground">
                        يرجى اختيار سن من المخطط لعرض النموذج ثلاثي الأبعاد والتعليقات
                      </p>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>

              <TabsContent value="analytics" className="space-y-6">
                {annotationsStats && (
                  <>
                    {/* Annotations by Type */}
                    <Card>
                      <CardHeader>
                        <CardTitle>التعليقات حسب النوع</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                          {Object.entries(annotationsStats.byType).map(([type, count]) => (
                            <div key={type} className="text-center">
                              <div className="text-2xl font-bold">{count}</div>
                              <div className="text-sm text-muted-foreground">
                                {type === 'decay' ? 'تسوس' :
                                 type === 'fracture' ? 'كسر' :
                                 type === 'filling' ? 'حشوة' :
                                 type === 'crown' ? 'تاج' :
                                 type === 'note' ? 'ملاحظة' : type}
                              </div>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>

                    {/* Annotations by Severity */}
                    <Card>
                      <CardHeader>
                        <CardTitle>التعليقات حسب الخطورة</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                          {Object.entries(annotationsStats.bySeverity).map(([severity, count]) => (
                            <div key={severity} className="text-center">
                              <div className={`text-2xl font-bold ${
                                severity === 'critical' ? 'text-red-600' :
                                severity === 'high' ? 'text-orange-600' :
                                severity === 'medium' ? 'text-yellow-600' :
                                'text-green-600'
                              }`}>
                                {count}
                              </div>
                              <div className="text-sm text-muted-foreground">
                                {severity === 'critical' ? 'حرج' :
                                 severity === 'high' ? 'عالي' :
                                 severity === 'medium' ? 'متوسط' :
                                 'منخفض'}
                              </div>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  </>
                )}
              </TabsContent>
            </Tabs>
          </>
        )}

        {!selectedPatientId && (
          <Card>
            <CardContent className="p-8 text-center">
              <User className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">مرحباً بك في النظام المتقدم ثلاثي الأبعاد</h3>
              <p className="text-muted-foreground">
                يرجى اختيار مريض من القائمة أعلاه للبدء في استخدام النماذج ثلاثية الأبعاد للأسنان
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </PageContainer>
  );
};

export default Advanced3DDental;