import React from 'react';
import { Button } from '@/components/ui/button';
import { Activity, AlertTriangle, CheckCircle, FileDown, XCircle } from 'lucide-react';
import type { ChartStatistics } from '@/types/dental-enhanced';

interface DentalChartActionsAndStatsProps {
  statistics: ChartStatistics;
  onExport: () => void;
}

export const DentalChartActionsAndStats: React.FC<DentalChartActionsAndStatsProps> = ({
  statistics,
  onExport,
}) => {
  const stats = [
    { label: 'مسجلة', value: statistics.recordedTeeth, icon: Activity, color: 'text-primary' },
    { label: 'سليمة', value: statistics.healthyTeeth, icon: CheckCircle, color: 'text-green-600' },
    { label: 'تسوس', value: statistics.decayedTeeth, icon: AlertTriangle, color: 'text-red-600' },
    { label: 'محشوة', value: statistics.filledTeeth, icon: CheckCircle, color: 'text-blue-600' },
    { label: 'مفقودة', value: statistics.missingTeeth, icon: XCircle, color: 'text-muted-foreground' },
    { label: 'علاج عصب', value: statistics.rootCanalTeeth, icon: Activity, color: 'text-pink-600' },
    { label: 'عاجلة', value: statistics.urgentCases, icon: AlertTriangle, color: 'text-amber-600' },
    { label: 'الإجمالي', value: `${statistics.recordedTeeth}/32`, icon: Activity, color: 'text-muted-foreground' },
  ] as const;

  return (
    <>
      <div className="flex justify-end">
        <Button variant="outline" size="sm" onClick={onExport}>
          <FileDown className="w-4 h-4 ml-1" />
          تصدير PDF
        </Button>
      </div>

      <div className="grid grid-cols-4 md:grid-cols-8 gap-2">
        {stats.map((stat) => (
          <div key={stat.label} className="flex flex-col items-center p-2 rounded-lg border bg-card text-center">
            <stat.icon className={`w-4 h-4 ${stat.color} mb-1`} />
            <span className="text-lg font-bold">{stat.value}</span>
            <span className="text-[10px] text-muted-foreground">{stat.label}</span>
          </div>
        ))}
      </div>
    </>
  );
};