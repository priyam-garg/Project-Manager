'use client';

import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { TrendingUp, TrendingDown, LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface MetricCardProps {
  label: string;
  value: string | number;
  trend?: number;
  icon: LucideIcon;
  isLoading?: boolean;
  colorClass?: string;
}

export function MetricCard({
  label,
  value,
  trend,
  icon: Icon,
  isLoading = false,
  colorClass = 'text-primary',
}: MetricCardProps) {
  if (isLoading) {
    return (
      <Card className="p-6">
        <div className="flex items-start justify-between">
          <div className="space-y-2 flex-1">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-8 w-16" />
          </div>
          <Skeleton className="h-10 w-10 rounded-lg" />
        </div>
        {trend !== undefined && <Skeleton className="h-4 w-20 mt-4" />}
      </Card>
    );
  }

  const isPositiveTrend = trend !== undefined && trend > 0;
  const isNegativeTrend = trend !== undefined && trend < 0;

  return (
    <Card className="p-6 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between">
        <div className="space-y-1 flex-1">
          <p className="text-sm font-medium text-muted-foreground">{label}</p>
          <p className="text-3xl font-bold">{value}</p>
        </div>
        <div className={cn('p-2 rounded-lg bg-muted', colorClass)}>
          <Icon className="h-6 w-6" />
        </div>
      </div>

      {trend !== undefined && (
        <div className="mt-4 flex items-center gap-1">
          {isPositiveTrend && (
            <>
              <TrendingUp className="h-4 w-4 text-green-600 dark:text-green-400" />
              <span className="text-sm font-medium text-green-600 dark:text-green-400">
                +{trend.toFixed(1)}%
              </span>
            </>
          )}
          {isNegativeTrend && (
            <>
              <TrendingDown className="h-4 w-4 text-red-600 dark:text-red-400" />
              <span className="text-sm font-medium text-red-600 dark:text-red-400">
                {trend.toFixed(1)}%
              </span>
            </>
          )}
          {!isPositiveTrend && !isNegativeTrend && (
            <span className="text-sm text-muted-foreground">No change</span>
          )}
          <span className="text-sm text-muted-foreground ml-1">vs last period</span>
        </div>
      )}
    </Card>
  );
}
