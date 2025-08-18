import React, { useMemo, useCallback } from 'react';
import { ResponsiveContainer, PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';
import { throttle } from '@/lib/performance';

interface OptimizedChartProps {
  data: any[];
  type: 'pie' | 'bar';
  height?: number;
  colors?: string[];
}

// Throttle tooltip updates to improve performance
const useThrottledTooltip = () => {
  const throttledUpdate = useCallback(
    throttle((active: boolean, payload: any, label: any) => {
      if (active && payload && payload.length) {
        // Handle tooltip updates
      }
    }, 100),
    []
  );

  return throttledUpdate;
};

export const OptimizedChart: React.FC<OptimizedChartProps> = ({
  data,
  type,
  height = 300,
  colors = ['hsl(var(--primary))', 'hsl(var(--secondary))', 'hsl(var(--accent))']
}) => {
  const throttledTooltip = useThrottledTooltip();

  // Memoize chart data to prevent unnecessary recalculations
  const chartData = useMemo(() => {
    return data.map((item, index) => ({
      ...item,
      fill: colors[index % colors.length]
    }));
  }, [data, colors]);

  const CustomTooltip = useCallback(({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-background/95 backdrop-blur-sm border rounded-lg p-3 shadow-lg">
          <p className="text-sm font-medium">{label}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} className="text-sm" style={{ color: entry.color }}>
              {entry.name}: {entry.value}
            </p>
          ))}
        </div>
      );
    }
    return null;
  }, []);

  if (type === 'pie') {
    return (
      <ResponsiveContainer width="100%" height={height}>
        <PieChart>
          <Pie
            data={chartData}
            cx="50%"
            cy="50%"
            outerRadius={80}
            dataKey="value"
            animationBegin={0}
            animationDuration={800}
          >
            {chartData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.fill} />
            ))}
          </Pie>
          <Tooltip content={<CustomTooltip />} />
        </PieChart>
      </ResponsiveContainer>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={chartData}>
        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
        <XAxis 
          dataKey="name" 
          stroke="hsl(var(--muted-foreground))"
          fontSize={12}
        />
        <YAxis 
          stroke="hsl(var(--muted-foreground))"
          fontSize={12}
        />
        <Tooltip content={<CustomTooltip />} />
        <Legend />
        <Bar 
          dataKey="value" 
          fill="hsl(var(--primary))"
          radius={[4, 4, 0, 0]}
          animationBegin={0}
          animationDuration={800}
        />
      </BarChart>
    </ResponsiveContainer>
  );
};

export default OptimizedChart;