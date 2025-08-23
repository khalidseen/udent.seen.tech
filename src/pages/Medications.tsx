import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Plus, Search, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
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
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

const Medications = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [formFilter, setFormFilter] = useState<string>("all");
  const [activeFilter, setActiveFilter] = useState<string>("active");
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

  const filteredMedications = medications.filter(medication => {
    const matchesSearch = 
      medication.trade_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (medication.generic_name && medication.generic_name.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesForm = formFilter === "all" || medication.form === formFilter;
    const matchesActive = activeFilter === "all" || 
      (activeFilter === "active" && medication.is_active) ||
      (activeFilter === "inactive" && !medication.is_active);

    return matchesSearch && matchesForm && matchesActive;
  });

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
              <CardTitle className="text-lg">البحث والفلترة</CardTitle>
              <Button onClick={() => setShowAddDialog(true)} className="flex items-center gap-2">
                <Plus className="h-4 w-4" />
                إضافة دواء جديد
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
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

        {/* Medications List */}
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
                  {searchTerm || formFilter !== "all" || activeFilter !== "active" 
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
                      <div className="flex items-center gap-2">
                        <Badge variant={medication.is_active ? "default" : "secondary"}>
                          {medication.is_active ? "نشط" : "غير نشط"}
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
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
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