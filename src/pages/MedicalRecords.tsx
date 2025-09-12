import React, { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useSearchParams } from "react-router-dom";
import { PageContainer } from "@/components/layout/PageContainer";
import { PageToolbar } from "@/components/layout/PageToolbar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CreateRecordDialog } from "@/components/medical-records/CreateRecordDialog";
import { UploadImageDialog } from "@/components/medical-records/UploadImageDialog";
import { ViewRecordDialog } from "@/components/medical-records/ViewRecordDialog";
import { CompareImagesDialog } from "@/components/medical-records/CompareImagesDialog";
import { supabase } from "@/integrations/supabase/client";
import { Plus, FileText, Camera, Search, Eye, RotateCcw, Brain } from "lucide-react";
import { AISmartDiagnosisButton } from "@/components/medical-records/AISmartDiagnosisButton";
import { AIInsightsDashboard } from "@/components/ai-analysis/AIInsightsDashboard";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";

interface MedicalRecord {
  id: string;
  patient_id: string;
  record_type: string;
  title: string;
  description?: string;
  treatment_date: string;
  diagnosis?: string;
  treatment_plan?: string;
  notes?: string;
  patients: {
    full_name: string;
  } | null;
  medical_images?: {
    id: string;
    title: string;
    image_type: string;
    is_before_treatment: boolean;
    is_after_treatment: boolean;
  }[];
}

