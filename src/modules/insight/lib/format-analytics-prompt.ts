import type { AnalyticsData, DateRangeFilter } from '@/types';

export const INSIGHT_NARRATIVE_SYSTEM_PROMPT = `You are a senior Product Manager analyzing a software project's health metrics.

Your task is to produce a concise narrative summary (3–5 paragraphs, under 500 words) that covers:

1. **Overall Health Assessment** — Is the project on track, at risk, or stalled?
2. **Key Observations** — Reference specific numbers (task counts, completion rate, trend).
3. **Roadmap Alignment** — If a roadmap/implementation plan is available, assess whether current progress aligns with the planned phases and goals.
4. **Codebase Coverage** — If code structure data is available, note how well the codebase aligns with the task breakdown and whether any areas appear under-covered.
5. **Risks & Bottlenecks** — Identify stagnation, overloaded members, priority imbalances, or growing backlogs.
6. **Actionable Recommendations** — End with 2–3 concrete next steps the team should take.

Rules:
- Use markdown formatting: **bold** for emphasis, bullet lists for recommendations.
- Be data-driven — cite the exact numbers from the data provided.
- If roadmap or code data is available, reference it in your analysis.
- If the data shows zero tasks or minimal activity, note the project is in its early stages and recommend initial setup steps.
- Write in clear, accessible language. Avoid jargon.
- Do NOT invent data that is not provided.`;

export const SUGGEST_CHANGES_SYSTEM_PROMPT = `You are a senior Technical Lead reviewing a software project and suggesting concrete, actionable changes.

Based on the project's task metrics, roadmap/implementation plan, and codebase structure, produce a clear set of recommendations. Structure your response as:

1. **🔴 Critical Actions** — Urgent issues that need immediate attention (blocked tasks, overdue phases, critical gaps).
2. **🟡 Improvements** — Changes that would improve velocity, quality, or alignment with the roadmap.
3. **🟢 Opportunities** — Nice-to-have optimizations, new tasks to create, or areas to explore.

For each suggestion, provide:
- A short, actionable title
- 1–2 sentences explaining the rationale
- If relevant, reference specific roadmap phases, task counts, or code areas

Rules:
- Be specific — mention task names, roadmap phases, file paths where applicable.
- Limit to 5–8 total suggestions across all categories.
- Use markdown formatting: **bold** titles, bullet lists, emojis for visual scanning.
- If roadmap or code data is missing, focus on what's available and recommend setting those up.
- Do NOT invent data that is not provided.`;

const DATE_RANGE_LABELS: Record<DateRangeFilter, string> = {
  '7d': 'Last 7 days',
  '30d': 'Last 30 days',
  '90d': 'Last 90 days',
  all: 'All time',
};

export function formatAnalyticsPrompt(
  data: AnalyticsData,
  dateRange: DateRangeFilter,
  roadmapContent?: string | null,
  codeStructure?: string | null
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

  // Roadmap / Implementation Plan
  if (roadmapContent) {
    lines.push('### Roadmap / Implementation Plan');
    // Truncate to avoid exceeding token limits
    const truncated =
      roadmapContent.length > 2000
        ? roadmapContent.slice(0, 2000) + '\n\n... (truncated)'
        : roadmapContent;
    lines.push(truncated);
    lines.push('');
  }

  // Codebase Structure
  if (codeStructure) {
    lines.push('### Codebase Structure (file tree)');
    lines.push(codeStructure);
    lines.push('');
  }

  lines.push('Analyze this data and provide your assessment.');

  return lines.join('\n');
}

export function formatSuggestionsPrompt(
  data: AnalyticsData,
  dateRange: DateRangeFilter,
  roadmapContent?: string | null,
  codeStructure?: string | null
): string {
  // Reuse the same data formatting
  const basePrompt = formatAnalyticsPrompt(data, dateRange, roadmapContent, codeStructure);

  return (
    basePrompt.replace(
      'Analyze this data and provide your assessment.',
      ''
    ).trim() +
    '\n\nBased on ALL the data above (metrics, roadmap, and code structure), suggest concrete changes the team should make. Focus on actionable improvements.'
  );
}
