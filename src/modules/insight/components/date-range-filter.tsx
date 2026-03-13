'use client';

import { Button } from '@/components/ui/button';
import type { DateRangeFilter } from '@/types';
import { cn } from '@/lib/utils';

interface DateRangeFilterProps {
  value: DateRangeFilter;
  onChange: (value: DateRangeFilter) => void;
}

const DATE_RANGES: { value: DateRangeFilter; label: string }[] = [
  { value: '7d', label: 'Last 7 days' },
  { value: '30d', label: 'Last 30 days' },
  { value: '90d', label: 'Last 90 days' },
  { value: 'all', label: 'All time' },
];

export function DateRangeFilterComponent({ value, onChange }: DateRangeFilterProps) {
  return (
    <div className="flex items-center gap-2 flex-wrap">
      <span className="text-sm font-medium text-muted-foreground">Time range:</span>
      <div className="flex gap-1 p-1 bg-muted rounded-lg">
        {DATE_RANGES.map((range) => (
          <Button
            key={range.value}
            variant={value === range.value ? 'default' : 'ghost'}
            size="sm"
            onClick={() => onChange(range.value)}
            className={cn(
              'h-8 text-xs',
              value === range.value && 'shadow-sm'
            )}
          >
            {range.label}
          </Button>
        ))}
      </div>
    </div>
  );
}
