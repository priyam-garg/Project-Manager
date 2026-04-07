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
import { generateChatCompletion } from '@/core/ai/chat';
import {
  formatAnalyticsPrompt,
  INSIGHT_NARRATIVE_SYSTEM_PROMPT,
} from './lib/format-analytics-prompt';

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

export async function generateNarrative(
  projectId: string,
  dateRange: DateRangeFilter
): Promise<ApiResponse<string>> {
  try {
    await getAuthUser();

    const result = await getAnalytics(projectId, dateRange);
    if (!result.success || !result.data) {
      return { success: false, error: 'Unable to load analytics data' };
    }

    const message = formatAnalyticsPrompt(result.data, dateRange);

    const completion = await generateChatCompletion({
      message,
      history: [],
      systemPrompt: INSIGHT_NARRATIVE_SYSTEM_PROMPT,
    });

    return { success: true, data: completion.content };
  } catch (error) {
    console.error('Failed to generate narrative:', error);
    const message =
      error instanceof Error && error.message.toLowerCase().includes('timeout')
        ? 'The AI service timed out. Please try again.'
        : 'Failed to generate narrative';
    return { success: false, error: message };
  }
}
