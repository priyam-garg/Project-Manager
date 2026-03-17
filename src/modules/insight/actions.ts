'use server';

import type { AnalyticsData, DateRangeFilter, ApiResponse } from '@/types';
import { getAuthUser } from '@/core/auth';
import {
  getProjectMetrics,
  getTaskDistribution,
  getPriorityBreakdown,
  getMemberPerformance,
  getBurndownData,
} from '@/core/db/queries';

export async function getAnalytics(
  projectId: string,
  dateRange: DateRangeFilter
): Promise<ApiResponse<AnalyticsData>> {
  try {
    await getAuthUser();

    const days =
      dateRange === '7d' ? 7 : dateRange === '30d' ? 30 : dateRange === '90d' ? 90 : 180;

    const [metrics, distribution, priorityBreakdown, memberPerformance, burndown] =
      await Promise.all([
        getProjectMetrics(projectId),
        getTaskDistribution(projectId),
        getPriorityBreakdown(projectId),
        getMemberPerformance(projectId),
        getBurndownData(projectId, days),
      ]);

    return {
      success: true,
      data: {
        metrics,
        distribution,
        priorityBreakdown,
        memberPerformance,
        burndown,
      },
    };
  } catch (error) {
    console.error('Failed to fetch analytics:', error);
    return { success: false, error: 'Failed to fetch analytics' };
  }
}
