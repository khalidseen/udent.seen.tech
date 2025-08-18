import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { PageContainer } from "@/components/layout/PageContainer";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { supabase } from "@/integrations/supabase/client";
import { Plus, Edit, Trash2, DollarSign } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface ServicePrice {
  id: string;
  service_name: string;
  service_category: string;
  base_price: number;
  currency: string;
  is_active: boolean;
  description: string | null;
  created_at: string;
  updated_at: string;
}

export default function ServicePrices() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingService, setEditingService] = useState<ServicePrice | null>(null);
  const [formData, setFormData] = useState({
    service_name: "",
    service_category: "general",
    base_price: "",
    currency: "USD",
    is_active: true,
    description: ""
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const { data: services, isLoading, refetch } = useQuery({
    queryKey: ['service-prices'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('service_prices')
        .select('*')
        .order('service_category', { ascending: true })
        .order('service_name', { ascending: true });

      if (error) throw error;
      return data as ServicePrice[];
    }
  });

  const serviceCategories = [
    { value: "general", label: "عام" },
    { value: "consultation", label: "استشارة" },
    { value: "cleaning", label: "تنظيف" },
    { value: "filling", label: "حشو" },
    { value: "extraction", label: "خلع" },
    { value: "root_canal", label: "علاج عصب" },
    { value: "orthodontics", label: "تقويم" },
    { value: "prosthetics", label: "تركيبات" },
    { value: "surgery", label: "جراحة" },
    { value: "cosmetic", label: "تجميلي" },
    { value: "emergency", label: "طوارئ" }
  ];

  const currencies = [
    { value: "USD", label: "دولار أمريكي" },
    { value: "EUR", label: "يورو" },
    { value: "SAR", label: "ريال سعودي" },
    { value: "AED", label: "درهم إماراتي" },
    { value: "KWD", label: "دينار كويتي" }
  ];

  const getCategoryLabel = (category: string) => {
    return serviceCategories.find(cat => cat.value === category)?.label || category;
  };

  const getCurrencySymbol = (currency: string) => {
    switch (currency) {
      case 'USD': return '$';
      case 'EUR': return '€';
      case 'SAR': return 'ر.س';
      case 'AED': return 'د.إ';
      case 'KWD': return 'د.ك';
      default: return currency;
    }
  };

  const handleCreate = () => {
    setEditingService(null);
    setFormData({
      service_name: "",
      service_category: "general",
      base_price: "",
      currency: "USD",
      is_active: true,
      description: ""
    });
    setIsDialogOpen(true);
  };

  const handleEdit = (service: ServicePrice) => {
    setEditingService(service);
    setFormData({
      service_name: service.service_name,
      service_category: service.service_category,
      base_price: service.base_price.toString(),
      currency: service.currency,
      is_active: service.is_active,
      description: service.description || ""
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (serviceId: string) => {
    if (!confirm('هل أنت متأكد من حذف هذه الخدمة؟')) return;

    try {
      const { error } = await supabase
        .from('service_prices')
        .delete()
        .eq('id', serviceId);

      if (error) throw error;

      refetch();
      toast({
        title: "تم الحذف",
        description: "تم حذف الخدمة بنجاح",
      });
    } catch (error: any) {
      toast({
        title: "خطأ",
        description: error.message || "حدث خطأ أثناء حذف الخدمة",
        variant: "destructive"
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.service_name || !formData.base_price) {
      toast({
        title: "خطأ",
        description: "يرجى ملء جميع الحقول المطلوبة",
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

      const serviceData = {
        clinic_id: profile.id,
        service_name: formData.service_name,
        service_category: formData.service_category,
        base_price: Number(formData.base_price),
        currency: formData.currency,
        is_active: formData.is_active,
        description: formData.description || null
      };

      if (editingService) {
        const { error } = await supabase
          .from('service_prices')
          .update(serviceData)
          .eq('id', editingService.id);

        if (error) throw error;

        toast({
          title: "تم التحديث",
          description: "تم تحديث الخدمة بنجاح",
        });
      } else {
        const { error } = await supabase
          .from('service_prices')
          .insert(serviceData);

        if (error) throw error;

        toast({
          title: "تم الإضافة",
          description: "تم إضافة الخدمة بنجاح",
        });
      }

      setIsDialogOpen(false);
      refetch();
    } catch (error: any) {
      toast({
        title: "خطأ",
        description: error.message || "حدث خطأ أثناء حفظ الخدمة",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const groupedServices = services?.reduce((acc, service) => {
    if (!acc[service.service_category]) {
      acc[service.service_category] = [];
    }
    acc[service.service_category].push(service);
    return acc;
  }, {} as Record<string, ServicePrice[]>);

  return (
    <PageContainer>
      <PageHeader 
        title="أسعار الخدمات"
        description="إدارة أسعار الخدمات والعلاجات"
        action={
          <Button onClick={handleCreate}>
            <Plus className="w-4 h-4 ml-2" />
            خدمة جديدة
          </Button>
        }
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">إجمالي الخدمات</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{services?.length || 0}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">خدمات نشطة</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-success">
              {services?.filter(s => s.is_active).length || 0}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">متوسط السعر</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${services?.length ? (services.reduce((sum, s) => sum + Number(s.base_price), 0) / services.length).toFixed(2) : '0.00'}
            </div>
          </CardContent>
        </Card>
      </div>

      {isLoading ? (
        <Card>
          <CardContent className="py-8">
            <div className="text-center">جاري التحميل...</div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {Object.entries(groupedServices || {}).map(([category, categoryServices]) => (
            <Card key={category}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  {getCategoryLabel(category)}
                  <Badge variant="secondary">{categoryServices.length}</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>اسم الخدمة</TableHead>
                      <TableHead>السعر</TableHead>
                      <TableHead>الوصف</TableHead>
                      <TableHead>الحالة</TableHead>
                      <TableHead>الإجراءات</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {categoryServices.map((service) => (
                      <TableRow key={service.id}>
                        <TableCell className="font-medium">{service.service_name}</TableCell>
                        <TableCell>
                          {getCurrencySymbol(service.currency)} {Number(service.base_price).toFixed(2)}
                        </TableCell>
                        <TableCell className="max-w-xs truncate">
                          {service.description || '-'}
                        </TableCell>
                        <TableCell>
                          <Badge variant={service.is_active ? "default" : "secondary"}>
                            {service.is_active ? "نشط" : "غير نشط"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleEdit(service)}
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleDelete(service.id)}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingService ? "تعديل الخدمة" : "إضافة خدمة جديدة"}
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="service_name">اسم الخدمة</Label>
              <Input
                id="service_name"
                value={formData.service_name}
                onChange={(e) => setFormData({ ...formData, service_name: e.target.value })}
                placeholder="أدخل اسم الخدمة"
                required
              />
            </div>

            <div>
              <Label htmlFor="service_category">فئة الخدمة</Label>
              <Select
                value={formData.service_category}
                onValueChange={(value) => setFormData({ ...formData, service_category: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {serviceCategories.map((category) => (
                    <SelectItem key={category.value} value={category.value}>
                      {category.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label htmlFor="base_price">السعر</Label>
                <Input
                  id="base_price"
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.base_price}
                  onChange={(e) => setFormData({ ...formData, base_price: e.target.value })}
                  placeholder="0.00"
                  required
                />
              </div>

              <div>
                <Label htmlFor="currency">العملة</Label>
                <Select
                  value={formData.currency}
                  onValueChange={(value) => setFormData({ ...formData, currency: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {currencies.map((currency) => (
                      <SelectItem key={currency.value} value={currency.value}>
                        {currency.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label htmlFor="description">الوصف</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="وصف الخدمة (اختياري)"
                rows={3}
              />
            </div>

            <div className="flex items-center space-x-2 space-x-reverse">
              <Switch
                id="is_active"
                checked={formData.is_active}
                onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
              />
              <Label htmlFor="is_active">خدمة نشطة</Label>
            </div>

            <div className="flex justify-end space-x-2 space-x-reverse">
              <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                إلغاء
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "جاري الحفظ..." : editingService ? "تحديث" : "إضافة"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </PageContainer>
  );
}