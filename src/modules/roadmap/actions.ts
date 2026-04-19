'use server';

import type { ApiResponse, ImplementationPlan, PlanSection } from '@/types';
import { getAuthUser } from '@/core/auth';
import {
  getActivePlan as dbGetActivePlan,
  getPlanHistory as dbGetPlanHistory,
  createPlan as dbCreatePlan,
  updatePlan as dbUpdatePlan,
  updatePlanSection as dbUpdatePlanSection,
  getPlanById,
  getActivePlanContent as dbGetActivePlanContent,
} from '@/core/db/queries';
import { getProjectById } from '@/core/db/queries';
import { generateImplementationPlan, regeneratePhase, refinePlanWithPrompt } from './plan-generator';
import { parsePlanToSections } from './plan-parser';
import { upsertPlanVectors, deleteAllPlanVectors, upsertSingleSectionVector } from '@/modules/rag/plan-sync';

// ─── Read Actions ────────────────────────────────────────────────────────────

export async function getImplementationPlan(
  projectId: string
): Promise<ApiResponse<ImplementationPlan>> {
  try {
    await getAuthUser();
    const plan = await dbGetActivePlan(projectId);
    if (!plan) {
      return { success: false, error: 'No implementation plan found' };
    }
    return { success: true, data: plan };
  } catch (error) {
    console.error('Failed to fetch implementation plan:', error);
    return { success: false, error: 'Failed to fetch implementation plan' };
  }
}

export async function getPlanVersionHistory(
  projectId: string
): Promise<ApiResponse<ImplementationPlan[]>> {
  try {
    await getAuthUser();
    const history = await dbGetPlanHistory(projectId);
    return { success: true, data: history };
  } catch (error) {
    console.error('Failed to fetch plan history:', error);
    return { success: false, error: 'Failed to fetch plan history' };
  }
}

// ─── AI Generation ───────────────────────────────────────────────────────────

export async function generatePlanWithAI(
  projectId: string,
  details: {
    name: string;
    description?: string;
    techStack?: string[];
    guidelines?: string;
    userPrompt?: string;
  }
): Promise<ApiResponse<ImplementationPlan>> {
  try {
    const user = await getAuthUser();

    const result = await generateImplementationPlan({
      projectName: details.name,
      description: details.description,
      techStack: details.techStack,
      guidelines: details.guidelines,
      userPrompt: details.userPrompt,
    });

    const plan = await dbCreatePlan({
      projectId,
      content: result.content,
      sections: result.sections,
      source: 'ai_generated',
      userId: user.id,
    });

    // Background: vectorize plan sections
    try {
      await upsertPlanVectors(plan);
    } catch (err) {
      console.warn('Failed to vectorize plan (non-blocking):', err);
    }

    return { success: true, data: plan };
  } catch (error) {
    console.error('Failed to generate plan:', error);
    const message = error instanceof Error ? error.message : 'Failed to generate plan';
    return { success: false, error: message };
  }
}

export async function refinePlanWithAI(
  projectId: string,
  userPrompt: string
): Promise<ApiResponse<ImplementationPlan>> {
  try {
    const user = await getAuthUser();
    const project = await getProjectById(projectId);
    const currentPlan = await dbGetActivePlan(projectId);

    if (!currentPlan) {
      return { success: false, error: 'No active plan to refine' };
    }

    const result = await refinePlanWithPrompt({
      projectName: project?.name || 'Unknown',
      existingPlan: currentPlan.content,
      userPrompt,
      description: project?.description ?? undefined,
    });

    const plan = await dbCreatePlan({
      projectId,
      content: result.content,
      sections: result.sections,
      source: 'ai_refined',
      userId: user.id,
    });

    // Background: vectorize plan sections
    try {
      await deleteAllPlanVectors(projectId);
      await upsertPlanVectors(plan);
    } catch (err) {
      console.warn('Failed to vectorize refined plan (non-blocking):', err);
    }

    return { success: true, data: plan };
  } catch (error) {
    console.error('Failed to refine plan:', error);
    const message = error instanceof Error ? error.message : 'Failed to refine plan';
    return { success: false, error: message };
  }
}

