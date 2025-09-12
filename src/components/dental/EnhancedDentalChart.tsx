import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  Stethoscope, 
  Activity, 
  AlertTriangle, 
  CheckCircle, 
  Info
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface EnhancedDentalChartProps {
  patientId: string;
  selectedTooth?: string;
  onToothSelect?: (toothNumber: string, system: 'fdi' | 'universal' | 'palmer') => void;
}

const EnhancedDentalChart: React.FC<EnhancedDentalChartProps> = ({
  patientId,
  selectedTooth,
  onToothSelect
}) => {
  const [toothRecords, setToothRecords] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Load tooth records
  useEffect(() => {
    const loadToothRecords = async () => {
      if (!patientId) return;
      
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('advanced_tooth_notes')
          .select('*')
          .eq('patient_id', patientId);
        
        if (error) throw error;
        setToothRecords(data || []);
      } catch (error) {
        console.error('Error loading tooth records:', error);
      } finally {
        setLoading(false);
      }
    };

    loadToothRecords();
  }, [patientId]);

  if (loading) {
    return (
      <Card className="w-full h-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Stethoscope className="w-5 h-5" />
            مخطط الأسنان المطور
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Skeleton className="w-full h-96" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Stethoscope className="w-5 h-5" />
          مخطط الأسنان المطور
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Statistics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
            <div className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-green-600" />
              <div>
                <p className="text-sm text-green-600">الأسنان السليمة</p>
                <p className="text-2xl font-bold text-green-700">{toothRecords.filter(r => r.diagnosis?.primary_condition === 'healthy').length}</p>
              </div>
            </div>
          </div>
          <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-lg">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-red-600" />
              <div>
                <p className="text-sm text-red-600">تحتاج علاج</p>
                <p className="text-2xl font-bold text-red-700">{toothRecords.filter(r => r.diagnosis?.primary_condition !== 'healthy').length}</p>
              </div>
            </div>
          </div>
          <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
            <div className="flex items-center gap-2">
              <Activity className="w-5 h-5 text-blue-600" />
              <div>
                <p className="text-sm text-blue-600">إجمالي السجلات</p>
                <p className="text-2xl font-bold text-blue-700">{toothRecords.length}</p>
              </div>
            </div>
          </div>
          <div className="bg-yellow-50 dark:bg-yellow-900/20 p-4 rounded-lg">
            <div className="flex items-center gap-2">
              <Info className="w-5 h-5 text-yellow-600" />
              <div>
                <p className="text-sm text-yellow-600">قيد المراجعة</p>
                <p className="text-2xl font-bold text-yellow-700">{toothRecords.filter(r => r.status === 'active').length}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Dental Chart Placeholder */}
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
          <Stethoscope className="w-16 h-16 mx-auto mb-4 text-gray-400" />
          <h3 className="text-lg font-semibold mb-2 text-gray-600">مخطط الأسنان التفاعلي</h3>
          <p className="text-gray-500 mb-4">سيتم إضافة مخطط الأسنان التفاعلي المطور قريباً</p>
          
          {/* Simple Tooth Numbers Grid */}
          <div className="grid grid-cols-8 gap-2 max-w-md mx-auto">
            {Array.from({ length: 32 }, (_, i) => {
              const toothNumber = (i + 1).toString();
              const hasRecord = toothRecords.some(r => r.tooth_number === toothNumber);
              
              return (
                <Button
                  key={toothNumber}
                  variant={hasRecord ? "default" : "outline"}
                  size="sm"
                  className="w-10 h-10 p-0 text-xs"
                  onClick={() => onToothSelect?.(toothNumber, 'fdi')}
                >
                  {toothNumber}
                </Button>
              );
            })}
          </div>
        </div>

        {/* Records List */}
        {toothRecords.length > 0 && (
          <div className="space-y-3">
            <h4 className="font-medium">سجلات الأسنان الحالية:</h4>
            <div className="space-y-2 max-h-40 overflow-y-auto">
              {toothRecords.map((record) => (
                <div key={record.id} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                  <div>
                    <span className="font-medium">السن {record.tooth_number}</span>
                    <span className="text-sm text-muted-foreground ml-2">{record.title}</span>
                  </div>
                  <Badge variant={record.status === 'active' ? 'default' : 'secondary'}>
                    {record.status === 'active' ? 'نشط' : 'مكتمل'}
                  </Badge>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default EnhancedDentalChart;