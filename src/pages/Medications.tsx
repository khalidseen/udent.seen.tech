import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Plus, Search, Filter, Download, Upload, Grid, List, FileSpreadsheet, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { PageContainer } from "@/components/layout/PageContainer";
import { PageHeader } from "@/components/layout/PageHeader";
import AddMedicationDialog from "@/components/medications/AddMedicationDialog";
import EditMedicationDialog from "@/components/medications/EditMedicationDialog";

interface Medication {
  id: string;
  trade_name: string;
  generic_name?: string;
  strength: string;
  form: string;
  frequency: string;
  duration?: string;
  instructions?: string;
  prescription_type: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

const Medications = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [formFilter, setFormFilter] = useState<string>("all");
  const [prescriptionFilter, setPrescriptionFilter] = useState<string>("all");
  const [activeFilter, setActiveFilter] = useState<string>("active");
  const [viewMode, setViewMode] = useState<string>("cards");
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [editingMedication, setEditingMedication] = useState<Medication | null>(null);
  const { toast } = useToast();

  const { data: medications = [], isLoading, refetch } = useQuery({
    queryKey: ['medications'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('medications')
        .select('*')
        .order('trade_name');
      
      if (error) {
        console.error('Error fetching medications:', error);
        throw error;
      }
      
      return data as Medication[];
    }
  });

