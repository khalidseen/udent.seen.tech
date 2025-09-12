import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { supabase } from "@/integrations/supabase/client";
import { Upload } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface UploadImageDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onImageUploaded: () => void;
  defaultPatientId?: string;
}

export function UploadImageDialog({ isOpen, onClose, onImageUploaded, defaultPatientId }: UploadImageDialogProps) {
  const [selectedPatientId, setSelectedPatientId] = useState(defaultPatientId || "");
  const [selectedRecordId, setSelectedRecordId] = useState("");
  const [imageType, setImageType] = useState("xray");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [toothNumber, setToothNumber] = useState("");
  const [isBeforeTreatment, setIsBeforeTreatment] = useState(false);
  const [isAfterTreatment, setIsAfterTreatment] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const { data: patients } = useQuery({
    queryKey: ['patients'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('patients')
        .select('id, full_name')
        .order('full_name');
      
      if (error) throw error;
      return data;
    }
  });

  const { data: records } = useQuery({
    queryKey: ['medical-records-list', selectedPatientId],
    queryFn: async () => {
      if (!selectedPatientId) return [];
      
      const { data, error } = await supabase
        .from('medical_records')
        .select('id, title, treatment_date')
        .eq('patient_id', selectedPatientId)
        .order('treatment_date', { ascending: false });
      
      if (error) throw error;
      return data;
    },
    enabled: !!selectedPatientId
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      // Check file type
      const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'application/dicom'];
      if (!allowedTypes.includes(selectedFile.type)) {
        toast({
          title: "نوع ملف غير مدعوم",
          description: "يرجى اختيار ملف صورة (JPEG, PNG, WebP) أو ملف DICOM",
          variant: "destructive"
        });
        return;
      }

      // Check file size (50MB limit)
      if (selectedFile.size > 50 * 1024 * 1024) {
        toast({
          title: "حجم الملف كبير",
          description: "يجب أن يكون حجم الملف أقل من 50 ميجابايت",
          variant: "destructive"
        });
        return;
      }

      setFile(selectedFile);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPatientId || !title || !file) {
      toast({
        title: "خطأ",
        description: "يرجى ملء الحقول المطلوبة واختيار ملف",
        variant: "destructive"
      });
      return;
    }

    setIsSubmitting(true);

    try {
      // Get current user profile for clinic_id
      const { data: profile } = await supabase
        .from('profiles')
        .select('id')
        .single();

      if (!profile) throw new Error('لم يتم العثور على ملف المستخدم');

      // Upload file to storage
      const fileExt = file.name.split('.').pop();
      const fileName = `${profile.id}/${selectedPatientId}/${Date.now()}.${fileExt}`;
      
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('medical-images')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      // Create medical image record
      const { error: recordError } = await supabase
        .from('medical_images')
        .insert({
          clinic_id: profile.id,
          patient_id: selectedPatientId,
          record_id: selectedRecordId || null,
          image_type: imageType,
          title,
          description: description || null,
          file_path: uploadData.path,
          file_size: file.size,
          mime_type: file.type,
          tooth_number: toothNumber || null,
          is_before_treatment: isBeforeTreatment,
          is_after_treatment: isAfterTreatment
        });

      if (recordError) throw recordError;

      onImageUploaded();
      onClose();
      resetForm();
      
    } catch (error: any) {
      toast({
        title: "خطأ",
        description: error.message || "حدث خطأ أثناء رفع الصورة",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setSelectedPatientId(defaultPatientId || "");
    setSelectedRecordId("");
    setImageType("xray");
    setTitle("");
    setDescription("");
    setToothNumber("");
    setIsBeforeTreatment(false);
    setIsAfterTreatment(false);
    setFile(null);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>رفع صورة طبية</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="patient">المريض *</Label>
              <Select value={selectedPatientId} onValueChange={setSelectedPatientId}>
                <SelectTrigger>
                  <SelectValue placeholder="اختر المريض" />
                </SelectTrigger>
                <SelectContent>
                  {patients?.map((patient) => (
                    <SelectItem key={patient.id} value={patient.id}>
                      {patient.full_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="record">السجل الطبي (اختياري)</Label>
              <Select value={selectedRecordId} onValueChange={setSelectedRecordId}>
                <SelectTrigger>
                  <SelectValue placeholder="اختر السجل الطبي" />
                </SelectTrigger>
                <SelectContent>
                  {records?.map((record) => (
                    <SelectItem key={record.id} value={record.id}>
                      {record.title} - {record.treatment_date}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="imageType">نوع الصورة</Label>
              <Select value={imageType} onValueChange={setImageType}>
                <SelectTrigger>
                  <SelectValue placeholder="اختر نوع الصورة" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="xray">أشعة سينية</SelectItem>
                  <SelectItem value="photo">صورة فوتوغرافية</SelectItem>
                  <SelectItem value="scan">مسح ضوئي</SelectItem>
                  <SelectItem value="dicom">ملف DICOM</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="title">عنوان الصورة *</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="عنوان الصورة"
                required
              />
            </div>

            <div>
              <Label htmlFor="toothNumber">رقم السن (اختياري)</Label>
              <Input
                id="toothNumber"
                value={toothNumber}
                onChange={(e) => setToothNumber(e.target.value)}
                placeholder="رقم السن"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="description">الوصف</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="وصف الصورة..."
            />
          </div>

          <div className="flex flex-col space-y-2">
            <div className="flex items-center space-x-2 space-x-reverse">
              <Checkbox
                id="beforeTreatment"
                checked={isBeforeTreatment}
                onCheckedChange={(checked) => setIsBeforeTreatment(checked === true)}
              />
              <Label htmlFor="beforeTreatment">صورة قبل العلاج</Label>
            </div>
            <div className="flex items-center space-x-2 space-x-reverse">
              <Checkbox
                id="afterTreatment"
                checked={isAfterTreatment}
                onCheckedChange={(checked) => setIsAfterTreatment(checked === true)}
              />
              <Label htmlFor="afterTreatment">صورة بعد العلاج</Label>
            </div>
          </div>

          <div>
            <Label htmlFor="file">الملف *</Label>
            <div className="mt-1">
              <Input
                id="file"
                type="file"
                accept="image/*,.dcm"
                onChange={handleFileChange}
                required
              />
              {file && (
                <p className="text-sm text-muted-foreground mt-1">
                  الملف المحدد: {file.name} ({(file.size / 1024 / 1024).toFixed(2)} MB)
                </p>
              )}
            </div>
          </div>

          <div className="flex justify-end space-x-2 space-x-reverse">
            <Button type="button" variant="outline" onClick={onClose}>
              إلغاء
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "جاري الرفع..." : "رفع الصورة"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}