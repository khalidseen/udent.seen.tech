import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { PageContainer } from "@/components/layout/PageContainer";
import { PageHeader } from "@/components/layout/PageHeader";
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
import { Plus, FileText, Camera, Search, Eye, RotateCcw } from "lucide-react";
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
  const [searchTerm, setSearchTerm] = useState("");
  const [patientFilter, setPatientFilter] = useState("all");
  const [recordTypeFilter, setRecordTypeFilter] = useState("all");
  const [isCreateRecordOpen, setIsCreateRecordOpen] = useState(false);
  const [isUploadImageOpen, setIsUploadImageOpen] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<MedicalRecord | null>(null);
  const [isViewRecordOpen, setIsViewRecordOpen] = useState(false);
  const [isCompareImagesOpen, setIsCompareImagesOpen] = useState(false);
  const { toast } = useToast();

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
      return data as any;
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
      <PageHeader 
        title="السجلات الطبية"
        description="إدارة السجلات الطبية والأشعة"
        action={
          <div className="flex gap-2">
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

      {/* Records Table */}
      <Card>
        <CardHeader>
          <CardTitle>قائمة السجلات الطبية</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8">جاري التحميل...</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>العنوان</TableHead>
                  <TableHead>المريض</TableHead>
                  <TableHead>النوع</TableHead>
                  <TableHead>تاريخ العلاج</TableHead>
                  <TableHead>التشخيص</TableHead>
                  <TableHead>الصور</TableHead>
                  <TableHead>الإجراءات</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredRecords?.map((record) => (
                  <TableRow key={record.id}>
                    <TableCell className="font-medium">{record.title}</TableCell>
                    <TableCell>{record.patients?.full_name}</TableCell>
                    <TableCell>
                      <Badge className={getRecordTypeColor(record.record_type)}>
                        {getRecordTypeText(record.record_type)}
                      </Badge>
                    </TableCell>
                    <TableCell>{format(new Date(record.treatment_date), 'yyyy/MM/dd')}</TableCell>
                    <TableCell>{record.diagnosis || '-'}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <span>{record.medical_images?.length || 0}</span>
                        {record.medical_images && record.medical_images.length > 1 && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleCompareImages(record)}
                          >
                            <RotateCcw className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleViewRecord(record)}
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

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