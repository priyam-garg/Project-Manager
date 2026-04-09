import { getQdrantClient, ensureRoadmapCollection, ROADMAP_COLLECTION_NAME } from './qdrant';
import { generateEmbedding } from '@/core/ai/embedding';

export type RetrievedPlanSection = {
  phase: string;
  phaseNumber: number;
  sectionType: string;
  content: string;
  items: string[];
  score: number;
};

/**
 * Retrieve plan sections relevant to a query.
 * Only returns matching sections, NOT the entire roadmap.
 */
export async function retrieveRelevantPlanSections(
  query: string,
  projectId: string,
  topK = 5
): Promise<RetrievedPlanSection[]> {
  await ensureRoadmapCollection();
  const client = getQdrantClient();
  const queryVector = await generateEmbedding(query);

  const results = await client.search(ROADMAP_COLLECTION_NAME, {
    vector: queryVector,
    limit: topK,
    filter: {
      must: [{ key: 'project_id', match: { value: projectId } }],
    },
    with_payload: true,
    score_threshold: 0.3,
  });

  return results.map((r) => ({
    phase: r.payload?.phase as string,
    phaseNumber: r.payload?.phase_number as number,
    sectionType: r.payload?.section_type as string,
    content: r.payload?.section_content as string,
    items: (r.payload?.section_items as string[]) ?? [],
    score: r.score,
  }));
}
