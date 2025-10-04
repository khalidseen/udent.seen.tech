// 🦷 Enhanced Dental Chart Hook - Database Version
// هوك شامل لإدارة مخطط الأسنان المحسن مع قاعدة البيانات المتطورة

import { useState, useEffect, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import {
  ToothRecord,
  ToothNumberingSystem,
  ConditionType,
  WHO_COLORS,
  ExportFormat,
  ChartStatistics
} from '@/types/dentalChart';
import {
  DatabaseToothRecord,
  DentalChartStatistics,
  DiagnosisTemplate,
  ToothSearchResult,
  toothRecordToDatabase,
  databaseToToothRecord
} from '@/types/dentalChartDatabase';

interface UseDentalChartProps {
  patientId: string;
  clinicId: string;
  numberingSystem?: ToothNumberingSystem;
}

interface DentalChartData {
  records: Map<string, ToothRecord>;
  loading: boolean;
  error: string | null;
  statistics: ChartStatistics | null;
}

export const useDentalChartEnhanced = ({ 
  patientId, 
  clinicId,
  numberingSystem = ToothNumberingSystem.FDI 
}: UseDentalChartProps) => {
  const [data, setData] = useState<DentalChartData>({
    records: new Map(),
    loading: false,
    error: null,
    statistics: null
  });

  const { toast } = useToast();

  // تحميل بيانات الأسنان من قاعدة البيانات
  const loadToothRecords = useCallback(async () => {
    setData(prev => ({ ...prev, loading: true, error: null }));

    try {
      const { data: records, error } = await supabase
        .from('tooth_records')
        .select('*')
        .eq('patient_id', patientId)
        .eq('clinic_id', clinicId);

      if (error) throw error;

      const recordsMap = new Map<string, ToothRecord>();
      
      records?.forEach(dbRecord => {
        const toothRecord = databaseToToothRecord(dbRecord);
        recordsMap.set(toothRecord.toothNumber, toothRecord);
      });

      // جلب الإحصائيات
      const { data: stats } = await supabase
        .rpc('get_dental_chart_statistics', {
          patient_uuid: patientId
        });

      // إحصائيات افتراضية للتجريب إذا لم تعمل الدالة
      const defaultStats = {
        totalTeeth: 32,
        recordedTeeth: recordsMap.size,
        healthyTeeth: Array.from(recordsMap.values()).filter(r => r.condition === 'sound').length,
        decayedTeeth: Array.from(recordsMap.values()).filter(r => r.condition === 'decay').length,
        filledTeeth: Array.from(recordsMap.values()).filter(r => r.condition === 'filled').length,
        missingTeeth: Array.from(recordsMap.values()).filter(r => r.condition === 'missing').length,
        urgentCases: Array.from(recordsMap.values()).filter(r => r.priority === 'urgent' || r.priority === 'emergency').length,
        withImages: Array.from(recordsMap.values()).filter(r => r.imageUrl || r.imageData).length,
        lastUpdated: new Date().toISOString()
      };

      setData(prev => ({
        ...prev,
        records: recordsMap,
        statistics: stats ? {
          totalTeeth: stats.total_teeth,
          recordedTeeth: stats.recorded_teeth,
          healthyTeeth: stats.healthy_teeth,
          decayedTeeth: stats.decay_teeth,
          filledTeeth: stats.filled_teeth,
          missingTeeth: stats.missing_teeth,
          urgentCases: stats.urgent_cases,
          withImages: stats.with_images,
          lastUpdated: stats.last_updated
        } : defaultStats,
        loading: false
      }));

    } catch (error) {
      console.error('Error loading tooth records:', error);
      setData(prev => ({
        ...prev,
        error: 'فشل في تحميل بيانات الأسنان',
        loading: false
      }));
      
      toast({
        title: 'خطأ',
        description: 'فشل في تحميل بيانات مخطط الأسنان',
        variant: 'destructive',
      });
    }
  }, [patientId, clinicId, toast]);

  // حفظ سجل سن واحد
  const saveToothRecord = useCallback(async (record: ToothRecord) => {
    try {
      const dbRecord = toothRecordToDatabase({
        ...record,
        patientId,
        clinicId
      });

      const { data, error } = await supabase
        .from('tooth_records')
        .upsert(dbRecord, {
          onConflict: 'patient_id,tooth_number'
        })
        .select()
        .single();

      if (error) throw error;

      const updatedRecord = databaseToToothRecord(data);
      
      setData(prev => ({
        ...prev,
        records: new Map(prev.records.set(record.toothNumber, updatedRecord))
      }));

      toast({
        title: 'تم الحفظ',
        description: `تم حفظ بيانات السن ${record.toothNumber} بنجاح`,
      });

      // إعادة تحميل الإحصائيات
      loadToothRecords();
      
      return updatedRecord;
    } catch (error) {
      console.error('Error saving tooth record:', error);
      toast({
        title: 'خطأ في الحفظ',
        description: 'فشل في حفظ بيانات السن',
        variant: 'destructive',
      });
      throw error;
    }
  }, [patientId, clinicId, toast, loadToothRecords]);

  // حذف سجل سن
  const deleteToothRecord = useCallback(async (toothNumber: string) => {
    try {
      const { error } = await supabase
        .from('tooth_records')
        .delete()
        .eq('patient_id', patientId)
        .eq('tooth_number', toothNumber);

      if (error) throw error;

      setData(prev => {
        const newRecords = new Map(prev.records);
        newRecords.delete(toothNumber);
        return { ...prev, records: newRecords };
      });

      toast({
        title: 'تم الحذف',
        description: `تم حذف بيانات السن ${toothNumber}`,
      });

      // إعادة تحميل الإحصائيات
      loadToothRecords();
    } catch (error) {
      console.error('Error deleting tooth record:', error);
      toast({
        title: 'خطأ في الحذف',
        description: 'فشل في حذف بيانات السن',
        variant: 'destructive',
      });
    }
  }, [patientId, toast, loadToothRecords]);

  // رفع صورة لسن
  const uploadToothImage = useCallback(async (
    toothNumber: string,
    file: File,
    imageType: string = 'clinical'
  ) => {
    try {
      // رفع الصورة إلى Supabase Storage
      const fileExt = file.name.split('.').pop();
      const fileName = `tooth_${patientId}_${toothNumber}_${Date.now()}.${fileExt}`;
      const filePath = `dental-images/${fileName}`;

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('dental-images')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      // الحصول على URL الصورة
      const { data: urlData } = supabase.storage
        .from('dental-images')
        .getPublicUrl(filePath);

      // حفظ بيانات الصورة في جدول tooth_images
      const { error: insertError } = await supabase
        .from('tooth_images')
        .insert({
          tooth_record_id: data.records.get(toothNumber)?.id,
          image_type: imageType,
          image_url: urlData.publicUrl,
          file_size: file.size,
          mime_type: file.type,
          description: `صورة ${imageType} للسن ${toothNumber}`
        });

      if (insertError) throw insertError;

      // تحديث السجل الحالي
      const currentRecord = data.records.get(toothNumber);
      if (currentRecord) {
        await saveToothRecord({
          ...currentRecord,
          imageUrl: urlData.publicUrl
        });
      }

      toast({
        title: 'تم رفع الصورة',
        description: `تم رفع صورة السن ${toothNumber} بنجاح`,
      });

      return urlData.publicUrl;
    } catch (error) {
      console.error('Error uploading tooth image:', error);
      toast({
        title: 'خطأ في رفع الصورة',
        description: 'فشل في رفع صورة السن',
        variant: 'destructive',
      });
      throw error;
    }
  }, [patientId, data.records, saveToothRecord, toast]);

  // جلب قوالب التشخيص
  const getDiagnosisTemplates = useCallback(async (): Promise<DiagnosisTemplate[]> => {
    try {
      const { data, error } = await supabase
        .from('diagnosis_templates')
        .select('*')
        .eq('clinic_id', clinicId)
        .eq('is_active', true)
        .order('template_name');

      if (error) throw error;

      return data || [];
    } catch (error) {
      console.error('Error loading diagnosis templates:', error);
      return [];
    }
  }, [clinicId]);

  // البحث في سجلات الأسنان
  const searchToothRecords = useCallback(async (
    condition?: string,
    priority?: string,
    hasImages?: boolean,
    dateFrom?: string,
    dateTo?: string
  ): Promise<ToothSearchResult[]> => {
    try {
      const { data, error } = await supabase
        .rpc('search_tooth_records', {
          clinic_uuid: clinicId,
          search_condition: condition,
          search_priority: priority,
          has_images: hasImages,
          date_from: dateFrom,
          date_to: dateTo
        });

      if (error) throw error;

      return data || [];
    } catch (error) {
      console.error('Error searching tooth records:', error);
      return [];
    }
  }, [clinicId]);

  // تصدير البيانات
  const exportData = useCallback(async (format: ExportFormat) => {
    try {
      const records = Array.from(data.records.values());
      
      if (records.length === 0) {
        toast({
          title: 'لا توجد بيانات',
          description: 'لا توجد سجلات أسنان للتصدير',
          variant: 'destructive',
        });
        return;
      }

      let content = '';
      let filename = '';
      let mimeType = '';

      switch (format) {
        case ExportFormat.JSON:
          content = JSON.stringify({
            patientId,
            exportDate: new Date().toISOString(),
            statistics: data.statistics,
            records: records
          }, null, 2);
          filename = `dental_chart_${patientId}_${Date.now()}.json`;
          mimeType = 'application/json';
          break;

        case ExportFormat.CSV: {
          const headers = [
            'رقم السن',
            'الحالة',
            'الأولوية',
            'كود ICD-10',
            'الملاحظات',
            'تاريخ التحديث'
          ];
          
          const csvRows = [
            headers.join(','),
            ...records.map(record => [
              record.toothNumber,
              record.condition,
              record.priority,
              record.icd10Code || '',
              `"${record.notes || ''}"`,
              record.updatedAt
            ].join(','))
          ];
          
          content = csvRows.join('\n');
          filename = `dental_chart_${patientId}_${Date.now()}.csv`;
          mimeType = 'text/csv';
          break;
        }

        case ExportFormat.PDF:
          // هنا يمكن إضافة مكتبة PDF مثل jsPDF
          toast({
            title: 'قريباً',
            description: 'تصدير PDF سيكون متاحاً قريباً',
          });
          return;
      }

      // تحميل الملف
      const blob = new Blob([content], { type: mimeType });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast({
        title: 'تم التصدير',
        description: `تم تصدير البيانات بصيغة ${format}`,
      });
    } catch (error) {
      console.error('Error exporting data:', error);
      toast({
        title: 'خطأ في التصدير',
        description: 'فشل في تصدير البيانات',
        variant: 'destructive',
      });
    }
  }, [data.records, data.statistics, patientId, toast]);

  // تحميل البيانات عند بدء المكون
  useEffect(() => {
    loadToothRecords();
  }, [loadToothRecords]);

  // دوال مساعدة للحصول على معلومات سن محدد
  const getToothRecord = useCallback((toothNumber: string): ToothRecord | null => {
    return data.records.get(toothNumber) || null;
  }, [data.records]);

  const getToothCondition = useCallback((toothNumber: string): ConditionType => {
    return data.records.get(toothNumber)?.condition || ConditionType.SOUND;
  }, [data.records]);

  const getToothColor = useCallback((toothNumber: string): string => {
    const condition = getToothCondition(toothNumber);
    return WHO_COLORS[condition];
  }, [getToothCondition]);

  return {
    // البيانات
    records: data.records,
    statistics: data.statistics,
    loading: data.loading,
    error: data.error,
    
    // العمليات الأساسية
    loadToothRecords,
    saveToothRecord,
    deleteToothRecord,
    
    // الصور
    uploadToothImage,
    
    // القوالب والبحث
    getDiagnosisTemplates,
    searchToothRecords,
    
    // التصدير
    exportData,
    
    // الدوال المساعدة
    getToothRecord,
    getToothCondition,
    getToothColor,
    
    // إعدادات النظام
    numberingSystem,
  };
};
