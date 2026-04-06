import { desc, eq } from 'drizzle-orm';
import { db } from '../client';
import { tasks, taskEvents, users } from '../schema';
import type { Task, TaskStatus } from '../schema';

export type TaskEventWithUser = {
  id: string;
  taskId: string;
  eventType: 'created' | 'updated' | 'status_changed' | 'assigned' | 'deleted';
  oldValue: string | null;
  newValue: string | null;
  userId: string | null;
  timestamp: Date;
  userName: string | null;
};

function generateId(): string {
  return crypto.randomUUID();
}

/**
 * Get all tasks for a project.
 */
export async function getTasksByProject(projectId: string): Promise<Task[]> {
  return db.select().from(tasks).where(eq(tasks.projectId, projectId));
}

/**
 * Get a single task by ID.
 */
export async function getTaskById(taskId: string): Promise<Task | null> {
  const result = await db.select().from(tasks).where(eq(tasks.id, taskId)).limit(1);
  return result[0] ?? null;
}

/**
 * Get task activity events with actor names.
 */
export async function getTaskEventsByTaskId(taskId: string): Promise<TaskEventWithUser[]> {
  const rows = await db
    .select({
      id: taskEvents.id,
      taskId: taskEvents.taskId,
      eventType: taskEvents.eventType,
      oldValue: taskEvents.oldValue,
      newValue: taskEvents.newValue,
      userId: taskEvents.userId,
      timestamp: taskEvents.timestamp,
      userName: users.name,
    })
    .from(taskEvents)
    .leftJoin(users, eq(taskEvents.userId, users.id))
    .where(eq(taskEvents.taskId, taskId))
    .orderBy(desc(taskEvents.timestamp));

  return rows;
}

/**
 * Create a new task and log a "created" event.
 */
export async function createTask(
  data: {
    projectId: string;
    title: string;
    description?: string;
    status?: TaskStatus;
    priority?: 'low' | 'medium' | 'high';
    assigneeId?: string;
  },
  userId: string
): Promise<Task> {
  const taskId = data.projectId ? generateId() : generateId();
  const now = new Date();

  const [task] = await db
    .insert(tasks)
    .values({
      id: taskId,
      projectId: data.projectId,
      title: data.title,
      description: data.description ?? null,
      status: data.status ?? 'backlog',
      priority: data.priority ?? 'medium',
      assigneeId: data.assigneeId ?? null,
      createdAt: now,
      updatedAt: now,
    })
    .returning();

  // Log the creation event
  await db.insert(taskEvents).values({
    id: generateId(),
    taskId: task.id,
    eventType: 'created',
    newValue: task.title,
    userId,
  });

  return task;
}

/**
 * Update a task's fields and log an "updated" event.
 */
export async function updateTask(
  taskId: string,
  data: {
    title?: string;
    description?: string;
    status?: TaskStatus;
    priority?: 'low' | 'medium' | 'high';
    assigneeId?: string | null;
  },
  userId: string
): Promise<Task | null> {
  const [updated] = await db
    .update(tasks)
    .set({
      ...data,
      updatedAt: new Date(),
    })
    .where(eq(tasks.id, taskId))
    .returning();

  if (updated) {
    await db.insert(taskEvents).values({
      id: generateId(),
      taskId: updated.id,
      eventType: 'updated',
      newValue: JSON.stringify(data),
      userId,
    });
  }

  return updated ?? null;
}

/**
 * Delete a task and log a "deleted" event.
 */
export async function deleteTask(taskId: string, userId: string): Promise<void> {
  // Log deletion before cascade removes the task
  await db.insert(taskEvents).values({
    id: generateId(),
    taskId,
    eventType: 'deleted',
    userId,
  });

  await db.delete(tasks).where(eq(tasks.id, taskId));
}

/**
 * Move a task to a new status and log a "status_changed" event.
 */
export async function moveTask(
  taskId: string,
  newStatus: TaskStatus,
  userId: string
): Promise<Task | null> {
  // Get the old status first
  const existing = await getTaskById(taskId);
  if (!existing) return null;

  const oldStatus = existing.status;

  const [updated] = await db
    .update(tasks)
    .set({
      status: newStatus,
      updatedAt: new Date(),
    })
    .where(eq(tasks.id, taskId))
    .returning();

  if (updated) {
    await db.insert(taskEvents).values({
      id: generateId(),
      taskId: updated.id,
      eventType: 'status_changed',
      oldValue: oldStatus,
      newValue: newStatus,
      userId,
    });
  }

  return updated ?? null;
}

/**
 * Bulk create tasks (used by agent to accept generated tasks).
 */
export async function bulkCreateTasks(
  items: Array<{
    projectId: string;
    title: string;
    description?: string;
    priority?: 'low' | 'medium' | 'high';
    storyPoints?: number;
    tags?: string[];
    aiGenerated?: boolean;
    aiMetadata?: Record<string, unknown>;
  }>,
  userId: string
): Promise<Task[]> {
  if (items.length === 0) return [];

  const now = new Date();
  const tasksToInsert = items.map((item) => ({
    id: generateId(),
    projectId: item.projectId,
    title: item.title,
    description: item.description ?? null,
    status: 'backlog' as TaskStatus,
    priority: item.priority ?? ('medium' as const),
    assigneeId: null,
    storyPoints: item.storyPoints ?? null,
    tags: item.tags ?? [],
    aiGenerated: item.aiGenerated ?? false,
    aiMetadata: item.aiMetadata ?? {},
    createdAt: now,
    updatedAt: now,
  }));

  const created = await db.insert(tasks).values(tasksToInsert).returning();

  // Log creation events for each task
  const events = created.map((task) => ({
    id: generateId(),
    taskId: task.id,
    eventType: 'created' as const,
    oldValue: null,
    newValue: task.title,
    userId,
    timestamp: now,
  }));

  if (events.length > 0) {
    await db.insert(taskEvents).values(events);
  }

  return created;
}
