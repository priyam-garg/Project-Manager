import { useEffect, useState } from 'react';
import { getAnalytics } from '../actions';
import type { AnalyticsData, DateRangeFilter } from '@/types';

export function useAnalytics(projectId: string, dateRange: DateRangeFilter) {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    async function fetchAnalytics() {
      setIsLoading(true);
      const result = await getAnalytics(projectId, dateRange);
      if (result.success && result.data) {
        setData(result.data);
      }
      setIsLoading(false);
    }

    fetchAnalytics();
  }, [projectId, dateRange]);

  return { data, isLoading };
}