  // Get clinic_id for insertions
  const { data: profile } = useQuery({
    queryKey: ['profile'],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_current_user_profile');
      if (error) throw error;
      return data;
    }
  });

  const filteredMedications = medications.filter(medication => {
    const matchesSearch = 
      medication.trade_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (medication.generic_name && medication.generic_name.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesForm = formFilter === "all" || medication.form === formFilter;
    const matchesPrescription = prescriptionFilter === "all" || medication.prescription_type === prescriptionFilter;
    const matchesActive = activeFilter === "all" || 
      (activeFilter === "active" && medication.is_active) ||
      (activeFilter === "inactive" && !medication.is_active);

    return matchesSearch && matchesForm && matchesPrescription && matchesActive;
  });

  const handleExportExcel = () => {
    if (medications.length === 0) {
      toast({
        title: "لا توجد بيانات للتصدير",
        description: "لا توجد أدوية لتصديرها",
        variant: "destructive"
      });
      return;
    }

    const csvContent = [
      ["الاسم التجاري", "الاسم العلمي", "المقدار الوزني", "الشكل الصيدلاني", "الجرعة", "المدة", "نوع الوصفة", "الحالة", "تعليمات"],
      ...medications.map(med => [
        med.trade_name,
        med.generic_name || "",
        med.strength,
        med.form,
        med.frequency,
        med.duration || "",
        med.prescription_type === "prescription" ? "بوصفة طبية" : "بدون وصفة طبية",
        med.is_active ? "نشط" : "غير نشط",
        med.instructions || ""
      ])
    ].map(row => row.join(",")).join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `medications_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    
    toast({
      title: "تم التصدير بنجاح",
      description: `تم تصدير ${medications.length} دواء إلى ملف Excel`
    });
  };

  const handleImportExcel = () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".csv";
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        try {
          const text = await file.text();
          const lines = text.split('\n').filter(line => line.trim());
          
          if (lines.length < 2) {
            toast({
              title: "خطأ في الملف",
              description: "الملف فارغ أو لا يحتوي على بيانات صحيحة",
              variant: "destructive"
            });
            return;
          }

          // Skip header row
          const dataLines = lines.slice(1);
          let successCount = 0;
          let errorCount = 0;

          for (const line of dataLines) {
            const columns = line.split(',').map(col => col.trim().replace(/"/g, ''));
            
            if (columns.length >= 8) {
              try {
                const { error } = await supabase
                  .from('medications')
                  .insert({
                    clinic_id: profile?.id,
                    trade_name: columns[0],
                    generic_name: columns[1] || null,
                    strength: columns[2],
                    form: columns[3],
                    frequency: columns[4],
                    duration: columns[5] || null,
                    prescription_type: columns[6] === "بوصفة طبية" ? "prescription" : "otc",
                    is_active: columns[7] === "نشط",
                    instructions: columns[8] || null
                  });

                if (error) {
                  console.error('Error inserting medication:', error);
                  errorCount++;
                } else {
                  successCount++;
                }
              } catch (err) {
                console.error('Error processing row:', err);
                errorCount++;
              }
            }
          }

          refetch();
          toast({
            title: "تم الاستيراد",
            description: `تم استيراد ${successCount} دواء بنجاح${errorCount > 0 ? ` وفشل ${errorCount} دواء` : ''}`,
            variant: errorCount > 0 ? "destructive" : "default"
          });
        } catch (error) {
          console.error('Error reading file:', error);
          toast({
            title: "خطأ في قراءة الملف",
            description: "تأكد من أن الملف بصيغة CSV صحيحة",
            variant: "destructive"
          });
        }
      }
    };
    input.click();
  };
  const handleToggleActive = async (medicationId: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('medications')
        .update({ is_active: !currentStatus })
        .eq('id', medicationId);

      if (error) throw error;

      toast({
        title: "تم التحديث بنجاح",
        description: !currentStatus ? "تم تفعيل الدواء" : "تم إلغاء تفعيل الدواء"
      });

      refetch();
    } catch (error) {
      console.error('Error toggling medication status:', error);
      toast({
        title: "خطأ",
        description: "حدث خطأ أثناء تحديث حالة الدواء",
        variant: "destructive"
      });
    }
  };

  const handleDeleteMedication = async (medicationId: string, medicationName: string) => {
    if (!confirm(`هل أنت متأكد من حذف الدواء "${medicationName}"؟ هذا الإجراء لا يمكن التراجع عنه.`)) {
      return;
    }

    try {
      const { error } = await supabase
        .from('medications')
        .delete()
        .eq('id', medicationId);

      if (error) throw error;

      toast({
        title: "تم الحذف بنجاح",
        description: `تم حذف الدواء "${medicationName}" نهائياً`
      });

      refetch();
    } catch (error) {
      console.error('Error deleting medication:', error);
      toast({
        title: "خطأ",
        description: "حدث خطأ أثناء حذف الدواء",
        variant: "destructive"
      });
    }
  };

  const formOptions = [
    { value: "كبسول", label: "كبسول" },
    { value: "أقراص", label: "أقراص" },
    { value: "سائل", label: "سائل" },
    { value: "حقن", label: "حقن" },
    { value: "مرهم", label: "مرهم" },
    { value: "قطرات", label: "قطرات" },
    { value: "بخاخ", label: "بخاخ" },
    { value: "أخرى", label: "أخرى" }
  ];

  return (
    <PageContainer>
      <PageHeader 
        title="إدارة الأدوية" 
        description="إضافة وإدارة قائمة الأدوية في العيادة"
      />

      <div className="space-y-6">
        {/* Filters and Search */}
        <Card>
          <CardHeader>
            <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
              <div className="flex items-center gap-4">
                <CardTitle className="text-lg">البحث والفلترة</CardTitle>
                <ToggleGroup type="single" value={viewMode} onValueChange={setViewMode} className="border rounded-lg p-1">
                  <ToggleGroupItem value="cards" aria-label="عرض مربعات">
                    <Grid className="h-4 w-4" />
                  </ToggleGroupItem>
                  <ToggleGroupItem value="list" aria-label="عرض قائمة">
                    <List className="h-4 w-4" />
                  </ToggleGroupItem>
                </ToggleGroup>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" onClick={handleImportExcel} className="flex items-center gap-2">
                  <Upload className="h-4 w-4" />
                  استيراد Excel
                </Button>
                <Button variant="outline" onClick={handleExportExcel} className="flex items-center gap-2">
                  <Download className="h-4 w-4" />
                  تصدير Excel
                </Button>
                <Button onClick={() => setShowAddDialog(true)} className="flex items-center gap-2">
                  <Plus className="h-4 w-4" />
                  إضافة دواء جديد
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  placeholder="البحث بالاسم التجاري أو العلمي..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              
              <Select value={formFilter} onValueChange={setFormFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="جميع الأشكال الصيدلانية" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">جميع الأشكال</SelectItem>
                  {formOptions.map(option => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={prescriptionFilter} onValueChange={setPrescriptionFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="نوع الوصفة" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">جميع الأنواع</SelectItem>
                  <SelectItem value="prescription">بوصفة طبية</SelectItem>
                  <SelectItem value="otc">بدون وصفة طبية</SelectItem>
                </SelectContent>
              </Select>

              <Select value={activeFilter} onValueChange={setActiveFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="الحالة" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">جميع الأدوية</SelectItem>
                  <SelectItem value="active">الأدوية النشطة</SelectItem>
                  <SelectItem value="inactive">الأدوية غير النشطة</SelectItem>
                </SelectContent>
              </Select>

              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Filter className="h-4 w-4" />
                {filteredMedications.length} من {medications.length} دواء
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Medications Display */}
        {viewMode === "cards" ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {isLoading ? (
              Array.from({ length: 6 }).map((_, i) => (
                <Card key={i} className="animate-pulse">
                  <CardContent className="p-4 space-y-3">
                    <div className="h-4 bg-muted rounded w-3/4"></div>
                    <div className="h-3 bg-muted rounded w-1/2"></div>
                    <div className="h-3 bg-muted rounded w-2/3"></div>
                  </CardContent>
                </Card>
              ))
            ) : filteredMedications.length === 0 ? (
              <Card className="col-span-full">
                <CardContent className="p-8 text-center text-muted-foreground">
                  <div className="text-lg font-medium mb-2">لا توجد أدوية</div>
                  <div className="text-sm">
                    {searchTerm || formFilter !== "all" || activeFilter !== "active" || prescriptionFilter !== "all"
                      ? "لم يتم العثور على أدوية تطابق معايير البحث"
                      : "لم يتم إضافة أي أدوية بعد"
                    }
                  </div>
                </CardContent>
              </Card>
            ) : (
              filteredMedications.map((medication) => (
                <Card key={medication.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="space-y-3">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h3 className="font-semibold text-lg leading-tight">
                            {medication.trade_name}
                          </h3>
                          {medication.generic_name && (
                            <p className="text-sm text-muted-foreground">
                              {medication.generic_name}
                            </p>
                          )}
                        </div>
                        <div className="flex flex-col items-end gap-1">
                          <Badge variant={medication.is_active ? "default" : "secondary"}>
                            {medication.is_active ? "نشط" : "غير نشط"}
                          </Badge>
                          <Badge variant={medication.prescription_type === "prescription" ? "destructive" : "outline"}>
                            {medication.prescription_type === "prescription" ? "بوصفة" : "OTC"}
                          </Badge>
                        </div>
                      </div>

                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">المقدار:</span>
                          <span className="font-medium">{medication.strength}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">الشكل:</span>
                          <span className="font-medium">{medication.form}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">الجرعة:</span>
                          <span className="font-medium">{medication.frequency}</span>
                        </div>
                        {medication.duration && (
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">المدة:</span>
                            <span className="font-medium">{medication.duration}</span>
                          </div>
                        )}
                      </div>

                      {medication.instructions && (
                        <div className="text-xs text-muted-foreground bg-muted p-2 rounded">
                          {medication.instructions}
                        </div>
                      )}

                      <div className="flex gap-2 pt-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setEditingMedication(medication)}
                          className="flex-1"
                        >
                          تعديل
                        </Button>
                        <Button
                          variant={medication.is_active ? "destructive" : "default"}
                          size="sm"
                          onClick={() => handleToggleActive(medication.id, medication.is_active)}
                          className="flex-1"
                        >
                          {medication.is_active ? "إلغاء تفعيل" : "تفعيل"}
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => handleDeleteMedication(medication.id, medication.trade_name)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        ) : (
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>الاسم التجاري</TableHead>
                    <TableHead>الاسم العلمي</TableHead>
                    <TableHead>المقدار</TableHead>
                    <TableHead>الشكل</TableHead>
                    <TableHead>الجرعة</TableHead>
                    <TableHead>نوع الوصفة</TableHead>
                    <TableHead>الحالة</TableHead>
                    <TableHead>الإجراءات</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    Array.from({ length: 5 }).map((_, i) => (
                      <TableRow key={i}>
                        {Array.from({ length: 8 }).map((_, j) => (
                          <TableCell key={j}>
                            <div className="h-4 bg-muted rounded animate-pulse"></div>
                          </TableCell>
                        ))}
                      </TableRow>
                    ))
                  ) : filteredMedications.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                        <div className="text-lg font-medium mb-2">لا توجد أدوية</div>
                        <div className="text-sm">
                          {searchTerm || formFilter !== "all" || activeFilter !== "active" || prescriptionFilter !== "all"
                            ? "لم يتم العثور على أدوية تطابق معايير البحث"
                            : "لم يتم إضافة أي أدوية بعد"
                          }
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredMedications.map((medication) => (
                      <TableRow key={medication.id}>
                        <TableCell className="font-medium">{medication.trade_name}</TableCell>
                        <TableCell>{medication.generic_name || "-"}</TableCell>
                        <TableCell>{medication.strength}</TableCell>
                        <TableCell>{medication.form}</TableCell>
                        <TableCell>{medication.frequency}</TableCell>
                        <TableCell>
                          <Badge variant={medication.prescription_type === "prescription" ? "destructive" : "outline"}>
                            {medication.prescription_type === "prescription" ? "بوصفة طبية" : "بدون وصفة"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant={medication.is_active ? "default" : "secondary"}>
                            {medication.is_active ? "نشط" : "غير نشط"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setEditingMedication(medication)}
                            >
                              تعديل
                            </Button>
                            <Button
                              variant={medication.is_active ? "destructive" : "default"}
                              size="sm"
                              onClick={() => handleToggleActive(medication.id, medication.is_active)}
                            >
                              {medication.is_active ? "إلغاء" : "تفعيل"}
                            </Button>
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => handleDeleteMedication(medication.id, medication.trade_name)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Dialogs */}
      <AddMedicationDialog 
        open={showAddDialog} 
        onOpenChange={setShowAddDialog}
        onSuccess={() => {
          refetch();
          setShowAddDialog(false);
        }}
      />

      {editingMedication && (
        <EditMedicationDialog
          open={!!editingMedication}
          onOpenChange={() => setEditingMedication(null)}
          medication={editingMedication}
          onSuccess={() => {
            refetch();
            setEditingMedication(null);
          }}
        />
      )}
    </PageContainer>
  );
};

export default Medications;