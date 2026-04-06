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
import { getProjectById } from '@/core/db/queries';
import { runArchitectGraph } from '@/modules/architect/graph';

/**
 * Generate tasks from a requirement using the LangGraph architect agent.
 * The agent performs a Plan → Critique → Finalize loop for high-quality decomposition.
 */
export async function generateTasks(
  request: TaskGenerationRequest
): Promise<ApiResponse<TaskGenerationResponse>> {
  try {
    const user = await getAuthUser();

    // Fetch project context for the architect agent
    const project = await getProjectById(request.projectId);

    // Run the LangGraph architect agent
    const architectResult = await runArchitectGraph({
      requirement: request.requirement,
      projectName: project?.name,
      projectDescription: project?.description ?? undefined,
      techStack: request.techStack ?? project?.techStack ?? [],
      architecturalGuidelines:
        request.architecturalGuidelines ??
        project?.architecturalGuidelines ??
        undefined,
    });

    // Map architect output to the existing GeneratedTask format
    const generatedTasks: GeneratedTask[] = architectResult.tasks.map((t) => ({
      title: t.title,
      description: t.description,
      priority: t.priority,
      storyPoints: t.storyPoints,
      tags: t.tags,
    }));

    const result: TaskGenerationResponse = {
      tasks: generatedTasks,
      reasoning: architectResult.reasoning,
    };

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
    const message =
      error instanceof Error ? error.message : 'Failed to generate tasks';
    return { success: false, error: message };
  }
}

/**
 * Accept generated tasks and create them in the project.
 * Sets ai_generated flag and stores AI metadata.
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
        storyPoints: t.storyPoints,
        tags: t.tags,
        aiGenerated: true,
        aiMetadata: {
          source: 'architect-agent',
          generatedAt: new Date().toISOString(),
        },
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
): Promise<
  ApiResponse<
    Array<{
      id: string;
      requirement: string;
      taskCount: number;
      createdAt: Date;
    }>
  >
> {
  try {
    await getAuthUser();
    const history = await dbGetGenerationHistory(projectId);

    return {
      success: true,
      data: history.map((g) => ({
        id: g.id,
        requirement: g.requirement,
        taskCount: Array.isArray(g.generatedTasks)
          ? g.generatedTasks.length
          : 0,
        createdAt: g.createdAt,
      })),
    };
  } catch (error) {
    console.error('Failed to fetch generation history:', error);
    return { success: false, error: 'Failed to fetch generation history' };
  }
}
