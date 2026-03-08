import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, Search, Filter, Download, Upload, Grid, List, Trash2 } from "lucide-react";
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
import { PermissionGuard } from "@/components/auth/PermissionGuard";
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
  const queryClient = useQueryClient();

  const { data: profile } = useQuery({
    queryKey: ['current-profile'],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_current_user_profile');
      if (error) throw error;
      return data;
    }
  });

  const { data: medications = [], isLoading, refetch } = useQuery({
    queryKey: ['medications', profile?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('medications')
        .select('*')
        .eq('clinic_id', profile!.id)
        .order('trade_name');
      if (error) throw error;
      return data as Medication[];
    },
    enabled: !!profile?.id
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

  const stats = {
    total: medications.length,
    active: medications.filter(m => m.is_active).length,
    prescription: medications.filter(m => m.prescription_type === 'prescription').length,
    otc: medications.filter(m => m.prescription_type === 'otc').length,
  };

  const handleExportExcel = () => {
    if (medications.length === 0) {
      toast({ title: "لا توجد بيانات", description: "لا توجد أدوية لتصديرها", variant: "destructive" });
      return;
    }
    const csvContent = "\uFEFF" + [
      ["الاسم التجاري", "الاسم العلمي", "المقدار الوزني", "الشكل الصيدلاني", "الجرعة", "المدة", "نوع الوصفة", "الحالة", "تعليمات"],
      ...medications.map(med => [
        med.trade_name, med.generic_name || "", med.strength, med.form, med.frequency,
        med.duration || "", med.prescription_type === "prescription" ? "بوصفة طبية" : "بدون وصفة طبية",
        med.is_active ? "نشط" : "غير نشط", med.instructions || ""
      ])
    ].map(row => row.join(",")).join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `medications_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    toast({ title: "تم التصدير بنجاح", description: `تم تصدير ${medications.length} دواء` });
  };

  const handleImportExcel = () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".csv";
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;
      try {
        const text = await file.text();
        const lines = text.split('\n').filter(line => line.trim());
        if (lines.length < 2) {
          toast({ title: "خطأ", description: "الملف فارغ أو لا يحتوي على بيانات", variant: "destructive" });
          return;
        }
        const dataLines = lines.slice(1);
        let successCount = 0, errorCount = 0;

        for (const line of dataLines) {
          const cols = line.split(',').map(col => col.trim().replace(/"/g, ''));
          if (cols.length >= 5) {
            const { error } = await supabase.from('medications').insert({
              clinic_id: profile?.id,
              trade_name: cols[0],
              generic_name: cols[1] || null,
              strength: cols[2],
              form: cols[3],
              frequency: cols[4],
              duration: cols[5] || null,
              prescription_type: cols[6] === "بوصفة طبية" ? "prescription" : "otc",
              is_active: cols[7] !== "غير نشط",
              instructions: cols[8] || null
            });
            if (error) errorCount++; else successCount++;
          }
        }
        refetch();
        toast({
          title: "تم الاستيراد",
          description: `تم استيراد ${successCount} دواء${errorCount > 0 ? ` وفشل ${errorCount}` : ''}`,
          variant: errorCount > 0 ? "destructive" : "default"
        });
      } catch {
        toast({ title: "خطأ", description: "تأكد من أن الملف بصيغة CSV صحيحة", variant: "destructive" });
      }
    };
    input.click();
  };

  const handleToggleActive = async (id: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase.from('medications').update({ is_active: !currentStatus }).eq('id', id);
      if (error) throw error;
      toast({ title: "تم التحديث", description: !currentStatus ? "تم تفعيل الدواء" : "تم إلغاء تفعيل الدواء" });
      refetch();
    } catch {
      toast({ title: "خطأ", description: "حدث خطأ أثناء التحديث", variant: "destructive" });
    }
  };

  const handleDeleteMedication = async (id: string, name: string) => {
    if (!confirm(`هل أنت متأكد من حذف "${name}"؟`)) return;
    try {
      const { error } = await supabase.from('medications').delete().eq('id', id);
      if (error) throw error;
      toast({ title: "تم الحذف", description: `تم حذف "${name}"` });
      refetch();
    } catch {
      toast({ title: "خطأ", description: "حدث خطأ أثناء الحذف", variant: "destructive" });
    }
  };

  const formOptions = [
    { value: "كبسول", label: "كبسول" }, { value: "أقراص", label: "أقراص" },
    { value: "سائل", label: "سائل" }, { value: "حقن", label: "حقن" },
    { value: "مرهم", label: "مرهم" }, { value: "قطرات", label: "قطرات" },
    { value: "بخاخ", label: "بخاخ" }, { value: "جل", label: "جل" },
    { value: "أخرى", label: "أخرى" }
  ];

  return (
    <PermissionGuard requiredPermissions={['inventory.view']}>
      <PageContainer>
        <PageHeader title="إدارة الأدوية" description="إضافة وإدارة قائمة الأدوية في العيادة" />

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold">{stats.total}</div>
              <p className="text-sm text-muted-foreground">إجمالي الأدوية</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold text-green-600">{stats.active}</div>
              <p className="text-sm text-muted-foreground">أدوية نشطة</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold text-destructive">{stats.prescription}</div>
              <p className="text-sm text-muted-foreground">بوصفة طبية</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold text-primary">{stats.otc}</div>
              <p className="text-sm text-muted-foreground">بدون وصفة</p>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          {/* Filters */}
          <Card>
            <CardHeader>
              <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
                <div className="flex items-center gap-4">
                  <CardTitle className="text-lg">البحث والفلترة</CardTitle>
                  <ToggleGroup type="single" value={viewMode} onValueChange={(v) => v && setViewMode(v)} className="border rounded-lg p-1">
                    <ToggleGroupItem value="cards"><Grid className="h-4 w-4" /></ToggleGroupItem>
                    <ToggleGroupItem value="list"><List className="h-4 w-4" /></ToggleGroupItem>
                  </ToggleGroup>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" onClick={handleImportExcel}><Upload className="h-4 w-4 ml-1" /> استيراد</Button>
                  <Button variant="outline" onClick={handleExportExcel}><Download className="h-4 w-4 ml-1" /> تصدير</Button>
                  <Button onClick={() => setShowAddDialog(true)}><Plus className="h-4 w-4 ml-1" /> إضافة دواء</Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                  <Input placeholder="البحث..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-10" />
                </div>
                <Select value={formFilter} onValueChange={setFormFilter}>
                  <SelectTrigger><SelectValue placeholder="الشكل الصيدلاني" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">جميع الأشكال</SelectItem>
                    {formOptions.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
                  </SelectContent>
                </Select>
                <Select value={prescriptionFilter} onValueChange={setPrescriptionFilter}>
                  <SelectTrigger><SelectValue placeholder="نوع الوصفة" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">جميع الأنواع</SelectItem>
                    <SelectItem value="prescription">بوصفة طبية</SelectItem>
                    <SelectItem value="otc">بدون وصفة</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={activeFilter} onValueChange={setActiveFilter}>
                  <SelectTrigger><SelectValue placeholder="الحالة" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">الكل</SelectItem>
                    <SelectItem value="active">نشطة</SelectItem>
                    <SelectItem value="inactive">غير نشطة</SelectItem>
                  </SelectContent>
                </Select>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Filter className="h-4 w-4" />
                  {filteredMedications.length} من {medications.length}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Cards View */}
          {viewMode === "cards" ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {isLoading ? (
                Array.from({ length: 6 }).map((_, i) => (
                  <Card key={i} className="animate-pulse">
                    <CardContent className="p-4 space-y-3">
                      <div className="h-4 bg-muted rounded w-3/4" />
                      <div className="h-3 bg-muted rounded w-1/2" />
                    </CardContent>
                  </Card>
                ))
              ) : filteredMedications.length === 0 ? (
                <Card className="col-span-full">
                  <CardContent className="p-8 text-center text-muted-foreground">
                    <p className="text-lg font-medium mb-2">لا توجد أدوية</p>
                    <p className="text-sm">{searchTerm || formFilter !== "all" ? "لم يتم العثور على نتائج مطابقة" : "لم يتم إضافة أدوية بعد"}</p>
                  </CardContent>
                </Card>
              ) : (
                filteredMedications.map((med) => (
                  <Card key={med.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-4 space-y-3">
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className="font-semibold text-lg">{med.trade_name}</h3>
                          {med.generic_name && <p className="text-sm text-muted-foreground">{med.generic_name}</p>}
                        </div>
                        <div className="flex flex-col gap-1">
                          <Badge variant={med.is_active ? "default" : "secondary"}>{med.is_active ? "نشط" : "غير نشط"}</Badge>
                          <Badge variant={med.prescription_type === "prescription" ? "destructive" : "outline"}>
                            {med.prescription_type === "prescription" ? "بوصفة" : "OTC"}
                          </Badge>
                        </div>
                      </div>
                      <div className="space-y-1 text-sm">
                        <div className="flex justify-between"><span className="text-muted-foreground">المقدار:</span><span>{med.strength}</span></div>
                        <div className="flex justify-between"><span className="text-muted-foreground">الشكل:</span><span>{med.form}</span></div>
                        <div className="flex justify-between"><span className="text-muted-foreground">الجرعة:</span><span>{med.frequency}</span></div>
                        {med.duration && <div className="flex justify-between"><span className="text-muted-foreground">المدة:</span><span>{med.duration}</span></div>}
                      </div>
                      {med.instructions && <p className="text-xs text-muted-foreground bg-muted p-2 rounded">{med.instructions}</p>}
                      <div className="flex gap-2 pt-2">
                        <Button variant="outline" size="sm" onClick={() => setEditingMedication(med)} className="flex-1">تعديل</Button>
                        <Button variant={med.is_active ? "destructive" : "default"} size="sm" onClick={() => handleToggleActive(med.id, med.is_active)} className="flex-1">
                          {med.is_active ? "إلغاء" : "تفعيل"}
                        </Button>
                        <Button variant="destructive" size="sm" onClick={() => handleDeleteMedication(med.id, med.trade_name)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
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
                        <TableRow key={i}>{Array.from({ length: 8 }).map((_, j) => (
                          <TableCell key={j}><div className="h-4 bg-muted rounded animate-pulse" /></TableCell>
                        ))}</TableRow>
                      ))
                    ) : filteredMedications.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">لا توجد أدوية</TableCell>
                      </TableRow>
                    ) : (
                      filteredMedications.map((med) => (
                        <TableRow key={med.id}>
                          <TableCell className="font-medium">{med.trade_name}</TableCell>
                          <TableCell>{med.generic_name || "-"}</TableCell>
                          <TableCell>{med.strength}</TableCell>
                          <TableCell>{med.form}</TableCell>
                          <TableCell>{med.frequency}</TableCell>
                          <TableCell>
                            <Badge variant={med.prescription_type === "prescription" ? "destructive" : "outline"}>
                              {med.prescription_type === "prescription" ? "بوصفة" : "بدون وصفة"}
                            </Badge>
                          </TableCell>
                          <TableCell><Badge variant={med.is_active ? "default" : "secondary"}>{med.is_active ? "نشط" : "غير نشط"}</Badge></TableCell>
                          <TableCell>
                            <div className="flex gap-1">
                              <Button variant="outline" size="sm" onClick={() => setEditingMedication(med)}>تعديل</Button>
                              <Button variant={med.is_active ? "destructive" : "default"} size="sm" onClick={() => handleToggleActive(med.id, med.is_active)}>
                                {med.is_active ? "إلغاء" : "تفعيل"}
                              </Button>
                              <Button variant="destructive" size="sm" onClick={() => handleDeleteMedication(med.id, med.trade_name)}>
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

        <AddMedicationDialog open={showAddDialog} onOpenChange={setShowAddDialog} onSuccess={() => { refetch(); setShowAddDialog(false); }} />
        {editingMedication && (
          <EditMedicationDialog open={!!editingMedication} onOpenChange={() => setEditingMedication(null)} medication={editingMedication} onSuccess={() => { refetch(); setEditingMedication(null); }} />
        )}
      </PageContainer>
    </PermissionGuard>
  );
};

export default Medications;
