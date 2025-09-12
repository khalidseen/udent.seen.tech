// 🦷 Enhanced Dental Chart Hook
// Custom Hook لإدارة بيانات مخطط الأسنان

import { useState, useEffect, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import {
  ToothRecord,
  ToothNumberingSystem,
  ConditionType,
  WHO_COLORS
} from '@/types/dentalChart';

interface UseDentalChartProps {
  patientId: string;
  numberingSystem?: ToothNumberingSystem;
}

interface DentalChartData {
  records: Map<string, ToothRecord>;
  loading: boolean;
  error: string | null;
}

export const useDentalChart = ({ 
  patientId, 
  numberingSystem = ToothNumberingSystem.FDI 
}: UseDentalChartProps) => {
  const [data, setData] = useState<DentalChartData>({
    records: new Map(),
    loading: true,
    error: null
  });
  
  const { toast } = useToast();

  // تحميل بيانات الأسنان من قاعدة البيانات
  const loadToothRecords = useCallback(async () => {
    try {
      setData(prev => ({ ...prev, loading: true, error: null }));

      const { data: records, error } = await supabase
        .from('tooth_records')
        .select('*')
        .eq('patient_id', patientId)
        .order('created_at', { ascending: false });

      if (error) {
        throw error;
      }

      const recordsMap = new Map<string, ToothRecord>();
      records?.forEach(record => {
        recordsMap.set(record.tooth_number, record);
      });

      setData({
        records: recordsMap,
        loading: false,
        error: null
      });

    } catch (error) {
      console.error('خطأ في تحميل بيانات الأسنان:', error);
      setData(prev => ({
        ...prev,
        loading: false,
        error: 'فشل في تحميل بيانات الأسنان'
      }));

      toast({
        title: "خطأ في التحميل",
        description: "فشل في تحميل بيانات الأسنان",
        variant: "destructive"
      });
    }
  }, [patientId, toast]);

  // حفظ سجل سن
  const saveToothRecord = useCallback(async (record: ToothRecord) => {
    try {
      // حفظ محلياً أولاً
      setData(prev => ({
        ...prev,
        records: new Map(prev.records.set(record.tooth_number, record))
      }));

      // حفظ في قاعدة البيانات
      const { error } = await supabase
        .from('tooth_records')
        .upsert(record, {
          onConflict: 'patient_id,tooth_number'
        });

      if (error) {
        throw error;
      }

      toast({
        title: "تم الحفظ",
        description: `تم حفظ بيانات السن ${record.tooth_number} بنجاح`
      });

    } catch (error) {
      console.error('خطأ في حفظ بيانات السن:', error);
      toast({
        title: "خطأ في الحفظ",
        description: "فشل في حفظ بيانات السن",
        variant: "destructive"
      });
      
      // التراجع عن التغيير المحلي
      await loadToothRecords();
    }
  }, [toast, loadToothRecords]);

  // حذف سجل سن
  const deleteToothRecord = useCallback(async (toothNumber: string) => {
    try {
      const { error } = await supabase
        .from('tooth_records')
        .delete()
        .eq('patient_id', patientId)
        .eq('tooth_number', toothNumber);

      if (error) {
        throw error;
      }

      setData(prev => {
        const newRecords = new Map(prev.records);
        newRecords.delete(toothNumber);
        return { ...prev, records: newRecords };
      });

      toast({
        title: "تم الحذف",
        description: `تم حذف بيانات السن ${toothNumber}`
      });

    } catch (error) {
      console.error('خطأ في حذف بيانات السن:', error);
      toast({
        title: "خطأ في الحذف",
        description: "فشل في حذف بيانات السن",
        variant: "destructive"
      });
    }
  }, [patientId, toast]);

  // الحصول على لون السن حسب حالته
  const getToothColor = useCallback((toothNumber: string): string => {
    const record = data.records.get(toothNumber);
    if (!record) return WHO_COLORS[ConditionType.SOUND];
    
    return WHO_COLORS[record.diagnosis.primary_condition] || WHO_COLORS[ConditionType.SOUND];
  }, [data.records]);

  // التحقق من وجود صورة للسن
  const hasToothImage = useCallback((toothNumber: string): boolean => {
    const record = data.records.get(toothNumber);
    return !!(record?.diagnosis.image_data || record?.diagnosis.image_url);
  }, [data.records]);

  // الحصول على أولوية السن
  const getToothPriority = useCallback((toothNumber: string) => {
    const record = data.records.get(toothNumber);
    return record?.diagnosis.priority_level;
  }, [data.records]);

  // الحصول على تخطيط الأسنان حسب نظام الترقيم
  const getToothLayout = useCallback(() => {
    switch (numberingSystem) {
      case ToothNumberingSystem.FDI:
        return {
          upperRight: ['18', '17', '16', '15', '14', '13', '12', '11'],
          upperLeft: ['21', '22', '23', '24', '25', '26', '27', '28'],
          lowerRight: ['48', '47', '46', '45', '44', '43', '42', '41'],
          lowerLeft: ['31', '32', '33', '34', '35', '36', '37', '38']
        };
      case ToothNumberingSystem.UNIVERSAL:
        return {
          upperRight: ['1', '2', '3', '4', '5', '6', '7', '8'],
          upperLeft: ['9', '10', '11', '12', '13', '14', '15', '16'],
          lowerRight: ['32', '31', '30', '29', '28', '27', '26', '25'],
          lowerLeft: ['24', '23', '22', '21', '20', '19', '18', '17']
        };
      case ToothNumberingSystem.PALMER:
        return {
          upperRight: ['8', '7', '6', '5', '4', '3', '2', '1'],
          upperLeft: ['1', '2', '3', '4', '5', '6', '7', '8'],
          lowerRight: ['8', '7', '6', '5', '4', '3', '2', '1'],
          lowerLeft: ['1', '2', '3', '4', '5', '6', '7', '8']
        };
      default:
        return {
          upperRight: ['18', '17', '16', '15', '14', '13', '12', '11'],
          upperLeft: ['21', '22', '23', '24', '25', '26', '27', '28'],
          lowerRight: ['48', '47', '46', '45', '44', '43', '42', '41'],
          lowerLeft: ['31', '32', '33', '34', '35', '36', '37', '38']
        };
    }
  }, [numberingSystem]);

  // تصدير البيانات
  const exportData = useCallback(async (format: 'json' | 'pdf' | 'csv') => {
    try {
      const allRecords = Array.from(data.records.values());
      
      switch (format) {
        case 'json':
          const jsonData = JSON.stringify(allRecords, null, 2);
          const jsonBlob = new Blob([jsonData], { type: 'application/json' });
          const jsonUrl = URL.createObjectURL(jsonBlob);
          const jsonLink = document.createElement('a');
          jsonLink.href = jsonUrl;
          jsonLink.download = `dental-chart-${patientId}-${Date.now()}.json`;
          jsonLink.click();
          URL.revokeObjectURL(jsonUrl);
          break;
          
        case 'csv':
          const csvHeaders = [
            'رقم السن',
            'الحالة الأساسية',
            'مستوى الأولوية',
            'رمز ICD-10',
            'ملاحظات التشخيص',
            'تاريخ الإنشاء'
          ];
          
          const csvRows = allRecords.map(record => [
            record.tooth_number,
            record.diagnosis.primary_condition,
            record.diagnosis.priority_level,
            record.diagnosis.icd10_code || '',
            record.diagnosis.diagnosis_notes || '',
            record.created_at
          ]);
          
          const csvContent = [csvHeaders, ...csvRows]
            .map(row => row.map(cell => `"${cell}"`).join(','))
            .join('\n');
            
          const csvBlob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
          const csvUrl = URL.createObjectURL(csvBlob);
          const csvLink = document.createElement('a');
          csvLink.href = csvUrl;
          csvLink.download = `dental-chart-${patientId}-${Date.now()}.csv`;
          csvLink.click();
          URL.revokeObjectURL(csvUrl);
          break;
          
        case 'pdf':
          // يمكن إضافة مكتبة PDF مثل jsPDF
          toast({
            title: "قريباً",
            description: "تصدير PDF سيكون متاحاً قريباً"
          });
          break;
      }
      
      toast({
        title: "تم التصدير",
        description: `تم تصدير البيانات بصيغة ${format.toUpperCase()}`
      });
      
    } catch (error) {
      console.error('خطأ في التصدير:', error);
      toast({
        title: "خطأ في التصدير",
        description: "فشل في تصدير البيانات",
        variant: "destructive"
      });
    }
  }, [data.records, patientId, toast]);

  // إحصائيات مخطط الأسنان
  const getStatistics = useCallback(() => {
    const allRecords = Array.from(data.records.values());
    const total = 32; // إجمالي الأسنان
    const recorded = allRecords.length;
    const healthy = allRecords.filter(r => r.diagnosis.primary_condition === ConditionType.SOUND).length;
    const needsTreatment = allRecords.filter(r => 
      r.diagnosis.primary_condition === ConditionType.DECAY ||
      r.diagnosis.primary_condition === ConditionType.NEEDS_TREATMENT
    ).length;
    const treated = allRecords.filter(r => 
      r.diagnosis.primary_condition === ConditionType.FILLED ||
      r.diagnosis.primary_condition === ConditionType.CROWN ||
      r.diagnosis.primary_condition === ConditionType.ROOT_CANAL
    ).length;
    const missing = allRecords.filter(r => 
      r.diagnosis.primary_condition === ConditionType.MISSING ||
      r.diagnosis.primary_condition === ConditionType.EXTRACTED
    ).length;

    return {
      total,
      recorded,
      unrecorded: total - recorded,
      healthy,
      needsTreatment,
      treated,
      missing,
      percentageRecorded: Math.round((recorded / total) * 100),
      percentageHealthy: recorded > 0 ? Math.round((healthy / recorded) * 100) : 0
    };
  }, [data.records]);

  // تحميل البيانات عند التحميل الأول
  useEffect(() => {
    loadToothRecords();
  }, [loadToothRecords]);

  return {
    // البيانات
    records: data.records,
    loading: data.loading,
    error: data.error,
    
    // الوظائف
    saveToothRecord,
    deleteToothRecord,
    loadToothRecords,
    
    // المساعدات
    getToothColor,
    hasToothImage,
    getToothPriority,
    getToothLayout,
    
    // التصدير والإحصائيات
    exportData,
    getStatistics
  };
};
