'use server';

import type { AnalyticsData, DateRangeFilter, ApiResponse } from '@/types';
import { getAuthUser } from '@/core/auth';
import {
  getProjectMetrics,
  getTaskDistribution,
  getPriorityBreakdown,
  getMemberPerformance,
  getBurndownData,
  getActivePlanContent,
} from '@/core/db/queries';
import { generateChatCompletion } from '@/core/ai/chat';
import {
  formatAnalyticsPrompt,
  formatSuggestionsPrompt,
  INSIGHT_NARRATIVE_SYSTEM_PROMPT,
  SUGGEST_CHANGES_SYSTEM_PROMPT,
} from './lib/format-analytics-prompt';
import { getConnectionStatus, getFileTree } from '@/modules/github/actions';

/**
 * Fetch the optional roadmap content and code file tree for a project.
 * Returns nulls gracefully if either is unavailable.
 */
async function fetchContextData(projectId: string) {
  const [roadmapContent, githubStatus] = await Promise.all([
    getActivePlanContent(projectId).catch(() => null),
    getConnectionStatus(projectId).catch(() => null),
  ]);

  let codeStructure: string | null = null;

  if (githubStatus?.success && githubStatus.data?.connected && githubStatus.data?.hasRepo) {
    try {
      const treeResult = await getFileTree(projectId);
      if (treeResult.success && treeResult.data) {
        // Build a compact file tree summary (limit to 100 entries to keep tokens manageable)
        const entries = treeResult.data.slice(0, 100);
        const treeLines = entries.map(
          (n) => `${n.type === 'tree' ? '📁' : '📄'} ${n.path}`
        );
        if (treeResult.data.length > 100) {
          treeLines.push(`... and ${treeResult.data.length - 100} more files`);
        }
        codeStructure = treeLines.join('\n');
      }
    } catch {
      // Silently ignore — code data is optional
    }
  }

  return { roadmapContent, codeStructure };
}

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

    const [analyticsResult, contextData] = await Promise.all([
      getAnalytics(projectId, dateRange),
      fetchContextData(projectId),
    ]);

    if (!analyticsResult.success || !analyticsResult.data) {
      return { success: false, error: 'Unable to load analytics data' };
    }

    const message = formatAnalyticsPrompt(
      analyticsResult.data,
      dateRange,
      contextData.roadmapContent,
      contextData.codeStructure
    );

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

export async function generateSuggestions(
  projectId: string,
  dateRange: DateRangeFilter
): Promise<ApiResponse<string>> {
  try {
    await getAuthUser();

    const [analyticsResult, contextData] = await Promise.all([
      getAnalytics(projectId, dateRange),
      fetchContextData(projectId),
    ]);

    if (!analyticsResult.success || !analyticsResult.data) {
      return { success: false, error: 'Unable to load analytics data' };
    }

    const message = formatSuggestionsPrompt(
      analyticsResult.data,
      dateRange,
      contextData.roadmapContent,
      contextData.codeStructure
    );

    const completion = await generateChatCompletion({
      message,
      history: [],
      systemPrompt: SUGGEST_CHANGES_SYSTEM_PROMPT,
    });

    return { success: true, data: completion.content };
  } catch (error) {
    console.error('Failed to generate suggestions:', error);
    const message =
      error instanceof Error && error.message.toLowerCase().includes('timeout')
        ? 'The AI service timed out. Please try again.'
        : 'Failed to generate suggestions';
    return { success: false, error: message };
  }
}
