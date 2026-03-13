'use client';

import { Card } from '@/components/ui/card';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import type { TaskDistribution } from '@/types';
import { useTheme } from 'next-themes';

interface DistributionChartProps {
  data: TaskDistribution[];
}

const STATUS_COLORS = {
  backlog: '#6b7280',
  todo: '#3b82f6',
  in_progress: '#f59e0b',
  done: '#10b981',
};

const STATUS_LABELS = {
  backlog: 'Backlog',
  todo: 'To Do',
  in_progress: 'In Progress',
  done: 'Done',
};

export function DistributionChart({ data }: DistributionChartProps) {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  const chartData = data.map((item) => ({
    ...item,
    name: STATUS_LABELS[item.status] || item.status,
  }));

  const chartColors = {
    grid: isDark ? '#374151' : '#e5e7eb',
    text: isDark ? '#9ca3af' : '#6b7280',
  };

  return (
    <Card className="p-6">
      <div className="space-y-4">
        <div>
          <h3 className="text-lg font-semibold">Task Distribution</h3>
          <p className="text-sm text-muted-foreground">Tasks by status</p>
        </div>

        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={chartData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={chartColors.grid} />
            <XAxis dataKey="name" stroke={chartColors.text} fontSize={12} />
            <YAxis stroke={chartColors.text} fontSize={12} />
            <Tooltip
              contentStyle={{
                backgroundColor: isDark ? '#1f2937' : '#ffffff',
                border: `1px solid ${chartColors.grid}`,
                borderRadius: '8px',
              }}
              labelStyle={{ color: chartColors.text }}
              formatter={(value: number) => [`${value} tasks`, 'Count']}
            />
            <Bar dataKey="count" radius={[8, 8, 0, 0]}>
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={STATUS_COLORS[entry.status]} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>

        {/* Legend */}
        <div className="flex flex-wrap gap-4 justify-center">
          {data.map((item) => (
            <div key={item.status} className="flex items-center gap-2">
              <div
                className="w-3 h-3 rounded"
                style={{ backgroundColor: STATUS_COLORS[item.status] }}
              />
              <span className="text-sm text-muted-foreground">
                {STATUS_LABELS[item.status]}: {item.count}
              </span>
            </div>
          ))}
        </div>
      </div>
    </Card>
  );
}
