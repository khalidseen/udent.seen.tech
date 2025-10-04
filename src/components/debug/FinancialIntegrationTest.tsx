import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import FinancialTestComponent from './FinancialTestComponent';
import FinancialStatusDialog from '../patients/FinancialStatusDialog';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { TestTube, Users, Search, Activity } from 'lucide-react';

interface Patient {
  id: string;
  full_name: string;
  phone?: string;
  financial_status?: string;
  financial_balance?: number;
}

const FinancialIntegrationTest: React.FC = () => {
  const [selectedPatientId, setSelectedPatientId] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [financialDialogOpen, setFinancialDialogOpen] = useState(false);
  const { profile } = useCurrentUser();

  // جلب المرضى
  const { data: patients = [], isLoading: patientsLoading } = useQuery({
    queryKey: ["patients-for-financial-test", profile?.id],
    queryFn: async () => {
      if (!profile?.id) return [];
      
      const { data, error } = await supabase
        .from("patients")
        .select("id, full_name, phone, financial_status, financial_balance")
        .eq("clinic_id", profile.id)
        .order("full_name");

      if (error) throw error;
      return data as Patient[];
    },
    enabled: !!profile?.id
  });

  const filteredPatients = patients.filter(patient =>
    patient.full_name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const selectedPatient = patients.find(p => p.id === selectedPatientId);

  return (
    <div className="space-y-6 p-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TestTube className="h-5 w-5" />
            اختبار تكامل النظام المالي
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-sm text-gray-600 space-y-2">
            <p>• اختبار الـ Hook المشترك للبيانات المالية</p>
            <p>• اختبار التزامن بين مربعات المرضى وصفحات التفاصيل</p>
            <p>• اختبار navigation من الحوار إلى الصفحة الكاملة</p>
            <p>• اختبار تحديث البيانات في الوقت الفعلي</p>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* قائمة المرضى */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              اختيار مريض للاختبار
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="search">البحث عن مريض</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  id="search"
                  placeholder="اكتب اسم المريض..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            {patientsLoading ? (
              <div className="text-center py-4">جاري تحميل المرضى...</div>
            ) : (
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {filteredPatients.length === 0 ? (
                  <div className="text-center py-4 text-gray-500">
                    لا يوجد مرضى مطابقون للبحث
                  </div>
                ) : (
                  filteredPatients.map((patient) => (
                    <div
                      key={patient.id}
                      className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                        selectedPatientId === patient.id
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                      onClick={() => setSelectedPatientId(patient.id)}
                    >
                      <div className="flex justify-between items-center">
                        <div>
                          <div className="font-medium">{patient.full_name}</div>
                          <div className="text-sm text-gray-500">{patient.phone}</div>
                        </div>
                        <div className="text-right">
                          <div className="text-sm font-medium">
                            رصيد: {patient.financial_balance || 0}
                          </div>
                          <div className="text-xs text-gray-500">
                            {patient.financial_status || 'غير محدد'}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}

            {selectedPatient && (
              <div className="pt-4 border-t space-y-2">
                <Button
                  onClick={() => setFinancialDialogOpen(true)}
                  className="w-full"
                >
                  <Activity className="h-4 w-4 ml-2" />
                  فتح حوار الحالة المالية
                </Button>
                <div className="text-xs text-gray-500 text-center">
                  المريض المحدد: {selectedPatient.full_name}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* اختبار الـ Hook */}
        <div className="space-y-4">
          {selectedPatient ? (
            <FinancialTestComponent
              patientId={selectedPatient.id}
              patientName={selectedPatient.full_name}
            />
          ) : (
            <Card>
              <CardContent className="text-center py-8">
                <Users className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p className="text-gray-500">اختر مريضاً لعرض البيانات المالية</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* حوار الحالة المالية */}
      {selectedPatient && (
        <FinancialStatusDialog
          patient={selectedPatient}
          isOpen={financialDialogOpen}
          onClose={() => setFinancialDialogOpen(false)}
        />
      )}

      {/* معلومات إضافية */}
      <Card>
        <CardHeader>
          <CardTitle>معلومات الاختبار</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div>
              <div className="font-medium text-gray-700">المرضى المحملون</div>
              <div className="text-lg font-bold">{patients.length}</div>
            </div>
            <div>
              <div className="font-medium text-gray-700">المريض المحدد</div>
              <div className="text-lg font-bold">
                {selectedPatient ? '✓' : '✗'}
              </div>
            </div>
            <div>
              <div className="font-medium text-gray-700">حالة الحوار</div>
              <div className="text-lg font-bold">
                {financialDialogOpen ? 'مفتوح' : 'مغلق'}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default FinancialIntegrationTest;