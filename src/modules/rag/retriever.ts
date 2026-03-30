import { getQdrantClient, ensureCollection, COLLECTION_NAME } from './qdrant';
import { generateEmbedding } from '@/core/ai/embedding';

export type RetrievalFilter = {
  projectId: string;
  status?: string[];
  priority?: string[];
};

export type RetrievedTask = {
  taskId: string;
  title: string;
  description: string;
  status: string;
  priority: string;
  tags: string[];
  score: number;
};

export async function retrieveRelevantTasks(
  query: string,
  filter: RetrievalFilter,
  topK = 8
): Promise<RetrievedTask[]> {
  await ensureCollection();
  const client = getQdrantClient();
  const queryVector = await generateEmbedding(query);

  const mustConditions: Array<Record<string, unknown>> = [
    { key: 'project_id', match: { value: filter.projectId } },
  ];

  if (filter.status?.length) {
    mustConditions.push({
      key: 'status',
      match: { any: filter.status },
    });
  }

  if (filter.priority?.length) {
    mustConditions.push({
      key: 'priority',
      match: { any: filter.priority },
    });
  }

  const results = await client.search(COLLECTION_NAME, {
    vector: queryVector,
    limit: topK,
    filter: { must: mustConditions },
    with_payload: true,
    score_threshold: 0.3,
  });

  return results.map((r) => ({
    taskId: r.payload?.task_id as string,
    title: r.payload?.title as string,
    description: r.payload?.description as string,
    status: r.payload?.status as string,
    priority: r.payload?.priority as string,
    tags: (r.payload?.tags as string[]) ?? [],
    score: r.score,
  }));
}
