import { PageContainer } from "@/components/layout/PageContainer";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { FileText, Search, Plus, Eye, Edit, Download } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";

export default function MedicalRecords() {
  const [searchQuery, setSearchQuery] = useState("");
  const navigate = useNavigate();

  // Sample medical records data
  const medicalRecords = [
    {
      id: "1",
      patientName: "أحمد محمد",
      patientId: "P001",
      recordType: "فحص دوري",
      date: "2024-01-15",
      doctor: "د. خالد أحمد",
      status: "مكتمل"
    },
    {
      id: "2",
      patientName: "فاطمة علي",
      patientId: "P002",
      recordType: "علاج أسنان",
      date: "2024-01-14",
      doctor: "د. سارة محمد",
      status: "مكتمل"
    },
    {
      id: "3",
      patientName: "محمد سعيد",
      patientId: "P003",
      recordType: "استشارة",
      date: "2024-01-13",
      doctor: "د. خالد أحمد",
      status: "قيد المراجعة"
    }
  ];

  const filteredRecords = medicalRecords.filter(record =>
    record.patientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    record.patientId.toLowerCase().includes(searchQuery.toLowerCase()) ||
    record.recordType.toLowerCase().includes(searchQuery.toLowerCase())
  );

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

      {/* Search and Filter */}
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
            <Button variant="outline">تصفية</Button>
          </div>
        </CardContent>
      </Card>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              إجمالي السجلات
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{medicalRecords.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              السجلات المكتملة
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {medicalRecords.filter(r => r.status === "مكتمل").length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              قيد المراجعة
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">
              {medicalRecords.filter(r => r.status === "قيد المراجعة").length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              هذا الشهر
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">3</div>
          </CardContent>
        </Card>
      </div>

      {/* Records List */}
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
                    <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                      <FileText className="w-6 h-6 text-blue-600" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">{record.patientName}</CardTitle>
                      <CardDescription>
                        {record.patientId} • {record.recordType}
                      </CardDescription>
                    </div>
                  </div>
                  <Badge variant={record.status === "مكتمل" ? "default" : "secondary"}>
                    {record.status}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div className="text-sm text-muted-foreground space-y-1">
                    <p>التاريخ: {record.date}</p>
                    <p>الطبيب: {record.doctor}</p>
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
                    <Button variant="outline" size="sm">
                      <Download className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Quick Links */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>روابط سريعة</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Button 
            variant="outline" 
            className="w-full justify-start"
            onClick={() => navigate("/advanced-medical-records")}
          >
            <FileText className="w-4 h-4 ml-2" />
            السجلات الطبية المتقدمة
          </Button>
          <Button 
            variant="outline" 
            className="w-full justify-start"
            onClick={() => navigate("/dental-treatments")}
          >
            <FileText className="w-4 h-4 ml-2" />
            العلاجات السنية
          </Button>
          <Button 
            variant="outline" 
            className="w-full justify-start"
            onClick={() => navigate("/prescriptions")}
          >
            <FileText className="w-4 h-4 ml-2" />
            الوصفات الطبية
          </Button>
        </CardContent>
      </Card>
    </PageContainer>
  );
}
