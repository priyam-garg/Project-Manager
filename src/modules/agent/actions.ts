'use server';

import type {
  TaskGenerationRequest,
  TaskGenerationResponse,
  ApiResponse,
  GeneratedTask,
} from '@/types';
import type { Task } from '@/core/db/schema';
import { generateMockTaskGeneration, generateMockTask, simulateDelay } from '@/lib/mock-data';

export async function generateTasks(
  request: TaskGenerationRequest
): Promise<ApiResponse<TaskGenerationResponse>> {
  await simulateDelay(1000, 2000);

  try {
    const result = generateMockTaskGeneration(request.requirement);
    return { success: true, data: result };
  } catch (error) {
    return { success: false, error: 'Failed to generate tasks' };
  }
}

export async function acceptGeneratedTasks(
  projectId: string,
  tasks: GeneratedTask[]
): Promise<ApiResponse<Task[]>> {
  await simulateDelay(300, 500);

  try {
    const createdTasks = tasks.map((t) =>
      generateMockTask({
        projectId,
        title: t.title,
        description: t.description,
        priority: t.priority,
        status: 'backlog',
      })
    );
    return { success: true, data: createdTasks };
  } catch (error) {
    return { success: false, error: 'Failed to accept tasks' };
  }
}
