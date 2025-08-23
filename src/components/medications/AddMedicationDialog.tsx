import { useState } from "react";
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
});

type MedicationForm = z.infer<typeof medicationSchema>;

interface AddMedicationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

const AddMedicationDialog = ({ open, onOpenChange, onSuccess }: AddMedicationDialogProps) => {
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
    },
  });

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
      // Get current user profile
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('id')
        .eq('user_id', (await supabase.auth.getUser()).data.user?.id)
        .single();

      if (profileError) throw profileError;

      // Insert medication
      const { error } = await supabase
        .from('medications')
        .insert({
          trade_name: data.trade_name,
          generic_name: data.generic_name || null,
          strength: data.strength,
          form: data.form,
          frequency: data.frequency,
          duration: data.duration || null,
          instructions: data.instructions || null,
          clinic_id: profile.id,
        });

      if (error) throw error;

      toast({
        title: "تم إضافة الدواء بنجاح",
        description: `تم إضافة ${data.trade_name} إلى قائمة الأدوية`,
      });

      form.reset();
      onSuccess();
    } catch (error) {
      console.error('Error adding medication:', error);
      toast({
        title: "خطأ في إضافة الدواء",
        description: "حدث خطأ أثناء إضافة الدواء. يرجى المحاولة مرة أخرى.",
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
          <DialogTitle>إضافة دواء جديد</DialogTitle>
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
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
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
                {isLoading ? "جاري الحفظ..." : "حفظ الدواء"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default AddMedicationDialog;