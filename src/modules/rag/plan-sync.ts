import { getQdrantClient, ensureRoadmapCollection, ROADMAP_COLLECTION_NAME } from './qdrant';
import { generateEmbedding } from '@/core/ai/embedding';
import type { ImplementationPlan, PlanSection } from '@/core/db/schema';

/**
 * Build embedding text for a plan section.
 */
function buildSectionEmbeddingText(section: PlanSection): string {
  const parts = [`[Phase: ${section.phase}] [${section.sectionType}]`];
  if (section.content) parts.push(section.content);
  if (section.items.length > 0) parts.push(section.items.join('\n'));
  return parts.join('\n');
}

/**
 * Upsert all section vectors for an implementation plan.
 */
export async function upsertPlanVectors(plan: ImplementationPlan): Promise<void> {
  await ensureRoadmapCollection();
  const client = getQdrantClient();
  const sections = (plan.sections as PlanSection[]) ?? [];

  if (sections.length === 0) return;

  const points = await Promise.all(
    sections.map(async (section) => {
      const text = buildSectionEmbeddingText(section);
      const vector = await generateEmbedding(text);

      return {
        id: section.id,
        vector,
        payload: {
          project_id: plan.projectId,
          plan_id: plan.id,
          phase: section.phase,
          phase_number: section.phaseNumber,
          section_type: section.sectionType,
          section_content: section.content,
          section_items: section.items,
          version: plan.version,
          text,
        },
      };
    })
  );

  // Upsert in batches of 10
  for (let i = 0; i < points.length; i += 10) {
    const batch = points.slice(i, i + 10);
    await client.upsert(ROADMAP_COLLECTION_NAME, { points: batch });
  }
}

/**
 * Re-vectorize a single section after inline edit.
 */
export async function upsertSingleSectionVector(
  plan: ImplementationPlan,
  sectionId: string
): Promise<void> {
  await ensureRoadmapCollection();
  const client = getQdrantClient();
  const sections = (plan.sections as PlanSection[]) ?? [];
  const section = sections.find((s) => s.id === sectionId);

  if (!section) return;

  const text = buildSectionEmbeddingText(section);
  const vector = await generateEmbedding(text);

  await client.upsert(ROADMAP_COLLECTION_NAME, {
    points: [
      {
        id: section.id,
        vector,
        payload: {
          project_id: plan.projectId,
          plan_id: plan.id,
          phase: section.phase,
          phase_number: section.phaseNumber,
          section_type: section.sectionType,
          section_content: section.content,
          section_items: section.items,
          version: plan.version,
          text,
        },
      },
    ],
  });
}

/**
 * Delete all plan vectors for a project.
 */
export async function deleteAllPlanVectors(projectId: string): Promise<void> {
  const client = getQdrantClient();
  try {
    await client.delete(ROADMAP_COLLECTION_NAME, {
      filter: {
        must: [{ key: 'project_id', match: { value: projectId } }],
      },
    });
  } catch {
    // Collection may not exist yet
  }
}
