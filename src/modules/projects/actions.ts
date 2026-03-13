'use server';

import type { Project } from '@/core/db/schema';
import type { ApiResponse } from '@/types';
import { generateMockProjects, simulateDelay } from '@/lib/mock-data';

export async function getProjects(): Promise<ApiResponse<Project[]>> {
  await simulateDelay(100, 300);

  try {
    const projects = generateMockProjects(5);
    return { success: true, data: projects };
  } catch (error) {
    return { success: false, error: 'Failed to fetch projects' };
  }
}

export async function getProject(projectId: string): Promise<ApiResponse<Project>> {
  await simulateDelay(50, 150);

  try {
    const projects = generateMockProjects(1);
    return { success: true, data: { ...projects[0], id: projectId } };
  } catch (error) {
    return { success: false, error: 'Failed to fetch project' };
  }
}
