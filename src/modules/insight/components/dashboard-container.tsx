'use client';

import { useState } from 'react';
import { MetricCard } from './metric-card';
import { BurndownChart } from './burndown-chart';
import { DistributionChart } from './distribution-chart';
import { PriorityChart } from './priority-chart';
import { MemberPerformanceComponent } from './member-performance';
import { DateRangeFilterComponent } from './date-range-filter';
import { useAnalytics } from '../hooks/use-analytics';
import type { DateRangeFilter } from '@/types';
import { 
  CheckCircle2, 
  Clock, 
  ListTodo, 
  TrendingUp 
} from 'lucide-react';

interface DashboardContainerProps {
  projectId: string;
}

export function DashboardContainer({ projectId }: DashboardContainerProps) {
  const [dateRange, setDateRange] = useState<DateRangeFilter>('30d');
  const { data, isLoading } = useAnalytics(projectId, dateRange);

  return (
    <div className="h-full overflow-y-auto">
      <div className="max-w-7xl mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-3xl font-bold">Insights</h1>
            <p className="text-muted-foreground">Project analytics and team performance</p>
          </div>
          <DateRangeFilterComponent value={dateRange} onChange={setDateRange} />
        </div>

        {/* Metrics Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <MetricCard
            label="Total Tasks"
            value={data?.metrics.totalTasks ?? 0}
            icon={ListTodo}
            isLoading={isLoading}
            colorClass="text-blue-600 dark:text-blue-400"
          />
          <MetricCard
            label="Completed"
            value={data?.metrics.completedTasks ?? 0}
            icon={CheckCircle2}
            isLoading={isLoading}
            colorClass="text-green-600 dark:text-green-400"
          />
          <MetricCard
            label="In Progress"
            value={data?.metrics.inProgressTasks ?? 0}
            icon={Clock}
            isLoading={isLoading}
            colorClass="text-orange-600 dark:text-orange-400"
          />
          <MetricCard
            label="Completion Rate"
            value={data ? `${data.metrics.completionRate.toFixed(1)}%` : '0%'}
            trend={data?.metrics.completionTrend}
            icon={TrendingUp}
            isLoading={isLoading}
            colorClass="text-purple-600 dark:text-purple-400"
          />
        </div>

        {/* Charts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Burndown Chart */}
          {data && <BurndownChart data={data.burndown} />}
          
          {/* Distribution Chart */}
          {data && <DistributionChart data={data.distribution} />}
          
          {/* Priority Chart */}
          {data && <PriorityChart data={data.priorityBreakdown} />}
          
          {/* Member Performance */}
          {data && <MemberPerformanceComponent data={data.memberPerformance} />}
        </div>

        {/* Loading State */}
        {isLoading && !data && (
          <div className="flex items-center justify-center py-12">
            <div className="text-center space-y-2">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto" />
              <p className="text-sm text-muted-foreground">Loading analytics...</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
