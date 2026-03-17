import { eq, desc } from 'drizzle-orm';
import { db } from '../client';
import { agentGenerations } from '../schema';
import type { AgentGeneration } from '../schema';

function generateId(): string {
  return crypto.randomUUID();
}

/**
 * Save an agent generation record.
 */
export async function saveGeneration(data: {
  projectId: string;
  userId: string;
  requirement: string;
  generatedTasks: unknown;
  reasoning: string;
}): Promise<AgentGeneration> {
  const [generation] = await db
    .insert(agentGenerations)
    .values({
      id: generateId(),
      projectId: data.projectId,
      userId: data.userId,
      requirement: data.requirement,
      generatedTasks: data.generatedTasks,
      reasoning: data.reasoning,
      acceptedCount: 0,
    })
    .returning();

  return generation;
}

/**
 * Get generation history for a project, most recent first.
 */
export async function getGenerationHistory(projectId: string): Promise<AgentGeneration[]> {
  return db
    .select()
    .from(agentGenerations)
    .where(eq(agentGenerations.projectId, projectId))
    .orderBy(desc(agentGenerations.createdAt));
}

/**
 * Update the accepted count for a generation.
 */
export async function updateGenerationAcceptedCount(
  generationId: string,
  count: number
): Promise<void> {
  await db
    .update(agentGenerations)
    .set({ acceptedCount: count })
    .where(eq(agentGenerations.id, generationId));
}
