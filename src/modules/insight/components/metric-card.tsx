'use client';

import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { TrendingUp, TrendingDown, LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

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
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.25 }}
      transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
    >
      <Card className="p-6 transition-all duration-300 hover:-translate-y-1 hover:border-primary/35">
        <div className="flex items-start justify-between">
          <div className="flex-1 space-y-1">
            <p className="text-sm font-medium text-muted-foreground">{label}</p>
            <p className="text-3xl font-bold">{value}</p>
          </div>
          <div className={cn('rounded-xl bg-muted/70 p-2.5', colorClass)}>
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
            <span className="ml-1 text-sm text-muted-foreground">vs last period</span>
          </div>
        )}
      </Card>
    </motion.div>
  );
}
