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
import { TrendingUp, TrendingDown, BarChart3, Package2, Calendar, DollarSign } from "lucide-react";
import { format, subMonths, startOfMonth, endOfMonth } from "date-fns";
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

  const { data: supplies } = useQuery({
    queryKey: ['supplies-for-analysis'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('medical_supplies')
        .select('*')
        .eq('is_active', true);
      if (error) throw error;
      return data as Supply[];
    }
  });

  const { data: movements } = useQuery({
    queryKey: ['stock-movements-analysis', timeRange],
    queryFn: async () => {
      const months = parseInt(timeRange.replace('months', ''));
      const startDate = startOfMonth(subMonths(new Date(), months));
      
      const { data, error } = await supabase
        .from('stock_movements')
        .select(`
          *,
          supplies:supply_id (name, category, unit_cost)
        `)
        .gte('created_at', startDate.toISOString())
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as StockMovement[];
    }
  });

  // ABC Analysis
  const abcAnalysis = React.useMemo(() => {
    if (!supplies || !movements) return [];

    const supplyConsumption = supplies.map(supply => {
      const consumptionMovements = movements.filter(
        m => m.supply_id === supply.id && m.movement_type === 'consumption'
      );
      
      const totalConsumption = consumptionMovements.reduce((sum, m) => sum + m.quantity, 0);
      const totalValue = totalConsumption * Number(supply.unit_cost);
      
      return {
        ...supply,
        totalConsumption,
        totalValue,
        consumptionFrequency: consumptionMovements.length
      };
    });

    // Sort by total value and assign ABC categories
    const sorted = supplyConsumption.sort((a, b) => b.totalValue - a.totalValue);
    const totalValue = sorted.reduce((sum, item) => sum + item.totalValue, 0);
    
    let cumulativeValue = 0;
    return sorted.map(item => {
      cumulativeValue += item.totalValue;
      const cumulativePercentage = (cumulativeValue / totalValue) * 100;
      
      let category: 'A' | 'B' | 'C';
      if (cumulativePercentage <= 80) category = 'A';
      else if (cumulativePercentage <= 95) category = 'B';
      else category = 'C';
      
      return {
        ...item,
        cumulativePercentage,
        category,
        valuePercentage: (item.totalValue / totalValue) * 100
      };
    });
  }, [supplies, movements]);

  // Consumption Trends
  const consumptionTrends = React.useMemo(() => {
    if (!movements) return [];

    const monthlyData = movements
      .filter(m => m.movement_type === 'consumption')
      .reduce((acc, movement) => {
        const monthKey = format(new Date(movement.created_at), 'yyyy-MM');
        if (!acc[monthKey]) {
          acc[monthKey] = { month: monthKey, totalQuantity: 0, totalValue: 0 };
        }
        acc[monthKey].totalQuantity += movement.quantity;
        acc[monthKey].totalValue += movement.quantity * Number(movement.supplies.unit_cost);
        return acc;
      }, {} as Record<string, { month: string; totalQuantity: number; totalValue: number }>);

    return Object.values(monthlyData).sort((a, b) => a.month.localeCompare(b.month));
  }, [movements]);

  // Forecasting (Simple moving average)
  const forecastData = React.useMemo(() => {
    if (!supplies || !movements) return [];

    return supplies.map(supply => {
      const supplyMovements = movements
        .filter(m => m.supply_id === supply.id && m.movement_type === 'consumption')
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

      const lastThreeMonths = supplyMovements.slice(0, 12); // Last 12 movements
      const avgConsumption = lastThreeMonths.length > 0 
        ? lastThreeMonths.reduce((sum, m) => sum + m.quantity, 0) / lastThreeMonths.length 
        : 0;

      const monthsUntilStockout = avgConsumption > 0 ? supply.current_stock / avgConsumption : Infinity;
      const recommendedOrder = Math.max(0, (avgConsumption * 2) - supply.current_stock);

      return {
        ...supply,
        avgConsumption,
        monthsUntilStockout,
        recommendedOrder,
        riskLevel: monthsUntilStockout < 1 ? 'high' : monthsUntilStockout < 2 ? 'medium' : 'low'
      };
    }).sort((a, b) => a.monthsUntilStockout - b.monthsUntilStockout);
  }, [supplies, movements]);

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'A': return 'bg-red-100 text-red-800';
      case 'B': return 'bg-yellow-100 text-yellow-800';
      case 'C': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'high': return 'bg-red-100 text-red-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const chartData = React.useMemo(() => {
    if (reportType === 'consumption') {
      return consumptionTrends.map(item => ({
        name: item.month,
        value: item.totalValue,
        label: formatAmount(item.totalValue)
      }));
    }
    
    if (reportType === 'abc') {
      const categoryData = abcAnalysis.reduce((acc, item) => {
        acc[item.category] = (acc[item.category] || 0) + item.totalValue;
        return acc;
      }, {} as Record<string, number>);
      
      return Object.entries(categoryData).map(([category, value]) => ({
        name: `فئة ${category}`,
        value,
        label: formatAmount(value)
      }));
    }
    
    return [];
  }, [reportType, consumptionTrends, abcAnalysis]);

  return (
    <div className="space-y-6">
      {/* Controls */}
      <div className="flex gap-4">
        <Select value={reportType} onValueChange={(value: any) => setReportType(value)}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="نوع التقرير" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="abc">تحليل ABC</SelectItem>
            <SelectItem value="consumption">اتجاهات الاستهلاك</SelectItem>
            <SelectItem value="forecast">التنبؤ بالطلب</SelectItem>
          </SelectContent>
        </Select>

        <Select value={timeRange} onValueChange={setTimeRange}>
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="الفترة الزمنية" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="3months">3 أشهر</SelectItem>
            <SelectItem value="6months">6 أشهر</SelectItem>
            <SelectItem value="12months">12 شهر</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Charts */}
      {chartData.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5" />
              {reportType === 'abc' && 'توزيع فئات ABC'}
              {reportType === 'consumption' && 'اتجاهات الاستهلاك الشهرية'}
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

      {/* ABC Analysis Table */}
      {reportType === 'abc' && abcAnalysis.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>تحليل ABC للمستلزمات</CardTitle>
          </CardHeader>
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
                      <Badge className={getCategoryColor(item.category)}>
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

      {/* Consumption Trends Table */}
      {reportType === 'consumption' && consumptionTrends.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>اتجاهات الاستهلاك الشهرية</CardTitle>
          </CardHeader>
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
                  const trend = prevItem 
                    ? item.totalValue > prevItem.totalValue ? 'up' : 'down'
                    : 'neutral';
                  
                  return (
                    <TableRow key={item.month}>
                      <TableCell>{format(new Date(item.month), 'MMMM yyyy')}</TableCell>
                      <TableCell>{item.totalQuantity} وحدة</TableCell>
                      <TableCell><CurrencyAmount amount={item.totalValue} /></TableCell>
                      <TableCell>
                        {trend === 'up' && <TrendingUp className="w-4 h-4 text-green-600" />}
                        {trend === 'down' && <TrendingDown className="w-4 h-4 text-red-600" />}
                        {trend === 'neutral' && <span className="text-gray-400">-</span>}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Forecast Table */}
      {reportType === 'forecast' && forecastData.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>توقعات الطلب وتوصيات الشراء</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>المستلزم</TableHead>
                  <TableHead>المخزون الحالي</TableHead>
                  <TableHead>متوسط الاستهلاك</TableHead>
                  <TableHead>أشهر حتى النفاد</TableHead>
                  <TableHead>الكمية المقترحة للشراء</TableHead>
                  <TableHead>مستوى المخاطر</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {forecastData.slice(0, 20).map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="font-medium">{item.name}</TableCell>
                    <TableCell>{item.current_stock}</TableCell>
                    <TableCell>{item.avgConsumption.toFixed(1)} شهرياً</TableCell>
                    <TableCell>
                      {item.monthsUntilStockout === Infinity 
                        ? '∞' 
                        : `${item.monthsUntilStockout.toFixed(1)} شهر`}
                    </TableCell>
                    <TableCell>
                      {item.recommendedOrder > 0 ? item.recommendedOrder.toFixed(0) : '-'}
                    </TableCell>
                    <TableCell>
                      <Badge className={getRiskColor(item.riskLevel)}>
                        {item.riskLevel === 'high' && 'عالي'}
                        {item.riskLevel === 'medium' && 'متوسط'}
                        {item.riskLevel === 'low' && 'منخفض'}
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