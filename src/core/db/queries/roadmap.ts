import { eq, and, desc, lt } from 'drizzle-orm';
import { db } from '../client';
import { implementationPlans } from '../schema';
import type { ImplementationPlan, PlanSection } from '../schema';

const MAX_VERSIONS = 10;

function generateId(): string {
  return crypto.randomUUID();
}

/**
 * Get the active implementation plan for a project.
 */
export async function getActivePlan(projectId: string): Promise<ImplementationPlan | null> {
  const result = await db
    .select()
    .from(implementationPlans)
    .where(
      and(
        eq(implementationPlans.projectId, projectId),
        eq(implementationPlans.isActive, true)
      )
    )
    .limit(1);

  return result[0] ?? null;
}

/**
 * Get the active plan content only (lightweight, for context injection).
 */
export async function getActivePlanContent(projectId: string): Promise<string | null> {
  const result = await db
    .select({ content: implementationPlans.content })
    .from(implementationPlans)
    .where(
      and(
        eq(implementationPlans.projectId, projectId),
        eq(implementationPlans.isActive, true)
      )
    )
    .limit(1);

  return result[0]?.content ?? null;
}

/**
 * Get plan version history for a project (all versions, newest first).
 */
export async function getPlanHistory(projectId: string): Promise<ImplementationPlan[]> {
  return db
    .select()
    .from(implementationPlans)
    .where(eq(implementationPlans.projectId, projectId))
    .orderBy(desc(implementationPlans.version));
}

/**
 * Get the current max version number for a project's plans.
 */
async function getMaxVersion(projectId: string): Promise<number> {
  const result = await db
    .select({ version: implementationPlans.version })
    .from(implementationPlans)
    .where(eq(implementationPlans.projectId, projectId))
    .orderBy(desc(implementationPlans.version))
    .limit(1);

  return result[0]?.version ?? 0;
}

/**
 * Prune old versions beyond the cap (keep the most recent MAX_VERSIONS).
 */
async function pruneOldVersions(projectId: string): Promise<void> {
  const allVersions = await db
    .select({ id: implementationPlans.id, version: implementationPlans.version })
    .from(implementationPlans)
    .where(eq(implementationPlans.projectId, projectId))
    .orderBy(desc(implementationPlans.version));

  if (allVersions.length > MAX_VERSIONS) {
    const toDelete = allVersions.slice(MAX_VERSIONS);
    for (const old of toDelete) {
      await db.delete(implementationPlans).where(eq(implementationPlans.id, old.id));
    }
  }
}

/**
 * Create a new implementation plan, deactivating the previous active one.
 */
export async function createPlan(data: {
  projectId: string;
  content: string;
  sections: PlanSection[];
  source: string;
  userId: string;
}): Promise<ImplementationPlan> {
  // Deactivate current active plan
  await db
    .update(implementationPlans)
    .set({ isActive: false, updatedAt: new Date() })
    .where(
      and(
        eq(implementationPlans.projectId, data.projectId),
        eq(implementationPlans.isActive, true)
      )
    );

  const nextVersion = (await getMaxVersion(data.projectId)) + 1;
  const now = new Date();

  const [plan] = await db
    .insert(implementationPlans)
    .values({
      id: generateId(),
      projectId: data.projectId,
      version: nextVersion,
      content: data.content,
      sections: data.sections,
      source: data.source,
      isActive: true,
      createdBy: data.userId,
      createdAt: now,
      updatedAt: now,
    })
    .returning();

  // Prune old versions (keep last 10)
  await pruneOldVersions(data.projectId);

  return plan;
}

/**
 * Update a plan's content and sections (creates a new version).
 */
export async function updatePlan(data: {
  projectId: string;
  content: string;
  sections: PlanSection[];
  userId: string;
}): Promise<ImplementationPlan> {
  // Create a new version (deactivates old one internally)
  return createPlan({
    projectId: data.projectId,
    content: data.content,
    sections: data.sections,
    source: 'manual',
    userId: data.userId,
  });
}

/**
 * Update a single section within the active plan (in-place update, no new version).
 */
export async function updatePlanSection(
  planId: string,
  sectionId: string,
  newContent: string,
  newItems: string[]
): Promise<ImplementationPlan | null> {
  const plan = await db
    .select()
    .from(implementationPlans)
    .where(eq(implementationPlans.id, planId))
    .limit(1);

  if (!plan[0]) return null;

  const sections = (plan[0].sections as PlanSection[]) ?? [];
  const updatedSections = sections.map((s) =>
    s.id === sectionId ? { ...s, content: newContent, items: newItems } : s
  );

  // Rebuild full content from sections
  const { sectionsToMarkdown } = await import('@/modules/roadmap/plan-parser');
  const updatedContent = sectionsToMarkdown(updatedSections);

  const [updated] = await db
    .update(implementationPlans)
    .set({
      sections: updatedSections,
      content: updatedContent,
      updatedAt: new Date(),
    })
    .where(eq(implementationPlans.id, planId))
    .returning();

  return updated ?? null;
}

/**
 * Get a single plan by ID.
 */
export async function getPlanById(planId: string): Promise<ImplementationPlan | null> {
  const result = await db
    .select()
    .from(implementationPlans)
    .where(eq(implementationPlans.id, planId))
    .limit(1);

  return result[0] ?? null;
}
