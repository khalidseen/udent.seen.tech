import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Progress } from "@/components/ui/progress";
import { OptimizedChart } from "@/components/ui/optimized-chart";
import { supabase } from "@/integrations/supabase/client";
import { TrendingUp, TrendingDown, BarChart3, Download } from "lucide-react";
import { format, subMonths, startOfMonth } from "date-fns";
import { CurrencyAmount } from "@/components/ui/currency-display";
import { useCurrency } from "@/hooks/useCurrency";

interface Supply {
  id: string;
  name: string;
  category: string;
  current_stock: number;
  minimum_stock: number;
  unit_cost: number;
  supplier?: string;
}

interface StockMovement {
  id: string;
  supply_id: string;
  movement_type: string;
  quantity: number;
  created_at: string;
  supplies: { name: string; category: string; unit_cost: number };
}

export function AdvancedInventoryReports() {
  const [reportType, setReportType] = useState<"abc" | "consumption" | "forecast">("abc");
  const [timeRange, setTimeRange] = useState("3months");
  const { formatAmount } = useCurrency();

  const { data: profile } = useQuery({
    queryKey: ['current-profile-reports'],
    queryFn: async () => {
      const { data } = await supabase.rpc('get_current_user_profile');
      return data;
    }
  });

  const clinicId = profile?.id;

  const { data: supplies } = useQuery({
    queryKey: ['supplies-for-analysis', clinicId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('medical_supplies')
        .select('*')
        .eq('clinic_id', clinicId!)
        .eq('is_active', true);
      if (error) throw error;
      return data as Supply[];
    },
    enabled: !!clinicId
  });

  const { data: movements } = useQuery({
    queryKey: ['stock-movements-analysis', clinicId, timeRange],
    queryFn: async () => {
      const months = parseInt(timeRange.replace('months', ''));
      const startDate = startOfMonth(subMonths(new Date(), months));
      
      const { data, error } = await supabase
        .from('stock_movements')
        .select(`*, supplies:supply_id (name, category, unit_cost)`)
        .eq('clinic_id', clinicId!)
        .gte('created_at', startDate.toISOString())
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as StockMovement[];
    },
    enabled: !!clinicId
  });

  // ABC Analysis
  const abcAnalysis = React.useMemo(() => {
    if (!supplies || !movements) return [];

    const supplyConsumption = supplies.map(supply => {
      const outMovements = movements.filter(
        m => m.supply_id === supply.id && (m.movement_type === 'out' || m.movement_type === 'consumption')
      );
      const totalConsumption = outMovements.reduce((sum, m) => sum + Math.abs(m.quantity), 0);
      const totalValue = totalConsumption * Number(supply.unit_cost);
      return { ...supply, totalConsumption, totalValue, consumptionFrequency: outMovements.length };
    });

    const sorted = supplyConsumption.sort((a, b) => b.totalValue - a.totalValue);
    const totalValue = sorted.reduce((sum, item) => sum + item.totalValue, 0);
    
    let cumulativeValue = 0;
    return sorted.map(item => {
      cumulativeValue += item.totalValue;
      const cumulativePercentage = totalValue > 0 ? (cumulativeValue / totalValue) * 100 : 0;
      const category: 'A' | 'B' | 'C' = cumulativePercentage <= 80 ? 'A' : cumulativePercentage <= 95 ? 'B' : 'C';
      return { ...item, cumulativePercentage, category, valuePercentage: totalValue > 0 ? (item.totalValue / totalValue) * 100 : 0 };
    });
  }, [supplies, movements]);

  // Consumption Trends
  const consumptionTrends = React.useMemo(() => {
    if (!movements) return [];
    const monthlyData = movements
      .filter(m => m.movement_type === 'out' || m.movement_type === 'consumption')
      .reduce((acc, m) => {
        const monthKey = format(new Date(m.created_at), 'yyyy-MM');
        if (!acc[monthKey]) acc[monthKey] = { month: monthKey, totalQuantity: 0, totalValue: 0 };
        acc[monthKey].totalQuantity += Math.abs(m.quantity);
        acc[monthKey].totalValue += Math.abs(m.quantity) * Number(m.supplies?.unit_cost || 0);
        return acc;
      }, {} as Record<string, { month: string; totalQuantity: number; totalValue: number }>);
    return Object.values(monthlyData).sort((a, b) => a.month.localeCompare(b.month));
  }, [movements]);

  // Forecasting
  const forecastData = React.useMemo(() => {
    if (!supplies || !movements) return [];
    return supplies.map(supply => {
      const outMoves = movements
        .filter(m => m.supply_id === supply.id && (m.movement_type === 'out' || m.movement_type === 'consumption'));
      const totalConsumed = outMoves.reduce((sum, m) => sum + Math.abs(m.quantity), 0);
      const months = parseInt(timeRange.replace('months', ''));
      const avgMonthlyConsumption = months > 0 ? totalConsumed / months : 0;
      const monthsUntilStockout = avgMonthlyConsumption > 0 ? supply.current_stock / avgMonthlyConsumption : Infinity;
      const recommendedOrder = Math.max(0, (avgMonthlyConsumption * 3) - supply.current_stock);
      return {
        ...supply, avgMonthlyConsumption, monthsUntilStockout, recommendedOrder,
        riskLevel: monthsUntilStockout < 1 ? 'high' : monthsUntilStockout < 2 ? 'medium' : 'low' as 'high' | 'medium' | 'low'
      };
    }).sort((a, b) => a.monthsUntilStockout - b.monthsUntilStockout);
  }, [supplies, movements, timeRange]);

  const handleExportCSV = () => {
    let csvContent = "\uFEFF";
    if (reportType === 'abc') {
      csvContent += "المستلزم,الفئة,الاستهلاك,القيمة,نسبة القيمة,التصنيف\n";
      abcAnalysis.forEach(i => {
        csvContent += `${i.name},${i.category},${i.totalConsumption},${i.totalValue},${i.valuePercentage.toFixed(1)}%,${i.category}\n`;
      });
    } else if (reportType === 'forecast') {
      csvContent += "المستلزم,المخزون الحالي,متوسط الاستهلاك الشهري,أشهر حتى النفاد,الكمية المقترحة,المخاطر\n";
      forecastData.forEach(i => {
        csvContent += `${i.name},${i.current_stock},${i.avgMonthlyConsumption.toFixed(1)},${i.monthsUntilStockout === Infinity ? '∞' : i.monthsUntilStockout.toFixed(1)},${i.recommendedOrder.toFixed(0)},${i.riskLevel}\n`;
      });
    }
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `inventory-report-${reportType}-${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  const chartData = React.useMemo(() => {
    if (reportType === 'consumption') {
      return consumptionTrends.map(item => ({ name: item.month, value: item.totalValue, label: formatAmount(item.totalValue) }));
    }
    if (reportType === 'abc') {
      const categoryData = abcAnalysis.reduce((acc, item) => {
        acc[item.category] = (acc[item.category] || 0) + item.totalValue;
        return acc;
      }, {} as Record<string, number>);
      return Object.entries(categoryData).map(([cat, val]) => ({ name: `فئة ${cat}`, value: val, label: formatAmount(val) }));
    }
    return [];
  }, [reportType, consumptionTrends, abcAnalysis]);

  return (
    <div className="space-y-6">
      <div className="flex gap-4 flex-wrap">
        <Select value={reportType} onValueChange={(v: any) => setReportType(v)}>
          <SelectTrigger className="w-[200px]"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="abc">تحليل ABC</SelectItem>
            <SelectItem value="consumption">اتجاهات الاستهلاك</SelectItem>
            <SelectItem value="forecast">التنبؤ بالطلب</SelectItem>
          </SelectContent>
        </Select>
        <Select value={timeRange} onValueChange={setTimeRange}>
          <SelectTrigger className="w-[150px]"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="3months">3 أشهر</SelectItem>
            <SelectItem value="6months">6 أشهر</SelectItem>
            <SelectItem value="12months">12 شهر</SelectItem>
          </SelectContent>
        </Select>
        <Button variant="outline" onClick={handleExportCSV}>
          <Download className="w-4 h-4 ml-2" /> تصدير CSV
        </Button>
      </div>

      {chartData.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5" />
              {reportType === 'abc' ? 'توزيع فئات ABC' : 'اتجاهات الاستهلاك الشهرية'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <OptimizedChart
              data={chartData}
              type={reportType === 'abc' ? 'pie' : 'bar'}
              height={300}
              colors={['hsl(var(--primary))', 'hsl(var(--secondary))', 'hsl(var(--accent))']}
            />
          </CardContent>
        </Card>
      )}

      {reportType === 'abc' && abcAnalysis.length > 0 && (
        <Card>
          <CardHeader><CardTitle>تحليل ABC للمستلزمات</CardTitle></CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>المستلزم</TableHead>
                  <TableHead>الفئة</TableHead>
                  <TableHead>إجمالي الاستهلاك</TableHead>
                  <TableHead>القيمة الإجمالية</TableHead>
                  <TableHead>نسبة القيمة</TableHead>
                  <TableHead>النسبة التراكمية</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {abcAnalysis.slice(0, 20).map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="font-medium">{item.name}</TableCell>
                    <TableCell>
                      <Badge variant={item.category === 'A' ? 'destructive' : item.category === 'B' ? 'secondary' : 'default'}>
                        فئة {item.category}
                      </Badge>
                    </TableCell>
                    <TableCell>{item.totalConsumption} وحدة</TableCell>
                    <TableCell><CurrencyAmount amount={item.totalValue} /></TableCell>
                    <TableCell>{item.valuePercentage.toFixed(1)}%</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Progress value={item.cumulativePercentage} className="w-16" />
                        <span className="text-sm">{item.cumulativePercentage.toFixed(1)}%</span>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {reportType === 'consumption' && consumptionTrends.length > 0 && (
        <Card>
          <CardHeader><CardTitle>اتجاهات الاستهلاك الشهرية</CardTitle></CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>الشهر</TableHead>
                  <TableHead>إجمالي الكمية</TableHead>
                  <TableHead>إجمالي القيمة</TableHead>
                  <TableHead>الاتجاه</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {consumptionTrends.map((item, index) => {
                  const prevItem = consumptionTrends[index - 1];
                  const trend = prevItem ? (item.totalValue > prevItem.totalValue ? 'up' : 'down') : 'neutral';
                  return (
                    <TableRow key={item.month}>
                      <TableCell>{format(new Date(item.month), 'MMMM yyyy')}</TableCell>
                      <TableCell>{item.totalQuantity} وحدة</TableCell>
                      <TableCell><CurrencyAmount amount={item.totalValue} /></TableCell>
                      <TableCell>
                        {trend === 'up' && <TrendingUp className="w-4 h-4 text-green-600" />}
                        {trend === 'down' && <TrendingDown className="w-4 h-4 text-red-600" />}
                        {trend === 'neutral' && <span className="text-muted-foreground">-</span>}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {reportType === 'forecast' && forecastData.length > 0 && (
        <Card>
          <CardHeader><CardTitle>توقعات الطلب وتوصيات الشراء</CardTitle></CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>المستلزم</TableHead>
                  <TableHead>المخزون الحالي</TableHead>
                  <TableHead>متوسط الاستهلاك/شهر</TableHead>
                  <TableHead>أشهر حتى النفاد</TableHead>
                  <TableHead>الكمية المقترحة</TableHead>
                  <TableHead>مستوى المخاطر</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {forecastData.slice(0, 20).map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="font-medium">{item.name}</TableCell>
                    <TableCell>{item.current_stock}</TableCell>
                    <TableCell>{item.avgMonthlyConsumption.toFixed(1)}</TableCell>
                    <TableCell>
                      {item.monthsUntilStockout === Infinity ? '∞' : `${item.monthsUntilStockout.toFixed(1)} شهر`}
                    </TableCell>
                    <TableCell>{item.recommendedOrder > 0 ? item.recommendedOrder.toFixed(0) : '-'}</TableCell>
                    <TableCell>
                      <Badge variant={item.riskLevel === 'high' ? 'destructive' : item.riskLevel === 'medium' ? 'secondary' : 'default'}>
                        {item.riskLevel === 'high' ? 'عالي' : item.riskLevel === 'medium' ? 'متوسط' : 'منخفض'}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
