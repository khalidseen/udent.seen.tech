import { PageContainer } from "@/components/layout/PageContainer";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DatePickerWithRange } from "@/components/ui/date-range-picker";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, Area, AreaChart } from "recharts";
import { TrendingUp, TrendingDown, Calendar, DollarSign, Users, Package, FileText, Download, Eye, Printer } from "lucide-react";
import { useState } from "react";
import { format } from "date-fns";
import { ar } from "date-fns/locale";

export default function Reports() {
  const [dateRange, setDateRange] = useState<any>({
    from: new Date(2024, 0, 1),
    to: new Date()
  });
  const [reportType, setReportType] = useState("monthly");

  // بيانات وهمية للتقارير
  const revenueData = [
    { month: "يناير", revenue: 45000, expenses: 25000, profit: 20000 },
    { month: "فبراير", revenue: 52000, expenses: 28000, profit: 24000 },
    { month: "مارس", revenue: 48000, expenses: 26000, profit: 22000 },
    { month: "أبريل", revenue: 61000, expenses: 32000, profit: 29000 },
    { month: "مايو", revenue: 55000, expenses: 30000, profit: 25000 },
    { month: "يونيو", revenue: 67000, expenses: 35000, profit: 32000 }
  ];

  const appointmentData = [
    { day: "الأحد", appointments: 15, completed: 13, cancelled: 2 },
    { day: "الاثنين", appointments: 18, completed: 16, cancelled: 2 },
    { day: "الثلاثاء", appointments: 22, completed: 20, cancelled: 2 },
    { day: "الأربعاء", appointments: 19, completed: 17, cancelled: 2 },
    { day: "الخميس", appointments: 25, completed: 23, cancelled: 2 },
    { day: "السبت", appointments: 12, completed: 11, cancelled: 1 }
  ];

  const treatmentData = [
    { name: "تنظيف الأسنان", count: 45, percentage: 35 },
    { name: "حشوات", count: 32, percentage: 25 },
    { name: "علاج جذور", count: 20, percentage: 15 },
    { name: "تقويم", count: 15, percentage: 12 },
    { name: "زراعة", count: 10, percentage: 8 },
    { name: "أخرى", count: 6, percentage: 5 }
  ];

  const patientData = [
    { month: "يناير", newPatients: 25, returning: 45 },
    { month: "فبراير", newPatients: 32, returning: 52 },
    { month: "مارس", newPatients: 28, returning: 48 },
    { month: "أبريل", newPatients: 35, returning: 61 },
    { month: "مايو", newPatients: 30, returning: 55 },
    { month: "يونيو", newPatients: 38, returning: 67 }
  ];

  const COLORS = ['hsl(var(--chart-1))', 'hsl(var(--chart-2))', 'hsl(var(--chart-3))', 'hsl(var(--chart-4))', 'hsl(var(--chart-5))'];

  const generateReport = (type: string) => {
    console.log(`Generating ${type} report...`);
    // هنا يمكن إضافة منطق إنشاء التقرير
  };

  const exportReport = (format: string) => {
    console.log(`Exporting report as ${format}...`);
    // هنا يمكن إضافة منطق تصدير التقرير
  };

  return (
    <PageContainer>
      <PageHeader
        title="التقارير"
        description="تقارير شاملة عن أداء العيادة والإحصائيات المالية"
        action={
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => exportReport('pdf')}>
              <Download className="w-4 h-4 mr-2" />
              تصدير PDF
            </Button>
            <Button variant="outline" onClick={() => exportReport('excel')}>
              <Download className="w-4 h-4 mr-2" />
              تصدير Excel
            </Button>
          </div>
        }
      />

      {/* أدوات التحكم */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            فلترة التقارير
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4 items-end">
            <div className="space-y-2">
              <label className="text-sm font-medium">الفترة الزمنية</label>
              <DatePickerWithRange 
                date={dateRange}
                onDateChange={setDateRange}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">نوع التقرير</label>
              <Select value={reportType} onValueChange={setReportType}>
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="daily">يومي</SelectItem>
                  <SelectItem value="weekly">أسبوعي</SelectItem>
                  <SelectItem value="monthly">شهري</SelectItem>
                  <SelectItem value="yearly">سنوي</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button onClick={() => generateReport(reportType)}>
              إنشاء التقرير
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* الإحصائيات السريعة */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">إجمالي الإيرادات</p>
                <p className="text-2xl font-bold">328,000 ر.س</p>
              </div>
              <div className="h-12 w-12 rounded-lg bg-green-100 dark:bg-green-900/20 flex items-center justify-center">
                <TrendingUp className="h-6 w-6 text-green-600 dark:text-green-400" />
              </div>
            </div>
            <div className="flex items-center mt-4 text-sm">
              <Badge variant="secondary" className="bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400">
                +12.5%
              </Badge>
              <span className="text-muted-foreground mr-2">مقارنة بالشهر الماضي</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">عدد المرضى</p>
                <p className="text-2xl font-bold">1,247</p>
              </div>
              <div className="h-12 w-12 rounded-lg bg-blue-100 dark:bg-blue-900/20 flex items-center justify-center">
                <Users className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
            <div className="flex items-center mt-4 text-sm">
              <Badge variant="secondary" className="bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400">
                +8.2%
              </Badge>
              <span className="text-muted-foreground mr-2">مرضى جدد هذا الشهر</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">المواعيد المكتملة</p>
                <p className="text-2xl font-bold">892</p>
              </div>
              <div className="h-12 w-12 rounded-lg bg-purple-100 dark:bg-purple-900/20 flex items-center justify-center">
                <Calendar className="h-6 w-6 text-purple-600 dark:text-purple-400" />
              </div>
            </div>
            <div className="flex items-center mt-4 text-sm">
              <Badge variant="secondary" className="bg-purple-100 text-purple-700 dark:bg-purple-900/20 dark:text-purple-400">
                95.2%
              </Badge>
              <span className="text-muted-foreground mr-2">معدل الإكمال</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">مخزون منخفض</p>
                <p className="text-2xl font-bold">23</p>
              </div>
              <div className="h-12 w-12 rounded-lg bg-orange-100 dark:bg-orange-900/20 flex items-center justify-center">
                <Package className="h-6 w-6 text-orange-600 dark:text-orange-400" />
              </div>
            </div>
            <div className="flex items-center mt-4 text-sm">
              <Badge variant="destructive">
                تحتاج إعادة طلب
              </Badge>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="financial" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="financial">التقارير المالية</TabsTrigger>
          <TabsTrigger value="appointments">المواعيد</TabsTrigger>
          <TabsTrigger value="treatments">العلاجات</TabsTrigger>
          <TabsTrigger value="patients">المرضى</TabsTrigger>
        </TabsList>

        {/* التقارير المالية */}
        <TabsContent value="financial">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>الإيرادات والأرباح الشهرية</CardTitle>
                <CardDescription>مقارنة الإيرادات مع المصروفات والأرباح</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={revenueData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip 
                      formatter={(value, name) => [
                        `${value.toLocaleString()} ر.س`,
                        name === 'revenue' ? 'الإيرادات' : name === 'expenses' ? 'المصروفات' : 'الأرباح'
                      ]}
                    />
                    <Bar dataKey="revenue" fill="hsl(var(--chart-1))" name="revenue" />
                    <Bar dataKey="expenses" fill="hsl(var(--chart-2))" name="expenses" />
                    <Bar dataKey="profit" fill="hsl(var(--chart-3))" name="profit" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>نمو الإيرادات</CardTitle>
                <CardDescription>تطور الإيرادات خلال الأشهر الماضية</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={revenueData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip formatter={(value) => [`${value.toLocaleString()} ر.س`, 'الإيرادات']} />
                    <Area 
                      type="monotone" 
                      dataKey="revenue" 
                      stroke="hsl(var(--chart-1))" 
                      fill="hsl(var(--chart-1))" 
                      fillOpacity={0.3}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle>ملخص مالي تفصيلي</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-muted/50 p-4 rounded-lg">
                      <div className="text-sm text-muted-foreground">إجمالي الإيرادات</div>
                      <div className="text-2xl font-bold text-green-600">328,000 ر.س</div>
                    </div>
                    <div className="bg-muted/50 p-4 rounded-lg">
                      <div className="text-sm text-muted-foreground">إجمالي المصروفات</div>
                      <div className="text-2xl font-bold text-red-600">176,000 ر.س</div>
                    </div>
                    <div className="bg-muted/50 p-4 rounded-lg">
                      <div className="text-sm text-muted-foreground">صافي الأرباح</div>
                      <div className="text-2xl font-bold text-blue-600">152,000 ر.س</div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* تقارير المواعيد */}
        <TabsContent value="appointments">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>المواعيد الأسبوعية</CardTitle>
                <CardDescription>توزيع المواعيد خلال أيام الأسبوع</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={appointmentData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="day" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="completed" fill="hsl(var(--chart-1))" name="مكتملة" />
                    <Bar dataKey="cancelled" fill="hsl(var(--chart-2))" name="ملغية" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>إحصائيات المواعيد</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center p-3 bg-muted/50 rounded-lg">
                    <span>إجمالي المواعيد</span>
                    <Badge variant="secondary">932</Badge>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-muted/50 rounded-lg">
                    <span>المواعيد المكتملة</span>
                    <Badge className="bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400">892</Badge>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-muted/50 rounded-lg">
                    <span>المواعيد الملغية</span>
                    <Badge variant="destructive">40</Badge>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-muted/50 rounded-lg">
                    <span>معدل الحضور</span>
                    <Badge className="bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400">95.7%</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* تقارير العلاجات */}
        <TabsContent value="treatments">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>توزيع العلاجات</CardTitle>
                <CardDescription>أنواع العلاجات الأكثر شيوعاً</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={treatmentData}
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="count"
                      label={({ name, percentage }) => `${name} ${percentage}%`}
                    >
                      {treatmentData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>تفاصيل العلاجات</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {treatmentData.map((treatment, index) => (
                    <div key={treatment.name} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <div 
                          className="w-3 h-3 rounded-full" 
                          style={{ backgroundColor: COLORS[index % COLORS.length] }}
                        />
                        <span>{treatment.name}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary">{treatment.count}</Badge>
                        <span className="text-sm text-muted-foreground">{treatment.percentage}%</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* تقارير المرضى */}
        <TabsContent value="patients">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>نمو قاعدة المرضى</CardTitle>
                <CardDescription>المرضى الجدد مقابل المراجعين</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={patientData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip />
                    <Line 
                      type="monotone" 
                      dataKey="newPatients" 
                      stroke="hsl(var(--chart-1))" 
                      name="مرضى جدد"
                      strokeWidth={2}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="returning" 
                      stroke="hsl(var(--chart-2))" 
                      name="مراجعين"
                      strokeWidth={2}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>إحصائيات المرضى</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center p-3 bg-muted/50 rounded-lg">
                    <span>إجمالي المرضى</span>
                    <Badge variant="secondary">1,247</Badge>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-muted/50 rounded-lg">
                    <span>مرضى جدد هذا الشهر</span>
                    <Badge className="bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400">38</Badge>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-muted/50 rounded-lg">
                    <span>مرضى مراجعين</span>
                    <Badge className="bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400">67</Badge>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-muted/50 rounded-lg">
                    <span>معدل الإخلاص</span>
                    <Badge className="bg-purple-100 text-purple-700 dark:bg-purple-900/20 dark:text-purple-400">78.5%</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* تقارير سريعة */}
      <Card>
        <CardHeader>
          <CardTitle>تقارير سريعة</CardTitle>
          <CardDescription>إنشاء تقارير مختصرة بنقرة واحدة</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Button variant="outline" className="h-20 flex flex-col gap-2">
              <FileText className="w-6 h-6" />
              <span>تقرير يومي</span>
            </Button>
            <Button variant="outline" className="h-20 flex flex-col gap-2">
              <DollarSign className="w-6 h-6" />
              <span>تقرير مالي</span>
            </Button>
            <Button variant="outline" className="h-20 flex flex-col gap-2">
              <Users className="w-6 h-6" />
              <span>تقرير المرضى</span>
            </Button>
            <Button variant="outline" className="h-20 flex flex-col gap-2">
              <Package className="w-6 h-6" />
              <span>تقرير المخزون</span>
            </Button>
          </div>
        </CardContent>
      </Card>
    </PageContainer>
  );
}