export default function MedicalRecords() {
  const [searchParams] = useSearchParams();
  const patientIdFromUrl = searchParams.get('patient');
  
  const [searchTerm, setSearchTerm] = useState("");
  const [patientFilter, setPatientFilter] = useState(patientIdFromUrl || "all");
  const [recordTypeFilter, setRecordTypeFilter] = useState("all");
  const [isCreateRecordOpen, setIsCreateRecordOpen] = useState(false);
  const [isUploadImageOpen, setIsUploadImageOpen] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<MedicalRecord | null>(null);
  const [isViewRecordOpen, setIsViewRecordOpen] = useState(false);
  const [isCompareImagesOpen, setIsCompareImagesOpen] = useState(false);
  const { toast } = useToast();

  // Update patientFilter when URL parameter changes
  useEffect(() => {
    if (patientIdFromUrl && patients) {
      setPatientFilter(patientIdFromUrl);
      const selectedPatient = patients.find(p => p.id === patientIdFromUrl);
      if (selectedPatient) {
        toast({
          title: 'تم التنقل للملف الطبي',
          description: `عرض السجلات الطبية للمريض: ${selectedPatient.full_name}`,
        });
      }
    }
  }, [patientIdFromUrl, patients, toast]);

  const { data: records, isLoading, refetch } = useQuery({
    queryKey: ['medical-records'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('medical_records')
        .select(`
          *,
          patients (
            full_name
          ),
          medical_images (
            id,
            title,
            image_type,
            is_before_treatment,
            is_after_treatment
          )
        `)
        .order('treatment_date', { ascending: false });

      if (error) throw error;
      return data as MedicalRecord[];
    }
  });

  const { data: patients } = useQuery({
    queryKey: ['patients-list'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('patients')
        .select('id, full_name')
        .order('full_name');
      
      if (error) throw error;
      return data;
    }
  });

  const { data: stats } = useQuery({
    queryKey: ['medical-records-stats'],
    queryFn: async () => {
      const { data: recordsData, error: recordsError } = await supabase
        .from('medical_records')
        .select('id, record_type');

      if (recordsError) throw recordsError;

      const { data: imagesData, error: imagesError } = await supabase
        .from('medical_images')
        .select('id, image_type');

      if (imagesError) throw imagesError;

      const totalRecords = recordsData.length;
      const totalImages = imagesData.length;
      const xrayImages = imagesData.filter(img => img.image_type === 'xray').length;
      const uniquePatients = new Set(recordsData.map(r => r.id)).size;

      return { totalRecords, totalImages, xrayImages, uniquePatients };
    }
  });

  const filteredRecords = records?.filter(record => {
    const matchesSearch = record.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         record.patients?.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         record.diagnosis?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesPatient = patientFilter === "all" || record.patient_id === patientFilter;
    const matchesType = recordTypeFilter === "all" || record.record_type === recordTypeFilter;
    return matchesSearch && matchesPatient && matchesType;
  });

  const getRecordTypeText = (type: string) => {
    switch (type) {
      case 'consultation': return 'استشارة';
      case 'treatment': return 'علاج';
      case 'surgery': return 'جراحة';
      case 'followup': return 'متابعة';
      case 'xray': return 'أشعة';
      default: return type;
    }
  };

  const getRecordTypeColor = (type: string) => {
    switch (type) {
      case 'consultation': return 'bg-blue-100 text-blue-800';
      case 'treatment': return 'bg-green-100 text-green-800';
      case 'surgery': return 'bg-red-100 text-red-800';
      case 'followup': return 'bg-yellow-100 text-yellow-800';
      case 'xray': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const handleViewRecord = (record: MedicalRecord) => {
    setSelectedRecord(record);
    setIsViewRecordOpen(true);
  };

  const handleCompareImages = (record: MedicalRecord) => {
    setSelectedRecord(record);
    setIsCompareImagesOpen(true);
  };

  const handleRecordCreated = () => {
    refetch();
    toast({
      title: "تم إنشاء السجل الطبي",
      description: "تم إنشاء السجل الطبي بنجاح",
    });
  };

  const handleImageUploaded = () => {
    refetch();
    toast({
      title: "تم رفع الصورة",
      description: "تم رفع الصورة الطبية بنجاح",
    });
  };

  return (
    <PageContainer>
      <PageToolbar
        title="السجلات الطبية"
        searchQuery={searchTerm}
        onSearchChange={setSearchTerm}
        searchPlaceholder="البحث في السجلات الطبية..."
        showViewToggle={false}
        showAdvancedFilter={false}
        actions={
          <div className="flex gap-2">
            <Button 
              onClick={() => window.open('/smart-diagnosis', '_blank')}
              variant="outline"
              className="bg-gradient-to-r from-primary/10 to-primary/5 border-primary/20 hover:from-primary/20 hover:to-primary/10"
            >
              <Brain className="w-4 h-4 ml-2" />
              التشخيص الذكي المتطور
            </Button>
            <Button onClick={() => setIsUploadImageOpen(true)} variant="outline">
              <Camera className="w-4 h-4 ml-2" />
              رفع صورة
            </Button>
            <Button onClick={() => setIsCreateRecordOpen(true)}>
              <Plus className="w-4 h-4 ml-2" />
              سجل جديد
            </Button>
          </div>
        }
      />

      {/* Smart Diagnosis Engine - Removed from here */}

      {/* AI Insights Dashboard */}
      <div className="mb-6">
        <AIInsightsDashboard />
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">إجمالي السجلات</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalRecords || 0}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">إجمالي الصور</CardTitle>
            <Camera className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalImages || 0}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">صور الأشعة</CardTitle>
            <Camera className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.xrayImages || 0}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">المرضى المتابعين</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.uniquePatients || 0}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="البحث في السجلات الطبية..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={patientFilter} onValueChange={setPatientFilter}>
              <SelectTrigger className="w-full md:w-[200px]">
                <SelectValue placeholder="تصفية حسب المريض" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">جميع المرضى</SelectItem>
                {patients?.map((patient) => (
                  <SelectItem key={patient.id} value={patient.id}>
                    {patient.full_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={recordTypeFilter} onValueChange={setRecordTypeFilter}>
              <SelectTrigger className="w-full md:w-[200px]">
                <SelectValue placeholder="تصفية حسب النوع" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">جميع الأنواع</SelectItem>
                <SelectItem value="consultation">استشارة</SelectItem>
                <SelectItem value="treatment">علاج</SelectItem>
                <SelectItem value="surgery">جراحة</SelectItem>
                <SelectItem value="followup">متابعة</SelectItem>
                <SelectItem value="xray">أشعة</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Records Grid */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">السجلات الطبية</h3>
          <span className="text-sm text-muted-foreground">
            {filteredRecords?.length || 0} سجل
          </span>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[...Array(6)].map((_, i) => (
              <Card key={i} className="animate-pulse">
                <CardContent className="p-6">
                  <div className="space-y-3">
                    <div className="h-4 bg-muted rounded w-3/4"></div>
                    <div className="h-3 bg-muted rounded w-1/2"></div>
                    <div className="h-3 bg-muted rounded w-full"></div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : filteredRecords && filteredRecords.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredRecords.map((record) => (
              <Card key={record.id} className="hover:shadow-lg transition-all duration-200 border-l-4 border-l-primary/20 hover:border-l-primary">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="space-y-2">
                      <CardTitle className="text-base leading-tight">
                        {record.title}
                      </CardTitle>
                      <div className="flex items-center gap-2">
                        <Badge className={getRecordTypeColor(record.record_type)} variant="secondary">
                          {getRecordTypeText(record.record_type)}
                        </Badge>
                        {record.medical_images && record.medical_images.length > 0 && (
                          <Badge variant="outline" className="text-xs">
                            <Camera className="w-3 h-3 ml-1" />
                            {record.medical_images.length}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                </CardHeader>
                
                <CardContent className="pt-0">
                  <div className="space-y-3">
                    {/* Patient Info */}
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                        <span className="text-xs font-medium text-primary">
                          {record.patients?.full_name.charAt(0)}
                        </span>
                      </div>
                      <div>
                        <p className="text-sm font-medium">{record.patients?.full_name}</p>
                        <p className="text-xs text-muted-foreground">
                          {format(new Date(record.treatment_date), 'yyyy/MM/dd')}
                        </p>
                      </div>
                    </div>

                    {/* Diagnosis */}
                    {record.diagnosis && (
                      <div className="bg-muted/50 rounded-lg p-3">
                        <p className="text-xs font-medium text-muted-foreground mb-1">التشخيص</p>
                        <p className="text-sm">{record.diagnosis}</p>
                      </div>
                    )}

                    {/* Description */}
                    {record.description && (
                      <div>
                        <p className="text-xs font-medium text-muted-foreground mb-1">الوصف</p>
                        <p className="text-sm text-muted-foreground line-clamp-2">
                          {record.description}
                        </p>
                      </div>
                    )}

                    {/* Actions */}
                    <div className="flex gap-2 pt-2 border-t">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleViewRecord(record)}
                        className="flex-1"
                      >
                        <Eye className="w-4 h-4 ml-2" />
                        عرض
                      </Button>
                      
                      {record.medical_images && record.medical_images.length > 1 && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleCompareImages(record)}
                          className="px-3"
                        >
                          <RotateCcw className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card className="text-center py-12">
            <CardContent>
              <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">لا توجد سجلات طبية</h3>
              <p className="text-muted-foreground mb-4">
                {searchTerm || patientFilter !== "all" || recordTypeFilter !== "all" 
                  ? "لم يتم العثور على سجلات تطابق معايير البحث"
                  : "ابدأ بإنشاء أول سجل طبي"
                }
              </p>
              {(!searchTerm && patientFilter === "all" && recordTypeFilter === "all") && (
                <Button onClick={() => setIsCreateRecordOpen(true)}>
                  <Plus className="w-4 h-4 ml-2" />
                  إنشاء سجل جديد
                </Button>
              )}
            </CardContent>
          </Card>
        )}
      </div>

      <CreateRecordDialog
        isOpen={isCreateRecordOpen}
        onClose={() => setIsCreateRecordOpen(false)}
        onRecordCreated={handleRecordCreated}
      />

      <UploadImageDialog
        isOpen={isUploadImageOpen}
        onClose={() => setIsUploadImageOpen(false)}
        onImageUploaded={handleImageUploaded}
      />

      {selectedRecord && (
        <>
          <ViewRecordDialog
            record={selectedRecord}
            isOpen={isViewRecordOpen}
            onClose={() => {
              setIsViewRecordOpen(false);
              setSelectedRecord(null);
            }}
          />

          <CompareImagesDialog
            record={selectedRecord}
            isOpen={isCompareImagesOpen}
            onClose={() => {
              setIsCompareImagesOpen(false);
              setSelectedRecord(null);
            }}
          />
        </>
      )}
    </PageContainer>
  );
}