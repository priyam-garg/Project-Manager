'use server';

import type { AnalyticsData, DateRangeFilter, ApiResponse } from '@/types';
import { generateMockAnalytics, simulateDelay } from '@/lib/mock-data';

export async function getAnalytics(
  projectId: string,
  dateRange: DateRangeFilter
): Promise<ApiResponse<AnalyticsData>> {
  await simulateDelay(300, 600);

  try {
    const analytics = generateMockAnalytics(projectId, dateRange);
    return { success: true, data: analytics };
  } catch (error) {
    return { success: false, error: 'Failed to fetch analytics' };
  }
}
