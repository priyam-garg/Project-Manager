import { eq, sql, and, gte } from 'drizzle-orm';
import { db } from '../client';
import { tasks, taskEvents, users, projectMembers } from '../schema';
import type { TaskStatus, TaskPriority } from '../schema';

/**
 * Get overall project metrics: total tasks, completed, in-progress, completion rate.
 */
export async function getProjectMetrics(projectId: string) {
  const allTasks = await db
    .select({
      status: tasks.status,
    })
    .from(tasks)
    .where(eq(tasks.projectId, projectId));

  const total = allTasks.length;
  const completed = allTasks.filter((t) => t.status === 'done').length;
  const inProgress = allTasks.filter((t) => t.status === 'in_progress').length;

  // Calculate completion trend (compare last 7 days vs previous 7 days)
  const now = new Date();
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const fourteenDaysAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);

  const recentCompletions = await db
    .select()
    .from(taskEvents)
    .innerJoin(tasks, eq(taskEvents.taskId, tasks.id))
    .where(
      and(
        eq(tasks.projectId, projectId),
        eq(taskEvents.eventType, 'status_changed'),
        eq(taskEvents.newValue, 'done'),
        gte(taskEvents.timestamp, sevenDaysAgo)
      )
    );

  const previousCompletions = await db
    .select()
    .from(taskEvents)
    .innerJoin(tasks, eq(taskEvents.taskId, tasks.id))
    .where(
      and(
        eq(tasks.projectId, projectId),
        eq(taskEvents.eventType, 'status_changed'),
        eq(taskEvents.newValue, 'done'),
        gte(taskEvents.timestamp, fourteenDaysAgo)
      )
    );

  const previousOnly = previousCompletions.length - recentCompletions.length;
  const trend =
    previousOnly > 0
      ? ((recentCompletions.length - previousOnly) / previousOnly) * 100
      : recentCompletions.length > 0
        ? 100
        : 0;

  return {
    totalTasks: total,
    completedTasks: completed,
    inProgressTasks: inProgress,
    completionRate: total > 0 ? Math.round((completed / total) * 100) : 0,
    completionTrend: Math.round(trend * 10) / 10,
  };
}

/**
 * Get task distribution by status.
 */
export async function getTaskDistribution(
  projectId: string
): Promise<Array<{ status: TaskStatus; count: number }>> {
  const allTasks = await db
    .select({ status: tasks.status })
    .from(tasks)
    .where(eq(tasks.projectId, projectId));

  const statusCounts: Record<string, number> = {};
  for (const t of allTasks) {
    statusCounts[t.status] = (statusCounts[t.status] || 0) + 1;
  }

  const statuses: TaskStatus[] = ['backlog', 'todo', 'in_progress', 'done'];
  return statuses.map((status) => ({
    status,
    count: statusCounts[status] || 0,
  }));
}

/**
 * Get task breakdown by priority.
 */
export async function getPriorityBreakdown(
  projectId: string
): Promise<Array<{ priority: TaskPriority; count: number }>> {
  const allTasks = await db
    .select({ priority: tasks.priority })
    .from(tasks)
    .where(eq(tasks.projectId, projectId));

  const priorityCounts: Record<string, number> = {};
  for (const t of allTasks) {
    priorityCounts[t.priority] = (priorityCounts[t.priority] || 0) + 1;
  }

  const priorities: TaskPriority[] = ['low', 'medium', 'high'];
  return priorities.map((priority) => ({
    priority,
    count: priorityCounts[priority] || 0,
  }));
}

/**
 * Get per-member performance (completed and in-progress task counts).
 * Also counts unassigned tasks so the totals match the board.
 */
export async function getMemberPerformance(projectId: string) {
  // Get all members of the project
  const members = await db
    .select({
      userId: projectMembers.userId,
      userName: users.name,
    })
    .from(projectMembers)
    .innerJoin(users, eq(projectMembers.userId, users.id))
    .where(eq(projectMembers.projectId, projectId));

  // Get tasks for this project
  const projectTasks = await db
    .select({
      assigneeId: tasks.assigneeId,
      status: tasks.status,
    })
    .from(tasks)
    .where(eq(tasks.projectId, projectId));

  // Count unassigned tasks
  const unassignedTasks = projectTasks.filter((t) => !t.assigneeId);
  const unassignedCompleted = unassignedTasks.filter((t) => t.status === 'done').length;
  const unassignedInProgress = unassignedTasks.filter((t) => t.status === 'in_progress').length;

  const result = members.map((member) => {
    const memberTasks = projectTasks.filter((t) => t.assigneeId === member.userId);
    // If only one member, attribute unassigned tasks to them
    const includeUnassigned = members.length === 1;
    const completed = memberTasks.filter((t) => t.status === 'done').length
      + (includeUnassigned ? unassignedCompleted : 0);
    const inProgress = memberTasks.filter((t) => t.status === 'in_progress').length
      + (includeUnassigned ? unassignedInProgress : 0);
    return {
      userId: member.userId,
      userName: member.userName,
      tasksCompleted: completed,
      tasksInProgress: inProgress,
    };
  });

  // If multiple members, add an "Unassigned" row so the numbers add up
  if (members.length > 1 && unassignedTasks.length > 0) {
    result.push({
      userId: 'unassigned',
      userName: 'Unassigned',
      tasksCompleted: unassignedCompleted,
      tasksInProgress: unassignedInProgress,
    });
  }

  return result;
}

/**
 * Get burndown data over a given number of days.
 * Uses task creation and completion events to compute remaining/completed curves.
 */
export async function getBurndownData(projectId: string, days: number) {
  const now = new Date();
  const startDate = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);

  // Get all tasks for this project
  const allTasks = await db
    .select()
    .from(tasks)
    .where(eq(tasks.projectId, projectId));

  // Get status_changed events to 'done' within the range
  const completionEvents = await db
    .select({
      timestamp: taskEvents.timestamp,
    })
    .from(taskEvents)
    .innerJoin(tasks, eq(taskEvents.taskId, tasks.id))
    .where(
      and(
        eq(tasks.projectId, projectId),
        eq(taskEvents.eventType, 'status_changed'),
        eq(taskEvents.newValue, 'done'),
        gte(taskEvents.timestamp, startDate)
      )
    );

  const totalTasks = allTasks.length;
  const currentlyCompleted = allTasks.filter((t) => t.status === 'done').length;

  // Build daily data points
  const dataPoints = [];
  const pointCount = Math.min(days, 30); // Cap at 30 data points for readability

  for (let i = 0; i < pointCount; i++) {
    const date = new Date(now.getTime() - (pointCount - i - 1) * 24 * 60 * 60 * 1000);
    const dateStr = date.toISOString().split('T')[0];

    // Count completions up to this date
    const completedByDate = completionEvents.filter(
      (e) => e.timestamp <= date
    ).length;

    // Estimate: spread current completion count over the timeline
    const estimatedCompleted = Math.min(
      currentlyCompleted,
      Math.round((completedByDate / (completionEvents.length || 1)) * currentlyCompleted)
    );

    dataPoints.push({
      date: dateStr,
      remaining: Math.max(0, totalTasks - estimatedCompleted),
      completed: estimatedCompleted,
    });
  }

  return dataPoints;
}
