'use client';

import { Card } from '@/components/ui/card';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import type { BurndownDataPoint } from '@/types';
import { useTheme } from 'next-themes';

interface BurndownChartProps {
  data: BurndownDataPoint[];
}

export function BurndownChart({ data }: BurndownChartProps) {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  const chartColors = {
    remaining: isDark ? '#ef4444' : '#dc2626',
    completed: isDark ? '#22c55e' : '#16a34a',
    grid: isDark ? '#374151' : '#e5e7eb',
    text: isDark ? '#9ca3af' : '#6b7280',
  };

  return (
    <Card className="p-6">
      <div className="space-y-4">
        <div>
          <h3 className="text-lg font-semibold">Burndown Chart</h3>
          <p className="text-sm text-muted-foreground">Task completion over time</p>
        </div>

        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={data} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={chartColors.grid} />
            <XAxis
              dataKey="date"
              stroke={chartColors.text}
              fontSize={12}
              tickFormatter={(value) => {
                const date = new Date(value);
                return `${date.getMonth() + 1}/${date.getDate()}`;
              }}
            />
            <YAxis stroke={chartColors.text} fontSize={12} />
            <Tooltip
              contentStyle={{
                backgroundColor: isDark ? '#1f2937' : '#ffffff',
                border: `1px solid ${chartColors.grid}`,
                borderRadius: '8px',
              }}
              labelStyle={{ color: chartColors.text }}
              formatter={(value: number) => [`${value} tasks`, '']}
              labelFormatter={(label) => {
                const date = new Date(label);
                return date.toLocaleDateString();
              }}
            />
            <Legend />
            <Line
              type="monotone"
              dataKey="remaining"
              stroke={chartColors.remaining}
              strokeWidth={2}
              dot={{ fill: chartColors.remaining, r: 4 }}
              activeDot={{ r: 6 }}
              name="Remaining"
            />
            <Line
              type="monotone"
              dataKey="completed"
              stroke={chartColors.completed}
              strokeWidth={2}
              dot={{ fill: chartColors.completed, r: 4 }}
              activeDot={{ r: 6 }}
              name="Completed"
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}
