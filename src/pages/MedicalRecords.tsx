import { PageContainer } from "@/components/layout/PageContainer";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { FileText, Search, Plus, Eye, Edit, Download } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { ar } from "date-fns/locale";

export default function MedicalRecords() {
  const [searchQuery, setSearchQuery] = useState("");
  const navigate = useNavigate();

  const { data: records, isLoading } = useQuery({
    queryKey: ['medical-records'],
    queryFn: async () => {
      const { data: profile } = await supabase
        .from('profiles')
        .select('id')
        .eq('user_id', (await supabase.auth.getUser()).data.user?.id)
        .single();

      if (!profile) throw new Error('Profile not found');

      const { data, error } = await supabase
        .from('medical_records')
        .select('*, patients(full_name)')
        .eq('clinic_id', profile.id)
        .order('treatment_date', { ascending: false });

      if (error) throw error;
      return data || [];
    },
  });

  const filteredRecords = (records || []).filter(record =>
    record.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (record.patients as any)?.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    record.record_type?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const completedCount = records?.filter(r => r.record_type === 'completed' || r.diagnosis).length || 0;
  const pendingCount = (records?.length || 0) - completedCount;

  return (
    <PageContainer>
      <PageHeader
        title="السجلات الطبية"
        description="عرض وإدارة السجلات الطبية للمرضى"
        action={
          <Button onClick={() => navigate("/advanced-medical-records")}>
            <Plus className="w-4 h-4 ml-2" />
            إضافة سجل جديد
          </Button>
        }
      />

      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="flex gap-4">
            <div className="relative flex-1">
              <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="البحث في السجلات الطبية..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pr-10"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">إجمالي السجلات</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{records?.length || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">مع تشخيص</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{completedCount}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">بدون تشخيص</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{pendingCount}</div>
          </CardContent>
        </Card>
      </div>

      {isLoading ? (
        <div className="text-center py-12">جاري التحميل...</div>
      ) : (
        <div className="space-y-4">
          {filteredRecords.length === 0 ? (
            <Card className="text-center py-12">
              <CardContent>
                <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">لا توجد سجلات</h3>
                <p className="text-muted-foreground mb-4">
                  {searchQuery ? 'لم يتم العثور على سجلات مطابقة للبحث' : 'لم يتم إضافة أي سجلات طبية بعد'}
                </p>
                <Button onClick={() => navigate("/advanced-medical-records")}>
                  <Plus className="w-4 h-4 ml-2" />
                  إضافة أول سجل
                </Button>
              </CardContent>
            </Card>
          ) : (
            filteredRecords.map((record) => (
              <Card key={record.id} className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                        <FileText className="w-6 h-6 text-primary" />
                      </div>
                      <div>
                        <CardTitle className="text-lg">{record.title}</CardTitle>
                        <CardDescription>
                          {(record.patients as any)?.full_name || 'مريض غير معروف'} • {record.record_type}
                        </CardDescription>
                      </div>
                    </div>
                    <Badge variant={record.diagnosis ? "default" : "secondary"}>
                      {record.diagnosis ? "مكتمل" : "قيد المراجعة"}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <div className="text-sm text-muted-foreground space-y-1">
                      <p>التاريخ: {format(new Date(record.treatment_date), 'PPP', { locale: ar })}</p>
                      {record.diagnosis && <p>التشخيص: {record.diagnosis}</p>}
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm">
                        <Eye className="w-4 h-4 ml-1" />
                        عرض
                      </Button>
                      <Button variant="outline" size="sm">
                        <Edit className="w-4 h-4 ml-1" />
                        تعديل
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      )}

      <Card className="mt-6">
        <CardHeader>
          <CardTitle>روابط سريعة</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Button variant="outline" className="w-full justify-start" onClick={() => navigate("/advanced-medical-records")}>
            <FileText className="w-4 h-4 ml-2" />
            السجلات الطبية المتقدمة
          </Button>
          <Button variant="outline" className="w-full justify-start" onClick={() => navigate("/dental-treatments")}>
            <FileText className="w-4 h-4 ml-2" />
            العلاجات السنية
          </Button>
          <Button variant="outline" className="w-full justify-start" onClick={() => navigate("/prescriptions")}>
            <FileText className="w-4 h-4 ml-2" />
            الوصفات الطبية
          </Button>
        </CardContent>
      </Card>
    </PageContainer>
  );
}
