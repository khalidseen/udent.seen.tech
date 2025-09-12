import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const medicationSchema = z.object({
  trade_name: z.string().min(1, "الاسم التجاري مطلوب"),
  generic_name: z.string().optional(),
  strength: z.string().min(1, "المقدار الوزني مطلوب"),
  form: z.string().min(1, "الشكل الصيدلاني مطلوب"),
  frequency: z.string().min(1, "الجرعة مطلوبة"),
  duration: z.string().optional(),
  instructions: z.string().optional(),
  prescription_type: z.string().min(1, "نوع الوصفة مطلوب"),
  is_active: z.boolean().default(true),
});

type MedicationForm = z.infer<typeof medicationSchema>;

interface Medication {
  id: string;
  trade_name: string;
  generic_name?: string;
  strength: string;
  form: string;
  frequency: string;
  duration?: string;
  instructions?: string;
  prescription_type: string;
  is_active: boolean;
}

interface EditMedicationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  medication: Medication;
  onSuccess: () => void;
}

const EditMedicationDialog = ({ open, onOpenChange, medication, onSuccess }: EditMedicationDialogProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const form = useForm<MedicationForm>({
    resolver: zodResolver(medicationSchema),
    defaultValues: {
      trade_name: "",
      generic_name: "",
      strength: "",
      form: "",
      frequency: "",
      duration: "",
      instructions: "",
      prescription_type: "prescription",
      is_active: true,
    },
  });

  useEffect(() => {
    if (medication && open) {
      form.reset({
        trade_name: medication.trade_name,
        generic_name: medication.generic_name || "",
        strength: medication.strength,
        form: medication.form,
        frequency: medication.frequency,
        duration: medication.duration || "",
        instructions: medication.instructions || "",
        prescription_type: medication.prescription_type || "prescription",
        is_active: medication.is_active,
      });
    }
  }, [medication, open, form]);

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

  const onSubmit = async (data: MedicationForm) => {
    setIsLoading(true);
    
    try {
      const { error } = await supabase
        .from('medications')
        .update({
          ...data,
          generic_name: data.generic_name || null,
          duration: data.duration || null,
          instructions: data.instructions || null,
        })
        .eq('id', medication.id);

      if (error) throw error;

      toast({
        title: "تم تحديث الدواء بنجاح",
        description: `تم تحديث بيانات ${data.trade_name}`,
      });

      onSuccess();
    } catch (error) {
      console.error('Error updating medication:', error);
      toast({
        title: "خطأ في تحديث الدواء",
        description: "حدث خطأ أثناء تحديث بيانات الدواء. يرجى المحاولة مرة أخرى.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>تعديل بيانات الدواء</DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="trade_name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>الاسم التجاري *</FormLabel>
                    <FormControl>
                      <Input placeholder="مثال: Panadol" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="generic_name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>الاسم العلمي</FormLabel>
                    <FormControl>
                      <Input placeholder="مثال: Paracetamol" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="strength"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>المقدار الوزني *</FormLabel>
                    <FormControl>
                      <Input placeholder="مثال: 500mg" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="form"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>الشكل الصيدلاني *</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="اختر الشكل الصيدلاني" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {formOptions.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="frequency"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>الجرعة *</FormLabel>
                    <FormControl>
                      <Input placeholder="مثال: 3 مرات يومياً" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="duration"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>المدة</FormLabel>
                    <FormControl>
                      <Input placeholder="مثال: 7 أيام" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="instructions"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>تعليمات إضافية</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="مثال: بعد الطعام مباشرة، تجنب القيادة"
                      rows={3}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="prescription_type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>نوع الوصفة *</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="اختر نوع الوصفة" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="prescription">بوصفة طبية</SelectItem>
                        <SelectItem value="otc">بدون وصفة طبية (OTC)</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="is_active"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>حالة الدواء</FormLabel>
                    <Select onValueChange={(value) => field.onChange(value === "true")} value={field.value ? "true" : "false"}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="اختر حالة الدواء" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="true">نشط</SelectItem>
                        <SelectItem value="false">غير نشط</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="flex gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                className="flex-1"
              >
                إلغاء
              </Button>
              <Button
                type="submit"
                disabled={isLoading}
                className="flex-1"
              >
                {isLoading ? "جاري التحديث..." : "حفظ التغييرات"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default EditMedicationDialog;