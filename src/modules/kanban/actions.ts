'use server';

import { revalidatePath } from 'next/cache';
import { after } from 'next/server';
import { upsertTaskVector, deleteTaskVector } from '@/modules/rag/sync';
import type { Task, TaskStatus } from '@/core/db/schema';
import type { CreateTaskInput, UpdateTaskInput, ApiResponse } from '@/types';
import { getAuthUser, requireRole } from '@/core/auth';
import {
  getTasksByProject,
  getTaskEventsByTaskId,
  createTask as dbCreateTask,
  updateTask as dbUpdateTask,
  deleteTask as dbDeleteTask,
  moveTask as dbMoveTask,
} from '@/core/db/queries';
import type { TaskEventWithUser } from '@/core/db/queries/tasks';

export async function getTasks(projectId: string): Promise<ApiResponse<Task[]>> {
  try {
    const user = await getAuthUser();
    await requireRole(user.id, projectId, 'member');
    const tasks = await getTasksByProject(projectId);
    return { success: true, data: tasks };
  } catch (error) {
    console.error('Failed to fetch tasks:', error);
    return { success: false, error: 'Failed to fetch tasks' };
  }
}

export async function getTaskEvents(
  taskId: string
): Promise<ApiResponse<TaskEventWithUser[]>> {
  try {
    const events = await getTaskEventsByTaskId(taskId);
    return { success: true, data: events };
  } catch (error) {
    console.error('Failed to fetch task events:', error);
    return { success: false, error: 'Failed to fetch task events' };
  }
}

export async function createTask(input: CreateTaskInput): Promise<ApiResponse<Task>> {
  try {
    const user = await getAuthUser();
    await requireRole(user.id, input.projectId, 'member');
    const task = await dbCreateTask(
      {
        projectId: input.projectId,
        title: input.title,
        description: input.description,
        status: input.status,
        priority: input.priority,
        assigneeId: input.assigneeId,
      },
      user.id
    );
    revalidatePath(`/projects/${input.projectId}/board`);
    after(() => upsertTaskVector(task).catch((e) => console.error('Vector sync failed:', e)));
    return { success: true, data: task };
  } catch (error) {
    console.error('Failed to create task:', error);
    return { success: false, error: 'Failed to create task' };
  }
}

export async function updateTask(input: UpdateTaskInput): Promise<ApiResponse<Task>> {
  try {
    const user = await getAuthUser();
    if (!input.projectId) {
      return { success: false, error: 'projectId is required' };
    }
    await requireRole(user.id, input.projectId, 'member');
    const task = await dbUpdateTask(
      input.id,
      {
        title: input.title,
        description: input.description,
        status: input.status,
        priority: input.priority,
        assigneeId: input.assigneeId,
      },
      user.id
    );

    if (!task) {
      return { success: false, error: 'Task not found' };
    }

    revalidatePath(`/projects/${input.projectId}/board`);
    after(() => upsertTaskVector(task).catch((e) => console.error('Vector sync failed:', e)));
    return { success: true, data: task };
  } catch (error) {
    console.error('Failed to update task:', error);
    return { success: false, error: 'Failed to update task' };
  }
}

export async function deleteTask(
  taskId: string,
  projectId: string
): Promise<ApiResponse<void>> {
  try {
    const user = await getAuthUser();
    await requireRole(user.id, projectId, 'admin');
    await dbDeleteTask(taskId, user.id);
    revalidatePath(`/projects/${projectId}/board`);
    after(() => deleteTaskVector(taskId).catch((e) => console.error('Vector delete failed:', e)));
    return { success: true };
  } catch (error) {
    console.error('Failed to delete task:', error);
    return { success: false, error: 'Failed to delete task' };
  }
}

export async function moveTask(
  taskId: string,
  newStatus: TaskStatus,
  projectId: string
): Promise<ApiResponse<Task>> {
  try {
    const user = await getAuthUser();
    await requireRole(user.id, projectId, 'member');
    const task = await dbMoveTask(taskId, newStatus, user.id);

    if (!task) {
      return { success: false, error: 'Task not found' };
    }

    after(() => upsertTaskVector(task).catch((e) => console.error('Vector sync failed:', e)));
    return { success: true, data: task };
  } catch (error) {
    console.error('Failed to move task:', error);
    return { success: false, error: 'Failed to move task' };
  }
}
