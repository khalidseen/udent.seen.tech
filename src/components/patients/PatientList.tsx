import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { Search, Phone, Mail, Calendar, Edit, Eye, Activity } from "lucide-react";
import { format } from "date-fns";
import { ar } from "date-fns/locale";

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

interface PatientListProps {
  onViewDentalTreatments?: (patientId: string, patientName: string) => void;
}

const PatientList = ({ onViewDentalTreatments }: PatientListProps = {}) => {
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

  if (loading) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold">إدارة المرضى</h1>
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="h-20 bg-muted rounded"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">إدارة المرضى</h1>
        <p className="text-muted-foreground mt-2">عرض وإدارة بيانات جميع المرضى</p>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
        <Input
          placeholder="البحث باسم المريض، الهاتف، أو البريد الإلكتروني..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pr-10"
        />
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-primary">{patients.length}</div>
            <p className="text-sm text-muted-foreground">إجمالي المرضى</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-green-600">
              {patients.filter(p => p.gender === 'female').length}
            </div>
            <p className="text-sm text-muted-foreground">مريضات</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-blue-600">
              {patients.filter(p => p.gender === 'male').length}
            </div>
            <p className="text-sm text-muted-foreground">مرضى ذكور</p>
          </CardContent>
        </Card>
      </div>

      {/* Patient Cards */}
      <div className="space-y-4">
        {filteredPatients.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <p className="text-muted-foreground">لا توجد مرضى مسجلين حالياً</p>
            </CardContent>
          </Card>
        ) : (
          filteredPatients.map((patient) => (
            <Card key={patient.id} className="hover:shadow-lg transition-shadow">
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4 space-x-reverse">
                    <div>
                      <CardTitle className="text-lg">{patient.full_name}</CardTitle>
                      <div className="flex items-center space-x-2 space-x-reverse mt-1">
                        <Badge variant={patient.gender === 'male' ? 'default' : 'secondary'}>
                          {patient.gender === 'male' ? 'ذكر' : 'أنثى'}
                        </Badge>
                        {patient.date_of_birth && (
                          <span className="text-sm text-muted-foreground">
                            مواليد {format(new Date(patient.date_of_birth), 'yyyy/MM/dd', { locale: ar })}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex space-x-2 space-x-reverse">
                    {onViewDentalTreatments && (
                      <Button 
                        variant="default" 
                        size="sm"
                        onClick={() => onViewDentalTreatments(patient.id, patient.full_name)}
                      >
                        <Activity className="w-4 h-4 ml-1" />
                        علاجات الأسنان
                      </Button>
                    )}
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
    </div>
  );
};

export default PatientList;