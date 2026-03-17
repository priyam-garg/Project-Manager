'use server';

import type {
  TaskGenerationRequest,
  TaskGenerationResponse,
  ApiResponse,
  GeneratedTask,
} from '@/types';
import type { Task } from '@/core/db/schema';
import { getAuthUser } from '@/core/auth';
import {
  saveGeneration,
  getGenerationHistory as dbGetGenerationHistory,
  updateGenerationAcceptedCount,
} from '@/core/db/queries';
import { bulkCreateTasks } from '@/core/db/queries';
import { generateMockTaskGeneration } from '@/lib/mock-data';

/**
 * Generate tasks from a requirement.
 * AI generation is still mock — the result is persisted to the database.
 */
export async function generateTasks(
  request: TaskGenerationRequest
): Promise<ApiResponse<TaskGenerationResponse>> {
  try {
    const user = await getAuthUser();

    // Generate tasks (still mock — AI integration is a separate feature)
    const result = generateMockTaskGeneration(request.requirement);

    // Persist the generation record
    await saveGeneration({
      projectId: request.projectId,
      userId: user.id,
      requirement: request.requirement,
      generatedTasks: result.tasks,
      reasoning: result.reasoning,
    });

    return { success: true, data: result };
  } catch (error) {
    console.error('Failed to generate tasks:', error);
    return { success: false, error: 'Failed to generate tasks' };
  }
}

/**
 * Accept generated tasks and create them in the project.
 */
export async function acceptGeneratedTasks(
  projectId: string,
  tasks: GeneratedTask[]
): Promise<ApiResponse<Task[]>> {
  try {
    const user = await getAuthUser();

    const createdTasks = await bulkCreateTasks(
      tasks.map((t) => ({
        projectId,
        title: t.title,
        description: t.description,
        priority: t.priority,
      })),
      user.id
    );

    return { success: true, data: createdTasks };
  } catch (error) {
    console.error('Failed to accept tasks:', error);
    return { success: false, error: 'Failed to accept tasks' };
  }
}

/**
 * Get the generation history for a project.
 */
export async function getGenerationHistory(
  projectId: string
): Promise<ApiResponse<Array<{ id: string; requirement: string; taskCount: number; createdAt: Date }>>> {
  try {
    await getAuthUser();
    const history = await dbGetGenerationHistory(projectId);

    return {
      success: true,
      data: history.map((g) => ({
        id: g.id,
        requirement: g.requirement,
        taskCount: Array.isArray(g.generatedTasks) ? g.generatedTasks.length : 0,
        createdAt: g.createdAt,
      })),
    };
  } catch (error) {
    console.error('Failed to fetch generation history:', error);
    return { success: false, error: 'Failed to fetch generation history' };
  }
}
