import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { Search, Phone, Mail, Calendar, Edit, Eye, Activity, Plus } from "lucide-react";
import { format } from "date-fns";
import { ar } from "date-fns/locale";
import { Link } from "react-router-dom";
import { PageContainer } from "@/components/layout/PageContainer";
import { PageHeader } from "@/components/layout/PageHeader";

interface Patient {
  id: string;
  full_name: string;
  phone: string;
  email: string;
  date_of_birth: string;
  gender: string;
  address: string;
  medical_history: string;
  created_at: string;
}

const PatientList = () => {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    fetchPatients();
  }, []);

  const fetchPatients = async () => {
    try {
      const { data, error } = await supabase
        .from('patients')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setPatients(data || []);
    } catch (error) {
      console.error('Error fetching patients:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredPatients = patients.filter(patient =>
    patient.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    patient.phone?.includes(searchTerm) ||
    patient.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getGenderBadge = (gender: string) => {
    return gender === 'male' ? (
      <Badge variant="outline">ذكر</Badge>
    ) : gender === 'female' ? (
      <Badge variant="outline">أنثى</Badge>
    ) : null;
  };

  if (loading) {
    return (
      <PageContainer>
        <PageHeader title="المرضى" description="جاري تحميل البيانات..." />
        <Card>
          <CardContent className="p-6">
            <div className="text-center">جاري التحميل...</div>
          </CardContent>
        </Card>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <PageHeader 
        title="إدارة المرضى" 
        description="إدارة بيانات المرضى والسجلات الطبية"
        action={
          <Link to="/add-patient">
            <Button>
              <Plus className="w-4 h-4 ml-2" />
              إضافة مريض جديد
            </Button>
          </Link>
        }
      />

      {/* Search */}
      <Card>
        <CardContent className="p-4">
          <div className="relative">
            <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="البحث في المرضى..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pr-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Patient Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">{patients.length}</div>
              <div className="text-sm text-muted-foreground">إجمالي المرضى</div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {patients.filter(p => p.gender === 'female').length}
              </div>
              <div className="text-sm text-muted-foreground">المريضات</div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                {patients.filter(p => p.gender === 'male').length}
              </div>
              <div className="text-sm text-muted-foreground">المرضى الذكور</div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Patients List */}
      <div className="grid gap-4">
        {filteredPatients.length === 0 ? (
          <Card>
            <CardContent className="p-6">
              <div className="text-center text-muted-foreground">
                {searchTerm ? 'لا توجد نتائج للبحث' : 'لا توجد مرضى مسجلين'}
              </div>
            </CardContent>
          </Card>
        ) : (
          filteredPatients.map((patient) => (
            <Card key={patient.id} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div className="flex items-center space-x-3 space-x-reverse">
                    <CardTitle className="text-xl">{patient.full_name}</CardTitle>
                    {getGenderBadge(patient.gender)}
                    {patient.date_of_birth && (
                      <Badge variant="secondary">
                        {new Date().getFullYear() - new Date(patient.date_of_birth).getFullYear()} سنة
                      </Badge>
                    )}
                  </div>
                  <div className="flex space-x-2 space-x-reverse">
                    <Link to="/treatments" state={{ patientId: patient.id }}>
                      <Button variant="default" size="sm">
                        <Activity className="w-4 h-4 ml-1" />
                        علاجات الأسنان
                      </Button>
                    </Link>
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
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {patient.phone && (
                    <div className="flex items-center space-x-2 space-x-reverse">
                      <Phone className="w-4 h-4 text-muted-foreground" />
                      <span className="text-sm">{patient.phone}</span>
                    </div>
                  )}
                  {patient.email && (
                    <div className="flex items-center space-x-2 space-x-reverse">
                      <Mail className="w-4 h-4 text-muted-foreground" />
                      <span className="text-sm">{patient.email}</span>
                    </div>
                  )}
                  <div className="flex items-center space-x-2 space-x-reverse">
                    <Calendar className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm">
                      مسجل {format(new Date(patient.created_at), 'yyyy/MM/dd', { locale: ar })}
                    </span>
                  </div>
                </div>
                {patient.address && (
                  <div className="mt-3">
                    <p className="text-sm text-muted-foreground">العنوان: {patient.address}</p>
                  </div>
                )}
                {patient.medical_history && (
                  <div className="mt-3">
                    <p className="text-sm text-muted-foreground">التاريخ المرضي: {patient.medical_history}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </PageContainer>
  );
};

export default PatientList;