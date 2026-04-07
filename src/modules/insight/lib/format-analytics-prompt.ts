import type { AnalyticsData, DateRangeFilter } from '@/types';

export const INSIGHT_NARRATIVE_SYSTEM_PROMPT = `You are a senior Product Manager analyzing a software project's health metrics.

Your task is to produce a concise narrative summary (3–5 paragraphs, under 500 words) that covers:

1. **Overall Health Assessment** — Is the project on track, at risk, or stalled?
2. **Key Observations** — Reference specific numbers (task counts, completion rate, trend).
3. **Risks & Bottlenecks** — Identify stagnation, overloaded members, priority imbalances, or growing backlogs.
4. **Actionable Recommendations** — End with 2–3 concrete next steps the team should take.

Rules:
- Use markdown formatting: **bold** for emphasis, bullet lists for recommendations.
- Be data-driven — cite the exact numbers from the data provided.
- If the data shows zero tasks or minimal activity, note the project is in its early stages and recommend initial setup steps.
- Write in clear, accessible language. Avoid jargon.
- Do NOT invent data that is not provided.`;

const DATE_RANGE_LABELS: Record<DateRangeFilter, string> = {
  '7d': 'Last 7 days',
  '30d': 'Last 30 days',
  '90d': 'Last 90 days',
  all: 'All time',
};

export function formatAnalyticsPrompt(
  data: AnalyticsData,
  dateRange: DateRangeFilter
): string {
  const lines: string[] = [];

  lines.push(`## Project Analytics — ${DATE_RANGE_LABELS[dateRange]}`);
  lines.push('');

  // Metrics
  const m = data.metrics;
  lines.push('### Key Metrics');
  lines.push(`- Total Tasks: ${m.totalTasks}`);
  lines.push(`- Completed: ${m.completedTasks}`);
  lines.push(`- In Progress: ${m.inProgressTasks}`);
  lines.push(`- Completion Rate: ${m.completionRate.toFixed(1)}%`);
  lines.push(
    `- Completion Trend: ${m.completionTrend >= 0 ? '+' : ''}${m.completionTrend.toFixed(1)}% vs previous period`
  );
  lines.push('');

  // Task distribution
  lines.push('### Task Distribution by Status');
  for (const d of data.distribution) {
    lines.push(`- ${d.status}: ${d.count}`);
  }
  lines.push('');

  // Priority breakdown
  lines.push('### Priority Breakdown');
  for (const p of data.priorityBreakdown) {
    lines.push(`- ${p.priority}: ${p.count}`);
  }
  lines.push('');

  // Team performance
  if (data.memberPerformance.length > 0) {
    lines.push('### Team Performance');
    for (const member of data.memberPerformance) {
      lines.push(
        `- ${member.userName}: ${member.tasksCompleted} completed, ${member.tasksInProgress} in progress`
      );
    }
    lines.push('');
  }

  // Burndown summary
  if (data.burndown.length > 0) {
    const first = data.burndown[0];
    const last = data.burndown[data.burndown.length - 1];
    lines.push('### Burndown Trend');
    lines.push(`- Start (${first.date}): ${first.remaining} remaining, ${first.completed} completed`);
    lines.push(`- End (${last.date}): ${last.remaining} remaining, ${last.completed} completed`);
    const direction =
      last.remaining < first.remaining
        ? 'Remaining work is decreasing (good)'
        : last.remaining > first.remaining
          ? 'Remaining work is increasing (concerning)'
          : 'Remaining work is flat';
    lines.push(`- Direction: ${direction}`);
    lines.push('');
  }

  lines.push('Analyze this data and provide your assessment.');

  return lines.join('\n');
}