// ─── Upload / Manual ─────────────────────────────────────────────────────────

export async function uploadPlan(
  projectId: string,
  content: string
): Promise<ApiResponse<ImplementationPlan>> {
  try {
    const user = await getAuthUser();
    const sections = parsePlanToSections(content);

    const plan = await dbCreatePlan({
      projectId,
      content,
      sections,
      source: 'uploaded',
      userId: user.id,
    });

    // Background: vectorize
    try {
      await upsertPlanVectors(plan);
    } catch (err) {
      console.warn('Failed to vectorize plan (non-blocking):', err);
    }

    return { success: true, data: plan };
  } catch (error) {
    console.error('Failed to upload plan:', error);
    return { success: false, error: 'Failed to upload plan' };
  }
}

// ─── Updates ─────────────────────────────────────────────────────────────────

export async function updateImplementationPlan(
  projectId: string,
  content: string
): Promise<ApiResponse<ImplementationPlan>> {
  try {
    const user = await getAuthUser();
    const sections = parsePlanToSections(content);

    const plan = await dbUpdatePlan({
      projectId,
      content,
      sections,
      userId: user.id,
    });

    // Re-vectorize all
    try {
      await deleteAllPlanVectors(projectId);
      await upsertPlanVectors(plan);
    } catch (err) {
      console.warn('Failed to re-vectorize plan (non-blocking):', err);
    }

    return { success: true, data: plan };
  } catch (error) {
    console.error('Failed to update plan:', error);
    return { success: false, error: 'Failed to update plan' };
  }
}

export async function updatePlanSectionAction(
  planId: string,
  sectionId: string,
  newContent: string,
  newItems: string[]
): Promise<ApiResponse<ImplementationPlan>> {
  try {
    await getAuthUser();
    const plan = await dbUpdatePlanSection(planId, sectionId, newContent, newItems);
    if (!plan) {
      return { success: false, error: 'Plan not found' };
    }

    // Re-vectorize just this section
    try {
      await upsertSingleSectionVector(plan, sectionId);
    } catch (err) {
      console.warn('Failed to re-vectorize section (non-blocking):', err);
    }

    return { success: true, data: plan };
  } catch (error) {
    console.error('Failed to update plan section:', error);
    return { success: false, error: 'Failed to update plan section' };
  }
}

// ─── Phase Regeneration ──────────────────────────────────────────────────────

export async function regeneratePhaseWithAI(
  projectId: string,
  phaseNumber: number,
  userPrompt?: string
): Promise<ApiResponse<ImplementationPlan>> {
  try {
    const user = await getAuthUser();
    const project = await getProjectById(projectId);
    const currentPlan = await dbGetActivePlan(projectId);

    if (!currentPlan) {
      return { success: false, error: 'No active plan to regenerate from' };
    }

    const result = await regeneratePhase({
      projectName: project?.name || 'Unknown',
      existingPlan: currentPlan.content,
      phaseNumber,
      description: project?.description ?? undefined,
      userPrompt,
    });

    const plan = await dbCreatePlan({
      projectId,
      content: result.content,
      sections: result.sections,
      source: 'ai_generated',
      userId: user.id,
    });

    // Re-vectorize all
    try {
      await deleteAllPlanVectors(projectId);
      await upsertPlanVectors(plan);
    } catch (err) {
      console.warn('Failed to re-vectorize plan (non-blocking):', err);
    }

    return { success: true, data: plan };
  } catch (error) {
    console.error('Failed to regenerate phase:', error);
    const message = error instanceof Error ? error.message : 'Failed to regenerate phase';
    return { success: false, error: message };
  }
}
