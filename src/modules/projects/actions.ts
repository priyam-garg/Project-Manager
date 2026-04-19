'use server';

import { revalidatePath } from 'next/cache';
import type { Project } from '@/core/db/schema';
import type { ApiResponse } from '@/types';
import { getAuthUser, requireRole } from '@/core/auth';
import {
  getUserProjects,
  getProjectById,
  createProject as dbCreateProject,
  updateProject as dbUpdateProject,
  deleteProject as dbDeleteProject,
} from '@/core/db/queries';

export async function getProjects(): Promise<ApiResponse<Project[]>> {
  try {
    const user = await getAuthUser();
    const projects = await getUserProjects(user.id);
    return { success: true, data: projects };
  } catch (error) {
    console.error('Failed to fetch projects:', error);
    return { success: false, error: 'Failed to fetch projects' };
  }
}

export async function getProject(projectId: string): Promise<ApiResponse<Project>> {
  try {
    const user = await getAuthUser();
    await requireRole(user.id, projectId, 'member');
    const project = await getProjectById(projectId);
    if (!project) {
      return { success: false, error: 'Project not found' };
    }
    return { success: true, data: project };
  } catch (error) {
    console.error('Failed to fetch project:', error);
    return { success: false, error: 'Failed to fetch project' };
  }
}

export async function createProject(data: {
  name: string;
  description?: string;
}): Promise<ApiResponse<Project>> {
  try {
    const user = await getAuthUser();
    const project = await dbCreateProject(data, user.id);
    revalidatePath('/dashboard');
    return { success: true, data: project };
  } catch (error) {
    console.error('Failed to create project:', error);
    return { success: false, error: 'Failed to create project' };
  }
}

export async function updateProjectAction(
  projectId: string,
  data: { name?: string; description?: string }
): Promise<ApiResponse<Project>> {
  try {
    const user = await getAuthUser();
    await requireRole(user.id, projectId, 'admin');
    const project = await dbUpdateProject(projectId, data);
    if (!project) {
      return { success: false, error: 'Project not found' };
    }
    revalidatePath('/dashboard');
    return { success: true, data: project };
  } catch (error) {
    console.error('Failed to update project:', error);
    return { success: false, error: 'Failed to update project' };
  }
}

export async function deleteProjectAction(projectId: string): Promise<ApiResponse<void>> {
  try {
    const user = await getAuthUser();
    await requireRole(user.id, projectId, 'owner');
    await dbDeleteProject(projectId);
    revalidatePath('/dashboard');
    return { success: true };
  } catch (error) {
    console.error('Failed to delete project:', error);
    return { success: false, error: 'Failed to delete project' };
  }
}
