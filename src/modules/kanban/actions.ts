'use server';

import { revalidatePath } from 'next/cache';
import type { Task, TaskStatus } from '@/core/db/schema';
import type { CreateTaskInput, UpdateTaskInput, ApiResponse } from '@/types';
import {
  generateMockTasks,
  generateMockTask,
  simulateDelay,
} from '@/lib/mock-data';

export async function getTasks(projectId: string): Promise<ApiResponse<Task[]>> {
  await simulateDelay(100, 300);

  try {
    const tasks = generateMockTasks(projectId, 20);
    return { success: true, data: tasks };
  } catch (error) {
    return { success: false, error: 'Failed to fetch tasks' };
  }
}

export async function createTask(input: CreateTaskInput): Promise<ApiResponse<Task>> {
  await simulateDelay(200, 400);

  try {
    const task = generateMockTask(input);
    revalidatePath(`/projects/${input.projectId}/board`);
    return { success: true, data: task };
  } catch (error) {
    return { success: false, error: 'Failed to create task' };
  }
}

export async function updateTask(input: UpdateTaskInput): Promise<ApiResponse<Task>> {
  await simulateDelay(150, 350);

  try {
    const task = generateMockTask({
      ...input,
      projectId: input.projectId || 'project-1',
      title: input.title || 'Updated Task',
      status: input.status || 'todo',
      priority: input.priority || 'medium',
    });
    revalidatePath(`/projects/${input.projectId}/board`);
    return { success: true, data: task };
  } catch (error) {
    return { success: false, error: 'Failed to update task' };
  }
}

export async function deleteTask(
  taskId: string,
  projectId: string
): Promise<ApiResponse<void>> {
  await simulateDelay(100, 200);

  try {
    revalidatePath(`/projects/${projectId}/board`);
    return { success: true };
  } catch (error) {
    return { success: false, error: 'Failed to delete task' };
  }
}

export async function moveTask(
  taskId: string,
  newStatus: TaskStatus,
  projectId: string
): Promise<ApiResponse<Task>> {
  await simulateDelay(100, 200);

  try {
    const task = generateMockTask({
      id: taskId,
      projectId,
      title: 'Moved Task',
      status: newStatus,
      priority: 'medium',
    });
    return { success: true, data: task };
  } catch (error) {
    return { success: false, error: 'Failed to move task' };
  }
}
